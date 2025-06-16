'use client'
import React from 'react'
import { BookOpenCheck, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
const Logo = () => {
  return (
    <Link href="/" className="flex items-center group">
      <motion.div 
        className="relative flex items-center"
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      >
        <div className="relative z-10 flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-700 p-2 rounded-lg shadow-md">
          <BookOpenCheck 
            color='white'
            size={24}
            className="transition-transform group-hover:rotate-3 duration-300"
          />
        </div>
        <div className="ml-3 flex items-center">
          <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-purple-500">Check</span>
          <CheckCircle size={16} className="ml-1 text-green-500" />
        </div>
      </motion.div>
    </Link>
  )
}

export default Logo