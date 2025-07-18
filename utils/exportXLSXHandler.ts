import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { exportMonthlyAttendanceToXLSX } from './exportToXLSX';
import { AttendanceRecord, ClassData, UserData } from '@/types/handleExportXLSX';
import { toast } from 'sonner';

/* ---------- Main handler ---------- */
export const handleExportXLSX = async (
  classId: string,
  currentUser: { uid: string } | null
): Promise<void> => {
  try {
    // (1) ตรวจสิทธิ์
    if (!currentUser) {
      toast.error('คุณยังไม่ได้ล็อกอิน');
      return;
    }

    // (2) ดึงข้อมูลคลาส
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

    // (3) เตรียมข้อมูลคลาส
    const classData: ClassData = {
      name: classDataFromDB.name || 'ไม่ทราบชื่อคลาส',
      checkedInCount: classDataFromDB.checkedInCount || 0
    };

    const dailyCheckedInRecord = classDataFromDB.dailyCheckedInRecord || {};

    // (4) รวบรวมข้อมูลจากทุกวัน
    const allCheckedInUsers: UserData[] = [];
    Object.keys(dailyCheckedInRecord).forEach(dateKey => {
      const dayRecord = dailyCheckedInRecord[dateKey];
      Object.values(dayRecord).forEach((record: any) => {
        if (record && record.timestamp && typeof record.timestamp.toDate === 'function') {
          allCheckedInUsers.push({
            uid: record.uid ?? '',
            name: record.name ?? 'ไม่ทราบชื่อ',
            studentId: record.studentId ?? 'ไม่ทราบรหัส',
            timestamp: record.timestamp.toDate() as Date
          });
        }
      });
    });

    if (allCheckedInUsers.length === 0) {
      toast.error('ไม่มีข้อมูลผู้เข้าเรียนสำหรับ Export');
      return;
    }

    // (5) เรียงตามเวลา
    allCheckedInUsers.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    // (6) ประมวลผลข้อมูล
    const attendanceData: AttendanceRecord = {};
    const dateSet = new Set<string>();
    const earliestByDate: Record<string, Date> = {};
    const allDates: Date[] = [];

    // Pass 1: หาคนแรกของแต่ละวัน
    allCheckedInUsers.forEach(({ timestamp }) => {
      const localDate = new Date(timestamp.getTime() + (timestamp.getTimezoneOffset() * 60000));
      const dd = localDate.getDate().toString().padStart(2, '0');
      const mm = (localDate.getMonth() + 1).toString().padStart(2, '0');
      const dateStr = `${dd}/${mm}`;

      dateSet.add(dateStr);
      allDates.push(localDate);

      if (
        !earliestByDate[dateStr] ||
        localDate.getTime() < earliestByDate[dateStr].getTime()
      ) {
        earliestByDate[dateStr] = localDate;
      }
    });

    // สร้าง map สำหรับบันทึกว่าใครมาในวันไหน
    const presentMap: Record<string, Set<string>> = {};
    Object.keys(earliestByDate).forEach(date => {
      presentMap[date] = new Set();
    });

    // Pass 2: บันทึกผู้มาเช็คชื่อในแต่ละวัน
    allCheckedInUsers.forEach(({ studentId, name, timestamp }) => {
      const localDate = new Date(timestamp.getTime() + (timestamp.getTimezoneOffset() * 60000));
      const dd = localDate.getDate().toString().padStart(2, '0');
      const mm = (localDate.getMonth() + 1).toString().padStart(2, '0');
      const dateStr = `${dd}/${mm}`;

      const firstTimeThisDate = earliestByDate[dateStr];
      const lateCutoff = new Date(firstTimeThisDate.getTime() + 15 * 60 * 1000);
      const absentCutoff = new Date(firstTimeThisDate.getTime() + 3 * 60 * 60 * 1000); // 3 ชั่วโมง

      const isLate = localDate.getTime() > lateCutoff.getTime();
      const isAbsent = localDate.getTime() > absentCutoff.getTime();

      // ข้ามถ้ามาสายเกิน 3 ชม.
      if (isAbsent) return;

      if (!attendanceData[studentId]) {
        attendanceData[studentId] = {
          name,
          attendance: {}
        };
      }

      attendanceData[studentId].attendance[dateStr] = {
        present: true,
        late: isLate
      };

      presentMap[dateStr].add(studentId);
    });

    // Pass 3: เติม "ขาด" ให้คนที่ไม่ได้มาในวันนั้น
    const allStudentIds = new Set<string>(allCheckedInUsers.map(u => u.studentId));
    dateSet.forEach(date => {
      allStudentIds.forEach(studentId => {
        if (!presentMap[date].has(studentId)) {
          if (!attendanceData[studentId]) {
            const student = allCheckedInUsers.find(u => u.studentId === studentId);
            attendanceData[studentId] = {
              name: student?.name || 'ไม่ทราบชื่อ',
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

    const earliestDate = allDates
      .slice()
      .sort((a, b) => a.getTime() - b.getTime())[0];
    const monthsTH = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const monthLabel = `${monthsTH[earliestDate.getMonth()]} ${earliestDate.getFullYear() + 543}`;

    // (7) Export
    exportMonthlyAttendanceToXLSX(
      { name: classData.name, month: monthLabel },
      attendanceData,
      dateList
    );
  } catch (err) {
    toast.error('เกิดข้อผิดพลาดในการ Export Excel');
  }
};