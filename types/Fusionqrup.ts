
// กหนด props สำหรับ component
export interface CreateQRCodeAndUploadProps {
    classId: string; // ID ของคลาสเรียน
    currentUser: { uid: string; email: string; } | null; // ข้อมูลผู้ใช้ปัจจุบัน
}