import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirebaseConfig } from "@/lib/firebase-config";

const app = getApps().length === 0 ? initializeApp(getFirebaseConfig()) : getApps()[0];
export { app };
export const db = getDatabase(app);
