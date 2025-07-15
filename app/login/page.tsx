'use client'
import React, { useState } from 'react'
import { ChevronLeft, Loader2Icon } from "lucide-react";
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, provider } from '@/lib/firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import Image from "next/image";
import { Input } from '@/components/ui/input';
import { Label } from '@radix-ui/react-label'; import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuthRedirect } from '@/hook/useAuthRedirect';
import Loader from '@/components/Loader/Loader';
import { saveDeviceId } from '@/utils/saveDeviceId';


export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [ishandleManualLogin, sethandleManualLogin] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const {user,loading} = useAuthRedirect('guest-only');

  // Manual login
  const handleManualLogin = async () => {
    sethandleManualLogin(true);

    if (!email || !password) {
      setError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    try {
      // Login ผ่าน Firebase Auth โดยตรง
      await signInWithEmailAndPassword(auth, email, password);
      await saveDeviceId(auth.currentUser!.uid);
      router.push('/dashboard');

    } catch{
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    } finally {
      sethandleManualLogin(false);
    }
  };


  // Google login
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
      await saveDeviceId(user.uid);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center">
        <div className="text-center">
        <div className="text-purple-600"><Loader/></div>
        </div>
      </div>
    );
  }
  if (user) {
    return null;
  }

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
              width={2000}
              height={2000}
              className="drop-shadow-2xl"
            />
          </div>
        </div>
      </div>

      {/* Main login card */}
      <div className="relative w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => router.push('/')}
          className="cursor-pointer absolute -top-12 left-0 flex items-center text-purple-600 hover:text-purple-800 transition-colors duration-200"
        >
          <ChevronLeft size={24} />
          <span className="ml-1 text-sm font-medium">กลับ</span>
        </button>

        {/* Login card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">เข้าสู่ระบบ</h1>
            <p className="text-gray-600">ยินดีต้อนรับกลับมา</p>
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

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">หรือเข้าสู่ระบบด้วย</span>
            </div>
          </div>

          {/* Email and password form */}
          <div className="space-y-6">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
                อีเมล
              </Label>
              <Input
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                type="email"
                id="email"
                placeholder="กรอกอีเมลของคุณ"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="password">
                รหัสผ่าน
              </Label>
              <Input
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                type="password"
                id="password"
                placeholder="กรอกรหัสผ่านของคุณ"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center justify-between mt-6 mb-8 cursor-pointer">
            <Button
              variant='link'
              onClick={() => router.push('/register')}
              className=" text-sm font-medium text-purple-600 hover:text-purple-800 cursor-pointer"
            >
              สร้างบัญชีใหม่
            </Button>
            <Button  variant='link' className=" text-sm font-medium text-purple-600 hover:text-purple-800 cursor-pointer">
              ลืมรหัสผ่าน?
            </Button>
          </div>

          {/* Sign in button */}
          <Button
            onClick={handleManualLogin}
            disabled={ishandleManualLogin}
            className="cursor-pointer w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transition duration-200 rounded-4xl"
          >
            {ishandleManualLogin && <Loader2Icon className="animate-spin" />}
            {ishandleManualLogin ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </Button>
        </div>
      </div>
    </div>
  )
}