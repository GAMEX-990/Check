'use client'

import { ArrowLeft, LogIn } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { getUserData, UserData } from '@/utils/getcurrentuser';

const Usercard = () => {

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
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/");
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
                    {/* ส่วนของรูปโปรไฟล์ปรับแปต่งได้ถ้าไม่พอใจ มี Dose ในREADME */}
                    <div>
                        <img className=' border-4 border-purple-700 rounded-full w-30 h-30' src={data.photoURL} alt="Profile" />
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
        </div>
    )
}

export default Usercard;