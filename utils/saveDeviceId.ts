import { getFingerprint } from "./getFingerprint";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const saveDeviceId = async (uid: string) => {
  const fingerprint = await getFingerprint();
  const ref = doc(db, "devices", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      fingerprint,
      createdAt: new Date(),
    });
  }
};
