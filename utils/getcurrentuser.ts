import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type UserData = {
  name: string;
  studentId: string;
  photoURL: string;
  email?: string;
};

export const getUserData = async (uid: string): Promise<UserData | null> => {

  if (!uid) return null;

  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        name: data.name,
        studentId: data.studentId,
        photoURL: data.photoURL,
        email: data.email,
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error("🔥 getUserData error:", error);
    return null;
  }
};
