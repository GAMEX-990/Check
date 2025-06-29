"use client";
import Usercard from "@/components/UserInterface/Usercard";
import React, { useState } from "react";
import ClassSection from "@/components/UserInterface/ClassSection";
import AddClassPopup from "@/components/FromUser/ButtonCreate";
import CreateQRCodeAndUpload from "@/components/FromUser/FusionButtonqrup";
import { auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { ClassData } from "@/types/classTypes";
import { motion } from "framer-motion";
import { LayoutGrid } from "lucide-react";
import Image from "next/image";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export default function DashboardPage() {
  const [currectPang, SetCurrectPang] = useState<"myclass" | "class" | "view">(
    "myclass"
  );
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [user, loading, error] = useAuthState(auth);

  const handlePageChange = (page: "myclass" | "class" | "view") => {
    SetCurrectPang(page);
  };

  const handleSelectClass = (classData: ClassData) => {
    setSelectedClass(classData);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg flex flex-col items-center">
          <div className="relative animate-bounce">
            <Image
              src="/assets/images/Logocheck.PNG"
              alt="Check Logo"
              width={120}
              height={120}
              className="animate-spin rounded-xl"
              style={{ animationDuration: "2s" }}
              priority
            />
          </div>
          <p className="mt-4 text-purple-900 font-medium text-lg">
            กำลังโหลดข้อมูล...
          </p>
          <p className="text-purple-600 text-sm">โปรดรอสักครู่</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full mx-4">
          <h2 className="text-red-600 text-xl font-bold mb-2">
            เกิดข้อผิดพลาด
          </h2>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={fadeIn}
      className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50"
    >
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <LayoutGrid className="w-6 h-6 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-purple-900">แดชบอร์ด</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - User Card */}
          <motion.div
            className="lg:col-span-3 order-1"
            variants={fadeIn}
            transition={{ delay: 0.1 }}
          >
            <Usercard />
          </motion.div>

          {/* Right Column - Class Section */}
          <motion.div
            className="lg:col-span-6 order-3 lg:order-2"
            variants={fadeIn}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-white rounded-2xl shadow-sm border border-purple-100/50">
              <ClassSection
                onPageChange={handlePageChange}
                onClassSelect={handleSelectClass}
              />
            </div>
          </motion.div>

          {/* Middle Column - Actions */}
          <motion.div
            className="lg:col-span-3 space-y-4 order-2 lg:order-3"
            variants={fadeIn}
            transition={{ delay: 0.2 }}
          >
            {currectPang !== "view" ? (
              <div className="bg-white rounded-2xl shadow-sm border border-purple-100/50 p-4">
                <div className="mb-3">
                  <h2 className="text-lg font-semibold text-purple-900">
                    จัดการคลาส
                  </h2>
                  <p className="text-sm text-purple-600">
                    สร้างหรือเข้าร่วมคลาส
                  </p>
                </div>
                <AddClassPopup />
              </div>
            ) : (
              selectedClass && (
                <div className="bg-white rounded-2xl shadow-sm border border-purple-100/50 p-4">
                  <div className="mb-3">
                    <h2 className="text-lg font-semibold text-purple-900">
                      จัดการการเช็คชื่อ
                    </h2>
                    <p className="text-sm text-purple-600">
                      สร้าง QR Code และจัดการข้อมูล
                    </p>
                  </div>
                  <CreateQRCodeAndUpload
                    classId={selectedClass.id}
                    currentUser={
                      user ? { uid: user.uid, email: user.email || "" } : null
                    }
                  />
                </div>
              )
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
