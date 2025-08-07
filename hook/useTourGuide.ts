// src/hooks/useTourGuide.ts

import { useState, useCallback, useEffect } from 'react';
import { TourStep } from '@/components/TourGuide/types';

export const useTourGuide = (steps: TourStep[]) => {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // ฟังก์ชันเริ่ม tour
  const startTour = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
  }, []);

  // ฟังก์ชันหยุด tour
  const stopTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    // ลบ highlight ทั้งหมด
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
    });
  }, []);

  // ฟังก์ชันไปขั้นตอนถัดไป
  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      stopTour();
    }
  }, [currentStep, steps.length, stopTour]);

  // ฟังก์ชันกลับขั้นตอนก่อนหน้า
  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // ฟังก์ชันไปขั้นตอนที่กำหนด
  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  }, [steps.length]);

  // ลบ highlight เมื่อ component ถูก unmount
  useEffect(() => {
    return () => {
      document.querySelectorAll('.tour-highlight').forEach(el => {
        el.classList.remove('tour-highlight');
      });
    };
  }, []);

  return {
    isActive,
    currentStep,
    totalSteps: steps.length,
    startTour,
    stopTour,
    nextStep,
    prevStep,
    goToStep,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1,
  };
};