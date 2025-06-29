import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { createAttendanceSummary } from "@/utils/Summary";
import DeleteClassModal from "./DeleteClassModal";
import AttendanceSummaryModal from "./AttenSummary";
import { ArrowLeft, Trash2 } from "lucide-react";
import {
  ViewClassDetailPageProps,
  CheckedInUser,
  AttendanceSummaryItem
} from "@/types/classDetailTypes";
import { motion } from "framer-motion";
import { fetchCheckedInUsersByDate } from "@/utils/fetchCheckedInUsersByDate";

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
        data.flatMap((d) => d.users) // รวมทุกวัน
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
          <div className="absolute right-0 mx-4">
            {isClassOwner && (
              <button
                className="text-red-500 hover:text-red-700 p-1"
                onClick={handlsShowDeleteModal}
                title="ลบคลาส"
              >
                <Trash2 size={24} />
              </button>
            )}
            <button className="text-2xl text-purple-600" onClick={onBack}>
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
            <button
              className="border-1 border-purple-700 p-1 rounded-4xl cursor-pointer"
              onClick={handleShowSummary}
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
