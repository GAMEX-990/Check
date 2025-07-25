'use client'
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Target, Award, Heart } from 'lucide-react'
import { useAuthState } from 'react-firebase-hooks/auth'
import Loader from '@/components/Loader/Loader'
import { auth } from '@/lib/firebase'
import Image from 'next/image'


const AboutPage = () => {
  const [, loading] = useAuthState(auth);
  const [delayDone, setdelayDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setdelayDone(true);
    }, 2000); // 600ms ดีเลย์

    return () => clearTimeout(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5
      }
    },
    hover: {
      scale: 1.05,
      y: -5,
      transition: {
        duration: 0.3
      }
    }
  }

  if (loading || !delayDone) {
    return <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
      <Loader />
    </div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-50"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      <motion.div
        className="relative z-10 container mx-auto px-4 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="text-center mb-12" variants={itemVariants}>
          <motion.h1
            className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            เกี่ยวกับเรา
          </motion.h1>
          <motion.p
            className="text-lg text-gray-600 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            ระบบตรวจสอบและจัดการการเรียนรู้ที่ออกแบบมาเพื่อนักเรียนและครูในยุคดิจิทัล
          </motion.p>
        </motion.div>

        {/* Main content */}
        <div className="max-w-6xl mx-auto">
          {/* Mission section */}
          <motion.div
            className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8"
            variants={cardVariants}
            whileHover="hover"
          >
            <div className="flex items-center mb-6">
              <motion.div
                className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Target className="text-white" size={24} />
              </motion.div>
              <h2 className="text-2xl font-bold text-gray-800">พันธกิจของเรา</h2>
            </div>
            <p className="text-gray-600 text-lg leading-relaxed">
              เราเชื่อว่าการศึกษาคือรากฐานสำคัญของสังคมดหกดกดหดห ระบบ Check ถูกพัฒนาขึ้นเพื่อช่วยให้การเรียนการสอน
              เป็นไปอย่างมีประสิทธิภาพ โดยเชื่อมโยงเทคโนโลยีเข้ากับการศึกษาอย่างลงตัว
              เพื่อสร้างประสบการณ์การเรียนรู้ที่ดีที่สุดสำหรับทุกคน
            </p>
          </motion.div>

          {/* Features grid */}
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
            variants={containerVariants}
          >
            <motion.div
              className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
              variants={cardVariants}
              whileHover="hover"
            >
              <motion.div
                className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Users className="text-white" size={24} />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">สำหรับนักเรียน</h3>
              <p className="text-gray-600">
                ติดตามผลการเรียน จัดการงานที่ได้รับมอบหมาย และเข้าถึงทรัพยากรการเรียนรู้ได้อย่างง่ายดาย
              </p>
            </motion.div>

            <motion.div
              className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
              variants={cardVariants}
              whileHover="hover"
            >
              <motion.div
                className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Award className="text-white" size={24} />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">สำหรับครู</h3>
              <p className="text-gray-600">
                จัดการชั้นเรียน สร้างแบบทดสอบ ติดตามความก้าวหน้าของนักเรียน และสร้างรายงานผลการเรียน
              </p>
            </motion.div>

            <motion.div
              className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 md:col-span-2 lg:col-span-1"
              variants={cardVariants}
              whileHover="hover"
            >
              <motion.div
                className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-4"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Heart className="text-white" size={24} />
              </motion.div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">ใช้งานง่าย</h3>
              <p className="text-gray-600">
                ออกแบบให้ใช้งานง่าย เข้าใจได้ทันที พร้อมการสนับสนุนและช่วยเหลือตลอด 24 ชั่วโมง
              </p>
            </motion.div>
          </motion.div>

          {/* Team section */}
          <motion.div
            className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8"
            variants={cardVariants}
            whileHover="hover"
          >
            <div className=''>
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">ทีมพัฒนา</h2>
            </div>
            <div className='items-center justify-center flex flex-col gap-y-8 md:gap-x-18 md:flex-row'>
              {/* --------------------------------------------------------- */}
              <div className='flex flex-col items-center'>
                <div>
                  <Image
                    src="/assets/images/Myme.png"
                    height={80}
                    width={80}
                    alt='ime'
                  />
                </div>
                <div className='text-center'>
                  <p>Thanachot Yinkhunthod</p>
                  <p>thanachotyinkhunthod@gmail.com</p>
                  <p>0640746639</p>
                </div>
              </div>
              {/* --------------------------------------------------------- */}
              {/* --------------------------------------------------------- */}
              <div className='flex flex-col items-center'>
                <div>
                  <Image
                    src="/assets/images/Crap.png"
                    height={80}
                    width={80}
                    alt='ime'
                  />
                </div>
                <div className='text-center'>
                  <p>Yodsawat Chansungnoen</p>
                  <p>karpleo76@gmail.con</p>
                  <p>0955179730</p>
                </div>
              </div>
              {/* --------------------------------------------------------- */}
              {/* --------------------------------------------------------- */}
              <div className='flex flex-col items-center'>
                <div>
                  <Image
                    src="/assets/images/papyy.png"
                    height={80}
                    width={80}
                    alt='ime'
                  />
                </div>
                <div className='text-center'>
                  <p>sornthep chimsuntorn</p>
                  <p>sornthep1001@gmail.com</p>
                  <p>0637350595</p>
                </div>
              </div>
              {/* --------------------------------------------------------- */}
            </div>

          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

export default AboutPage