// src/components/ClassPage.tsx
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { ArrowLeft, Loader2, Users, CheckCircle2 } from "lucide-react";
import { useHasScanned } from "@/utils/hasScanned";
import { ClassData } from "@/types/classTypes";
import { motion } from "framer-motion";

interface ClassPageProps {
  onBack: () => void;
  onSelectClass: (classData: ClassData) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

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

  if (loading || classesLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-white rounded-xl shadow-sm p-8">
        <Loader2 className="h-8 w-8 text-purple-600 animate-spin mb-4" />
        <p className="text-purple-600 font-medium">
          Loading available classes...
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="h-auto w-100 border-2 border-purple-500 rounded-2xl p-4 relative">
        <div className="flex justify-center">
          <h1 className="text-2xl font-bold text-purple-800 text-center">Class</h1>
          <div className="absolute right-0">
            <button className="text-2xl text-purple-600" onClick={onBack}>
              <ArrowLeft size={28} />
            </button>
          </div>
        </div>
        <button
          onClick={onBack}
          className="p-2 hover:bg-purple-50 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-purple-600" />
        </button>
      </div>

      <div className="p-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {joinedClasses.length > 0 ? (
            joinedClasses.map((cls) => (
              <motion.div
                key={cls.id}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group cursor-pointer"
                onClick={() => onSelectClass(cls)}
              >
                <div className="flex items-center gap-4 p-4 rounded-lg bg-purple-50 group-hover:bg-purple-100 transition-colors">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-lg flex items-center justify-center font-bold text-xl shadow-sm">
                    {cls.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-purple-900 font-medium truncate">
                        {cls.name}
                      </h3>
                      {user?.uid &&
                        cls.checkedInMembers?.includes(user.uid) && (
                          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                        )}
                    </div>
                    <p className="text-sm text-purple-600 truncate">
                      Created by: {cls.owner_email}
                    </p>
                  </div>
                  <ArrowLeft className="h-5 w-5 text-purple-400 group-hover:text-purple-600 transition-colors" />
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="bg-purple-50 p-4 rounded-full mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-purple-900 font-medium mb-1">
                No Classes Available
              </h3>
              <p className="text-purple-600 text-sm text-center">
                Join a class to see it here
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ClassPage;
