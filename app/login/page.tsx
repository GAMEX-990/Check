'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, provider } from '@/lib/firebase';
import { signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import Image from "next/image";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getFingerprint, saveAndCleanupDeviceId } from '@/utils/getFingerprint';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Loader2Icon } from "lucide-react";

async function checkDeviceBeforeLogin(email: string) {
  const deviceId = await getFingerprint();
  const deviceDocRef = doc(db, 'deviceIds', deviceId);
  const deviceSnap = await getDoc(deviceDocRef);

  if (deviceSnap.exists()) {
    const storedEmail = deviceSnap.data().email;
    
    // ถ้ามี email บันทึกไว้แล้ว และไม่ตรงกับ email ที่จะ login
    if (storedEmail && storedEmail !== email) {
      throw new Error('อุปกรณ์นี้ถูกใช้งานกับบัญชีอื่นแล้ว ไม่สามารถใช้งานร่วมกันได้');
    }
  }
  
  // บันทึก device fingerprint พร้อม email
  await saveAndCleanupDeviceId(email);
}

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [isHandlingLogin, setIsHandlingLogin] = useState(false);
  const [isLoggingInGoogle, setIsLoggingInGoogle] = useState(false);

  // Manual login
  const handleManualLogin = async () => {
    setIsHandlingLogin(true);
    setError("");

    if (!email || !password) {
      setError("กรุณากรอกข้อมูลให้ครบ");
      setIsHandlingLogin(false);
      return;
    }

    try {
      // ตรวจสอบ deviceId ก่อนอนุญาตให้ login
      await checkDeviceBeforeLogin(email);

      // ถ้าไม่มี error ถึง sign in จริง
      await signInWithEmailAndPassword(auth, email, password);

      toast.success("เข้าสู่ระบบสำเร็จ!", { style: { color: '#22c55e' } });
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        setError(error.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      } else {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }
      await signOut(auth);
    } finally {
      setIsHandlingLogin(false);
    }
  };

  // Google login
  const handleGoogleLogin = async () => {
    if (isLoggingInGoogle) return;
    setIsLoggingInGoogle(true);
    setError("");

    try {
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user.email) throw new Error('ไม่พบอีเมลผู้ใช้');

      // ตรวจสอบ deviceId ก่อนอนุญาตให้ login
      await checkDeviceBeforeLogin(user.email);

      // ตรวจสอบผู้ใช้ใน Firestore ว่ามีข้อมูลหรือยัง
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        toast.success("เข้าสู่ระบบสำเร็จ!!", { style: { color: '#22c55e' } });
        router.push("/dashboard");
      } else {
        router.push("/loginregister");
      }
    } catch (error) {
      console.error('Google login error:', error);
      const firebaseError = error;
      
      if (
        typeof firebaseError === 'object' &&
        firebaseError !== null &&
        'code' in firebaseError
      ) {
        const code = (firebaseError as { code: string; message?: string }).code;
        if (code === 'auth/cancelled-popup-request') {
          setError("การเข้าสู่ระบบถูกยกเลิก โปรดลองอีกครั้ง");
        } else if (code === 'auth/popup-blocked') {
          setError("ป๊อปอัพถูกบล็อก โปรดอนุญาตป๊อปอัพสำหรับเว็บไซต์นี้และลองอีกครั้ง");
        } else if (code === 'auth/popup-closed-by-user') {
          setError("คุณปิดหน้าต่างเข้าสู่ระบบก่อนที่จะเสร็จสิ้น โปรดลองอีกครั้ง");
        } else {
          setError((firebaseError as { message?: string }).message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ โปรดลองอีกครั้งในภายหลัง");
        }
      } else {
        setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ โปรดลองอีกครั้งในภายหลัง");
      }
      await signOut(auth);
    } finally {
      setIsLoggingInGoogle(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
      </div>

      {/* Main login card */}
      <div className="relative w-full max-w-md">
        <button
          onClick={() => router.push('/')}
          className="cursor-pointer absolute -top-12 left-0 flex items-center text-purple-600 hover:text-purple-800 transition-colors duration-200"
        >
          <ChevronLeft size={24} />
          <span className="ml-1 text-sm font-medium">กลับ</span>
        </button>

        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">เข้าสู่ระบบ</h1>
            <p className="text-gray-600">ยินดีต้อนรับกลับมา</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <Button
            onClick={handleGoogleLogin}
            disabled={isLoggingInGoogle}
            className={`cursor-pointer w-full flex items-center justify-center py-3 px-4 border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 mb-6 ${isLoggingInGoogle ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md'
              }`}
          >
            <Image src="/assets/images/Google.png" alt="Google" width={20} height={20} className="mr-3" />
            {isLoggingInGoogle && <Loader2Icon className="animate-spin" />}
            {isLoggingInGoogle ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google'}
          </Button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">หรือเข้าสู่ระบบด้วย</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label htmlFor="email">อีเมล</Label>
              <Input id="email" type="email" placeholder="กรอกอีเมลของคุณ" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input id="password" type="password" placeholder="กรอกรหัสผ่านของคุณ" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between mt-6 mb-8">
            <Button variant='link' onClick={() => router.push('/register')} className="text-sm text-purple-600 hover:text-purple-800">
              สร้างบัญชีใหม่
            </Button>
            <Button variant='link' onClick={() => router.push('/forgot-password')} className="text-sm text-purple-600 hover:text-purple-800">
              ลืมรหัสผ่าน?
            </Button>
          </div>

          <Button
            onClick={handleManualLogin}
            disabled={isHandlingLogin}
            className="cursor-pointer w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 transition duration-200 rounded-4xl"
          >
            {isHandlingLogin && <Loader2Icon className="animate-spin" />}
            {isHandlingLogin ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </Button>
        </div>
      </div>
    </div>
  );
}