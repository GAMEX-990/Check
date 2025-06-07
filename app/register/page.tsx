'use client'

import { Input } from '@/components/ui/input';
import { auth, db, provider } from '@/lib/firebase';
import { Label } from "@/components/ui/label";
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'
import Image from "next/image";

export default function RegisterPage() {
  const router = useRouter();

  const [fullname, setFullname] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  // ✅ Google login
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // ตรวจสอบว่ามี profile ใน Firestore หรือยัง
      const docRef = doc(db, "students", user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // ยังไม่มี profile -> ไปหน้า loginregister เพื่อให้กรอกชื่อ-รหัส
        router.push("/loginregister");
      } else {
        // มี profile แล้ว -> ไปหน้า dashboard
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google");
    }
  };

  const handleRegister = async () => {
    if (!fullname || !studentId || !email || !password || !confirmPassword) {
      setError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    try {
      // สร้าง Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // อัพเดท profile ใน Firebase Auth
      await updateProfile(user, {
        displayName: fullname,
        photoURL: null
      });

      // บันทึกข้อมูลเพิ่มเติมลง Firestore
      await setDoc(doc(db, "students", user.uid), {
        fullname,
        studentId,
        email,
        photoURL: user.photoURL || null,
        uid: user.uid,
        createdAt: new Date().toISOString()
      });

      // ไปหน้า dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Register error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("อีเมลนี้ถูกใช้งานแล้ว");
      } else if (err.code === 'auth/weak-password') {
        setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      } else if (err.code === 'auth/invalid-email') {
        setError("รูปแบบอีเมลไม่ถูกต้อง");
      } else {
        setError("เกิดข้อผิดพลาดในการสมัครสมาชิก");
      }
    }
  };

  return (
    <div>
      {/* -----------------------ตัวกาตูนน่าโง่กูนั่งจัดตั้งนานควยถอก------------------------- */}
      <div className='absolute w-90 h-90 bottom-0 left-0 overflow-hidden'>
        <div className='relative z-10 -bottom-15 shadow-2xl'>
          <Image src="/assets/images/personlookblook.png" alt="Login" width={240} height={240} />
        </div>
        <div className="absolute -left-30 -bottom-20 w-80 h-80  bg-purple-500 rounded-full z-0 shadow-2xl"></div>
      </div>
      {/* --------------------------------------------------------------------------- */}
      <div className=' flex flex-row-reverse'>
        <div className='border-2 border-purple-500 rounded-4xl w-90 h-170 overflow-hidden relative mx-10 '>
          {/* วงกลมสีม่วง */}
          <div className="absolute left-73 -top-10 w-30 h-30  bg-purple-500 rounded-full"></div>
          <div>
            <button className='absolute cursor-pointer' onClick={() => router.push('/login')}>
              <ChevronLeft className='text-purple-500' size={40} />
            </button>
          </div>
          <div className=' flex flex-col items-center space-y-5 pt-4 h-full'>
            <div className='text-2xl font-bold text-purple-700'>
              <h1>REGISTER</h1>
            </div>
            <div className=''>
              <button
                onClick={handleGoogleLogin}
                className="text-purple-700 border-2 border-purple-500 rounded-lg p-2 flex w-60 justify-center cursor-pointer"
              >
                <Image src="/assets/images/google.png" alt="Google" width={25} height={20} />
                Sign in with Google
              </button>
            </div>
            <div className='border-1 border-purple-600 w-70'></div>
            <div>
              <h1 className='text-purple-700 text-xl font-bold'>ยินดีต้อนรับ</h1>
            </div>
            {/* Form */}
            <div className="w-60 max-w-sm items-center space-y-2">
              {/* <Label className='text-purple-700 text-sm'>ชื่อ-สกุล</Label>
              <Input 
                className='border-2 border-purple-500 rounded-lg p-2' 
                type="text" 
                placeholder="ชื่อ-สกุล" 
                value={fullname} 
                onChange={(e) => setFullname(e.target.value)}
              />
              <Label className='text-purple-700 text-sm'>รหัสนักศึกษา</Label>
              <Input 
                className='border-2 border-purple-500 rounded-lg p-2' 
                type="text" 
                placeholder="รหัสนักศึกษา" 
                value={studentId} 
                onChange={(e) => setStudentId(e.target.value)}
              /> */}
              <Label className='text-purple-700 text-sm'>email</Label>
              <Input 
                className='border-2 border-purple-500 rounded-lg p-2' 
                type="email" 
                placeholder="อีเมล" 
                value={email}
              />
              {/* <Label className='text-purple-700 text-sm'>password</Label>
              <Input 
                className='border-2 border-purple-500 rounded-lg p-2' 
                type="password" 
                placeholder="รหัสผ่าน"  
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
              />
              <Label className='text-purple-700 text-sm'>confirm password</Label>
              <Input 
                className='border-2 border-purple-500 rounded-lg p-2' 
                type="password" 
                placeholder="ยืนยันรหัสผ่าน"  
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              /> */}
            </div>
            <div>
              {error && <p className="text-red-500 text-sm mb-2 text-center">{error}</p>}
              <div>
                <button
                  onClick={handleGoogleLogin}
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
  )
};