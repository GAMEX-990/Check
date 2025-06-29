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


const CreateQRCodeAndUpload: React.FC<CreateQRCodeAndUploadProps> = ({ classId, currentUser }) => {
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
                const classRef = doc(db, 'classes', classId);
                const classSnap = await getDoc(classRef);

                if (classSnap.exists()) {
                    const classData = classSnap.data();
                    // ตรวจสอบว่า currentUser เป็นเจ้าของคลาสหรือไม่
                    const isClassOwner = classData.owner_email === currentUser.email ||
                        classData.created_by === currentUser.uid;
                    setIsOwner(isClassOwner);
                } else {
                    setIsOwner(false);
                }
            } catch{
            } finally {
                setIsLoadingOwner(false);
            }
        };

        checkOwnerStatus();
    }, [currentUser, classId]);

    // ฟังก์ชันสำหรับจัดการการอัปโหลดไฟล์
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, classId: string) => {
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


        // ตรวจสอบสิทธิ์ก่อนอัปโหลด
        if (!isOwner) {
            toast.error('❌ คุณไม่มีสิทธิ์ในการอัปโหลดไฟล์\nเฉพาะเจ้าของคลาสเท่านั้นที่สามารถอัปโหลดได้');
            return;
        }

        fileInputRef.current?.click();
    };

    const handleExportClick = async () => {
        handleExportXLSX(classId, currentUser);
    }



    return (
        <div>
            <div className="flex flex-row md:flex-col gap-2 items-center justify-center">

                <div>
                    <motion.div
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 1 }}
                    >
                        <button
                            className="w-auto h-auto border-1 border-purple-600 text-purple-600 p-2 rounded-2xl hover:bg-purple-100"
                            onClick={handleCreateQR}
                        >
                            Create QR
                        </button>
                    </motion.div>
                </div>
                <div>
                    {/* ซ่อน input ไฟล์ไว้ */}
                    <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload(e, classId)}
                    />
                    {/* ปุ่มสำหรับเปิด input file */}
                    <motion.div
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 1 }}
                    >
                        <button
                            onClick={onUploadButtonClick}
                            disabled={isLoadingOwner || !isOwner}
                            className={`w-auto h-auto border-1 p-2 rounded-2xl transition-colors ${isLoadingOwner || !isOwner
                                ? 'border-gray-400 text-gray-400 cursor-not-allowed'
                                : 'border-purple-600 text-purple-600 hover:bg-purple-100'
                                }`}
                            title={!isOwner ? 'เฉพาะเจ้าของคลาสเท่านั้นที่สามารถอัปโหลดได้' : ''}
                        >
                            Upload CSV
                        </button>
                    </motion.div>
                </div>
                <div>
                    <motion.div
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 1 }}
                    >
                        <button
                            onClick={handleExportClick}
                            className="border-1 border-purple-600 text-purple-600 p-2 rounded-2xl hover:bg-purple-100"
                        >
                            Export
                        </button>
                    </motion.div>
                </div>
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