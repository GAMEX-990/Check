
import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { ArrowLeft, ChevronDown, Users, BookOpen, MoreVertical } from "lucide-react";
import {
  ViewClassDetailPageProps,
  CheckedInUser,
  AttendanceRecord,
  ClassData
} from "@/types/classDetailTypes";
import { AnimatePresence, motion } from "framer-motion";
import { doc, onSnapshot, collection, query, where, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import MobileActionMenu from "../ui/MobileActionMenu";
import { AlertDialogMobile } from "../TourGuide/Howtousemobile";
import CreateQRCodeAndUpload from "../FromUser/FusionButtonqrup";

export const ViewClassDetailPage = ({
  classData,
  onBack,
  onDeleteSuccess,
  onClassChange,
}: ViewClassDetailPageProps & {
  onClassChange?: (newClassData: ClassData) => void;
}) => {
  const [, setDailyCheckedIn] = useState<
    { date: string; users: CheckedInUser[] }[]
  >([]);

  const [currectPang] = useState<"myclass" | "class" | "view">("view");
  const [selectedClass, setSelectedClass] = useState<Partial<ClassData> | null>(classData);
  const auth = getAuth();
  const [user] = useAuthState(auth);

  const [, setOpenDates] = useState<Record<string, boolean>>({});
  const currentUser = auth.currentUser;
  const currentUid = currentUser?.uid;

  // State สำหรับ dropdown และ class type toggle
  const [myClasses, setMyClasses] = useState<ClassData[]>([]);
  const [joinedClasses, setJoinedClasses] = useState<ClassData[]>([]);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [classType, setClassType] = useState<'owned' | 'joined'>('owned'); // เพิ่ม state สำหรับ toggle

  // เพิ่ม state สำหรับ action dropdown ในมือถือ
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [, setIsLoadingOwner] = useState(true);

  useEffect(() => {
    setSelectedClass(classData);
    // กำหนด class type เริ่มต้นตามว่าเป็นเจ้าของหรือไม่
    if (classData.owner_email === currentUser?.email) {
      setClassType('owned');
    } else {
      setClassType('joined');
    }
  }, [classData, currentUser?.email]);

  // ตรวจสอบสถานะเจ้าของ
  useEffect(() => {
    if (!currentUser || !selectedClass?.id) {
      setIsOwner(false);
      setIsLoadingOwner(false);
      return;
    }

    const checkOwner = async () => {
      try {
        const classSnap = await getDoc(doc(db, "classes", selectedClass.id!));
        const data = classSnap.data();
        setIsOwner(data?.owner_email === currentUser.email || data?.created_by === currentUser.uid);
      } finally {
        setIsLoadingOwner(false);
      }
    };

    checkOwner();
  }, [currentUser, selectedClass?.id]);

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

  const currentClassData = selectedClass || classData;

  return (
    <div>
      <div className="w-100 md:w-200 border-2 border-purple-50 rounded-2xl shadow-lg">
        <div className="flex justify-between p-4">
          <div>
            {/* หัวเลือกคลาส */}
            <div className="flex">
              <h1
                className="truncate w-full max-w-[80px] text-base font-semibold md:max-w-full"
                title={currentClassData.name}
              >
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

            {/* ปุ่มเลือกคลาสอื่น */}
            <AnimatePresence>
              {showClassDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 mt-2 max-w-fit bg-white border border-purple-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto "
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
          {/* -------------------------------------------------------------------------------------------------------------------------------------- */}

          <div className="text-purple-700 ">
            {/* แสดงปุ่ม My Classes เฉพาะเมื่ออยู่หน้า Classes */}
            {classType === 'joined' && (
              <button
                onClick={() => handleClassTypeToggle('owned')}
                className="flex items-center gap-x-1 p-1.5 border-2 border-purple-50 rounded-2xl shadow-lg text-sm transition-all duration-200 hover:bg-purple-50"
              >
                <BookOpen size={16} />
                <span>My Classes</span>
              </button>
            )}
            {/* แสดงปุ่ม Classes เฉพาะเมื่ออยู่หน้า My Classes */}
            {classType === 'owned' && (
              <button
                onClick={() => handleClassTypeToggle('joined')}
                className="flex items-center gap-x-1 p-1.5 border-2 border-purple-50 rounded-2xl shadow-lg text-sm transition-all duration-200 hover:bg-purple-50"
              >
                <Users size={16} />
                <span>Classes</span>
              </button>
            )}
          </div>

          {/* ไอค้อน QR อัพโหลด บันทึก ถังขยะ ปุ่มกลับ */}
          <div className="flex justify-end items-center gap-x-2">
            {currectPang === "view" && selectedClass && (
              <div>
                {/* แสดงใน Desktop */}
                <div className="hidden md:flex text-purple-600 gap-x-2">
                  <CreateQRCodeAndUpload
                    classId={selectedClass?.id ?? ""}
                    user={user ?? null}
                    classData={{
                      id: currentClassData.id ?? "",
                      name: currentClassData.name ?? "",
                      memberCount: currentClassData.checkedInCount
                    }}
                    cls={currentClassData as ClassData}
                    onDeleteSuccess={() => {
                      onDeleteSuccess?.();
                      onBack();
                    }}
                  />
                </div>

                {/* แสดงใน Mobile */}
                <div className="flex justify-center items-center relative md:hidden">
                  <div className="text-purple-600 hover:text-purple-800 p-1 rounded-lg hover:bg-purple-50 transition-colors">
                    <AlertDialogMobile />
                  </div>
                  <div>
                    <button
                      onClick={() => setShowActionDropdown(!showActionDropdown)}
                      className="text-purple-600 hover:text-purple-800 p-1 rounded-lg hover:bg-purple-50 transition-colors"
                      title="เมนูเพิ่มเติม"
                    >
                      <MoreVertical size={20} />
                    </button>
                  </div>

                  <AnimatePresence>
                    {showActionDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 bg-white border border-purple-200 rounded-xl shadow-lg z-50 min-w-[200px]"
                      >
                        <div className="py-2">
                          <div className="px-3 py-1 text-xs font-medium text-purple-500 uppercase tracking-wide border-b border-purple-100">
                            การจัดการคลาส
                          </div>
                          <div className="px-2 py-2">
                            <MobileActionMenu
                              classId={selectedClass?.id ?? ""}
                              user={user ?? null}
                              classData={{
                                id: currentClassData.id ?? "",
                                name: currentClassData.name ?? "",
                                memberCount: currentClassData.checkedInCount
                              }}
                              cls={currentClassData as ClassData}
                              isOwner={isOwner}
                              onDeleteSuccess={() => {
                                setShowActionDropdown(false);
                                onDeleteSuccess?.();
                                onBack();
                              }}
                              onActionStart={() => setShowActionDropdown(false)}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* ปุ่มกลับ */}
            <button
              className="text-purple-600 hover:text-purple-800 p-1 rounded-lg hover:bg-purple-50 transition-colors"
              onClick={onBack}
              title="กลับ"
            >
              <ArrowLeft size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewClassDetailPage;