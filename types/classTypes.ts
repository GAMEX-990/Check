// types/classTypes.ts
import type { ClassData } from "./classDetailTypes";

export type ClassPageType = "myclass" | "class" | "view";

export interface ClassSectionProps {
  onPageChange?: (page: ClassPageType) => void;
  onClassSelect?: (classData: ClassData) => void;
}
  