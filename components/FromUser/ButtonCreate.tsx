"use client"; // บอกให้ Next.js รู้ว่านี่เป็น Client Component

import { useState, useRef } from "react";
import Image from "next/image";
import { stopCamera } from "@/utils/camera";
import { handleQRDetected as handleQRUtility } from "@/utils/qrScanner";
import { useHasScanned } from "@/utils/hasScanned";
import { handleCreateClass } from "@/utils/CreateClass";
import { useCameraScanner } from "@/utils/useQRScanner";
import { X, QrCode, Plus } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface AddClassPopupProps {
  onScanSuccess?: () => void;
}

// สร้าง Functional Component ชื่อ AddClassPopup
const AddClassPopup: React.FC<AddClassPopupProps> = ({ onScanSuccess }) => {
  // State variables สำหรับจัดการสถานะต่างๆ
  const { user, hasScanned, updateScanStatus } = useHasScanned();
  //------------------------------------------------------------------------------------------------
  // สร้าง Reference สำหรับ Canvas element ที่ใช้ในการแสดงผลการสแกน QR Code
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // สร้าง Reference สำหรับ Video element ที่ใช้แสดงภาพจากกล้อง
  const videoRef = useRef<HTMLVideoElement>(null);
  // State สำหรับควบคุมสถานะการสแกน QR Code (เปิด/ปิด)
  const [scanning, setScanning] = useState(false);
  // State สำหรับควบคุมการแสดง popup สร้างคลาส (เปิด/ปิด)
  const [showPopup, setShowPopup] = useState(false);
  // State สำหรับเก็บชื่อคลาสที่ผู้ใช้กรอก
  const [className, setClassName] = useState("");
  // State สำหรับแสดงสถานะการโหลด
  const [isProcessing, setIsProcessing] = useState(false);
  // State สำหรับเก็บข้อความแสดงข้อผิดพลาด
  const [error, setError] = useState<string | null>(null);
  //------------------------------------------------------------------------------------------------

  //สร้างคลาส
  const handleCreate = async () => {
    if (!className.trim()) {
      toast.error("กรุณากรอกชื่อคลาส");
      return;
    }

    if (isProcessing) return;

    setIsProcessing(true);
    toast.loading("กำลังสร้างคลาส...");

    try {
      await handleCreateClass({
        className,
        user,
        setClassName,
        setShowPopup,
        setError: () => {},
        setLoading: () => {},
      });

      toast.success("สร้างคลาสสำเร็จ");
      setShowPopup(false);
      setClassName("");
    } catch (error) {
      toast.error(
        "เกิดข้อผิดพลาดในการสร้างคลาส: " +
          (error instanceof Error ? error.message : "ไม่ทราบสาเหตุ")
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // ฟังก์ชันสำหรับจัดการเมื่อสแกน QR Code สำเร็จ
  const handleQRDetected = async (result: { data: string }) => {
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบก่อนใช้งาน");
      return;
    }

    if (isProcessing) return;

    setIsProcessing(true);
    toast.loading("กำลังตรวจสอบ QR Code...");

    try {
      await handleQRUtility({
        result,
        videoRef,
        user,
        setScanning,
        setLoading: () => {},
        hasScanned,
        updateScanStatus,
        onScanSuccess,
        stopCamera,
      });

      toast.success("สแกน QR Code สำเร็จ");
      setScanning(false);
    } catch (error) {
      toast.error(
        "เกิดข้อผิดพลาดในการสแกน: " +
          (error instanceof Error ? error.message : "ไม่ทราบสาเหตุ")
      );
    } finally {
      setIsProcessing(false);
    }
  };

  useCameraScanner({
    scanning,
    videoRef,
    canvasRef,
    onQRDetected: handleQRDetected,
    onError: (error) => {
      toast.error(`เกิดข้อผิดพลาดในการสแกน: ${error}`);
      setScanning(false);
      setIsProcessing(false);
    },
  });

  // ฟังก์ชันสำหรับปิด popup สร้างคลาส
  const closePopup = () => {
    setShowPopup(false);
    setClassName("");
    setScanning(false);
    setIsProcessing(false);
  };

  // ส่วน JSX ที่จะ render
  return (
    <div className="">
      <div className="flex flex-row md:flex-col gap-3 items-center justify-center w-full">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative group"
        >
          <button
            className="relative flex items-center gap-2 px-6 py-3 bg-white hover:bg-purple-50 rounded-xl border border-purple-200 text-purple-700 font-medium shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full"
            onClick={() => {
              if (!user) {
                toast.error("กรุณาเข้าสู่ระบบก่อนใช้งาน");
                return;
              }
              setScanning(true);
            }}
            disabled={!user || isProcessing}
          >
            <QrCode className="w-5 h-5" />
            {isProcessing ? "กำลังประมวลผล..." : "Scan QR"}
          </button>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative group"
        >
          <button
            className="relative flex items-center gap-2 px-6 py-3 bg-white hover:bg-purple-50 rounded-xl border border-purple-200 text-purple-700 font-medium shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full"
            onClick={() => {
              if (!user) {
                toast.error("กรุณาเข้าสู่ระบบก่อนใช้งาน");
                return;
              }
              setShowPopup(true);
            }}
            disabled={!user || isProcessing}
          >
            <Plus className="w-5 h-5" />
            {isProcessing ? "กำลังประมวลผล..." : "Add a class"}
          </button>
        </motion.div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-black/50 z-50">
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-10"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.4,
              scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
            }}
          >
            <div className="bg-white rounded-3xl shadow-lg relative overflow-hidden md:max-w-3xl md:w-full">
              <div className="absolute -top-16 -right-16 w-35 h-35 bg-purple-500 rounded-full"></div>
              {/* ปุ่ม */}
              <div>
                <button
                  onClick={closePopup}
                  className="absolute top-2 right-2 z-10 text-white hover:text-gray-200 transition-colors"
                  disabled={isProcessing}
                >
                  <X />
                </button>
              </div>
              <div className="flex">
                <div className="absolute -bottom-50 right-120 w-100 h-100 bg-purple-500 rounded-full "></div>
                <div className="absolute -bottom-2 hidden md:block">
                  <Image
                    src="/assets/images/person.png"
                    width={150}
                    height={150}
                    alt="Student thinking"
                    className="object-contain relative z-10"
                  />
                </div>

                {/* ส่วนขวา - ฟอร์มสำหรับกรอกข้อมูล */}
                <div className="p-8 md:ml-auto">
                  <div className="bg-white p-8 rounded-2xl shadow-lg ">
                    <div>
                      <h2 className="text-purple-700 font-bold text-xl mb-6 flex items-center gap-2">
                        <span>🏠</span> ชื่อคลาส
                      </h2>
                    </div>
                    <div>
                      <Label
                        htmlFor="ชื่อคลาส"
                        className="block text-purple-600 text-sm mb-2"
                      >
                        ชื่อคลาส
                      </Label>
                      <Input
                        type="text"
                        value={className}
                        onChange={(e) => {
                          setClassName(e.target.value);
                          setError(null);
                        }}
                        placeholder="ชื่อคลาส"
                        className="w-full border-2 border-purple-200 rounded-4xl px-4 py-3 mb-6 focus:outline-none focus:border-purple-400" // CSS สำหรับ styling
                        disabled={isProcessing}
                      />
                      {error && (
                        <div className="text-red-500 mb-4 text-sm">{error}</div>
                      )}
                    </div>

                    {/* ปุ่มสร้างคลาส */}
                    <div className="p-5">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 1 }}
                      >
                        <button
                          onClick={handleCreate}
                          disabled={isProcessing}
                          className="w-full bg-purple-500 text-white py-3 rounded-xl font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" // CSS styling
                        >
                          {isProcessing ? "กำลังสร้าง..." : "สร้าง"}
                        </button>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* หน้าจอสแกน QR Code - แสดงเมื่อ scanning เป็น true */}
      {scanning && (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
          {" "}
          {/* หน้าจอเต็มจอสำหรับการสแกน */}
          <div className="relative">
            {" "}
            {/* Container สำหรับ video และ canvas */}
            {/* Video element สำหรับแสดงภาพจากกล้อง */}
            <video
              ref={videoRef} // เชื่อมต่อกับ useRef
              autoPlay // เล่นอัตโนมัติ
              playsInline // เล่นแบบ inline (สำหรับมือถือ)
              style={{ width: "100%", maxWidth: "640px" }} // กำหนดขนาด
            />
            {/* Canvas element สำหรับวาดกรอบการสแกน */}
            <canvas
              ref={canvasRef} // เชื่อมต่อกับ useRef
              style={{
                position: "absolute", // วางทับบน video
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
            />
          </div>
          {/* ปุ่มปิดการสแกน */}
          <button
            className="absolute top-2 right-1 text-purple-500 hover:text-purple-700" // จัดตำแหน่งและสี
            onClick={() => {
              // ฟังก์ชันเมื่อคลิกปิด
              setScanning(false); // ปิดสถานะการสแกน
              setIsProcessing(false);
              // ถ้ามี video stream อยู่ให้หยุดการทำงาน
              if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream; // แปลงเป็น MediaStream
                stopCamera(stream); // หยุดกล้อง
                videoRef.current.srcObject = null; // ล้าง video source
              }
            }}
            disabled={isProcessing}
          >
            <X />
          </button>
        </div>
      )}
    </div>
  );
};

// ส่งออก Component เป็น default export
export default AddClassPopup;
