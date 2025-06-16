// types/classTypes.ts

export interface ClassData {
    id: string;
    name: string;
    subject: string;
    code: string;
    createdAt: Date;
    createdBy: string;
    owner_email: string;
    checkedInCount: number;
    checkedInMembers: string[]; // หากใช้ array-contains ของ Firestore ต้องเป็น string[]
    // เพิ่ม field ตามที่คุณใช้จริงใน ViewClassDetailPage, MyClassPage, etc.
  }
  
  export type ClassPageType = "myclass" | "class" | "view";
  
  export interface ClassSectionProps {
    onPageChange?: (page: ClassPageType) => void;
    onClassSelect?: (classData: ClassData) => void;
  }
  