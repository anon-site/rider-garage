"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { areBrowserNotificationsEnabled } from "@/lib/browser-notifications";
import { isFcmConfigured, registerFcmToken, unregisterFcmToken } from "@/lib/fcm";

export function FcmRegistration() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id || !isFcmConfigured()) return;

    if (areBrowserNotificationsEnabled()) {
      void registerFcmToken(user.id);
      return;
    }

    void unregisterFcmToken(user.id);
  }, [user?.id]);

  return null;
}
