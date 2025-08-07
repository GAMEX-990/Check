import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { exportMonthlyAttendanceToXLSX } from './exportToXLSX';
import { AttendanceRecord, ClassData } from '@/types/handleExportXLSX';
import { toast } from 'sonner';

interface ExtendedUserData {
  uid: string;
  name: string;
  studentId: string;
  timestamp: Date;
  status?: string;
  isLate?: boolean | string;
  sessionStartTime?: Date; // เพิ่มข้อมูลเวลาเริ่ม session
}

// ✅ สร้าง function เฉพาะสำหรับ Export โดยใช้ logic เดียวกับ getFingerprint.ts
const calculateAttendanceStatus = (
  checkInTime: Date,
  sessionStartTime: Date
): {
  present: boolean;
  late: boolean;
  status: 'present' | 'late' | 'absent';
} => {
  const timeDiffMs = checkInTime.getTime() - sessionStartTime.getTime();
  
  // ใช้ constants เดียวกับ getFingerprint.ts
  const LATE_THRESHOLD_MS = 15 * 60 * 1000; // 15 นาที
  const ABSENT_THRESHOLD_MS = 3 * 60 * 60 * 1000; // 3 ชั่วโมง
  
  console.log(`📊 Calculating status:`, {
    checkInTime: checkInTime.toLocaleTimeString(),
    sessionStartTime: sessionStartTime.toLocaleTimeString(),
    timeDiffMs,
    timeDiffMinutes: Math.round(timeDiffMs / (1000 * 60)),
    lateThreshold: LATE_THRESHOLD_MS,
    absentThreshold: ABSENT_THRESHOLD_MS
  });

  if (timeDiffMs > ABSENT_THRESHOLD_MS) {
    // เกิน 3 ชั่วโมง = ขาด
    return {
      present: false,
      late: false,
      status: 'absent'
    };
  } else if (timeDiffMs > LATE_THRESHOLD_MS) {
    // เกิน 15 นาที แต่ไม่เกิน 3 ชั่วโมง = สาย
    return {
      present: true,
      late: true,
      status: 'late'
    };
  } else {
    // ภายใน 15 นาที = มาตรงเวลา
    return {
      present: true,
      late: false,
      status: 'present'
    };
  }
};

// ✅ Function สำหรับหา session start time ของแต่ละวัน
const getSessionStartTimeForDate = (
  dailyCheckedInRecord: any,
  dateKey: string
): Date | null => {
  const dayRecord = dailyCheckedInRecord[dateKey];
  if (!dayRecord) return null;

  // หาเวลา check-in แรกของวันนั้น = session start time
  let earliestTime: Date | null = null;
  
  Object.values(dayRecord).forEach((record: any) => {
    if (record && record.timestamp && typeof record.timestamp.toDate === 'function') {
      const checkInTime = record.timestamp.toDate();
      if (!earliestTime || checkInTime < earliestTime) {
        earliestTime = checkInTime;
      }
    }
  });
  
  return earliestTime;
};

// ✅ Function ใหม่ที่จัดการข้อมูล Firebase ให้ถูกต้อง
const processFirebaseAttendanceData = (
  studentId: string,
  name: string,
  checkInTime: Date,
  sessionStartTime: Date,
  originalStatus?: string,
  originalIsLate?: boolean | string
): {
  present: boolean;
  late: boolean;
  status: 'present' | 'late' | 'absent';
} => {
  
  console.log(`🔍 Processing ${studentId}:`, {
    name,
    checkInTime: checkInTime.toLocaleTimeString(),
    sessionStartTime: sessionStartTime.toLocaleTimeString(),
    originalStatus,
    originalIsLate,
    originalIsLateType: typeof originalIsLate
  });

  // ✅ ถ้ามีข้อมูล originalStatus ที่ชัดเจนแล้ว ใช้เลย
  if (originalStatus === 'late' || originalIsLate === true || originalIsLate === '!' || originalIsLate === 'true') {
    console.log(`✅ Using original status: LATE`);
    return {
      present: true,
      late: true,
      status: 'late'
    };
  }
  
  if (originalStatus === 'absent') {
    console.log(`✅ Using original status: ABSENT`);
    return {
      present: false,
      late: false,
      status: 'absent'
    };
  }
  
  if (originalStatus === 'present' || originalIsLate === false || originalIsLate === '✓' || originalIsLate === 'false') {
    console.log(`✅ Using original status: PRESENT`);
    return {
      present: true,
      late: false,
      status: 'present'
    };
  }

  // ✅ ถ้าไม่มีข้อมูลชัดเจน ใช้การคำนวณจากเวลา
  console.log(`🧮 Calculating from time difference...`);
  return calculateAttendanceStatus(checkInTime, sessionStartTime);
};

export const handleExportXLSX = async (
  classId: string,
  currentUser: { uid: string } | null
): Promise<void> => {
  try {
    if (!currentUser) {
      toast.error('คุณยังไม่ได้ล็อกอิน');
      return;
    }

    console.log(`🚀 Starting export for class: ${classId}`);

    const classRef = doc(db, 'classes', classId);
    const classSnap = await getDoc(classRef);

    if (!classSnap.exists()) {
      toast.error('ไม่พบข้อมูลคลาสในระบบ');
      return;
    }

    const classDataFromDB = classSnap.data();

    if (classDataFromDB.created_by !== currentUser.uid) {
      toast.error('คุณไม่มีสิทธิ์ในการ Export ข้อมูลของคลาสนี้');
      return;
    }

    // ✅ ดึงรายชื่อนักเรียน
    const studentsRef = collection(classRef, 'students');
    const studentsSnap = await getDocs(studentsRef);
    const allStudentsMap: Record<string, { studentId: string; name: string }> = {};

    studentsSnap.forEach(docSnap => {
      const data = docSnap.data();
      if (data.studentId && data.name) {
        allStudentsMap[data.studentId] = {
          studentId: data.studentId,
          name: data.name
        };
      }
    });

    console.log(`👥 Found ${Object.keys(allStudentsMap).length} students:`, Object.keys(allStudentsMap));

    const classData: ClassData = {
      name: classDataFromDB.name || 'ไม่ทราบชื่อคลาส',
      checkedInCount: classDataFromDB.checkedInCount || 0
    };

    const dailyCheckedInRecord = classDataFromDB.dailyCheckedInRecord || {};
    console.log(`📅 Daily records available:`, Object.keys(dailyCheckedInRecord));

    // ✅ ประมวลผลข้อมูลการเข้าเรียน
    const attendanceData: AttendanceRecord = {};
    const dateSet = new Set<string>();

    // เริ่มต้นข้อมูลสำหรับนักเรียนทุกคน
    Object.keys(allStudentsMap).forEach(studentId => {
      attendanceData[studentId] = {
        name: allStudentsMap[studentId].name,
        attendance: {}
      };
    });

    // ✅ ประมวลผลแต่ละวัน
    Object.keys(dailyCheckedInRecord).forEach(dateKey => {
      console.log(`\n📆 Processing date: ${dateKey}`);
      
      // หา session start time สำหรับวันนี้
      const sessionStartTime = getSessionStartTimeForDate(dailyCheckedInRecord, dateKey);
      if (!sessionStartTime) {
        console.warn(`⚠️ No session start time found for ${dateKey}`);
        return;
      }

      console.log(`🕐 Session started at: ${sessionStartTime.toLocaleTimeString()}`);

      const dayRecord = dailyCheckedInRecord[dateKey];
      const dd = sessionStartTime.getDate().toString().padStart(2, '0');
      const mm = (sessionStartTime.getMonth() + 1).toString().padStart(2, '0');
      const dateStr = `${dd}/${mm}`;
      
      dateSet.add(dateStr);

      // ประมวลผลการ check-in ของวันนี้
      Object.values(dayRecord).forEach((record: any) => {
        if (!record || !record.timestamp || typeof record.timestamp.toDate !== 'function') {
          return;
        }

        const studentId = record.studentId;
        if (!studentId || !allStudentsMap[studentId]) {
          console.warn(`⚠️ Unknown student: ${studentId}`);
          return;
        }

        const checkInTime = record.timestamp.toDate();
        
        // ✅ ประมวลผลสถานะโดยใช้ logic ที่ปรับปรุงแล้ว
        const processedStatus = processFirebaseAttendanceData(
          studentId,
          allStudentsMap[studentId].name,
          checkInTime,
          sessionStartTime,
          record.status,
          record.isLate
        );

        console.log(`✅ Final result for ${studentId} on ${dateStr}:`, {
          processedStatus,
          willShowInExcel: processedStatus.present ? (processedStatus.late ? '!' : '✓') : 'X'
        });

        // บันทึกผลลัพธ์
        attendanceData[studentId].attendance[dateStr] = {
          present: processedStatus.present,
          late: processedStatus.late
        };
      });
    });

    // ✅ เพิ่มข้อมูล "ขาด" สำหรับคนที่ไม่ได้ check-in
    const allStudentIds = Object.keys(allStudentsMap);
    dateSet.forEach(date => {
      allStudentIds.forEach(studentId => {
        if (!attendanceData[studentId].attendance[date]) {
          console.log(`❌ ${studentId} was absent on ${date}`);
          attendanceData[studentId].attendance[date] = {
            present: false,
            late: false
          };
        }
      });
    });

    if (dateSet.size === 0) {
      toast.error('ไม่มีข้อมูลการเข้าเรียนในคลาสนี้');
      return;
    }

    // ✅ เรียงลำดับวันที่
    const dateList = Array.from(dateSet).sort((a, b) => {
      const [d1, m1] = a.split('/').map(Number);
      const [d2, m2] = b.split('/').map(Number);
      return m1 === m2 ? d1 - d2 : m1 - m2;
    });

    // ✅ Final debug summary
    console.log('\n🎯 === FINAL ATTENDANCE SUMMARY ===');
    Object.entries(attendanceData).forEach(([studentId, student]) => {
      const dailySummary = dateList.map(date => {
        const record = student.attendance[date];
        const symbol = record.present ? (record.late ? '!' : '✓') : 'X';
        return `${date}:${symbol}`;
      }).join(' | ');
      
      console.log(`${studentId} (${student.name}): ${dailySummary}`);
    });
    console.log('=== END SUMMARY ===\n');

    // ✅ สร้าง month label
    const allDates = Array.from(dateSet).map(dateStr => {
      const [dd, mm] = dateStr.split('/').map(Number);
      return new Date(new Date().getFullYear(), mm - 1, dd);
    }).sort((a, b) => a.getTime() - b.getTime());

    const earliestDate = allDates[0] || new Date();
    const monthsTH = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const monthLabel = `${monthsTH[earliestDate.getMonth()]} ${earliestDate.getFullYear() + 543}`;

    // ✅ Export
    exportMonthlyAttendanceToXLSX(
      { name: classData.name, month: monthLabel },
      attendanceData,
      dateList
    );

    toast.success(`Export สำเร็จ! (${Object.keys(allStudentsMap).length} คน, ${dateList.length} วัน)`);
    
  } catch (err) {
    console.error('💥 Export error:', err);
    toast.error('เกิดข้อผิดพลาดในการ Export Excel');
  }
};

export const getAttendanceSummary = (
  attendanceData: AttendanceRecord,
  dateList: string[]
) => {
  const summary = {
    totalStudents: Object.keys(attendanceData).length,
    totalDays: dateList.length,
    presentCount: 0,
    lateCount: 0,
    absentCount: 0
  };

  Object.values(attendanceData).forEach(student => {
    dateList.forEach(date => {
      const record = student.attendance[date];
      if (record) {
        if (record.present) {
          if (record.late) {
            summary.lateCount++;
          } else {
            summary.presentCount++;
          }
        } else {
          summary.absentCount++;
        }
      } else {
        summary.absentCount++;
      }
    });
  });

  return summary;
};