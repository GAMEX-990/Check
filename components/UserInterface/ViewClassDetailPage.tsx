import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { createAttendanceSummary } from "@/utils/Summary";
import DeleteClassModal from "./DeleteClassModal";
import AttendanceSummaryModal from "./AttenSummary";
import { ArrowLeft, Trash2, Users, Clock, CalendarDays, UserCheck } from "lucide-react";
import {
  ViewClassDetailPageProps,
  CheckedInUser,
  AttendanceSummaryItem
} from "@/types/classDetailTypes";
import { motion } from "framer-motion";
import { fetchCheckedInUsersByDate } from "@/utils/fetchCheckedInUsersByDate";

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
        data.flatMap((d) => d.users)
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
<<<<<<< HEAD
    <div className="bg-white rounded-xl shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-purple-100">
        <div className="flex items-center gap-3">
          <div className="bg-purple-600 text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xl shadow-sm">
            {classData.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-purple-900">{classData.name}</h1>
            <p className="text-sm text-purple-600">Created by: {classData.owner_email}</p>
=======
    <div>
      <div className="h-auto w-100 border-2 border-purple-500 rounded-2xl p-4 relative">
        <div className="flex justify-center">
          <h1 className="text-2xl font-bold text-purple-800 text-center flex-grow">
            {classData.name}
          </h1>
          <div className="absolute right-0 space-x-2">
            {isClassOwner && (
              <button
                className="text-red-500 hover:text-red-700 p-1"
                onClick={handlsShowDeleteModal}
                title="ลบคลาส"
              >
                <Trash2 size={24} />
              </button>
            )}
            <button className="text-2xl text-purple-600 m-2" onClick={onBack}>
              <ArrowLeft size={28} />
            </button>
>>>>>>> parent of cb57ede (fix Butum)
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isClassOwner && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              onClick={handlsShowDeleteModal}
              title="Delete Class"
            >
              <Trash2 className="h-5 w-5" />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            onClick={onBack}
          >
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
            >
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-purple-600" />
                <h2 className="text-sm font-medium text-purple-900">
                  {new Date(date).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h2>
              </div>
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
          ))}
        </div>
      </motion.div>

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
