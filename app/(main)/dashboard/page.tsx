'use client';

import React, { useState, useEffect } from 'react';
import Usercard from '@/components/UserInterface/Usercard';
import ClassSection from '@/components/UserInterface/ClassSection';
import AddClassPopup from '@/components/FromUser/ButtonCreate';
import AttendanceSummaryModal from '@/components/UserInterface/AttenSummary';
import Loader from '@/components/Loader/Loader';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import type { ClassData } from '@/types/classTypes';
import { useAttendanceSummary } from '@/hook/useAttendanceSummary';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getFingerprint } from '@/utils/getFingerprint';

const verifyDeviceAccess = async (uid: string) => {
  const currentFingerprint = await getFingerprint();
  const docRef = doc(db, 'devices', uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    // ถ้ายังไม่มี fingerprint ในฐานข้อมูล
    // ให้บันทึก fingerprint ใหม่เลย
    await setDoc(docRef, {
      fingerprint: currentFingerprint,
      createdAt: new Date(),
    });
    return; // ลงทะเบียนเสร็จ จบการตรวจสอบ
  }

  const data = docSnap.data();
  const savedFingerprint = data.fingerprint;
  const createdAt = data.createdAt?.toMillis?.() ?? 0;

  const now = Date.now();
  const FOUR_HOURS = 4 * 60 * 60 * 1000; // 4 ชั่วโมง (เดิม)
  if (savedFingerprint !== currentFingerprint) {
    const expired = now - createdAt > FOUR_HOURS;

    if (!expired) {
      throw new Error('อุปกรณ์นี้ไม่ใช่อุปกรณ์ที่ลงทะเบียนไว้ในช่วง 4 ชั่วโมงนี้');
    }

    // หมดอายุ → ลบของเก่าและเก็บ fingerprint ใหม่
    await setDoc(docRef, {
      fingerprint: currentFingerprint,
      createdAt: new Date(),
    });
  }
};


export default function DashboardPage() {
  const [currectPang, setCurrectPang] = useState<'myclass' | 'class' | 'view'>('myclass');
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const { attendanceSummary } = useAttendanceSummary(selectedClass, currectPang === 'view');
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return; // รอโหลด user ให้เรียบร้อยก่อน

    verifyDeviceAccess(user.uid).catch((err) => {
      toast.error(err.message || 'อุปกรณ์นี้ไม่ได้รับอนุญาต');
      signOut(auth);
      router.push('/login');
    });
  }, [user, loading, router]);

  // โหลดอยู่
  if (loading) {
    return (
      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // error
  if (error) {
    return <div className="flex justify-center items-center h-screen">Error: {error.message}</div>;
  }

  return (
    <div>
      <div className="flex justify-center h-screen">
        <div className="flex flex-col gap-4 mt-15 md:flex-row">
          {currectPang !== 'view' && (
            <div className="max-h-fit">
              <Usercard />
            </div>
          )}
          <div className="md:hidden flex items-center justify-center">
            {currectPang !== 'view' && (
              <div className="max-h-fit">
                <AddClassPopup />
              </div>
            )}
          </div>

          <div className="flex max-h-fit items-center justify-center">
            <ClassSection onPageChange={setCurrectPang} onClassSelect={setSelectedClass} />
          </div>

          {/* <div className="hidden md:flex">
            {currectPang !== 'view' && (
              <div className="max-h-fit">
                <AddClassPopup />
              </div>
            )}
          </div> */}

          <div>
            {currectPang === 'view' && selectedClass && (
              <div className="max-h-fit">
                <AttendanceSummaryModal classData={selectedClass} attendanceSummary={attendanceSummary} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
