// Usercard.tsx
'use client'

import { Pencil, LogIn, ArrowLeft } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getStorage } from 'firebase/storage';
import EditProfilePage from '@/utils/EditProfilePage';

const storage = getStorage();



interface UserData {
  name: string;
  email: string;
  studentId: string;
  photoURL?: string;
}

const Usercard = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState<UserData | null>(null);
  const router = useRouter();

  useEffect(() => {
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      const userDocRef = doc(db, "users", user.uid);
      unsubscribeUserDoc = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setData(docSnap.data() as UserData);
        } else {
          setData(null);
          router.push("/");
        }
      });
    });

    return () => {
      if (unsubscribeUserDoc) unsubscribeUserDoc();
      unsubscribeAuth();
    };
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (!auth.currentUser) return;

    const file = e.target.files[0];
    const userId = auth.currentUser.uid;

    try {
      const storageRef = ref(storage, `profilePictures/${userId}`);
      await uploadBytes(storageRef, file);

      const downloadURL = await getDownloadURL(storageRef);

      await updateDoc(doc(db, "users", userId), {
        photoURL: downloadURL,
      });

      alert("อัปโหลดรูปโปรไฟล์เรียบร้อยแล้ว");
    } catch (error) {
      console.error("Upload error:", error);
      alert("เกิดข้อผิดพลาดในการอัปโหลดรูป");
    }
  };

  if (!data) return <p>Loading...</p>;

  if (isEditing) {
    return (
      <EditProfilePage
        onCancel={() => setIsEditing(false)}
        onSave={() => setIsEditing(false)}
        initialData={{
            name: data.name,
            email: data.email,
          studentId: data.studentId,
        }}
      />
    );
  }

  return (
    <div className="flex justify-center">
      <div className="border-2 border-purple-500 rounded-2xl w-85">
        <div className="flex justify-between p-4">
          <button className="text-purple-600 text-2xl" onClick={() => router.back()}>
            <ArrowLeft />
          </button>
          <button onClick={handleLogout} className="text-purple-600">
            <LogIn />
          </button>
        </div>

        <div className="flex justify-center">
          <div className="relative w-32 h-32">
            <img
              className="border-4 border-purple-700 rounded-full w-32 h-32 object-cover"
              src={data.photoURL || "/default-profile.png"}
              alt="Profile"
              referrerPolicy="no-referrer"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer rounded-full"
              title="เปลี่ยนรูปโปรไฟล์"
            />
            <div
              className="absolute bottom-2 right-2 bg-purple-600 hover:bg-purple-700 cursor-pointer text-white rounded-full p-1"
              onClick={() => setIsEditing(true)}
              title="แก้ไขข้อมูล"
            >
              <Pencil size={18} />
            </div>
          </div>
        </div>

        <div className="flex flex-col text-center items-center space-y-4 m-4">
          <p className="text-purple-700 font-bold text-lg">{data.name}</p>
          <p className="text-purple-700">{data.email}</p>
          <p className="text-purple-700">{data.studentId}</p>
        </div>
      </div>
    </div>
  );
};

export default Usercard;
