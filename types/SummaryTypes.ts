import { TooltipProps } from "recharts";

// สำหรับ Firestore Timestamp หรือ string
export type FirestoreTimestamp = { toDate: () => Date } | string;

export interface UserAttendance {
  uid: string;
  name: string;
  studentId: string;
  count: number;
}

export interface UserData {
  photoURL: string;
  email: string;
  uid: string;
  name: string;
  studentId: string;
}
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
  isOwner?: boolean; // เพิ่ม prop นี้
}

export interface PieChartData {
  name: string;
  value: number;
  color: string;
  fontSize?: number;
}

export interface BarChartData {
  name: string;
  fullName: string;
  onTime: number;
  late: number;
  total: number;
  absent: number;
  studentId: string;
}

export type FilterType = 'all' | 'absent-1' | 'absent-2' | 'absent-3+';

export type PieTooltipProps = TooltipProps<number, string> & {
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
};

export type BarTooltipProps = TooltipProps<number, string> & {
  payload?: Array<{
    payload: BarChartData;
  }>;
};

// สำหรับข้อมูลการเช็คชื่อในแต่ละวัน
export type DailyCheckedInRecord = {
  [dateKey: string]: {
    [uid: string]: DailyCheckedInUser;
  };
};
  