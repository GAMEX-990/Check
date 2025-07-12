'use client';
import React from 'react'
import { motion } from 'framer-motion'
import { BookOpenCheck, CheckCircle, ArrowRight, Users, Calendar, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}


const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <motion.div
      className="bg-white p-6 rounded-xl shadow-md border border-purple-100 hover:shadow-lg transition-all duration-300"
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center text-purple-600 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
};

const BodyInterface = () => {

  const Router = useRouter();


  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-50 via-white to-purple-100 pt-16 pb-24 overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-purple-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-purple-300 rounded-full opacity-20 blur-3xl"></div>

        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center justify-between">
          {/* Left Content Section */}
          <motion.div
            className="flex flex-col space-y-6 max-w-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center space-x-2">
              <div className="h-1.5 w-10 bg-purple-600 rounded-full"></div>
              <span className="text-purple-600 font-medium tracking-wider text-sm">ATTENDANCE MADE SIMPLE</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-800 leading-tight">
              <span className="text-purple-700">Check-in</span> for your classes
            </h1>

            <h2 className="text-xl text-gray-600 font-light">
              Streamlined attendance tracking for students and teachers
            </h2>

            <p className="text-gray-500 text-lg">
              Our platform makes checking in to class quick and effortless,
              saving time for both students and educators.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 max-w-fit">
              <motion.button
                className="bg-purple-600 text-white text-lg font-semibold px-8 py-4 rounded-xl hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => Router.push('/register')}
              >
                <p>Start Check-in</p>
              </motion.button>

              <motion.button
                className="border-2 border-purple-600 text-purple-600 text-lg font-semibold px-8 py-4 rounded-xl hover:bg-purple-50 transition-colors duration-300 cursor-pointer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => Router.push('/about')}
              >
                <p>Learn More</p>
              </motion.button>
            </div>

            <div className="flex items-center space-x-4 pt-6">
              <div className="flex -space-x-2">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full border-2 border-white bg-purple-${500 - (i * 100)} flex items-center justify-center text-xs text-white font-bold shadow-sm`}
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <p className="text-gray-500 text-sm">Join <span className="font-semibold">1,000+</span> students using Check-in daily</p>
            </div>
          </motion.div>

          {/* Right Image/Illustration Section */}
          <motion.div
            className="mt-12 lg:mt-0 w-full lg:w-1/2 flex justify-center"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative w-full max-w-md">
              <div className="absolute -top-6 -left-6 w-24 h-24 bg-purple-200 rounded-full opacity-60 animate-pulse"></div>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-purple-300 rounded-full opacity-50"></div>

              <div className="relative z-10 bg-white rounded-2xl shadow-xl p-6 border border-purple-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-xs text-gray-400 font-medium">check-in.app</div>
                </div>

                <div className="space-y-4">
                  <div className="h-12 bg-purple-100 rounded-lg w-full flex items-center px-4">
                    <div className="w-6 h-6 rounded-full bg-purple-500 mr-3 flex items-center justify-center">
                      <CheckCircle size={14} color="white" />
                    </div>
                    <div className="text-sm text-purple-700 font-medium">Web Development</div>
                  </div>

                  <div className="h-12 bg-gray-100 rounded-lg w-full flex items-center px-4">
                    <div className="w-6 h-6 rounded-full bg-gray-300 mr-3"></div>
                    <div className="text-sm text-gray-500">Data Structures</div>
                  </div>

                  <div className="h-12 bg-gray-100 rounded-lg w-full flex items-center px-4">
                    <div className="w-6 h-6 rounded-full bg-gray-300 mr-3"></div>
                    <div className="text-sm text-gray-500">Mobile App Design</div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button className="bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors duration-300 flex items-center space-x-1">
                      <span>Check-in Now</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Why Choose <span className="text-purple-600">Check</span></h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Our platform offers a seamless attendance tracking experience for both students and educators.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={<CheckCircle size={24} />}
              title="Easy Check-in"
              description="Students can check in to class with just a single tap, making attendance tracking effortless."
            />

            <FeatureCard
              icon={<Users size={24} />}
              title="Role-Based Access"
              description="Different interfaces for students and teachers with appropriate permissions and features."
            />

            <FeatureCard
              icon={<Calendar size={24} />}
              title="Class Management"
              description="Teachers can create and manage classes while students can join the classes they're interested in."
            />

            <FeatureCard
              icon={<Shield size={24} />}
              title="Secure Authentication"
              description="Robust user authentication system ensures that only authorized users can access the platform."
            />

            <FeatureCard
              icon={<BookOpenCheck size={24} />}
              title="Attendance Reports"
              description="Generate detailed attendance reports to track student participation over time."
            />

            <FeatureCard
              icon={<ArrowRight size={24} />}
              title="Intuitive Interface"
              description="Clean and modern UI design makes navigation and usage simple for all users."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-purple-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to simplify attendance tracking?</h2>
          <p className="text-purple-200 text-lg max-w-2xl mx-auto mb-8">Join thousands of students and teachers who are already using Check to streamline their attendance process.</p>

          <Link href="/register" className="inline-block bg-white text-purple-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-purple-50 transition-colors duration-300 shadow-lg hover:shadow-xl">
            Get Started Today
          </Link>
        </div>
      </section>
    </div>
  )
}

export default BodyInterface