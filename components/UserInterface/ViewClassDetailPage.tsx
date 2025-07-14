import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import DeleteClassModal from "./DeleteClassModal";
import { ArrowLeft, ChevronDown, Trash2, } from "lucide-react";
import {
  ViewClassDetailPageProps,
  CheckedInUser,
  AttendanceRecord
} from "@/types/classDetailTypes";
import { AnimatePresence, motion } from "framer-motion";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ClassData } from "@/types/classTypes";
import { useAuthState } from "react-firebase-hooks/auth";
import CreateQRCodeAndUpload from "../FromUser/FusionButtonqrup";


export const ViewClassDetailPage = ({
  classData,
  onBack,
  onDeleteSuccess
}: ViewClassDetailPageProps) => {
  const [dailyCheckedIn, setDailyCheckedIn] = useState<
    { date: string; users: CheckedInUser[] }[]
  >([]);
  // --------------------------------------
  const [currectPang] = useState<"myclass" | "class" | "view">("view");
  const [selectedClass, setSelectedClass] = useState<Partial<ClassData> | null>(classData);
  const auth = getAuth();
  const [user] = useAuthState(auth);
  // --------------------------------------
  const [openDates, setOpenDates] = useState<Record<string, boolean>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const currentUser = auth.currentUser;
  const currentUid = currentUser?.uid;

  useEffect(() => {
    setSelectedClass(classData);
  }, [classData]);

  const toggleDate = (date: string) => {
    setOpenDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  useEffect(() => {
    if (!classData?.id) return;

    const classRef = doc(db, "classes", classData.id);

    // สร้าง real-time listener
    const unsubscribe = onSnapshot(classRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const dailyCheckedInRecord = data.dailyCheckedInRecord || {};

        // แปลงข้อมูลให้อยู่ในรูปแบบเดิม
        const processedData: { date: string; users: CheckedInUser[] }[] = [];

        Object.keys(dailyCheckedInRecord).forEach(date => {
          const dayRecords = dailyCheckedInRecord[date] || {};
          const users: CheckedInUser[] = [];

          (Object.values(dayRecords) as AttendanceRecord[]).forEach((record) => {
            const isClassOwner = data.owner_email === currentUser?.email;
            const isCurrentUserRecord = record.uid === currentUid;

            if (isClassOwner || isCurrentUserRecord) {
              users.push({
                uid: record.uid,
                name: record.name,
                studentId: record.studentId,
                email: record.email,
                status: record.status || 'active',
                timestamp: record.timestamp?.toDate() || new Date(record.date),
                date: record.date
              });
            }
          });

          if (users.length > 0) {
            users.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
            processedData.push({ date, users });
          }
        });

        processedData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setDailyCheckedIn(processedData);

      }
    });

    // Cleanup function
    return () => unsubscribe();
  }, [classData?.id, currentUser?.email, currentUid]);

  const handlsShowDeleteModal = () => setShowDeleteModal(true);
  const handleCloseDeleteModal = () => setShowDeleteModal(false);
  const handleDeleteSuccess = () => {
    onDeleteSuccess?.();
    onBack();
  };

  const isClassOwner = classData.owner_email === currentUser?.email;

  return (
    <div>
      <div className="w-85 md:w-100 h-auto border-2 border-purple-50 rounded-2xl shadow-lg p-4">
        <div className="flex justify-between">
          <div>
            <h1 className="text-lg font-bold text-purple-800">
              {classData.name}
            </h1>
          </div>
          {/* ------------ */}
          <div className="flex gap-x-2">
            {currectPang === "view" && selectedClass && (
              <div className=" text-purple-600">
                <CreateQRCodeAndUpload
                  classId={selectedClass?.id ?? ""}
                  currentUser={user ? { uid: user.uid, email: user.email || '' } : null}
                />
              </div>
            )}
            <div className="flex gap-x-2">
              {isClassOwner && (
                <div>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={handlsShowDeleteModal}
                    title="ลบคลาส"
                  >
                    <Trash2 size={24} />
                  </button>
                </div>
              )}
              <div>
                <button className="text-purple-600" onClick={onBack}>
                  <ArrowLeft size={28} />
                </button>
              </div>
            </div>

          </div>
          {/* ------------ */}
        </div>

        <div className="overflow-scroll h-80 relative">
          {dailyCheckedIn.map(({ date, users }) => (
            <div key={date}>
              <div className="my-2 ">
                <button
                  onClick={() => toggleDate(date)}
                  className="flex flex-row items-center gap-x-2 text-md text-purple-700 p-0.5 w-full bg-purple-50 hover:bg-purple-100 rounded-4xl shadow-xl transition duration-300 cursor-pointer"
                >
                  <div
                    className={`transition-transform duration-300 ${openDates[date] ? "rotate-0" : "rotate-90"
                      }`}
                  >
                    <ChevronDown size={20} />
                  </div>
                  <div>
                    วันที่:{" "}
                    {new Date(date).toLocaleDateString("th-TH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div>
                    ({users.length}) คน
                  </div>
                </button>
              </div>

              <AnimatePresence initial={false}>
                {openDates[date] && (
                  <motion.div
                    key={date}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden p-4 rounded-xl shadow-lg bg-white mt-2"
                  >
                    {/* หัวตาราง */}
                    <div className="flex flex-row justify-between text-purple-700 pb-1 border-purple-400">
                      <div className="w-1/4">เวลา</div>
                      <div className="w-1/2">ชื่อ - สกุล</div>
                      <div className="w-1/4 text-right">รหัส นศ.</div>
                    </div>

                    {/* รายชื่อ */}
                    {users.map((user) => (
                      <div
                        key={user.uid + date}
                        className="flex flex-row justify-between items-center py-2 border-b border-purple-300"
                      >
                        <div className="text-sm text-purple-900 w-1/4">
                          {" "}
                          {user.timestamp.toLocaleTimeString("th-TH", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="text-sm text-purple-900 w-1/2">{user.name}</div>
                        <div className="text-sm text-purple-900 w-1/3 text-right">{user.studentId}</div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
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
