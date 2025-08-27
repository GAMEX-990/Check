import { useEffect, useState } from "react";
import { doc, onSnapshot, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { processAttendanceData, mergeStudentsWithAttendance } from '../utils/dataProcessing';
import type { 
  Student, 
  StudentAttendanceWithStatus, 
  DailyCheckedInRecord 
} from '../types';

// ===== CUSTOM HOOK: ATTENDANCE DATA =====
export const useAttendanceData = (
  classId: string, 
  allStudents: Student[], 
  currentUserId?: string,
  isOwner: boolean = true
) => {
  const [attendanceWithLateStatus, setAttendanceWithLateStatus] = useState<StudentAttendanceWithStatus[]>([]);
  const [totalClassDays, setTotalClassDays] = useState(0);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  useEffect(() => {
    if (!classId) return;

    const classRef = doc(db, "classes", classId);
    const unsubscribe = onSnapshot(classRef, (docSnap) => {
      if (!docSnap.exists()) {
        setAttendanceWithLateStatus([]);
        setAvailableDates([]);
        return;
      }

      const classDocData = docSnap.data() as DocumentData;
      const dailyCheckedInRecord: DailyCheckedInRecord = classDocData.dailyCheckedInRecord || {};
      const dates = Object.keys(dailyCheckedInRecord).sort((a, b) => 
        new Date(b).getTime() - new Date(a).getTime()
      );
      
      setTotalClassDays(dates.length);
      setAvailableDates(dates);

      // Process attendance data
      const studentAttendanceMap = processAttendanceData(
        dailyCheckedInRecord, 
        currentUserId, 
        isOwner
      );
      
      // ถ้าไม่ใช่เจ้าของ ให้กรองเฉพาะนักเรียนของตัวเอง
      let studentsToProcess = allStudents;
      if (!isOwner && currentUserId) {
        // หา student record ของ current user
        studentsToProcess = allStudents.filter(student => 
          studentAttendanceMap.has(student.studentId)
        );
      }
      
      const merged = mergeStudentsWithAttendance(studentsToProcess, studentAttendanceMap);
      setAttendanceWithLateStatus(merged);
    });

    return () => unsubscribe();
  }, [classId, allStudents, currentUserId, isOwner]);

  return { attendanceWithLateStatus, totalClassDays, availableDates };
};