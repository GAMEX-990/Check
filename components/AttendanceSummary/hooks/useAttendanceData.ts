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
  const normalizeId = (id: string) => String(id ?? "").trim().replace(/\s+/g, "");



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

  

      const classLateThreshold: number | undefined =
        typeof classDocData?.lateThresholdMinutes === 'number'
          ? classDocData.lateThresholdMinutes
          : undefined;

      // Process attendance data (ส่งค่า lateThreshold ของคลาสเข้าไป)
      const studentAttendanceMap = processAttendanceData(
        dailyCheckedInRecord,
        currentUserId,
        isOwner,
        classLateThreshold
      );

      // ถ้าไม่ใช่เจ้าของ ให้กรองเฉพาะนักเรียนของตัวเอง
      let studentsToProcess = allStudents;
      if (!isOwner && currentUserId) {
        const keys = new Set(Array.from(studentAttendanceMap.keys()));
        studentsToProcess = allStudents.filter(s => keys.has(normalizeId(s.studentId)));
      }

      const merged = mergeStudentsWithAttendance(studentsToProcess, studentAttendanceMap);
      setAttendanceWithLateStatus(merged);
    });

    return () => unsubscribe();
  }, [classId, allStudents, currentUserId, isOwner]);

  return { attendanceWithLateStatus, totalClassDays, availableDates };
};