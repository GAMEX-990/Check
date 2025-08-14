    import React from 'react'

    import { useTourGuide } from "@/hook/useTourGuide";
    import { TourStep } from "./types";
    import TourGuide from './TourGuide';
    import { motion } from 'framer-motion';
    import { HelpCircle } from 'lucide-react';


    const ButtonGuidViewClass = () => {
        const tourSteps: TourStep[] = [
            {
                target: '.qr-code-button',
                title: 'สร้าง QR Code',
                content: 'สร้าง QR Code สำหรับให้นักเรียนสแกนเข้าคลาส',
                position: 'center'
            },
            {
                target: '.upload-file-button',
                title: 'อัปโหลดไฟล์นักเรียน',
                content: 'อัปโหลดไฟล์ Excel หรือ CSV ที่มีรายชื่อนักเรียน',
                position: 'center'
            },
            {
                target: '.download-data-button',
                title: 'ดาวน์โหลดข้อมูล',
                content: 'ดาวน์โหลดข้อมูลการเข้าเรียนไฟล์ Excel',
                position: 'center'
            },
            {
                target: '.delete-class-button',
                title: 'ลบคลาส',
                content: 'ลบคลาสนี้',
                position: 'center'
            }
        ];
        const {
            isActive: isTourActive,
            currentStep,
            startTour,
            stopTour,
            nextStep,
            prevStep
        } = useTourGuide(tourSteps);
          
        return (
            <div>
                <div>
                    <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 1 }}>
                        <button
                            onClick={startTour}
                        >
                            <HelpCircle />
                        </button>
                    </motion.div>
                </div>
                <TourGuide
                    steps={tourSteps}
                    isActive={isTourActive}
                    currentStep={currentStep}
                    onNext={nextStep}
                    onPrev={prevStep}
                    onClose={stopTour}
                />
            </div>
        )
    }

    export default ButtonGuidViewClass