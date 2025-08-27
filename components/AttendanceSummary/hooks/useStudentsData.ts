import { useEffect, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Student } from '../types';

// ===== CUSTOM HOOK: STUDENTS DATA =====
export const useStudentsData = (classId: string) => {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;

    const studentsRef = collection(doc(db, "classes", classId), "students");
    const unsubscribe = onSnapshot(
      studentsRef,
      (snapshot) => {
        const students: Student[] = snapshot.docs.map((doc) => ({
          ...(doc.data() as Student),
          id: doc.id,
        }));
        setAllStudents(students);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error listening to students:", error);
        setAllStudents([]);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [classId]);

  return { allStudents, isLoading };
};