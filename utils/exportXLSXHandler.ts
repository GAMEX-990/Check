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
  isLate?: boolean;
}

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

    // ✅ (1) ดึงรายชื่อนักเรียนทั้งหมดจาก subcollection
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

    // ✅ (2) ดึงข้อมูลการเช็คชื่อทั้งหมด
    const classData: ClassData = {
      name: classDataFromDB.name || 'ไม่ทราบชื่อคลาส',
      checkedInCount: classDataFromDB.checkedInCount || 0
    };

    const dailyCheckedInRecord = classDataFromDB.dailyCheckedInRecord || {};
    const allCheckedInUsers: ExtendedUserData[] = [];

    Object.keys(dailyCheckedInRecord).forEach(dateKey => {
      const dayRecord = dailyCheckedInRecord[dateKey];
      Object.values(dayRecord).forEach((record: any) => {
        if (record && record.timestamp && typeof record.timestamp.toDate === 'function') {
          const recordStatus = record.status as 'present' | 'late' | 'absent' | undefined;
          const recordIsLate = Boolean(record.isLate);

          allCheckedInUsers.push({
            uid: record.uid ?? '',
            name: record.name ?? 'ไม่ทราบชื่อ',
            studentId: record.studentId ?? 'ไม่ทราบรหัส',
            timestamp: record.timestamp.toDate() as Date,
            status: recordStatus ?? 'present',
            isLate: recordIsLate
          });
        }
      });
    });

    if (Object.keys(allStudentsMap).length === 0) {
      toast.error('ไม่มีรายชื่อนักเรียนในคลาสนี้');
      return;
    }

    // (3) ประมวลผลข้อมูลการเข้าเรียน
    const attendanceData: AttendanceRecord = {};
    const dateSet = new Set<string>();
    const attendanceByDate: Record<string, Record<string, {
      present: boolean;
      late: boolean;
      status: string;
    }>> = {};

    allCheckedInUsers.forEach(({ studentId, name, timestamp, status, isLate }) => {
      const localDate = new Date(timestamp.getTime() + (timestamp.getTimezoneOffset() * 60000));
      const dd = localDate.getDate().toString().padStart(2, '0');
      const mm = (localDate.getMonth() + 1).toString().padStart(2, '0');
      const dateStr = `${dd}/${mm}`;

      dateSet.add(dateStr);

      if (!attendanceByDate[dateStr]) {
        attendanceByDate[dateStr] = {};
      }

      if (!attendanceData[studentId]) {
        attendanceData[studentId] = {
          name,
          attendance: {}
        };
      }

      const currentStatus = status ?? 'present';
      const currentIsLate = isLate ?? false;
      const isPresent = currentStatus !== 'absent';
      const isLateStatus = currentStatus === 'late' || currentIsLate;

      attendanceData[studentId].attendance[dateStr] = {
        present: isPresent,
        late: isLateStatus
      };

      attendanceByDate[dateStr][studentId] = {
        present: isPresent,
        late: isLateStatus,
        status: currentStatus
      };
    });

    // ✅ (4) เพิ่มข้อมูล "ขาด" ให้กับคนที่ไม่มีการเข้าเรียนในบางวัน
    const allStudentIds = new Set<string>(Object.keys(allStudentsMap));

    dateSet.forEach(date => {
      allStudentIds.forEach(studentId => {
        if (!attendanceByDate[date] || !attendanceByDate[date][studentId]) {
          const student = allCheckedInUsers.find(u => u.studentId === studentId);

          if (!attendanceData[studentId]) {
            attendanceData[studentId] = {
              name: student?.name || allStudentsMap[studentId]?.name || 'ไม่ทราบชื่อ',
              attendance: {}
            };
          }

          attendanceData[studentId].attendance[date] = {
            present: false,
            late: false
          };
        }
      });
    });

    const dateList = Array.from(dateSet).sort((a, b) => {
      const [d1, m1] = a.split('/').map(Number);
      const [d2, m2] = b.split('/').map(Number);
      return m1 === m2 ? d1 - d2 : m1 - m2;
    });

    const earliestDate = allCheckedInUsers
      .map(u => u.timestamp)
      .sort((a, b) => a.getTime() - b.getTime())[0] ?? new Date();

    const monthsTH = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const monthLabel = `${monthsTH[earliestDate.getMonth()]} ${earliestDate.getFullYear() + 543}`;

    exportMonthlyAttendanceToXLSX(
      { name: classData.name, month: monthLabel },
      attendanceData,
      dateList
    );

    toast.success('Export ข้อมูลสำเร็จ');
  } catch (err) {
    console.error('Export error:', err);
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
      }
    });
  });

  return summary;
};
