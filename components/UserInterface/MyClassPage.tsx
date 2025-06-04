import { useUser } from "@clerk/clerk-react";
import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
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

interface MyClassPageProps {
  onNext: () => void;
  onSelectClass: (classData: any) => void;
}

// -- หน้าที่ 1: MyClassPage
const MyClassPage = ({ onNext, onSelectClass }: MyClassPageProps) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const [classes, setClasses] = useState<any[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [loading, setLoading] = useState(true);

  // ฟังก์ชันสำหรับดึงสถานะ hasScanned จาก Firestore
  const fetchUserScanStatus = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const userDocRef = doc(db, "userSettings", user.id);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setHasScanned(userData.hasScanned || false);
      } else {
        // ถ้าไม่มี document สร้างใหม่
        await setDoc(userDocRef, {
          hasScanned: false,
          userId: user.id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        setHasScanned(false);
      }
    } catch (error) {
      console.error("Error fetching user scan status:", error);
      setHasScanned(false);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // ฟังก์ชันสำหรับอัพเดตสถานะ hasScanned ใน Firestore
  const updateScanStatus = useCallback(async (newStatus: boolean) => {
    if (!user?.id) return;

    const userDocRef = doc(db, "userSettings", user.id);

    try {
      await updateDoc(userDocRef, {
        hasScanned: newStatus,
        updatedAt: new Date()
      });
      setHasScanned(newStatus);
    } catch (error) {
      console.error("Error updating scan status:", error);
      // ถ้า document ไม่มี ให้สร้างใหม่
      try {
        await setDoc(userDocRef, {
          hasScanned: newStatus,
          userId: user.id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        setHasScanned(newStatus);
      } catch (createError) {
        console.error("Error creating user document:", createError);
      }
    }
  }, [user?.id]);

  // ดึงสถานะ hasScanned เมื่อ component โหลด
  useEffect(() => {
    fetchUserScanStatus();
  }, [fetchUserScanStatus]);

  // ดึงข้อมูลคลาสที่เป็นเจ้าของ (owner)
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || loading) return;

    console.log("Setting up owner classes listener for user:", user.primaryEmailAddress?.emailAddress);

    const classesRef = collection(db, "classes");
    const q = query(classesRef, where("owner_email", "==", user.primaryEmailAddress?.emailAddress));

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
  }, [isLoaded, isSignedIn, user, loading]);

  // แสดง loading ขณะกำลังโหลดข้อมูล
  if (loading) {
    return (
      <div className="border-2 border-purple-500 rounded-2xl p-4 h-95 md:w-150 md:h-150 md:ml-160 md:-mt-101 md:flex md:flex-col">
        <div className="flex justify-center items-center h-full">
          <div className="text-purple-600">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-purple-500 rounded-2xl p-4 h-95 md:w-150 md:h-150 md:ml-160 md:-mt-101 md:flex md:flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-purple-800 text-center flex-grow">My Class</h2>
        <button className="text-2xl text-purple-600" onClick={onNext}>
          <ArrowRight size={28} />
        </button>
      </div>
      
      {/* AddClassPopup - สำหรับสร้างคลาสใหม่หรือ scan เข้าร่วมคลาส */}
      {/* คลาสที่ scan จะไปเก็บในหน้า Class (สำหรับคลาสที่เข้าร่วม) */}
      <AddClassPopup onScanSuccess={() => updateScanStatus(true)} />
      
      {/* Class List - แสดงเฉพาะคลาสที่เป็นเจ้าของ */}
      <div className="overflow-scroll max-md:h-75">
        {classes.length > 0 ? (
          classes.map((cls) => (
            <div
              key={cls.id}
              className="flex justify-between mx-15 mt-4 items-center bg-purple-200 hover:bg-purple-300 p-4 rounded-4xl cursor-pointer"
              onClick={() => onSelectClass(cls)}
            >
              <span className="text-lg font-semibold text-purple-800">{cls.name}</span>
              <div className="flex-1 border-b border-purple-300" />
              <div className="bg-purple-500 text-white text-4xl font-bold w-12 h-12 flex justify-center rounded-full">
                {cls.name.charAt(0)}
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-400">ยังไม่มีคลาสใด ๆ</p>
        )}
      </div>
    </div>
  );
};

export default MyClassPage;