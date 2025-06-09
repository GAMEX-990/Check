import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

export const SyncUserToFirebase = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);

            if (currentUser) {
                const userData = {
                    id: currentUser.uid,
                    name: currentUser.displayName,
                    email: currentUser.email,
                    photoURL: currentUser.photoURL,
                    createdAt: new Date(),
                    updatedAt: new Date(),

                }

                const docRef = doc(db, "users", currentUser.uid);
                setDoc(docRef, userData, { merge: true });
            }
        });

        return () => unsubscribe();

    }, []);

    return null;
};