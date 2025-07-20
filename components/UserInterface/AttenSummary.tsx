"use client";
import { motion } from "framer-motion";
import { StudentAttendanceSummary } from "@/types/attendanceTypes";
import { ClassData } from "@/types/classTypes";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Student {
  id: string;
  studentId: string;
  name: string;
  status: string;
}

interface AttendanceStatus {
  present: boolean;
  late: boolean;
}

interface StudentAttendanceWithStatus extends StudentAttendanceSummary {
  lateCount: number;
  onTimeCount: number;
}

// ประเภทข้อมูลการเช็คชื่อจากฐานข้อมูล
interface DailyCheckedInRecord {
  [dateKey: string]: {
    [uid: string]: {
      uid: string;
      studentId: string;
      timestamp: any; // Firestore Timestamp
      name: string;
      email: string;
      status: string;
      date: string;
    };
  };
}

export const AttendanceSummaryModal = ({
  classData,
  attendanceSummary,
}: {
  classData: ClassData;
  attendanceSummary: StudentAttendanceSummary[];
}) => {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceWithLateStatus, setAttendanceWithLateStatus] = useState<StudentAttendanceWithStatus[]>([]);

  // ดึงรายชื่อนักเรียนทั้งหมดจาก subcollection
  useEffect(() => {
    const fetchAllStudents = async () => {
      if (!classData.id) return;
      
      try {
        setIsLoading(true);
        const classRef = doc(db, "classes", classData.id);
        const studentsCollectionRef = collection(classRef, "students");
        const studentsSnapshot = await getDocs(studentsCollectionRef);
        
        const students: Student[] = studentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Student));
        
        setAllStudents(students);
      } catch (error) {
        console.error("Error fetching students:", error);
        setAllStudents([]);
      }
    };

    fetchAllStudents();
  }, [classData.id]);

  // ดึงข้อมูลการเช็คชื่อพร้อมสถานะ late จากฐานข้อมูล
  useEffect(() => {
    const fetchAttendanceWithLateStatus = async () => {
      if (!classData.id || attendanceSummary.length === 0) return;
      
      try {
        const classRef = doc(db, "classes", classData.id);
        const classDoc = await getDoc(classRef);
        
        if (!classDoc.exists()) {
          console.error("Class document not found");
          return;
        }
        
        const classDocData = classDoc.data();
        const dailyCheckedInRecord: DailyCheckedInRecord = classDocData.dailyCheckedInRecord || {};
        
        // สร้าง Map เพื่อเก็บข้อมูลการเช็คชื่อของแต่ละนักเรียน
        const studentAttendanceMap = new Map<string, { onTime: number; late: number; total: number }>();
        
        // วนลูปผ่านทุกวันที่มีการเช็คชื่อ
        Object.keys(dailyCheckedInRecord).forEach(dateKey => {
          const dayRecord = dailyCheckedInRecord[dateKey];
          
          // หาเวลาแรกสุดของวันนั้น (เพื่อใช้เป็นเกณฑ์การมาสาย)
          const timestamps = Object.values(dayRecord)
            .map(record => record.timestamp?.toDate?.())
            .filter(Boolean) as Date[];
          
          if (timestamps.length === 0) return;
          
          const earliestTime = new Date(Math.min(...timestamps.map(t => t.getTime())));
          const lateCutoff = new Date(earliestTime.getTime() + 15 * 60 * 1000); // 15 นาทีหลังจากคนแรก
          
          // วนลูปผ่านแต่ละคนที่เช็คชื่อในวันนั้น
          Object.values(dayRecord).forEach(record => {
            const checkInTime = record.timestamp?.toDate?.();
            if (!checkInTime) return;
            
            const studentId = record.studentId;
            const isLate = checkInTime.getTime() > lateCutoff.getTime();
            
            if (!studentAttendanceMap.has(studentId)) {
              studentAttendanceMap.set(studentId, { onTime: 0, late: 0, total: 0 });
            }
            
            const studentData = studentAttendanceMap.get(studentId)!;
            if (isLate) {
              studentData.late++;
            } else {
              studentData.onTime++;
            }
            studentData.total++;
          });
        });
        
        // รวมข้อมูลกับ attendanceSummary
        const updatedAttendanceSummary = attendanceSummary.map(student => {
          const lateData = studentAttendanceMap.get(student.studentId);
          return {
            ...student,
            lateCount: lateData?.late || 0,
            onTimeCount: lateData?.onTime || 0
          };
        });
        
        setAttendanceWithLateStatus(updatedAttendanceSummary);
        
      } catch (error) {
        console.error("Error fetching attendance with late status:", error);
        // Fallback ไปใช้ข้อมูลเดิม
        setAttendanceWithLateStatus(attendanceSummary.map(student => ({
          ...student,
          lateCount: 0,
          onTimeCount: student.count
        })));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendanceWithLateStatus();
  }, [classData.id, attendanceSummary]);

  // รวมข้อมูลนักเรียนทั้งหมดกับข้อมูลการเข้าเรียน
  const completeAttendanceSummary = allStudents.map(student => {
    const attendanceRecord = attendanceWithLateStatus.find(
      record => record.studentId === student.studentId
    );
    
    return {
      uid: attendanceRecord?.uid || student.id,
      name: student.name,
      studentId: student.studentId,
      email: attendanceRecord?.email || '',
      count: attendanceRecord?.count || 0,
      lateCount: attendanceRecord?.lateCount || 0,
      onTimeCount: attendanceRecord?.onTimeCount || 0,
      lastAttendance: attendanceRecord?.lastAttendance || null,
      status: student.status
    };
  });

  const totalStudents = completeAttendanceSummary.length;
  const studentsWithAttendance = completeAttendanceSummary.filter(student => student.count > 0).length;
  const studentsWithoutAttendance = totalStudents - studentsWithAttendance;
  
  // คำนวณจำนวนคนที่มาตรงเวลาและมาสาย (จากข้อมูลจริง)
  const totalOnTime = completeAttendanceSummary.reduce((sum, student) => sum + student.onTimeCount, 0);
  const totalLate = completeAttendanceSummary.reduce((sum, student) => sum + student.lateCount, 0);
  const totalAbsent = studentsWithoutAttendance;

  // Data for Enhanced Pie Chart with Late Status
  const pieData = [
    { name: 'เข้าเรียนตรงเวลา', value: totalOnTime, color: '#10B981' },
    { name: 'เข้าเรียนสาย', value: totalLate, color: '#F59E0B' },
    { name: 'ไม่เข้าเรียน', value: totalAbsent, color: '#EF4444' }
  ].filter(item => item.value > 0);

  // Data for Bar Chart - Top 10 students with highest attendance
  const barData = completeAttendanceSummary
    .filter(student => student.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(student => ({
      name: student.name.length > 10 ? `${student.name.substring(0, 10)}...` : student.name,
      fullName: student.name,
      onTime: student.onTimeCount,
      late: student.lateCount,
      total: student.count,
      studentId: student.studentId
    }));

  // Custom tooltip for pie chart
  const CustomPieTooltip = ({ active, payload }: { 
    active?: boolean; 
    payload?: Array<{
      value: number;
      name: string;
      color: string;
    }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const totalCount = totalOnTime + totalLate + totalAbsent;
      const percentage = totalCount > 0 ? ((data.value / totalCount) * 100).toFixed(1) : '0.0';
      return (
        <div className="bg-white p-3 border border-purple-200 rounded-lg shadow-lg">
          <p className="font-semibold" style={{ color: data.color }}>{data.name}</p>
          <p className="text-sm text-gray-600">จำนวน: {data.value} {data.name === 'ไม่เข้าเรียน' ? 'คน' : 'วัน'}</p>
          <p className="text-sm text-gray-600">สัดส่วน: {percentage}%</p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for bar chart
  const CustomBarTooltip = ({ active, payload }: { 
    active?: boolean; 
    payload?: Array<{
      value: number;
      dataKey: string;
      payload: {
        fullName: string;
        studentId: string;
        onTime: number;
        late: number;
        total: number;
      };
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-purple-200 rounded-lg shadow-lg">
          <p className="font-semibold text-purple-900">{data.fullName}</p>
          <p className="text-sm text-purple-600">รหัス: {data.studentId}</p>
          <p className="text-sm text-green-600">ตรงเวลา: {data.onTime} วัน</p>
          <p className="text-sm text-yellow-600">สาย: {data.late} วัน</p>
          <p className="text-sm text-blue-600">รวม: {data.total} วัน</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="md:w-200 w-85 h-auto border-2 border-purple-50 rounded-2xl shadow-lg p-4">
        <div className="flex items-center justify-center h-40">
          <div className="text-purple-600">กำลังโหลดข้อมูル...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="md:w-200 w-85 h-auto border-2 border-purple-50 rounded-2xl shadow-lg p-4">
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
            <div className="flex justify-center gap-4 mt-2 text-sm">
              <p className="text-green-600 font-medium">ตรงเวลา: {totalOnTime} วัน</p>
              <p className="text-yellow-600 font-medium">สาย: {totalLate} วัน</p>
              <p className="text-red-600 font-medium">ขาดเรียน: {totalAbsent} คน</p>
            </div>
          </div>

          {/* Charts Section */}
          {totalStudents > 0 && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Enhanced Pie Chart */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-white border border-purple-100 rounded-lg p-4"
              >
                <div>
                  <h3 className="text-lg font-semibold text-purple-800 mb-3 text-center">สัดส่วนการเข้าเรียน</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                        style={{
                          fontSize: '12px'
                        }}
                        outerRadius={70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>

              {/* Enhanced Bar Chart */}
              {barData.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="bg-white border border-purple-100 rounded-lg p-4"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-purple-800 mb-3 text-center">นักเรียนที่เข้าเรียนมากที่สุด</h3>
                    <ResponsiveContainer width="100%" height={250}>
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
                        <Tooltip content={<CustomBarTooltip />} />
                        <Bar dataKey="onTime" stackId="a" fill="#10B981" name="ตรงเวลา" />
                        <Bar dataKey="late" stackId="a" fill="#F59E0B" name="สาย" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Enhanced Student List */}
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            <h3 className="text-lg font-semibold text-purple-800 mb-3">รายชื่อนักเรียน</h3>
            {completeAttendanceSummary.map((student, index) => (
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
                
                {student.count > 0 ? (
                  <div className="mt-1">
                    <p className="text-sm font-bold text-blue-600">
                      เข้าเรียนรวม {student.count} วัน
                    </p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        ตรงเวลา {student.onTimeCount} วัน
                      </span>
                      {student.lateCount > 0 && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                          สาย {student.lateCount} วัน
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-sm font-bold text-red-600">ยังไม่เคยเข้าเรียน</p>
                )}
                
                {student.lastAttendance && (
                  <p className="text-xs text-purple-500 mt-1">
                    ล่าสุด: {new Date(student.lastAttendance).toLocaleDateString('th-TH')}
                  </p>
                )}
              </motion.div>
            ))}

            {completeAttendanceSummary.length === 0 && (
              <div className="text-center py-6 text-purple-500">ยังไม่มีข้อมูลนักเรียนในระบบ</div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AttendanceSummaryModal;