"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MyClassPage from "./MyClassPage";
import ClassPage from "./ClassPage";
import { ViewClassDetailPage } from "./ViewClassDetailPage";
import { SyncUserToFirebase } from "@/utils/userSync";
import { ClassSectionProps, ClassData, ClassPageType } from "@/types/classTypes";

const ClassSection = ({ onPageChange, onClassSelect }: ClassSectionProps) => {
  const [page, setPage] = useState<ClassPageType>("myclass");
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

  const tabs = [
    { id: "myclass", label: "My Classes" },
    { id: "class", label: "All Classes" },
  ];

  // Smooth Tab Switcher Component
  const SmoothTabSwitcher = () => (
    <div className="relative bg-purple-100 rounded-full p-1 mb-4">
      <div className="flex relative">
        <motion.div
          className="absolute top-1 bottom-1 bg-white rounded-full shadow-lg"
          initial={false}
          animate={{
            left: page === "myclass" ? "4px" : "50%",
            right: page === "myclass" ? "50%" : "4px",
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        />

        {/* Tab Buttons */}
        {tabs.map((tab) => {
          return (
            <button
              key={tab.id}
              onClick={() => handlePageChange(tab.id as ClassPageType)}
              className="relative z-10 flex items-center gap-2 px-6 py-3 rounded-full transition-colors duration-200 justify-center "
            >
              <span className="text-purple-700 text-sm">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

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
        />
      ) : (
        <div className="w-full h-auto border-2 border-purple-50 rounded-2xl shadow-lg p-4 relative overflow-hidden">
          {/* Smooth Tab Switcher */}
          <div className="flex justify-center">
            <SmoothTabSwitcher />
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
                className="h-80"
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