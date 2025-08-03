import FingerprintJS from '@fingerprintjs/fingerprintjs';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const DEVICE_ID_TTL_HOURS = 4;

// สร้าง Fingerprint ของอุปกรณ์
export const getFingerprint = async (): Promise<string> => {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  return result.visitorId;
};

// ฟังก์ชันหลัก: บันทึก deviceId และลบที่หมดอายุ พร้อมบันทึก email
export const saveAndCleanupDeviceId = async (
  email: string,
  checkInStartTime?: Timestamp
): Promise<string> => {
  const deviceId = await getFingerprint();
  const now = Timestamp.now();

  // TTL ปกติ 4 ชั่วโมง
  let ttlMillis = DEVICE_ID_TTL_HOURS * 60 * 60 * 1000;

  if (checkInStartTime) {
    const endTime = checkInStartTime.toMillis() + ttlMillis;
    const timeLeft = endTime - now.toMillis();
    ttlMillis = Math.max(timeLeft, 0);
  }

  const expireAt = Timestamp.fromMillis(now.toMillis() + ttlMillis);

  // บันทึก deviceId พร้อมวันหมดอายุ และ email
  const docRef = doc(db, 'deviceIds', deviceId);
  await setDoc(
    docRef,
    {
      createdAt: now,
      expireAt: expireAt,
      email: email,  // บันทึก email ด้วย
    },
    { merge: true }
  );

  // ลบ deviceId ที่หมดอายุ
  const snapshot = await getDocs(collection(db, 'deviceIds'));
  const deletePromises = snapshot.docs.map(async (docSnap) => {
    const data = docSnap.data();
    const expire = data.expireAt as Timestamp;

    if (expire?.toMillis() < now.toMillis()) {
      await deleteDoc(docSnap.ref);
    }
  });

  await Promise.all(deletePromises);

  return deviceId;
};
