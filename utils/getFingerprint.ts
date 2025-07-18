import FingerprintJS from '@fingerprintjs/fingerprintjs';
import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
  getDocs,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const DEVICE_ID_TTL_HOURS = 4; // 4 ชั่วโมง (เดิม)
export const getFingerprint = async (): Promise<string> => {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  return result.visitorId;
};

// ฟังก์ชันหลักที่รวม save และ clear
export const saveAndCleanupDeviceId = async (): Promise<string> => {
  const deviceId = await getFingerprint();

  // บันทึก deviceId
  const docRef = doc(db, 'deviceIds', deviceId);
  await setDoc(
    docRef,
    {
      createdAt: Timestamp.now(),
    },
    { merge: true }
  );

  // ลบ deviceId ที่หมดอายุ (เกิน 4 ชั่วโมง)
  const now = Timestamp.now();
  const cutoff = Timestamp.fromMillis(
    now.toMillis() - DEVICE_ID_TTL_HOURS * 60 * 60 * 1000
  );

  const snapshot = await getDocs(collection(db, 'deviceIds'));

  const deletePromises = snapshot.docs.map(async (docSnap) => {
    const data = docSnap.data();
    const createdAt = data.createdAt as Timestamp;

    if (createdAt?.toMillis() < cutoff.toMillis()) {
      await deleteDoc(docSnap.ref);
    }
  });

  await Promise.all(deletePromises);

  return deviceId;
};
