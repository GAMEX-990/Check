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

  const storedEmail = snap.data()?.email;

  // ❌ ถ้า email ไม่ตรง → ไม่ให้เข้า
  if (storedEmail !== email) {
    throw new Error(`อุปกรณ์นี้เคยถูกผูกกับบัญชีอื่น (${storedEmail})`);
  }

  // ✅ ตรงกัน → อนุญาตให้เข้า
  console.log("deviceId และ email ตรงกัน → อนุญาตให้เข้า");
}
