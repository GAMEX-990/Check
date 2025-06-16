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
  const handleGoogleLogin = async () => {
    try {

      provider.setCustomParameters({
        prompt: 'select_account'
      })

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // ตรวจสอบว่ามี profile ใน Firestore หรือยัง
      const docRef = doc(db, "students", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // ยังไม่มี profile -> ไปหน้า register เพื่อให้กรอกชื่อ-รหัส
        router.push("/loginregister");
      } else {
        // มี profile แล้ว -> ไปหน้าโปรไฟล์
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Google login error:", err);
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google");
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
          <div className=' flex flex-col items-center space-y-8 pt-4 h-full'>
            <div className='text-2xl font-bold text-purple-700'>
              <h1>LOGIN</h1>
            </div>
            <div className=''>
              <button
                onClick={handleGoogleLogin}
                className="text-purple-700 border-2 border-purple-500 rounded-lg p-2 flex w-60 justify-center"
              >
                <Image src="/assets/images/google.png" alt="Google" width={25} height={20} />
                Sign in with Google
              </button>
            </div>
            <div className='border-1 border-purple-600 w-70'></div>
            <div>
              <h1 className='text-purple-700 text-xl font-bold'>ยินดีต้อนรับกลับ</h1>
            </div>
            {/* From */}
            <div className="w-60 max-w-sm items-center space-y-4">
              <Label className='text-purple-700 text-sm' htmlFor="email">อีเมล</Label>
              <Input
                className='border-2 border-purple-500 rounded-lg p-2'
                type="email"
                id="email"
                placeholder="อีเมล"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Label className='text-purple-700 text-sm' htmlFor="email">รหัสผ่าน</Label>
              <Input
                className='border-2 border-purple-500 rounded-lg p-2'
                type="password"
                id="password"
                placeholder="รหัสผ่าน"
                value={password}
                onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <div className='space-y-2'>
                <div>
                  <a href="/register">
                    <p className='text-purple-700 text-center text-sm'>สมัครสมาชิกใหม่</p>
                  </a>
                </div>
                <div>
                  <button
                    onClick={handleManualLogin}
                    className="w-30 h-10 bg-purple-500 rounded-4xl text-white font-bold cursor-pointer"
                  >
                    GO
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  )
}
