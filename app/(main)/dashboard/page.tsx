'use client'
import Usercard from '@/components/UserInterface/Usercard';
import React, { useEffect, useState } from 'react'
import ClassSection from '@/components/UserInterface/ClassSection';
import AddClassPopup from '@/components/FromUser/ButtonCreate';
import CreateQRCodeAndUpload from '@/components/FromUser/FusionButtonqrup';



export default function DashboardPage() {
  const [currectPang, SetCurrectPang] = useState<"myclass" | "class" | "view">("myclass");
  const [selectedClass, setSelectedClass] = useState<any>(null);


  const handlePageChange = (page: "myclass" | "class" | "view") => {
    SetCurrectPang(page);
  };

  const handleSelectClass = (classData: any) => {
    setSelectedClass(classData);
  };

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
             <CreateQRCodeAndUpload classId={selectedClass.id} />
          </div>
        )}
        <div>
          <ClassSection onPageChange={handlePageChange} onClassSelect={handleSelectClass} />
        </div>
      </div>
    </div>
  );
}
