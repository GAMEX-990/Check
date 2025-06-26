import { updateStudentId } from './informationupdate';
import { toast } from 'sonner';

export const handleUpdateStudentIdHandler = async (
  studentId: string,
  setLoading: (loading: boolean) => void,
  setShowModal: (show: boolean) => void,
  setData: (dataUpdater: (prev: any) => any) => void
) => {
  if (!studentId.trim()) {
    toast.error('กรุณากรอกรหัสนักศึกษา');
    return;
  }

  setLoading(true);
  const result = await updateStudentId(studentId.trim());

  if (result.success) {
    toast.success('อัพเดทรหัสนักศึกษาสำเร็จ');

    // ✅ อัปเดตข้อมูลที่ state
    setData((prev: any) => (prev ? { ...prev, studentId } : prev));
    setShowModal(false);
  } else {
    toast.error('เกิดข้อผิดพลาด: ' + result.error);
  }

  setLoading(false);
};
