import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set } from "firebase/database";
import { writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const RTDB_ROOT_NODES = [
  "attendance",
  "drivers",
  "bikes",
  "garages",
  "users",
  "deliveryCategories",
];

function loadConfig(prefix) {
  const read = (suffix) => process.env[`FIREBASE_${prefix}_${suffix}`] ?? "";
  const config = {
    apiKey: read("API_KEY"),
    authDomain: read("AUTH_DOMAIN"),
    databaseURL: read("DATABASE_URL"),
    projectId: read("PROJECT_ID"),
    storageBucket: read("STORAGE_BUCKET"),
    messagingSenderId: read("MESSAGING_SENDER_ID"),
    appId: read("APP_ID"),
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`FIREBASE_${prefix}_* is missing: ${missing.join(", ")}`);
  }

  return config;
}

function connect(config) {
  const app = initializeApp(config, config.projectId);
  return getDatabase(app);
}

async function exportDatabase(db) {
  const data = {};

  for (const node of RTDB_ROOT_NODES) {
    const snapshot = await get(ref(db, node));
    if (snapshot.exists()) {
      data[node] = snapshot.val();
      console.log(`  ✓ ${node}`);
    } else {
      console.log(`  - ${node} (empty)`);
    }
  }

  return data;
}

async function importDatabase(db, data) {
  for (const node of RTDB_ROOT_NODES) {
    if (!data[node]) {
      console.log(`  - ${node} (skipped)`);
      continue;
    }

    await set(ref(db, node), data[node]);
    const count = Object.keys(data[node]).length;
    console.log(`  ✓ ${node} (${count} records)`);
  }
}

async function main() {
  const command = process.argv[2] ?? "migrate";
  const outputPath = resolve(process.argv[3] ?? "firebase-export.json");

  if (command === "export") {
    console.log("Exporting from SOURCE project...");
    const db = connect(loadConfig("SOURCE"));
    const data = await exportDatabase(db);
    writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf8");
    console.log(`\nSaved to ${outputPath}`);
    return;
  }

  if (command === "import") {
    console.log(`Importing into DEST project from ${outputPath}...`);
    const raw = readFileSync(outputPath, "utf8");
    const data = JSON.parse(raw);
    const db = connect(loadConfig("DEST"));
    await importDatabase(db, data);
    console.log("\nImport complete.");
    return;
  }

  if (command === "migrate") {
    console.log("Step 1/2 — Export from SOURCE...");
    const sourceDb = connect(loadConfig("SOURCE"));
    const data = await exportDatabase(sourceDb);

    console.log("\nStep 2/2 — Import into DEST...");
    const destDb = connect(loadConfig("DEST"));
    await importDatabase(destDb, data);

    writeFileSync(outputPath, JSON.stringify(data, null, 2), "utf8");
    console.log(`\nMigration complete. Backup saved to ${outputPath}`);
    return;
  }

  console.error("Usage:");
  console.error("  node scripts/firebase-migrate.mjs export [output.json]");
  console.error("  node scripts/firebase-migrate.mjs import [input.json]");
  console.error("  node scripts/firebase-migrate.mjs migrate [backup.json]");
  process.exit(1);
}

main().catch((error) => {
  console.error("Migration failed:", error.message ?? error);
  process.exit(1);
});
