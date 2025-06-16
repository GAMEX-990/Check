"use client";

import { useState } from "react";
import MyClassPage from "./MyClassPage";
import ClassPage from "./ClassPage";
import { ViewClassDetailPage } from "./ViewClassDetailPage";
import { ClassData } from "@/types";
import { SyncUserToFirebase } from "@/utils/userSync";

interface ClassSectionProps {
  onPageChange?: (page: "myclass" | "class" | "view") => void;
  onClassSelect?: (classData: ClassData) => void;
}

//ส่วนเอาไว้เลื่อนคลาสต่างๆ
const ClassSection = ({ onPageChange, onClassSelect }: ClassSectionProps) => {
  const [page, setPage] = useState<"myclass" | "class" | "view">("myclass");
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);

  const handleNext = () => {
    setPage("class");
    onPageChange?.("class");
  } 
  const handleBack = () => {
    setPage("myclass");
    onPageChange?.("myclass");
  }
  const handleSelectClass = (classData: ClassData) => {
    setSelectedClass(classData);
    setPage("view");
    onPageChange?.("view");
    onClassSelect?.(classData);
  };

//ส่วนนี้คือหน้าที่ User เห็น
  return (
    <>
      <SyncUserToFirebase />
      {page === "myclass" && <MyClassPage onNext={handleNext} onSelectClass={handleSelectClass} />}
      {page === "class" && <ClassPage onBack={handleBack} onSelectClass={handleSelectClass} />}
      {page === "view" && selectedClass && <ViewClassDetailPage classData={selectedClass} onBack={handleBack} />}
    </>
  );
};

export default ClassSection;