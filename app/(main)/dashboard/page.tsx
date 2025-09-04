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
import ClassSection from '@/components/UserInterface/ClassSection';
import Loader from '@/components/Loader/Loader';
import AttendanceSummaryModal from '@/components/AttendanceSummary/AttendanceSummaryModal';
import { Menu } from 'lucide-react';

export default function DashboardPage() {
  const [currectPang, setCurrectPang] = useState<'myclass' | 'class' | 'view'>('myclass');
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [user, loading] = useAuthState(auth); // ลบ error ออก
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const WELCOME_KEY = 'welcome_dont_show_again_v1';


  // ✅ แก้ไข: ใช้ useCallback เพื่อป้องกัน re-render
  const performSecureSignOut = useCallback(async (): Promise<void> => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch {
      // ใช้ underscore แทน error เพื่อบอกว่าไม่ได้ใช้งาน
      window.location.href = '/login';
    }
  }, [router]);

  // ✅ แก้ไข: ย้าย verifyDeviceAccess ออกมาเป็น separate function
  const verifyDeviceAccess = useCallback(async (userEmail: string): Promise<boolean> => {
    try {
      const currentFingerprint = await getFingerprint();
      if (!currentFingerprint) {
        return true;  // ไม่มี fingerprint ก็ผ่าน
      }

      const deviceDocRef = doc(db, 'deviceFingerprints', currentFingerprint);
      const deviceSnap = await getDoc(deviceDocRef);

      if (!deviceSnap.exists()) {
        return true;
      }

      const data = deviceSnap.data();
      const storedEmail = data.email;
      const expireAt = data.expireAt;

      if (expireAt && expireAt.toMillis() < Date.now()) {
        return false;
      }

      if (storedEmail !== userEmail) {
        return false;
      }

      return true;
    } catch {
      // ใช้ underscore แทน error เพื่อบอกว่าไม่ได้ใช้งาน
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
    }).catch(() => {
      // ใช้ underscore แทน err เพื่อบอกว่าไม่ได้ใช้งาน
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

  // === FIRST-VISIT POPUP (per browser) ===
  const closeWelcome = useCallback(() => {
    try {
      if (dontShowAgain) {
        localStorage.setItem(WELCOME_KEY, 'hide');
      }
    } catch { }
    setShowWelcome(false);
  }, [dontShowAgain]);

  useEffect(() => {
    if (allowed === true) {
      try {
        const pref = localStorage.getItem(WELCOME_KEY);
        setShowWelcome(pref !== 'hide');
      } catch {
        // ถ้า localStorage ใช้ไม่ได้ ให้แสดงไว้ก่อน
        setShowWelcome(true);
      }
    }
  }, [allowed]);


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

      {showWelcome && (
        <div className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl w-[90%] max-w-md p-6">
            <h2 className="text-xl font-bold text-purple-700">ยินดีต้อนรับ 👋</h2>
            <p className="mt-2 text-gray-600">
              ใช้งานครั้งแรก! คุณสามารถสร้างคลาส หรือสแกน QR เพื่อเข้าร่วมคลาสได้จากหน้านี้
            </p>

            <div className="mt-4 space-y-2 text-sm text-gray-500 md:hidden">
              <p className='flex items-center'>• ไปที่แท็บ “<Menu size={20} className='pt-1' />” เพื่อสร้างคลาส</p>
              <p>• ไปที่แท็บ “MyClass” เพื่อดูคลาสที่คุณสร้าง</p>
              <p>• ไปที่แท็บ “Class” เพื่อสแกน QR เข้าคลาส</p>
            </div>
            <div className="mt-4 space-y-2 text-sm text-gray-500 hidden md:block">
              <p>• ไปที่แท็บ “Scan QR” เพื่อสแกน QR เข้าคลาส</p>
              <p>• ไปที่แท็บ “Add a class” เพื่อสร้างคลาสเรียน</p>
              <p>• ไปที่แท็บ “MyClass” เพื่อดูคลาสที่คุณสร้าง</p>
              <p>• ไปที่แท็บ “Class” เพื่อดูคลาสที่คุณเข้าร่วม</p>
            </div>

            {/* ✅ Checkbox "ไม่ต้องแสดงอีก" */}
            <label className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
              />
              ไม่ต้องแสดงอีก
            </label>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={closeWelcome}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
              >
                เริ่มต้นใช้งาน
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}