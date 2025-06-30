import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { exportMonthlyAttendanceToXLSX } from './exportToXLSX';

/* ---------- Types ---------- */
interface UserData {
  uid: string;
  name: string;
  studentId: string;
  timestamp: Date;
}

// ใช้แค่ตรงนี้พอ (month ไม่จำเป็นในไฟล์นี้)
interface ClassData {
  name: string;
  checkedInCount?: number;
}

interface AttendanceRecord {
  [studentId: string]: {
    name: string;
    attendance: {
      [date: string]: { present: boolean; late: boolean };
    };
  };
}

/* ---------- Main handler ---------- */
export const handleExportXLSX = async (
  classId: string,
  currentUser: { uid: string } | null
): Promise<void> => {
  try {
    /* 1. ตรวจสิทธิ์ */
    if (!currentUser) {
      alert('คุณยังไม่ได้ล็อกอิน');
      return;
    }

    /* 2. ดึงข้อมูลคลาส */
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

    /* 3. เตรียมข้อมูลคลาสและผู้เข้าเรียน */
    const classData: ClassData = {
      name: classDataFromDB.name || 'ไม่ทราบชื่อคลาส',
      checkedInCount: classDataFromDB.checkedInCount || 0
    };

    const checkedInRecord = classDataFromDB.checkedInRecord || {};
    const checkedInUsers: UserData[] = Object.values(checkedInRecord)
      .filter(
        (r: any) =>
          r && r.timestamp && typeof r.timestamp.toDate === 'function'
      )
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

    /* 4. เรียงตามเวลา (สำคัญสำหรับหาคนแรกต่อวัน) */
    checkedInUsers.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    /* 5. สร้าง AttendanceRecord + dateList + ตรวจสาย */
    const attendanceData: AttendanceRecord = {};
    const dateSet = new Set<string>();
    const earliestByDate: Record<string, Date> = {}; // เก็บคนแรกของแต่ละวัน
    const allDates: Date[] = [];

    // --- Pass 1: หาเวลาคนแรกของแต่ละวัน ---
    checkedInUsers.forEach(({ timestamp }) => {
      const dd = timestamp.getDate().toString().padStart(2, '0');
      const mm = (timestamp.getMonth() + 1).toString().padStart(2, '0');
      const dateStr = `${dd}/${mm}`; // <-- fixed back‑ticks
      dateSet.add(dateStr);
      allDates.push(timestamp);

      if (
        !earliestByDate[dateStr] ||
        timestamp.getTime() < earliestByDate[dateStr].getTime()
      ) {
        earliestByDate[dateStr] = timestamp;
      }
    });

    // --- Pass 2: เติม attendanceData พร้อม flag late ---
    checkedInUsers.forEach(({ studentId, name, timestamp }) => {
      const dd = timestamp.getDate().toString().padStart(2, '0');
      const mm = (timestamp.getMonth() + 1).toString().padStart(2, '0');
      const dateStr = `${dd}/${mm}`; // <-- fixed back‑ticks
      const firstTimeThisDate = earliestByDate[dateStr];
      const lateCutoff = new Date(firstTimeThisDate.getTime() + 15 * 60 * 1000);
      const isLate = timestamp.getTime() > lateCutoff.getTime();

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
    });

    const dateList = Array.from(dateSet).sort((a, b) => {
      const [d1, m1] = a.split('/').map(Number);
      const [d2, m2] = b.split('/').map(Number);
      return m1 === m2 ? d1 - d2 : m1 - m2;
    });

    /* 6. หาชื่อเดือน / ปี (อ้างอิงวันที่น้อยที่สุด) */
    const earliestDate = allDates
      .slice()
      .sort((a, b) => a.getTime() - b.getTime())[0];
    const monthsTH = [
      'มกราคม',
      'กุมภาพันธ์',
      'มีนาคม',
      'เมษายน',
      'พฤษภาคม',
      'มิถุนายน',
      'กรกฎาคม',
      'สิงหาคม',
      'กันยายน',
      'ตุลาคม',
      'พฤศจิกายน',
      'ธันวาคม'
    ];
    const monthLabel = `${monthsTH[earliestDate.getMonth()]} ${
      earliestDate.getFullYear() + 543
    }`;

    /* 7. Export เป็น .xlsx */
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
