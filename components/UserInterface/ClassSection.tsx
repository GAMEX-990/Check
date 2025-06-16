"use client";

import { useState } from "react";
import MyClassPage from "./MyClassPage";
import ClassPage from "./ClassPage";
import { ViewClassDetailPage } from "./ViewClassDetailPage";
import { SyncUserToFirebase } from "@/utils/userSync";
import { ClassSectionProps, ClassData, ClassPageType } from "@/types/classTypes";

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
    <>
      <SyncUserToFirebase />
      {page === "myclass" && <MyClassPage onNext={handleNext} onSelectClass={handleSelectClass} />}
      {page === "class" && <ClassPage onBack={handleBack} onSelectClass={handleSelectClass} />}
      {page === "view" && selectedClass && (
        <ViewClassDetailPage classData={selectedClass} onBack={handleBack} />
      )}
    </>
  );
};

export default ClassSection;
