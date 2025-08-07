// @/utils/checkDeviceBeforeLogin.ts
import { doc, getDoc, query, collection, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCurrentFingerprint } from '@/utils/getFingerprint';

const LOGIN_CLASS_ID = 'LOGIN_TRACKING';
const DEVICE_COOLDOWN_HOURS = 4; // 4 ชั่วโมง cooldown เมื่อเปลี่ยน user

// ตรวจสอบ device ก่อน login
export const checkDeviceBeforeLogin = async (email: string): Promise<void> => {
  try {
    // ได้ fingerprint ของ device ปัจจุบัน
    const currentFingerprint = await getCurrentFingerprint();
    console.log('Checking device for login:', { email, fingerprint: currentFingerprint });

    // เช็คว่า device นี้เคยถูกใช้แล้วหรือยัง
    const deviceRef = doc(db, 'deviceIds', `${currentFingerprint}_${LOGIN_CLASS_ID}`);
    const deviceSnap = await getDoc(deviceRef);

    // ถ้า device ยังไม่เคยใช้ → อนุญาตให้ login
    if (!deviceSnap.exists()) {
      console.log('✅ Device never used before - allowing login');
      return;
    }

    const deviceData = deviceSnap.data();
    const storedEmail = deviceData?.email;
    const lastUsed = deviceData?.lastUsed as Timestamp;
    const expireAt = deviceData?.expireAt as Timestamp;
    const now = Timestamp.now();

    console.log('Device data found:', {
      storedEmail,
      currentEmail: email,
      lastUsed: lastUsed?.toDate(),
      expireAt: expireAt?.toDate(),
      now: now.toDate()
    });

    // ถ้า device หมดอายุแล้ว → อนุญาตให้ login
    if (expireAt && expireAt.toMillis() <= now.toMillis()) {
      console.log('✅ Device expired - allowing login');
      return;
    }

    // ถ้า email เดียวกัน → อนุญาตให้ login (user เดิม)
    if (storedEmail === email) {
      console.log('✅ Same user - allowing login');
      return;
    }

    // ถ้า email ต่างกัน → เช็ค cooldown period
    if (storedEmail !== email) {
      const cooldownMillis = DEVICE_COOLDOWN_HOURS * 60 * 60 * 1000;
      const cooldownEndTime = lastUsed ? lastUsed.toMillis() + cooldownMillis : 0;
      const remainingTime = cooldownEndTime - now.toMillis();

      console.log('Device used by different user:', {
        storedEmail,
        currentEmail: email,
        cooldownEndTime: new Date(cooldownEndTime),
        remainingTime
      });

      if (remainingTime > 0) {
        // ยังไม่หมด cooldown → ปฏิเสธ login
        const errorMessage = `อุปกรณ์นี้เคยถูกใช้งานโดย ${storedEmail}`;
        console.log('❌ Device still in cooldown - blocking login');
        throw new Error(`${errorMessage}|${remainingTime}`);
      } else {
        // หมด cooldown แล้ว → อนุญาตให้ login
        console.log('✅ Cooldown period ended - allowing login');
        return;
      }
    }

  } catch (error) {
    console.error('Error in checkDeviceBeforeLogin:', error);
    
    // ถ้า error เป็น string ที่เราสร้างขึ้น → throw ต่อ
    if (error instanceof Error && error.message.includes('|')) {
      throw error;
    }
    
    // ถ้าเป็น error อื่น ๆ → อนุญาตให้ login (fail-safe)
    console.log('⚠️ Error occurred but allowing login as fail-safe');
  }
};

// ตรวจสอบว่า device ปัจจุบันเคยถูกใช้โดย user อื่นหรือไม่
export const isDeviceUsedByOtherUser = async (email: string): Promise<{
  isUsed: boolean;
  otherUserEmail?: string;
  remainingCooldown?: number;
}> => {
  try {
    const currentFingerprint = await getCurrentFingerprint();
    const deviceRef = doc(db, 'deviceIds', `${currentFingerprint}_${LOGIN_CLASS_ID}`);
    const deviceSnap = await getDoc(deviceRef);

    if (!deviceSnap.exists()) {
      return { isUsed: false };
    }

    const deviceData = deviceSnap.data();
    const storedEmail = deviceData?.email;
    const lastUsed = deviceData?.lastUsed as Timestamp;
    const expireAt = deviceData?.expireAt as Timestamp;
    const now = Timestamp.now();

    // ถ้า device หมดอายุแล้ว
    if (expireAt && expireAt.toMillis() <= now.toMillis()) {
      return { isUsed: false };
    }

    // ถ้า email เดียวกัน
    if (storedEmail === email) {
      return { isUsed: false };
    }

    // ถ้า email ต่างกัน - เช็ค cooldown
    const cooldownMillis = DEVICE_COOLDOWN_HOURS * 60 * 60 * 1000;
    const cooldownEndTime = lastUsed ? lastUsed.toMillis() + cooldownMillis : 0;
    const remainingTime = cooldownEndTime - now.toMillis();

    return {
      isUsed: remainingTime > 0,
      otherUserEmail: storedEmail,
      remainingCooldown: remainingTime > 0 ? remainingTime : 0
    };

  } catch (error) {
    console.error('Error checking device usage:', error);
    return { isUsed: false };
  }
};

// ดึงรายการ devices ทั้งหมดของ user
export const getUserDevices = async (email: string): Promise<Array<{
  fingerprint: string;
  lastUsed: Date;
  userAgent: string;
  platform: string;
  isExpired: boolean;
}>> => {
  try {
    const devicesQuery = query(
      collection(db, 'deviceIds'),
      where('email', '==', email),
      where('classId', '==', LOGIN_CLASS_ID),
      where('isLoginDevice', '==', true)
    );

    const querySnapshot = await getDocs(devicesQuery);
    const now = Timestamp.now();

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      const expireAt = data.expireAt as Timestamp;
      
      return {
        fingerprint: data.deviceId || data.fingerprint,
        lastUsed: (data.lastUsed as Timestamp)?.toDate() || new Date(),
        userAgent: data.userAgent || 'Unknown',
        platform: data.platform || 'Unknown',
        isExpired: expireAt ? expireAt.toMillis() <= now.toMillis() : false
      };
    });

  } catch (error) {
    console.error('Error getting user devices:', error);
    return [];
  }
};

// ฟอร์แมตเวลาที่เหลือ
export const formatRemainingTime = (milliseconds: number): string => {
  if (milliseconds <= 0) return "หมดเวลาแล้ว";

  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours} ชั่วโมง ${minutes} นาที ${seconds} วินาที`;
  } else if (minutes > 0) {
    return `${minutes} นาที ${seconds} วินาที`;
  } else {
    return `${seconds} วินาที`;
  }
};