'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getFingerprint } from '@/utils/getFingerprint';
import { ClassData } from '@/types/classDetailTypes';
import AttendanceSummaryModal from '@/components/UserInterface/AttenSummary';
import ClassSection from '@/components/UserInterface/ClassSection';
import Loader from '@/components/Loader/Loader';

export default function DashboardPage() {
  const [currectPang, setCurrectPang] = useState<'myclass' | 'class' | 'view'>('myclass');
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [user, loading, error] = useAuthState(auth);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const router = useRouter();

  // ✅ แก้ไข: ใช้ useCallback เพื่อป้องกัน re-render
  const performSecureSignOut = useCallback(async (): Promise<void> => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error("Sign out failed:", error);
      window.location.href = '/login';
    }
  }, [router]);

  // ✅ แก้ไข: ย้าย verifyDeviceAccess ออกมาเป็น separate function
  const verifyDeviceAccess = useCallback(async (userEmail: string): Promise<boolean> => {
    try {
      const currentFingerprint = await getFingerprint();
      if (!currentFingerprint) {
        console.log("ไม่พบ fingerprint, อนุญาตให้ผ่าน");
        return true;  // ไม่มี fingerprint ก็ผ่าน
      }

      const deviceDocRef = doc(db, 'deviceFingerprints', currentFingerprint);
      const deviceSnap = await getDoc(deviceDocRef);

      if (!deviceSnap.exists()) {
        // ไม่มีข้อมูล fingerprint นี้ใน DB → อนุญาตให้ผ่าน
        console.log("ไม่พบข้อมูล fingerprint ในฐานข้อมูล, อนุญาตให้ผ่าน");
        return true;
      }

      const data = deviceSnap.data();
      const storedEmail = data.email;
      const expireAt = data.expireAt;

      if (expireAt && expireAt.toMillis() < Date.now()) {
        console.warn("session หมดอายุ");
        return false;
      }

      if (storedEmail !== userEmail) {
        console.warn("อุปกรณ์นี้ผูกกับ email อื่น");
        return false;
      }

      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }, []);

  // ✅ แก้ไข: เพิ่ม dependencies ที่ถูกต้อง
  useEffect(() => {
    if (loading) return;

    if (!user) {
      setAllowed(false);
      router.replace('/login');
      return;
    }

    if (!user.email) {
      console.error("User has no email.");
      setAllowed(false);
      performSecureSignOut();
      return;
    }

    verifyDeviceAccess(user.email).then((result) => {
      if (result) {
        setAllowed(true);
      } else {
        toast.error('อุปกรณ์นี้ถูกใช้กับบัญชีอื่นแล้ว ไม่อนุญาตให้เข้าสู่ระบบ');
        setAllowed(false);
        setTimeout(() => {
          performSecureSignOut();
        }, 2000);
      }
    }).catch((err) => {
      console.error("Error during device verification:", err);
      toast.error('เกิดข้อผิดพลาดในการตรวจสอบอุปกรณ์');
      setAllowed(false);
      performSecureSignOut();
    });
  }, [loading, user, router, performSecureSignOut, verifyDeviceAccess]);

  // ✅ แก้ไข: เพิ่ม proper type annotation
  const handleClassChange = useCallback((newClassData: ClassData): void => {
    setSelectedClass(newClassData);
  }, []);

  const handleClassSelect = useCallback((classData: ClassData | null): void => {
    setSelectedClass(classData);
  }, []);

  const handlePageChange = useCallback((page: 'myclass' | 'class' | 'view'): void => {
    setCurrectPang(page);
  }, []);

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

  if (allowed === false) {
    return (
      <div className="absolute inset-0 bg-red-50 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-md mx-4">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-red-600 mb-2">ไม่อนุญาตให้เข้าใช้งาน</h2>
          <p className="text-gray-600 mb-2">อุปกรณ์นี้ถูกใช้กับบัญชีอื่น</p>
          <p className="text-sm text-gray-500">กรุณาใช้บัญชีที่ตรงกับอุปกรณ์นี้</p>
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
      <div className="flex justify-center">
          <div className="flex flex-col gap-y-4 md:h-140 h-90">
            <div className="flex items-center justify-center">
              <ClassSection
                onPageChange={handlePageChange}
                onClassSelect={handleClassSelect}
                onClassChange={handleClassChange}
              />
            </div>
            <div className="flex max-h-fit items-center justify-center">
              {currectPang === 'view' && selectedClass && (
                <div>
                  <AttendanceSummaryModal classData={selectedClass} isOwner={isClassOwner} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}