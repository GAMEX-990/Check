'use client'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import Logo from './Logo'
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase'
import SignedOutLinks from './SignedOutLinks'
import { Menu, X } from 'lucide-react'
import { motion } from 'framer-motion'

const Navbar = () => {
    const [user, setUser] = useState<User | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        <motion.nav 
            className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo section */}
                    <div className="flex items-center">
                        <Logo />
                        <span className="ml-2 text-xl font-semibold text-purple-700 hidden sm:block">Check-in</span>
                    </div>

                    {/* Desktop navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link 
                                key={link.href}
                                href={link.href}
                                className="text-gray-600 hover:text-purple-700 px-3 py-2 text-sm font-medium transition-colors relative group"
                            >
                                {link.name}
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-200 ease-out"></span>
                            </Link>
                        ))}
                        {user ? (
                            <SignedOutLinks />
                        ) : (
                            <Link 
                                href="/login"
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center space-x-1"
                            >
                                <span>Login</span>
                            </Link>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-purple-700 hover:text-purple-900 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
                        >
                            <span className="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
                            {mobileMenuOpen ? (
                                <X className="block h-6 w-6" aria-hidden="true" />
                            ) : (
                                <Menu className="block h-6 w-6" aria-hidden="true" />
                            )}
                        </button>
                    </div>
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