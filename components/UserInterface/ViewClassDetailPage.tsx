import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { createAttendanceSummary } from "@/utils/Summary";
import DeleteClassModal from "./DeleteClassModal";
import AttendanceSummaryModal from "./AttenSummary";
<<<<<<< HEAD
import { ArrowLeft, Trash2, Users, Clock, CalendarDays, UserCheck } from "lucide-react";
=======
import { ArrowLeft, Trash2 } from "lucide-react";
>>>>>>> parent of c07e200 (Update dependencies and enhance UI components)
import {
  ViewClassDetailPageProps,
  CheckedInUser,
  AttendanceSummaryItem
} from "@/types/classDetailTypes";
import { motion } from "framer-motion";
import { fetchCheckedInUsersByDate } from "@/utils/fetchCheckedInUsersByDate";

<<<<<<< HEAD
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

=======
>>>>>>> parent of c07e200 (Update dependencies and enhance UI components)
export const ViewClassDetailPage = ({
  classData,
  onBack,
  onDeleteSuccess
}: ViewClassDetailPageProps) => {
  const [dailyCheckedIn, setDailyCheckedIn] = useState<
    { date: string; users: CheckedInUser[] }[]
  >([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummaryItem[]>([]);
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const currentUid = currentUser?.uid;

  useEffect(() => {
    const loadCheckedInData = async () => {
      const data = await fetchCheckedInUsersByDate(classData, currentUid);
      setDailyCheckedIn(data);

      const summary = createAttendanceSummary(
<<<<<<< HEAD
        data.flatMap((d) => d.users)
=======
        data.flatMap((d) => d.users) // รวมทุกวัน
>>>>>>> parent of c07e200 (Update dependencies and enhance UI components)
      );
      setAttendanceSummary(summary);
    };

    loadCheckedInData();
  }, [classData, currentUid]);

  const handleShowSummary = () => setShowSummary(true);
  const handleCloseSummary = () => setShowSummary(false);
  const handlsShowDeleteModal = () => setShowDeleteModal(true);
  const handleCloseDeleteModal = () => setShowDeleteModal(false);
  const handleDeleteSuccess = () => {
    onDeleteSuccess?.();
    onBack();
  };

  const isClassOwner = classData.owner_email === currentUser?.email;

  return (
    <div>
      <div className="h-auto w-100 border-2 border-purple-500 rounded-2xl p-4 relative">
        <div className="flex justify-center">
          <h1 className="text-2xl font-bold text-purple-800 text-center flex-grow">
            {classData.name}
          </h1>
<<<<<<< HEAD
          <div className="absolute right-0 space-x-2">
=======
          <div className="absolute right-0 mx-4">
>>>>>>> parent of c07e200 (Update dependencies and enhance UI components)
            {isClassOwner && (
              <button
                className="text-red-500 hover:text-red-700 p-1"
                onClick={handlsShowDeleteModal}
                title="ลบคลาส"
              >
                <Trash2 size={24} />
              </button>
            )}
<<<<<<< HEAD
            <button className="text-2xl text-purple-600 m-2" onClick={onBack}>
=======
            <button className="text-2xl text-purple-600" onClick={onBack}>
>>>>>>> parent of c07e200 (Update dependencies and enhance UI components)
              <ArrowLeft size={28} />
            </button>
          </div>
        </div>

        <div className="text-purple-800 flex justify-between m-4">
          <p>ชื่อ-สกุล</p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 1.05 }}
          >
<<<<<<< HEAD
            <ArrowLeft className="h-5 w-5" />
          </motion.button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 gap-4 p-4 border-b border-purple-100">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleShowSummary}
          className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
        >
          <UserCheck className="h-5 w-5 text-purple-600" />
          <div className="text-left">
            <p className="text-sm font-medium text-purple-900">View Attendance</p>
            <p className="text-xs text-purple-600">Summary Report</p>
          </div>
        </motion.button>
        <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
          <Users className="h-5 w-5 text-purple-600" />
          <div>
            <p className="text-sm font-medium text-purple-900">Total Check-ins</p>
            <p className="text-xs text-purple-600">{classData?.checkedInCount || 0} students</p>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="p-4"
      >
        <div className="space-y-6">
          {dailyCheckedIn.map(({ date, users }) => (
            <motion.div
              key={date}
              variants={itemVariants}
              className="space-y-3"
=======
            <button
              className="border-1 border-purple-700 p-1 rounded-4xl cursor-pointer"
              onClick={handleShowSummary}
>>>>>>> parent of c07e200 (Update dependencies and enhance UI components)
            >
              ดูสรุปการเข้าเรียน
            </button>
          </motion.div>
          <p>รหัส นศ.</p>
        </div>

        <p className="text-right text-purple-800">
          จำนวนสมาชิกที่เช็คชื่อ: {classData?.checkedInCount || 0}
        </p>

        <div className="overflow-scroll h-80 relative">
          {dailyCheckedIn.map(({ date, users }) => (
            <div key={date} className="mb-4">
              <div>
                <h2 className="text-md text-purple-700 mb-1">
                  วันที่: {new Date(date).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </h2>
              </div>
<<<<<<< HEAD
              <div className="space-y-2">
                {users.map((user) => (
                  <motion.div
                    key={user.uid + date}
                    variants={itemVariants}
                    className="bg-purple-50 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-purple-900">{user.name}</span>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-600" />
                        <span className="text-sm text-purple-600">
                          {user.timestamp.toLocaleTimeString("th-TH", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-purple-600">ID: {user.studentId}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
=======
              {users.map((user) => (
                <div key={user.uid + date}>
                  <div>
                    <p className="text-sm text-purple-900">
                      {user.timestamp.toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex flex-row justify-between mt-1">
                    <p className="text-sm text-purple-900">{user.name}</p>
                    <p className="text-sm text-purple-900">{user.studentId}</p>
                  </div>
                </div>
              ))}
            </div>
>>>>>>> parent of c07e200 (Update dependencies and enhance UI components)
          ))}
        </div>

      </div>

      <AttendanceSummaryModal
        isOpen={showSummary}
        onClose={handleCloseSummary}
        classData={classData}
        attendanceSummary={attendanceSummary}
      />

      <DeleteClassModal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        classData={{
          id: classData.id,
          name: classData.name,
          memberCount: classData.checkedInCount
        }}
        user={currentUser}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </div>
  );
};

export default ViewClassDetailPage;
