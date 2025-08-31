import { motion } from "framer-motion";
import type { SummaryStudentListProps } from '../../types';
import StatusDropdown from "./StatusDropdown";

type Status = "present" | "late";
const toStatus = (s?: string): Status | undefined =>
  s === "present" || s === "late" ? s : undefined;

export const SummaryStudentList = ({
  attendanceWithLateStatus,
  totalClassDays,
  classId,     // ✅ รับผ่าน props
  dateKey,
  isOwner,
}: SummaryStudentListProps) => (
  <>
    {attendanceWithLateStatus.map((student, i) => {
      const absentDays = Math.max(0, totalClassDays - student.count);
      return (
        <motion.div
          key={student.uid}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.03 }}
          className="p-3 border rounded-lg flex justify-between"
        >
          <div>
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
          </div>
          <div>
            <StatusDropdown
              classId={classId}
              studentId={student.studentId}
              dateKey={dateKey}         // เช่น "2025-08-30"
              initialStatus={toStatus(student.status)}
              isOwner={isOwner}

            />
          </div>
        </motion.div>

      );
    })}
  </>
);