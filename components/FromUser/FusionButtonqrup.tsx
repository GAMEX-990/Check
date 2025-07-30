"use client";
import { db } from "@/lib/firebase";
import { CreateQRCodeAndUploadProps } from "@/types/Fusionqrup";
import { handleExportXLSX } from "@/utils/exportXLSXHandler";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { Download, FileUp, Loader, QrCode, X, Trash2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import DeleteClassModal from "../UserInterface/DeleteClassModal";
import { uploadStudentsFromFile } from "@/utils/parseCSVFile";

const CreateQRCodeAndUpload: React.FC<CreateQRCodeAndUploadProps> = ({
  classId,
  user,
  classData,
  onDeleteSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoadingOwner, setIsLoadingOwner] = useState(true);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const checkOwnerStatus = async () => {
      if (!user || !classId) {
        setIsOwner(false);
        setIsLoadingOwner(false);
        return;
      }

      try {
        const classRef = doc(db, "classes", classId);
        const classSnap = await getDoc(classRef);
        if (classSnap.exists()) {
          const classData = classSnap.data();
          const isClassOwner =
            classData.owner_email === user.email ||
            classData.created_by === user.uid;
          setIsOwner(isClassOwner);
        } else {
          setIsOwner(false);
        }
      } finally {
        setIsLoadingOwner(false);
      }
    };

    checkOwnerStatus();
  }, [user, classId]);

  // Countdown QR Code modal 3 นาที
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

    window.addEventListener("keydown", blockKeys);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("keydown", blockKeys);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // ฟังก์ชันตรวจสอบไฟล์
  const validateFile = (file: File): boolean => {
    // ตรวจสอบประเภทไฟล์
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error("กรุณาเลือกไฟล์ Excel (.xlsx, .xls) หรือ CSV เท่านั้น");
      return false;
    }

    return true;
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    classId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file first
    if (!validateFile(file)) {
      // รีเซ็ต file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // แสดง loading toast
    const loadingToast = toast.loading("กำลังอัปโหลดข้อมูลนักเรียน...");

    try {
      const result = await uploadStudentsFromFile(file, classId);
      
      // ปิด loading toast
      toast.dismiss(loadingToast);
      
      if (result.success) {
        // แสดงข้อความสำเร็จพร้อมจำนวนที่อัปโหลด
        toast.success(result.message || `อัปโหลดข้อมูลนักเรียนสำเร็จ ${result.uploaded} รายการ!`);
        
        // แสดง errors ถ้ามี
        if (result.errors && result.errors.length > 0) {
          toast.warning(`มีข้อผิดพลาด ${result.errors.length} รายการ`, {
            description: "กรุณาตรวจสอบข้อมูลในไฟล์"
          });
        }
      } else {
        toast.error(result.message || "เกิดข้อผิดพลาดในการอัปโหลด");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error("เกิดข้อผิดพลาดในการอัปโหลดไฟล์");
      console.error("Upload error:", error);
    }

    // รีเซ็ต file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateQR = () => {
    const qrLink = `https://your-app-url/class/${classId}`;
    setQrCode(qrLink);
    setShowQRModal(true);
  };

  const handleCloseQR = () => {
    setShowQRModal(false);
  };

  const onUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleExportClick = () => {
    handleExportXLSX(classId, user);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const handleDeleteSuccess = () => {
    onDeleteSuccess?.();
    setShowDeleteModal(false);
  };

  if (isLoadingOwner) {
    return (
      <div className="flex justify-center items-center h-full text-purple-600">
        <Loader />
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-x-2">
        <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 1 }}>
          <button onClick={handleCreateQR} className="cursor-pointer">
            <QrCode />
          </button>
        </motion.div>

        {!isLoadingOwner && isOwner && (
          <div className="flex gap-x-2">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={(e) => handleFileUpload(e, classId)}
            />
            <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 1 }}>
              <button onClick={onUploadButtonClick} className="cursor-pointer">
                <FileUp />
              </button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 1 }}>
              <button onClick={handleExportClick} className="cursor-pointer">
                <Download />
              </button>
            </motion.div>
            {/* ปุ่มลบที่ย้ายมาจากไฟล์เดิม */}
            <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 1 }}>
              <button 
                onClick={handleDeleteClick}
                className="cursor-pointer text-red-500 hover:text-red-700"
                title="ลบคลาส"
              >
                <Trash2 size={24} />
              </button>
            </motion.div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && qrCode && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-20 select-none">
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

              <div className="flex flex-col items-center justify-center p-15 md:p-40 relative">
                <QRCode
                  value={qrCode}
                  size={280}
                  className="pointer-events-none select-none"
                />
                <div
                  id="qr-blur-overlay"
                  className="absolute inset-0 bg-white/60 backdrop-blur-sm hidden transition duration-300"
                />
                <div className="mt-4 text-sm text-gray-500">
                  QR จะหมดอายุใน {Math.floor(remainingTime / 60)}:
                  {String(remainingTime % 60).padStart(2, "0")} นาที
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Class Modal */}
      <DeleteClassModal
        isOpen={showDeleteModal}
        onClose={handleCloseDeleteModal}
        classData={classData ? {
          id: classData.id,
          name: classData.name,
          memberCount: classData.memberCount
        } : {
          id: classId,
          name: "Unknown Class",
          memberCount: 0
        }}
        user={user}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </div>
  );
};

export default CreateQRCodeAndUpload;