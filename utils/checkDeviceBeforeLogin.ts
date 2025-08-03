// utils/checkDeviceBeforeLogin.ts
import { getFingerprint } from "@/utils/getFingerprint";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function checkDeviceBeforeLogin(email: string) {
  const deviceId = await getFingerprint();

  // ถ้าไม่ได้ deviceId → อนุญาตผ่าน
  if (!deviceId) {
    console.warn("ไม่ได้รับ deviceId จาก getFingerprint → อนุญาตให้ผ่าน");
    return;
  }

  const deviceDocRef = doc(db, 'deviceIds', deviceId);
  const deviceSnap = await getDoc(deviceDocRef);

  // ถ้า deviceId ยังไม่เคยเก็บ → อนุญาตผ่าน
  if (!deviceSnap.exists()) {
    console.log("ยังไม่เคยเก็บ deviceId นี้ → อนุญาตให้ผ่าน");
    return;
  }

  const storedEmail = deviceSnap.data()?.email;

  // ถ้า email ผูก deviceId ไม่ตรง → ห้ามเข้า
  if (storedEmail !== email) {
    throw new Error(`อุปกรณ์นี้เคยผูกกับบัญชีอื่น (${storedEmail}) ไม่สามารถเข้าใช้งานได้`);
  }

  // email ตรง → อนุญาตเข้าใช้งาน
  console.log("deviceId และ email ตรงกัน → อนุญาตให้เข้าใช้งาน");
}
