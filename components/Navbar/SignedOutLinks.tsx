'use client'
import React from 'react'
import { LogOut } from 'lucide-react'
import { toast } from "sonner"
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'

interface SignedOutLinksProps {
  fullWidth?: boolean;
}

const SignedOutLinks = ({ fullWidth = false }: SignedOutLinksProps) => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully");
      router.push("/");
    } catch {
      toast.error("Failed to log out");
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={`flex items-center ${fullWidth ? 'w-full justify-center' : ''} space-x-2 bg-white text-purple-700 border border-purple-200 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 shadow-sm hover:shadow`}
    >
      <LogOut size={16} />
      <span className="font-medium">Logout</span>
    </button>
  )
}

export default SignedOutLinks