
import { useState, useEffect } from "react";
import { getAuth } from "firebase/auth";
import { fetchCheckedInUsers } from "@/utils/fetchCheckedInUsers";
import { createAttendanceSummary } from "@/utils/Summary";
import DeleteClassModal from "./DeleteClassModal"; // เพิ่ม import
import AttendanceSummaryModal from "./AttenSummary";
import { ArrowLeft, Trash2 } from "lucide-react";
interface ViewClassDetailPageProps {
  classData: any;
  onBack: () => void;
  onDeleteSuccess?: () => void;

}

export const ViewClassDetailPage = ({ classData, onBack, onDeleteSuccess }: ViewClassDetailPageProps) => {
  const [shoewDeleteModal, setShowDeleteModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState<any[]>([]);
  const [checkedInUsers, setCheckedInUsers] = useState<any[]>([]);
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const currentUid = currentUser?.uid;


  useEffect(() => {
    const loadCheckedInUsers = async () => {
      const users = await fetchCheckedInUsers(classData, currentUid);
      setCheckedInUsers(users);

      const summary = createAttendanceSummary(users);
      setAttendanceSummary(summary);
    };

    loadCheckedInUsers();
  }, [classData.checkedInRecord, currentUid]);

  const handleShowSummary = () => {
    setShowSummary(true);
  };

  const handleCloseSummary = () => {
    setShowSummary(false);
  };

  const handlsShowDeleteModal = () => {
    setShowDeleteModal(true);
    
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const handleDeleteSuccess  = () => {
    if (onDeleteSuccess) {
      onDeleteSuccess();
    }
    onBack();
  }

  // ตรวจสอบว่าผู้ใช้ปัจจุบันเป็นคนสร้างคลาสหรือไม่
const isClassOwner = classData.owner_email === currentUser?.email;
  

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
                {/* ปุ่มลบคลาส - แสดงเฉพาะคนสร้างเท่านั้น */}
              {isClassOwner && (
                <button 
                  className="text-red-500 hover:text-red-700 p-1"
                  onClick={handlsShowDeleteModal}
                  title="ลบคลาส"
                >
                  <Trash2 size={24} />
                </button>
              )}
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
              <button className="border-1 border-purple-700 p-1 rounded-4xl cursor-pointer"
              onClick={handleShowSummary}>
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
                  <div key={user.uid}>
                    <div>
                      <p className="text-sm text-purple-900">{user.timestamp.toLocaleString("th-TH", {
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
       {/* Modal สรุปการเข้าเรียน */}
       <AttendanceSummaryModal
        isOpen={showSummary}
        onClose={handleCloseSummary}
        classData={classData}
        attendanceSummary={attendanceSummary}
      />
       {/* Modal ลบคลาส */}
       <DeleteClassModal
        isOpen={shoewDeleteModal}
        onClose={handleCloseDeleteModal}
        classData={{
          id: classData.id,
          name: classData.name,
          memberCount: classData.checkedInCount
        }}
        user={currentUser}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </div>
  );
};
export default ViewClassDetailPage;