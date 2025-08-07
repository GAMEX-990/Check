import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { useHasScanned } from "@/utils/hasScanned";
import { motion, AnimatePresence } from "framer-motion";
import { ClassPageType } from "@/types/classTypes";
import Loader from "../Loader/Loader";
import { ClassData } from "@/types/classDetailTypes";
import { House, X } from "lucide-react";
import QRCode from "react-qr-code";
import ClassCard from "./MyClassCard";

interface MyClassPageProps {
  page: ClassPageType;
  onSelectClass: (classData: ClassData) => void;
  onPageChange: (page: ClassPageType) => void;
}

const MyClassPage = ({ onSelectClass }: MyClassPageProps) => {
  const { user, loading } = useHasScanned();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [isEntering, setIsEntering] = useState(false);
  const [delayDone, setdelayDone] = useState(false);

  // QR Code states
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setdelayDone(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (loading || !user) return;

    const classesRef = collection(db, "classes");
    const q = query(classesRef, where("owner_email", "==", user.email));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const classList: ClassData[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<ClassData, "id">),
        }));
        setClasses(classList);
      },
    );

    return () => unsubscribe();
  }, [user, loading]);

  // Countdown QR Code modal 1 นาที
  useEffect(() => {
    if (showQRModal) {
      setRemainingTime(60);

      const interval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setShowQRModal(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [showQRModal]);

  // กันแคปหน้าจอ
  useEffect(() => {
    const blockKeys = (e: KeyboardEvent) => {
      const overlay = document.getElementById("qr-blur-overlay");
      if (!overlay) return;

      if (
        e.key === "PrintScreen" ||
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I")
      ) {
        e.preventDefault();
        overlay.classList.remove("hidden");
        setTimeout(() => {
          overlay.classList.add("hidden");
        }, 3000);
      }
    };

    const handleVisibilityChange = () => {
      const overlay = document.getElementById("qr-blur-overlay");
      if (!overlay) return;

      if (document.visibilityState === "hidden") {
        overlay.classList.remove("hidden");
      } else {
        overlay.classList.add("hidden");
      }
    };

    if (showQRModal) {
      window.addEventListener("keydown", blockKeys);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      window.removeEventListener("keydown", blockKeys);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [showQRModal]);

  const handleCreateQR = (e: React.MouseEvent, classData: ClassData) => {
    e.stopPropagation();
    const qrLink = `https://your-app-url/class/${classData.id}`;
    setQrCode(qrLink);
    setSelectedClass(classData);
    setShowQRModal(true);
  };

  const handleCloseQR = () => {
    setShowQRModal(false);
    setQrCode(null);
    setSelectedClass(null);
  };

  const handleSelectClass = (classData: ClassData) => {
    setIsEntering(true);
    setTimeout(() => {
      onSelectClass(classData);
    }, 2000);
  };

  if (loading || !delayDone) {
    return (
      <div>
        <div className="flex justify-center items-center h-full">
          <div className="text-purple-600"><Loader /></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div>
        <div className="overflow-scroll md:h-140 h-150 w-auto">
          <div className="flex flex-col gap-y-4 p-8 md:items-center">
            {isEntering ? (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <Loader />
              </div>
            ) : classes.length > 0 ? (
              classes.map((cls) => (
                <ClassCard
                  key={cls.id}
                  cls={cls}
                  onSelectClass={handleSelectClass}
                  onCreateQR={handleCreateQR}
                />
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500 text-lg">ยังไม่มีคลาส</p>
                <p className="text-gray-400 text-sm mt-2">เริ่มสร้างคลาสแรกของคุณ</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && qrCode && selectedClass && (
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-50 select-none">
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-10"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.4,
                scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
              }}
            >
              <div
                className="relative bg-white rounded-4xl mx-5 shadow-lg overflow-hidden md:h-150 md:w-250"
                onContextMenu={(e) => e.preventDefault()}
              >
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500 rounded-full"></div>
                <button
                  onClick={handleCloseQR}
                  className="absolute top-2 right-2 z-10 text-white hover:text-gray-200 transition-colors"
                >
                  <X />
                </button>
                <div className="flex flex-col items-center justify-center md:mt-10 p-15 gap-y-6">
                  <div className="flex items-center space-x-2 text-3xl text-purple-700 font-bold inset-shadow-sm shadow-2xl rounded-2xl p-1.5">
                    <House size={30} />
                    <h3>{selectedClass.name}</h3>
                  </div>
                  <div>
                    <QRCode
                      value={qrCode}
                      size={280}
                      className="pointer-events-none select-none"
                    />
                  </div>
                  <div className="mt-4 text-sm text-gray-500">
                    QR จะหมดอายุใน {Math.floor(remainingTime / 60)}:
                    {String(remainingTime % 60).padStart(2, "0")} นาที
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyClassPage;