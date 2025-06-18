import * as XLSX from "xlsx";
import { addDoc, collection, Timestamp, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ตรวจสอบประเภทไฟล์ที่รองรับ
const validateFileType = (file: File): boolean => {
  const supportedTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
  ];
  
  const supportedExtensions = ['.xlsx', '.xls', '.csv'];
  const fileName = file.name.toLowerCase();
  const hasValidExtension = supportedExtensions.some(ext => fileName.endsWith(ext));
  
  return supportedTypes.includes(file.type) || hasValidExtension;
};

// ฟังก์ชันสำหรับแสดงข้อมูลไฟล์
const getFileInfo = (file: File) => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  return {
    name: file.name,
    size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    type: file.type || 'unknown',
    extension: fileExtension,
    isSupported: validateFileType(file)
  };
};

// วิธีที่ 1: ใช้ Subcollection (แนะนำมากที่สุด) - รองรับ .xlsx, .xls, .csv
export const uploadStudentsToSubcollection = async (
  file: File,
  classId: string
) => {
  try {
    const fileInfo = getFileInfo(file);
    console.log("Starting file upload process...", { 
      fileName: file.name, 
      classId,
      fileInfo 
    });
    
    // ตรวจสอบประเภทไฟล์
    if (!fileInfo.isSupported) {
      return {
        success: false,
        error: `ไฟล์ประเภท .${fileInfo.extension} ไม่รองรับ กรุณาใช้ไฟล์ .xlsx, .xls หรือ .csv`,
        message: "ประเภทไฟล์ไม่รองรับ"
      };
    }

    // อ่านไฟล์ Excel/CSV
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { 
      type: "buffer",
      cellDates: true, // แปลงวันที่อัตโนมัติ
      cellNF: false,   // ไม่รวมการจัดรูปแบบ
      cellText: false  // ใช้ค่าจริงแทนข้อความ
    });
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // แปลงเป็น JSON พร้อมตัวเลือกเพิ่มเติม
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // ใช้แถวแรกเป็น header
      defval: "", // ค่าเริ่มต้นสำหรับเซลล์ว่าง
      blankrows: false // ข้ามแถวว่าง
    });

    // แปลงข้อมูลให้อยู่ในรูปแบบ object
    if (jsonData.length === 0) {
      return {
        success: false,
        error: "ไฟล์ว่างเปล่าหรือไม่มีข้อมูล",
        message: "ไม่พบข้อมูลในไฟล์"
      };
    }

    const headers = jsonData[0] as string[];
    const rows = jsonData.slice(1);
    
    const formattedData = rows.map(row => {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || "";
      });
      return obj;
    });

    console.log("Parsed data:", formattedData);
    console.log("Headers found:", headers);
    
    // เก็บใน subcollection: classes/{classId}/students
    const classRef = doc(db, "classes", classId);
    const studentsCollectionRef = collection(classRef, "students");
    const uploadedStudents = [];
    const errors = [];

    for (const [index, row] of formattedData.entries()) {
      try {
        // รองรับหลายรูปแบบของ header
        const studentId = row["รหัสนักศึกษา"] || 
                         row["studentId"] || 
                         row["StudentID"] || 
                         row["ID"] ||
                         row["รหัส"] ||
                         row["Student ID"];
                         
        const prefix = row["คำนำหน้า"] || 
                      row["prefix"] || 
                      row["Prefix"] || 
                      row["คำนำหน้าชื่อ"] || "";
                      
        const firstName = row["ชื่อ"] || 
                         row["firstName"] || 
                         row["FirstName"] || 
                         row["Name"] ||
                         row["ชื่อจริง"];
                         
        const lastName = row["นามสกุล"] || 
                        row["lastName"] || 
                        row["LastName"] || 
                        row["Surname"] ||
                        row["นามสกุล"];
                        
        const status = row["สถานะ"] || 
                      row["status"] || 
                      row["Status"] || 
                      "active";

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!studentId || !firstName || !lastName) {
          errors.push(`แถวที่ ${index + 2}: ข้อมูลไม่ครบถ้วน - รหัสนักศึกษา: "${studentId}", ชื่อ: "${firstName}", นามสกุล: "${lastName}"`);
          continue;
        }

        const studentData = {
          studentId: String(studentId).trim(),
          name: `${prefix} ${firstName} ${lastName}`.trim().replace(/\s+/g, ' '), // ลบช่องว่างเกิน
          prefix: prefix.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          status: status || "active",
          createdAt: Timestamp.now(),
          uploadedFrom: fileInfo.name,
          // ไม่ต้องเก็บ classId เพราะอยู่ใน subcollection แล้ว
        };

        // เก็บใน subcollection ของคลาสนั้น ๆ
        await addDoc(studentsCollectionRef, studentData);
        uploadedStudents.push(studentData);
        
        console.log("Uploaded student to subcollection:", studentData);
      } catch (rowError) {
        console.error("Error processing row:", row, rowError);
        errors.push(`แถวที่ ${index + 2}: ${rowError instanceof Error ? rowError.message : 'ข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`);
      }
    }

    console.log(`Upload completed. Success: ${uploadedStudents.length}, Errors: ${errors.length}`);

    return { 
      success: true, 
      message: `อัปโหลดสำเร็จ ${uploadedStudents.length} คน จากไฟล์ ${fileInfo.name}`,
      count: uploadedStudents.length,
      errors: errors,
      fileInfo: fileInfo,
      totalRows: formattedData.length
    };
  } catch (err) {
    console.error("Error uploading students:", err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Unknown error",
      message: "เกิดข้อผิดพลาดในการอัปโหลดไฟล์"
    };
  }
};

// วิธีที่ 2: สร้าง Collection แยกสำหรับแต่ละคลาส - รองรับ .xlsx, .xls, .csv
export const uploadStudentsToSeparateCollection = async (
  file: File,
  classId: string,
  className?: string
) => {
  try {
    const fileInfo = getFileInfo(file);
    console.log("Starting file upload process...", { 
      fileName: file.name, 
      classId,
      fileInfo 
    });
    
    // ตรวจสอบประเภทไฟล์
    if (!fileInfo.isSupported) {
      return {
        success: false,
        error: `ไฟล์ประเภท .${fileInfo.extension} ไม่รองรับ กรุณาใช้ไฟล์ .xlsx, .xls หรือ .csv`,
        message: "ประเภทไฟล์ไม่รองรับ"
      };
    }
    
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { 
      type: "buffer",
      cellDates: true,
      cellNF: false,
      cellText: false 
    });
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      blankrows: false
    });

    if (jsonData.length === 0) {
      return {
        success: false,
        error: "ไฟล์ว่างเปล่าหรือไม่มีข้อมูล",
        message: "ไม่พบข้อมูลในไฟล์"
      };
    }

    const headers = jsonData[0] as string[];
    const rows = jsonData.slice(1);
    
    const formattedData = rows.map(row => {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || "";
      });
      return obj;
    });

    // สร้าง collection แยกสำหรับแต่ละคลาส
    const collectionName = `students_${classId}`;
    const studentsCollectionRef = collection(db, collectionName);

    const uploadedStudents = [];
    const errors = [];

    for (const [index, row] of formattedData.entries()) {
      try {
        const studentId = row["รหัสนักศึกษา"] || 
                         row["studentId"] || 
                         row["StudentID"] || 
                         row["ID"] ||
                         row["รหัส"] ||
                         row["Student ID"];
                         
        const prefix = row["คำนำหน้า"] || 
                      row["prefix"] || 
                      row["Prefix"] || 
                      row["คำนำหน้าชื่อ"] || "";
                      
        const firstName = row["ชื่อ"] || 
                         row["firstName"] || 
                         row["FirstName"] || 
                         row["Name"] ||
                         row["ชื่อจริง"];
                         
        const lastName = row["นามสกุล"] || 
                        row["lastName"] || 
                        row["LastName"] || 
                        row["Surname"];
                        
        const status = row["สถานะ"] || 
                      row["status"] || 
                      row["Status"] || 
                      "active";

        if (!studentId || !firstName || !lastName) {
          errors.push(`แถวที่ ${index + 2}: ข้อมูลไม่ครบถ้วน - รหัสนักศึกษา: "${studentId}", ชื่อ: "${firstName}", นามสกุล: "${lastName}"`);
          continue;
        }

        const studentData = {
          studentId: String(studentId).trim(),
          name: `${prefix} ${firstName} ${lastName}`.trim().replace(/\s+/g, ' '),
          prefix: prefix.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          status: status || "active",
          classId, // เก็บไว้เพื่อความชัดเจน
          className: className || "",
          createdAt: Timestamp.now(),
          uploadedFrom: fileInfo.name,
        };

        await addDoc(studentsCollectionRef, studentData);
        uploadedStudents.push(studentData);
        
        console.log("Uploaded student to separate collection:", studentData);
      } catch (rowError) {
        console.error("Error processing row:", row, rowError);
        errors.push(`แถวที่ ${index + 2}: ${rowError instanceof Error ? rowError.message : 'ข้อผิดพลาดที่ไม่ทราบสาเหตุ'}`);
      }
    }

    return { 
      success: true, 
      message: `อัปโหลดสำเร็จ ${uploadedStudents.length} คน ใน collection: ${collectionName} จากไฟล์ ${fileInfo.name}`,
      count: uploadedStudents.length,
      collectionName: collectionName,
      errors: errors,
      fileInfo: fileInfo,
      totalRows: formattedData.length
    };
  } catch (err) {
    console.error("Error uploading students:", err);
    return { 
      success: false, 
      error: err instanceof Error ? err.message : "Unknown error",
      message: "เกิดข้อผิดพลาดในการอัปโหลดไฟล์"
    };
  }
};

// ฟังก์ชันตัวอย่างการใช้งาน
export const handleFileUpload = async (
  event: React.ChangeEvent<HTMLInputElement>,
  classId: string,
  method: 'subcollection' | 'separate' = 'subcollection'
) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const fileInfo = getFileInfo(file);
  console.log("Selected file info:", fileInfo);

  if (!fileInfo.isSupported) {
    alert(`ไฟล์ประเภท .${fileInfo.extension} ไม่รองรับ\nกรุณาเลือกไฟล์ .xlsx, .xls หรือ .csv`);
    return;
  }

  try {
    let result;
    if (method === 'subcollection') {
      result = await uploadStudentsToSubcollection(file, classId);
    } else {
      result = await uploadStudentsToSeparateCollection(file, classId);
    }

    if (result.success) {
      console.log("Upload successful:", result);
      alert(result.message);
    } else {
      console.error("Upload failed:", result);
      alert(`การอัปโหลดล้มเหลว: ${result.message}`);
    }

    if (result.errors && result.errors.length > 0) {
      console.warn("Upload errors:", result.errors);
    }
  } catch (error) {
    console.error("File upload error:", error);
    alert("เกิดข้อผิดพลาดในการอัปโหลดไฟล์");
  }
};

// ใช้วิธีที่ 1 เป็น default export
export const uploadStudentsFromFile = uploadStudentsToSubcollection;
export default uploadStudentsToSubcollection;