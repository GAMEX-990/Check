import { db } from "@/lib/firebase";
import { CreateQRCodeAndUploadProps } from "@/types/Fusionqrup";
import { handleExportXLSX } from "@/utils/exportXLSXHandler";
import { uploadStudentsFromFile } from "@/utils/parseCSVFile";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { Download, FileUp, Loader, QrCode, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";

const CreateQRCodeAndUpload: React.FC<CreateQRCodeAndUploadProps> = ({
  classId,
  currentUser,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isLoadingOwner, setIsLoadingOwner] = useState(true);

  useEffect(() => {
    const checkOwnerStatus = async () => {
      if (!currentUser || !classId) {
        setIsOwner(false);
        setIsLoadingOwner(false);
        return;
      }

      try {
        const classRef = doc(db, "classes", classId);
        const classSnap = await getDoc(classRef);

        if (classSnap.exists()) {
          const classData = classSnap.data();
          // ตรวจสอบว่า currentUser เป็นเจ้าของคลาสหรือไม่
          const isClassOwner =
            classData.owner_email === currentUser.email ||
            classData.created_by === currentUser.uid;
          setIsOwner(isClassOwner);
        } else {
          setIsOwner(false);
        }
      } catch {
      } finally {
        setIsLoadingOwner(false);
      }
    };

    checkOwnerStatus();
  }, [currentUser, classId]);

  // ฟังก์ชันสำหรับจัดการการอัปโหลดไฟล์
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    classId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await uploadStudentsFromFile(file, classId);

    if (result.success) {
      toast.success("อัปโหลดข้อมูลนักเรียนสำเร็จ!");
    } else {
      toast.error("เกิดข้อผิดพลาดในการอัปโหลด");
    }
  };

  // ฟังก์ชันสำหรับสร้าง QR Code
  const handleCreateQR = () => {
    // สร้าง link สำหรับ QR code โดยใช้ classId
    const qrLink = `https://your-app-url/class/${classId}`;
    setQrCode(qrLink);
    setShowQRModal(true); // แสดง modal QR code
  };

  // ฟังก์ชันสำหรับปิด modal QR code
  const handleCloseQR = () => {
    setShowQRModal(false);
  };

  // เมื่อกดปุ่ม Upload CSV ให้เปิด input file
  const onUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleExportClick = async () => {
    handleExportXLSX(classId, currentUser);
  };

  if (isLoadingOwner) {
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
      <div className="flex gap-x-2">
        <div>
          <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 1 }}>
            <button
              className="cursor-pointer"
              onClick={handleCreateQR}
            >
              <QrCode />
            </button>
          </motion.div>
        </div>
        {!isLoadingOwner && isOwner && (
          <div className="flex gap-x-2">
            {/* ซ่อน input ไฟล์ไว้ */}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={(e) => handleFileUpload(e, classId)}
            />
            {/* ปุ่มสำหรับเปิด input file */}
            <div>
              <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 1 }}>
                <button
                  onClick={onUploadButtonClick}
                  className="cursor-pointer"
                >
                  <FileUp />
                </button>
              </motion.div>
            </div>
            <div>
              <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 1 }}>
                <button
                  onClick={handleExportClick}
                  className="cursor-pointer"
                >
                  <Download />
                </button>
              </motion.div>
            </div>
          </div>
        )}
      </div>
      {/* Modal สำหรับแสดง QR Code */}
      {showQRModal && qrCode && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-20">
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-10"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.4,
              scale: { type: "spring", visualDuration: 0.4, bounce: 0.5 },
            }}
          >
            {/* กล่อง modal */}
            <div className="relative bg-white rounded-4xl mx-5 shadow-lg overflow-hidden md:h-150 md:w-250">
              {/* วงกลมสีม่วงที่มุมขวาบน */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500 rounded-full"></div>
              {/* ปุ่มปิด modal - วางไว้บนวงกลมสีมวง */}
              <div>
                <button
                  onClick={handleCloseQR}
                  className="absolute top-2 right-2 z-10 text-white hover:text-gray-200 transition-colors"
                >
                  <X />
                </button>
              </div>

              {/* ส่วนแสดง QR Code */}
              <div className="flex items-center justify-center p-15  md:p-40">
                <QRCode value={qrCode} size={280} />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CreateQRCodeAndUpload;
