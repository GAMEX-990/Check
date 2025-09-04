"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import { ChevronLeft, Loader2Icon, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { updateProfile, EmailAuthProvider, linkWithCredential } from 'firebase/auth';
import { Button } from "@/components/ui/button";
import { useAuthRedirect } from "@/hook/useAuthRedirect";
import Loader from "@/components/Loader/Loader";
import { toast } from "sonner";

// Password validation helper functions
const hasNumber = (password: string): boolean => {
  return /\d/.test(password);
};

const isWeakPassword = (password: string): boolean => {
  const weakPatterns = [
    /^123456$/,
    /^1234567*$/,
    /^1111+$/,
    /^2222+$/,
    /^3333+$/,
    /^4444+$/,
    /^5555+$/,
    /^6666+$/,
    /^7777+$/,
    /^8888+$/,
    /^9999+$/,
    /^0000+$/,
    /^(.)\1{5,}$/, // Same character repeated 6+ times
    /^password$/i,
    /^qwerty$/i,
    /^abc123$/i,
    /^654321$/,
  ];
  
  return weakPatterns.some(pattern => pattern.test(password));
};

const getPasswordStrength = (password: string) => {
  if (!password) return { level: 0, text: '', color: 'gray' };
  
  let score = 0;
  const hasNum = hasNumber(password);
  const isWeak = isWeakPassword(password);
  
  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;
  if (hasNum) score += 1;
  if (!isWeak) score += 1;
  
  if (score === 1) return { level: 1, text: 'อ่อน', color: 'red' };
  if (score === 2) return { level: 2, text: 'ปานกลาง', color: 'yellow' };
  if (score === 3) return { level: 3, text: 'ดี', color: 'blue' };
  if (score === 4) return { level: 4, text: 'แข็งแรง', color: 'green' };
  
  return { level: 1, text: 'อ่อน', color: 'red' };
};

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

  // Student ID validation states
  const [isCheckingStudentId, setIsCheckingStudentId] = useState(false);
  const [studentIdStatus, setStudentIdStatus] = useState<'checking' | 'available' | 'taken' | 'idle'>('idle');
  const [studentIdError, setStudentIdError] = useState("");

  // Password validation states
  const [passwordWarnings, setPasswordWarnings] = useState<string[]>([]);

  const { user, loading } = useAuthRedirect('guest-only');

  // ถ้าไม่มี user (ไม่ได้ login ด้วย Google) ให้ redirect ไป login
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  // Function to check if student ID already exists
  const checkStudentIdExists = async (studentIdToCheck: string) => {
    if (!studentIdToCheck || studentIdToCheck.trim() === '') {
      setStudentIdStatus('idle');
      setStudentIdError('');
      return false;
    }

    setIsCheckingStudentId(true);
    setStudentIdStatus('checking');
    setStudentIdError('');

    try {
      const q = query(
        collection(db, "users"),
        where("studentId", "==", studentIdToCheck.trim()),
        where("role", "==", "student")
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setStudentIdStatus('taken');
        setStudentIdError('รหัสนักศึกษานี้ถูกใช้งานแล้ว');
        return true;
      } else {
        setStudentIdStatus('available');
        setStudentIdError('');
        return false;
      }
    } catch {
      setStudentIdStatus('idle');
      setStudentIdError('ไม่สามารถตรวจสอบรหัสนักศึกษาได้');
      return false;
    } finally {
      setIsCheckingStudentId(false);
    }
  };

  // Password validation effect
  useEffect(() => {
    const warnings: string[] = [];
    
    if (password) {
      if (!hasNumber(password)) {
        warnings.push('ควรมีตัวเลขอย่างน้อย 1 ตัวเลข');
      }
      
      if (isWeakPassword(password)) {
        warnings.push('ไม่แนะนำ รหัสผ่านของคุณง่ายเกินไป');
      }
    }
    
    setPasswordWarnings(warnings);
  }, [password]);

  // Debounced student ID check
  useEffect(() => {
    if (role === 'student' && studentId) {
      const timeoutId = setTimeout(() => {
        checkStudentIdExists(studentId);
      }, 500); // Wait 500ms after user stops typing

      return () => clearTimeout(timeoutId);
    } else {
      setStudentIdStatus('idle');
      setStudentIdError('');
    }
  }, [studentId, role]);

  // Reset student ID validation when role changes
  useEffect(() => {
    if (role === 'teacher') {
      setStudentIdStatus('idle');
      setStudentIdError('');
      setStudentId('');
    }
  }, [role]);

  // แสดง loading ขณะตรวจสอบ auth status
  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-purple-600"><Loader /></div>
        </div>
      </div>
    );
  }

  const handleRegister = async () => {
    // Validation
    sethandleManualLogin(true);

    if (!fullname || !institution || (role === 'student' && !studentId)) {
      setError("กรุณากรอกข้อมูลให้ครบ");
      sethandleManualLogin(false);
      return;
    }

    // Check if student ID is taken (for students only)
    if (role === 'student') {
      if (studentIdStatus === 'taken') {
        setError("รหัสนักศึกษานี้ถูกใช้งานแล้ว กรุณาใช้รหัสนักศึกษาอื่น");
        sethandleManualLogin(false);
        return;
      }

      if (studentIdStatus === 'checking') {
        setError("กรุณารอสักครู่ ระบบกำลังตรวจสอบรหัสนักศึกษา");
        sethandleManualLogin(false);
        return;
      }

      // Double check student ID before registration
      const isStudentIdTaken = await checkStudentIdExists(studentId);
      if (isStudentIdTaken) {
        setError("รหัสนักศึกษานี้ถูกใช้งานแล้ว กรุณาใช้รหัสนักศึกษาอื่น");
        sethandleManualLogin(false);
        return;
      }
    }

    if (!password || !confirmPassword) {
      setError("กรุณากรอกรหัสผ่านให้ครบ");
      sethandleManualLogin(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      sethandleManualLogin(false);
      return;
    }

    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      sethandleManualLogin(false);
      return;
    }

    // Check if password has at least one number (required)
    if (!hasNumber(password)) {
      setError("รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัวเลข");
      sethandleManualLogin(false);
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      setError("ไม่ได้เข้าสู่ระบบด้วย Google หรือไม่พบอีเมล");
      sethandleManualLogin(false);
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
        studentId: role === 'student' ? studentId.trim() : '',
        email: user.email,
        photoURL: user.photoURL,
        role: role,
        institution: institution,
        id: linkedUser.uid,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      router.push("/dashboard");
      toast.success("ยินดีต้อนรับสู่ Check", {
        style: {
          color: '#22c55e',
        }
      })
    } catch (err: unknown) {
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
    } finally {
      sethandleManualLogin(false);
    }
  };

  const passwordStrength = getPasswordStrength(password);

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
                <div className="relative">
                  <Input
                    className={`w-full px-4 py-3 pr-12 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 ${studentIdStatus === 'taken' ? 'border-red-300 focus:ring-red-500' :
                        studentIdStatus === 'available' ? 'border-green-300 focus:ring-green-500' :
                          'border-gray-200'
                      }`}
                    type="text"
                    placeholder="กรอกรหัสนักศึกษาของคุณ"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                  />

                  {/* Status icon */}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isCheckingStudentId && (
                      <Loader2Icon className="h-5 w-5 animate-spin text-gray-400" />
                    )}
                    {studentIdStatus === 'available' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {studentIdStatus === 'taken' && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>

                {/* Status message */}
                {studentIdError && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    {studentIdError}
                  </p>
                )}
                {studentIdStatus === 'available' && (
                  <p className="mt-2 text-sm text-green-600 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    รหัสนักศึกษานี้สามารถใช้งานได้
                  </p>
                )}
                {studentIdStatus === 'checking' && (
                  <p className="mt-2 text-sm text-gray-500 flex items-center">
                    <Loader2Icon className="h-4 w-4 mr-1 animate-spin" />
                    กำลังตรวจสอบรหัสนักศึกษา...
                  </p>
                )}
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

              {/* Password strength and warnings */}
              {password && (
                <div className="mt-3 space-y-3">
                  {/* Password strength indicator */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600">ความปลอดภัย</span>
                      <span className={`text-xs font-medium ${
                        passwordStrength.color === 'red' ? 'text-red-600' :
                        passwordStrength.color === 'yellow' ? 'text-yellow-600' :
                        passwordStrength.color === 'blue' ? 'text-blue-600' :
                        passwordStrength.color === 'green' ? 'text-green-600' :
                        'text-gray-600'
                      }`}>
                        {passwordStrength.text}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          passwordStrength.color === 'red' ? 'bg-red-500' :
                          passwordStrength.color === 'yellow' ? 'bg-yellow-500' :
                          passwordStrength.color === 'blue' ? 'bg-blue-500' :
                          passwordStrength.color === 'green' ? 'bg-green-500' :
                          'bg-gray-500'
                        }`}
                        style={{ width: `${(passwordStrength.level / 4) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Password warnings */}
                  {passwordWarnings.length > 0 && (
                    <div className="space-y-2">
                      {passwordWarnings.map((warning, index) => (
                        <div key={index} className={`flex items-center text-sm ${
                          warning.includes('ไม่แนะนำ') ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {warning.includes('ไม่แนะนำ') ? (
                            <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                          )}
                          <span>{warning}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Password requirements checklist */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className={`flex items-center ${password.length >= 6 ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      <span>รหัสผ่านต้องมีอย่างน้อย 6 ตัว</span>
                    </div>
                    <div className={`flex items-center ${hasNumber(password) ? 'text-green-600' : 'text-gray-400'}`}>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      <span>รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit button */}
          <Button
            onClick={handleRegister}
            disabled={ishandleManualLogin || (role === 'student' && (studentIdStatus === 'taken' || studentIdStatus === 'checking'))}
            className="w-full mt-8 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {ishandleManualLogin && <Loader2Icon className="animate-spin mr-2" />}
            {ishandleManualLogin ? 'กำลังเริ่มต้นใช้งาน' : 'เริ่มต้นใช้งาน'}
          </Button>
        </div>
      </div>
    </div>
  );
}