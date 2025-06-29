"use client";

import { useState } from "react";
import MyClassPage from "./MyClassPage";
import ClassPage from "./ClassPage";
import { ViewClassDetailPage } from "./ViewClassDetailPage";
import { SyncUserToFirebase } from "@/utils/userSync";
import {
  ClassSectionProps,
  ClassData,
  ClassPageType,
} from "@/types/classTypes";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const pageTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const ClassSection = ({ onPageChange, onClassSelect }: ClassSectionProps) => {
  const [page, setPage] = useState<ClassPageType>("myclass");
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);

  const handleNext = () => {
    setPage("class");
    onPageChange?.("class");
  };

  const handleBack = () => {
    setPage("myclass");
    onPageChange?.("myclass");
  };

  const handleSelectClass = (classData: ClassData) => {
    setSelectedClass(classData);
    setPage("view");
    onPageChange?.("view");
    onClassSelect?.(classData);
  };

  return (
    <div className="flex flex-col h-full">
      <SyncUserToFirebase />

      {/* Navigation Tabs */}
      <Tabs value={page} className="w-full mb-4">
        <TabsList className="grid w-full grid-cols-2 bg-purple-100 rounded-xl p-1">
          <TabsTrigger
            value="myclass"
            onClick={() => handleBack()}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              page === "myclass"
                ? "bg-purple-600 text-white shadow"
                : "text-purple-600 hover:bg-purple-200"
            }`}
          >
            My Classes
          </TabsTrigger>
          <TabsTrigger
            value="class"
            onClick={() => handleNext()}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              page === "class"
                ? "bg-purple-600 text-white shadow"
                : "text-purple-600 hover:bg-purple-200"
            }`}
          >
            All Classes
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial="initial"
          animate="animate"
          exit="exit"
          variants={pageTransition}
          className="flex-1"
        >
          {page === "myclass" && (
            <MyClassPage
              onNext={handleNext}
              onSelectClass={handleSelectClass}
            />
          )}
          {page === "class" && (
            <ClassPage onBack={handleBack} onSelectClass={handleSelectClass} />
          )}
          {page === "view" && selectedClass && (
            <ViewClassDetailPage
              classData={selectedClass}
              onBack={handleBack}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ClassSection;
