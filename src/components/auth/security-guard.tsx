"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { ShieldAlert, Lock } from "lucide-react";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const DEVTOOLS_CHECK_INTERVAL_MS = 1000;
const DEVTOOLS_SIZE_THRESHOLD = 160;

/**
 * Client-side security deterrents.
 *
 * IMPORTANT: This is a deterrence layer, not absolute protection. Any data
 * rendered in the browser can be inspected by a determined user. Real
 * protection comes from Firebase Security Rules, HTTPS, and least-privilege
 * permissions.
 */
export function SecurityGuard({ children }: { children: React.ReactNode }) {
  const { logout, isAuthenticated } = useAuth();
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (!isAuthenticated) return;
    idleTimerRef.current = setTimeout(() => {
      logout();
    }, IDLE_TIMEOUT_MS);
  }, [isAuthenticated, logout]);

  // Auto logout on inactivity
  useEffect(() => {
    if (!isAuthenticated) return;
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [isAuthenticated, resetIdleTimer]);

  useEffect(() => {
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    const handler = () => resetIdleTimer();
    events.forEach((e) => window.addEventListener(e, handler));
    return () => events.forEach((e) => window.removeEventListener(e, handler));
  }, [resetIdleTimer]);

  // Block common dev-tools shortcuts
  useEffect(() => {
    const blockShortcuts = (e: KeyboardEvent) => {
      const isDevToolsShortcut =
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
        (e.ctrlKey && e.key === "U") ||
        (e.metaKey && e.altKey && (e.key === "i" || e.key === "I"));

      if (isDevToolsShortcut) {
        e.preventDefault();
        e.stopPropagation();
        setDevToolsOpen(true);
        return false;
      }
    };

    document.addEventListener("keydown", blockShortcuts, true);

    return () => {
      document.removeEventListener("keydown", blockShortcuts, true);
    };
  }, []);

  // Detect dev-tools by comparing outer vs inner window dimensions
  useEffect(() => {
    const checkDevTools = () => {
      const widthDiff = window.outerWidth - window.innerWidth > DEVTOOLS_SIZE_THRESHOLD;
      const heightDiff = window.outerHeight - window.innerHeight > DEVTOOLS_SIZE_THRESHOLD;
      setDevToolsOpen(widthDiff || heightDiff);
    };

    checkDevTools();
    const interval = setInterval(checkDevTools, DEVTOOLS_CHECK_INTERVAL_MS);
    window.addEventListener("resize", checkDevTools);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", checkDevTools);
    };
  }, []);

  return (
    <div className="relative">
      {children}
      {devToolsOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 text-white backdrop-blur-sm">
          <div className="max-w-md p-8 text-center">
            <ShieldAlert className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h2 className="mb-2 text-2xl font-bold">Security Lock</h2>
            <p className="mb-6 text-gray-300">
              Developer tools detected. Please close them to continue.
            </p>
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-2 font-medium hover:bg-red-700"
            >
              <Lock className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
