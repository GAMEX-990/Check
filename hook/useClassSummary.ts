import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  onSnapshot, 
  DocumentData 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';

// Types (เหมือนเดิม)
interface SummaryData {
  className: string;
  totalStudents: number;
  totalClassDays: number;
  totalOnTime: number;
  totalLate: number;
  totalAbsent: number;
  isLoading: boolean;
  error: string | null;
  availableDates: string[];
}

interface Student {
  id: string;
  name: string;
  studentId: string;
  status: string;
}

interface AttendanceRecord {
  uid: string;
  studentId: string;
  name: string;
  email: string;
  timestamp: any;
}

interface DailyCheckedInRecord {
  [date: string]: {
    [studentId: string]: AttendanceRecord;
  };
}

// Helper functions (เหมือนเดิม)
const convertTimestampToDate = (ts: any): Date | null => {
  if (!ts) return null;
  if (typeof ts === "string") return new Date(ts);
  if (typeof (ts as { toDate: () => Date }).toDate === "function") {
    return (ts as { toDate: () => Date }).toDate();
  }
  return null;
};

const LATE_THRESHOLD_MINUTES = 15;

// ===== MAIN HOOK =====
export const useClassSummary = (classId: string, isOwner: boolean = true): SummaryData => {
  const [summaryData, setSummaryData] = useState<SummaryData>({
    className: '',
    totalStudents: 0, // เปลี่ยนจาก 0 เป็นค่าที่เหมาะสม
    totalClassDays: 0,
    totalOnTime: 0,
    totalLate: 0,
    totalAbsent: 0,
    isLoading: true,
    error: null,
    availableDates: []
  });

  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const auth = getAuth();
  const currentUserId = auth.currentUser?.uid;

  // แยก useEffect สำหรับโหลด students
  useEffect(() => {
    if (!classId) return;

    const classRef = doc(db, 'classes', classId);
    const studentsRef = collection(classRef, 'students');

    const unsubscribeStudents = onSnapshot(
      studentsRef,
      (studentsSnapshot) => {
        const students = studentsSnapshot.docs.map((doc) => ({
          ...(doc.data() as Student),
          id: doc.id,
        }));
        setAllStudents(students);
        
        // อัปเดต totalStudents ทันที
        setSummaryData(prev => ({
          ...prev,
          totalStudents: isOwner ? students.length : 1
        }));
      },
      (error) => {
        console.error('Error listening to students:', error);
        setAllStudents([]);
      }
    );

    return () => unsubscribeStudents();
  }, [classId, isOwner]);

  // useEffect แยกสำหรับโหลด class data
  useEffect(() => {
    if (!classId) {
      setSummaryData(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'Class ID is required' 
      }));
      return;
    }

    const classRef = doc(db, 'classes', classId);

    const unsubscribeClass = onSnapshot(
      classRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          setSummaryData(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: 'Class not found' 
          }));
          return;
        }

        const classData = docSnap.data() as DocumentData;
        const dailyCheckedInRecord: DailyCheckedInRecord = classData.dailyCheckedInRecord || {};
        
        // Get available dates
        const dates = Object.keys(dailyCheckedInRecord).sort((a, b) => 
          new Date(b).getTime() - new Date(a).getTime()
        );

        // Process attendance data
        const attendanceStats = processAttendanceData(
          dailyCheckedInRecord, 
          currentUserId, 
          isOwner,
          allStudents // ใช้ allStudents จาก state
        );

        setSummaryData(prev => ({
          ...prev,
          className: classData.name || 'ไม่ระบุชื่อคลาส',
          totalClassDays: dates.length,
          totalOnTime: attendanceStats.totalOnTime,
          totalLate: attendanceStats.totalLate,
          totalAbsent: attendanceStats.totalAbsent,
          availableDates: dates,
          isLoading: false,
          error: null
        }));
      },
      (error) => {
        setSummaryData(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: error.message 
        }));
      }
    );

    return () => unsubscribeClass();
  }, [classId, currentUserId, isOwner, allStudents]); // เพิ่ม allStudents ใน dependency

  return summaryData;
};

// Helper function (เหมือนเดิม)
const processAttendanceData = (
  dailyCheckedInRecord: DailyCheckedInRecord,
  currentUserId?: string,
  isOwner: boolean = true,
  allStudents: Student[] = []
) => {
  let totalOnTime = 0;
  let totalLate = 0;
  const studentsWithAttendance = new Set<string>();

  Object.keys(dailyCheckedInRecord).forEach((dateKey) => {
    const dayRecord = dailyCheckedInRecord[dateKey];
    const timestamps = Object.values(dayRecord)
      .map((record) => convertTimestampToDate(record.timestamp))
      .filter(Boolean) as Date[];

    if (timestamps.length === 0) return;

    const earliestTime = new Date(Math.min(...timestamps.map((t) => t.getTime())));
    const lateCutoff = new Date(earliestTime.getTime() + LATE_THRESHOLD_MINUTES * 60 * 1000);

    Object.values(dayRecord).forEach((record) => {
      if (!isOwner && record.uid !== currentUserId) {
        return;
      }

      const checkInTime = convertTimestampToDate(record.timestamp);
      if (!checkInTime) return;

      const isLate = checkInTime.getTime() > lateCutoff.getTime();
      
      if (isLate) {
        totalLate++;
      } else {
        totalOnTime++;
      }

      studentsWithAttendance.add(record.studentId);
    });
  });

  const totalStudents = isOwner ? allStudents.length : 1;
  const studentsWithAttendanceCount = studentsWithAttendance.size;
  const totalAbsent = Math.max(0, totalStudents - studentsWithAttendanceCount);

  return {
    totalOnTime,
    totalLate,
    totalAbsent
  };
};