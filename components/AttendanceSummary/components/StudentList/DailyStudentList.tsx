import { motion } from "framer-motion";
import { formatTimeThai } from '../../utils/dateHelpers';
import type { DailyStudentListProps } from '../../types';

// ===== DAILY STUDENT LIST COMPONENT =====
export const DailyStudentList = ({ dailyAttendanceData }: DailyStudentListProps) => {
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