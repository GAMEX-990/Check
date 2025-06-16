import { Timestamp } from "firebase/firestore";

// Firebase Auth and User Types
export interface UserData {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role?: 'teacher' | 'student';
  institution?: string;
  studentId?: string;
}

// Class Data Types
export interface ClassData {
  id: string;
  name: string;
  description: string;
  createdBy: string;
  creatorName: string;
  createdAt: Date | string;
  members?: string[];
  checkedInRecord?: Record<string, CheckedInUser>;
}

export interface CheckedInUser {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  timestamp: Timestamp | Date | string;
  studentId?: string;
}

// Attendance Summary Types
export interface AttendanceSummaryItem {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  studentId?: string;
  count: number;
  lastCheckIn: string;
}

// Error Types
export interface FirebaseError extends Error {
  code?: string;
  message: string;
}

// QR Scanner Types
export interface QRScannerProps {
  onDetected: (result: string) => void;
  onError: (error: Error) => void;
  user: UserData;
}

export interface UseCameraScannerProps {
  onDetected: (result: string) => void;
  onError: (error: Error) => void;
}
