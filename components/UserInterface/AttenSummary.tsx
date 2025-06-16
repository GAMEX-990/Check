import { X } from "lucide-react";
import { AttendanceSummaryModalProps } from "@/types/attendanceTypes";

export const AttendanceSummaryModal = ({ 
  isOpen, 
  onClose, 
  classData, 
  attendanceSummary 
}: AttendanceSummaryModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-purple-800">สรุปการเข้าเรียน</h2>
          <button 
            onClick={onClose}
            className="text-purple-600 hover:text-purple-800"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-purple-700 text-sm">
            คลาส: {classData.name}
          </p>
          <p className="text-purple-700 text-sm">
            จำนวนนักเรียนทั้งหมด: {attendanceSummary.length} คน
          </p>
        </div>

        <div className="overflow-y-auto max-h-64">
          <div className="space-y-3">
            {attendanceSummary.map((student) => (
              <div key={student.uid} className="border-b border-purple-200 pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-purple-900">{student.name}</p>
                    <p className="text-sm text-purple-700">{student.studentId}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
                      {student.count} ครั้ง
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {attendanceSummary.length === 0 && (
          <div className="text-center py-8">
            <p className="text-purple-600">ยังไม่มีข้อมูลการเข้าเรียน</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceSummaryModal;
