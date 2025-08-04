// src/components/ClassPage.tsx
import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { Check, X } from "lucide-react";
import { useHasScanned } from "@/utils/hasScanned";
import { motion } from "framer-motion";
import { ClassPageType } from "@/types/classTypes";
import Loader from "../Loader/Loader";
import { ClassData } from "@/types/classDetailTypes";
import { stopCamera } from "@/utils/camera";
import { handleQRDetected as handleQRUtility } from "@/utils/qrScanner";
import { useCameraScanner } from "@/utils/useQRScanner";
import { toast } from "sonner";
import ScanQRButton from "../ui/QRScanner";

interface ClassPageProps {
  page: ClassPageType;
  onSelectClass: (classData: ClassData) => void;
  onPageChange: (page: ClassPageType) => void;
  onScanSuccess?: () => void; // เพิ่ม prop เหมือน AddClassPopup
}

const ClassPage = ({ onSelectClass, onScanSuccess }: ClassPageProps) => {
  const { user, hasScanned, loading, updateScanStatus } = useHasScanned();
  const [joinedClasses, setJoinedClasses] = useState<ClassData[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [delayDone, setdelayDone] = useState(false);

  // เพิ่ม states และ refs เหมือน AddClassPopup
  const [scanning, setScanning] = useState(false);
  const [, setLoadingQR] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setdelayDone(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user?.uid || loading) return;

    setClassesLoading(true);

    const classesRef = collection(db, "classes");
    const q = query(
      classesRef,
      where("checkedInMembers", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const classes: ClassData[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<ClassData, "id">),
        }));
        setJoinedClasses(classes);
        setClassesLoading(false);
      },
      () => {
        setClassesLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.uid, hasScanned, loading]);

  // ฟังก์ชันสำหรับจัดการเมื่อสแกน QR Code สำเร็จ - เหมือน AddClassPopup
  const handleQRDetected = async (result: { data: string }) => {
    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบก่อนใช้งาน');
      return;
    }

    await handleQRUtility({
      result,
      videoRef,
      user,
      setScanning,
      setLoading: setLoadingQR,
      hasScanned,
      updateScanStatus,
      onScanSuccess,
      stopCamera,
    });
  };

  // ใช้ useCameraScanner เหมือน AddClassPopup
  useCameraScanner({
    scanning,
    videoRef,
    canvasRef,
    onQRDetected: handleQRDetected,
  });

  // ฟังก์ชันสำหรับเริ่มการสแกน
  const handleScanStart = () => {
    setScanning(true);
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
      <div className="overflow-scroll md:h-140 h-90 w-auto">
        <div className="flex flex-col gap-y-4 p-8 md:items-center">
          {classesLoading ? (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center ">
              <Loader />
            </div>
          ) : isEntering ? (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center ">
              <Loader />
            </div>
          ) : (
            <>
              {joinedClasses.map((cls) => (
                <div key={cls.id}>
                  <motion.div
                    key={cls.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 1.05 }}
                  >
                    <div
                      className="flex justify-between md:w-100 items-center bg-purple-50 hover:bg-purple-100 p-4 rounded-4xl shadow-lg inset-shadow-sm cursor-pointer"
                      onClick={() => {
                        setIsEntering(true);
                        setTimeout(() => {
                          onSelectClass(cls);
                        }, 2000);
                      }}
                    >
                      <div className="flex gap-3 items-center">
                        <div className="bg-purple-500 text-white text-4xl font-bold w-12 h-12 flex justify-center rounded-full shadow-lg">
                          {cls.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex gap-x-1">
                            <p className="text-md font-bold text-purple-800">{cls.name}</p>
                            <div>
                              {user?.uid && cls.checkedInMembers?.includes(user.uid) && (
                                <p className="text-green-600"><Check /></p>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="truncate w-full max-w-[80px] text-base md:max-w-full text-purple-500">{cls.owner_email}</p>
                            <p className="truncate w-full max-w-[80px] text-base md:max-w-full text-purple-500">{cls.checkedInCount} คน</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      {/* ใช้ ScanQRButton */}
      <div className="absolute right-3 bottom-4 md:hidden">
        <ScanQRButton
          onClick={handleScanStart}
          disabled={!user}
          className="w-full justify-center"
        />
      </div>
      {/* หน้าจอสแกน QR Code - เหมือน AddClassPopup */}
      {scanning && (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: '100%', maxWidth: '640px' }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
              }}
            />
          </div>

          {/* ปุ่มปิดการสแกน */}
          <button
            className="absolute top-2 right-1 text-purple-500 hover:text-purple-700"
            onClick={() => {
              setScanning(false);
              if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream;
                stopCamera(stream);
                videoRef.current.srcObject = null;
              }
            }}
          >
            <X />
          </button>
        </div>
      )}
    </div>
  );
};

export default ClassPage;