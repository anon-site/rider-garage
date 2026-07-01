/** Prevent duplicate in-app notifications for the same attendance event. */
const recentEventKeys = new Set<string>();

export function suppressAttendanceNotification(recordId: string) {
  recentEventKeys.add(`exit:${recordId}`);
  recentEventKeys.add(`entry:${recordId}`);
  setTimeout(() => {
    recentEventKeys.delete(`exit:${recordId}`);
    recentEventKeys.delete(`entry:${recordId}`);
  }, 8000);
}

export function isAttendanceNotificationSuppressed(
  recordId: string,
  kind: "exit" | "entry"
): boolean {
  return recentEventKeys.has(`${kind}:${recordId}`);
}

export function markAttendanceNotificationHandled(
  recordId: string,
  kind: "exit" | "entry"
): boolean {
  const key = `${kind}:${recordId}`;
  if (recentEventKeys.has(key)) return false;
  recentEventKeys.add(key);
  setTimeout(() => recentEventKeys.delete(key), 8000);
  return true;
}
