'use client';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { AttendanceRecord, ClassData } from '@/types/exportMonthlyAttendanceToXLSX';

/* ---------- Exporter ---------- */
export const exportMonthlyAttendanceToXLSX = (
  classData: ClassData,
  attendanceData: AttendanceRecord,
  dateList: string[]
): void => {
  /* 1. เตรียมแถวหัวตาราง */
  const headerRow = [
    'No.',
    'Student ID',
    'Full Name',
    ...dateList,
    'Total',
    'Attend',
    'Absent',
    'Late'
  ];
  const sheetData: (string | number)[][] = [headerRow];

  /* 2. สร้างข้อมูลแต่ละแถว */
  let index = 1;
  for (const [studentId, { name, attendance }] of Object.entries(attendanceData)) {
    let attended = 0;
    let lateCount = 0;

    const row: (string | number)[] = [index++, studentId, name];

    dateList.forEach(date => {
      const data = attendance[date];
      if (data?.present) {
        attended++;
        if (data.late) lateCount++;
        row.push(data.late ? '✔ (สาย)' : '✔');
      } else {
        row.push('✘');
      }
    });

    const absent = dateList.length - attended;
    row.push(`${attended}/${dateList.length}`, attended, absent, lateCount); // <-- fixed back‑ticks
    sheetData.push(row);
  }

  /* 3. แปลงเป็น worksheet / workbook */
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

  /* ตั้งความกว้างคอลัมน์คร่าว ๆ */
  worksheet['!cols'] = headerRow.map(() => ({ wch: 12 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

  /* 4. บันทึกไฟล์ */
  const safeName = classData.name.replace(/[^a-zA-Z0-9ก-๙]/g, '_');
  const fileName = `รายงานการเข้าเรียน_${safeName}_${new Date().toISOString().split('T')[0]}.xlsx`;

  const wbArray = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbArray], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8'
  });
  saveAs(blob, fileName);
};