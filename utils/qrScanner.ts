import { doc, getDoc, updateDoc, arrayUnion, Timestamp, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * ฟังก์ชันสำหรับจัดการการสแกน QR Code (แก้ไขให้ตรวจสอบรายชื่อจากไฟล์ CSV)
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
  user: any;
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

    // ดึงข้อมูลผู้ใช้
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data();
    const studentId = userData?.studentId || "";

    // ตรวจสอบว่าผู้ใช้มี studentId หรือไม่
    if (!studentId) {
      alert('ไม่พบรหัสนักศึกษาของคุณ กรุณาติดต่อผู้ดูแลระบบ');
      return;
    }

    // ตรวจสอบว่านักศึกษาคนนี้มีชื่ออยู่ในรายชื่อของคลาสนี้หรือไม่
    const studentsQuery = query(
      collection(db, "students"),
      where("classId", "==", classId),
      where("studentId", "==", studentId)
    );
    
    const studentsSnapshot = await getDocs(studentsQuery);
    
    if (studentsSnapshot.empty) {
      alert('คุณไม่อยู่ในรายชื่อของคลาสนี้ ไม่สามารถเช็คชื่อได้');
      return;
    }

    // ดึงข้อมูลนักศึกษาจากรายชื่อ
    const studentData = studentsSnapshot.docs[0].data();

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
        [`checkedInRecord.${user.uid}`]: {
          uid: user.uid,
          studentId: studentId,
          timestamp: Timestamp.now(),
          name: studentData.name || user.displayName || user.email || "", // ใช้ชื่อจากรายชื่อที่อัปโหลด
          email: user.email || "",
          status: studentData.status || "", // เพิ่มสถานะจากรายชื่อ
        },

        checkedInMembers: arrayUnion(user.uid),
        checkedInCount: checkedInMembers.length + 1,
        lastCheckedIn: Timestamp.now(),
      });

      if (!hasScanned) {
        await updateScanStatus(true);
      }

      alert(`เช็คชื่อสำเร็จ!\nชื่อ: ${studentData.name}\nรหัสนักศึกษา: ${studentId}`);
      onScanSuccess?.();
    } else {
      alert('ไม่พบข้อมูลคลาสนี้');
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