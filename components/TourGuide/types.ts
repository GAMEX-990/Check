// src/components/TourGuide/types.ts

export interface TourStep {
    target: string;         // CSS selector ของ element ที่ต้องการไฮไลท์
    title: string;         // หัวข้อของขั้นตอน
    content: string;       // เนื้อหาอธิบาย
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center'; // ตำแหน่งของ tooltip
  }
  
  export interface TourGuideProps {
    steps: TourStep[];     // รายการขั้นตอนทั้งหมด
    isActive: boolean;     // เปิด/ปิด tour
    currentStep: number;   // ขั้นตอนปัจจุบัน
    onNext: () => void;    // ฟังก์ชันไปขั้นตอนถัดไป
    onPrev: () => void;    // ฟังก์ชันกลับขั้นตอนก่อนหน้า
    onClose: () => void;   // ฟังก์ชันปิด tour
  }
  
  export interface Position {
    top: number;
    left: number;
  }