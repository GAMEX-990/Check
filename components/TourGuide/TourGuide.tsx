// src/components/TourGuide/TourGuide.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { TourGuideProps, Position } from './types';

const TourGuide: React.FC<TourGuideProps> = ({
  steps,
  isActive,
  currentStep,
  onNext,
  onPrev,
  onClose,
}) => {
  const [tooltipPosition, setTooltipPosition] = useState<Position>({ top: 0, left: 0 });

  // ฟังก์ชันคำนวณตำแหน่ง tooltip
  const calculateTooltipPosition = (targetId: string, position: string = 'bottom'): Position => {
    const element = document.querySelector(targetId);
    if (!element) return { top: 0, left: 0 };

    const rect = element.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const padding = 16;

    let calculatedPosition: Position = { top: 0, left: 0 };

    switch (position) {
      case 'top':
        calculatedPosition = {
          top: rect.top - tooltipHeight - padding,
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
        };
        break;
      case 'bottom':
        calculatedPosition = {
          top: rect.bottom + padding,
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
        };
        break;
      case 'left':
        calculatedPosition = {
          top: rect.top + rect.height / 2 - tooltipHeight / 2,
          left: rect.left - tooltipWidth - padding,
        };
        break;
      case 'right':
        calculatedPosition = {
          top: rect.top + rect.height / 2 - tooltipHeight / 2,
          left: rect.right + padding,
        };
        break;
      default:
        calculatedPosition = {
          top: rect.bottom + padding,
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
        };
    }

    // ตรวจสอบไม่ให้ tooltip หลุดขอบจอ
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    if (calculatedPosition.left < 0) {
      calculatedPosition.left = padding;
    } else if (calculatedPosition.left + tooltipWidth > windowWidth) {
      calculatedPosition.left = windowWidth - tooltipWidth - padding;
    }

    if (calculatedPosition.top < 0) {
      calculatedPosition.top = padding;
    } else if (calculatedPosition.top + tooltipHeight > windowHeight) {
      calculatedPosition.top = windowHeight - tooltipHeight - padding;
    }

    return calculatedPosition;
  };

  // ฟังก์ชันไฮไลท์ element
  const highlightElement = (targetId: string) => {
    // ลบ highlight เดิม
    document.querySelectorAll('.tour-highlight').forEach(el => {
      el.classList.remove('tour-highlight');
    });

    // เพิ่ม highlight ใหม่
    const element = document.querySelector(targetId);
    if (element) {
      element.classList.add('tour-highlight');
      
      // scroll ไป element ถ้าจำเป็น
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    }
  };

  // Effect สำหรับอัพเดต highlight และ tooltip position
  useEffect(() => {
    if (isActive && steps[currentStep]) {
      const currentStepData = steps[currentStep];
      highlightElement(currentStepData.target);
      
      // รอ element render เสร็จก่อนคำนวณตำแหน่ง
      setTimeout(() => {
        const position = calculateTooltipPosition(
          currentStepData.target,
          currentStepData.position
        );
        setTooltipPosition(position);
      }, 100);
    } else {
      // ลบ highlight ทั้งหมดเมื่อปิด tour
      document.querySelectorAll('.tour-highlight').forEach(el => {
        el.classList.remove('tour-highlight');
      });
    }
  }, [isActive, currentStep, steps]);

  // Handle keyboard events
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onPrev();
          break;
        case 'ArrowRight':
        case ' ':
        case 'Enter':
          event.preventDefault();
          onNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onNext, onPrev, onClose]);

  if (!isActive || !steps[currentStep]) return null;

  const currentStepData = steps[currentStep];

  return (
    <>
      {/* Global Styles */}
      <style jsx global>{`
        .tour-highlight {
          position: relative !important;
          z-index: 1001 !important;
          box-shadow: 0 0 0 4px #3b82f6, 0 0 0 8px rgba(59, 130, 246, 0.3) !important;
          border-radius: 8px !important;
          transition: all 0.3s ease !important;
        }
        
        .tour-overlay {
          backdrop-filter: blur(2px);
        }
      `}</style>

      {/* Dark Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 tour-overlay z-[1000] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Tooltip */}
      <div
        className="fixed z-[1002] bg-white rounded-xl shadow-2xl border border-gray-200 p-6 max-w-sm w-full mx-4 transition-all duration-300 transform"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 pr-4">
            {currentStepData.title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="ปิด Tour"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <p className="text-gray-600 leading-relaxed mb-6">
          {currentStepData.content}
        </p>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>ขั้นตอน {currentStep + 1} จาก {steps.length}</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center">
          <button
            onClick={onPrev}
            disabled={currentStep === 0}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-gray-50"
          >
            ← ก่อนหน้า
          </button>

          <div className="flex space-x-1">
            {steps.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep 
                    ? 'bg-blue-500' 
                    : index < currentStep 
                    ? 'bg-blue-300' 
                    : 'bg-gray-300'
                }`}
                onClick={() => {
                  // อนุญาตให้กดไปขั้นตอนก่อนหน้าที่ผ่านมาแล้ว
                  if (index <= currentStep) {
                    // ใช้ logic เดียวกับ prev/next
                    const diff = index - currentStep;
                    if (diff < 0) {
                      for (let i = 0; i < Math.abs(diff); i++) {
                        onPrev();
                      }
                    }
                  }
                }}
                aria-label={`ไปขั้นตอนที่ ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={onNext}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors shadow-sm"
          >
            {currentStep === steps.length - 1 ? '✓ เสร็จสิ้น' : 'ถัดไป →'}
          </button>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            ใช้ ← → หรือ Space/Enter เพื่อนำทาง | Esc เพื่อปิด
          </p>
        </div>
      </div>
    </>
  );
};

export default TourGuide;