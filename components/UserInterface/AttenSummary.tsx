"use client";
import { motion } from "framer-motion";
import { StudentAttendanceSummary } from "@/types/attendanceTypes";
import { ClassData } from "@/types/classTypes";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export const AttendanceSummaryModal = ({
  classData,
  attendanceSummary,
}: {
  classData: ClassData;
  attendanceSummary: StudentAttendanceSummary[];
}) => {
  const totalStudents = attendanceSummary.length;
  const studentsWithAttendance = attendanceSummary.filter(student => student.count > 0).length;
  const studentsWithoutAttendance = totalStudents - studentsWithAttendance;

  // Data for Pie Chart
  const pieData = [
    { name: 'เข้าเรียน', value: studentsWithAttendance, color: '#10B981' },
    { name: 'ไม่เข้าเรียน', value: studentsWithoutAttendance, color: '#EF4444' }
  ];

  // Data for Bar Chart - Top 10 students with highest attendance
  const barData = attendanceSummary
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(student => ({
      name: student.name.length > 10 ? `${student.name.substring(0, 10)}...` : student.name,
      fullName: student.name,
      count: student.count,
      studentId: student.studentId
    }));

  // Custom tooltip for bar chart
  const CustomTooltip = ({ active, payload }: { 
    active?: boolean; 
    payload?: Array<{
      value: number;
      payload: {
        fullName: string;
        studentId: string;
        name: string;
        count: number;
      };
    }>;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-purple-200 rounded-lg shadow-lg">
          <p className="font-semibold text-purple-900">{payload[0].payload.fullName}</p>
          <p className="text-sm text-purple-600">รหัส: {payload[0].payload.studentId}</p>
          <p className="text-sm text-green-600">เข้าเรียน: {payload[0].value} วัน</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div className="md:w-200 w-100 h-auto border-2 border-purple-50 rounded-2xl shadow-lg p-4">
        <div></div>
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h2 className="text-xl font-bold text-purple-800 text-center mb-4">สรุปการเข้าเรียน</h2>

          <div className="mb-6 bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-purple-800 font-medium text-lg mb-1">คลาส: {classData.name}</p>
            <p className="text-purple-700 text-sm">นักเรียนทั้งหมด: {totalStudents} คน</p>
            <p className="text-purple-700 text-sm">เข้าเรียนแล้ว: {studentsWithAttendance} คน</p>
          </div>

          {/* Charts Section */}
          {totalStudents > 0 && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white border border-purple-100 rounded-lg p-4"
              >
                <div>
                  <h3 className="text-lg font-semibold text-purple-800 mb-3 text-center">สัดส่วนการเข้าเรียน</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                        style={{
                          fontSize: '14px'
                        }}
                        outerRadius={50}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Bar Chart */}
              {barData.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="bg-white border border-purple-100 rounded-lg p-4"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-purple-800 mb-3 text-center">นักเรียนที่เข้าเรียนมากที่สุด</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Student List */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            <h3 className="text-lg font-semibold text-purple-800 mb-3">รายชื่อนักเรียน</h3>
            {attendanceSummary.map((student, index) => (
              <motion.div
                key={student.uid}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="border border-purple-100 rounded-lg p-3 hover:bg-purple-50 transition-colors"
              >
                <p className="font-semibold text-purple-900">{student.name}</p>
                <p className="text-sm text-purple-600">รหัส: {student.studentId}</p>
                {student.email && (
                  <p className="text-xs text-purple-500">{student.email}</p>
                )}
                <p className={`mt-1 text-sm font-bold ${student.count > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {student.count > 0 ? `เข้าเรียน ${student.count} วัน` : 'ยังไม่เคยเข้าเรียน'}
                </p>
                {student.lastAttendance && (
                  <p className="text-xs text-purple-500">ล่าสุด: {new Date(student.lastAttendance).toLocaleDateString('th-TH')}</p>
                )}
              </motion.div>
            ))}

            {attendanceSummary.length === 0 && (
              <div className="text-center py-6 text-purple-500">ยังไม่มีข้อมูลการเข้าเรียน</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AttendanceSummaryModal;