"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { createUserWithEmailAndPassword, EmailAuthProvider, linkWithCredential, updateProfile } from 'firebase/auth';

export default function LoginRegisterPage() {
  const [fullname, setFullname] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  

  const handleRegister = async () => {
    if (!fullname || !studentId || !password || !confirm) {
      setError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
  
    if (password !== confirm) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }
  
    const user = auth.currentUser;
    if (!user || !user.email) {
      setError("ไม่ได้เข้าสู่ระบบด้วย Google หรือไม่พบอีเมล");
      return;
    }
  
    try {
      // สร้าง email/password credential
      const credential = EmailAuthProvider.credential(user.email, password);
      
      // ลิงค์ credential กับ user ปัจจุบัน
      const result = await linkWithCredential(user, credential);
      const linkedUser = result.user;
  
      // อัพเดท profile
      await updateProfile(linkedUser, {
        displayName: fullname,
        photoURL: user.photoURL 
      });
  
      // บันทึกลง Firestore
      await setDoc(doc(db, "users", linkedUser.uid), {
        name: fullname,
        studentId,
        email: user.email,
        photoURL: user.photoURL,
        id: linkedUser.uid,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
  
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Registration error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("อีเมลนี้ถูกใช้งานแล้ว");
      } else if (err.code === 'auth/provider-already-linked') {
        setError("บัญชีนี้เชื่อมโยงกับ email/password แล้ว");
      } else if (err.code === 'auth/credential-already-in-use') {
        setError("ข้อมูลนี้ถูกใช้งานแล้ว");
      } else {
        setError("เกิดข้อผิดพลาดในการลงทะเบียน");
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
            <div>
              <h1 className='text-purple-700 text-xl font-bold'>ยินดีต้อนรับใกล้เสร็จแล้ว</h1>
            </div>
            {/* From */}
            <div className="w-60 max-w-sm items-center space-y-4">
              <Label className='text-purple-700 text-sm'>ชื่อ-สกุล</Label>
              <Input className='border-2 border-purple-500 rounded-lg p-2'
                type="text"
                placeholder="ชื่อ-สกุล"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
              />
              <Label className='text-purple-700 text-sm'>รหัสนักศึกษา</Label>
              <Input className='border-2 border-purple-500 rounded-lg p-2'
                type="text"
                placeholder="รหัสนักศึกษา"
             
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              />
              <Label className='text-purple-700 text-sm'>password</Label>
              <Input className='border-2 border-purple-500 rounded-lg p-2'
                type="password"
                placeholder="รหัสผ่าน"
              
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Label className='text-purple-700 text-sm'>confirm password</Label>
              <Input className='border-2 border-purple-500 rounded-lg p-2'
                type="password"
                placeholder="ยืนยันรหัสผ่าน"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <div>
              {error && <p className="text-red-500 mb-2">{error}</p>}
              <div>
                <button
                  onClick={handleRegister}
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
  );
}
