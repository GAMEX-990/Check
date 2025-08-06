// utils/checkDeviceBeforeLogin.ts
import { getFingerprint } from "@/utils/getFingerprint";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function checkDeviceBeforeLogin(email: string) {
  const deviceId = await getFingerprint();

  // ✅ ถ้าไม่ได้ fingerprint (null/undefined) → ให้ผ่าน
  if (!deviceId) {
    console.warn("ไม่สามารถสร้าง deviceId ได้ → อนุญาตให้เข้า");
    return;
  }

  const deviceRef = doc(db, "deviceIds", deviceId);
  const snap = await getDoc(deviceRef);

  // ✅ ถ้า deviceId ยังไม่เคยถูกใช้ → ให้เข้า
  if (!snap.exists()) {
    console.log("deviceId ยังไม่เคยใช้ → อนุญาตให้เข้า");
    return;
  }

  const data = snap.data();
  const storedEmail = data?.email;

  // ❌ ถ้า email ไม่ตรง → ไม่ให้เข้า
  if (storedEmail !== email) {
    // คำนวณเวลาที่เหลือ
    const expireAt = data?.expireAt;
    let remainingTimeMs = 0;
    
    if (expireAt && expireAt.toMillis) {
      remainingTimeMs = expireAt.toMillis() - Date.now();
    }

    // ถ้าหมดอายุแล้ว ให้ผ่าน
    if (remainingTimeMs <= 0) {
      console.log("deviceId หมดอายุแล้ว → อนุญาตให้เข้า");
      return;
    }

    // แปลงเวลาที่เหลือเป็น hours และ minutes
    const remainingHours = Math.floor(remainingTimeMs / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remainingTimeMs % (1000 * 60 * 60)) / (1000 * 60));
    
    let timeText = "";
    if (remainingHours > 0) {
      timeText = `${remainingHours} ชั่วโมง ${remainingMinutes} นาที`;
    } else {
      timeText = `${remainingMinutes} นาที`;
    }

    throw new Error(`อุปกรณ์นี้เคยถูกผูกกับบัญชีอื่น (${storedEmail}) คุณสามารถกลับมาใช้งานได้ในอีก ${timeText}|${remainingTimeMs}`);
  }

  // ✅ ตรงกัน → อนุญาตให้เข้า
  console.log("deviceId และ email ตรงกัน → อนุญาตให้เข้า");
}