// 'use client'
// import React, { useState } from 'react'
// import { motion } from 'framer-motion'
// import { ChevronLeft, Mail, Phone, MapPin, Clock, Send, MessageCircle } from 'lucide-react'
// import { useRouter } from 'next/navigation'

// const ContactPage = () => {
//   const router = useRouter()
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     subject: '',
//     message: ''
//   })

//   const containerVariants = {
//     hidden: { opacity: 0 },
//     visible: {
//       opacity: 1,
//       transition: {
//         staggerChildren: 0.2,
//         delayChildren: 0.1
//       }
//     }
//   }

//   const itemVariants = {
//     hidden: { opacity: 0, y: 30 },
//     visible: {
//       opacity: 1,
//       y: 0,
//       transition: {
//         duration: 0.6,
//         ease: [0.25, 0.46, 0.45, 0.94]
//       }
//     }
//   }

//   const cardVariants = {
//     hidden: { opacity: 0, scale: 0.9 },
//     visible: {
//       opacity: 1,
//       scale: 1,
//       transition: {
//         duration: 0.5,
//         ease: [0.25, 0.46, 0.45, 0.94]
//       }
//     },
//     hover: {
//       scale: 1.02,
//       y: -3,
//       transition: {
//         duration: 0.3,
//         ease: [0.25, 0.46, 0.45, 0.94]
//       }
//     }
//   }

//   const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }))
//   }

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()
//     // Handle form submission here
//     console.log('Form submitted:', formData)
//     alert('ข้อความของคุณถูกส่งเรียบร้อยแล้ว!')
//     setFormData({ name: '', email: '', subject: '', message: '' })
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 relative overflow-hidden">
//       {/* Background decorations */}
//       <div className="absolute inset-0 overflow-hidden">
//         <motion.div 
//           className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
//           animate={{
//             scale: [1, 1.2, 1],
//             rotate: [0, 180, 360],
//           }}
//           transition={{
//             duration: 20,
//             repeat: Infinity,
//             ease: "linear"
//           }}
//         />
//         <motion.div 
//           className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-70"
//           animate={{
//             scale: [1.2, 1, 1.2],
//             rotate: [360, 180, 0],
//           }}
//           transition={{
//             duration: 25,
//             repeat: Infinity,
//             ease: "linear"
//           }}
//         />
//         <motion.div 
//           className="absolute top-1/3 right-1/4 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-50"
//           animate={{
//             scale: [1, 1.1, 1],
//             opacity: [0.3, 0.7, 0.3],
//           }}
//           transition={{
//             duration: 15,
//             repeat: Infinity,
//             ease: "easeInOut"
//           }}
//         />
//       </div>

//       <motion.div 
//         className="relative z-10 container mx-auto px-4 py-8"
//         variants={containerVariants}
//         initial="hidden"
//         animate="visible"
//       >
//         {/* Back button */}
//         <motion.button 
//           onClick={() => router.push('/')}
//           className="cursor-pointer flex items-center text-purple-600 hover:text-purple-800 transition-colors duration-200 mb-8"
//           variants={itemVariants}
//           whileHover={{ x: -5 }}
//           whileTap={{ scale: 0.95 }}
//         >
//           <ChevronLeft size={24} />
//           <span className="ml-1 text-sm font-medium">กลับหน้าหลัก</span>
//         </motion.button>

//         {/* Header */}
//         <motion.div className="text-center mb-12" variants={itemVariants}>
//           <motion.h1 
//             className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4"
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.8, delay: 0.2 }}
//           >
//             ติดต่อเรา
//           </motion.h1>
//           <motion.p 
//             className="text-lg text-gray-600 max-w-2xl mx-auto"
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ duration: 0.8, delay: 0.4 }}
//           >
//             มีคำถามหรือต้องการความช่วยเหลือ? เราพร้อมให้บริการและตอบทุกข้อสงสัยของคุณ
//           </motion.p>
//         </motion.div>

//         <div className="max-w-6xl mx-auto">
//           <div className="grid lg:grid-cols-2 gap-8">
//             {/* Contact Information */}
//             <motion.div 
//               className="space-y-6"
//               variants={itemVariants}
//             >
//               <motion.div 
//                 className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8"
//                 variants={cardVariants}
//                 whileHover="hover"
//               >
//                 <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
//                   <motion.div
//                     whileHover={{ rotate: 360 }}
//                     transition={{ duration: 0.5 }}
//                   >
//                     <MessageCircle className="mr-3 text-purple-600" size={28} />
//                   </motion.div>
//                   ช่องทางการติดต่อ
//                 </h2>
                
//                 <div className="space-y-6">
//                   <motion.div 
//                     className="flex items-start space-x-4"
//                     whileHover={{ x: 5 }}
//                     transition={{ duration: 0.2 }}
//                   >
//                     <motion.div 
//                       className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0"
//                       whileHover={{ rotate: 360, scale: 1.1 }}
//                       transition={{ duration: 0.3 }}
//                     >
//                       <Mail className="text-white" size={20} />
//                     </motion.div>
//                     <div>
//                       <h3 className="font-semibold text-gray-800 mb-1">อีเมล</h3>
//                       <p className="text-gray-600">support@check.edu</p>
//                       <p className="text-gray-600">info@check.edu</p>
//                     </div>
//                   </motion.div>

//                   <motion.div 
//                     className="flex items-start space-x-4"
//                     whileHover={{ x: 5 }}
//                     transition={{ duration: 0.2 }}
//                   >
//                     <motion.div 
//                       className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0"
//                       whileHover={{ rotate: 360, scale: 1.1 }}
//                       transition={{ duration: 0.3 }}
//                     >
//                       <Phone className="text-white" size={20} />
//                     </motion.div>
//                     <div>
//                       <h3 className="font-semibold text-gray-800 mb-1">โทรศัพท์</h3>
//                       <p className="text-gray-600">02-123-4567</p>
//                       <p className="text-gray-600">089-123-4567</p>
//                     </div>
//                   </motion.div>

//                   <motion.div 
//                     className="flex items-start space-x-4"
//                     whileHover={{ x: 5 }}
//                     transition={{ duration: 0.2 }}
//                   >
//                     <motion.div 
//                       className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0"
//                       whileHover={{ rotate: 360, scale: 1.1 }}
//                       transition={{ duration: 0.3 }}
//                     >
//                       <MapPin className="text-white" size={20} />
//                     </motion.div>
//                     <div>
//                       <h3 className="font-semibold text-gray-800 mb-1">ที่อยู่</h3>
//                       <p className="text-gray-600">123 ถนนเทคโนโลยี</p>
//                       <p className="text-gray-600">แขวงคลองเตย เขตคลองเตย</p>
//                       <p className="text-gray-600">กรุงเทพมหานคร 10110</p>
//                     </div>
//                   </motion.div>

//                   <motion.div 
//                     className="flex items-start space-x-4"
//                     whileHover={{ x: 5 }}
//                     transition={{ duration: 0.2 }}
//                   >
//                     <motion.div 
//                       className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0"
//                       whileHover={{ rotate: 360, scale: 1.1 }}
//                       transition={{ duration: 0.3 }}
//                     >
//                       <Clock className="text-white" size={20} />
//                     </motion.div>
//                     <div>
//                       <h3 className="font-semibold text-gray-800 mb-1">เวลาทำการ</h3>
//                       <p className="text-gray-600">จันทร์ - ศุกร์: 8:00 - 18:00</p>
//                       <p className="text-gray-600">เสาร์ - อาทิตย์: 9:00 - 17:00</p>
//                     </div>
//                   </motion.div>
//                 </div>
//               </motion.div>
//             </motion.div>

//             {/* Contact Form */}
//             <motion.div 
//               className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8"
//               variants={cardVariants}
//               whileHover="hover"
//             >
//               <h2 className="text-2xl font-bold text-gray-800 mb-6">ส่งข้อความถึงเรา</h2>
//               <motion.form 
//                 onSubmit={handleSubmit} 
//                 className="space-y-6"
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 transition={{ duration: 0.6, delay: 0.3 }}
//               >
//                 <motion.div
//                   initial={{ opacity: 0, x: -20 }}
//                   animate={{ opacity: 1, x: 0 }}
//                   transition={{ duration: 0.5, delay: 0.4 }}
//                 >
//                   <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
//                     ชื่อ-นามสกุล *
//                   </label>
//                   <motion.input
//                     type="text"
//                     id="name"
//                     name="name"
//                     value={formData.name}
//                     onChange={handleInputChange}
//                     required
//                     className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
//                     placeholder="กรุณากรอกชื่อ-นามสกุล"
//                     whileFocus={{ scale: 1.02 }}
//                   />
//                 </motion.div>

//                 <motion.div
//                   initial={{ opacity: 0, x: -20 }}
//                   animate={{ opacity: 1, x: 0 }}
//                   transition={{ duration: 0.5, delay: 0.5 }}
//                 >
//                   <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
//                     อีเมล *
//                   </label>
//                   <motion.input
//                     type="email"
//                     id="email"
//                     name="email"
//                     value={formData.email}
//                     onChange={handleInputChange}
//                     required
//                     className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
//                     placeholder="กรุณากรอกอีเมล"
//                     whileFocus={{ scale: 1.02 }}
//                   />
//                 </motion.div>

//                 <motion.div
//                   initial={{ opacity: 0, x: -20 }}
//                   animate={{ opacity: 1, x: 0 }}
//                   transition={{ duration: 0.5, delay: 0.6 }}
//                 >
//                   <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
//                     หัวข้อ *
//                   </label>
//                   <motion.input
//                     type="text"
//                     id="subject"
//                     name="subject"
//                     value={formData.subject}
//                     onChange={handleInputChange}
//                     required
//                     className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
//                     placeholder="หัวข้อที่ต้องการสอบถาม"
//                     whileFocus={{ scale: 1.02 }}
//                   />
//                 </motion.div>

//                 <motion.div
//                   initial={{ opacity: 0, x: -20 }}
//                   animate={{ opacity: 1, x: 0 }}
//                   transition={{ duration: 0.5, delay: 0.7 }}
//                 >
//                   <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
//                     ข้อความ *
//                   </label>
//                   <motion.textarea
//                     id="message"
//                     name="message"
//                     value={formData.message}
//                     onChange={handleInputChange}
//                     required
//                     rows={5}
//                     className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
//                     placeholder="รายละเอียดข้อความที่ต้องการสอบถาม..."
//                     whileFocus={{ scale: 1.02 }}
//                   />
//                 </motion.div>

//                 <motion.button
//                   type="submit"
//                   className="cursor-pointer w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200 flex items-center justify-center"
//                   whileHover={{ 
//                     scale: 1.02,
//                     y: -2,
//                     boxShadow: "0 20px 40px rgba(139, 92, 246, 0.3)"
//                   }}
//                   whileTap={{ scale: 0.98 }}
//                   initial={{ opacity: 0, y: 20 }}
//                   animate={{ opacity: 1, y: 0 }}
//                   transition={{ duration: 0.5, delay: 0.8 }}
//                 >
//                   <Send className="mr-2" size={20} />
//                   ส่งข้อความ
//                 </motion.button>
//               </motion.form>
//             </motion.div>
//           </div>

//           {/* FAQ Section */}
//           <motion.div 
//             className="mt-12 bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl p-8"
//             variants={cardVariants}
//             whileHover="hover"
//           >
//             <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">คำถามที่พบบ่อย</h2>
//             <motion.div 
//               className="grid md:grid-cols-2 gap-6"
//               variants={containerVariants}
//             >
//               <motion.div 
//                 className="space-y-4"
//                 variants={itemVariants}
//               >
//                 <motion.div
//                   whileHover={{ x: 5 }}
//                   transition={{ duration: 0.2 }}
//                 >
//                   <h3 className="font-semibold text-gray-800 mb-2">ระบบ Check คืออะไร?</h3>
//                   <p className="text-gray-600 text-sm">
//                     ระบบจัดการการเรียนรู้ที่ช่วยให้ครูและนักเรียนสามารถติดตามผลการเรียน จัดการงาน และเข้าถึงทรัพยากรการศึกษาได้อย่างมีประสิทธิภาพ
//                   </p>
//                 </motion.div>
//                 <motion.div
//                   whileHover={{ x: 5 }}
//                   transition={{ duration: 0.2 }}
//                 >
//                   <h3 className="font-semibold text-gray-800 mb-2">ใช้งานฟรีหรือไม่?</h3>
//                   <p className="text-gray-600 text-sm">
//                     เรามีแพ็คเกจพื้นฐานที่ใช้งานฟรี และแพ็คเกจพรีเมียมสำหรับสถาบันการศึกษาที่ต้องการฟีเจอร์เพิ่มเติม
//                   </p>
//                 </motion.div>
//               </motion.div>
//               <motion.div 
//                 className="space-y-4"
//                 variants={itemVariants}
//               >
//                 <motion.div
//                   whileHover={{ x: 5 }}
//                   transition={{ duration: 0.2 }}
//                 >
//                   <h3 className="font-semibold text-gray-800 mb-2">สามารถใช้งานบนมือถือได้หรือไม่?</h3>
//                   <p className="text-gray-600 text-sm">
//                     ได้ครับ ระบบของเราออกแบบให้ใช้งานได้ทั้งบนคอมพิวเตอร์และมือถือ รองรับทุกอุปกรณ์
//                   </p>
//                 </motion.div>
//                 <motion.div
//                   whileHover={{ x: 5 }}
//                   transition={{ duration: 0.2 }}
//                 >
//                   <h3 className="font-semibold text-gray-800 mb-2">มีการสนับสนุนลูกค้าหรือไม่?</h3>
//                   <p className="text-gray-600 text-sm">
//                     มีครับ ทีมสนับสนุนของเราพร้อมให้ความช่วยเหลือตลอด 24 ชั่วโมง ผ่านช่องทางต่างๆ
//                   </p>
//                 </motion.div>
//               </motion.div>
//             </motion.div>
//           </motion.div>
//         </div>
//       </motion.div>
//     </div>
//   )
// }

// export default ContactPage