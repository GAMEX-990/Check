'use client'
import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BackgroundDecorations } from '../../components/ui/BackgroundDecorations'
import { ContactInfo } from '../../components/contact/ContactInfo'
import { ContactForm } from '../../components/contact/ContactForm'
import { FAQ } from '../../components/contact/FAQ'
import { containerVariants, itemVariants } from '../../components/animations/contactAnimations'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase'
import Loader from '@/components/Loader/Loader'

const ContactPage = () => {
  const [, loading] = useAuthState(auth);
  const [delayDone, setdelayDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setdelayDone(true);
    }, 2000); // 600ms ดีเลย์

    return () => clearTimeout(timer);
  }, []);

  if (loading || !delayDone) {
    return <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
      <Loader />
    </div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 relative overflow-hidden">
      <BackgroundDecorations />

      <motion.div
        className="relative z-10 container mx-auto px-4 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div className="text-center mb-12" variants={itemVariants}>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            ติดต่อเรา
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            เรายินดีที่จะรับฟังความคิดเห็นและข้อเสนอแนะจากคุณ ติดต่อเราได้ผ่านช่องทางต่างๆ ด้านล่าง
          </p>
        </motion.div>

        {/* Contact Information */}
        <ContactInfo />

        {/* Contact Form and FAQ */}
        <div className="grid lg:grid-cols-2 gap-8">
          <ContactForm />
          <FAQ />
        </div>
      </motion.div>
    </div>
  )
}

export default ContactPage