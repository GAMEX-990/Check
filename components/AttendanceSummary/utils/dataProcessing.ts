// components/AttendanceSummary/utils/dataProcessing.ts
import { LATE_THRESHOLD_MINUTES } from "./constants";
import { convertTimestampToDate } from "./dateHelpers";
import type {
  DailyCheckedInRecord,
  DailyCheckedInUser,
  ProcessedAttendanceData,
  Student,
  StudentAttendanceWithStatus,
  DailyAttendanceData,
} from "../types";

type Status = "present" | "late";

const normalizeId = (id: unknown): string =>
  String(id ?? "").trim().replace(/\s+/g, "");

const normalizeStatus = (s: unknown): Status | undefined => {
  if (typeof s !== "string") return undefined;
  const v = s.toLowerCase().trim();
  if (v.includes("late")) return "late";
  if (v.includes("present")) return "present";
  return undefined;
};

type AttendanceRecordWithStatus = DailyCheckedInUser;

export const processAttendanceData = (
  dailyCheckedInRecord: DailyCheckedInRecord,
  currentUserId?: string,
  isOwner: boolean = true,
  lateThresholdMinutesFromClass?: number
) => {
  const studentAttendanceMap = new Map<string, ProcessedAttendanceData>();

  Object.keys(dailyCheckedInRecord).forEach((dateKey) => {
    const dayRecord: Record<string, AttendanceRecordWithStatus> =
      dailyCheckedInRecord[dateKey];

    const timestamps = Object.values(dayRecord)
      .map((r) => convertTimestampToDate(r.timestamp))
      .filter(Boolean) as Date[];

    if (timestamps.length === 0) return;

    const earliest = new Date(Math.min(...timestamps.map((t) => t.getTime())));
    const threshold =
      typeof lateThresholdMinutesFromClass === "number"
        ? lateThresholdMinutesFromClass
        : LATE_THRESHOLD_MINUTES;
    const lateCutoff = new Date(earliest.getTime() + threshold * 60 * 1000);

    Object.values(dayRecord).forEach((record) => {
      if (!isOwner && record.uid !== currentUserId) return;

      const t = convertTimestampToDate(record.timestamp);
      if (!t) return;

      const statusNorm = normalizeStatus(record.status);
      const isLateByRecord = record?.isLate === true || statusNorm === "late";
      const isLateByTime = t.getTime() > lateCutoff.getTime();
      const isLate =
        typeof record?.isLate !== "undefined" ||
        typeof record?.status === "string"
          ? isLateByRecord
          : isLateByTime;

      const key = normalizeId(record.studentId);
      const agg =
        studentAttendanceMap.get(key) ?? {
          onTime: 0,
          late: 0,
          total: 0,
          lastTimestamp: null as Date | null,
          email: record.email || "",
        };

      if (isLate) agg.late++;
      else agg.onTime++;
      agg.total++;
      if (!agg.lastTimestamp || t > agg.lastTimestamp) agg.lastTimestamp = t;

      studentAttendanceMap.set(key, agg);
    });
  });

  return studentAttendanceMap;
};

export const mergeStudentsWithAttendance = (
  allStudents: Student[],   // ⬅️ ต้องเป็น array
  attendanceMap: Map<string, ProcessedAttendanceData>
): StudentAttendanceWithStatus[] => {
  return allStudents.map((student) => {
    const key = normalizeId(student.studentId);
    const att = attendanceMap.get(key);

    // derive สถานะจากสรุปของคน ๆ นั้น (optional)
    const statusValue: Status | undefined =
      att ? (att.late > 0 ? "late" : "present") : undefined;

    return {
      uid: student.id,
      name: student.name,
      studentId: student.studentId,
      email: att?.email ?? "",
      count: att?.total ?? 0,
      lateCount: att?.late ?? 0,
      onTimeCount: att?.onTime ?? 0,
      lastAttendance: att?.lastTimestamp
        ? att.lastTimestamp.toISOString()
        : null,
      status: statusValue, // ⬅️ ตรง type แล้ว
    };
  });
};



export const processDailyAttendance = (
  dayRecord: Record<string, AttendanceRecordWithStatus>,
  selectedDate: string,
  totalStudents: number,
  currentUserId?: string,
  isOwner: boolean = true,
  lateThresholdMinutesFromClass?: number
): DailyAttendanceData => {
  const timestamps = Object.values(dayRecord)
    .map((r) => convertTimestampToDate(r.timestamp))
    .filter(Boolean) as Date[];

  if (timestamps.length === 0) {
    return {
      date: selectedDate,
      onTimeStudents: [],
      lateStudents: [],
      totalStudents,
      attendanceCount: 0,
    };
  }

  const earliest = new Date(Math.min(...timestamps.map((t) => t.getTime())));
  const threshold =
    typeof lateThresholdMinutesFromClass === "number"
      ? lateThresholdMinutesFromClass
      : LATE_THRESHOLD_MINUTES;
  const lateCutoff = new Date(earliest.getTime() + threshold * 60 * 1000);

  const onTimeStudents: StudentAttendanceWithStatus[] = [];
  const lateStudents: StudentAttendanceWithStatus[] = [];

  Object.values(dayRecord).forEach((record) => {
    if (!isOwner && record.uid !== currentUserId) return;

    const t = convertTimestampToDate(record.timestamp);
    if (!t) return;

    const statusNorm = normalizeStatus(record.status);
    const isLateByRecord = record?.isLate === true || statusNorm === "late";
    const isLateByTime = t.getTime() > lateCutoff.getTime();
    const isLate =
      typeof record?.isLate !== "undefined" ||
      typeof record?.status === "string"
        ? isLateByRecord
        : isLateByTime;

    const s: StudentAttendanceWithStatus = {
      uid: record.uid || "",
      name: record.name,
      studentId: record.studentId,
      email: record.email || "",
      count: 1,
      lateCount: isLate ? 1 : 0,
      onTimeCount: isLate ? 0 : 1,
      lastAttendance: t.toISOString(),
      status: isLate ? "late" : "present",
    };

    (isLate ? lateStudents : onTimeStudents).push(s);
  });

  const byTime = (
    a: StudentAttendanceWithStatus,
    b: StudentAttendanceWithStatus
  ) =>
    new Date(a.lastAttendance!).getTime() -
    new Date(b.lastAttendance!).getTime();

  onTimeStudents.sort(byTime);
  lateStudents.sort(byTime);

  return {
    date: selectedDate,
    onTimeStudents,
    lateStudents,
    totalStudents: isOwner ? totalStudents : 1,
    attendanceCount: onTimeStudents.length + lateStudents.length,
  };
};
