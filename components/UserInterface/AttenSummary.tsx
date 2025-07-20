"use client";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
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
import type { DailyCheckedInRecord, FirestoreTimestamp, Props, Student, StudentAttendanceWithStatus } from "@/types/SummaryTypes";



const AttendanceSummaryModal = ({ classData }: Props) => {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [attendanceWithLateStatus, setAttendanceWithLateStatus] = useState<StudentAttendanceWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Real-time listen to students subcollection
  useEffect(() => {
    if (!classData.id) return;

    const studentsRef = collection(doc(db, "classes", classData.id), "students");

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
  }, [classData.id]);

  // Real-time listen to class doc for attendance records
  useEffect(() => {
    if (!classData.id) return;
    const classRef = doc(db, "classes", classData.id);

    const unsubscribe = onSnapshot(classRef, (docSnap) => {
      if (!docSnap.exists()) {
        setAttendanceWithLateStatus([]);
        return;
      }
      const classDocData = docSnap.data() as DocumentData;
      const dailyCheckedInRecord: DailyCheckedInRecord = classDocData.dailyCheckedInRecord || {};

      // Map studentId => attendance stats
      const studentAttendanceMap = new Map<
        string,
        {
          onTime: number;
          late: number;
          total: number;
          lastTimestamp: Date | null;
          email: string;
        }
      >();

      // Helper to convert timestamp to Date
      const toDateObj = (ts: FirestoreTimestamp) => {
        if (!ts) return null;
        if (typeof ts === "string") return new Date(ts);
        if (typeof (ts as { toDate: () => Date }).toDate === "function") return (ts as { toDate: () => Date }).toDate();
        return null;
      };

      Object.keys(dailyCheckedInRecord).forEach((dateKey) => {
        const dayRecord = dailyCheckedInRecord[dateKey];

        const timestamps = Object.values(dayRecord)
          .map((record) => toDateObj(record.timestamp))
          .filter(Boolean) as Date[];

        if (timestamps.length === 0) return;

        // หาเวลาเช็คชื่อแรกของวัน (ใช้วัดสายหรือไม่)
        const earliestTime = new Date(Math.min(...timestamps.map((t) => t.getTime())));
        const lateCutoff = new Date(earliestTime.getTime() + 15 * 60 * 1000); // 15 นาที

        Object.values(dayRecord).forEach((record) => {
          const checkInTime = toDateObj(record.timestamp);
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

      // รวมข้อมูล attendance กับ students
      const merged: StudentAttendanceWithStatus[] = allStudents.map((student) => {
        const att = studentAttendanceMap.get(student.studentId);
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

      setAttendanceWithLateStatus(merged);
    });

    return () => unsubscribe();
  }, [classData.id, allStudents]);

  // คำนวณข้อมูลสำหรับกราฟและสรุป
  const totalStudents = attendanceWithLateStatus.length;
  const studentsWithAttendance = attendanceWithLateStatus.filter((s) => s.count > 0).length;
  const totalAbsent = totalStudents - studentsWithAttendance;
  const totalOnTime = attendanceWithLateStatus.reduce((sum, s) => sum + s.onTimeCount, 0);
  const totalLate = attendanceWithLateStatus.reduce((sum, s) => sum + s.lateCount, 0);

  const pieData = [
    { name: "เข้าเรียนตรงเวลา", value: totalOnTime, color: "#10B981" },
    { name: "เข้าเรียนสาย", value: totalLate, color: "#F59E0B" },
    { name: "ไม่เข้าเรียน", value: totalAbsent, color: "#EF4444" },
  ].filter((item) => item.value > 0);

  const barData = attendanceWithLateStatus
    .filter((s) => s.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((s) => ({
      name: s.name.length > 10 ? `${s.name.substring(0, 10)}...` : s.name,
      fullName: s.name,
      onTime: s.onTimeCount,
      late: s.lateCount,
      total: s.count,
      studentId: s.studentId,
    }));

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const totalCount = totalOnTime + totalLate + totalAbsent;
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
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{data.fullName}</p>
          <p className="text-sm">รหัส: {data.studentId}</p>
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
          <div className="text-purple-600">
            <Loader />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="md:w-200 w-85 h-auto border-2 border-purple-50 rounded-2xl shadow-lg p-4">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-white rounded-lg border">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  outerRadius={70}
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

          {barData.length > 0 && (
            <div className="p-4 bg-white rounded-lg border">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                  <YAxis />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="onTime" stackId="a" fill="#10B981" name="ตรงเวลา" />
                  <Bar dataKey="late" stackId="a" fill="#F59E0B" name="สาย" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="mt-6 max-h-[300px] overflow-y-auto space-y-3">
          <h3 className="text-lg font-semibold text-purple-800">รายชื่อนักเรียน</h3>
          {attendanceWithLateStatus.map((s, i) => (
            <motion.div
              key={s.uid}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="p-3 border rounded-lg"
            >
              <p className="font-semibold text-purple-900">{s.name}</p>
              <p className="text-sm text-purple-600">รหัส: {s.studentId}</p>
              {s.count > 0 ? (
                <div className="mt-1 text-sm">
                  <p>เข้าเรียนรวม {s.count} วัน</p>
                  <p className="text-green-600">ตรงเวลา: {s.onTimeCount} วัน</p>
                  {s.lateCount > 0 && <p className="text-yellow-600">สาย: {s.lateCount} วัน</p>}
                </div>
              ) : (
                <p className="text-red-600 mt-1">ยังไม่เคยเข้าเรียน</p>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default AttendanceSummaryModal;
