import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB9LgXRw_YCKtOtJ8xvm6EAWvf5z2b0xHA",
  authDomain: "rider-garage.firebaseapp.com",
  databaseURL: "https://rider-garage-default-rtdb.firebaseio.com",
  projectId: "rider-garage",
  storageBucket: "rider-garage.firebasestorage.app",
  messagingSenderId: "1301708487",
  appId: "1:1301708487:web:f642546c923851f53a88e2",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function main() {
  try {
    const snap = await get(ref(db));
    const data = snap.val() || {};
    console.log("Root keys:", Object.keys(data));
    
    if (data.attendance) {
      console.log("=== ATTENDANCE (First 5) ===");
      Object.entries(data.attendance).slice(0, 5).forEach(([id, r]) => {
        console.log(id, JSON.stringify(r));
      });
    }
  } catch (err) {
    console.error(err);
  }
}

main().then(() => process.exit(0));
