import { NextResponse } from "next/server";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getAdminAuth } from "@/lib/firebase-admin";
import type { AuthClaims } from "@/lib/auth-claims";
import type { RoleId } from "@/types/user";

export type AuthenticatedRequest = {
  token: DecodedIdToken;
  claims: AuthClaims;
};

export async function verifyBearerToken(
  authorization: string | null
): Promise<AuthenticatedRequest | null> {
  if (!authorization?.startsWith("Bearer ")) return null;

  const idToken = authorization.slice("Bearer ".length).trim();
  if (!idToken) return null;

  try {
    const token = await getAdminAuth().verifyIdToken(idToken);
    const role = token.role as RoleId | undefined;
    const userId = (token.userId as string | undefined) ?? token.uid;
    if (!role || !userId) return null;

    return {
      token,
      claims: {
        role,
        userId,
        garageId: token.garageId as string | undefined,
      },
    };
  } catch {
    return null;
  }
}

export function requireAuth(auth: AuthenticatedRequest | null) {
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export function requireAdmin(auth: AuthenticatedRequest | null) {
  const unauthorized = requireAuth(auth);
  if (unauthorized) return unauthorized;
  if (auth!.claims.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
