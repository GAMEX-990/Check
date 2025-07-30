'use client';

import { X, Pencil, CheckCircle, XCircle, Loader2Icon } from 'lucide-react';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, query, collection, where, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Input } from '../ui/input';
import { handleUpdateStudentIdHandler } from '@/utils/updateStudentIdHandler';
import { Label } from '../ui/label';

interface UserData {
  name: string;
  email: string;
  studentId: string;
  photoURL: string;
  role: string;
  institution: string;
}

const Usercard = () => {
  const [showModal, setShowModal] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UserData | null>(null);
  const router = useRouter();

  // Student ID validation states
  const [, setIsCheckingStudentId] = useState(false);
  const [studentIdStatus, setStudentIdStatus] = useState<'checking' | 'available' | 'taken' | 'idle'>('idle');
  const [studentIdError, setStudentIdError] = useState("");

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/');
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setData(docSnap.data() as UserData);
        }
      });

      return unsubscribeUser;
    });

    return () => unsubscribeAuth();
  }, [router]);

  // Function to check if student ID already exists
  const checkStudentIdExists = useCallback(async (studentIdToCheck: string) => {
    if (!studentIdToCheck || studentIdToCheck.trim() === '') {
      setStudentIdStatus('idle');
      setStudentIdError('');
      return false;
    }

    // Skip checking if it's the same as current student ID
    if (data && studentIdToCheck.trim() === data.studentId) {
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
  }, [data]);

  // Debounced student ID check
  useEffect(() => {
    if (studentId) {
      const timeoutId = setTimeout(() => {
        checkStudentIdExists(studentId);
      }, 500); // Wait 500ms after user stops typing

      return () => clearTimeout(timeoutId);
    } else {
      setStudentIdStatus('idle');
      setStudentIdError('');
    }
  }, [studentId, checkStudentIdExists]);

  // Reset validation when modal closes
  useEffect(() => {
    if (!showModal) {
      setStudentId('');
      setStudentIdStatus('idle');
      setStudentIdError('');
    }
  }, [showModal]);

  const handleUpdateStudentId = async () => {
    // Check if student ID is taken
    if (studentIdStatus === 'taken') {
      return;
    }

    if (studentIdStatus === 'checking') {
      return;
    }

    // Double check student ID before updating
    const isStudentIdTaken = await checkStudentIdExists(studentId);
    if (isStudentIdTaken) {
      return;
    }

    // Call the original handler
    handleUpdateStudentIdHandler(studentId, setLoading, setShowModal, setData);
  };

  if (!data) return null;

  return (
    <div className="flex justify-center">
      <div className="flex flex-col items-center space-y-8">
        <div className="relative">
          <Image
            className="rounded-full object-cover"
            width={100}
            height={100}
            src={data.photoURL || '/default-profile.png'}
            alt="Profile"
          />
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 1 }}>
            <div
              className="absolute bottom-2 right-2 bg-purple-600 hover:bg-purple-700 cursor-pointer text-white rounded-full p-1"
              onClick={() => setShowModal(true)}
              title="แก้ไขข้อมูล"
            >
              <Pencil size={18} />
            </div>
          </motion.div>
        </div>

        <div className="flex flex-col text-center items-center space-y-8 m-4">
          <div className="flex flex-col items-stretch space-y-8">
            <Label className="text-sm font-medium text-gray-700 mb-2">
              ชื่อ-สกุล
            </Label>
            <p className="text-purple-700 font-bold rounded-xl p-1 px-2 border border-purple-200 shadow-lg">{data.name}</p>
            <Label className="text-sm font-medium text-gray-700 mb-2">
              อีเมล
            </Label>
            <p className="text-purple-700 font-bold rounded-xl p-1 px-2 border border-purple-200 shadow-lg">{data.email}</p>
            <Label className="text-sm font-medium text-gray-700 mb-2">
              รหัสนักศึกษา
            </Label>
            <p className="text-purple-700 font-bold rounded-xl p-1 px-2 border border-purple-200 shadow-lg">{data.studentId}</p>
            <Label className="text-sm font-medium text-gray-700 mb-2">
              ชื่อสถาบัน
            </Label>
            <p className="text-purple-700 font-bold rounded-xl p-1 px-2 border border-purple-200 shadow-lg">{data.institution}</p>
            <Label className="text-sm font-medium text-gray-700 mb-2">
              สถานะ
            </Label>
            <p className="text-purple-700 font-bold rounded-xl p-1 px-2 border border-purple-200 shadow-lg">{data.role}</p>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-20">
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-10"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              duration: 0.4,
              scale: { type: 'spring', bounce: 0.5 },
            }}
          >
            <div className="bg-white rounded-3xl shadow-lg relative overflow-hidden md:w-100">
              <div className="absolute -top-16 -right-16 w-35 h-35 bg-purple-500 rounded-full"></div>
              <div>
                <button
                  className="absolute top-2 right-2 z-10 text-white hover:text-gray-200 transition-colors"
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                >
                  <X size={20} />
                </button>
              </div>
                {/* ส่วนขวา - ฟอร์มสำหรับกรอกข้อมูล */}
                <div className="m-10">
                  <div className="p-4 rounded-2xl h-50 shadow-lg space-y-5">
                    <div>
                      <h2 className="text-purple-700 font-bold text-xl  text-center">
                        รหัสนักศึกษา
                      </h2>
                    </div>
                    <div className='space-y-2'>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          รหัสนักศึกษา
                        </Label>
                      </div>
                      <div>
                        <Input
                          type="text"
                          placeholder="xxxxxxxxxxx-x"
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                          className={`w-full border px-3 py-2 pr-10 rounded-2xl ${studentIdStatus === 'taken' ? 'border-red-300 focus:ring-red-500' :
                            studentIdStatus === 'available' ? 'border-green-300 focus:ring-green-500' :
                              'border-gray-300'
                            }`}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    {/* Status icon */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                     
                    </div>
                    {/* Status message */}
                    <div className='mt-2'>
                      {studentIdError && (
                        <p className="mb-4 text-sm text-red-600 flex items-center">
                          <XCircle className="h-4 w-4 mr-1" />
                          {studentIdError}
                        </p>
                      )}
                      {studentIdStatus === 'available' && (
                        <p className="mb-4 text-sm text-green-600 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          รหัสนักศึกษานี้สามารถใช้งานได้
                        </p>
                      )}
                      {studentIdStatus === 'checking' && (
                        <p className="mb-4 text-sm text-gray-500 flex items-center">
                          <Loader2Icon className="h-4 w-4 mr-1 animate-spin" />
                          กำลังตรวจสอบรหัสนักศึกษา...
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ปุ่มเปลี่ยนรหัส */}
                  <div className="p-5">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 1 }}>
                      <button
                        onClick={handleUpdateStudentId}
                        className="w-full bg-purple-500 text-white py-3 rounded-xl font-medium hover:bg-purple-600 transition-colors shadow-lg"
                        disabled={loading || studentIdStatus === 'taken' || studentIdStatus === 'checking' || !studentId.trim()}
                      >
                        {loading ? 'กำลังอัปเดต...' : 'บันทึก'}
                      </button>
                    </motion.div>
                  </div>
                </div>
              </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Usercard;