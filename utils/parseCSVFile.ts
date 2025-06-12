import * as XLSX from "xlsx";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ฟังก์ชันอัปโหลดไฟล์ .xlsx หรือ .csv และบันทึกข้อมูล Firestore ไอควย
export const uploadStudentsFromFile = async (
  file: File,
  classId: string
) => {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

    for (const row of jsonData) {
      const studentId = row["รหัสนักศึกษา"] || row["studentId"];
      const prefix = row["คำนำหน้า"] || row["prefix"];
      const firstName = row["ชื่อ"] || row["firstName"];
      const lastName = row["นามสกุล"] || row["lastName"];
      const status = row["สถานะ"] || row["status"];

      if (studentId && firstName && lastName) {
        await addDoc(collection(db, "students"), {
          studentId,
          name: `${prefix} ${firstName} ${lastName}`.trim(),
          status: status || "",
          classId,
          createdAt: Timestamp.now(),
        });
      }
    }

    return { success: true };
  } catch (err) {
    console.error("Error uploading students:", err);
    return { success: false, error: err };
  }
};
