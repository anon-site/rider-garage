const STORAGE_KEY = "rider-garage-notification-sounds";

export type AttendanceSoundKind = "exit" | "entry";

let audioContext: AudioContext | null = null;

export function areNotificationSoundsEnabled(): boolean {
  if (typeof window === "undefined") return false;
  const value = localStorage.getItem(STORAGE_KEY);
  return value !== "disabled";
}

export function setNotificationSoundsEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY, enabled ? "enabled" : "disabled");
}

export function unlockNotificationAudio(): void {
  if (typeof window === "undefined") return;
  if (!audioContext) audioContext = new AudioContext();
  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  volume: number
) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, start);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

export function playAttendanceSound(kind: AttendanceSoundKind): void {
  if (!areNotificationSoundsEnabled()) return;

  unlockNotificationAudio();
  if (!audioContext) return;

  const ctx = audioContext;
  const t = ctx.currentTime;
  const vol = 0.22;

  if (kind === "exit") {
    // Descending — driver leaving
    playTone(ctx, 784, t, 0.14, vol);
    playTone(ctx, 622, t + 0.16, 0.14, vol);
    playTone(ctx, 494, t + 0.32, 0.18, vol * 0.9);
  } else {
    // Ascending — driver returning
    playTone(ctx, 523, t, 0.12, vol * 0.9);
    playTone(ctx, 659, t + 0.14, 0.12, vol);
    playTone(ctx, 784, t + 0.28, 0.16, vol);
    playTone(ctx, 988, t + 0.44, 0.2, vol * 0.85);
  }
}
