'use client'

import { auth, db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { toast } from 'sonner';

interface EditProfilePageProps {
  onCancel: () => void;
  onSave: () => void;
  initialData: {
    name: string;
    email: string;
    studentId: string;
  };
}

const EditProfilePage = ({ onCancel, onSave, initialData }: EditProfilePageProps) => {
  const [name] = useState(initialData.name);
  const [studentId, setStudentId] = useState(initialData.studentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      name,
      studentId,
    });

    toast.success('อัปเดตข้อมูลสำเร็จ');
    onSave(); // ให้ Usercard กลับมาแสดง แล้ว snapshot จะโหลดเอง
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="mb-4">
        <label className="block text-sm font-bold text-purple-700">รหัสนักศึกษา</label>
        <input
          className="border p-2 w-full"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        />
      </div>
      <div className="flex gap-4">
        <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded">
          บันทึก
        </button>
        <button type="button" onClick={onCancel} className="text-purple-600">
          ยกเลิก
        </button>
      </div>
    </form>
  );
};

export default EditProfilePage;
