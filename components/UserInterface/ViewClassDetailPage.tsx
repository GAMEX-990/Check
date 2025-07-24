import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import DeleteClassModal from "./DeleteClassModal";
import { ArrowLeft, ChevronDown, Trash2, Users, BookOpen } from "lucide-react";
import {
  ViewClassDetailPageProps,
  CheckedInUser,
  AttendanceRecord
} from "@/types/classDetailTypes";
import { AnimatePresence, motion } from "framer-motion";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ClassData } from "@/types/classTypes";
import { useAuthState } from "react-firebase-hooks/auth";
import CreateQRCodeAndUpload from "../FromUser/FusionButtonqrup";

export const ViewClassDetailPage = ({
  classData,
  onBack,
  onDeleteSuccess,
  onClassChange
}: ViewClassDetailPageProps & {
  onClassChange?: (newClassData: ClassData) => void;
}) => {
  const [dailyCheckedIn, setDailyCheckedIn] = useState<
    { date: string; users: CheckedInUser[] }[]
  >([]);

  const [currectPang] = useState<"myclass" | "class" | "view">("view");
  const [selectedClass, setSelectedClass] = useState<Partial<ClassData> | null>(classData);
  const auth = getAuth();
  const [user] = useAuthState(auth);

  const [openDates, setOpenDates] = useState<Record<string, boolean>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const currentUser = auth.currentUser;
  const currentUid = currentUser?.uid;

  // State สำหรับ dropdown และ class type toggle
  const [myClasses, setMyClasses] = useState<ClassData[]>([]);
  const [joinedClasses, setJoinedClasses] = useState<ClassData[]>([]);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [classType, setClassType] = useState<'owned' | 'joined'>('owned'); // เพิ่ม state สำหรับ toggle

  useEffect(() => {
    setSelectedClass(classData);
    // กำหนด class type เริ่มต้นตามว่าเป็นเจ้าของหรือไม่
    if (classData.owner_email === currentUser?.email) {
      setClassType('owned');
    } else {
      setClassType('joined');
    }
  }, [classData, currentUser?.email]);

  // Fetch My Classes (คลาสที่เป็นเจ้าของ)
  useEffect(() => {
    if (!currentUser?.email) return;

    const classesRef = collection(db, "classes");
    const q = query(classesRef, where("owner_email", "==", currentUser.email));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const classList: ClassData[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ClassData, "id">),
      }));
      setMyClasses(classList);
    });

    return () => unsubscribe();
  }, [currentUser?.email]);

  // Fetch Joined Classes (คลาสที่เข้าร่วม)
  useEffect(() => {
    if (!currentUser?.uid) return;

    const classesRef = collection(db, "classes");
    const q = query(
      classesRef,
      where("checkedInMembers", "array-contains", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const classList: ClassData[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ClassData, "id">),
      }));
      // กรองเอาเฉพาะคลาสที่ไม่ใช่เจ้าของ
      const filteredClasses = classList.filter(cls => cls.owner_email !== currentUser.email);
      setJoinedClasses(filteredClasses);
    });

    return () => unsubscribe();
  }, [currentUser?.uid, currentUser?.email]);

  const toggleDate = (date: string) => {
    setOpenDates((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  };

  // ฟังก์ชันสำหรับเปลี่ยนคลาส
  const handleClassChange = (newClassData: ClassData) => {
    setSelectedClass(newClassData);
    setShowClassDropdown(false);
    // รีเซ็ต states
    setDailyCheckedIn([]);
    setOpenDates({});
    // ส่งข้อมูลคลาสใหม่ไปยัง parent component
    onClassChange?.(newClassData);
  };

  // ฟังก์ชันสำหรับสลับประเภทคลาส
  const handleClassTypeToggle = (type: 'owned' | 'joined') => {
    setClassType(type);
    setShowClassDropdown(false);

    // เลือกคลาสแรกในประเภทที่เลือก (ถ้ามี)
    const targetClasses = type === 'owned' ? myClasses : joinedClasses;
    if (targetClasses.length > 0) {
      const firstClass = targetClasses[0];
      handleClassChange(firstClass);
    }
  };

  // ได้รับ classes ที่จะแสดงตาม class type ที่เลือก
  const currentClasses = classType === 'owned' ? myClasses : joinedClasses;

  useEffect(() => {
    const classId = selectedClass?.id || classData?.id;
    if (!classId) return;

    const classRef = doc(db, "classes", classId);

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

    return () => unsubscribe();
  }, [selectedClass?.id, classData?.id, currentUser?.email, currentUid]);

  const handlsShowDeleteModal = () => setShowDeleteModal(true);
  const handleCloseDeleteModal = () => setShowDeleteModal(false);
  const handleDeleteSuccess = () => {
    onDeleteSuccess?.();
    onBack();
  };

  const isClassOwner = (selectedClass || classData).owner_email === currentUser?.email;
  const currentClassData = selectedClass || classData;

  return (
    <div>
      <div className="w-85 md:w-100 h-auto border-2 border-purple-50 rounded-2xl shadow-lg p-4">
        <div className="flex justify-between">
          <div className="relative">
            {/* Class Title with Dropdown */}
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-purple-800">
                {currentClassData.name}
              </h1>
              {currentClasses.length > 1 && (
                <button
                  onClick={() => setShowClassDropdown(!showClassDropdown)}
                  className="text-purple-600 hover:text-purple-800 transition-colors"
                  title="เลือกคลาสอื่น"
                >
                  <ChevronDown
                    size={20}
                    className={`transition-transform duration-200 ${showClassDropdown ? 'rotate-180' : 'rotate-0'
                      }`}
                  />
                </button>
              )}
            </div>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showClassDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 mt-2 w-64 bg-white border border-purple-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto"
                >
                  <div className="py-2">
                    <div className="px-3 py-1 text-xs font-medium text-purple-500 uppercase tracking-wide">
                      {classType === 'owned' ? 'คลาสที่เป็นเจ้าของ' : 'คลาสที่เข้าร่วม'}
                    </div>
                    {currentClasses.map((cls) => (
                      <button
                        key={cls.id}
                        onClick={() => handleClassChange(cls)}
                        className={`w-full px-4 py-2 text-left hover:bg-purple-50 transition-colors ${cls.id === currentClassData.id
                            ? 'bg-purple-100 text-purple-800 font-medium'
                            : 'text-purple-700'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-500 text-white text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full">
                            {cls.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="truncate">{cls.name}</div>
                            {classType === 'joined' && (
                              <div className="text-xs text-purple-500 truncate">
                                โดย: {cls.owner_email}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right side buttons */}
          <div className="flex gap-x-2">
            {currectPang === "view" && selectedClass && isClassOwner && (
              <div className="text-purple-600">
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
        </div>
        <div className="justify-center flex gap-x-2 text-purple-700 mt-2 mb-4 ">
          <button
            onClick={() => handleClassTypeToggle('owned')}
            className="flex items-center gap-x-1 p-1.5 border-2 border-purple-50 rounded-2xl shadow-lg text-sm transition-all duration-200 hover:bg-purple-50"
          >
            <BookOpen size={16} />
            <span>My Classes ({myClasses.length})</span>
          </button>

          <button
            onClick={() => handleClassTypeToggle('joined')}
            className="flex items-center gap-x-1 p-1.5 border-2 border-purple-50 rounded-2xl shadow-lg text-sm transition-all duration-200 hover:bg-purple-50"
          >
            <Users size={16} />
            <span>Classes ({joinedClasses.length})</span>
          </button>
        </div>
        <div className="overflow-scroll h-80 relative">
          {dailyCheckedIn.length === 0 ? (
            <div className="flex items-center justify-center h-full text-purple-500">
              <div className="text-center">
                <div className="text-4xl mb-2">📋</div>
                <div>ยังไม่มีข้อมูลการเข้าร่วม</div>
              </div>
            </div>
          ) : (
            dailyCheckedIn.map(({ date, users }) => (
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
            ))
          )}
        </div>
      </div>

      <DeleteClassModal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        classData={{
          id: currentClassData.id ?? "",
          name: currentClassData.name ?? "",
          memberCount: currentClassData.checkedInCount
        }}
        user={currentUser}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </div>
  );
};

export default ViewClassDetailPage;