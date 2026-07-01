import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { Sidebar } from "@/components/layout/sidebar";
import { AuthProvider } from "@/contexts/auth-context";
import { NotificationsProvider } from "@/contexts/notifications-context";
import { ControlPanelProvider } from "@/contexts/control-panel-context";
import { BikesProvider } from "@/contexts/bikes-context";
import { DriversProvider } from "@/contexts/drivers-context";
import { LiveShiftsProvider } from "@/contexts/live-shifts-context";
import { AuthGate } from "@/components/auth/auth-gate";
import { SecurityGuard } from "@/components/auth/security-guard";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ToastProvider } from "@/components/ui/toast";
import { AttendanceNotificationListener } from "@/components/notifications/attendance-notification-listener";
import { NotificationPermissionPrompt } from "@/components/notifications/notification-permission-prompt";
import { NotificationAudioUnlock } from "@/components/notifications/notification-audio-unlock";
import { FcmRegistration } from "@/components/notifications/fcm-registration";
import { MissedNotificationsSync } from "@/components/notifications/missed-notifications-sync";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Rider Garage",
    template: "%s | Rider Garage",
  },
  description: "Delivery fleet garage management system",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <ControlPanelProvider>
          <BikesProvider>
            <DriversProvider>
              <AuthProvider>
                <AuthGate>
                  <NotificationsProvider>
                  <LiveShiftsProvider>
                    <SecurityGuard>
                      <ToastProvider>
                        <NotificationAudioUnlock />
                        <FcmRegistration />
                        <MissedNotificationsSync />
                        <AttendanceNotificationListener />
                        <NotificationPermissionPrompt />
                        <SidebarProvider>
                          <Sidebar />
                          <ErrorBoundary>
                            {children}
                          </ErrorBoundary>
                        </SidebarProvider>
                      </ToastProvider>
                    </SecurityGuard>
                  </LiveShiftsProvider>
                  </NotificationsProvider>
                </AuthGate>
              </AuthProvider>
            </DriversProvider>
          </BikesProvider>
        </ControlPanelProvider>
      </body>
    </html>
  );
}
