"use client"; // บอกให้ Next.js รู้ว่านี่เป็น Client Component

import { useState, useRef } from "react";
import Image from "next/image";
import { FaTimes } from "react-icons/fa";
import { stopCamera } from "@/utils/camera";
import { handleQRDetected as handleQRUtility } from "@/utils/qrScanner";
import { useHasScanned } from "@/utils/hasScanned";
import { handleCreateClass } from "@/utils/CreateClass";
import { useCameraScanner } from "@/utils/useQRScanner";

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
  const [loading, setLoading] = useState(false);
  // State สำหรับเก็บข้อความแสดงข้อผิดพลาด
  const [error, setError] = useState<string | null>(null);
  //------------------------------------------------------------------------------------------------

//สร้างคลาส
const handleCreate = async () => {
  await handleCreateClass({
    className,
    user, // ข้อมูลผู้ใช้ปัจจุบัน
    setClassName,
    setShowPopup,
    setError,
    setLoading,
  });
};

  // ฟังก์ชันสำหรับจัดการเมื่อสแกน QR Code สำเร็จ
  const handleQRDetected = async (result: { data: string }) => {
    // Check if user is null before proceeding
    if (!user) {
      alert('กรุณาเข้าสู่ระบบก่อนใช้งาน');
      return;
    }
    
    await handleQRUtility({
      result,
      videoRef,
      user,
      setScanning,
      setLoading,
      hasScanned,
      updateScanStatus,
      onScanSuccess,
      stopCamera,
    });
  };

  useCameraScanner({
    scanning,
    videoRef,
    canvasRef,
    onQRDetected: handleQRDetected,
    onError: (error) => {
      console.error("เกิดข้อผิดพลาดในการสแกน:", error);
      alert(error);
    },
  });

  // ฟังก์ชันสำหรับปิด popup สร้างคลาส
  const closePopup = () => {
    setShowPopup(false); // ปิด popup
    setClassName(""); // ล้างชื่อคลาส
    setError(null); // ล้างข้อความผิดพลาด
    setScanning(false); // ปิดการสแกน
    // setSuccess(false); // บรรทัดนี้ถูก comment ไว้ - อาจใช้สำหรับรีเซ็ตสถานะความสำเร็จ
  };

  // ส่วน JSX ที่จะ render
  return (
    <div>
      <div className="flex flex-col gap-2 items-center">
        <div>
          <button
            className="w-auto h-auto border-1 border-purple-600 text-purple-600 p-2 rounded-2xl hover:bg-purple-100"
            onClick={() => setScanning(true)}
            disabled={!user}
          >
            {hasScanned ? "Scan QR" : "Scan QR"}
          </button>
        </div>
        <div>
          <button
            className="w-auto h-auto border-1 border-purple-600 text-purple-600 p-2 rounded-2xl hover:bg-purple-100 "
            onClick={() => setShowPopup(true)}
            disabled={!user}
          >
            Add a class
          </button>
        </div>
      </div>


      {showPopup && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-lg p-6 relative max-w-2xl w-full  overflow-hidden">
            <div className="absolute -top-16 -right-16 w-35 h-35 bg-purple-500 rounded-full"></div>
            <button
              onClick={closePopup}
              className="absolute top-2 right-2 z-10 text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
            <div className="flex">
              <div className="absolute -bottom-50 right-120 w-100 h-100 bg-purple-500 rounded-full "></div>
              <div className="absolute -bottom-2">
                <Image
                  src="/assets/images/person.png"
                  width={150}
                  height={150}
                  alt="Student thinking"
                  className="object-contain relative z-10"
                />
              </div>

              {/* ส่วนขวา - ฟอร์มสำหรับกรอกข้อมูล */}
              <div className="w-1/2 p-8 flex flex-col justify-center ml-70">
                <div className="bg-white p-6 rounded-2xl shadow-lg">
                  <h2 className="text-purple-700 font-bold text-xl mb-6 flex items-center gap-2">
                    <span>🏠</span> ชื่อคลาส
                  </h2>
                  <label className="block text-purple-600 text-sm mb-2">
                    ชื่อคลาส
                  </label>

                  {/* ช่องกรอกชื่อคลาส */}
                  <input
                    type="text"
                    value={className}
                    onChange={(e) => {
                      setClassName(e.target.value);
                      setError(null);
                    }}
                    placeholder="ชื่อคลาส"
                    className="w-full border-2 border-purple-200 rounded-4xl px-4 py-3 mb-6 focus:outline-none focus:border-purple-400" // CSS สำหรับ styling
                  />
                  {error && (
                    <div className="text-red-500 mb-4 text-sm">{error}</div>
                  )}

                  {/* ปุ่มสร้างคลาส */}
                  <div className="p-5">
                    <button
                      onClick={handleCreate}
                      disabled={loading}
                      className="w-full bg-purple-500 text-white py-3 rounded-xl font-medium hover:bg-purple-600 transition-colors" // CSS styling
                    >
                      {loading ? "กำลังสร้าง..." : "สร้าง"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* หน้าจอสแกน QR Code - แสดงเมื่อ scanning เป็น true */}
      {scanning && (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50"> {/* หน้าจอเต็มจอสำหรับการสแกน */}
          <div className="relative"> {/* Container สำหรับ video และ canvas */}
            {/* Video element สำหรับแสดงภาพจากกล้อง */}
            <video
              ref={videoRef} // เชื่อมต่อกับ useRef
              autoPlay // เล่นอัตโนมัติ
              playsInline // เล่นแบบ inline (สำหรับมือถือ)
              style={{ width: '100%', maxWidth: '640px' }} // กำหนดขนาด
            />

            {/* Canvas element สำหรับวาดกรอบการสแกน */}
            <canvas
              ref={canvasRef} // เชื่อมต่อกับ useRef
              style={{
                position: 'absolute', // วางทับบน video
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
              }}
            />
          </div>

          {/* ปุ่มปิดการสแกน */}
          <button
            className="absolute top-2 right-1 text-purple-500 hover:text-purple-700" // จัดตำแหน่งและสี
            onClick={() => { // ฟังก์ชันเมื่อคลิกปิด
              setScanning(false); // ปิดสถานะการสแกน

              // ถ้ามี video stream อยู่ให้หยุดการทำงาน
              if (videoRef.current?.srcObject) {
                const stream = videoRef.current.srcObject as MediaStream; // แปลงเป็น MediaStream
                stopCamera(stream); // หยุดกล้อง
                videoRef.current.srcObject = null; // ล้าง video source
              }
            }}
          >
            <FaTimes size={40} /> {/* ไอคอนปิด ขนาด 40px */}
          </button>
        </div>
      )}
    </div>
  )
};

// ส่งออก Component เป็น default export
export default AddClassPopup;