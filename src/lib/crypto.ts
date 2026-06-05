/**
 * Password hashing utilities using Web Crypto API (SHA-256)
 * This provides basic client-side password hashing for improved security.
 * Note: For production, use server-side bcrypt/argon2 instead.
 */

/**
 * Hash a password using SHA-256 with salt
 */
export async function hashPassword(password: string, salt?: string): Promise<string> {
  // Generate or use provided salt
  const actualSalt = salt || generateSalt();
  
  // Combine password and salt
  const data = new TextEncoder().encode(password + actualSalt);
  
  // Hash using SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Return salt:hash format
  return `${actualSalt}:${hashHex}`;
}

/**
 * Verify a password against a stored hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    
    const computedHash = await hashPassword(password, salt);
    return computedHash === storedHash;
  } catch {
    return false;
  }
}

/**
 * Generate a random salt
 */
function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if a hash is in the new format (salt:hash)
 */
export function isHashedPassword(password: string): boolean {
  return password.includes(':') && password.split(':').length === 2;
}
