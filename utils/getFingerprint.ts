// @/utils/getFingerprint.ts
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  Timestamp,
  getDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Constants
const DEVICE_ID_TTL_HOURS = 4; // 4 ชั่วโมง
const LATE_THRESHOLD_MINUTES = 15; // สายหลัง 15 นาที
const ABSENT_THRESHOLD_HOURS = 3; // ขาดหลัง 3 ชั่วโมง

// ==============================================
// CORE FINGERPRINT FUNCTIONS
// ==============================================

// สร้าง Fingerprint ของอุปกรณ์ (หลัก - ใช้ FingerprintJS)
export const getFingerprint = async (): Promise<string> => {
  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
  } catch (error) {
    console.warn('FingerprintJS failed, using fallback:', error);
    return generateFallbackFingerprint();
  }
};

// สำรอง - Generate device fingerprint (fallback)
export const generateFallbackFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
  }
  
  const fingerprint = btoa(JSON.stringify({
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: `${screen.width}x${screen.height}`,
    canvas: canvas.toDataURL(),
    timestamp: Date.now()
  }));
  
  return fingerprint.substring(0, 50); // Limit length
};

// Get stored device fingerprint from localStorage
export const getStoredFingerprint = (): string | null => {
  try {
    return localStorage.getItem('deviceFingerprint');
  } catch {
    return null;
  }
};

// Store device fingerprint to localStorage
export const storeFingerprint = (fingerprint: string): void => {
  try {
    localStorage.setItem('deviceFingerprint', fingerprint);
  } catch (error) {
    console.warn('Could not store fingerprint:', error);
  }
};

// Get current device fingerprint (with caching)
export const getCurrentFingerprint = async (): Promise<string> => {
  let fingerprint = getStoredFingerprint();
  if (!fingerprint) {
    fingerprint = await getFingerprint();
    storeFingerprint(fingerprint);
  }
  return fingerprint;
};

// ==============================================
// SESSION MANAGEMENT FUNCTIONS
// ==============================================

// ฟังก์ชันหลัก: บันทึก deviceId สำหรับ session ใหม่
export const saveDeviceIdForSession = async (
  email: string,
  classId: string,
  sessionStartTime: Timestamp
): Promise<string> => {
  const deviceId = await getFingerprint();
  const ttlMillis = DEVICE_ID_TTL_HOURS * 60 * 60 * 1000;
  const expireAt = Timestamp.fromMillis(sessionStartTime.toMillis() + ttlMillis);

  // บันทึก deviceId พร้อมข้อมูล session
  const docRef = doc(db, 'deviceIds', `${deviceId}_${classId}`);
  await setDoc(docRef, {
    deviceId,
    email,
    classId,
    sessionStartTime,
    expireAt,
    createdAt: Timestamp.now(),
    userAgent: navigator.userAgent,
    platform: navigator.platform
  });

  // ลบ deviceId ที่หมดอายุ
  await cleanupExpiredDeviceIds();

  return deviceId;
};

// ฟังก์ชันเช็คก่อนเข้าใช้งาน
export const checkDeviceBeforeCheckIn = async (
  email: string,
  classId: string
): Promise<{
  canCheckIn: boolean;
  status: 'allowed' | 'blocked' | 'late' | 'absent';
  message: string;
  remainingTime?: number;
}> => {
  const deviceId = await getFingerprint();

  if (!deviceId) {
    return {
      canCheckIn: true,
      status: 'allowed',
      message: 'ไม่สามารถสร้าง deviceId ได้ → อนุญาตให้เข้า'
    };
  }

  const deviceRef = doc(db, 'deviceIds', `${deviceId}_${classId}`);
  const snap = await getDoc(deviceRef);

  // ถ้า deviceId ยังไม่เคยใช้ในคลาสนี้
  if (!snap.exists()) {
    return {
      canCheckIn: true,
      status: 'allowed',
      message: 'deviceId ยังไม่เคยใช้ในคลาสนี้'
    };
  }

  const data = snap.data();
  const storedEmail = data?.email;
  const sessionStartTime = data?.sessionStartTime;
  const expireAt = data?.expireAt;
  const now = Timestamp.now();

  // ถ้าหมดอายุแล้ว
  if (expireAt && expireAt.toMillis() <= now.toMillis()) {
    return {
      canCheckIn: true,
      status: 'allowed',
      message: 'Session หมดอายุแล้ว → อนุญาตให้เข้า'
    };
  }

  // ถ้า email ไม่ตรง
  if (storedEmail !== email) {
    const remainingTime = expireAt ? expireAt.toMillis() - now.toMillis() : 0;
    return {
      canCheckIn: false,
      status: 'blocked',
      message: `อุปกรณ์นี้เคยถูกผูกกับบัญชีอื่น (${storedEmail})`,
      remainingTime
    };
  }

  // ถ้า email ตรงกัน - เช็คสถานะตามเวลา
  if (sessionStartTime) {
    const sessionStart = sessionStartTime.toMillis();
    const currentTime = now.toMillis();
    const timeDiff = currentTime - sessionStart;

    const lateThreshold = LATE_THRESHOLD_MINUTES * 60 * 1000;
    const absentThreshold = ABSENT_THRESHOLD_HOURS * 60 * 60 * 1000;

    if (timeDiff > absentThreshold) {
      return {
        canCheckIn: false,
        status: 'absent',
        message: 'เวลาผ่านไปเกิน 3 ชั่วโมงแล้ว → ถือว่าขาด'
      };
    } else if (timeDiff > lateThreshold) {
      return {
        canCheckIn: true,
        status: 'late',
        message: 'เข้ามาหลังจากเวลาเริ่ม 15 นาที → ถือว่าสาย'
      };
    } else {
      return {
        canCheckIn: true,
        status: 'allowed',
        message: 'เข้าใช้งานตามปกติ'
      };
    }
  }

  return {
    canCheckIn: true,
    status: 'allowed',
    message: 'email และ deviceId ตรงกัน → อนุญาตให้เข้า'
  };
};

// ==============================================
// LOGIN DEVICE MANAGEMENT FUNCTIONS
// ==============================================

// Save and cleanup device ID after successful login
// ใช้ระบบ deviceIds เดียวกันกับ session management
export const saveAndCleanupDeviceId = async (email: string): Promise<void> => {
  try {
    // Get or generate fingerprint
    const fingerprint = await getCurrentFingerprint();

    // บันทึกลง deviceIds collection เหมือนกับ session management
    // ใช้ special classId สำหรับ login tracking
    const loginClassId = 'LOGIN_TRACKING';
    const deviceRef = doc(db, 'deviceIds', `${fingerprint}_${loginClassId}`);
    
    const now = Timestamp.now();
    await setDoc(deviceRef, {
      deviceId: fingerprint,
      email,
      classId: loginClassId,
      sessionStartTime: now,
      lastUsed: now, // สำคัญ! ต้องมีเพื่อเช็ค cooldown
      expireAt: Timestamp.fromMillis(Date.now() + (4 * 60 * 60 * 1000)), // 4 ชั่วโมง
      createdAt: now,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      isLoginDevice: true // flag เพื่อแยกจาก class session
    }, { merge: true });

    // Cleanup old login devices (keep only last 3 devices per user)
    await cleanupOldLoginDevices(email);

    console.log('Device fingerprint saved successfully for login:', email);
  } catch (error) {
    console.error('Error saving device fingerprint:', error);
    // Don't throw error to prevent login disruption
  }
};

// Check if device is registered for user (ใช้ระบบ deviceIds)
export const isDeviceRegistered = async (email: string, fingerprint?: string): Promise<boolean> => {
  try {
    const currentFingerprint = fingerprint || await getCurrentFingerprint();
    const loginClassId = 'LOGIN_TRACKING';
    
    const deviceRef = doc(db, 'deviceIds', `${currentFingerprint}_${loginClassId}`);
    const snap = await getDoc(deviceRef);
    
    if (!snap.exists()) return false;
    
    const data = snap.data();
    return data.email === email && data.isLoginDevice === true;
  } catch (error) {
    console.error('Error checking device registration:', error);
    return false;
  }
};

// ==============================================
// CLEANUP FUNCTIONS
// ==============================================

// ฟังก์ชันลบ deviceId ที่หมดอายุ
export const cleanupExpiredDeviceIds = async (): Promise<void> => {
  try {
    const now = Timestamp.now();
    const snapshot = await getDocs(collection(db, 'deviceIds'));
    
    const deletePromises = snapshot.docs.map(async (docSnap) => {
      const data = docSnap.data();
      const expireAt = data.expireAt as Timestamp;

      if (expireAt?.toMillis() < now.toMillis()) {
        await deleteDoc(docSnap.ref);
        console.log(`Deleted expired deviceId: ${docSnap.id}`);
      }
    });

    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error cleaning up expired device IDs:', error);
  }
};

// Clean up old login devices for a user (ใช้ระบบ deviceIds)
const cleanupOldLoginDevices = async (email: string, maxDevices: number = 3): Promise<void> => {
  try {
    const loginClassId = 'LOGIN_TRACKING';
    
    // หา login devices ทั้งหมดของ user
    const devicesQuery = query(
      collection(db, 'deviceIds'),
      where('email', '==', email),
      where('classId', '==', loginClassId),
      where('isLoginDevice', '==', true)
    );
    
    const querySnapshot = await getDocs(devicesQuery);
    const devices = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ref: doc.ref,
      data: doc.data()
    }));

    // Sort by createdAt date (newest first)
    devices.sort((a, b) => {
      const aTime = a.data.createdAt?.toMillis() || 0;
      const bTime = b.data.createdAt?.toMillis() || 0;
      return bTime - aTime;
    });

    // Delete old devices if more than maxDevices
    if (devices.length > maxDevices) {
      const devicesToDelete = devices.slice(maxDevices);
      
      for (const device of devicesToDelete) {
        await deleteDoc(device.ref);
      }
      
      console.log(`Cleaned up ${devicesToDelete.length} old login devices for user:`, email);
    }
  } catch (error) {
    console.error('Error cleaning up old login devices:', error);
  }
};

// ==============================================
// UTILITY FUNCTIONS
// ==============================================

// ฟังก์ชันแปลงเวลาที่เหลือเป็นข้อความ
export const formatRemainingTime = (remainingTimeMs: number): string => {
  if (remainingTimeMs <= 0) return "หมดอายุแล้ว";

  const hours = Math.floor(remainingTimeMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingTimeMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours} ชั่วโมง ${minutes} นาที`;
  } else {
    return `${minutes} นาที`;
  }
};

// ==============================================
// SESSION WORKFLOW FUNCTIONS
// ==============================================

// ฟังก์ชันสำหรับการเริ่ม session ใหม่ (เรียกเมื่อคนแรกเข้ามา)
export const startNewSession = async (
  classId: string,
  firstUserEmail: string
): Promise<string> => {
  const sessionStartTime = Timestamp.now();
  const deviceId = await saveDeviceIdForSession(
    firstUserEmail,
    classId,
    sessionStartTime
  );
  
  console.log(`Started new session for class ${classId} at ${sessionStartTime.toDate()}`);
  return deviceId;
};

// ตัวอย่างการใช้งาน
export const handleCheckIn = async (
  email: string,
  classId: string,
  isFirstUser: boolean = false
) => {
  try {
    // ถ้าเป็นคนแรก - เริ่ม session ใหม่
    if (isFirstUser) {
      await startNewSession(classId, email);
    }

    // เช็คสิทธิ์การเข้าใช้งาน
    const checkResult = await checkDeviceBeforeCheckIn(email, classId);
    
    if (!checkResult.canCheckIn) {
      if (checkResult.remainingTime) {
        const timeText = formatRemainingTime(checkResult.remainingTime);
        throw new Error(`${checkResult.message} คุณสามารถกลับมาใช้งานได้ในอีก ${timeText}`);
      } else {
        throw new Error(checkResult.message);
      }
    }

    // ดำเนินการ check-in ตามสถานะ
    switch (checkResult.status) {
      case 'late':
        console.log('⚠️ Check-in สาย:', checkResult.message);
        break;
      case 'absent':
        console.log('❌ ถือว่าขาด:', checkResult.message);
        return false; // ไม่อนุญาตให้ check-in
      default:
        console.log('✅ Check-in ปกติ:', checkResult.message);
    }

    return true; // อนุญาตให้ check-in
  } catch (error) {
    console.error('Error in handleCheckIn:', error);
    throw error;
  }
};