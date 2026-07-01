import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getFirebaseConfigState } from "@/lib/firebase-config";

const firebaseState = getFirebaseConfigState();

export const isFirebaseClientConfigured = firebaseState.isConfigured;
export const firebaseClientConfigError = firebaseState.errorMessage;

export const app: FirebaseApp =
  getApps().length === 0 ? initializeApp(firebaseState.config) : getApps()[0];

export const auth = getAuth(app);
export const db = getDatabase(app);
