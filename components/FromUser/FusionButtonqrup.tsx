import { handleExportPDF } from '@/utils/exportPDFHandler';
import { uploadStudentsFromFile } from '@/utils/parseCSVFile';
import React, { useRef, useState } from 'react';
import QRCode from 'react-qr-code';

// กำหนด props สำหรับ component
interface CreateQRCodeAndUploadProps {
    classId: string; // ID ของคลาสเรียน
    currentUser: { uid: string } | null; // ข้อมูลผู้ใช้ปัจจุบัน
}

const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, classId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await uploadStudentsFromFile(file, classId);

    if (result.success) {
        alert("อัปโหลดข้อมูลนักเรียนสำเร็จ!");
    } else {
        alert("เกิดข้อผิดพลาดในการอัปโหลด");
    }
};


const CreateQRCodeAndUpload: React.FC<CreateQRCodeAndUploadProps> = ({ classId, currentUser }) => {
    // state สำหรับเก็บค่า QR code และสถานะการแสดง modal
    // สร้าง ref สำหรับ input file
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [isUploading, setIsUploading] = useState(false);


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
        if (isUploading) return;
        fileInputRef.current?.click();
    };

    const handleExportClick = async () => {
        handleExportPDF(classId, currentUser);
    }


    return (
        <div>
            <div className="flex flex-row md:flex-col gap-2 items-center justify-center">
                <div>
                    <button
                        className="w-auto h-auto border-1 border-purple-600 text-purple-600 p-2 rounded-2xl hover:bg-purple-100"
                        onClick={handleCreateQR}
                    >
                        Create QR
                    </button>
                </div>
                <div>
                    {/* ซ่อน input ไฟล์ไว้ */}
                    <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload(e, classId)}
                    />
                    {/* ปุ่มเดียวที่ใช้เปิด input file */}
                     {/* ปุ่มสำหรับเปิด input file */}
                     <button
                        onClick={onUploadButtonClick}
                        disabled={isUploading}
                        className={`w-auto h-auto border-1 p-2 rounded-2xl transition-colors ${
                            isUploading 
                                ? 'border-gray-400 text-gray-400 cursor-not-allowed'
                                : 'border-purple-600 text-purple-600 hover:bg-purple-100'
                        }`}
                    >
                        {isUploading ? 'กำลังอัปโหลด...' : 'Upload Excel/CSV'}
                    </button>
                </div>
                <div>
                    <button
                        onClick={handleExportClick}
                        className="border-1 border-purple-600 text-purple-600 p-2 rounded-2xl hover:bg-purple-100"
                    >
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Modal สำหรับแสดง QR Code */}
            {showQRModal && qrCode && (
                <div className="fixed inset-0 flex items-center justify-center z-10">
                    {/* พื้นหลังสีเทาโปร่งใส */}
                    <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}></div>

                    {/* กล่อง modal */}
                    <div className="relative bg-white rounded-4xl p-12 w-250 h-150 mx-4 shadow-lg overflow-hidden">
                        {/* วงกลมสีม่วงที่มุมขวาบน */}
                        <div className="absolute -top-16 -right-16 w-40 h-40 bg-purple-500 rounded-full"></div>

                        {/* ปุ่มปิด modal - วางไว้บนวงกลมสีม่วง */}
                        <button
                            onClick={handleCloseQR}
                            className="absolute top-2 right-2 z-10 text-white hover:text-gray-200 transition-colors"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>

                        {/* ส่วนแสดง QR Code */}
                        <div className="flex items-center justify-center p-25">
                            <QRCode value={qrCode} size={280} />
                        </div>
                    </div>
                </div>
            )}

            {/* ส่วนอัปโหลดไฟล์ CSV */}
            <div>
                <div className="h-0 w-0">

                </div>
                {/* input file ที่ซ่อนไว้ */}
                <input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    // onChange={handleUploadCSV}
                    className="hidden"
                />
            </div>
        </div>
    );
};

export default CreateQRCodeAndUpload;