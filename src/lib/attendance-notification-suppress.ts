/** Skip global listener toasts for actions the current user just performed. */
const suppressedIds = new Set<string>();

export function suppressAttendanceNotification(recordId: string) {
  suppressedIds.add(recordId);
  setTimeout(() => suppressedIds.delete(recordId), 4000);
}

export function isAttendanceNotificationSuppressed(recordId: string): boolean {
  return suppressedIds.has(recordId);
}
