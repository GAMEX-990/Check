'use client';

import React, { useState } from 'react';
import ClassSection from '@/components/UserInterface/ClassSection';
import AddClassPopup from '@/components/FromUser/ButtonCreate';
import Loader from '@/components/Loader/Loader';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import AttendanceSummaryModal from '@/components/UserInterface/AttenSummary';
import { ClassData } from '@/types/classDetailTypes';


export default function DashboardPage() {
  const [currectPang, setCurrectPang] = useState<'myclass' | 'class' | 'view'>('myclass');
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [user, loading, error] = useAuthState(auth);

  // **เพิ่ม function สำหรับจัดการการเปลี่ยนแปลงคลาสจาก ViewClassDetailPage**
  const handleClassChange = (newClassData: ClassData) => {
    setSelectedClass(newClassData);
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
          <div className='flex flex-col gap-y-4'>
            <div className="flex max-h-fit items-center justify-center">
              {/* **เพิ่ม onClassChange prop สำหรับ ClassSection** */}
              <ClassSection
                onPageChange={setCurrectPang}
                onClassSelect={setSelectedClass}
                onClassChange={handleClassChange}
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