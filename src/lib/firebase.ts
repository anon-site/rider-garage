import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirebaseConfig } from "@/lib/firebase-config";

export const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(getFirebaseConfig()) : getApps()[0];

export const auth = getAuth(app);
export const db = getDatabase(app);
