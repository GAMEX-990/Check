import { doc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import { User } from "firebase/auth";
import { db } from "@/lib/firebase";
import { toast } from "sonner";


interface DeleteClassParams {
  classId: string;
  user: User | null;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  onDeleteSuccess?: () => void;
}

export const handleDeleteClass = async ({
  classId,
  user,
  setLoading,
  setError,
  onDeleteSuccess,
}: DeleteClassParams) => {
  if (!user) {
    setError("กรุณาเข้าสู่ระบบก่อน");
    return;
  }

  if (!classId) {
    setError("ไม่พบข้อมูลคลาส");
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const batch = writeBatch(db);

    // 1. ลบเอกสารคลาสหลัก
    const classRef = doc(db, "classes", classId);
    batch.delete(classRef);

    // 2. ลบข้อมูลการเช็คชื่อทั้งหมดของคลาสนี้ (ถ้ามี)
    const attendanceQuery = query(
      collection(db, "attendance"),
      where("classId", "==", classId)
    );
    const attendanceSnapshot = await getDocs(attendanceQuery);

    attendanceSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // 3. ลบข้อมูลสมาชิกคลาส (ถ้ามี collection แยก)
    const membersQuery = query(
      collection(db, "classMembers"),
      where("classId", "==", classId)
    );
    const membersSnapshot = await getDocs(membersQuery);

    membersSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Execute batch delete
    await batch.commit();

    toast.success("ลบคลาสสำเร็จ");

    if (onDeleteSuccess) {
      onDeleteSuccess();
    }

  } catch (error) {

    if (error instanceof Error) {
      setError(`เกิดข้อผิดพลาด: ${error.message}`);
    } else {
      setError("เกิดข้อผิดพลาดในการลบคลาส กรุณาลองใหม่อีกครั้ง");
    }
  } finally {
    setLoading(false);
  }
};