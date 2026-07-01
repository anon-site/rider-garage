const LAST_ACTIVE_PREFIX = "rider-garage-last-active-";
const DEFAULT_LOOKBACK_MS = 24 * 60 * 60 * 1000;

export function getLastActiveTime(userId: string): string {
  if (typeof window === "undefined") {
    return new Date(Date.now() - DEFAULT_LOOKBACK_MS).toISOString();
  }

  const stored = localStorage.getItem(`${LAST_ACTIVE_PREFIX}${userId}`);
  if (stored) return stored;

  return new Date(Date.now() - DEFAULT_LOOKBACK_MS).toISOString();
}

export function setLastActiveTime(userId: string, iso = new Date().toISOString()): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${LAST_ACTIVE_PREFIX}${userId}`, iso);
}
