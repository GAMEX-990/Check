import { motion } from "framer-motion";
import { QrCode } from "lucide-react";
import { ClassData } from "@/types/classDetailTypes";
import { useClassSummary } from "@/hook/useClassSummary";

interface MyClassCardProps {
    cls: ClassData;
    onSelectClass: (classData: ClassData) => void;
    onCreateQR: (e: React.MouseEvent, classData: ClassData) => void;
}

const MyClassCard = ({ cls, onSelectClass, onCreateQR }: MyClassCardProps) => {
    // ใช้ useClassSummary สำหรับแต่ละคลาส
    const {
        totalStudents,
    } = useClassSummary(cls.id, true);

    return (
        <motion.div
            key={cls.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 1.05 }}
        >
            <div
                className="flex justify-between md:w-100 items-center bg-purple-50 hover:bg-purple-100 p-4 rounded-4xl shadow-lg inset-shadow-sm cursor-pointer"
                onClick={() => onSelectClass(cls)}
            >
                <div className="flex flex-col gap-y-1">
                    <span className="text-lg font-semibold text-purple-800">{cls.name}</span>
                    <p className="text-sm text-purple-600">
                        จำนวนนักเรียน {totalStudents} คน
                    </p>
                </div>
                    <div
                        className="bg-purple-500 text-white text-4xl font-bold w-12 h-12 flex justify-center items-center rounded-full shadow-lg hover:bg-purple-600 transition-colors"
                        onClick={(e) => onCreateQR(e, cls)}
                    >
                        <QrCode size={24} />
                    </div>
                </div>
        </motion.div>
    );
};

export default MyClassCard;