import { useEffect } from "react";
import { openCamera, scanQRCode, stopCamera } from "./camera";

// ในไฟล์ useCameraScanner.ts
interface UseCameraScannerProps {
    scanning: boolean;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    onQRDetected: (result: { data: string }) => Promise<void>;
    onError: (error: Error | string) => void;
  }
  
  export const useCameraScanner = ({
    scanning,
    videoRef,
    canvasRef,
    onQRDetected,
    onError,
  }: UseCameraScannerProps) => {
    useEffect(() => {
      let currentStream: MediaStream | null = null;
  
      // เพิ่มการตรวจสอบ null ที่นี่
      if (scanning && videoRef.current && canvasRef.current) {
        openCamera(videoRef.current)
          .then((stream) => {
            currentStream = stream;
            
            // ตรวจสอบอีกครั้งก่อนใช้งาน
            if (videoRef.current && canvasRef.current) {
              const scanner = scanQRCode(
                videoRef.current,
                canvasRef.current,
                onQRDetected,
                onError
              );
  
              return () => {
                scanner?.stop();
              };
            }
          })
          .catch((error) => {
            console.error("ไม่สามารถเปิดกล้องได้:", error);
            onError("ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบการอนุญาตการใช้งานกล้อง");
          });
      }
  
      return () => {
        if (currentStream) {
          stopCamera(currentStream);
          currentStream = null;
        }
      };
    }, [scanning, videoRef, canvasRef, onQRDetected, onError]);
  };