'use client'
import Usercard from '@/components/UserInterface/Usercard';
import React, { useEffect, useState } from 'react'
import ClassSection from '@/components/UserInterface/ClassSection';
import AddClassPopup from '@/components/FromUser/ButtonCreate';
import CreateQRCodeAndUpload from '@/components/FromUser/FusionButtonqrup';
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { ClassData } from '@/types/classTypes';
import Loader from '@/components/Loader/Loader';



export default function DashboardPage() {
  const [currectPang, SetCurrectPang] = useState<"myclass" | "class" | "view">("myclass");
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [user, loading, error] = useAuthState(auth);
  const [delayDone,setdelayDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setdelayDone(true);
    }, 2000); // 600ms ดีเลย์
  
    return () => clearTimeout(timer);
  }, []);
  
  const handlePageChange = (page: "myclass" | "class" | "view") => {
    SetCurrectPang(page);
  };

  const handleSelectClass = (classData: ClassData) => {
    setSelectedClass(classData);
  };

  if (loading || !delayDone) {
    return <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
      <Loader />
    </div>
  }

  // แสดงข้อผิดพลาดถ้ามี
  if (error) {
    return <div className="flex justify-center items-center h-screen">Error: {error.message}</div>;
  }
  return (
    <div>
      <div className=' flex justify-center h-screen'>
        <div className='flex flex-col md:flex-row gap-4 mt-15'>
          <div>
            <Usercard />
          </div>
          {currectPang !== "view" && (
            <div className=''>
              <AddClassPopup />
            </div>
          )}
          {currectPang === "view" && selectedClass && (
            <div>
              <CreateQRCodeAndUpload
                classId={selectedClass.id}
                currentUser={user ? { uid: user.uid, email: user.email || '' } : null}
              />
            </div>
          )}
          <div className='w-100 h-auto flex-shrink-0'>
            <ClassSection onPageChange={handlePageChange} onClassSelect={handleSelectClass} />
          </div>
        </div>

      </div>
    </div>
  );
}