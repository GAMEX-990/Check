// components/ClassCardWithStatus.tsx
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { ClassData } from "@/types/classDetailTypes";
import { User } from "firebase/auth";
import { useClassSummary } from "@/hook/useClassSummary";

interface ClassCardWithStatusProps {
  cls: ClassData;
  user: User;
  onClick: () => void;
  isEntering?: boolean;
}

const ClassCard = ({
  cls,
  user,
  onClick,
}: ClassCardWithStatusProps) => {

    const {
        totalOnTime,
        totalAbsent,
        totalLate,
      } = useClassSummary(cls.id, false);

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 1.05 }}>
      <div
        className="flex justify-between md:w-100 items-center bg-purple-50 hover:bg-purple-100 p-4 rounded-4xl shadow-lg inset-shadow-sm cursor-pointer"
        onClick={onClick}
      >
        <div className="flex gap-3 items-center">
          <div className="bg-purple-500 text-white text-4xl font-bold w-12 h-12 flex justify-center rounded-full shadow-lg">
            {cls.name.charAt(0)}
          </div>
          <div className="flex flex-col">
            <div className="flex gap-x-1">
              <p className="text-md font-bold text-purple-800">{cls.name}</p>
              {user?.uid && cls.checkedInMembers?.includes(user.uid) && (
                <p className="text-green-600">
                  <Check />
                </p>
              )}
            </div>
            <div>
              <p className="truncate w-full max-w-[80px] text-base md:max-w-full text-purple-500">
                {cls.owner_email}
              </p>
              <p className="truncate w-full max-w-[80px] text-base md:max-w-full text-purple-500">
                มาเรียน {totalOnTime + totalLate} วัน
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ClassCard;
