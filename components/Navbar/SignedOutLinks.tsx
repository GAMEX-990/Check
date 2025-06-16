'use client'
import React from 'react'
import { LogOut } from 'lucide-react'
import { toast } from "sonner"
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

const SignedOutLinks = () => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      router.push("/");
    } catch (error) {
      toast.error("Failed to log out");
      console.error("Logout error:", error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center space-x-2 bg-white text-purple-700 border border-purple-200 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
    >
      <LogOut size={16} />
      <span className="font-medium">Logout</span>
    </button>
  )
}

export default SignedOutLinks