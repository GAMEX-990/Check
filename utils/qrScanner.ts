import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase"; // อย่าลืม import Firebase configuration ของคุณ

/**
 * ฟังก์ชันสำหรับจัดการการสแกน QR Code
 * @param result ผลลัพธ์จากการสแกน QR Code
 * @param videoRef Reference ไปยัง video element ของกล้อง
 * @param user ข้อมูลผู้ใช้ปัจจุบัน
 * @param setScanning ฟังก์ชันสำหรับตั้งค่าสถานะการสแกน
 * @param setLoading ฟังก์ชันสำหรับตั้งค่าสถานะการโหลด
 * @param hasScanned สถานะว่าผู้ใช้เคยสแกนแล้วหรือไม่
 * @param updateScanStatus ฟังก์ชันสำหรับอัปเดตสถานะการสแกน
 * @param onScanSuccess callback เมื่อสแกนสำเร็จ
 * @param stopCamera ฟังก์ชันสำหรับหยุดการทำงานของกล้อง
 */
export const handleQRDetected = async ({
  result,
  videoRef,
  user,
  setScanning,
  setLoading,
  hasScanned,
  updateScanStatus,
  onScanSuccess,
  stopCamera,
}: {
  result: { data: string };
  videoRef: React.RefObject<HTMLVideoElement | null>;
  user: any; // ควรเปลี่ยนเป็น type ที่เหมาะสมสำหรับผู้ใช้ของคุณ
  setScanning: (scanning: boolean) => void;
  setLoading: (loading: boolean) => void;
  hasScanned: boolean;
  updateScanStatus: (status: boolean) => Promise<void>;
  onScanSuccess?: () => void;
  stopCamera: (stream: MediaStream) => void;
}) => {
  try {
    // ปิดกล้องทันทีเมื่อสแกนเสร็จ
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stopCamera(stream);
      videoRef.current.srcObject = null;
    }

    // ปิดสถานะการสแกน
    setScanning(false);

    // แปลง QR Code ที่สแกนได้เป็น URL object
    const url = new URL(result.data);

    // ดึง Class ID จากส่วนท้ายของ URL path
    const classId = url.pathname.split('/').pop();

    // ตรวจสอบว่ามี Class ID และผู้ใช้ล็อกอินแล้วหรือไม่
    if (!classId || !user) {
      alert('ไม่สามารถเช็คชื่อได้ กรุณาลองใหม่');
      return;
    }

    // เริ่มสถานะการโหลด
    setLoading(true);

    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data();
    const studentId = userData?.studentId || "";

    // สร้าง Reference ไปยังเอกสารคลาสใน Firestore
    const classRef = doc(db, "classes", classId);

    // ดึงข้อมูลคลาสจาก Firestore
    const classDoc = await getDoc(classRef);

    // ตรวจสอบว่าคลาสมีอยู่จริงหรือไม่
    if (classDoc.exists()) {
      const classData = classDoc.data();
      const checkedInMembers = classData.checkedInMembers || [];

      // ตรวจสอบว่าผู้ใช้เช็คชื่อไปแล้วหรือยัง
      if (checkedInMembers.includes(user.uid)) {
        alert('คุณได้เช็คชื่อไปแล้ว!');
        return;
      }

      // อัปเดตข้อมูลคลาสในฐานข้อมูล
      await updateDoc(classRef, {
        checkedInRecord: arrayUnion({
          uid: user.uid,
          studentId: userData?.studentId || "",
          timestamp: Timestamp.now(),
          name: user.displayName || user.email || "",
          email: user.email || "",
          
        }),
        checkedInMembers: arrayUnion(user.uid),
        checkedInCount: checkedInMembers.length + 1,
        lastCheckedIn: Timestamp.now(),
      });

      if (!hasScanned) {
        await updateScanStatus(true);
      }

      alert('เช็คชื่อสำเร็จ!');
      onScanSuccess?.();
    }
  } catch (error) {
    console.error('Error:', error);
    alert('เกิดข้อผิดพลาดในการเช็คชื่อ');
  } finally {
    setLoading(false);
  }
};

/**
 * ฟังก์ชันสำหรับหยุดการทำงานของกล้อง
 * @param stream MediaStream object ของกล้อง
 */
export const stopCamera = (stream: MediaStream) => {
  stream.getTracks().forEach((track) => {
    track.stop();
  });
};