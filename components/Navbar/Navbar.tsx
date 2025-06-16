'use client'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import Logo from './Logo'
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase'
import router from 'next/router'
import SignedOutLinks from './SignedOutLinks'
import { Menu, X } from 'lucide-react'
import { motion } from 'framer-motion'

const Navbar = () => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsub();
    }, []);

    const navLinks = user ? [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'About Us', href: '/about' },
        { name: 'Contact', href: '/contact' },
    ] : [
        { name: 'Home', href: '/' },
        { name: 'About Us', href: '/about' },
        { name: 'Contact', href: '/contact' },
    ];

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

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <motion.div 
                    className="md:hidden bg-white shadow-lg rounded-b-lg"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.2 }}
                >
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-purple-700 hover:bg-purple-50"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                        {user ? (
                            <div className="px-3 py-2">
                                <SignedOutLinks />
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="block w-full text-center bg-purple-600 text-white px-3 py-2 rounded-md text-base font-medium hover:bg-purple-700"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </motion.div>
            )}
        </motion.nav>
    )
}

export default Navbar