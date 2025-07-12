// hooks/useAttendanceSummary.ts
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createAttendanceSummary } from '@/utils/Summary';
import type { ClassData } from '@/types/classTypes';
import type { UserAttendance, UserData } from '@/types/SummaryTypes';

export function useAttendanceSummary(selectedClass: ClassData | null, active: boolean) {
  const [attendanceSummary, setAttendanceSummary] = useState<UserAttendance[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!active || !selectedClass?.id) {
      setAttendanceSummary([]);
      return;
    }

    const fetchAttendanceSummary = async () => {
      setLoadingSummary(true);
      setError(null);

      try {
        const classRef = doc(db, 'classes', selectedClass.id);
        const snapshot = await getDoc(classRef);

        if (snapshot.exists()) {
          const data = snapshot.data();
          const dailyCheckedInRecord = data.dailyCheckedInRecord || {};

          if (typeof dailyCheckedInRecord === 'object') {
            const allUsers: UserData[] = Object.values(dailyCheckedInRecord)
              .flatMap((dateRecords: any) => Object.values(dateRecords))
              .map((record: any) => ({
                uid: record.uid,
                name: record.name,
                studentId: record.studentId,
              }));

            const summary = createAttendanceSummary(allUsers);
            setAttendanceSummary(summary);
          } else {
            setAttendanceSummary([]);
          }
        } else {
          setAttendanceSummary([]);
        }
      } catch (e: any) {
        setError(e);
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchAttendanceSummary();
  }, [selectedClass, active]);

  return { attendanceSummary, loadingSummary, error };
}
