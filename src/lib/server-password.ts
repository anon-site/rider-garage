/**
 * Server-side password hashing (SHA-256 + salt).
 * Matches the client crypto helpers for backward compatibility.
 */

export async function hashPassword(password: string, salt?: string): Promise<string> {
  const actualSalt = salt ?? generateSalt();
  const data = new TextEncoder().encode(password + actualSalt);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${actualSalt}:${hashHex}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) return false;
    const computed = await hashPassword(password, salt);
    return computed === storedHash;
  } catch {
    return false;
  }
}

export function isHashedPassword(password: string): boolean {
  return password.includes(":") && password.split(":").length === 2;
}

function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}
