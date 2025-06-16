// types/attendanceTypes.ts

export interface ClassData {
  id: string;
  name: string;
  code?: string;
  subject?: string;
  owner_email: string;
  checkedInCount: number;
  checkedInRecord?: Record<string, any>;
}

export interface StudentAttendanceSummary {
  uid: string;
  name: string;
  studentId: string;
  count: number;
}

export interface AttendanceSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassData;
  attendanceSummary: StudentAttendanceSummary[];
}
