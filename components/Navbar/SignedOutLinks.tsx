'use client'
import React from 'react'
import { LogIn } from 'lucide-react'
import { toast } from "sonner"
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import router from 'next/router'
import { useRouter } from 'next/navigation'

const SignedOutLinks = () => {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };


// อันนี้เอาไว้กอ่นไม่ต้องลบนะเพื่อใช้
// const handleLogout =()=>{
//     toast("ออกจากระบบเรียบร้อยแล้วสุดหล่อ")

// }

  return (
    <div>  
       <button onClick={handleLogout}>Logout</button>
    </div>
  )
}

export default SignedOutLinks