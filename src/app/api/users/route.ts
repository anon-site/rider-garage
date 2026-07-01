import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin, verifyBearerToken } from "@/lib/server-auth";
import { hashPassword } from "@/lib/server-password";
import { normalizeUsername, userProfilePayload } from "@/lib/user-profile";
import type { CustomPermissions, RoleId } from "@/types/user";

type CreateUserBody = {
  id?: string;
  name?: string;
  username?: string;
  password?: string;
  email?: string;
  phone?: string;
  role?: RoleId;
  garageId?: string;
  customPermissions?: CustomPermissions | null;
};

function generateUserId(existingIds: string[]): string {
  const prefix = "USR-";
  let counter = 1;
  let newId = `${prefix}${String(counter).padStart(3, "0")}`;
  while (existingIds.includes(newId)) {
    counter++;
    newId = `${prefix}${String(counter).padStart(3, "0")}`;
  }
  return newId;
}

export async function POST(request: Request) {
  const auth = await verifyBearerToken(request.headers.get("authorization"));
  const forbidden = requireAdmin(auth);
  if (forbidden) return forbidden;

  const body = (await request.json()) as CreateUserBody;
  const name = body.name?.trim();
  const username = body.username?.trim();
  const password = body.password ?? "";
  const role = body.role ?? "observer";

  if (!name || !username || password.length < 6) {
    return NextResponse.json({ error: "Name, username, and password (min 6 chars) are required." }, { status: 400 });
  }

  const db = getAdminDb();
  const usernameLower = normalizeUsername(username);

  const existingIndex = await db.ref(`usernameIndex/${usernameLower}`).get();
  if (existingIndex.exists()) {
    return NextResponse.json({ error: "Username already exists." }, { status: 409 });
  }

  const usersSnap = await db.ref("users").get();
  const existingIds = usersSnap.exists() ? Object.keys(usersSnap.val() as Record<string, unknown>) : [];
  const userId = body.id?.trim() || generateUserId(existingIds);

  if (existingIds.includes(userId)) {
    return NextResponse.json({ error: "User ID already exists." }, { status: 409 });
  }

  const profile = userProfilePayload({
    name,
    username,
    email: body.email ?? "",
    phone: body.phone ?? "",
    role,
    garageId: role === "garage" ? body.garageId : undefined,
    customPermissions: body.customPermissions ?? undefined,
  });

  const hashedPassword = await hashPassword(password);

  await db.ref(`users/${userId}`).set(profile);
  await db.ref(`userCredentials/${userId}`).set({ password: hashedPassword, usernameLower });
  await db.ref(`usernameIndex/${usernameLower}`).set(userId);

  if (profile.garageId) {
    await db.ref(`garages/${profile.garageId}/managerId`).set(userId);
  }

  try {
    await getAdminAuth().createUser({ uid: userId, displayName: name });
  } catch {
    // Auth user may already exist from a prior partial create
  }

  return NextResponse.json({ id: userId, user: { ...profile, id: userId } }, { status: 201 });
}
