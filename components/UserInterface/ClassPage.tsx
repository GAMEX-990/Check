// src/components/ClassPage.tsx
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { Check } from "lucide-react";
import { useHasScanned } from "@/utils/hasScanned";
import { ClassData } from "@/types/classTypes";
import { motion } from "framer-motion";
import { ClassPageType } from "@/types/classTypes";
import Loader from "../Loader/Loader";

interface ClassPageProps {
  page: ClassPageType;
  onSelectClass: (classData: ClassData) => void;
  onPageChange: (page: ClassPageType) => void;
}

const ClassPage = ({ onSelectClass }: ClassPageProps) => {
  const { user, hasScanned, loading } = useHasScanned();
  const [joinedClasses, setJoinedClasses] = useState<ClassData[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [delayDone, setdelayDone] = useState(false);



  useEffect(() => {
    const timer = setTimeout(() => {
      setdelayDone(true);
    }, 2000); // 600ms ดีเลย์

    return () => clearTimeout(timer);
  }, []);

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

  if (loading || !delayDone) {
    return (
      <div>
        <div className="flex justify-center items-center h-full">
          <div className="text-purple-600"><Loader /></div>
        </div>
      </div>
    );
  }

  return (
    <div>

      <div className="overflow-scroll h-80 ">
        <div className="flex flex-col gap-4 p-4">
          {classesLoading ? (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center ">
              <Loader />
            </div>
          ) : isEntering ? (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center ">
              <Loader />
            </div>
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
                      className="flex justify-between items-center bg-purple-50 hover:bg-purple-100 p-4 rounded-4xl shadow-lg cursor-pointer relative"
                      onClick={() => {
                        setIsEntering(true);
                        setTimeout(() => {
                          onSelectClass(cls);
                        }, 2000);
                      }}
                    >
                      <div className="flex gap-3">
                        <div className="bg-purple-500 text-white text-4xl font-bold w-12 h-12 flex justify-center rounded-full">
                          {cls.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex gap-x-1">
                            <p className="text-md font-bold text-purple-800">{cls.name}</p>
                            <div>
                              {user?.uid && cls.checkedInMembers?.includes(user.uid) && (
                                <p className="text-green-600"><Check /></p>
                              )}
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-purple-600 break-words">{cls.owner_email}</p>
                          </div>
                        </div>
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
  );
};

export default ClassPage;