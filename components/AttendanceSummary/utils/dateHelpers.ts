import { FirestoreTimestamp } from '../types';

// ===== DATE HELPER FUNCTIONS =====
export const convertTimestampToDate = (ts: FirestoreTimestamp): Date | null => {
  if (!ts) return null;
  if (typeof ts === "string") return new Date(ts);
  if (typeof (ts as { toDate: () => Date }).toDate === "function") {
    return (ts as { toDate: () => Date }).toDate();
  }
  return null;
};

export const formatDateThai = (date: string): string => {
  return new Date(date).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const formatTimeThai = (date: string): string => {
  return new Date(date).toLocaleTimeString('th-TH');
};