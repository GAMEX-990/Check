import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { exportMonthlyAttendanceToXLSX } from './exportToXLSX';

interface UserData {
  uid: string;
  name: string;
  studentId: string;
  timestamp: Date;
}

interface ClassData {
  name: string;
  checkedInCount?: number;
}

interface AttendanceRecord {
  [studentId: string]: {
    name: string;
    attendance: { [date: string]: boolean };
  };
}

export const handleExportXLSX = async (
  classId: string,
  currentUser: { uid: string } | null
): Promise<void> => {
  try {
    if (!currentUser) {
      alert('คุณยังไม่ได้ล็อกอิน');
      return;
    }

    const classRef = doc(db, 'classes', classId);
    const classSnap = await getDoc(classRef);

    if (!classSnap.exists()) {
      alert('ไม่พบข้อมูลคลาสในระบบ');
      return;
    }

    const classDataFromDB = classSnap.data();

    if (classDataFromDB.created_by !== currentUser.uid) {
      alert('คุณไม่มีสิทธิ์ในการ Export ข้อมูลของคลาสนี้');
      return;
    }

    const classData: ClassData = {
      name: classDataFromDB.name || 'ไม่ทราบชื่อคลาส',
      checkedInCount: classDataFromDB.checkedInCount || 0
    };

    const checkedInRecord = classDataFromDB.checkedInRecord || {};
    const checkedInUsers: UserData[] = Object.values(checkedInRecord)
      .filter((r: any) => r && r.timestamp && typeof r.timestamp.toDate === 'function')
      .map((r: any) => ({
        uid: r.uid ?? '',
        name: r.name ?? 'ไม่ทราบชื่อ',
        studentId: r.studentId ?? 'ไม่ทราบรหัส',
        timestamp: r.timestamp.toDate() as Date
      }));

    if (checkedInUsers.length === 0) {
      alert('ไม่มีข้อมูลผู้เข้าเรียนสำหรับ Export');
      return;
    }

    // ✅ แปลง checkedInUsers → AttendanceRecord + dateList
    const attendanceData: AttendanceRecord = {};
    const dateSet = new Set<string>();

    checkedInUsers.forEach(({ studentId, name, timestamp }) => {
      const dd = timestamp.getDate().toString().padStart(2, '0');
      const mm = (timestamp.getMonth() + 1).toString().padStart(2, '0');
      const dateStr = `${dd}/${mm}`;
      dateSet.add(dateStr);

      if (!attendanceData[studentId]) {
        attendanceData[studentId] = { name, attendance: {} };
      }
      attendanceData[studentId].attendance[dateStr] = true;
    });

    const dateList = Array.from(dateSet).sort((a, b) => {
      const [d1, m1] = a.split('/').map(Number);
      const [d2, m2] = b.split('/').map(Number);
      return m1 === m2 ? d1 - d2 : m1 - m2;
    });

    // 🗓 ชื่อเดือน + พ.ศ.
    const monthsTH = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    const firstDate = checkedInUsers[0].timestamp;
    const monthLabel = `${monthsTH[firstDate.getMonth()]} ${firstDate.getFullYear() + 543}`;

    // ✅ เรียกฟังก์ชันสร้าง .xlsx
    exportMonthlyAttendanceToXLSX(
      { name: classData.name, month: monthLabel },
      attendanceData,
      dateList
    );

  } catch (err) {
    console.error('Export XLSX Error:', err);
    alert('เกิดข้อผิดพลาดในการ Export Excel');
  }
};