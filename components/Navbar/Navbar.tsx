'use client'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import Logo from './Logo'
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase'
import SignedOutLinks from './SignedOutLinks'
import { Menu, X, User as UserIcon, Home, Info, Mail } from 'lucide-react'
import { motion } from 'framer-motion'

const Navbar = () => {
    const [user, setUser] = useState<User | null>(null);
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        
        window.addEventListener('scroll', handleScroll);
        return () => {
            unsub();
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const navLinks = user ? [
        { name: 'Dashboard', href: '/dashboard', icon: <Home size={18} /> },
        { name: 'About Us', href: '/about', icon: <Info size={18} /> },
        { name: 'Contact', href: '/contact', icon: <Mail size={18} /> },
    ] : [
        { name: 'Home', href: '/', icon: <Home size={18} /> },
        { name: 'About Us', href: '/about', icon: <Info size={18} /> },
        { name: 'Contact', href: '/contact', icon: <Mail size={18} /> },
    ];

    return (
        <motion.nav 
            className={`sticky top-0 z-50 w-full ${scrolled ? 'bg-white shadow-md' : 'bg-transparent'} transition-all duration-300`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        >
            <div className='max-w-7xl mx-auto flex justify-between items-center px-4 py-3 md:py-4'>
                {/* Logo */}
                <Logo />
                
                {/* Desktop Navigation */}
                <div className='hidden md:flex items-center space-x-8'>
                    <div className='flex items-center space-x-6'>
                        {navLinks.map((link) => (
                            <Link 
                                key={link.href} 
                                href={link.href}
                                className='flex items-center space-x-1 text-gray-700 hover:text-purple-700 font-medium transition-colors duration-200'
                            >
                                <span className="text-purple-600">{link.icon}</span>
                                <span>{link.name}</span>
                            </Link>
                        ))}
                    </div>
                    
                    <div className="h-8 w-px bg-gray-200 mx-2"></div>
                    
                    {user ? (
                        <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-2 bg-purple-50 px-3 py-1 rounded-full">
                                <div className="bg-purple-100 p-1 rounded-full">
                                    <UserIcon size={16} className="text-purple-700" />
                                </div>
                                <span className="text-sm text-purple-700 font-medium truncate max-w-[100px]">
                                    {user.email?.split('@')[0]}
                                </span>
                            </div>
                            <SignedOutLinks />
                        </div>
                    ) : (
                        <Link 
                            href="/login"
                            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg font-medium transition-colors duration-200 shadow-md hover:shadow-lg"
                        >
                            Login
                        </Link>
                    )}
                </div>
                
                {/* Mobile menu button */}
                <div className="md:hidden">
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100"
                        aria-label="Toggle mobile menu"
                    >
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            <motion.div 
                className={`md:hidden overflow-hidden ${scrolled ? 'bg-white' : 'bg-white/95 backdrop-blur-sm'}`}
                initial={{ height: 0 }}
                animate={{ height: mobileMenuOpen ? 'auto' : 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                <div className="px-4 py-3 space-y-3 border-t border-gray-100">
                    {user && (
                        <div className="flex items-center space-x-2 px-2 py-2 bg-purple-50 rounded-lg mb-3">
                            <div className="bg-purple-100 p-1.5 rounded-full">
                                <UserIcon size={16} className="text-purple-700" />
                            </div>
                            <span className="text-sm text-purple-700 font-medium truncate">
                                {user.email?.split('@')[0]}
                            </span>
                        </div>
                    )}
                    
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="flex items-center space-x-3 px-2 py-2 rounded-lg text-gray-700 hover:text-purple-700 hover:bg-purple-50 transition-colors duration-200"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <span className="text-purple-600">{link.icon}</span>
                            <span className="font-medium">{link.name}</span>
                        </Link>
                    ))}
                    
                    <div className="pt-2 border-t border-gray-100 mt-2">
                        {user ? (
                            <div className="px-2 py-2">
                                <SignedOutLinks fullWidth={true} />
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="flex items-center justify-center w-full bg-purple-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors duration-200 shadow-sm"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.nav>
    )
}

export default Navbar