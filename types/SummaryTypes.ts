// สำหรับ Firestore Timestamp หรือ string
export type FirestoreTimestamp = { toDate: () => Date } | string;

// สำหรับข้อมูลการเช็คชื่อแต่ละคนในแต่ละวัน
export interface DailyCheckedInUser {
  uid: string;
  studentId: string;
  timestamp: FirestoreTimestamp;
  name: string;
  email: string;
  status: string;
  date: string;
}
export interface Student {
  id: string;
  studentId: string;
  name: string;
  status: string;
}

export interface StudentAttendanceWithStatus {
  uid: string;
  name: string;
  studentId: string;
  email: string;
  count: number;
  lateCount: number;
  onTimeCount: number;
  lastAttendance: string | null;
  status: string;
}

export interface Props {
  classData: {
    id: string;
    name: string;
  };
}
// สำหรับข้อมูลการเช็คชื่อในแต่ละวัน
export type DailyCheckedInRecord = {
  [dateKey: string]: {
    [uid: string]: DailyCheckedInUser;
  };
};
  