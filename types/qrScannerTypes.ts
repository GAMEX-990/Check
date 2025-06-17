import { User } from "firebase/auth";

export interface QRResult {
  data: string;
}

export interface HandleQRDetectedParams {
  result: QRResult;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  user: User | null;
  setScanning: (scanning: boolean) => void;
  setLoading: (loading: boolean) => void;
  hasScanned: boolean;
  updateScanStatus: (status: boolean) => Promise<void>;
  onScanSuccess?: () => void;
  stopCamera: (stream: MediaStream) => void;
}

export interface StudentData {
  studentId: string;
  name: string;
  status?: string;
}

export interface ClassData {
  checkedInMembers?: string[];
  checkedInRecord?: Record<string, {
    uid: string;
    studentId: string;
    timestamp: number; // Timestamp type from firestore
    name: string;
    email: string;
    status: string;
  }>;
  checkedInCount?: number;
  lastCheckedIn?: number; // Timestamp
}
