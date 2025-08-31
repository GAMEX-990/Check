import type { 
    BarChartData, 
    BarTooltipProps, 
    DailyCheckedInRecord,
    DailyCheckedInUser,
    FilterType, 
    FirestoreTimestamp, 
    PieChartData, 
    PieTooltipProps, 
    Props, 
    Student, 
    StudentAttendanceWithStatus 
  } from "@/types/SummaryTypes";
  
  // ===== LOCAL INTERFACES =====
  export interface DailyAttendanceData {
    date: string;
    onTimeStudents: StudentAttendanceWithStatus[];
    lateStudents: StudentAttendanceWithStatus[];
    totalStudents: number;
    attendanceCount: number;
  }
  
  export interface AttendanceRecord {
    uid: string;
    studentId: string;
    name: string;
    email: string;
    timestamp: FirestoreTimestamp;
  }
  
  export interface ProcessedAttendanceData {
    onTime: number;
    late: number;
    total: number;
    lastTimestamp: Date | null;
    email: string;
  }
  
  export interface SummaryInfoProps {
    classData: { name: string };
    isViewingDaily: boolean;
    selectedDate: string | null;
    dailyAttendanceData: DailyAttendanceData | null;
    totalStudents: number;
    totalClassDays: number;
    totalOnTimeSummary: number;
    totalLateSummary: number;
    totalAbsent: number;
  }
  
  export interface StudentListProps {
    isViewingDaily: boolean;
    dailyAttendanceData: DailyAttendanceData | null;
    attendanceWithLateStatus: StudentAttendanceWithStatus[];
    totalClassDays: number;
    isOwner: boolean;
    classId: string;
    dateKey: string;
  }
  
  export interface ViewModeToggleProps {
    viewMode: 'summary' | 'daily';
    setViewMode: (mode: 'summary' | 'daily') => void;
    availableDates: string[];
    selectedDate: string | null;
    setSelectedDate: (date: string | null) => void;
  }
  
  export interface DailyStudentListProps {
    dailyAttendanceData: DailyAttendanceData | null;
  }
  
  export interface SummaryStudentListProps {
    attendanceWithLateStatus: StudentAttendanceWithStatus[];
    totalClassDays: number;
    classId: string;      // ✅ เพิ่ม
    dateKey: string; 
    isOwner: boolean; 
  }
  
  // Re-export original types
  export type {
    BarChartData,
    BarTooltipProps,
    DailyCheckedInRecord,
    DailyCheckedInUser,
    FilterType,
    FirestoreTimestamp,
    PieChartData,
    PieTooltipProps,
    Props,
    Student,
    StudentAttendanceWithStatus
  };