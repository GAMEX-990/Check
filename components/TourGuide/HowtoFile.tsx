"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

interface ImageLightboxProps {
    images: string[]
    triggerText?: string // ข้อความปุ่มเปิด
}

export default function ImageLightbox({ images, triggerText = "ดูภาพ" }: ImageLightboxProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)

    const prevImage = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
    }

    const nextImage = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
    }

    return (
        <div>
            {/* ปุ่มเปิด Lightbox */}
            <div>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 1 }}>
                    <button
                        onClick={() => setIsOpen(true)}
                        className="border border-purple-600 shadow-lg px-1 rounded-2xl"
                    >
                        {triggerText}
                    </button>
                </motion.div>
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 bg-[rgba(0,0,0,0.5)] flex items-center justify-center z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="relative w-full max-w-3xl h-[80vh] flex items-center justify-center">
                            {/* ปุ่มปิด */}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-10 -right-5 text-white z-50"
                            >
                                <X size={30} />
                            </button>

                            {/* ปุ่มซ้าย */}
                            <button
                                onClick={prevImage}
                                className="absolute -left-10 text-white z-50"
                            >
                                <ChevronLeft size={40} />
                            </button>

                            {/* ปุ่มขวา */}
                            <button
                                onClick={nextImage}
                                className="absolute -right-10 text-white z-50"
                            >
                                <ChevronRight size={40} />
                            </button>

                            {/* ภาพ */}
                            <motion.div
                                key={currentIndex}
                                className="relative w-full h-full flex items-center justify-center"
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Image
                                    src={images[currentIndex]}
                                    alt={`image ${currentIndex}`}
                                    fill
                                    style={{ objectFit: "contain" }}
                                />
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
