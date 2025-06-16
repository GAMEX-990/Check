// lib/profileUtils.ts
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface UpdateProfileData {
  name?: string;
  studentId?: string;
  institution?: string;
  role?: 'student' | 'teacher';
}

interface ProfileUpdateResult {
  success: boolean;
  error?: string;
}

/**
 * อัพเดทข้อมูลโปรไฟล์ผู้ใช้
 */
export const updateUserProfile = async (data: UpdateProfileData): Promise<ProfileUpdateResult> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'ไม่พบผู้ใช้' };
    }

    const userRef = doc(db, 'users', user.uid);
    
    // เตรียมข้อมูลที่จะอัพเดท (เฉพาะที่มีค่า)
    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.studentId !== undefined) updateData.studentId = data.studentId;
    if (data.institution !== undefined) updateData.institution = data.institution;
    if (data.role !== undefined) updateData.role = data.role;

    await updateDoc(userRef, updateData);
    
    console.log('✅ อัปเดตโปรไฟล์สำเร็จ:', updateData);
    return { success: true };
    
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ' 
    };
  }
};

/**
 * อัพเดทเฉพาะรหัสนักศึกษา
 */
export const updateStudentId = async (studentId: string): Promise<ProfileUpdateResult> => {
  return updateUserProfile({ studentId });
};

/**
 * อัพเดทเฉพาะชื่อ
 */
export const updateUserName = async (name: string): Promise<ProfileUpdateResult> => {
  return updateUserProfile({ name });
};

/**
 * อัพเดทเฉพาะสถาบัน
 */
export const updateInstitution = async (institution: string): Promise<ProfileUpdateResult> => {
  return updateUserProfile({ institution });
};

/**
 * อัพเดทหลายฟิลด์พร้อมกัน
 */
export const updateMultipleFields = async (
  name?: string, 
  studentId?: string, 
  institution?: string
): Promise<ProfileUpdateResult> => {
  const data: UpdateProfileData = {};
  
  if (name !== undefined) data.name = name;
  if (studentId !== undefined) data.studentId = studentId;
  if (institution !== undefined) data.institution = institution;
  
  return updateUserProfile(data);
};