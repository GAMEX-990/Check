'use client'
import React, { useState } from 'react'
import { ChevronLeft } from "lucide-react";
import { useRouter } from 'next/navigation';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { auth, db, provider } from '@/lib/firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import Image from "next/image";
import { Input } from '@/components/ui/input';
import { Label } from '@radix-ui/react-label';


export default function LoginPage() {

  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  // 👤 Manual login
  const handleManualLogin = async () => {
    if (!email || !password) {
      setError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    try {
      // Login ผ่าน Firebase Auth โดยตรง
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');

    } catch (error) {
      console.error("Manual login error:", error);
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  // ✅ Google login
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
      const docRef = doc(db, "students", user.uid);
      const docSnap = await getDoc(docRef);

      // Also check if user might be a teacher
      const teacherRef = doc(db, "teachers", user.uid);
      const teacherSnap = await getDoc(teacherRef);

      if (!docSnap.exists() && !teacherSnap.exists()) {
        // No profile found -> redirect to registration
        router.push("/loginregister");
      } else {
        // Profile exists -> go to dashboard
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      
      // Handle specific Firebase errors
      if (err.code === 'auth/cancelled-popup-request') {
        setError("การเข้าสู่ระบบถูกยกเลิก โปรดลองอีกครั้ง");
      } else if (err.code === 'auth/popup-blocked') {
        setError("ป๊อปอัพถูกบล็อก โปรดอนุญาตป๊อปอัพสำหรับเว็บไซต์นี้และลองอีกครั้ง");
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError("คุณปิดหน้าต่างเข้าสู่ระบบก่อนที่จะเสร็จสิ้น โปรดลองอีกครั้ง");
      } else {
        setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google: " + (err.message || "โปรดลองอีกครั้งในภายหลัง"));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };


  return (
    <div>
      {/* -----------------------ตัวกาตูนน่าโง่กูนั่งจัดตั้งนานควยถอก------------------------- */}
      {/* <div className='bg-amber-500 absolute w-90 h-90 bottom-0 left-0 overflow-hidden'>
        <div className='relative z-10 bottom-2 shadow-2xl'>
          <Image src="/assets/images/personblook.png" alt="Login" width={240} height={240} />
        </div>
        <div className="absolute -left-30 -bottom-20 w-100 h-100  bg-purple-500 rounded-full z-0 shadow-2xl"></div>
      </div> */}
      {/* --------------------------------------------------------------------------- */}
      <div className=' flex flex-row-reverse'>
        <div className='border-2 border-purple-500 rounded-4xl w-90 h-150 overflow-hidden relative mx-10 '>
          {/* วงกลมสีม่วง */}
          <div className="absolute left-73 -top-10 w-30 h-30  bg-purple-500 rounded-full"></div>
          <div>
            <button className='absolute cursor-pointer' onClick={() => router.push('/')}>
              <ChevronLeft className='text-purple-500' size={40} />
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          <button
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
            className={`w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors ${isLoggingIn ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <Image src="/assets/images/google.png" alt="Google" width={20} height={20} className="mr-2" />
            {isLoggingIn ? 'Signing in...' : 'Sign in with Google'}
          </button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700" htmlFor="email">Email address</Label>
              <Input
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                type="email"
                id="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div>
              <Label className="block text-sm font-medium text-gray-700" htmlFor="password">Password</Label>
              <Input
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                type="password"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a href="/register" className="font-medium text-purple-600 hover:text-purple-500">
                Create new account
              </a>
            </div>
            <div className="text-sm">
              <a href="#" className="font-medium text-purple-600 hover:text-purple-500">
                Forgot password?
              </a>
            </div>
          </div>
          
          <button
            onClick={handleManualLogin}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>

  )
}
