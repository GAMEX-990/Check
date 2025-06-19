'use client'

import { ArrowLeft, LogIn, X, Pencil } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getUserData, UserData } from '@/utils/getcurrentuser';
import { updateStudentId } from '@/utils/informationupdate';
import { motion } from 'framer-motion';

const Usercard = () => {
    const [showModal, setShowModal] = useState(false);
    const [studentId, setStudentId] = useState('');
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<UserData | null>(null);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push("/");
                return;
            }

            const userData = await getUserData(user.uid);
            if (!userData) {
                router.push("/");
                return;
            }

            setData(userData);
        });

        return () => unsubscribe(); // cleanup listener
    }, [router]);

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/");
    };

    const handleUpdateStudentId = async () => {
        if (!studentId.trim()) {
            alert('กรุณากรอกรหัสนักศึกษา');
            return;
        }

        setLoading(true);
        const result = await updateStudentId(studentId.trim());

        if (result.success) {
            alert('อัพเดทรหัสนักศึกษาสำเร็จ');
        } else {
            alert('เกิดข้อผิดพลาด: ' + result.error);
        }

        setLoading(false);
    };


    if (!data) return <p>Loading...</p>;

    return (
        <div className=' flex justify-center'>
            <div className='border-2 border-purple-500 rounded-2xl w-85'>
                {/* ตรงนี้คือIcons */}
                <div className="flex  justify-between p-4">
                    <button className="text-purple-600 text-2xl"><ArrowLeft /></button>
                    <button onClick={handleLogout} className="text-purple-600"><LogIn /></button>
                </div>
                <div className="flex flex-col items-center space-y-8">
                    <div className='relative'>
                        <div>
                            <img className=' border-4 border-purple-700 rounded-full w-30 h-30' src={data.photoURL} alt="Profile" />
                        </div>
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 1 }}
                        >
                            <div
                                className="absolute bottom-2 right-2 bg-purple-600 hover:bg-purple-700 cursor-pointer text-white rounded-full p-1"
                                onClick={() => setShowModal(true)}
                                title="แก้ไขข้อมูล"
                            >
                                <Pencil size={18} />
                            </div>
                            </motion.div>
                    </div>

                    {/* ข้อมูลชื่อ อีเมล์ */}
                    <div className="flex flex-col text-center items-center space-y-8 m-4">
                        <div className='space-y-1 flex flex-col items-center'>
                            <p className="text-purple-700 font-bold">{data.name}</p>
                            <div className="border-1 border-purple-700 w-50"></div>
                        </div>
                        <div>
                            <p className="text-purple-700 font-bold">{data.email}</p>
                        </div>
                        <div>
                            <p className="text-purple-700 font-bold">{data.studentId}</p>
                        </div>
                    </div>
                    {/* ปุ่ม */}
                </div>
            </div>
            {showModal && (
                <div className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex justify-center items-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm relative">
                        {/* Close Button */}
                        <button
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowModal(false)}
                            disabled={loading}
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-lg font-semibold mb-4">กรอกรหัสนักศึกษา</h2>

                        <input
                            type="text"
                            placeholder="65162110336-5"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:border-blue-500"
                            disabled={loading}
                        />

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                                disabled={loading}
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleUpdateStudentId}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? 'กำลังอัปเดต...' : 'บันทึก'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Usercard;