import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";

export async function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const auth = getAuth(app);
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;

  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(input, { ...init, headers });
}
