import { LATE_THRESHOLD_MINUTES } from './constants';
import { convertTimestampToDate } from './dateHelpers';
import type {
  DailyCheckedInRecord,
  AttendanceRecord,
  ProcessedAttendanceData,
  Student,
  StudentAttendanceWithStatus,
  DailyAttendanceData
} from '../types';

// ===== DATA PROCESSING FUNCTIONS =====
export const processAttendanceData = (
  dailyCheckedInRecord: DailyCheckedInRecord, 
  currentUserId?: string, 
  isOwner: boolean = true
) => {
  const studentAttendanceMap = new Map<string, ProcessedAttendanceData>();

  Object.keys(dailyCheckedInRecord).forEach((dateKey) => {
    const dayRecord = dailyCheckedInRecord[dateKey];
    const timestamps = Object.values(dayRecord)
      .map((record) => convertTimestampToDate(record.timestamp))
      .filter(Boolean) as Date[];

    if (timestamps.length === 0) return;

    const earliestTime = new Date(Math.min(...timestamps.map((t) => t.getTime())));
    const lateCutoff = new Date(earliestTime.getTime() + LATE_THRESHOLD_MINUTES * 60 * 1000);

    Object.values(dayRecord).forEach((record) => {
      // ถ้าไม่ใช่เจ้าของคลาส ให้แสดงเฉพาะข้อมูลของตัวเอง
      if (!isOwner && record.uid !== currentUserId) {
        return; // ข้ามไปถ้าไม่ใช่ข้อมูลของตัวเอง
      }

      const checkInTime = convertTimestampToDate(record.timestamp);
      if (!checkInTime) return;

      const studentId = record.studentId;
      const isLate = checkInTime.getTime() > lateCutoff.getTime();

      if (!studentAttendanceMap.has(studentId)) {
        studentAttendanceMap.set(studentId, {
          onTime: 0,
          late: 0,
          total: 0,
          lastTimestamp: null,
          email: record.email || "",
        });
      }

      const studentData = studentAttendanceMap.get(studentId)!;
      if (isLate) studentData.late++;
      else studentData.onTime++;
      studentData.total++;

      if (!studentData.lastTimestamp || checkInTime > studentData.lastTimestamp) {
        studentData.lastTimestamp = checkInTime;
      }
    });
  });

  return studentAttendanceMap;
};

export const mergeStudentsWithAttendance = (
  allStudents: Student[], 
  attendanceMap: Map<string, ProcessedAttendanceData>
): StudentAttendanceWithStatus[] => {
  return allStudents.map((student) => {
    const att = attendanceMap.get(student.studentId);
    return {
      uid: student.id,
      name: student.name,
      studentId: student.studentId,
      email: att?.email || "",
      count: att?.total || 0,
      lateCount: att?.late || 0,
      onTimeCount: att?.onTime || 0,
      lastAttendance: att?.lastTimestamp ? att.lastTimestamp.toISOString() : null,
      status: student.status,
    };
  });
};

export const processDailyAttendance = (
  dayRecord: Record<string, AttendanceRecord>, 
  selectedDate: string, 
  totalStudents: number,
  currentUserId?: string,
  isOwner: boolean = true
): DailyAttendanceData => {
  const timestamps = Object.values(dayRecord)
    .map((record) => convertTimestampToDate(record.timestamp))
    .filter(Boolean) as Date[];

  if (timestamps.length === 0) {
    return {
      date: selectedDate,
      onTimeStudents: [],
      lateStudents: [],
      totalStudents,
      attendanceCount: 0
    };
  }

  const earliestTime = new Date(Math.min(...timestamps.map((t) => t.getTime())));
  const lateCutoff = new Date(earliestTime.getTime() + LATE_THRESHOLD_MINUTES * 60 * 1000);

  const onTimeStudents: StudentAttendanceWithStatus[] = [];
  const lateStudents: StudentAttendanceWithStatus[] = [];

  Object.values(dayRecord).forEach((record) => {
    // ถ้าไม่ใช่เจ้าของคลาส ให้แสดงเฉพาะข้อมูลของตัวเอง
    if (!isOwner && record.uid !== currentUserId) {
      return;
    }

    const checkInTime = convertTimestampToDate(record.timestamp);
    if (!checkInTime) return;

    const isLate = checkInTime.getTime() > lateCutoff.getTime();
    const student: StudentAttendanceWithStatus = {
      uid: record.uid || '',
      name: record.name,
      studentId: record.studentId,
      email: record.email || '',
      count: 1,
      lateCount: isLate ? 1 : 0,
      onTimeCount: isLate ? 0 : 1,
      lastAttendance: checkInTime.toISOString(),
      status: 'active'
    };

    if (isLate) {
      lateStudents.push(student);
    } else {
      onTimeStudents.push(student);
    }
  });

  // Sort by check-in time
  const sortByTime = (a: StudentAttendanceWithStatus, b: StudentAttendanceWithStatus) =>
    new Date(a.lastAttendance!).getTime() - new Date(b.lastAttendance!).getTime();

  onTimeStudents.sort(sortByTime);
  lateStudents.sort(sortByTime);

  return {
    date: selectedDate,
    onTimeStudents,
    lateStudents,
    totalStudents: isOwner ? totalStudents : 1, // ถ้าไม่ใช่เจ้าของ totalStudents = 1
    attendanceCount: onTimeStudents.length + lateStudents.length
  };
};