'use client'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'
import { cardVariants, itemVariants } from '../animations/contactAnimations'

const contactItems = [
  {
    icon: Mail,
    title: 'อีเมล',
    content: 'support@check.edu',
    description: 'ส่งข้อความถึงเราได้ตลอดเวลา'
  },
  {
    icon: Phone,
    title: 'โทรศัพท์',
    content: '02-123-4567',
    description: 'เปิดให้บริการ จ.-ศ. 9:00-18:00'
  },
  {
    icon: MapPin,
    title: 'ที่อยู่',
    content: 'กรุงเทพมหานคร',
    description: 'สำนักงานใหญ่'
  },
  {
    icon: Clock,
    title: 'เวลาทำการ',
    content: 'จันทร์ - ศุกร์',
    description: '9:00 - 18:00 น.'
  }
]

export const ContactInfo = () => {
  return (
    <motion.div 
      className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
      variants={cardVariants}
    >
      {contactItems.map((item, index) => (
        <motion.div
          key={index}
          className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg text-center group cursor-pointer"
          variants={itemVariants}
          whileHover={{ 
            scale: 1.05, 
            y: -5,
            transition: { duration: 0.2 }
          }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <item.icon className="mx-auto mb-4 text-purple-600" size={32} />
          </motion.div>
          <h3 className="font-semibold text-gray-800 mb-2">{item.title}</h3>
          <p className="text-purple-600 font-medium mb-1">{item.content}</p>
          <p className="text-gray-500 text-sm">{item.description}</p>
        </motion.div>
      ))}
    </motion.div>
  )
}
