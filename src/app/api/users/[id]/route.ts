import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { buildAuthClaims } from "@/lib/auth-claims";
import { requireAdmin, verifyBearerToken } from "@/lib/server-auth";
import { hashPassword } from "@/lib/server-password";
import { normalizeUsername, toPublicUser } from "@/lib/user-profile";
import type { CustomPermissions, RoleId } from "@/types/user";

type UpdateUserBody = {
  name?: string;
  username?: string;
  password?: string;
  email?: string;
  phone?: string;
  role?: RoleId;
  garageId?: string | null;
  customPermissions?: CustomPermissions | null;
  newId?: string;
};

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await verifyBearerToken(request.headers.get("authorization"));
  const forbidden = requireAdmin(auth);
  if (forbidden) return forbidden;

  const { id: userId } = await context.params;
  const body = (await request.json()) as UpdateUserBody;
  const db = getAdminDb();

  const userSnap = await db.ref(`users/${userId}`).get();
  if (!userSnap.exists()) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const current = userSnap.val() as Record<string, unknown>;
  if (current.role === "admin" && body.role && body.role !== "admin") {
    return NextResponse.json({ error: "Cannot change the role of an Admin user." }, { status: 400 });
  }

  let targetId = userId;
  if (body.newId && body.newId !== userId) {
    if (current.role === "admin") {
      return NextResponse.json({ error: "Cannot change the ID of an Admin user." }, { status: 400 });
    }
    const exists = await db.ref(`users/${body.newId}`).get();
    if (exists.exists()) {
      return NextResponse.json({ error: "Target user ID already exists." }, { status: 409 });
    }

    const data = userSnap.val();
    await db.ref(`users/${body.newId}`).set(data);
    await db.ref(`users/${userId}`).remove();

    const credSnap = await db.ref(`userCredentials/${userId}`).get();
    if (credSnap.exists()) {
      await db.ref(`userCredentials/${body.newId}`).set(credSnap.val());
      await db.ref(`userCredentials/${userId}`).remove();
    }

    const oldUsername = (data as { username?: string }).username;
    if (oldUsername) {
      await db.ref(`usernameIndex/${normalizeUsername(oldUsername)}`).set(body.newId);
    }

    try {
      await getAdminAuth().deleteUser(userId);
      await getAdminAuth().createUser({ uid: body.newId, displayName: (data as { name?: string }).name });
    } catch {
      // Best-effort auth sync
    }

    targetId = body.newId;
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.email !== undefined) updates.email = body.email;
  if (body.phone !== undefined) updates.phone = body.phone;
  if (body.role !== undefined) updates.role = body.role;
  if (body.customPermissions !== undefined) updates.customPermissions = body.customPermissions;

  if (body.username !== undefined) {
    const usernameLower = normalizeUsername(body.username);
    const taken = await db.ref(`usernameIndex/${usernameLower}`).get();
    if (taken.exists() && taken.val() !== targetId) {
      return NextResponse.json({ error: "Username already exists." }, { status: 409 });
    }

    const oldUsername = (await db.ref(`users/${targetId}/username`).get()).val() as string | null;
    if (oldUsername) {
      await db.ref(`usernameIndex/${normalizeUsername(oldUsername)}`).remove();
    }

    updates.username = body.username;
    updates.usernameLower = usernameLower;
    await db.ref(`usernameIndex/${usernameLower}`).set(targetId);
    await db.ref(`userCredentials/${targetId}/usernameLower`).set(usernameLower);
  }

  const effectiveRole = (body.role ?? current.role) as RoleId;
  if (body.garageId !== undefined || body.role !== undefined) {
    const oldGarageId = current.garageId as string | undefined;
    const newGarageId = effectiveRole === "garage" ? (body.garageId ?? oldGarageId) : null;
    updates.garageId = newGarageId;

    if (oldGarageId && oldGarageId !== newGarageId) {
      await db.ref(`garages/${oldGarageId}/managerId`).set(null);
    }
    if (newGarageId) {
      await db.ref(`garages/${newGarageId}/managerId`).set(targetId);
    }
  }

  if (Object.keys(updates).length > 0) {
    await db.ref(`users/${targetId}`).update(updates);
  }

  if (body.password && body.password.length >= 6) {
    const hashed = await hashPassword(body.password);
    await db.ref(`userCredentials/${targetId}/password`).set(hashed);
    await db.ref(`users/${targetId}/password`).remove();
  }

  const profileSnap = await db.ref(`users/${targetId}`).get();
  const profile = toPublicUser(targetId, profileSnap.val() as Record<string, unknown>);
  const claims = buildAuthClaims(profile);
  try {
    await getAdminAuth().setCustomUserClaims(targetId, claims);
  } catch {
    // Auth user may not exist yet
  }

  return NextResponse.json({ user: profile });
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await verifyBearerToken(request.headers.get("authorization"));
  const forbidden = requireAdmin(auth);
  if (forbidden) return forbidden;

  const { id: userId } = await context.params;
  const db = getAdminDb();
  const userSnap = await db.ref(`users/${userId}`).get();
  if (!userSnap.exists()) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const user = userSnap.val() as { role?: string; username?: string; garageId?: string };
  if (user.role === "admin") {
    return NextResponse.json({ error: "Cannot delete an Admin user." }, { status: 400 });
  }

  if (user.garageId) {
    await db.ref(`garages/${user.garageId}/managerId`).set(null);
  }

  if (user.username) {
    await db.ref(`usernameIndex/${normalizeUsername(user.username)}`).remove();
  }

  await db.ref(`users/${userId}`).remove();
  await db.ref(`userCredentials/${userId}`).remove();

  try {
    await getAdminAuth().deleteUser(userId);
  } catch {
    // User may not exist in Firebase Auth yet
  }

  return NextResponse.json({ ok: true });
}
