"use client";

import { useEffect } from "react";
import { unlockNotificationAudio } from "@/lib/notification-sounds";

/** Unlock Web Audio after the first user gesture (browser autoplay policy). */
export function NotificationAudioUnlock() {
  useEffect(() => {
    const unlock = () => {
      unlockNotificationAudio();
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };

    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock);

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return null;
}
