'use client'
import Usercard from '@/components/UserInterface/Usercard';
import React, { useState } from 'react'
import ClassSection from '@/components/UserInterface/ClassSection';
import AddClassPopup from '@/components/FromUser/ButtonCreate';
import CreateQRCodeAndUpload from '@/components/FromUser/FusionButtonqrup';
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { ClassData } from '@/types/classTypes';



export default function DashboardPage() {
  const [currectPang, SetCurrectPang] = useState<"myclass" | "class" | "view">("myclass");
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [user, loading, error] = useAuthState(auth);
  const handlePageChange = (page: "myclass" | "class" | "view") => {
    SetCurrectPang(page);
  };

  const handleSelectClass = (classData: ClassData) => {
    setSelectedClass(classData);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // แสดงข้อผิดพลาดถ้ามี
  if (error) {
    return <div className="flex justify-center items-center h-screen">Error: {error.message}</div>;
  }


  return (
    <div>
      <div className='flex justify-center space-x-4 mt-5'>
        <div>
          <Usercard />
        </div>
        {currectPang !== "view" && (
          <div>
            <AddClassPopup />
          </div>
        )}
        {currectPang === "view" && selectedClass && (
            <div>
            <CreateQRCodeAndUpload 
              classId={selectedClass.id} 
              currentUser={user ? { uid: user.uid } : null} 
            />
          </div>
        )}
        <div>
          <ClassSection onPageChange={handlePageChange} onClassSelect={handleSelectClass} />
        </div>
      </div>
    </div>
  );
}
