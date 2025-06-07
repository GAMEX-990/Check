'use client'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import Logo from './Logo'
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase'
import router from 'next/router'
import SignedOutLinks from './SignedOutLinks'

const Navbar = () => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsub();
    }, []);


    return (
        <nav>
            <div className='flex justify-between p-4 '>
                {/* LOGO ใส่ตรงนี้*/}
                <Logo />

                <div className='flex gap-20 border-b-2 border-purple-600 pb-2 text-purple-600 text-8'>
                    {user ? (
                        <>
                            <Link href={'/dashboard'}>Home</Link>
                            <Link href={'/about'}>About Us</Link>
                            <Link href={'/contact'}>Contact</Link>
                            <SignedOutLinks/>
                        </>
                    ) : (
                        <>
                            <Link href={'/'}>Home</Link>
                            <Link href={'/about'}>About Us</Link>
                            <Link href={'/contact'}>Contact</Link>
                            <Link href={'/login'}>Login</Link>
                        </>
                    )}


                </div>
            </div>
        </nav>
    )
}

export default Navbar