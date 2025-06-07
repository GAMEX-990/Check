"use client";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [data, setData] = useState<any>(null);
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid");
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);      // ⬅️ ออกจาก Firebase
    router.push("/");         // ⬅️ กลับไปหน้า Login
  };

  useEffect(() => {
    if (!uid) {
      router.push("/");
      return;
    }

    const fetchData = async () => {
      const docRef = doc(db, "students", uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setData(docSnap.data());
      } else {
        router.push("/");
      }
    };

    fetchData();
  }, [uid]);

  if (!data) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">ข้อมูลนักศึกษา</h1>
      <img src={data.photoURL || "/default.png"} className="w-24 h-24 rounded-full my-4" />
      <p><strong>ชื่อ:</strong> {data.fullname}</p>
      <p><strong>รหัสนักศึกษา:</strong> {data.studentId}</p>
      <p><strong>Email:</strong> {data.email}</p>
      <button
        onClick={handleLogout}
        className="mt-6 bg-red-500 text-white px-4 py-2 rounded"
      >
        ออกจากระบบ
      </button>
    </div>
  );
}
