import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface ViewClassDetailPageProps {
  classData: any;
  onBack: () => void;
}

export const ViewClassDetailPage = ({ classData, onBack }: ViewClassDetailPageProps) => {
  const [checkedInUsers, setCheckedInUsers] = useState<any[]>([]);

// ดึงข้อมูลผู้เข้าเรียน
useEffect(() => {
  const fetchCheckedInUsers = async () => {
    try {
      if (!classData.checkedInRecord) return;

      const usersList = Object.values(classData.checkedInRecord)
        .map((user: any) => ({
          ...user,
          timestamp: user.timestamp.toDate(), // แปลง Timestamp → Date
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      setCheckedInUsers(usersList);
    } catch (error) {
      console.error("Error fetching checked-in users:", error);
    }
  };

  fetchCheckedInUsers();
}, [classData.checkedInRecord]);

  

  return (
    <div>
      <div className="">
        <div className="h-auto w-100 border-2 border-purple-500 rounded-2xl p-4 relative">
          {/* Header */}
          <div className="flex justify-center">
            <div className="">
              <h1 className="text-2xl font-bold text-purple-800 text-center flex-grow">{classData.name}</h1>
            </div>
            <div className=" absolute right-0">
              <button className="text-2xl text-purple-600" onClick={onBack}>
                <ArrowLeft size={28} />
              </button>
            </div>
          </div>
          {/* ดูสรุปการเข้าเรียน */}
          <div className="text-purple-800 flex justify-between m-4">
            <div>
              <p className="">ชื่อ-สกุล</p>
            </div>
            <div>
              <button className="border-1 border-purple-700 p-1 rounded-4xl">
                ดูสรุปการเข้าเรียน
              </button>
            </div>
            <div>
              <p className="">รหัส นศ.</p>
            </div>
          </div>

          <div className="">
            <p className="text-right text-purple-800">
              จำนวนสมาชิกที่เช็คชื่อ: {classData?.checkedInCount || 0}
            </p>
          </div>

          {/* รายชื่อสมาชิก */}
          <div>
            <div className=" overflow-scroll h-80 relative">
              <div className="  ">
                {checkedInUsers.map((user) => (
                  <div>
                    <div>
                      <p className="text-sm text-purple-900">{user.timestamp.toLocaleString("th-TH",{
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}</p>
                    </div>
                  <div className="flex flex-row justify-between mt-2">
                    <div>
                      <p className="text-sm  text-purple-900">{user.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-purple-900">{user.studentId}</p>
                    </div>
                  </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* --------------------------------------------------*/}
        </div>
      </div>
    </div>
  );
};
export default ViewClassDetailPage;