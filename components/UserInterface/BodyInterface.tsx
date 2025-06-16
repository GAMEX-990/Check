'use client';

import React from 'react'
import { motion } from 'framer-motion'

const BodyInterface = () => {
    return (
<<<<<<< HEAD
        <div>
            <div className='bg-amber-600'>
                <div className="bg-amber-800 flex flex-col gap-4 w-80 mt-50 ml-10">
                    <h1 className="text-5xl font-bold text-purple-700">Check-in</h1>
                    <h2 className="text-2xl text-purple-400">Check in for class</h2>
                    <p className="text-purple-300">
                        To make the lives of students easier<br />
                        when checking in to class.
                    </p>
                    <button className="bg-purple-500 h-auto w-60 text-white text-xl font-bold p-3 rounded-2xl hover:bg-purple-400 transition">
                        Start Check-in
                    </button>
                </div>
=======
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
            <div className="container mx-auto px-4 py-16 flex flex-col md:flex-row items-center justify-between">
                {/* Left Content Section */}
                <motion.div 
                    className="flex flex-col space-y-6 max-w-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center space-x-2">
                        <div className="h-1.5 w-10 bg-purple-600 rounded-full"></div>
                        <span className="text-purple-600 font-medium">ATTENDANCE MADE SIMPLE</span>
                    </div>
                    
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-800">
                        <span className="text-purple-700">Check-in</span> for your classes
                    </h1>
                    
                    <h2 className="text-xl text-gray-600 font-light">
                        Streamlined attendance tracking for students and teachers
                    </h2>
                    
                    <p className="text-gray-500 text-lg">
                        Our platform makes checking in to class quick and effortless,
                        saving time for both students and educators.
                    </p>
                    
                    <div className="pt-4 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                        <motion.button 
                            className="bg-purple-600 text-white text-lg font-semibold px-8 py-4 rounded-xl hover:bg-purple-700 transition shadow-lg hover:shadow-xl hover:-translate-y-1"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Start Check-in
                        </motion.button>
                        
                        <motion.button 
                            className="border-2 border-purple-600 text-purple-600 text-lg font-semibold px-8 py-4 rounded-xl hover:bg-purple-50 transition"
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Learn More
                        </motion.button>
                    </div>
                    
                    <div className="flex items-center space-x-4 pt-6">
                        <div className="flex -space-x-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className={`w-8 h-8 rounded-full border-2 border-white bg-purple-${300 + (i * 100)} flex items-center justify-center text-xs text-white font-bold`}>
                                    {String.fromCharCode(65 + i)}
                                </div>
                            ))}
                        </div>
                        <p className="text-gray-500 text-sm">Join <span className="font-semibold">1,000+</span> students using Check-in daily</p>
                    </div>
                </motion.div>
                
                {/* Right Image/Illustration Section */}
                <motion.div 
                    className="mt-12 md:mt-0 w-full md:w-1/2 flex justify-center"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="relative w-full max-w-md">
                        <div className="absolute -top-6 -left-6 w-24 h-24 bg-purple-200 rounded-full opacity-50"></div>
                        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-purple-300 rounded-full opacity-40"></div>
                        
                        <div className="relative z-10 bg-white rounded-2xl shadow-xl p-6 border border-purple-100">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                </div>
                                <div className="text-xs text-gray-400">check-in.app</div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="h-10 bg-purple-100 rounded-lg w-3/4 flex items-center px-3">
                                    <div className="w-5 h-5 rounded-full bg-purple-500 mr-2"></div>
                                    <div className="text-sm text-purple-700 font-medium">Web Development</div>
                                </div>
                                
                                <div className="h-10 bg-gray-100 rounded-lg flex items-center px-3">
                                    <div className="w-5 h-5 rounded-full bg-gray-300 mr-2"></div>
                                    <div className="text-sm text-gray-500">Data Structures</div>
                                </div>
                                
                                <div className="h-10 bg-gray-100 rounded-lg flex items-center px-3">
                                    <div className="w-5 h-5 rounded-full bg-gray-300 mr-2"></div>
                                    <div className="text-sm text-gray-500">Mobile App Design</div>
                                </div>
                                
                                <div className="mt-6 flex justify-end">
                                    <div className="bg-purple-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                                        Check-in Now
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
>>>>>>> 0b1002dc93204edd54915c5093783ace982bbbc0
            </div>
        </div>
    )
}

export default BodyInterface