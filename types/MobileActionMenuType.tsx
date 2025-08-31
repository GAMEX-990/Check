import { ClassData } from "./DeleteClassTypes";

export interface MobileActionMenuProps {
    cls: ClassData;
    classId: string;
    user: any;
    classData: ClassData;
    isOwner: boolean;
    onDeleteSuccess: () => void;
    onActionStart?: () => void; // เรียกเมื่อเริ่ม action ที่ต้องการปิด dropdown
}