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
      void registerFcmToken({
        userId: user.id,
        role: user.role,
        garageId: user.garageId,
      });
      return;
    }

    void unregisterFcmToken(user.id);
  }, [user?.id, user?.role, user?.garageId]);

  return null;
}
