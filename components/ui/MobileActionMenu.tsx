import React, { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, FileUp, QrCode, Trash2 } from "lucide-react";
import QRCode from "react-qr-code";
import { X } from "lucide-react";
import { toast } from "sonner";
import DeleteClassModal from "../UserInterface/DeleteClassModal";
import { handleExportXLSX } from "@/utils/exportXLSXHandler";
import { uploadStudentsFromFile } from "@/utils/parseCSVFile";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { MobileActionMenuProps } from "@/types/MobileActionMenuType";
import { AlertDialogMobile } from "../TourGuide/Howtousemobile";
import LateThresholdDropdown from "./LateThresholdDropdown";
import { ClassData } from "@/types/classDetailTypes";

interface ClassDataWithLate extends ClassData {
    lateThresholdMinutes?: number;
}

const MobileActionMenu: React.FC<MobileActionMenuProps> = ({
    cls,
    classId,
    user,
    classData,
    onDeleteSuccess,
    onActionStart
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [remainingTime, setRemainingTime] = useState<number>(0);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isLoadingOwner, setIsLoadingOwner] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
    const initialThreshold = 15; // Define initial threshold
    const [lateThreshold, setLateThreshold] = useState<number>(initialThreshold);

    // เปลี่ยนจาก useMemo เป็น useEffect เพื่อให้อัพเดทตามการเปลี่ยนแปลงของ cls
    useEffect(() => {
        if (!cls) return;

        const data = cls as ClassDataWithLate;
        const newThreshold = typeof data.lateThresholdMinutes === 'number' ? data.lateThresholdMinutes : 15;
        setLateThreshold(newThreshold);
    }, [cls]); // เปลี่ยนเป็น cls.lateThresholdMinutes เพื่อให้ sync กัน

    // เพิ่ม useEffect เพื่อ listen การเปลี่ยนแปลงจาก Firebase
    useEffect(() => {
        if (!classId) return;

        const classRef = doc(db, "classes", classId);

        // Listen การเปลี่ยนแปลงแบบ real-time
        const unsubscribe = onSnapshot(classRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data() as ClassDataWithLate;
                if (typeof data.lateThresholdMinutes === 'number') {
                    setLateThreshold(data.lateThresholdMinutes);
                }
            }
        });

        return () => unsubscribe();
    }, [classId]);

    const handleChangeThreshold = async (val: number) => {
        setLateThreshold(val);
        const classRef = doc(db, "classes", classId);
        await updateDoc(classRef, { lateThresholdMinutes: val });
    };

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

    // Countdown QR Code modal
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

    const validateFile = (file: File): boolean => {
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv'
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
        onActionStart?.(); // ปิด dropdown

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
        } catch {
            // ใช้ underscore แทน error เพื่อบอกว่าไม่ได้ใช้งาน
            toast.dismiss(loadingToast);
            toast.error("เกิดข้อผิดพลาดในการอัปโหลดไฟล์");
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
        // ไม่ปิด dropdown เพื่อให้ QR modal แสดง
    };

    const handleCloseQR = () => {
        setShowQRModal(false);
    };

    const onUploadButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleExportClick = () => {
        handleExportXLSX(classId, user);
        onActionStart?.(); // ปิด dropdown
    };

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
        // ไม่ปิด dropdown เพื่อให้ delete modal แสดง
    };

    const handleCloseDeleteModal = () => {
        setShowDeleteModal(false);
    };

    const handleDeleteSuccess = () => {
        onDeleteSuccess?.();
        setShowDeleteModal(false);
    };

    return (
        <div>
            <div className="flex md:gap-x-2 gap-x-1">
                {!isLoadingOwner && !isOwner && (
                    <div className="flex text-purple-600 flex-col gap-y-2">
                        <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 1 }}>
                            <div className="flex  space-x-1 text-center">
                                <button className="cursor-pointer">
                                    <AlertDialogMobile />
                                </button>
                                <span>วิธีใช้งาน</span>
                            </div>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 1 }}>
                            <div className="flex  space-x-1 text-center">
                                <button onClick={handleCreateQR} className="cursor-pointer qr-code-button">
                                    <QrCode />
                                </button>
                                <span>QR Code เข้าคลาส</span>
                            </div>
                        </motion.div>
                    </div>
                )}
                {!isLoadingOwner && isOwner && (
                    <div className="flex text-purple-600 flex-col gap-y-2">
                        <input
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            ref={fileInputRef}
                            style={{ display: "none" }}
                            onChange={(e) => handleFileUpload(e, classId)}
                        />
                        <div className="flex space-x-1 text-center">
                            <LateThresholdDropdown
                                value={lateThreshold}
                                onChange={handleChangeThreshold}
                            />
                            <span>(ตั้งสาย)</span>
                        </div>
                        <div className="flex  space-x-1 text-center">
                            <button onClick={handleCreateQR} className="cursor-pointer qr-code-button">
                                <QrCode />
                            </button>
                            <span>QR Code เข้าคลาส</span>
                        </div>
                        <div className="flex space-x-1 text-center">
                            <button onClick={onUploadButtonClick} className="upload-file-button cursor-pointer">
                                <FileUp />
                            </button>
                            <span>อัพโหลดไฟล์ csv xlsx</span>
                        </div>
                        <div className="flex space-x-1 text-center">

                            <button onClick={handleExportClick} className="cursor-pointer download-data-button">
                                <Download />
                            </button>
                            <span>โหลดไฟล์ Excel</span>
                        </div>
                        {/* ปุ่มลบที่ย้ายมาจากไฟล์เดิม */}
                        <div className="delete-class-button flex space-x-1 text-center">
                            <button
                                onClick={handleDeleteClick}
                                className=" cursor-pointer text-red-500 hover:text-red-700"
                                title="ลบคลาส"
                            >
                                <Trash2 size={24} />
                            </button>
                            <span>ลบคลาส</span>
                        </div>
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

export default MobileActionMenu;