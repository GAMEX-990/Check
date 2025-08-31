import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { exportMonthlyAttendanceToXLSX } from './exportToXLSX';
import { AttendanceRecord, ClassData } from '@/types/handleExportXLSX';
import { toast } from 'sonner';

// ✅ สร้าง function เฉพาะสำหรับ Export โดยใช้ logic เดียวกับ getFingerprint.ts
const calculateAttendanceStatus = (
  checkInTime: Date,
  sessionStartTime: Date,
  lateThresholdMinutes: number
): {
  present: boolean;
  late: boolean;
  status: 'present' | 'late' | 'absent';
} => {
  const timeDiffMs = checkInTime.getTime() - sessionStartTime.getTime();

  const LATE_THRESHOLD_MS = lateThresholdMinutes * 60 * 1000; // ใช้ค่าจากคลาส
  const ABSENT_THRESHOLD_MS = 3 * 60 * 60 * 1000; // 3 ชั่วโมง (คงเดิม)

  if (timeDiffMs > ABSENT_THRESHOLD_MS) {
    return { present: false, late: false, status: 'absent' };
  } else if (timeDiffMs > LATE_THRESHOLD_MS) {
    return { present: true, late: true, status: 'late' };
  } else {
    return { present: true, late: false, status: 'present' };
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
  lateThresholdMinutes: number,
  originalStatus?: string,
  originalIsLate?: boolean | string
): {
  present: boolean;
  late: boolean;
  status: 'present' | 'late' | 'absent';
} => {


  // ถ้ามีสถานะเดิมที่ชัดเจน ให้ใช้ก่อน
  if (originalStatus === 'late' || originalIsLate === true || originalIsLate === '!' || originalIsLate === 'true') {
    return { present: true, late: true, status: 'late' };
  }
  if (originalStatus === 'absent') {
    return { present: false, late: false, status: 'absent' };
  }
  if (originalStatus === 'present' || originalIsLate === false || originalIsLate === '✓' || originalIsLate === 'false') {
    return { present: true, late: false, status: 'present' };
  }

  // คำนวณตามเวลา โดยใช้ lateThresholdMinutes จากคลาส
  return calculateAttendanceStatus(checkInTime, sessionStartTime, lateThresholdMinutes);
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

    // ✅ อ่าน lateThresholdMinutes ต่อคลาส (fallback 15 นาที)
    const classLateThresholdMinutes: number = typeof classDataFromDB.lateThresholdMinutes === 'number'
      ? classDataFromDB.lateThresholdMinutes
      : 15;

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

    const classData: ClassData = {
      name: classDataFromDB.name || 'ไม่ทราบชื่อคลาส',
      checkedInCount: classDataFromDB.checkedInCount || 0
    };

    const dailyCheckedInRecord = classDataFromDB.dailyCheckedInRecord || {};

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

      // หา session start time สำหรับวันนี้
      const sessionStartTime = getSessionStartTimeForDate(dailyCheckedInRecord, dateKey);
      if (!sessionStartTime) {
        return;
      }
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
          return;
        }

        const checkInTime = record.timestamp.toDate();

        // ✅ ประมวลผลสถานะโดยใช้ logic ที่ปรับปรุงแล้ว + ใช้ค่า lateThresholdMinutes ของคลาส
        const processedStatus = processFirebaseAttendanceData(
          studentId,
          allStudentsMap[studentId].name,
          checkInTime,
          sessionStartTime,
          classLateThresholdMinutes,
          record.status,
          record.isLate
        );
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
    Object.entries(attendanceData).forEach(([, student]) => {
      const dailySummary = dateList.map(date => {
        const record = student.attendance[date];
        const symbol = record.present ? (record.late ? '!' : '✓') : 'X';
        return `${date}:${symbol}`;
      }).join(' | ');
    });

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