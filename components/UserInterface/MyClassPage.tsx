import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { ArrowRight } from "lucide-react";
import { useHasScanned } from "@/utils/hasScanned";
import { ClassData } from "@/types/classTypes"; // <-- นำเข้า types ที่สร้างไว้

interface MyClassPageProps {
  onNext: () => void;
  onSelectClass: (classData: ClassData) => void;
}

const MyClassPage = ({ onNext, onSelectClass }: MyClassPageProps) => {
  const { user,loading } = useHasScanned();
  const [classes, setClasses] = useState<ClassData[]>([]); // ✅ ใช้ type ที่กำหนดไว้

  useEffect(() => {
    if (loading || !user) return;

    const classesRef = collection(db, "classes");
    const q = query(classesRef, where("owner_email", "==", user.email));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const classList: ClassData[] = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<ClassData, "id">), // 👈 แคสต์เฉพาะส่วนของ data ที่ไม่ใช่ id
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
      <div className="border-2 border-purple-500 rounded-2xl p-4 h-95">
        <div className="flex justify-center items-center h-full">
          <div className="text-purple-600">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="w-100 h-auto border-2 border-purple-500 rounded-2xl p-4 relative">
        <div className="flex justify-center">
          <h1 className="text-2xl font-bold text-purple-800 text-center">My Class</h1>
          <div className="absolute right-0">
            <button className="text-2xl text-purple-600" onClick={onNext}>
              <ArrowRight size={28} />
            </button>
          </div>
        </div>
        <div className="overflow-scroll h-80">
          <div className="flex flex-col gap-4">
            {classes.length > 0 ? (
              classes.map((cls) => (
                <div
                  key={cls.id}
                  className="flex justify-between items-center bg-purple-200 hover:bg-purple-300 p-4 rounded-4xl cursor-pointer"
                  onClick={() => onSelectClass(cls)}
                >
                  <span className="text-lg font-semibold text-purple-800">{cls.name}</span>
                  <div className="bg-purple-500 text-white text-4xl font-bold w-12 h-12 flex justify-center rounded-full">
                    {cls.name.charAt(0)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-purple-600 mt-4">ยังไม่มีคลาส</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyClassPage;
