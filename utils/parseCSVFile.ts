import * as XLSX from "xlsx";
import { addDoc, collection, Timestamp, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ฟังก์ชันสำหรับหาคีย์ที่ตรงกัน
const findMatchingKey = (obj: any, possibleKeys: string[]): string | null => {
  for (const key of possibleKeys) {
    if (obj.hasOwnProperty(key)) {
      return key;
    }
  }
  return null;
};

// ฟังก์ชันสำหรับทำความสะอาดและแปลงข้อมูล
const cleanValue = (value: any): string => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

// วิธีที่ 1: ใช้ Subcollection พร้อมรับทุกหัวข้อตาราง
export const uploadStudentsToSubcollection = async (
  file: File,
  classId: string
) => {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return {
        success: false,
        message: "ไฟล์ว่างเปล่าหรือไม่มีข้อมูล"
      };
    }

    // เก็บใน subcollection: classes/{classId}/students
    const classRef = doc(db, "classes", classId);
    const studentsCollectionRef = collection(classRef, "students");

    const uploadedStudents = [];
    const errors = [];

    // รายการหัวข้อที่เป็นไปได้สำหรับแต่ละฟิลด์
    const fieldMappings = {
      studentId: [
        "รหัสนักศึกษา", "รหัสนักเรียน", "studentId", "StudentID", "student_id", 
        "ID", "id", "รหัส", "เลขประจำตัว", "เลขที่", "ลำดับที่", "No.", "no",
        "เลขประจำตัวนักศึกษา", "Student ID"
      ],
      prefix: [
        "คำนำหน้า", "คำนำหน้าชื่อ", "prefix", "Prefix", "title", "Title",
        "Mr", "Ms", "Mrs", "นาย", "นาง", "นางสาว"
      ],
      firstName: [
        "ชื่อ", "ชื่อจริง", "firstName", "FirstName", "first_name", "Name", "name",
        "given_name", "givenName", "ชื่อต้น"
      ],
      lastName: [
        "นามสกุล", "ชื่อสกุล", "lastName", "LastName", "last_name", "Surname", "surname",
        "family_name", "familyName", "สกุล"
      ],
      fullName: [
        "ชื่อเต็ม", "ชื่อ-นามสกุล", "fullName", "FullName", "full_name", "completeName",
        "ชื่อ-สกุล", "ชื่อและนามสกุล"
      ],
      nickname: [
        "ชื่อเล่น", "nickname", "Nickname", "nick_name", "petName"
      ],
      email: [
        "อีเมล", "อีเมล์", "email", "Email", "e-mail", "E-mail", "emailAddress"
      ],
      phone: [
        "เบอร์โทร", "เบอร์โทรศัพท์", "phone", "Phone", "phoneNumber", "tel", "telephone",
        "mobile", "มือถือ", "โทรศัพท์"
      ],
      status: [
        "สถานะ", "สถานภาพ", "status", "Status", "state", "State", "condition"
      ],
      department: [
        "แผนก", "ภาควิชา", "คณะ", "department", "Department", "faculty", "Faculty",
        "division", "Division", "สาขา", "วิชาเอก"
      ],
      year: [
        "ปี", "ชั้นปี", "year", "Year", "level", "Level", "grade", "Grade"
      ],
      section: [
        "หมู่", "กลุ่ม", "ห้อง", "section", "Section", "group", "Group", "class", "Class",
        "ชั้น/ห้อง", "ชั้นห้อง"
      ]
    };

    for (const row of jsonData) {
      try {
        // สร้างออบเจ็กต์เก็บข้อมูลนักเรียน
        const studentData: any = {
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        // ค้นหาและกำหนดค่าสำหรับแต่ละฟิลด์
        let hasRequiredFields = true;
        let studentId = "";
        let fullName = "";

        // หา studentId
        const studentIdKey = findMatchingKey(row, fieldMappings.studentId);
        if (studentIdKey) {
          studentId = cleanValue(row[studentIdKey]);
          studentData.studentId = studentId;
        }

        // หาชื่อ-นามสกุล
        const fullNameKey = findMatchingKey(row, fieldMappings.fullName);
        if (fullNameKey) {
          fullName = cleanValue(row[fullNameKey]);
          studentData.name = fullName;
        } else {
          // หาแยกเป็น prefix, firstName, lastName
          const prefixKey = findMatchingKey(row, fieldMappings.prefix);
          const firstNameKey = findMatchingKey(row, fieldMappings.firstName);
          const lastNameKey = findMatchingKey(row, fieldMappings.lastName);

          const prefix = prefixKey ? cleanValue(row[prefixKey]) : "";
          const firstName = firstNameKey ? cleanValue(row[firstNameKey]) : "";
          const lastName = lastNameKey ? cleanValue(row[lastNameKey]) : "";

          if (firstName && lastName) {
            fullName = `${prefix} ${firstName} ${lastName}`.trim();
            studentData.name = fullName;
            
            // เก็บแยกไว้ด้วย
            if (prefix) studentData.prefix = prefix;
            if (firstName) studentData.firstName = firstName;
            if (lastName) studentData.lastName = lastName;
          }
        }

        // ตรวจสอบฟิลด์ที่จำเป็น
        if (!studentId || !fullName) {
          hasRequiredFields = false;
        }

        // หาฟิลด์อื่น ๆ ที่ไม่บังคับ
        const nicknameKey = findMatchingKey(row, fieldMappings.nickname);
        if (nicknameKey) {
          studentData.nickname = cleanValue(row[nicknameKey]);
        }

        const emailKey = findMatchingKey(row, fieldMappings.email);
        if (emailKey) {
          studentData.email = cleanValue(row[emailKey]);
        }

        const phoneKey = findMatchingKey(row, fieldMappings.phone);
        if (phoneKey) {
          studentData.phone = cleanValue(row[phoneKey]);
        }

        const statusKey = findMatchingKey(row, fieldMappings.status);
        if (statusKey) {
          studentData.status = cleanValue(row[statusKey]) || "active";
        } else {
          studentData.status = "active"; // ค่าเริ่มต้น
        }

        const departmentKey = findMatchingKey(row, fieldMappings.department);
        if (departmentKey) {
          studentData.department = cleanValue(row[departmentKey]);
        }

        const yearKey = findMatchingKey(row, fieldMappings.year);
        if (yearKey) {
          studentData.year = cleanValue(row[yearKey]);
        }

        const sectionKey = findMatchingKey(row, fieldMappings.section);
        if (sectionKey) {
          studentData.section = cleanValue(row[sectionKey]);
        }

        // เก็บข้อมูลเพิ่มเติมทั้งหมดที่ไม่ได้จับคู่
        const usedKeys = new Set();
        Object.values(fieldMappings).flat().forEach(key => {
          if (row.hasOwnProperty(key)) {
            usedKeys.add(key);
          }
        });

        // เก็บฟิลด์ที่เหลือใน additionalData
        const additionalData: any = {};
        Object.keys(row).forEach(key => {
          if (!usedKeys.has(key) && row[key] !== null && row[key] !== undefined && row[key] !== "") {
            // แปลงชื่อคีย์ให้เป็น camelCase ถ้าเป็นภาษาไทย
            const cleanKey = key.replace(/\s+/g, '_').toLowerCase();
            additionalData[cleanKey] = cleanValue(row[key]);
          }
        });

        if (Object.keys(additionalData).length > 0) {
          studentData.additionalData = additionalData;
        }

        // บันทึกข้อมูลถ้ามีฟิลด์ที่จำเป็น
        if (hasRequiredFields) {
          await addDoc(studentsCollectionRef, studentData);
          uploadedStudents.push(studentData);
        } else {
          errors.push(`ข้อมูลไม่ครบถ้วน (ต้องมีรหัสนักเรียนและชื่อ-นามสกุล): ${JSON.stringify(row)}`);
        }

      } catch (rowError) {
        console.error("Error processing row:", rowError);
        errors.push(`ข้อผิดพลาดในแถว: ${JSON.stringify(row)} - ${rowError instanceof Error ? rowError.message : String(rowError)}`);
      }
    }

    return {
      success: true,
      uploaded: uploadedStudents.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `อัปโหลดสำเร็จ ${uploadedStudents.length} รายการ${errors.length > 0 ? `, มีข้อผิดพลาด ${errors.length} รายการ` : ""}`
    };

  } catch (err) {
    console.error("Upload error:", err);
    return {
      success: false,
      message: `เกิดข้อผิดพลาด: ${err instanceof Error ? err.message : String(err)}`,
      error: err
    };
  }
};

// ฟังก์ชันเสริมสำหรับดูโครงสร้างของไฟล์ Excel
export const previewExcelStructure = async (file: File) => {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return {
        success: false,
        message: "ไฟล์ว่างเปล่า"
      };
    }

    // ดึงหัวข้อตารางทั้งหมด
    const headers = Object.keys(jsonData[0]);
    
    // ตัวอย่างข้อมูล 3 แถวแรก
    const preview = jsonData.slice(0, 3);

    return {
      success: true,
      headers,
      preview,
      totalRows: jsonData.length,
      sheets: workbook.SheetNames
    };

  } catch (err) {
    return {
      success: false,
      message: `ไม่สามารถอ่านไฟล์ได้: ${err instanceof Error ? err.message : String(err)}`
    };
  }
};

// ใช้วิธีที่ 1 เป็น default export
export const uploadStudentsFromFile = uploadStudentsToSubcollection;
export default uploadStudentsToSubcollection;