import * as XLSX from "xlsx";
import { addDoc, collection, Timestamp, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// วิธีที่ 1: ใช้ Subcollection (แนะนำมากที่สุด)
export const uploadStudentsToSubcollection = async (
  file: File,
  classId: string
) => {
  try {
    console.log("Starting file upload process...", { fileName: file.name, classId });

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

    console.log("Parsed data:", jsonData);

    // เก็บใน subcollection: classes/{classId}/students
    const classRef = doc(db, "classes", classId);
    const studentsCollectionRef = collection(classRef, "students");

    const uploadedStudents = [];
    const errors = [];

    for (const row of jsonData) {
      try {
        const studentId = row["รหัสนักศึกษา"] || row["studentId"] || row["StudentID"] || row["ID"];
        const prefix = row["คำนำหน้า"] || row["prefix"] || row["Prefix"] || "";
        const firstName = row["ชื่อ"] || row["firstName"] || row["FirstName"] || row["Name"];
        const lastName = row["นามสกุล"] || row["lastName"] || row["LastName"] || row["Surname"];
        const status = row["สถานะ"] || row["status"] || row["Status"] || "active";

        if (studentId && firstName && lastName) {
          const studentData = {
            studentId: String(studentId).trim(),
            name: `${prefix} ${firstName} ${lastName}`.trim(),
            status: status || "active",
            createdAt: Timestamp.now(),
            // ไม่ต้องเก็บ classId เพราะอยู่ใน subcollection แล้ว
          };

          // เก็บใน subcollection ของคลาสนั้น ๆ
          await addDoc(studentsCollectionRef, studentData);
          uploadedStudents.push(studentData);

          console.log("Uploaded student to subcollection:", studentData);
        } else {
          errors.push(`ข้อมูลไม่ครบถ้วนในแถว: ${JSON.stringify(row)}`);
        }
      } catch (rowError) {
        console.error("Error processing row:", row, rowError);
        errors.push(`ข้อผิดพลาดในแถว: ${JSON.stringify(row)}`);
      }
    }

    console.log(`Upload completed. Success: ${uploadedStudents.length}, Errors: ${errors.length}`);

    return {
      success: true,
    };
  } catch (err) {
    return {
      success: false,
    };
  }
};

// ใช้วิธีที่ 1 เป็น default export
export const uploadStudentsFromFile = uploadStudentsToSubcollection;
export default uploadStudentsToSubcollection;