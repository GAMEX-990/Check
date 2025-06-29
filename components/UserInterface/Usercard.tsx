"use client";

import {
  ArrowLeft,
  LogOut,
  Pencil,
  User,
  Mail,
  IdCard,
  GraduationCap,
  School,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { motion } from "framer-motion";
import Image from "next/image";
import { Input } from "../ui/input";
import { handleUpdateStudentIdHandler } from "@/utils/updateStudentIdHandler";

interface UserData {
  name: string;
  email: string;
  studentId?: string;
  photoURL: string;
  role: "teacher" | "student";
}

const Usercard = () => {
  const [showModal, setShowModal] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UserData | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setData(docSnap.data() as UserData);
        } else {
          // If user document doesn't exist, redirect to login
          signOut(auth).then(() => router.push("/login"));
        }
      });

      return () => unsubscribeUser();
    });

    return () => unsubscribeAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleUpdateStudentId = () => {
    handleUpdateStudentIdHandler(studentId, setLoading, setShowModal, setData);
  };

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-purple-100">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-purple-50 rounded-full transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-purple-600" />
        </button>
        <button
          onClick={handleLogout}
          className="p-2 hover:bg-purple-50 rounded-full transition-colors text-purple-600 flex items-center gap-2"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">ออกจากระบบ</span>
        </button>
      </div>

      <div className="p-6">
        <div className="flex flex-col items-center">
          <div className="relative mb-6">
            <div className="relative">
              <Image
                className="rounded-xl border-4 border-purple-100 object-cover"
                width={120}
                height={120}
                src={data.photoURL || "/default-profile.png"}
                alt="Profile"
                priority
              />
              {data.role === "student" && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute bottom-2 right-2 bg-purple-600 text-white p-2 rounded-lg shadow-lg"
                  onClick={() => setShowModal(true)}
                  title="แก้ไขข้อมูล"
                >
                  <Pencil className="h-4 w-4" />
                </motion.button>
              )}
            </div>
          </div>

          <div className="w-full space-y-4">
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <User className="h-5 w-5 text-purple-600" />
              <div className="flex-1">
                <p className="text-sm text-purple-600">ชื่อ-นามสกุล</p>
                <p className="text-base font-medium text-purple-900">
                  {data.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Mail className="h-5 w-5 text-purple-600" />
              <div className="flex-1">
                <p className="text-sm text-purple-600">อีเมล</p>
                <p className="text-base font-medium text-purple-900">
                  {data.email}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              {data.role === "teacher" ? (
                <>
                  <School className="h-5 w-5 text-purple-600" />
                  <div className="flex-1">
                    <p className="text-sm text-purple-600">สถานะ</p>
                    <p className="text-base font-medium text-purple-900">
                      อาจารย์
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <GraduationCap className="h-5 w-5 text-purple-600" />
                  <div className="flex-1">
                    <p className="text-sm text-purple-600">สถานะ</p>
                    <p className="text-base font-medium text-purple-900">
                      นักศึกษา
                    </p>
                  </div>
                </>
              )}
            </div>

            {data.role === "student" && (
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <IdCard className="h-5 w-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm text-purple-600">รหัสนักศึกษา</p>
                  <p className="text-base font-medium text-purple-900">
                    {data.studentId || "ยังไม่ได้ระบุ"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            className="bg-white rounded-xl shadow-xl w-full max-w-md"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold text-purple-900 mb-4">
                แก้ไขรหัสนักศึกษา
              </h2>
              <Input
                type="text"
                placeholder="กรอกรหัสนักศึกษาของคุณ"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full mb-4"
                disabled={loading}
              />
              <div className="flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  disabled={loading}
                >
                  ยกเลิก
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpdateStudentId}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  disabled={loading}
                >
                  {loading ? "กำลังบันทึก..." : "บันทึก"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Usercard;
