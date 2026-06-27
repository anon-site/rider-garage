"use client";

import { useDevToolsProtection, useScreenshotProtection } from "@/lib/security";

export function SecurityProtection() {
  useDevToolsProtection();
  useScreenshotProtection();

  return null; // This component doesn't render anything, just provides protection
}
