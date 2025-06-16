'use client'
import React from 'react'
import { BookOpenCheck } from 'lucide-react';
import Link from 'next/link';
const Logo = () => {
  return (
    <Link href="/" className="flex items-center">
      <div className="relative">
        <BookOpenCheck 
          color='#6500E0'
          size={32}
          className="transition-transform hover:scale-110 duration-200"
        />
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-600 rounded-full animate-pulse" />
      </div>
    </Link>
  )
}

export default Logo