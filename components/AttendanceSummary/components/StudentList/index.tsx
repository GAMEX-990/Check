import { DailyStudentList } from './DailyStudentList';
import { SummaryStudentList } from './SummaryStudentList';
import type { StudentListProps } from '../../types';

// ===== STUDENT LIST MAIN COMPONENT =====
export const StudentList = ({ 
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