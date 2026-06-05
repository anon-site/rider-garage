/**
 * Rate limiting utilities for login attempts
 * Prevents brute force attacks by limiting failed login attempts
 */

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const STORAGE_KEY = "rider-garage-login-attempts";

interface LoginAttempts {
  count: number;
  lastAttempt: number;
  lockedUntil: number | null;
}

export function getLoginAttempts(): LoginAttempts {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { count: 0, lastAttempt: 0, lockedUntil: null };
    return JSON.parse(stored);
  } catch {
    return { count: 0, lastAttempt: 0, lockedUntil: null };
  }
}

export function setLoginAttempts(attempts: LoginAttempts): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
  } catch {
    // Silently fail if localStorage is not available
  }
}

export function recordFailedAttempt(): { locked: boolean; remainingTime?: number } {
  const attempts = getLoginAttempts();
  const now = Date.now();

  // Check if currently locked out
  if (attempts.lockedUntil && attempts.lockedUntil > now) {
    return {
      locked: true,
      remainingTime: attempts.lockedUntil - now,
    };
  }

  // Reset if lockout period has passed
  if (attempts.lockedUntil && attempts.lockedUntil <= now) {
    attempts.count = 0;
    attempts.lockedUntil = null;
  }

  // Increment attempt count
  attempts.count++;
  attempts.lastAttempt = now;

  // Lock if max attempts reached
  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockedUntil = now + LOCKOUT_DURATION;
    setLoginAttempts(attempts);
    return {
      locked: true,
      remainingTime: LOCKOUT_DURATION,
    };
  }

  setLoginAttempts(attempts);
  return { locked: false };
}

export function recordSuccessfulLogin(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

export function getRemainingLockoutTime(): number | null {
  const attempts = getLoginAttempts();
  if (!attempts.lockedUntil) return null;
  const now = Date.now();
  if (attempts.lockedUntil <= now) {
    recordSuccessfulLogin(); // Clear if lockout expired
    return null;
  }
  return attempts.lockedUntil - now;
}

export function formatLockoutTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}
