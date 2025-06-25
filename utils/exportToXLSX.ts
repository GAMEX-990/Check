import * as XLSX from 'xlsx';


interface AttendanceRecord {
  [studentId: string]: {
    name: string;
    attendance: { [date: string]: boolean }; // 'DD/MM': true/false
  };
}

interface ClassData {
  name: string;
  month: string;
}

/**
 * สร้าง Excel (.xlsx) รายงานการเข้าเรียนแบบสรุปรายเดือน
 */
export const exportMonthlyAttendanceToXLSX = (
  classData: ClassData,
  attendanceData: AttendanceRecord,
  dateList: string[]
) => {
  const sheetData: (string | number)[][] = [];

  // สร้างหัวตาราง
  const header = ['No.', 'Student ID', 'Full Name', ...dateList, 'Total', 'Attend', 'Absent'];
  sheetData.push(header);

  // สร้างข้อมูลแต่ละแถว
  let index = 1;
  for (const [studentId, { name, attendance }] of Object.entries(attendanceData)) {
    const row = [index++, studentId, name];

    let attended = 0;
    for (const date of dateList) {
      const present = attendance[date] ?? false;
      if (present) attended++;
      row.push(present ? '✔' : '✘');
    }

    row.push(`${attended}/${dateList.length}`, attended, dateList.length - attended);
    sheetData.push(row);
  }

  // สร้าง worksheet และ workbook
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');

  // Export .xlsx
  const safeName = classData.name.replace(/[^a-zA-Z0-9ก-๙]/g, '_');
  const fileName = `รายงานการเข้าเรียน_${safeName}_${new Date().toISOString().split('T')[0]}.xlsx`;

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, fileName);
};
function saveAs(blob: Blob, fileName: string) {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 0);
}
