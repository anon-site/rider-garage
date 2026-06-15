import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, update } from "firebase/database";

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
    const bikesSnap = await get(ref(db, "bikes"));
    const driversSnap = await get(ref(db, "drivers"));
    const bikes = bikesSnap.val() || {};
    const drivers = driversSnap.val() || {};

    console.log("Starting DB fix...");

    // We want to map sequentially:
    // DRV-001 to DRV-215 mapped to BK-001 to BK-215
    // DRV-216 to DRV-219 mapped to null (No Bike)
    // BK-216 to BK-234 mapped to null (No Driver)
    
    const updates = {};

    // 1. Reset all bikes first
    Object.keys(bikes).forEach((bikeId) => {
      updates[`bikes/${bikeId}/driverId`] = null;
    });

    // 2. Reset all drivers first
    Object.keys(drivers).forEach((driverId) => {
      updates[`drivers/${driverId}/bikeId`] = null;
    });

    // 3. Apply sequential mapping for 1 to 215
    for (let i = 1; i <= 215; i++) {
      const bikeId = `BK-${String(i).padStart(3, "0")}`;
      const driverId = `DRV-${String(i).padStart(3, "0")}`;

      if (bikes[bikeId]) {
        updates[`bikes/${bikeId}/driverId`] = driverId;
      }
      if (drivers[driverId]) {
        updates[`drivers/${driverId}/bikeId`] = bikeId;
      }
    }

    console.log(`Prepared ${Object.keys(updates).length} updates.`);
    await update(ref(db), updates);
    console.log("DB update successful!");

  } catch (err) {
    console.error("Error updating DB:", err);
  }
}

main().then(() => process.exit(0));
