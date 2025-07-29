// types/classDetailTypes.ts

import { Timestamp } from "firebase/firestore";

export interface AttendanceRecord {
  uid: string;
  name: string;
  studentId: string;
  email: string;
  date: string;
  timestamp?: Timestamp;
  status?: string;
}

export interface ClassData {
    id: string;
    name: string;
    code?: string;
    subject?: string;
    owner_email: string;
    checkedInCount: number;
    checkedInRecord?: Record<string, any>; // ถ้าคุณรู้โครงสร้าง detail ตรงนี้ บอกได้เลยครับ
    checkedInMembers?: string[]; // ✅ เพิ่มบรรทัดนี้
  }
  
  export interface CheckedInUser {
    uid: string;
    name: string;
    studentId: string;
    email: string;
    status: string;
    timestamp: Date;
    date: string;
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
  