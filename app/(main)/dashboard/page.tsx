'use client';

import React, { useState } from 'react';
import Usercard from '@/components/UserInterface/Usercard';
import ClassSection from '@/components/UserInterface/ClassSection';
import AddClassPopup from '@/components/FromUser/ButtonCreate';
import AttendanceSummaryModal from '@/components/UserInterface/AttenSummary';
import Loader from '@/components/Loader/Loader';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import type { ClassData } from '@/types/classTypes';
import { useAttendanceSummary } from '@/hook/useAttendanceSummary';

export default function DashboardPage() {
  const [currectPang, setCurrectPang] = useState<'myclass' | 'class' | 'view'>('myclass');
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const { attendanceSummary } = useAttendanceSummary(selectedClass, currectPang === 'view');
  const [, loading, error] = useAuthState(auth);
  // เมื่อเปลี่ยนหน้าเป็น "view" และเลือกคลาส → โหลดข้อมูล summary


  // เปลี่ยนหน้า
  const handlePageChange = (page: 'myclass' | 'class' | 'view') => {
    setCurrectPang(page);
  };

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
        <div className="flex flex-col md:flex-row gap-4 mt-15">
          {currectPang !== 'view' && (
            <div className="max-h-fit">
              <Usercard />
            </div>
          )}
          <div className='md:hidden'>
            {currectPang !== 'view' && (
              <div className="max-h-fit">
                <AddClassPopup />
              </div>
            )}
          </div>

          <div className="w-100 h-auto flex-shrink-0 max-h-fit">
            <ClassSection onPageChange={handlePageChange} onClassSelect={setSelectedClass} />
          </div>

          <div className='hidden md:flex'>
            {currectPang !== 'view' && (
              <div className="max-h-fit">
                <AddClassPopup />
              </div>
            )}
          </div>

          <div className=''>
            {currectPang === 'view' && selectedClass && (
              <div className='max-h-fit'>
                <AttendanceSummaryModal
                  classData={selectedClass}
                  attendanceSummary={attendanceSummary}
                />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
