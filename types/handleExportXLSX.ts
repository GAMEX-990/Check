// utils/types.ts

export interface UserData {
    uid: string;
    name: string;
    studentId: string;
    timestamp: Date;
  }
  
  export interface ClassData {
    name: string;
    checkedInCount?: number;
  }
  
  export interface AttendanceRecord {
    [studentId: string]: {
      name: string;
      attendance: {
        [date: string]: { present: boolean; late: boolean };
      };
    };
  }
  