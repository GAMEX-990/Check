import { X } from "lucide-react";
import { AttendanceSummaryModalProps } from "@/types/attendanceTypes";
import { motion } from "framer-motion";

export const AttendanceSummaryModal = ({ 
  isOpen, 
  onClose, 
  classData, 
  attendanceSummary 
}: AttendanceSummaryModalProps) => {
  if (!isOpen) return null;

  // คำนวณสถิติการเข้าเรียน
  const totalStudents = attendanceSummary.length;
  const studentsWithAttendance = attendanceSummary.filter(student => student.count > 0).length;

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-20">
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-10"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.4,
          scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
        }}
      >
        <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-purple-800">สรุปการเข้าเรียนรายวัน</h2>
            <button 
              onClick={onClose}
              className="text-purple-600 hover:text-purple-800 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="mb-4 bg-purple-50 rounded-lg p-4">
            <p className="text-purple-800 font-medium text-lg mb-2">
              คลาส: {classData.name}
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                <span className="text-purple-700">จำนวนนักเรียนทั้งหมด: {totalStudents} คน</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-purple-700">เข้าเรียน: {studentsWithAttendance} คน</span>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            <div className="space-y-3">
              {attendanceSummary.map((student) => (
                <div key={student.uid} className="border border-purple-100 rounded-lg p-3 hover:bg-purple-50 transition-colors">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium text-purple-900">{student.name}</p>
                      <p className="text-sm text-purple-600">รหัส: {student.studentId}</p>
                      {student.email && (
                        <p className="text-xs text-purple-500 mt-1">{student.email}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className={`px-3 py-2 rounded-full text-sm font-bold ${
                        student.count > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {student.count > 0 ? `${student.count} วัน` : 'ยังไม่เข้าเรียน'}
                      </div>
                      {student.count > 0 && student.lastAttendance && (
                        <p className="text-xs text-purple-500 mt-1">
                          ครั้งล่าสุด: {new Date(student.lastAttendance).toLocaleDateString('th-TH')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* แสดงสถานะการเข้าเรียน */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      student.count > 0 ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className={`text-xs ${
                      student.count > 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {student.count > 0 ? 'มีการเข้าเรียน' : 'ไม่มีการเข้าเรียน'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {attendanceSummary.length === 0 && (
            <div className="text-center py-12 flex-1 flex items-center justify-center">
              <div>
                <div className="text-6xl mb-4">📋</div>
                <p className="text-purple-600 text-lg font-medium">ยังไม่มีข้อมูลการเข้าเรียน</p>
                <p className="text-purple-500 text-sm mt-2">รอให้นักเรียนเช็คชื่อเข้าคลาสก่อน</p>
              </div>
            </div>
          )}

          {/* ปุ่มปิด */}
          <div className="mt-4 pt-4 border-t border-purple-200">
            <button
              onClick={onClose}
              className="w-full bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-colors font-medium"
            >
              ปิด
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AttendanceSummaryModal;