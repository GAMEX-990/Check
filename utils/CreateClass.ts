import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase"; // อย่าลืม import Firebase configuration ของคุณ

interface CreateClassParams {
  className: string;
  user: {
    uid: string;
    email: string | null;
    displayName?: string | null;
  } | null;
  setClassName: (name: string) => void;
  setShowPopup: (show: boolean) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

/**
 * ฟังก์ชันสำหรับสร้างคลาสใหม่
 * @param className ชื่อคลาสที่ต้องการสร้าง
 * @param user ข้อมูลผู้ใช้ปัจจุบัน
 * @param setClassName ฟังก์ชันสำหรับตั้งค่าชื่อคลาส
 * @param setShowPopup ฟังก์ชันสำหรับควบคุมการแสดง popup
 * @param setError ฟังก์ชันสำหรับตั้งค่าข้อความผิดพลาด
 * @param setLoading ฟังก์ชันสำหรับตั้งค่าสถานะการโหลด
 */
export const handleCreateClass = async ({
  className,
  user,
  setClassName,
  setShowPopup,
  setError,
  setLoading,
}: CreateClassParams) => {
  // ตรวจสอบว่าผู้ใช้กรอกชื่อคลาสหรือไม่
  if (!className.trim()) {
    setError("กรุณากรอกชื่อคลาสก่อน");
    return;
  }

  // ตรวจสอบว่าผู้ใช้ล็อกอินแล้วหรือไม่
  if (!user) {
    setError("คุณยังไม่ได้ล็อกอิน");
    return;
  }

  try {
    setLoading(true);
    setError(null);

    const userId = user.uid;
    const userEmail = user.email || "";

    // สร้างเอกสารคลาสใหม่ใน Firestore
    await addDoc(collection(db, "classes"), {
      name: className.trim(),
      created_by: userId,
      created_at: Timestamp.fromDate(new Date()),
      members: [userId],
      memberCount: 1,
      checkedInCount: 0,
      checkedInMembers: [],
      owner_email: userEmail,
    });

    setClassName("");
    setShowPopup(false);
    alert("สร้างคลาสสำเร็จ");
  } catch (error) {
    console.error("Error details:", error);
    setError(
      `เกิดข้อผิดพลาด: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  } finally {
    setLoading(false);
  }
};