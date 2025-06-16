import { AttendanceSummaryItem, CheckedInUser } from "@/types/classTypes";
import { Timestamp } from "firebase/firestore";

// ฟังก์ชันสร้างสรุปการเข้าเรียน
export const createAttendanceSummary = (users: CheckedInUser[]): AttendanceSummaryItem[] => {
    const userAttendance: { [key: string]: AttendanceSummaryItem } = {};
    
    users.forEach(user => {
      if (userAttendance[user.uid]) {
        userAttendance[user.uid].count += 1;
        // Update last check-in time if this check-in is newer
        const currentTimestamp = typeof user.timestamp === 'string' 
          ? user.timestamp 
          : user.timestamp instanceof Timestamp
            ? user.timestamp.toDate().toISOString() 
            : user.timestamp instanceof Date 
              ? user.timestamp.toISOString() 
              : new Date().toISOString();
        userAttendance[user.uid].lastCheckIn = currentTimestamp;
      } else {
        userAttendance[user.uid] = {
          uid: user.uid,
          displayName: user.displayName || '',
          email: user.email || '',
          photoURL: user.photoURL,
          studentId: user.studentId,
          count: 1,
          lastCheckIn: typeof user.timestamp === 'string' 
            ? user.timestamp 
            : user.timestamp instanceof Timestamp
              ? user.timestamp.toDate().toISOString() 
              : user.timestamp instanceof Date 
                ? user.timestamp.toISOString() 
                : new Date().toISOString()
        };
      }
    });
  
    return Object.values(userAttendance).sort((a, b) => b.count - a.count);
  };