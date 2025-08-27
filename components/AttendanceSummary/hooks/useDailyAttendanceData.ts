import { useEffect, useState } from "react";
import { doc, onSnapshot, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { processDailyAttendance } from '../utils/dataProcessing';
import type { 
  Student, 
  DailyAttendanceData, 
  DailyCheckedInRecord 
} from '../types';

// ===== CUSTOM HOOK: DAILY ATTENDANCE DATA =====
export const useDailyAttendanceData = (
  classId: string, 
  selectedDate: string | null, 
  allStudents: Student[],
  currentUserId?: string,
  isOwner: boolean = true
) => {
  const [dailyAttendanceData, setDailyAttendanceData] = useState<DailyAttendanceData | null>(null);

  useEffect(() => {
    if (!selectedDate || !classId) {
      setDailyAttendanceData(null);
      return;
    }

    const classRef = doc(db, "classes", classId);
    const unsubscribe = onSnapshot(classRef, (docSnap) => {
      if (!docSnap.exists()) return;

      const classDocData = docSnap.data() as DocumentData;
      const dailyCheckedInRecord: DailyCheckedInRecord = classDocData.dailyCheckedInRecord || {};
      const dayRecord = dailyCheckedInRecord[selectedDate];

      if (!dayRecord) {
        setDailyAttendanceData({
          date: selectedDate,
          onTimeStudents: [],
          lateStudents: [],
          totalStudents: allStudents.length,
          attendanceCount: 0
        });
        return;
      }

      const processedData = processDailyAttendance(
        dayRecord, 
        selectedDate, 
        allStudents.length,
        currentUserId,
        isOwner
      );
      setDailyAttendanceData(processedData);
    });

    return () => unsubscribe();
  }, [selectedDate, classId, allStudents, currentUserId, isOwner]);

  return dailyAttendanceData;
};