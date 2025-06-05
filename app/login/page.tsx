import React from 'react'
import { ArrowLeft } from "lucide-react";

const LoginPage = () => {
  return (
    <div className='flex flex-row-reverse mr-8 mt-8'>
        <div className='border-2 border-purple-500 rounded-lg w-90 h-90 overflow-hidden relative'>
        <div  className="absolute left-75 -top-10  w-20 h-20  bg-purple-500 rounded-full"></div>
        <button className='absolute'> 
        <ArrowLeft size={28} color='purple'/>
        </button>
            <div className='bg-amber-400 text-center text-2xl font-bold text-purple-700 mt-4'>
                <h1>LOGIN</h1>
            </div>
        </div>
    </div>
  )
}

export default LoginPage