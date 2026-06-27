import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { Sidebar } from "@/components/layout/sidebar";
import { AuthProvider } from "@/contexts/auth-context";
import { ControlPanelProvider } from "@/contexts/control-panel-context";
import { BikesProvider } from "@/contexts/bikes-context";
import { DriversProvider } from "@/contexts/drivers-context";
import { AttendanceProvider } from "@/contexts/attendance-context";
import { AuthGate } from "@/components/auth/auth-gate";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ToastProvider } from "@/components/ui/toast";
import { SecurityProtection } from "@/components/security/security-protection";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <SecurityProtection />
        <ControlPanelProvider>
          <BikesProvider>
            <DriversProvider>
              <AttendanceProvider>
                <AuthProvider>
                  <AuthGate>
                    <ToastProvider>
                      <SidebarProvider>
                        <Sidebar />
                        <ErrorBoundary>
                          {children}
                        </ErrorBoundary>
                      </SidebarProvider>
                    </ToastProvider>
                  </AuthGate>
                </AuthProvider>
              </AttendanceProvider>
            </DriversProvider>
          </BikesProvider>
        </ControlPanelProvider>
      </body>
    </html>
  );
}
