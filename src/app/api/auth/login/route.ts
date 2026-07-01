import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { buildAuthClaims } from "@/lib/auth-claims";
import { toPublicUser, normalizeUsername } from "@/lib/user-profile";
import { hashPassword, isHashedPassword, verifyPassword } from "@/lib/server-password";
import type { PublicUser } from "@/types/user";

type LoginBody = {
  username?: string;
  password?: string;
};

async function findUserIdByUsername(usernameLower: string): Promise<string | null> {
  const db = getAdminDb();

  const indexSnap = await db.ref(`usernameIndex/${usernameLower}`).get();
  if (indexSnap.exists()) {
    return indexSnap.val() as string;
  }

  const usersSnap = await db.ref("users").orderByChild("usernameLower").equalTo(usernameLower).get();
  if (!usersSnap.exists()) {
    const legacySnap = await db.ref("users").get();
    if (!legacySnap.exists()) return null;
    for (const [id, value] of Object.entries(legacySnap.val() as Record<string, { username?: string }>)) {
      if (value.username?.toLowerCase() === usernameLower) return id;
    }
    return null;
  }

  const entries = Object.entries(usersSnap.val() as Record<string, unknown>);
  return entries[0]?.[0] ?? null;
}

async function readStoredPassword(userId: string): Promise<string | null> {
  const db = getAdminDb();
  const credSnap = await db.ref(`userCredentials/${userId}/password`).get();
  if (credSnap.exists()) return credSnap.val() as string;

  const legacySnap = await db.ref(`users/${userId}/password`).get();
  if (legacySnap.exists()) return legacySnap.val() as string;

  return null;
}

async function verifyLoginPassword(
  userId: string,
  password: string,
  stored: string | null
): Promise<boolean> {
  if (!stored) return false;
  if (isHashedPassword(stored)) return verifyPassword(password, stored);
  return password === stored;
}

async function ensureCredentialsMigrated(userId: string, usernameLower: string, stored: string) {
  const db = getAdminDb();
  const credRef = db.ref(`userCredentials/${userId}`);
  const credSnap = await credRef.get();
  if (credSnap.exists()) return;

  const hashed = isHashedPassword(stored) ? stored : await hashPassword(stored);
  await credRef.set({ password: hashed, usernameLower });
  await db.ref(`usernameIndex/${usernameLower}`).set(userId);
  await db.ref(`users/${userId}/password`).remove();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;
    const username = body.username?.trim();
    const password = body.password ?? "";

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
    }

    const usernameLower = normalizeUsername(username);
    const userId = await findUserIdByUsername(usernameLower);
    if (!userId) {
      return NextResponse.json({ error: "No account found with this username." }, { status: 401 });
    }

    const storedPassword = await readStoredPassword(userId);
    const valid = await verifyLoginPassword(userId, password, storedPassword);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    if (storedPassword) {
      await ensureCredentialsMigrated(userId, usernameLower, storedPassword);
    }

    const profileSnap = await getAdminDb().ref(`users/${userId}`).get();
    if (!profileSnap.exists()) {
      return NextResponse.json({ error: "User profile not found." }, { status: 401 });
    }

    const profile = toPublicUser(userId, profileSnap.val() as Record<string, unknown>);
    const claims = buildAuthClaims(profile);
    const adminAuth = getAdminAuth();

    try {
      await adminAuth.getUser(userId);
    } catch {
      await adminAuth.createUser({ uid: userId, displayName: profile.name });
    }

    await adminAuth.setCustomUserClaims(userId, claims);
    const customToken = await adminAuth.createCustomToken(userId, claims);

    return NextResponse.json({
      customToken,
      user: profile satisfies PublicUser,
    });
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ error: "Login failed. Check server configuration." }, { status: 500 });
  }
}
