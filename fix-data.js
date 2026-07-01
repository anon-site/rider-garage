import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, update } from "firebase/database";

function loadConfig() {
  const read = (key) => process.env[key] ?? "";
  const config = {
    apiKey: read("NEXT_PUBLIC_FIREBASE_API_KEY"),
    authDomain: read("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    databaseURL: read("NEXT_PUBLIC_FIREBASE_DATABASE_URL"),
    projectId: read("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
    storageBucket: read("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: read("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
    appId: read("NEXT_PUBLIC_FIREBASE_APP_ID"),
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing env vars: ${missing.join(", ")}. Use --env-file=.env.local`);
  }

  return config;
}

const app = initializeApp(loadConfig());
const db = getDatabase(app);

async function main() {
  try {
    const bikesSnap = await get(ref(db, "bikes"));
    const driversSnap = await get(ref(db, "drivers"));
    const bikes = bikesSnap.val() || {};
    const drivers = driversSnap.val() || {};

    console.log("Starting DB fix...");

    const updates = {};

    Object.keys(bikes).forEach((bikeId) => {
      updates[`bikes/${bikeId}/driverId`] = null;
    });

    Object.keys(drivers).forEach((driverId) => {
      updates[`drivers/${driverId}/bikeId`] = null;
    });

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
    process.exit(1);
  }
}

main().then(() => process.exit(0));
