import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin, verifyBearerToken } from "@/lib/server-auth";
import { hashPassword, verifyPassword } from "@/lib/server-password";
import { normalizeUsername } from "@/lib/user-profile";

type VerifyBody = {
  password?: string;
};

export async function POST(request: Request) {
  const auth = await verifyBearerToken(request.headers.get("authorization"));
  const forbidden = requireAdmin(auth);
  if (forbidden) return forbidden;

  const body = (await request.json()) as VerifyBody;
  const password = body.password ?? "";
  if (!password) {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }

  const userId = auth!.claims.userId;
  const db = getAdminDb();

  const credSnap = await db.ref(`userCredentials/${userId}/password`).get();
  let stored = credSnap.exists() ? (credSnap.val() as string) : null;

  if (!stored) {
    const legacySnap = await db.ref(`users/${userId}/password`).get();
    stored = legacySnap.exists() ? (legacySnap.val() as string) : null;
  }

  if (!stored) {
    return NextResponse.json({ error: "Credentials not found." }, { status: 400 });
  }

  const valid = stored.includes(":")
    ? await verifyPassword(password, stored)
    : password === stored;

  if (!valid) {
    return NextResponse.json({ error: "Incorrect admin password." }, { status: 401 });
  }

  if (!stored.includes(":")) {
    const usernameLower = normalizeUsername(
      (await db.ref(`users/${userId}/username`).get()).val() as string
    );
    await db.ref(`userCredentials/${userId}`).set({
      password: await hashPassword(password),
      usernameLower,
    });
    await db.ref(`usernameIndex/${usernameLower}`).set(userId);
    await db.ref(`users/${userId}/password`).remove();
  }

  return NextResponse.json({ ok: true });
}
