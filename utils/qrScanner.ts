import { doc, getDoc, updateDoc, arrayUnion, Timestamp, collection, query, where, getDocs, QuerySnapshot, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserData } from "@/types/classTypes";

/**
 * ฟังก์ชันสำหรับจัดการการสแกน QR Code (แก้ไขให้ตรวจสอบรายชื่อจากไฟล์ CSV)
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
  user: UserData;
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

    console.log("Searching for student:", { classId, studentId }); // Debug log

    // ปรับปรุงการตรวจสอบว่านักศึกษาคนนี้มีชื่ออยู่ในรายชื่อของคลาสนี้หรือไม่
    // ใช้ subcollection แทน
    const classRef = doc(db, "classes", classId);
    const studentsCollectionRef = collection(classRef, "students");
    
    let studentsQuery = query(
      studentsCollectionRef,
      where("studentId", "==", studentId)
    );
    
    let studentsSnapshot = await getDocs(studentsQuery);
    
    // ถ้าไม่เจอ ลองค้นหาแบบ string conversion
    if (studentsSnapshot.empty) {
      console.log("First query empty, trying string conversion");
      studentsQuery = query(
        studentsCollectionRef,
        where("studentId", "==", String(studentId))
      );
      studentsSnapshot = await getDocs(studentsQuery);
    }

    // ถ้ายังไม่เจอ ลองค้นหาทุกคนในคลาสแล้วหาด้วย includes หรือ loose comparison
    if (studentsSnapshot.empty) {
      console.log("Second query empty, trying loose search");
      const allStudentsSnapshot = await getDocs(studentsCollectionRef);
      console.log("All students in class:", allStudentsSnapshot.docs.map(doc => doc.data()));
      
      // ค้นหาแบบ loose comparison
      const matchedStudent = allStudentsSnapshot.docs.find(doc => {
        const data = doc.data();
        return String(data.studentId).trim() === String(studentId).trim() ||
               String(data.studentId).replace(/\s+/g, '') === String(studentId).replace(/\s+/g, '');
      });

      if (matchedStudent) {
        studentsSnapshot = { docs: [matchedStudent], empty: false } as unknown as QuerySnapshot<DocumentData>;
      }
    }
    
    if (studentsSnapshot.empty) {
      // แสดงข้อมูล debug เพื่อช่วยแก้ปัญหา
      const allStudents = await getDocs(studentsCollectionRef);
      const studentIds = allStudents.docs.map(doc => doc.data().studentId);
      
      console.log("Available student IDs:", studentIds);
      console.log("Searching for:", studentId);
      
      alert(`คุณไม่อยู่ในรายชื่อของคลาสนี้\nรหัสของคุณ: ${studentId}\nกรุณาติดต่อวัยรุ่น Check-IN`);
      return;
    }

    // ดึงข้อมูลนักศึกษาจากรายชื่อ
    const studentData = studentsSnapshot.docs[0].data();
    console.log("Found student data:", studentData); // Debug log

    // สร้าง Reference ไปยังเอกสารคลาสใน Firestore
    const classDocRef = doc(db, "classes", classId);

    // ดึงข้อมูลคลาสจาก Firestore
    const classDoc = await getDoc(classDocRef);

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
          name: studentData.name || user.displayName || user.email || "",
          email: user.email || "",
          status: studentData.status || "active",
        },

        checkedInMembers: arrayUnion(user.uid),
        checkedInCount: checkedInMembers.length + 1,
        lastCheckedIn: Timestamp.now(),
      });

      if (!hasScanned) {
        await updateScanStatus(true);
      }

      alert(`เช็คชื่อสำเร็จ!\nชื่อ: ${studentData.name}\nรหัสนักศึกษา: ${studentId}\nสถานะ: ${studentData.status || 'active'}`);
      onScanSuccess?.();
    } else {
      alert('ไม่พบข้อมูลคลาสนี้');
    }
  } catch (error) {
    console.error('Error details:', error);
    alert(`เกิดข้อผิดพลาดในการเช็คชื่อ: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    setLoading(false);
  }
};

/**
 * ฟังก์ชันสำหรับหยุดการทำงานของกล้อง
 */
export const stopCamera = (stream: MediaStream) => {
  stream.getTracks().forEach((track) => {
    track.stop();
  });
};