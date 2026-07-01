/**
 * Migrate legacy user passwords into server-only nodes and create Firebase Auth users.
 *
 * Usage:
 *   node --env-file=.env.local scripts/migrate-firebase-auth.mjs
 *
 * Optional bootstrap admin (when database is empty):
 *   node --env-file=.env.local scripts/migrate-firebase-auth.mjs --bootstrap
 */

import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";
import { createHash, randomBytes } from "node:crypto";

function loadServiceAccount() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) return JSON.parse(json);

  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };
}

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = createHash("sha256").update(password + salt).digest("hex");
  return `${salt}:${hash}`;
}

const databaseURL =
  process.env.FIREBASE_DATABASE_URL ?? process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

const app = initializeApp({
  credential: cert(loadServiceAccount()),
  databaseURL,
});

const db = getDatabase(app);
const auth = getAuth(app);

const bootstrap = process.argv.includes("--bootstrap");

const SEED_ADMIN = {
  id: "USR-001",
  name: "Ahmed Hassan",
  username: "ahmed",
  password: "admin123",
  email: "ahmed@ridergarage.com",
  phone: "+964 770 123 4567",
  role: "admin",
};

async function ensureAuthUser(userId, profile, claims) {
  try {
    await auth.getUser(userId);
  } catch {
    await auth.createUser({ uid: userId, displayName: profile.name });
  }
  await auth.setCustomUserClaims(userId, claims);
}

async function migrateUser(userId, data) {
  const username = data.username;
  if (!username) {
    console.warn(`Skipping ${userId}: missing username`);
    return;
  }

  const usernameLower = username.trim().toLowerCase();
  const { password, ...profile } = data;
  const safeProfile = {
    ...profile,
    usernameLower,
  };

  await db.ref(`users/${userId}`).update(safeProfile);

  if (password) {
    const stored = String(password).includes(":") ? String(password) : hashPassword(String(password));
    await db.ref(`userCredentials/${userId}`).set({ password: stored, usernameLower });
    await db.ref(`usernameIndex/${usernameLower}`).set(userId);
    await db.ref(`users/${userId}/password`).remove();
    console.log(`Migrated credentials for ${username} (${userId})`);
  }

  const claims = {
    role: safeProfile.role,
    userId,
    ...(safeProfile.garageId ? { garageId: safeProfile.garageId } : {}),
  };
  await ensureAuthUser(userId, safeProfile, claims);
}

async function backfillAttendanceGarageIds() {
  const [attendanceSnap, driversSnap] = await Promise.all([
    db.ref("attendance").get(),
    db.ref("drivers").get(),
  ]);

  if (!attendanceSnap.exists() || !driversSnap.exists()) {
    return;
  }

  const attendance = attendanceSnap.val();
  const drivers = driversSnap.val();
  let updated = 0;

  for (const [recordId, record] of Object.entries(attendance)) {
    if (record.garageId) continue;
    const garageId = drivers[record.driverId]?.garageId;
    if (!garageId) continue;
    await db.ref(`attendance/${recordId}/garageId`).set(garageId);
    updated++;
  }

  if (updated > 0) {
    console.log(`Backfilled garageId for ${updated} attendance record(s).`);
  }
}

async function bootstrapAdmin() {
  const usersSnap = await db.ref("users").get();
  if (usersSnap.exists()) {
    console.log("Users already exist — skipping bootstrap.");
    return;
  }

  console.log("Creating seed admin user…");
  const usernameLower = SEED_ADMIN.username.toLowerCase();
  const { password, id, ...profile } = SEED_ADMIN;

  await db.ref(`users/${id}`).set({ ...profile, usernameLower });
  await db.ref(`userCredentials/${id}`).set({
    password: hashPassword(password),
    usernameLower,
  });
  await db.ref(`usernameIndex/${usernameLower}`).set(id);
  await ensureAuthUser(id, SEED_ADMIN, { role: "admin", userId: id });
  console.log(`Bootstrap complete. Login with username "${SEED_ADMIN.username}".`);
}

async function main() {
  if (bootstrap) {
    await bootstrapAdmin();
  }

  const usersSnap = await db.ref("users").get();
  if (!usersSnap.exists()) {
    console.log("No users found.");
    return;
  }

  const users = usersSnap.val();
  for (const [userId, data] of Object.entries(users)) {
    await migrateUser(userId, data);
  }

  await backfillAttendanceGarageIds();
  console.log("Migration finished.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
