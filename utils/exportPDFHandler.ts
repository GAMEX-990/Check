// utils/exportPDFHandler.ts
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // ปรับ path ตามโปรเจกต์ของคุณ
import {
  exportAttendanceToPDF,
  validateDataForExport,
  confirmExport
} from './exportToPDF'; // หรือ path ที่ใช้จริง

// Interface (กรณีจำเป็น)
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

export const handleExportPDF = async (classId: string): Promise<void> => {
  try {
    const classRef = doc(db, 'classes', classId);
    const classSnap = await getDoc(classRef);

    if (!classSnap.exists()) {
      alert('ไม่พบข้อมูลคลาสในระบบ');
      return;
    }

    const classDataFromDB = classSnap.data();

    const classData: ClassData = {
      name: classDataFromDB.name || 'ไม่ทราบชื่อคลาส',
      checkedInCount: classDataFromDB.checkedInCount || 0
    };

    const checkedInRecord = classDataFromDB.checkedInRecord || {};
    const checkedInUsers: UserData[] = Object.values(checkedInRecord).map((record: any) => ({
      uid: record.uid,
      name: record.name,
      studentId: record.studentId,
      timestamp: record.timestamp.toDate()
    }));

    if (!validateDataForExport(checkedInUsers)) return;

    const confirmed = await confirmExport(classData, checkedInUsers);
    if (!confirmed) return;

    await exportAttendanceToPDF(classData, checkedInUsers);

  } catch (error) {
    console.error('Export PDF Error:', error);
    alert('เกิดข้อผิดพลาดในการ Export PDF');
  }
};
