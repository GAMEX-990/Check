// types/classDetailTypes.ts

export interface ClassData {
    id: string;
    name: string;
    code?: string;
    subject?: string;
    owner_email: string;
    checkedInCount: number;
    checkedInRecord?: Record<string, any>; // ถ้าคุณรู้โครงสร้าง detail ตรงนี้ บอกได้เลยครับ
  }
  
  export interface CheckedInUser {
    uid: string;
    name: string;
    studentId: string;
    timestamp: Date;
  }
  
  export interface AttendanceSummaryItem {
    uid: string;
    name: string;
    studentId: string;
    count: number;
  }
  
  export interface ViewClassDetailPageProps {
    classData: ClassData;
    onBack: () => void;
    onDeleteSuccess?: () => void;
  }
  