import { useState, useEffect, useCallback } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { ArrowRight } from "lucide-react";
import AddClassPopup from "../FromUser/ButtonCreate";
import { onAuthStateChanged, User } from "firebase/auth";
import { useHasScanned } from "@/utils/hasScanned";

interface MyClassPageProps {
  onNext: () => void;
  onSelectClass: (classData: any) => void;
}

// -- หน้าที่ 1: MyClassPage
const MyClassPage = ({ onNext, onSelectClass }: MyClassPageProps) => {
  const { user, hasScanned, updateScanStatus, loading } = useHasScanned();
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    if (loading || !user) return;

    console.log("Setting up owner classes listener for user:", user.email);

    const classesRef = collection(db, "classes");
    const q = query(classesRef, where("owner_email", "==", user.email));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const classList: any[] = [];
      querySnapshot.forEach((doc) => {
        classList.push({ id: doc.id, ...doc.data() });
      });
      console.log("Owner classes loaded:", classList.length);
      setClasses(classList);
    }, (error) => {
      console.error("Error listening to owner classes:", error);
    });

    return () => {
      console.log("Cleaning up owner classes listener");
      unsubscribe();
    };
  }, [user, loading]);

  // แสดง loading ขณะกำลังโหลดข้อมูล
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
      <div className=" ">
        <div className="w-100 h-auto border-2 border-purple-500  rounded-2xl p-4 relative">
          {/* Header */}
          <div className="flex justify-center">
            <div className="">
              <h1 className="text-2xl font-bold text-purple-800 text-center">My Class</h1>
            </div>
            <div className=" absolute right-0">
              <button className="text-2xl text-purple-600" onClick={onNext}>
                <ArrowRight size={28} />
              </button>
            </div>
          </div>
          {/* Class List - แสดงเฉพาะคลาสที่เป็นเจ้าของ */}
          <div className="overflow-scroll h-80">
            {classes.length > 0 &&
              classes.map((cls) => (
                <div>
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
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyClassPage;