import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { ArrowRight, Loader2, Plus, School } from "lucide-react";
import { useHasScanned } from "@/utils/hasScanned";
import { ClassData } from "@/types/classTypes";
import { motion } from "framer-motion";

interface MyClassPageProps {
  onNext: () => void;
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

const MyClassPage = ({ onNext, onSelectClass }: MyClassPageProps) => {
  const { user, loading } = useHasScanned();
  const [classes, setClasses] = useState<ClassData[]>([]);

  useEffect(() => {
    if (loading || !user) return;

    const classesRef = collection(db, "classes");
    const q = query(classesRef, where("owner_email", "==", user.email));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const classList: ClassData[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<ClassData, "id">),
        }));
        setClasses(classList);
      },
      (error) => {
        console.error("Error listening to owner classes:", error);
      }
    );

    return () => unsubscribe();
  }, [user, loading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 bg-white rounded-xl shadow-sm p-8">
        <Loader2 className="h-8 w-8 text-purple-600 animate-spin mb-4" />
        <p className="text-purple-600 font-medium">Loading your classes...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-purple-100">
        <div className="flex items-center gap-2">
          <School className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-purple-900">My Classes</h2>
        </div>
        <button
          onClick={onNext}
          className="p-2 hover:bg-purple-50 rounded-full transition-colors"
        >
          <ArrowRight className="h-5 w-5 text-purple-600" />
        </button>
      </div>

      <div className="p-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {classes.length > 0 ? (
            classes.map((cls) => (
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
                    <h3 className="text-purple-900 font-medium truncate">
                      {cls.name}
                    </h3>
                    <p className="text-sm text-purple-600 truncate">
                      {cls.owner_email}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-purple-400 group-hover:text-purple-600 transition-colors" />
                </div>
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="bg-purple-50 p-4 rounded-full mb-4">
                <Plus className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-purple-900 font-medium mb-1">
                No Classes Yet
              </h3>
              <p className="text-purple-600 text-sm text-center">
                Create your first class to get started
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MyClassPage;
