import { useState, useEffect, useCallback } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useHasScanned } from "@/utils/hasScanned";

const ClassPage = ({ onBack, onSelectClass }: { onBack: () => void; onSelectClass: (classData: any) => void }) => {
  const { user, hasScanned, updateScanStatus, loading } = useHasScanned();
  const [joinedClasses, setJoinedClasses] = useState<any[]>([]);
  const [classesLoading, setClassesLoading] = useState(false);



  // ดึงข้อมูลคลาส
  useEffect(() => {
    if (!user?.uid || loading) {
      return;
    }


    console.log("Setting up classes listener for user:", user.uid);
    setClassesLoading(true);

    const classesRef = collection(db, "classes");
    const q = query(
      classesRef,
      where("checkedInMembers", "array-contains", user.uid)
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
  }, [user?.uid, hasScanned, loading]);

  // แสดง loading ขณะกำลังโหลดข้อมูล
  if (loading) {
    return (
      <div className="border-2 border-purple-500 rounded-2xl p-4 h-95 ">
        <div className="flex justify-center items-center h-full">
          <div className="text-purple-600">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="">
        <div className="h-auto w-100 border-2 border-purple-500 rounded-2xl p-4 relative">
          {/* Header */}
          <div className="flex justify-center">
            <div className="">
              <h1 className="text-2xl font-bold text-purple-800 text-center">Class</h1>
            </div>
            <div className=" absolute right-0">
              <button className="text-2xl text-purple-600" onClick={onBack}>
                <ArrowLeft size={28} />
              </button>
            </div>
          </div>
          <>
            <div>
              <div className="overflow-scroll h-80">
                <div className="flex flex-col gap-4">
                {classesLoading ? (
                  <div className="text-center text-purple-600">กำลังโหลดคลาส...</div>
                ) : (
                  <>
                    {joinedClasses.map((cls) => (
                      <div>
                        <div
                          key={cls.id}
                          className="flex justify-between items-center bg-purple-200 hover:bg-purple-300 p-4 rounded-4xl cursor-pointer"
                          onClick={() => onSelectClass(cls)}
                        >
                          <div className="flex items-center">
                            <div className="bg-purple-500 text-white text-2xl w-12 h-12 flex items-center justify-center rounded-full">
                              {cls.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-lg font-semibold text-purple-800">{cls.name}</p>
                              <p className="text-sm text-purple-600">สร้างโดย: {cls.owner_email}</p>
                            </div>
                          </div>
                          {cls.checkedInMembers?.includes(user?.uid) && (
                            <div>
                              <span className="text-green-600 text-sm">✓ เช็คชื่อแล้ว</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
          </>
        </div>
      </div>
    </div>
  );
};

export default ClassPage;