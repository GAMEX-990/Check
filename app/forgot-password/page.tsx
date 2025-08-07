'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, Loader2Icon, Mail } from "lucide-react";
import { useRouter } from 'next/navigation';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Image from "next/image";
import { Input } from '@/components/ui/input';
import { Label } from '@radix-ui/react-label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  // Check if email exists in database
  const checkEmailExists = async (email: string): Promise<boolean> => {
    try {
      // Check in users collection
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError("กรุณากรอกอีเมลของคุณ");
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("กรุณากรอกอีเมลที่ถูกต้อง");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Check if email exists in database first
      const emailExists = await checkEmailExists(email);
      if (!emailExists) {
        setError("ไม่พบอีเมลนี้ในระบบ กรุณาตรวจสอบอีเมลหรือสมัครสมาชิกใหม่");
        setIsLoading(false);
        return;
      }

      await sendPasswordResetEmail(auth, email);
      setIsEmailSent(true);
      setCountdown(30); // Set 30-second countdown
      toast.success("ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลแล้ว", {
        style: {
          color: '#22c55e',
        }
      });
    } catch (err: unknown) {
      const firebaseError = err as { code?: string; message?: string };
      
      if (firebaseError.code === 'auth/user-not-found') {
        setError("ไม่พบอีเมลนี้ในระบบ");
      } else if (firebaseError.code === 'auth/invalid-email') {
        setError("รูปแบบอีเมลไม่ถูกต้อง");
      } else if (firebaseError.code === 'auth/too-many-requests') {
        setError("มีการร้องขอมากเกินไป กรุณาลองอีกครั้งในภายหลัง");
      } else {
        setError("เกิดข้อผิดพลาด กรุณาลองอีกครั้ง");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (countdown > 0) {
      toast.error(`กรุณารอ ${countdown} วินาที ก่อนส่งอีเมลอีกครั้ง`);
      return;
    }
    await handleResetPassword();
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
              width={2000}
              height={2000}
              className="drop-shadow-2xl"
            />
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="relative w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => router.push('/login')}
          className="cursor-pointer absolute -top-12 left-0 flex items-center text-purple-600 hover:text-purple-800 transition-colors duration-200"
        >
          <ChevronLeft size={24} />
          <span className="ml-1 text-sm font-medium">กลับ</span>
        </button>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
          {!isEmailSent ? (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full mb-4">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">ลืมรหัสผ่าน?</h1>
                <p className="text-gray-600">ไม่ต้องกังวล เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้คุณ</p>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Email form */}
              <div className="space-y-6">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
                    อีเมล
                  </Label>
                  <Input
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    type="email"
                    id="email"
                    placeholder="กรอกอีเมลที่ใช้สมัครสมาชิก"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleResetPassword()}
                  />
                </div>
              </div>

              {/* Submit button */}
              <Button
                onClick={handleResetPassword}
                disabled={isLoading}
                className="cursor-pointer w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transition duration-200 rounded-xl mt-8"
              >
                {isLoading && <Loader2Icon className="animate-spin mr-2" />}
                {isLoading ? 'กำลังตรวจสอบและส่ง...' : 'ส่งลิงก์รีเซ็ตรหัสผ่าน'}
              </Button>
            </>
          ) : (
            <>
              {/* Success state */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full mb-4">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">ตรวจสอบอีเมลของคุณ</h1>
                <p className="text-gray-600 mb-6">
                  เราได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านไปยัง<br />
                  <span className="font-medium text-purple-600">{email}</span>
                </p>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 text-left">
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-2">ขั้นตอนถัดไป:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>เปิดอีเมลของคุณ</li>
                      <li>คลิกลิงก์ในอีเมล</li>
                      <li>สร้างรหัสผ่านใหม่</li>
                      <li>เข้าสู่ระบบด้วยรหัสผ่านใหม่</li>
                    </ol>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={handleResendEmail}
                    disabled={isLoading || countdown > 0}
                    variant="outline"
                    className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading && <Loader2Icon className="animate-spin mr-2" />}
                    {countdown > 0 ? `ส่งอีเมลอีกครั้งได้ใน ${countdown} วินาที` : 'ส่งอีเมลอีกครั้ง'}
                  </Button>

                  <Button
                    onClick={() => router.push('/login')}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                  >
                    กลับไปหน้าเข้าสู่ระบบ
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Help text */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              หากไม่พบอีเมลในกล่องจดหมาย กรุณาตรวจสอบในโฟลเดอร์ Spam หรือ Junk
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}