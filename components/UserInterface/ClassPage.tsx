// src/components/ClassPage.tsx
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { ArrowLeft } from "lucide-react";
import { useHasScanned } from "@/utils/hasScanned";
import { ClassData } from "@/types/classTypes";
import { motion } from "framer-motion";

interface ClassPageProps {
  onBack: () => void;
  onSelectClass: (classData: ClassData) => void;
}

const ClassPage = ({ onBack, onSelectClass }: ClassPageProps) => {
  const { user, hasScanned, loading } = useHasScanned();
  const [joinedClasses, setJoinedClasses] = useState<ClassData[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);

  useEffect(() => {
    if (!user?.uid || loading) return;

    console.log("Setting up classes listener for user:", user.uid);
    setClassesLoading(true);

    const classesRef = collection(db, "classes");
    const q = query(
      classesRef,
      where("checkedInMembers", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const classes: ClassData[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<ClassData, "id">),
        }));
        setJoinedClasses(classes);
        setClassesLoading(false);
      },
      (error) => {
        console.error("Error listening to classes:", error);
        setClassesLoading(false);
      }
    );

    return () => {
      console.log("Cleaning up classes listener");
      unsubscribe();
    };
  }, [user?.uid, hasScanned, loading]);

  if (loading) {
    return (
      <div className="border-2 border-purple-500 rounded-2xl p-4 h-95">
        <div className="flex justify-center items-center h-full">
          <div className="text-purple-600">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="h-auto w-100 border-2 border-purple-500 rounded-2xl p-4 relative">
        <div className="flex justify-center">
          <h1 className="text-2xl font-bold text-purple-800 text-center">Class</h1>
<<<<<<< HEAD
          <div className="absolute right-0">
=======
          <div className="absolute right-0 mx-4">
>>>>>>> parent of c07e200 (Update dependencies and enhance UI components)
            <button className="text-2xl text-purple-600" onClick={onBack}>
              <ArrowLeft size={28} />
            </button>
          </div>
        </div>
        <div className="overflow-scroll h-80">
          <div className="flex flex-col gap-4 p-4">
            {classesLoading ? (
              <div className="text-center text-purple-600">กำลังโหลดคลาส...</div>
            ) : (
              <>
                {joinedClasses.map((cls) => (
                  <div key={cls.id}>
                    <motion.div
                      key={cls.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 1.05 }}
                    >
                      <div
                        className="flex justify-between items-center bg-purple-200 hover:bg-purple-300 p-4 rounded-4xl cursor-pointer"
                        onClick={() => onSelectClass(cls)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-500 text-white text-4xl font-bold w-12 h-12 flex justify-center rounded-full">
                            {cls.name.charAt(0)}
                          </div>
                          <div className="">
                            <p className="text-lg font-bold text-purple-800">{cls.name}</p>
                            <p className="text-sm text-purple-600  tracking-tight whitespace-nowrap">สร้างโดย:{cls.owner_email}</p>
                          </div>
                        </div>
                        <div className="">
                        {user?.uid && cls.checkedInMembers?.includes(user.uid) && (
                          <p className="text-green-600 text-xs tracking-tight whitespace-nowrap">เช็คชื่อแล้ว</p>
                        )}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassPage;
