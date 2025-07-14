// hooks/useAuthRedirect.ts
'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const useAuthRedirect = (redirectType: 'auth-only' | 'guest-only' = 'guest-only') => {
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // รอให้ loading เสร็จก่อน
      if (loading) return;

      if (redirectType === 'guest-only') {
        // สำหรับหน้า Login/Register - ถ้า login แล้วให้ redirect ไป dashboard
        if (user) {
          try {
            // ตรวจสอบว่ามี profile ใน Firestore หรือไม่
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
              // มี profile แล้ว ส่งไป dashboard
              router.replace('/dashboard');
            } else {
              // ยังไม่มี profile ส่งไปหน้า register
              router.replace('/loginregister');
            }
          } catch (error) {
            // ถ้าเกิด error ให้ส่งไป dashboard anyway
            router.replace('/dashboard');
          }
        }
      } else if (redirectType === 'auth-only') {
        // สำหรับหน้าที่ต้อง login - ถ้าไม่ login ให้ redirect ไป login
        if (!user) {
          router.replace('/login');
        }
      }
    };

    checkAuthAndRedirect();
  }, [user, loading, router, redirectType]);

  return { user, loading, error };
};