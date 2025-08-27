import { formatDateThai } from '../utils/dateHelpers';
import type { SummaryInfoProps } from '../types';

// ===== SUMMARY INFO COMPONENT =====
export const SummaryInfo = ({ 
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