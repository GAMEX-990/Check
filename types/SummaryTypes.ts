import { TooltipProps } from "recharts";

/** สถานะที่ UI/DB ใช้จริง */
export type Status = "present" | "late";

/** Firestore Timestamp หรือ string (ISO) */
export type FirestoreTimestamp = { toDate: () => Date } | string;

/** ใช้ในบางจุด (ถ้าไม่ได้ใช้จะลบทิ้งได้) */
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

/** เรคอร์ดเช็คอินของ “หนึ่งคนในหนึ่งวัน” */
export interface DailyCheckedInUser {
  uid: string;
  studentId: string;
  timestamp: FirestoreTimestamp;
  name: string;
  email?: string;
  status?: Status;       // ⬅️ แคบเป็น union และ optional
  isLate?: boolean;      // ⬅️ เพิ่มไว้ให้สอดคล้องกับ DB ปัจจุบัน
  date: string;          // YYYY-MM-DD
}

/** นักเรียนใน roster ของคลาส (ไม่ผูกกับสถานะรายวัน) */
export interface Student {
  id: string;
  studentId: string;
  name: string;
  // ถ้าจำเป็นจริง ๆ ค่อยเปิดใช้:
  // status?: Status;
}

/** ข้อมูลรวมต่อคน (ใช้ในหน้าสรุป/กราฟ) */
export interface StudentAttendanceWithStatus {
  uid: string;
  name: string;
  studentId: string;
  email?: string;
  count: number;
  lateCount: number;
  onTimeCount: number;
  lastAttendance: string | null;
  status?: Status;       // ⬅️ optional (บางมุมมองเราไม่ได้ชี้สถานะวันล่าสุด)
}

export interface Props {
  classData: {
    id: string;
    name: string;
  };
  isOwner?: boolean;
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

export type FilterType = "all" | "absent-1" | "absent-2" | "absent-3+";

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

/** เรคอร์ดเช็คชื่อทั้งคลาส แยกตามวัน → ตาม uid */
export type DailyCheckedInRecord = {
  [dateKey: string]: {
    [uid: string]: DailyCheckedInUser;
  };
};
