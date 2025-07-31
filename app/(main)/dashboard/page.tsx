'use client';

import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getFingerprint } from '@/utils/getFingerprint';
import Loader from '@/components/Loader/Loader';
import ClassSection from '@/components/UserInterface/ClassSection';
import AddClassPopup from '@/components/FromUser/ButtonCreate';
import AttendanceSummaryModal from '@/components/UserInterface/AttenSummary';
import { ClassData } from '@/types/classDetailTypes';

export default function DashboardPage() {
  const [currectPang, setCurrectPang] = useState<'myclass' | 'class' | 'view'>('myclass');
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [user, loading, error] = useAuthState(auth);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const router = useRouter();

  // ฟังก์ชันตรวจสอบ deviceId โดยใช้ collection deviceIds
  const verifyDeviceAccess = async (userEmail: string): Promise<boolean> => {
    try {
      const currentDeviceId = await getFingerprint();
      console.log("Current Device Fingerprint:", currentDeviceId);

      const deviceDocRef = doc(db, 'deviceIds', currentDeviceId);
      const deviceSnap = await getDoc(deviceDocRef);

      // ถ้าไม่มีข้อมูล device ในระบบ
      if (!deviceSnap.exists()) {
        console.log("Device not found in database");
        return false;
      }

      const deviceData = deviceSnap.data();
      const storedEmail = deviceData.email;
      const expireAt = deviceData.expireAt as Timestamp;
      const now = Timestamp.now();

      console.log("Email stored for this device:", storedEmail);
      console.log("Current user email:", userEmail);
      console.log("Device expire at:", expireAt?.toDate());
      console.log("Current time:", now.toDate());

      // ตรวจสอบว่า device หมดอายุหรือยัง
      if (expireAt && expireAt.toMillis() < now.toMillis()) {
        console.warn("Device session expired");
        return false;
      }

      // ตรวจสอบว่า email ตรงกันหรือไม่
      if (storedEmail !== userEmail) {
        console.warn("Device is registered with different email!");
        console.warn(`Stored email: ${storedEmail}, Current email: ${userEmail}`);
        return false;
      }

      console.log("Device verification successful");
      return true;

    } catch (error) {
      console.error("Error in device verification:", error);
      return false;
    }
  };

  // ฟังก์ชัน sign out ที่ปลอดภัย
  const performSecureSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error("Error during sign out:", error);
      // บังคับ redirect แม้ว่า signOut จะล้มเหลว
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    // ถ้ายังโหลดข้อมูล auth อยู่
    if (loading) return;

    // ถ้าไม่มี user (ไม่ได้ login)
    if (!user) {
      setAllowed(false);
      router.replace('/login');
      return;
    }

    // ถ้าไม่มี email
    if (!user.email) {
      console.error("User has no email");
      setAllowed(false);
      performSecureSignOut();
      return;
    }

    // เริ่มตรวจสอบ device
    const checkDevice = async () => {
      try {
        const isAllowed = await verifyDeviceAccess(user.email!);
        
        if (isAllowed) {
          setAllowed(true);
          console.log("Access granted");
        } else {
          console.log("Access denied - device verification failed");
          toast.error('อุปกรณ์นี้ไม่ได้รับอนุญาตให้เข้าใช้งานบัญชีนี้ หรือ session หมดอายุแล้ว', {
            duration: 5000,
            style: { color: '#ef4444' }
          });
          
          setAllowed(false);
          
          // รอสักครู่แล้วค่อย sign out เพื่อให้ user อ่าน message
          setTimeout(() => {
            performSecureSignOut();
          }, 2000);
        }
      } catch (error) {
        console.error("Device verification error:", error);
        toast.error('เกิดข้อผิดพลาดในการตรวจสอบอุปกรณ์');
        setAllowed(false);
        performSecureSignOut();
      }
    };

    checkDevice();
  }, [user, loading, router]);

  // ตรวจสอบซ้ำทุก 30 วินาที เพื่อตรวจสอบ session expiry
  useEffect(() => {
    if (!user || !allowed) return;

    const intervalCheck = setInterval(async () => {
      try {
        const isStillAllowed = await verifyDeviceAccess(user.email!);
        if (!isStillAllowed) {
          console.log("Periodic check failed - session expired or unauthorized");
          toast.warning('Session หมดอายุ กำลังออกจากระบบ...');
          setAllowed(false);
          setTimeout(() => {
            performSecureSignOut();
          }, 1500);
        }
      } catch (error) {
        console.error("Periodic device check failed:", error);
      }
    }, 30000); // ตรวจสอบทุก 30 วินาที

    return () => clearInterval(intervalCheck);
  }, [user, allowed]);

  // แสดง loading screen
  if (loading || allowed === null) {
    return (
      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
        <div className="text-center">
          <Loader />
          <p className="mt-4 text-gray-600">กำลังตรวจสอบการเข้าถึง...</p>
        </div>
      </div>
    );
  }

  // ไม่อนุญาตให้เข้าใช้งาน
  if (allowed === false) {
    return (
      <div className="absolute inset-0 bg-red-50 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-md mx-4">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">ไม่อนุญาตให้เข้าใช้งาน</h2>
          <p className="text-gray-600 mb-2">อุปกรณ์นี้ไม่ได้รับอนุญาตให้เข้าใช้งานบัญชีนี้</p>
          <p className="text-sm text-gray-500">หรือ session หมดอายุแล้ว</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-600 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-600">Error: {error.message}</p>
        </div>
      </div>
    );
  }

  const isClassOwner = selectedClass && user ? selectedClass.owner_email === user.email : false;

  return (
    <div>
      <div className="flex justify-center h-screen">
        <div className="flex flex-col gap-4 mt-15 xl:flex-row">
          <div className="md:hidden flex items-center justify-center">
            {currectPang !== 'view' && (
              <div className="max-h-fit">
                <AddClassPopup />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-y-4">
            <div className="flex max-h-fit items-center justify-center">
              <ClassSection
                onPageChange={setCurrectPang}
                onClassSelect={setSelectedClass}
                onClassChange={(newClassData) => setSelectedClass(newClassData)}
              />
            </div>
            <div className="flex max-h-fit items-center justify-center">
              {currectPang === 'view' && selectedClass && (
                <div className="max-h-fit">
                  <AttendanceSummaryModal classData={selectedClass} isOwner={isClassOwner} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}