"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { ChevronLeft, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { updateProfile, EmailAuthProvider, linkWithCredential } from 'firebase/auth';
import { Button } from "@/components/ui/button";

export default function LoginRegisterPage() {
  const [fullname, setFullname] = useState("");
  const [studentId, setStudentId] = useState("");
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [institution, setInstitution] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const [ishandleManualLogin, sethandleManualLogin] = useState(false);

  const handleRegister = async () => {
    // Validation

    sethandleManualLogin(true);


    if (!fullname || !institution || (role === 'student' && !studentId)) {
      setError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    if (!password || !confirmPassword) {
      setError("กรุณากรอกรหัสผ่านให้ครบ");
      return;
    }

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
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

      // บันทึกข้อมูลลง users collection เท่านั้น
      await setDoc(doc(db, "users", linkedUser.uid), {
        name: fullname,
        studentId: role === 'student' ? studentId : '',
        email: user.email,
        photoURL: user.photoURL,
        role: role,
        institution: institution,
        id: linkedUser.uid,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("Registration error:", err);
      if (typeof err === 'object' && err !== null && 'code' in err) {
        const firebaseError = err as { code?: string; message?: string };
        if (firebaseError.code === 'auth/email-already-in-use') {
          setError("อีเมลนี้ถูกใช้งานแล้ว");
        } else if (firebaseError.code === 'auth/provider-already-linked') {
          setError("บัญชีนี้เชื่อมโยงกับ email/password แล้ว");
        } else if (firebaseError.code === 'auth/credential-already-in-use') {
          setError("ข้อมูลนี้ถูกใช้งานแล้ว");
        } else if (firebaseError.code === 'auth/weak-password') {
          setError("รหัสผ่านไม่ปลอดภัย กรุณาใช้รหัสผ่านที่แข็งแกร่งกว่านี้");
        } else {
          setError("เกิดข้อผิดพลาดในการลงทะเบียน: " + (firebaseError.message || ""));
        }
      } else {
        setError("เกิดข้อผิดพลาดในการลงทะเบียน");
      }
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
              width={200}
              height={200}
              className="drop-shadow-2xl"
            />
          </div>
        </div>
      </div>

      {/* Main registration card */}
      <div className="relative w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => router.push('/login')}
          className="absolute -top-12 left-0 flex items-center text-purple-600 hover:text-purple-800 transition-colors duration-200"
        >
          <ChevronLeft size={24} />
          <span className="ml-1 text-sm font-medium">กลับ</span>
        </button>

        {/* Registration card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-green-600 rounded-full mb-4">
              <span className="text-2xl">✨</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">เกือบเสร็จแล้ว!</h1>
            <p className="text-gray-600">กรอกข้อมูลเพิ่มเติมเพื่อเริ่มใช้งาน</p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <div className="space-y-6">
            {/* Full name */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อ-สกุล
              </Label>
              <Input
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                type="text"
                placeholder="กรอกชื่อ-สกุลของคุณ"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
              />
            </div>

            {/* Role selection */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-3">
                บทบาท
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${role === 'student'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="text-2xl mb-2">🎓</div>
                  <div className="font-medium">นักเรียน</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${role === 'teacher'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                  <div className="text-2xl mb-2">👨‍🏫</div>
                  <div className="font-medium">อาจารย์</div>
                </button>
              </div>
            </div>

            {/* Student ID (only for students) */}
            {role === 'student' && (
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสนักศึกษา
                </Label>
                <Input
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  type="text"
                  placeholder="กรอกรหัสนักศึกษาของคุณ"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />
              </div>
            )}

            {/* Institution */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                สถาบันการศึกษา
              </Label>
              <Input
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                type="text"
                placeholder="กรอกชื่อโรงเรียน/มหาวิทยาลัยของคุณ"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              />
            </div>

            {/* Password Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">ตั้งรหัสผ่าน</h3>
                <p className="text-sm text-gray-600">สร้างรหัสผ่านเพื่อใช้เข้าสู่ระบบในครั้งต่อไป</p>
              </div>

              {/* Password */}
              <div className="space-y-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    รหัสผ่าน
                  </Label>
                  <Input
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    type="password"
                    placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">
                    ยืนยันรหัสผ่าน
                  </Label>
                  <Input
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    type="password"
                    placeholder="ยืนยันรหัสผ่านของคุณ"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              {/* Password strength indicator */}
              {password && (
                <div className="mt-3">
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 flex-1 rounded-full ${password.length < 6 ? 'bg-red-200' :
                        password.length < 8 ? 'bg-yellow-200' : 'bg-green-200'
                      }`}>
                      <div className={`h-full rounded-full transition-all duration-300 ${password.length < 6 ? 'w-1/3 bg-red-500' :
                          password.length < 8 ? 'w-2/3 bg-yellow-500' : 'w-full bg-green-500'
                        }`}></div>
                    </div>
                    <span className={`text-xs font-medium ${password.length < 6 ? 'text-red-600' :
                        password.length < 8 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                      {password.length < 6 ? 'อ่อน' :
                        password.length < 8 ? 'ปานกลาง' : 'แข็งแรง'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit button */}
          <Button
            onClick={handleRegister}
            disabled={ishandleManualLogin}
            className="w-full mt-8 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            {ishandleManualLogin && <Loader2Icon className="animate-spin" />}
            {ishandleManualLogin ? 'กำลังเริ่มต้นใช้งาน' : 'เริ่มต้นใช้งาน'}
            เริ่มใช้งาน
          </Button>
        </div>
      </div>
    </div>
  );
}