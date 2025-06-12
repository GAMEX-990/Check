import { SARABUN_FONT } from '@/src/constants/fonts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // แก้ไขการนำเข้า

// Interface สำหรับข้อมูลผู้ใช้
interface UserData {
  uid: string;
  name: string;
  studentId: string;
  timestamp: Date;
}

// Interface สำหรับข้อมูลคลาส
interface ClassData {
  name: string;
  checkedInCount?: number;
}

/**
 * ฟังก์ชันสำหรับ Export ข้อมูลการเข้าเรียนเป็น PDF (รองรับภาษาไทย)
 * @param classData - ข้อมูลคลาสเรียน
 * @param checkedInUsers - รายชื่อผู้ที่เช็คชื่อเข้าเรียน
 */
export const exportAttendanceToPDF = async (
  classData: ClassData,
  checkedInUsers: UserData[]
): Promise<void> => {
  try {
    // สร้าง PDF document ใหม่
    const doc = new jsPDF();
    doc.addFileToVFS('Sarabun-Medium.ttf', SARABUN_FONT);
    doc.addFont('Sarabun-Medium.ttf', 'Sarabun', 'normal');
    doc.setFont('Sarabun', 'normal');
    // หัวเรื่อง
    doc.setFontSize(18);
    doc.text('รายงานการเข้าเรียน', 105, 20, { align: 'center' });
    
    // ข้อมูลคลาส
    doc.setFontSize(14);
    doc.text(`ชื่อคลาส: ${classData.name}`, 20, 35);
    doc.text(`จำนวนนักศึกษา: ${classData.checkedInCount || checkedInUsers.length} คน`, 20, 45);
    
    // วันที่สร้างรายงาน
    const currentDate = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    doc.text(`วันที่สร้างรายงาน: ${currentDate}`, 20, 55);
    
    // สร้างตารางด้วย autoTable (ง่ายกว่าและรองรับ Unicode ดีกว่า)
    const tableData = checkedInUsers.map((user, index) => [
      index + 1,
      user.name || 'ไม่มีชื่อ',
      user.studentId || 'ไม่มีรหัส',
      user.timestamp.toLocaleString('th-TH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    ]);

    autoTable(doc,{
      startY: 70,
      head: [['No.', 'Full Name', 'Student ID', 'Check-in Time']],
      body: tableData,
      headStyles: {
        font: 'helvetica',
        fillColor: [128, 0, 128],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      styles: {
        font: 'Sarabun',
        fontSize: 10
      },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 60 },
        2: { cellWidth: 40, halign: 'center' },
        3: { cellWidth: 50, halign: 'center' }
      }
    });

    // เพิ่มข้อมูลสรุปท้ายรายงาน
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(10);
    doc.text(`จำนวนรายการทั้งหมด: ${checkedInUsers.length}`, 20, finalY);
    doc.text(`สร้างโดย: ระบบบันทึกการเข้าเรียน Ckeck-In`, 20, finalY + 10);
    
    // สร้างชื่อไฟล์
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `รายงานการเข้าเรียน_${classData.name.replace(/[^a-zA-Z0-9ก-๙]/g, '_')}_${dateStr}.pdf`;
    
    // บันทึกไฟล์
    doc.save(fileName);
    
    console.log('Export PDF สำเร็จ:', fileName);
    
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการ Export PDF:', error);
    throw new Error(`ไม่สามารถ Export PDF ได้: ${error instanceof Error ? error.message : 'ข้อผิดพลาดไม่ทราบสาเหตุ'}`);
  }
};

/**
 * ฟังก์ชันสำหรับตรวจสอบว่าข้อมูลพร้อมสำหรับ Export หรือไม่
 */
export const validateDataForExport = (checkedInUsers: UserData[]): boolean => {
  if (!checkedInUsers || checkedInUsers.length === 0) {
    alert('ไม่มีข้อมูลการเข้าเรียนสำหรับ Export');
    return false;
  }
  return true;
};

/**
 * ฟังก์ชันสำหรับแสดงข้อความยืนยันก่อน Export
 */
export const confirmExport = async (
  classData: ClassData,
  checkedInUsers: UserData[]
): Promise<boolean> => {
  const message = `ต้องการ Export รายงานการเข้าเรียน?\n\nคลาส: ${classData.name}\nจำนวนผู้เข้าเรียน: ${checkedInUsers.length} คน`;
  return window.confirm(message);
};