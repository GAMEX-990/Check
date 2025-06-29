import { db } from "@/lib/firebase";
import { CreateQRCodeAndUploadProps } from "@/types/Fusionqrup";
import { handleExportXLSX } from "@/utils/exportXLSXHandler";
import { uploadStudentsFromFile } from "@/utils/parseCSVFile";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  FirestoreError,
} from "firebase/firestore";
import { motion } from "framer-motion";
import { X, QrCode, Upload, Download } from "lucide-react";
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasData, setHasData] = useState(false);

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
          const isClassOwner =
            classData.owner_email === currentUser.email ||
            classData.created_by === currentUser.uid;
          setIsOwner(isClassOwner);

          // ตรวจสอบว่ามีข้อมูลนักเรียนในคลาสหรือไม่
          const attendanceRef = collection(db, "attendance");
          const attendanceQuery = query(
            attendanceRef,
            where("classId", "==", classId)
          );
          const attendanceSnap = await getDocs(attendanceQuery);
          setHasData(!attendanceSnap.empty);
        } else {
          setIsOwner(false);
          setHasData(false);
        }
      } catch (error: unknown) {
        console.error("Error checking owner status:", error);
        if (error instanceof FirestoreError) {
          toast.error(`เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์: ${error.message}`);
        } else {
          toast.error("เกิดข้อผิดพลาดในการตรวจสอบสิทธิ์");
        }
        setHasData(false);
      } finally {
        setIsLoadingOwner(false);
      }
    };

    checkOwnerStatus();
  }, [currentUser, classId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isOwner) {
      toast.error(
        "คุณไม่มีสิทธิ์ในการอัปโหลดไฟล์ เฉพาะเจ้าของคลาสเท่านั้นที่สามารถอัปโหลดได้"
      );
      return;
    }

    if (isProcessing) return;

    setIsProcessing(true);
    toast.loading("กำลังอัปโหลดข้อมูลนักเรียน...");

    try {
      await uploadStudentsFromFile(file, classId);
      toast.success("อัปโหลดข้อมูลนักเรียนสำเร็จ");
    } catch (error) {
      toast.error(
        "เกิดข้อผิดพลาดในการอัปโหลด: " +
          (error instanceof Error ? error.message : "ไม่ทราบสาเหตุ")
      );
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
    if (!isOwner) {
      toast.error(
        "คุณไม่มีสิทธิ์ในการอัปโหลดไฟล์ เฉพาะเจ้าของคลาสเท่านั้นที่สามารถอัปโหลดได้"
      );
      return;
    }
    fileInputRef.current?.click();
  };

  const handleExportClick = async () => {
    if (isProcessing) return;

    if (!hasData) {
      toast.error(
        "ไม่พบข้อมูลที่จะส่งออก กรุณาตรวจสอบว่ามีการเช็คชื่อในคลาสนี้แล้ว"
      );
      return;
    }

    setIsProcessing(true);
    toast.loading("กำลังส่งออกข้อมูล...");

    try {
      await handleExportXLSX(classId, currentUser);
      toast.success("ส่งออกข้อมูลสำเร็จ");
    } catch (error) {
      toast.error(
        "เกิดข้อผิดพลาดในการส่งออก: " +
          (error instanceof Error ? error.message : "ไม่ทราบสาเหตุ")
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={handleCreateQR}
        className="w-full flex items-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
      >
        <QrCode className="h-5 w-5 text-purple-600" />
        <span className="text-purple-600 font-medium">สร้าง QR</span>
      </motion.button>

      <div className="relative">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onUploadButtonClick}
          disabled={isLoadingOwner || !isOwner || isProcessing}
          className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg transition-colors border ${
            isLoadingOwner || !isOwner || isProcessing
              ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200"
              : "bg-white text-purple-600 hover:bg-gray-50 border-gray-200"
          }`}
          title={!isOwner ? "เฉพาะเจ้าของคลาสเท่านั้นที่สามารถอัปโหลดได้" : ""}
        >
          <Upload className="h-5 w-5" />
          <span className="font-medium">
            {isProcessing ? "กำลังอัปโหลด..." : "อัปโหลด CSV"}
          </span>
        </motion.button>
      </div>

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={handleExportClick}
        disabled={isProcessing || !hasData}
        className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg transition-colors border ${
          isProcessing || !hasData
            ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200"
            : "bg-white text-purple-600 hover:bg-gray-50 border-gray-200"
        }`}
        title={!hasData ? "ไม่พบข้อมูลที่จะส่งออก" : ""}
      >
        <Download className="h-5 w-5" />
        <span className="font-medium">
          {isProcessing
            ? "กำลังส่งออก..."
            : !hasData
            ? "ไม่มีข้อมูล"
            : "ส่งออก"}
        </span>
      </motion.button>

      {showQRModal && qrCode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="relative p-6">
              <button
                onClick={handleCloseQR}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col items-center">
                <h3 className="text-lg font-semibold text-purple-900 mb-6">
                  QR Code สำหรับเข้าร่วมคลาส
                </h3>
                <div className="bg-white p-4 rounded-lg shadow-inner">
                  <QRCode value={qrCode} size={200} />
                </div>
                <p className="mt-4 text-sm text-purple-600 text-center">
                  สแกน QR Code นี้เพื่อเข้าร่วมคลาส
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CreateQRCodeAndUpload;
