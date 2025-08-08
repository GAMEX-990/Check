import type { User } from "firebase/auth";
import { ClassData } from "./DeleteClassTypes";

// กหนด props สำหรับ component
export interface CreateQRCodeAndUploadProps {
    classId: string; // ID ของคลาสเรียน
    user: User | null; 
    classData: ClassData;
    onDeleteSuccess?: () => void; // ← Add this line
    onBack?: () => void;
    isFirstCard?: boolean;
}