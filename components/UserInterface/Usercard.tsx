'use client';

import { ArrowLeft, LogIn, X, Pencil, CheckCircle, XCircle, Loader2Icon } from 'lucide-react';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, query, collection, where, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Input } from '../ui/input';
import { handleUpdateStudentIdHandler } from '@/utils/updateStudentIdHandler';

interface UserData {
  name: string;
  email: string;
  studentId: string;
  photoURL: string;
}

const Usercard = () => {
  const [showModal, setShowModal] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UserData | null>(null);
  const router = useRouter();

  // Student ID validation states
  const [isCheckingStudentId, setIsCheckingStudentId] = useState(false);
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
    } catch (error) {
      console.error("Error checking student ID:", error);
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

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

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
      <div className=" border-2 border-purple-50 rounded-2xl shadow-lg  w-85">
        <div className="flex justify-between p-4">
          <button className="text-purple-600 text-2xl" onClick={() => router.back()}>
            <ArrowLeft />
          </button>
          <button onClick={handleLogout} className="text-purple-600">
            <LogIn />
          </button>
        </div>

        <div className="flex flex-col items-center space-y-8">
          <div className="relative">
            <Image
              className="border-4 border-purple-700 rounded-full object-cover"
              width={128}
              height={128}
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
            <div className="space-y-1 flex flex-col items-center">
              <p className="text-purple-700 font-bold">{data.name}</p>
              <div className="border-1 border-purple-700 w-50" />
            </div>
            <p className="text-purple-700 font-bold">{data.email}</p>
            <p className="text-purple-700 font-bold">{data.studentId}</p>
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
            <div className="bg-white rounded-xl p-6 w-full max-w-sm relative shadow-2xl">
              <button
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                onClick={() => setShowModal(false)}
                disabled={loading}
              >
                <X size={20} />
              </button>

              <h2 className="text-lg font-bold text-purple-700 mb-4">กรอกรหัสนักศึกษา</h2>
              
              {/* Student ID Input with validation */}
              <div className="relative mb-4">
                <Input
                  type="text"
                  placeholder="xxxxxxxxxxx-x"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className={`w-full border px-3 py-2 pr-10 rounded-2xl ${
                    studentIdStatus === 'taken' ? 'border-red-300 focus:ring-red-500' :
                    studentIdStatus === 'available' ? 'border-green-300 focus:ring-green-500' :
                    'border-gray-300'
                  }`}
                  disabled={loading}
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

              <div className="flex justify-end gap-2">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 1 }}>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-2xl hover:bg-gray-700"
                    disabled={loading}
                  >
                    ยกเลิก
                  </button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 1 }}>
                  <button
                    onClick={handleUpdateStudentId}
                    className="px-4 py-2 bg-purple-700 text-white rounded-2xl hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading || studentIdStatus === 'taken' || studentIdStatus === 'checking' || !studentId.trim()}
                  >
                    {loading ? 'กำลังอัปเดต...' : 'บันทึก'}
                  </button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Usercard;