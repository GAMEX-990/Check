import { useState } from "react";
import { Trash2, AlertTriangle, X } from "lucide-react";
import { User } from "firebase/auth";
import { handleDeleteClass } from "@/utils/DeleteClass";

interface DeleteClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: {
    id: string;
    name: string;
    memberCount?: number;
  };
  user: User | null;
  onDeleteSuccess?: () => void;
}

export const DeleteClassModal = ({
  isOpen,
  onClose,
  classData,
  user,
  onDeleteSuccess,
}: DeleteClassModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState("");

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (confirmText !== classData.name) {
      setError("กรุณาพิมพ์ชื่อคลาสให้ถูกต้อง");
      return;
    }

    await handleDeleteClass({
      classId: classData.id,
      user,
      setLoading,
      setError,
      onDeleteSuccess: () => {
        onClose();
        if (onDeleteSuccess) {
          onDeleteSuccess();
        }
      },
    });
  };

  const handleClose = () => {
    setConfirmText("");
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={24} />
            <h2 className="text-xl font-bold text-red-600">ลบคลาส</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Warning Message */}
        <div className="mb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Trash2 className="text-red-500 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">
                  คำเตือน: การลบไม่สามารถยกเลิกได้
                </h3>
                <p className="text-red-700 text-sm">
                  การลบคลาสจะทำให้ข้อมูลทั้งหมดหายไป รวมถึง:
                </p>
                <ul className="text-red-700 text-sm mt-2 ml-4 list-disc">
                  <li>ประวัติการเช็คชื่อทั้งหมด</li>
                  <li>รายชื่อสมาชิกในคลาส</li>
                  <li>ข้อมูลสถิติการเรียน</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Class Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-gray-800 mb-2">ข้อมูลคลาส:</h3>
            <p className="text-gray-600">ชื่อคลาส: <span className="font-medium">{classData.name}</span></p>
            {classData.memberCount && (
              <p className="text-gray-600">จำนวนสมาชิก: <span className="font-medium">{classData.memberCount} คน</span></p>
            )}
          </div>

          {/* Confirmation Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              พิมพ์ชื่อคลาส <span className="font-bold text-red-600">"{classData.name}"</span> เพื่อยืนยัน:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError(null);
              }}
              placeholder="พิมพ์ชื่อคลาสที่นี่"
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-red-400"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            disabled={loading}
          >
            ยกเลิก
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || confirmText !== classData.name}
            className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? "กำลังลบ..." : "ลบคลาส"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteClassModal;