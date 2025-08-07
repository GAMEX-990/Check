"use client";
import { motion } from "framer-motion";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Funnel, BarChart3 } from 'lucide-react';
import {
  collection,
  doc,
  onSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import Loader from "../Loader/Loader";
import FilterDropdown from "../ui/FilterDropdown";
import type { 
  BarChartData, 
  BarTooltipProps, 
  DailyCheckedInRecord, 
  FilterType, 
  FirestoreTimestamp, 
  PieChartData, 
  PieTooltipProps, 
  Props, 
  Student, 
  StudentAttendanceWithStatus 
} from "@/types/SummaryTypes";

// ===== INTERFACES =====
interface DailyAttendanceData {
  date: string;
  onTimeStudents: StudentAttendanceWithStatus[];
  lateStudents: StudentAttendanceWithStatus[];
  totalStudents: number;
  attendanceCount: number;
}

interface AttendanceRecord {
  uid: string;
  studentId: string;
  name: string;
  email: string;
  timestamp: FirestoreTimestamp;
}

interface ProcessedAttendanceData {
  onTime: number;
  late: number;
  total: number;
  lastTimestamp: Date | null;
  email: string;
}

interface SummaryInfoProps {
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

interface StudentListProps {
  isViewingDaily: boolean;
  dailyAttendanceData: DailyAttendanceData | null;
  attendanceWithLateStatus: StudentAttendanceWithStatus[];
  totalClassDays: number;
}

// ===== CONSTANTS =====
const LATE_THRESHOLD_MINUTES = 15;

// ===== HELPER FUNCTIONS =====
const convertTimestampToDate = (ts: FirestoreTimestamp): Date | null => {
  if (!ts) return null;
  if (typeof ts === "string") return new Date(ts);
  if (typeof (ts as { toDate: () => Date }).toDate === "function") {
    return (ts as { toDate: () => Date }).toDate();
  }
  return null;
};

const formatDateThai = (date: string): string => {
  return new Date(date).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const formatTimeThai = (date: string): string => {
  return new Date(date).toLocaleTimeString('th-TH');
};

// ===== CUSTOM HOOKS =====
const useStudentsData = (classId: string) => {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;

    const studentsRef = collection(doc(db, "classes", classId), "students");
    const unsubscribe = onSnapshot(
      studentsRef,
      (snapshot) => {
        const students: Student[] = snapshot.docs.map((doc) => ({
          ...(doc.data() as Student),
          id: doc.id,
        }));
        setAllStudents(students);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error listening to students:", error);
        setAllStudents([]);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [classId]);

  return { allStudents, isLoading };
};

const useAttendanceData = (
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

const useDailyAttendanceData = (
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

// ===== DATA PROCESSING FUNCTIONS =====
const processAttendanceData = (
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

const mergeStudentsWithAttendance = (
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

const processDailyAttendance = (
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

// ===== CHART COMPONENTS =====
const CustomPieTooltip = ({ active, payload }: PieTooltipProps) => {
  if (!active || !payload?.length) return null;

  const data = payload[0];
  const totalCount = payload.reduce((sum, item) => sum + (item.value || 0), 0);
  const percentage = totalCount > 0 ? ((data.value / totalCount) * 100).toFixed(1) : "0.0";

  return (
    <div className="bg-white p-3 border rounded-lg shadow-lg">
      <p className="font-semibold" style={{ color: data.color }}>
        {data.name}
      </p>
      <p className="text-sm text-gray-600">จำนวน: {data.value}</p>
      <p className="text-sm text-gray-600">สัดส่วน: {percentage}%</p>
    </div>
  );
};

const CustomBarTooltip = ({ active, payload, isViewingDaily }: BarTooltipProps & { isViewingDaily: boolean }) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-white p-3 border rounded-lg shadow-lg">
      <p className="font-semibold">{data.fullName}</p>
      <p className="text-sm">รหัส: {data.studentId}</p>
      <p className="text-sm text-green-600">ตรงเวลา: {data.onTime} วัน</p>
      <p className="text-sm text-yellow-600">สาย: {data.late} วัน</p>
      {!isViewingDaily && <p className="text-sm text-red-600">ขาด: {data.absent} วัน</p>}
      <p className="text-sm text-blue-600">รวมเข้าเรียน: {data.total} วัน</p>
    </div>
  );
};

// ===== SUB COMPONENTS =====
const ViewModeToggle = ({ 
  viewMode, 
  setViewMode, 
  availableDates, 
  selectedDate, 
  setSelectedDate 
}: {
  viewMode: 'summary' | 'daily';
  setViewMode: (mode: 'summary' | 'daily') => void;
  availableDates: string[];
  selectedDate: string | null;
  setSelectedDate: (date: string | null) => void;
}) => (
  <div className="flex gap-2">
    <button
      onClick={() => {
        setViewMode('summary');
        setSelectedDate(null); // รีเซ็ตวันที่เมื่อเปลี่ยนเป็น summary mode
      }}
      className={`flex items-center p-2 rounded-lg text-sm transition-all ${
        viewMode === 'summary' 
          ? 'bg-purple-600 text-white shadow-lg' 
          : 'text-purple-600 hover:bg-purple-200 shadow-lg'
      }`}
    >
      <BarChart3 size={16} />
      สรุปทั้งหมด
    </button>
    
    {availableDates.length > 0 && (
      <div className="relative">
        <select
          value={selectedDate || ''}
          onChange={(e) => {
            const date = e.target.value;
            setSelectedDate(date);
            if (date) setViewMode('daily');
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-purple-600  shadow-lg outline-none cursor-pointer"
        >
          <option value="">เลือกวันที่</option>
          {availableDates.map((date) => (
            <option key={date} value={date}>
              {formatDateThai(date)}
            </option>
          ))}
        </select>
      </div>
    )}
  </div>
);

const SummaryInfo = ({ 
  classData, 
  isViewingDaily, 
  selectedDate, 
  dailyAttendanceData, 
  totalStudents, 
  totalClassDays, 
  totalOnTimeSummary, 
  totalLateSummary, 
  totalAbsent 
}: SummaryInfoProps) => (
  <div className="mb-6 bg-purple-50 rounded-lg p-4 text-center">
    <p className="text-purple-800 font-medium text-lg mb-1">คลาส: {classData.name}</p>
    {isViewingDaily ? (
      <div>
        <p className="text-purple-700 text-sm">
          วันที่: {formatDateThai(selectedDate!)} | 
          นักเรียนทั้งหมด: {dailyAttendanceData?.totalStudents} คน
        </p>
        <div className="flex justify-center gap-4 mt-2 text-sm">
          <p className="text-green-600 font-medium">
            ตรงเวลา: {dailyAttendanceData?.onTimeStudents.length || 0} คน
          </p>
          <p className="text-yellow-600 font-medium">
            สาย: {dailyAttendanceData?.lateStudents.length || 0} คน
          </p>
          <p className="text-red-600 font-medium">
            ขาดเรียน: {(dailyAttendanceData?.totalStudents || 0) - (dailyAttendanceData?.attendanceCount || 0)} คน
          </p>
        </div>
      </div>
    ) : (
      <div>
        <p className="text-purple-700 text-sm">
          นักเรียนทั้งหมด: {totalStudents} คน | วันเรียนทั้งหมด: {totalClassDays} วัน
        </p>
        <div className="flex justify-center gap-4 mt-2 text-sm">
          <p className="text-green-600 font-medium">ตรงเวลา: {totalOnTimeSummary} วัน</p>
          <p className="text-yellow-600 font-medium">สาย: {totalLateSummary} วัน</p>
          <p className="text-red-600 font-medium">ขาดเรียน: {totalAbsent} คน</p>
        </div>
      </div>
    )}
  </div>
);

const StudentList = ({ 
  isViewingDaily, 
  dailyAttendanceData, 
  attendanceWithLateStatus, 
  totalClassDays 
}: StudentListProps) => (
  <div className="mt-6 max-h-[300px] overflow-y-auto space-y-3">
    <h3 className="text-lg font-semibold text-purple-800">
      {isViewingDaily ? 'รายชื่อผู้เข้าเรียน' : 'รายชื่อนักเรียน'}
    </h3>
    
    {isViewingDaily ? (
      <DailyStudentList dailyAttendanceData={dailyAttendanceData} />
    ) : (
      <SummaryStudentList 
        attendanceWithLateStatus={attendanceWithLateStatus} 
        totalClassDays={totalClassDays} 
      />
    )}
  </div>
);

const DailyStudentList = ({ dailyAttendanceData }: { dailyAttendanceData: DailyAttendanceData | null }) => {
  if (!dailyAttendanceData || (dailyAttendanceData.onTimeStudents.length === 0 && dailyAttendanceData.lateStudents.length === 0)) {
    return (
      <div className="text-center text-gray-500 py-8">
        ไม่มีข้อมูลการเข้าเรียนในวันที่เลือก
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* On-time students */}
      {dailyAttendanceData.onTimeStudents.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-green-600 mb-2">
            ตรงเวลา ({dailyAttendanceData.onTimeStudents.length} คน)
          </h4>
          {dailyAttendanceData.onTimeStudents.map((student, i) => (
            <motion.div
              key={student.uid + 'ontime'}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="p-3 border rounded-lg bg-green-50"
            >
              <p className="font-semibold text-purple-900">{student.name}</p>
              <p className="text-sm text-purple-600">รหัส: {student.studentId}</p>
              <p className="text-sm text-green-600">
                เข้าเรียน: {formatTimeThai(student.lastAttendance!)}
              </p>
            </motion.div>
          ))}
        </div>
      )}
      
      {/* Late students */}
      {dailyAttendanceData.lateStudents.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-yellow-600 mb-2">
            สาย ({dailyAttendanceData.lateStudents.length} คน)
          </h4>
          {dailyAttendanceData.lateStudents.map((student, i) => (
            <motion.div
              key={student.uid + 'late'}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (dailyAttendanceData.onTimeStudents.length + i) * 0.03 }}
              className="p-3 border rounded-lg bg-yellow-50"
            >
              <p className="font-semibold text-purple-900">{student.name}</p>
              <p className="text-sm text-purple-600">รหัส: {student.studentId}</p>
              <p className="text-sm text-yellow-600">
                เข้าเรียน: {formatTimeThai(student.lastAttendance!)} (สาย)
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const SummaryStudentList = ({ 
  attendanceWithLateStatus, 
  totalClassDays 
}: { 
  attendanceWithLateStatus: StudentAttendanceWithStatus[];
  totalClassDays: number;
}) => (
  <>
    {attendanceWithLateStatus.map((student, i) => {
      const absentDays = Math.max(0, totalClassDays - student.count);
      return (
        <motion.div
          key={student.uid}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.03 }}
          className="p-3 border rounded-lg"
        >
          <p className="font-semibold text-purple-900">{student.name}</p>
          <p className="text-sm text-purple-600">รหัส: {student.studentId}</p>
          {student.count > 0 ? (
            <div className="mt-1 text-sm">
              <p>เข้าเรียนรวม {student.count} วัน</p>
              <p className="text-green-600">ตรงเวลา: {student.onTimeCount} วัน</p>
              {student.lateCount > 0 && <p className="text-yellow-600">สาย: {student.lateCount} วัน</p>}
              {absentDays > 0 && <p className="text-red-600">ขาด: {absentDays} วัน</p>}
            </div>
          ) : (
            <div className="mt-1 text-sm">
              <p className="text-red-600">ยังไม่เคยเข้าเรียน</p>
              {totalClassDays > 0 && <p className="text-red-600">ขาด: {totalClassDays} วัน</p>}
            </div>
          )}
        </motion.div>
      );
    })}
  </>
);

// ===== MAIN COMPONENT =====
const AttendanceSummaryModal = ({ classData, isOwner = true }: Props) => {
  // States
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'summary' | 'daily'>('summary');

  // ดึง current user ID
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Custom hooks - ส่ง currentUserId และ isOwner ไปด้วย
  const { allStudents, isLoading } = useStudentsData(classData.id);
  const { attendanceWithLateStatus, totalClassDays, availableDates } = useAttendanceData(
    classData.id, 
    allStudents, 
    currentUser?.uid,
    isOwner
  );
  const dailyAttendanceData = useDailyAttendanceData(
    classData.id, 
    selectedDate, 
    allStudents,
    currentUser?.uid,
    isOwner
  );

  // Computed values
  const isViewingDaily = useMemo(
    () => viewMode === 'daily' && !!selectedDate && !!dailyAttendanceData,
    [viewMode, selectedDate, dailyAttendanceData]
  );
  
  const summaryStats = useMemo(() => {
    const totalStudents = attendanceWithLateStatus.length;
    const studentsWithAttendance = attendanceWithLateStatus.filter((s) => s.count > 0).length;
    const totalAbsent = totalStudents - studentsWithAttendance;
    const totalOnTimeSummary = attendanceWithLateStatus.reduce((sum, s) => sum + s.onTimeCount, 0);
    const totalLateSummary = attendanceWithLateStatus.reduce((sum, s) => sum + s.lateCount, 0);
    
    return { totalStudents, totalAbsent, totalOnTimeSummary, totalLateSummary };
  }, [attendanceWithLateStatus]);

  const displayStats = useMemo(() => {
    if (isViewingDaily) {
      return {
        totalOnTime: dailyAttendanceData?.onTimeStudents.length || 0,
        totalLate: dailyAttendanceData?.lateStudents.length || 0,
        totalAbsent: (dailyAttendanceData?.totalStudents || 0) - (dailyAttendanceData?.attendanceCount || 0)
      };
    }
    
    return {
      totalOnTime: summaryStats.totalOnTimeSummary,
      totalLate: summaryStats.totalLateSummary,
      totalAbsent: summaryStats.totalAbsent
    };
  }, [isViewingDaily, dailyAttendanceData, summaryStats]);

  // Chart data
  const pieData: PieChartData[] = useMemo(() => [
    { name: "เข้าเรียน", value: displayStats.totalOnTime, color: "#10B981", fontSize: 12 },
    { name: "สาย", value: displayStats.totalLate, color: "#F59E0B", fontSize: 12 },
    { name: "ขาด", value: displayStats.totalAbsent, color: "#EF4444", fontSize: 12 },
  ].filter((item) => item.value > 0), [displayStats]);

  const getFilteredBarData = useCallback((): BarChartData[] => {
    if (isViewingDaily && dailyAttendanceData) {
      return [...dailyAttendanceData.onTimeStudents, ...dailyAttendanceData.lateStudents]
        .map((s) => ({
          name: s.name.length > 10 ? `${s.name.substring(0, 10)}...` : s.name,
          fullName: s.name,
          onTime: s.onTimeCount,
          late: s.lateCount,
          total: s.count,
          absent: 0,
          studentId: s.studentId,
        }))
        .sort((a, b) => {
          const aTime = dailyAttendanceData.onTimeStudents.find(s => s.studentId === a.studentId)?.lastAttendance ||
                        dailyAttendanceData.lateStudents.find(s => s.studentId === a.studentId)?.lastAttendance;
          const bTime = dailyAttendanceData.onTimeStudents.find(s => s.studentId === b.studentId)?.lastAttendance ||
                        dailyAttendanceData.lateStudents.find(s => s.studentId === b.studentId)?.lastAttendance;
          
          if (!aTime || !bTime) return 0;
          return new Date(aTime).getTime() - new Date(bTime).getTime();
        });
    }

    const allBarData = attendanceWithLateStatus.map((s) => ({
      name: s.name.length > 10 ? `${s.name.substring(0, 10)}...` : s.name,
      fullName: s.name,
      onTime: s.onTimeCount,
      late: s.lateCount,
      total: s.count,
      absent: Math.max(0, totalClassDays - s.count),
      studentId: s.studentId,
    }));

    let filtered: BarChartData[];
    switch (filterType) {
      case 'absent-1':
        filtered = allBarData.filter(s => s.absent === 1);
        break;
      case 'absent-2':
        filtered = allBarData.filter(s => s.absent === 2);
        break;
      case 'absent-3+':
        filtered = allBarData.filter(s => s.absent >= 3);
        break;
      default:
        filtered = allBarData.filter(s => s.total > 0);
        break;
    }

    return filtered
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [isViewingDaily, dailyAttendanceData, attendanceWithLateStatus, totalClassDays, filterType]);

  const barData = getFilteredBarData();

  if (isLoading) {
    return (
      <div className="md:w-200 w-85 h-auto border-2 border-purple-50 rounded-2xl shadow-lg p-4">
        <div className="flex items-center justify-center h-40">
          <div className="text-purple-600">
            <Loader />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="md:w-200 w-100 h-auto border-2 border-purple-50 rounded-2xl shadow-lg p-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
      >
        
        {/* Header with mode toggle */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-purple-800">
            {isViewingDaily ? `${formatDateThai(selectedDate!)}` : 'สรุปเข้าเรียน'}
          </h2>
          
          <ViewModeToggle
            viewMode={viewMode}
            setViewMode={setViewMode}
            availableDates={availableDates}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </div>

        {/* Summary Info */}
        <SummaryInfo
          classData={classData}
          isViewingDaily={isViewingDaily}
          selectedDate={selectedDate}
          dailyAttendanceData={dailyAttendanceData}
          totalStudents={summaryStats.totalStudents}
          totalClassDays={totalClassDays}
          totalOnTimeSummary={summaryStats.totalOnTimeSummary}
          totalLateSummary={summaryStats.totalLateSummary}
          totalAbsent={summaryStats.totalAbsent}
        />

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="p-4 bg-white rounded-lg border">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  outerRadius={60}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="p-4 bg-white rounded-lg border relative">
            {/* Filter dropdown - แสดงเฉพาะใน summary mode */}
            {!isViewingDaily && (
              <div className="absolute top-2 right-2 z-10">
                <div className="relative">
                  <div className="absolute top-2 right-2 z-10">
                    <FilterDropdown value={filterType} onChange={(val) => setFilterType(val)} />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Funnel className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
            )}

            <div className={isViewingDaily ? "pt-4" : "pt-8"}>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip content={<CustomBarTooltip isViewingDaily={!!isViewingDaily} />} />
                    <Bar dataKey="onTime" stackId="a" fill="#10B981" name="ตรงเวลา" />
                    <Bar dataKey="late" stackId="a" fill="#F59E0B" name="สาย" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">
                  {isViewingDaily ? 'ไม่มีข้อมูลการเข้าเรียนในวันนี้' : 'ไม่มีข้อมูลนักเรียนในหมวดหมู่นี้'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Student List */}
        <StudentList
          isViewingDaily={isViewingDaily}
          dailyAttendanceData={dailyAttendanceData}
          attendanceWithLateStatus={attendanceWithLateStatus}
          totalClassDays={totalClassDays}
        />

      </motion.div>
    </div>
  );
};

export default AttendanceSummaryModal;