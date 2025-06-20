import { doc, getDoc, updateDoc, arrayUnion, Timestamp, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { HandleQRDetectedParams, StudentData, ClassData } from "types/qrScannerTypes";
import { toast } from "sonner";

/**
 * ฟังก์ชันสำหรับสร้าง date key ในรูปแบบ YYYY-MM-DD
 */
const getTodayDateKey = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD
};

/**
 * ฟังก์ชันสำหรับจัดการการสแกน QR Code (แก้ไขให้เช็คชื่อได้วันละครั้งต่อคลาส)
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
}: HandleQRDetectedParams) => {
  try {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stopCamera(stream);
      videoRef.current.srcObject = null;
    }

    setScanning(false);

    const url = new URL(result.data);
    const classId = url.pathname.split('/').pop();

    if (!classId || !user) {
      toast.error('ไม่สามารถเช็คชื่อได้ กรุณาลองใหม่');
      return;
    }

    setLoading(true);

    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data() as StudentData | undefined;
    const studentId = userData?.studentId || "";

    if (!studentId) {
      toast.error('ไม่พบรหัสนักศึกษาของคุณ\nกรุณาติดต่อผู้ดูแลระบบหรืออาจาร์ยังไม่ได้อัพไฟล์เช็คชื่อ');
      return;
    }

    const classRef = doc(db, "classes", classId);
    const studentsCollectionRef = collection(classRef, "students");

    let studentsQuery = query(
      studentsCollectionRef,
      where("studentId", "==", studentId)
    );

    let studentsSnapshot = await getDocs(studentsQuery);

    if (studentsSnapshot.empty) {
      studentsQuery = query(
        studentsCollectionRef,
        where("studentId", "==", String(studentId))
      );
      studentsSnapshot = await getDocs(studentsQuery);
    }

    if (studentsSnapshot.empty) {
      const allStudentsSnapshot = await getDocs(studentsCollectionRef);
      const matchedStudent = allStudentsSnapshot.docs.find(doc => {
        const data = doc.data() as StudentData;
        return String(data.studentId).trim() === String(studentId).trim() ||
          String(data.studentId).replace(/\s+/g, '') === String(studentId).replace(/\s+/g, '');
      });

      if (matchedStudent) {
        studentsSnapshot = { docs: [matchedStudent], empty: false } as any;
      }
    }

    if (studentsSnapshot.empty) {
      const allStudents = await getDocs(studentsCollectionRef);
      const studentIds = allStudents.docs.map(doc => (doc.data() as StudentData).studentId);

      toast.error(`คุณไม่อยู่ในรายชื่อของคลาสนี้\nรหัสของคุณ: ${studentId}\nกรุณาติดต่อวัยรุ่น Check-IN`);
      return;
    }

    const studentData = studentsSnapshot.docs[0].data() as StudentData;

    const classDoc = await getDoc(classRef);
    if (classDoc.exists()) {
      const classData = classDoc.data() as ClassData;
      const todayDateKey = getTodayDateKey();

      // ตรวจสอบการเช็คชื่อวันนี้
      const dailyCheckedInMembers = classData.dailyCheckedInMembers || {};
      const todayCheckedInMembers = dailyCheckedInMembers[todayDateKey] || [];

      if (todayCheckedInMembers.includes(user.uid)) {
        toast.error('คุณได้เช็คชื่อวันนี้ไปแล้ว!');
        return;
      }

      // สร้าง record การเช็คชื่อใหม่
      const checkInRecord = {
        uid: user.uid,
        studentId: studentId,
        timestamp: Timestamp.now(),
        name: studentData.name || user.displayName || user.email || "",
        email: user.email || "",
        status: studentData.status || "active",
        date: todayDateKey,
      };

      // อัพเดทข้อมูลในฐานข้อมูล
      await updateDoc(classRef, {
        // เก็บ record แยกตามวันที่
        [`dailyCheckedInRecord.${todayDateKey}.${user.uid}`]: checkInRecord,

        // เก็บรายการ uid ที่เช็คชื่อแต่ละวัน
        [`dailyCheckedInMembers.${todayDateKey}`]: arrayUnion(user.uid),

        // นับจำนวนคนที่เช็คชื่อวันนี้
        [`dailyCheckedInCount.${todayDateKey}`]: (todayCheckedInMembers.length || 0) + 1,

        // เก็บ timestamp ล่าสุดที่มีคนเช็คชื่อ
        lastCheckedIn: Timestamp.now(),

        // รักษา backward compatibility (ถ้าต้องการ)
        [`checkedInRecord.${user.uid}`]: checkInRecord,
        checkedInMembers: arrayUnion(user.uid),
        checkedInCount: (classData.checkedInMembers?.length || 0) + 1,
      });

      if (!hasScanned) {
        await updateScanStatus(true);
      }

      toast.success(`เช็คชื่อสำเร็จ!\nชื่อ: ${studentData.name}\nรหัสนักศึกษา: ${studentId}\nวันที่: ${todayDateKey}\nสถานะ: ${studentData.status || 'active'}`);
      onScanSuccess?.();
    } else {
      toast.error('ไม่พบข้อมูลคลาสนี้');
    }
  } catch (error) {
    console.error('Error details:', error);
    toast.error(`เกิดข้อผิดพลาดในการเช็คชื่อ: ${error instanceof Error ? error.message : 'Unknown error'}`);
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