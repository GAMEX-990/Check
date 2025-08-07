"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MyClassPage from "./MyClassPage";
import ClassPage from "./ClassPage";
import { ViewClassDetailPage } from "./ViewClassDetailPage";
import { SyncUserToFirebase } from "@/utils/userSync";
import { ClassPageType } from "@/types/classTypes";
import { ClassData } from "@/types/classDetailTypes";
import type { ClassSectionProps } from "@/types/classTypes";
import SmoothTabSwitcher from "../ui/SmoothTabSwitcher";

// **เพิ่ม onClassChange prop**
const ClassSection = ({ onPageChange, onClassSelect, onClassChange }: ClassSectionProps & {
  onClassChange?: (newClassData: ClassData) => void
}) => {
  const [page, setPage] = useState<ClassPageType>("class");
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);

  const handleSelectClass = (classData: ClassData) => {
    setSelectedClass(classData);
    setPage("view");
    onPageChange?.("view");
    onClassSelect?.(classData);
  };

  const handlePageChange = (newPage: ClassPageType) => {
    setPage(newPage);
    onPageChange?.(newPage);
  };

  // **เพิ่ม function สำหรับจัดการการเปลี่ยนคลาสจาก ViewClassDetailPage**
  const handleClassChangeFromView = (newClassData: ClassData) => {
    setSelectedClass(newClassData);
    onClassSelect?.(newClassData);
    onClassChange?.(newClassData); // ส่งไปยัง parent component
  };

  // ข้อมูล tabs สำหรับ SmoothTabSwitcher
  const tabs = [
    { id: "myclass", label: "My Classes" },
    { id: "class", label: "Classes" },
  ];

  return (
    <div className="relative">
      <SyncUserToFirebase />
      {page === "view" && selectedClass ? (
        <ViewClassDetailPage
          classData={selectedClass}
          onBack={() => {
            setPage("myclass");
            onPageChange?.("myclass");
          }}
          onClassChange={handleClassChangeFromView} // **ส่ง function ไปยัง ViewClassDetailPage**
        />
      ) : (
        <div className="md:h-165 md:w-290 w-95 h-150 border-2 border-purple-50 rounded-2xl shadow-lg p-4 relative overflow-hidden z-0">
          {/* Smooth Tab Switcher */}
          <div className="flex justify-center mb-4">
            <SmoothTabSwitcher
              tabs={tabs}
              activeTab={page}
              onTabChange={(tabId) => handlePageChange(tabId as ClassPageType)}
              className="mb-0"
            />
          </div>
          {/* Content with Smooth Transitions */}
          <div className="overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ opacity: 0, x: page === "myclass" ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: page === "myclass" ? 50 : -50 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                className="max-h-full max-w-full"
              >
                {page === "myclass" ? (
                  <MyClassPage
                    page={page}
                    onSelectClass={handleSelectClass}
                    onPageChange={handlePageChange}
                  />
                ) : (
                  <ClassPage
                    page={page}
                    onSelectClass={handleSelectClass}
                    onPageChange={handlePageChange}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassSection;