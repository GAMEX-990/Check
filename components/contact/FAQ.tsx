'use client'
import { motion } from 'framer-motion'
import { cardVariants, containerVariants, itemVariants } from '../animations/contactAnimations'

const faqData = [
  {
    question: 'ระบบ Check คืออะไร?',
    answer: 'ระบบจัดการการเรียนรู้ที่ช่วยให้ครูและนักเรียนสามารถติดตามผลการเรียน จัดการงาน และเข้าถึงทรัพยากรการศึกษาได้อย่างมีประสิทธิภาพ'
  },
  {
    question: 'ใช้งานฟรีหรือไม่?',
    answer: 'เรามีแพ็คเกจพื้นฐานที่ใช้งานฟรี และแพ็คเกจพรีเมียมสำหรับสถาบันการศึกษาที่ต้องการฟีเจอร์เพิ่มเติม'
  },
  {
    question: 'สามารถใช้งานบนมือถือได้หรือไม่?',
    answer: 'ได้ครับ ระบบของเราออกแบบให้ใช้งานได้ทั้งบนคอมพิวเตอร์และมือถือ รองรับทุกอุปกรณ์'
  },
  {
    question: 'มีการสนับสนุนลูกค้าหรือไม่?',
    answer: 'มีครับ ทีมสนับสนุนของเราพร้อมให้ความช่วยเหลือตลอด 24 ชั่วโมง ผ่านช่องทางต่างๆ'
  }
]

export const FAQ = () => {
  return (
    <motion.div 
      className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8"
      variants={cardVariants}
      whileHover="hover"
    >
      <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">คำถามที่พบบ่อย</h2>
      <motion.div 
        className="grid md:grid-cols-2 gap-6"
        variants={containerVariants}
      >
        {faqData.map((faq, index) => (
          <motion.div 
            key={index}
            className="space-y-2"
            variants={itemVariants}
            whileHover={{ x: 5 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="font-semibold text-gray-800">{faq.question}</h3>
            <p className="text-gray-600 text-sm">{faq.answer}</p>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  )
}
