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
    /* 1. ตรวจสิทธิ์ */
    if (!currentUser) {
      toast.error('คุณยังไม่ได้ล็อกอิน');
      return;
    }

    /* 2. ดึงข้อมูลคลาส */
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

    /* 3. เตรียมข้อมูลคลาส */
    const classData: ClassData = {
      name: classDataFromDB.name || 'ไม่ทราบชื่อคลาส',
      checkedInCount: classDataFromDB.checkedInCount || 0
    };

    // อ่านจากโครงสร้างใหม่: dailyCheckedInRecord
    const dailyCheckedInRecord = classDataFromDB.dailyCheckedInRecord || {};
    console.log('Daily checked in record:', dailyCheckedInRecord);

    /* 4. รวบรวมข้อมูลจากทุกวัน */
    const allCheckedInUsers: UserData[] = [];
    
    // วนลูปทุกวันที่มีข้อมูล
    Object.keys(dailyCheckedInRecord).forEach(dateKey => {
      const dayRecord = dailyCheckedInRecord[dateKey];
      
      // วนลูปทุกคนในวันนั้น
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

    console.log('All checked in users:', allCheckedInUsers.length);

    if (allCheckedInUsers.length === 0) {
      toast.error('ไม่มีข้อมูลผู้เข้าเรียนสำหรับ Export');
      return;
    }

    /* 5. เรียงตามเวลา (สำคัญสำหรับหาคนแรกต่อวัน) */
    allCheckedInUsers.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    /* 6. สร้าง AttendanceRecord + dateList + ตรวจสาย */
    const attendanceData: AttendanceRecord = {};
    const dateSet = new Set<string>();
    const earliestByDate: Record<string, Date> = {}; // เก็บคนแรกของแต่ละวัน
    const allDates: Date[] = [];

    // --- Pass 1: หาเวลาคนแรกของแต่ละวัน ---
    allCheckedInUsers.forEach(({ timestamp }) => {
      // ใช้ local timezone
      const localDate = new Date(timestamp.getTime() + (timestamp.getTimezoneOffset() * 60000));
      const dd = localDate.getDate().toString().padStart(2, '0');
      const mm = (localDate.getMonth() + 1).toString().padStart(2, '0');
      const dateStr = `${dd}/${mm}`;
      
      console.log('Processing date:', dateStr, 'from timestamp:', timestamp);
      
      dateSet.add(dateStr);
      allDates.push(localDate);

      if (
        !earliestByDate[dateStr] ||
        localDate.getTime() < earliestByDate[dateStr].getTime()
      ) {
        earliestByDate[dateStr] = localDate;
      }
    });

    // --- Pass 2: เติม attendanceData พร้อม flag late ---
    allCheckedInUsers.forEach(({ studentId, name, timestamp }) => {
      // ใช้ local timezone
      const localDate = new Date(timestamp.getTime() + (timestamp.getTimezoneOffset() * 60000));

      const dd = localDate.getDate().toString().padStart(2, '0');
      const mm = (localDate.getMonth() + 1).toString().padStart(2, '0');
      const dateStr = `${dd}/${mm}`;

      const firstTimeThisDate = earliestByDate[dateStr];
      const lateCutoff = new Date(firstTimeThisDate.getTime() + 15 * 60 * 1000);
      const isLate = localDate.getTime() > lateCutoff.getTime();

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

    console.log('Date list:', dateList);

    /* 7. หาชื่อเดือน / ปี (อ้างอิงวันที่น้อยที่สุด) */
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
    const monthLabel = `${monthsTH[earliestDate.getMonth()]} ${earliestDate.getFullYear() + 543}`;

    /* 8. Export เป็น .xlsx */
    exportMonthlyAttendanceToXLSX(
      { name: classData.name, month: monthLabel },
      attendanceData,
      dateList
    );
  } catch (err) {
    console.error('Export XLSX Error:', err);
    toast.error('เกิดข้อผิดพลาดในการ Export Excel');
  }
};