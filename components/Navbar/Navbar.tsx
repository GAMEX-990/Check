'use client'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import Logo from './Logo'
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase'
import { AlignJustify } from 'lucide-react';
import SignedOutLinks from './SignedOutLinks'

const Navbar = () => {
    const [user, setUser] = useState<User | null>(null);
    // const [isShowTogle, setIsShowTogle] = useState(false);

    // const Togle = () => {
    //     setIsShowTogle(!isShowTogle);
    //     console.log(isShowTogle);
    // }

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsub();
    }, []);


    return (
        <nav>
            <div>
                {/* LOGO ใส่ตรงนี้*/}
                

                <div  className='flex justify-between p-4 '>
                    <a href='/'>
                        <Logo />
                    </a>
                    <div className= 'bg-amber-500 flex  text-purple-600 text-8 space-x-10 ' >
                        {user ? (
                            <>
                                <Link href={'/dashboard'}>Home</Link>
                                <Link href={'/about'}>About</Link>
                                <Link href={'/contact'}>Contact</Link>
                                <SignedOutLinks />
                            </>
                        ) : (
                            <>
                                <Link href={'/'}>Home</Link>
                                <Link href={'/about'}>About</Link>
                                <Link href={'/contact'}>Contact</Link>
                                <Link href={'/login'}>Login</Link>
                            </>
                        )}
                    </div>
                    {/* <div className='md:hidden'>
                        <AlignJustify/>
                    </div> */}
                </div>
            </div>
        </nav>
    )
}

export default Navbar