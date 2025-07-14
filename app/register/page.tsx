'use client'

import { auth, db, provider } from '@/lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { ChevronLeft, Loader2Icon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'
import Image from "next/image";
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';


export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  // Google login
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = async () => {
    // Prevent multiple login attempts
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    setError(""); // Clear any previous errors

    try {
      // Configure Google sign-in to always show account selection
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      // Attempt sign in with popup
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // Check if user profile exists in Firestore
      const userRef = doc(db, "users", user.uid);
      let userSnap;
      try {
        userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();

          // ตรวจสอบ role จากข้อมูลใน Firestore
          if (userData.role) {
          }
        }
      } catch {
        setError("ไม่สามารถตรวจสอบข้อมูลโปรไฟล์ได้ กรุณาลองอีกครั้ง");
        return;
      }

      if (userSnap.exists()) {
        toast.success("เข้าสู่ระบบสำเร็จ!!", {
          style: {
            color: '#22c55e',
          }
        });
        router.push("/dashboard");
      } else {
        router.push("/loginregister");
      }

    } catch (err: unknown) {

      // Type narrowing for Firebase Auth errors
      const firebaseError = err as { code?: string; message?: string };

      // Handle specific Firebase errors
      if (firebaseError.code === 'auth/cancelled-popup-request') {
        setError("การเข้าสู่ระบบถูกยกเลิก โปรดลองอีกครั้ง");
      } else if (firebaseError.code === 'auth/popup-blocked') {
        setError("ป๊อปอัพถูกบล็อก โปรดอนุญาตป๊อปอัพสำหรับเว็บไซต์นี้และลองอีกครั้ง");
      } else if (firebaseError.code === 'auth/popup-closed-by-user') {
        setError("คุณปิดหน้าต่างเข้าสู่ระบบก่อนที่จะเสร็จสิ้น โปรดลองอีกครั้ง");
      } else {
        setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google: " + (firebaseError.message || "โปรดลองอีกครั้งในภายหลัง"));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
      </div>

      {/* Character illustration */}
      <div className="absolute bottom-0 left-0 hidden lg:block">
        <div className="relative">
          <div className="w-64 h-64 bg-gradient-to-tr from-purple-400 to-purple-600 rounded-full opacity-20 blur-2xl"></div>
          <div className="absolute inset-0 flex items-end justify-center">
            <Image
              src="/assets/images/personlookblook.png"
              alt="Welcome illustration"
              width={800}
              height={800}
              className="drop-shadow-2xl"
            />
          </div>
        </div>
      </div>

      {/* Main register card */}
      <div className="relative w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => router.push('/login')}
          className="cursor-pointer absolute -top-12 left-0 flex items-center text-purple-600 hover:text-purple-800 transition-colors duration-200"
        >
          <ChevronLeft size={24} />
          <span className="ml-1 text-sm font-medium">กลับ</span>
        </button>

        {/* Register card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">สร้างบัญชี</h1>
            <p className="text-gray-600">เริ่มต้นการใช้งานของคุณ</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Google login button */}
          <Button
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className={`cursor-pointer w-full flex items-center justify-center py-3 px-4 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 mb-6 ${isLoggingIn ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md'
            }`}
        >
            <Image
              src="/assets/images/Google.png"
              alt="Google"
              width={20}
              height={20}
              className="mr-3"
            />
            {isLoggingIn && <Loader2Icon className="animate-spin" />}
            {isLoggingIn ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google'}
          </Button>

          {/* Welcome message */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full mb-4">
              <span className="text-2xl">👋</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">ยินดีต้อนรับ!</h2>
            <p className="text-gray-600 text-sm">
              คลิกปุ่มด้านบนเพื่อเริ่มต้นสร้างบัญชีของคุณ
            </p>
          </div>

          {/* Features list */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              <span>เข้าร่วมและจัดการชั้นเรียนได้อย่างง่ายดาย</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              <span>ติดตามการเข้าเรียนแบบเรียลไทม์</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              <span>ระบบปลอดภัยด้วย Google Authentication</span>
            </div>
          </div>

          {/* Login link */}
          <div className="text-center">
            <p className="text-sm text-gray-600 cursor-pointer">
              มีบัญชีอยู่แล้ว?
              <Button
                variant="link"
                onClick={() => router.push('/login')}
                className="text-purple-600 hover:text-purple-800"
              >
                เข้าสู่ระบบ
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
};