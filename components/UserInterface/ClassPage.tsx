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
import { ArrowLeft } from "lucide-react";
import AddClassPopup from "../FromUser/ButtonCreate";

const ClassPage = ({ onBack, onSelectClass }: { onBack: () => void; onSelectClass: (classData: any) => void }) => {
  const { user } = useUser();
  const [joinedClasses, setJoinedClasses] = useState<any[]>([]);
  const [hasScanned, setHasScanned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [classesLoading, setClassesLoading] = useState(false);

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

  // ดึงข้อมูลคลาส
  useEffect(() => {
    if (!user?.id || loading) {
      return;
    }

    if (!hasScanned) {
      setJoinedClasses([]);
      return;
    }

    console.log("Setting up classes listener for user:", user.id);
    setClassesLoading(true);

    const classesRef = collection(db, "classes");
    const q = query(
      classesRef,
      where("checkedInMembers", "array-contains", user.id)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const classes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log("Classes loaded:", classes.length);
      setJoinedClasses(classes);
      setClassesLoading(false);
    }, (error) => {
      console.error("Error listening to classes:", error);
      setClassesLoading(false);
    });

    return () => {
      console.log("Cleaning up classes listener");
      unsubscribe();
    };
  }, [user?.id, hasScanned, loading]);

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
        <h2 className="text-2xl font-bold text-purple-800 text-center flex-grow">Class</h2>
        <button onClick={onBack} className="text-purple-700 hover:text-purple-900">
          <ArrowLeft size={28} />
        </button>
      </div>
      
      {!hasScanned ? (
        <div className="">
          <AddClassPopup onScanSuccess={() => updateScanStatus(true)} />
        </div>
      ) : (
        <>
          <AddClassPopup onScanSuccess={() => updateScanStatus(true)} />
          <div className="overflow-y-auto mt-4">
            {classesLoading ? (
              <div className="text-center text-purple-600">กำลังโหลดคลาส...</div>
            ) : (
              <>
                {joinedClasses.map((cls) => (
                  <div
                    key={cls.id}
                    className="flex justify-between mx-4 mt-4 items-center bg-purple-200 hover:bg-purple-300 p-4 rounded-4xl cursor-pointer"
                    onClick={() => onSelectClass(cls)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-500 text-white text-2xl w-12 h-12 flex items-center justify-center rounded-full">
                        {cls.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-purple-800">{cls.name}</p>
                        <p className="text-sm text-purple-600">สร้างโดย: {cls.owner_email}</p>
                      </div>
                    </div>
                    {cls.checkedInMembers?.includes(user?.id) && (
                      <span className="text-green-600">✓ เช็คชื่อแล้ว</span>
                    )}
                  </div>
                ))}
                {joinedClasses.length === 0 && (
                  <p className="text-center text-gray-500 mt-4">ยังไม่ได้เข้าร่วมคลาสใดๆ</p>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ClassPage;