"use client";
import { motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { getAuth } from "firebase/auth";
import Loader from "../Loader/Loader";

// Import hooks
import { useStudentsData } from './hooks/useStudentsData';
import { useAttendanceData } from './hooks/useAttendanceData';
import { useDailyAttendanceData } from './hooks/useDailyAttendanceData';

// Import components
import { ViewModeToggle } from './components/ViewModeToggle';
import { SummaryInfo } from './components/SummaryInfo';
import { StudentList } from './components/StudentList';
import { PieChartSection } from './components/Charts/PieChartSection';
import { BarChartSection } from './components/Charts/BarChartSection';

// Import types
import type { 
  Props, 
  FilterType, 
  PieChartData, 
  BarChartData 
} from './types';

// ===== MAIN COMPONENT =====
const AttendanceSummaryModal = ({ classData, isOwner = true }: Props) => {
  // States
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'summary' | 'daily'>('summary');

  // Auth
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Custom hooks
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

  // Loading state
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
            {isViewingDaily ? `${selectedDate}` : 'สรุปเข้าเรียน'}
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
          <PieChartSection pieData={pieData} />

          {/* Bar Chart */}
          <BarChartSection
            barData={barData}
            isViewingDaily={isViewingDaily}
            filterType={filterType}
            onFilterChange={setFilterType}
          />
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