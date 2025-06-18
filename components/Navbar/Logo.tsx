'use client'
import React from 'react'
import {  CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from "next/image";

const Logo = () => {
  return (
    <Link href="/" className="flex items-center group">
      <motion.div 
        className="relative flex items-center"
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      >
        <div>
        <Image 
              src="/assets/images/Logocheck.png" 
              alt="Logocheck" 
              width={50} 
              height={50} 
              className="mr-3" 
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