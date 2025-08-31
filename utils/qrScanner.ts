import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  HandleQRDetectedParams,
  StudentData,
  ClassData,
} from "types/qrScannerTypes";
import { toast } from "sonner";
import { saveAndCleanupDeviceId } from "./getFingerprint"; // ✅ เรียกใช้

const getTodayDateKey = (): string => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

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
    const classId = url.pathname.split("/").pop();

    if (!classId || !user) {
      toast.error("ไม่สามารถเช็คชื่อได้ กรุณาลองใหม่");
      return;
    }

    setLoading(true);

    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data() as StudentData | undefined;
    const studentId = userData?.studentId || "";

    if (!studentId) {
      toast.error(
        "ไม่พบรหัสนักศึกษาของคุณ\nกรุณาติดต่อผู้ดูแลระบบหรืออาจาร์ยังไม่ได้อัพไฟล์เช็คชื่อ"
      );
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
      const matchedStudent = allStudentsSnapshot.docs.find((doc) => {
        const data = doc.data() as StudentData;
        return (
          String(data.studentId).trim() === String(studentId).trim() ||
          String(data.studentId).replace(/\s+/g, "") ===
            String(studentId).replace(/\s+/g, "")
        );
      });

      if (matchedStudent) {
        studentsSnapshot = {
          docs: [matchedStudent],
          empty: false,
        } as any;
      }
    }

    if (studentsSnapshot.empty) {
      toast.error(
        `คุณไม่อยู่ในรายชื่อของคลาสนี้\nรหัสของคุณ: ${studentId}\nกรุณาติดต่อวัยรุ่น Check-IN`
      );
      return;
    }

    const studentData = studentsSnapshot.docs[0].data() as StudentData;

    const classDoc = await getDoc(classRef);
    if (classDoc.exists()) {
      const classData = classDoc.data() as ClassData;
      const todayDateKey = getTodayDateKey();

      const dailyCheckedInMembers = classData.dailyCheckedInMembers || {};
      const todayCheckedInMembers = dailyCheckedInMembers[todayDateKey] || [];

      if (todayCheckedInMembers.includes(user.uid)) {
        toast.error("คุณได้เช็คชื่อวันนี้ไปแล้ว!");
        return;
      }

      // อ่าน lateThresholdMinutes ต่อคลาส (fallback 15 นาที)
      const lateThresholdMinutes =
        typeof (classData as any).lateThresholdMinutes === "number"
          ? (classData as any).lateThresholdMinutes
          : 15;

      // หาเวลาเริ่ม session (เช็คอินแรกของวันนั้น) ถ้าไม่มี แปลว่าคนแรก => ใช้ตอนนี้
      const dailyRecord = (classData as any).dailyCheckedInRecord?.[todayDateKey] || {};
      let sessionStartTime: Date | null = null;
      Object.values(dailyRecord).forEach((rec: any) => {
        if (rec && rec.timestamp && typeof rec.timestamp.toDate === "function") {
          const t = rec.timestamp.toDate();
          if (!sessionStartTime || t < sessionStartTime) sessionStartTime = t;
        }
      });
      if (!sessionStartTime) sessionStartTime = new Date();

      // เวลาสแกนปัจจุบัน และคำนวณ "สาย"
      const now = new Date();
      const isLate = now.getTime() - sessionStartTime.getTime() > lateThresholdMinutes * 60 * 1000;

      const checkInRecord = {
        uid: user.uid,
        studentId: studentId,
        timestamp: Timestamp.now(),
        name: studentData.name || user.displayName || user.email || "",
        email: user.email || "",
        status: isLate ? "late" : "present",
        isLate,
        date: todayDateKey,
      };

      await updateDoc(classRef, {
        [`dailyCheckedInRecord.${todayDateKey}.${user.uid}`]: checkInRecord,
        [`dailyCheckedInMembers.${todayDateKey}`]: arrayUnion(user.uid),
        [`dailyCheckedInCount.${todayDateKey}`]:
          (todayCheckedInMembers.length || 0) + 1,
        lastCheckedIn: Timestamp.now(),
        [`checkedInRecord.${user.uid}`]: checkInRecord,
        checkedInMembers: arrayUnion(user.uid),
        checkedInCount: (classData.checkedInMembers?.length || 0) + 1,
      });

      // ✅ เรียกเก็บ deviceId หลังจากเช็คชื่อสำเร็จเท่านั้น
      const deviceId = await saveAndCleanupDeviceId(user.email || "");
      console.log("📌 บันทึก Device ID:", deviceId);

      if (!hasScanned) {
        await updateScanStatus(true);
      }

      toast.success(
        `เช็คชื่อสำเร็จ!\nชื่อ: ${studentData.name}\nรหัสนักศึกษา: ${studentId}\nวันที่: ${todayDateKey}\nสถานะ: ${isLate ? "สาย" : "มาตรงเวลา"}`
      );
      onScanSuccess?.();
    } else {
      toast.error("ไม่พบข้อมูลคลาสนี้");
    }
  } catch (error) {
    toast.error(
      `เกิดข้อผิดพลาดในการเช็คชื่อ: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    setLoading(false);
  }
};

export const stopCamera = (stream: MediaStream) => {
  stream.getTracks().forEach((track) => {
    track.stop();
  });
};
export const startCamera = async (
  videoRef: React.RefObject<HTMLVideoElement>
) => {
  if (!videoRef.current) return;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
    videoRef.current.srcObject = stream;
    await videoRef.current.play();
  } catch (error) {
    console.error("Error accessing camera:", error);
    toast.error("ไม่สามารถเข้าถึงกล้องได้");
  }
};