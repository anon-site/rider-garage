import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB9LgXRw_YCKtOtJ8xvm6EAWvf5z2b0xHA",
  authDomain: "rider-garage.firebaseapp.com",
  databaseURL: "https://rider-garage-default-rtdb.firebaseio.com",
  projectId: "rider-garage",
  storageBucket: "rider-garage.firebasestorage.app",
  messagingSenderId: "1301708487",
  appId: "1:1301708487:web:f642546c923851f53a88e2",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getDatabase(app);
