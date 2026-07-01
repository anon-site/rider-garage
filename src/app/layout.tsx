import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { Sidebar } from "@/components/layout/sidebar";
import { AuthProvider } from "@/contexts/auth-context";
import { ControlPanelProvider } from "@/contexts/control-panel-context";
import { BikesProvider } from "@/contexts/bikes-context";
import { DriversProvider } from "@/contexts/drivers-context";
import { LiveShiftsProvider } from "@/contexts/live-shifts-context";
import { AuthGate } from "@/components/auth/auth-gate";
import { SecurityGuard } from "@/components/auth/security-guard";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { ToastProvider } from "@/components/ui/toast";

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
        <ControlPanelProvider>
          <BikesProvider>
            <DriversProvider>
              <AuthProvider>
                <AuthGate>
                  <LiveShiftsProvider>
                    <SecurityGuard>
                      <ToastProvider>
                        <SidebarProvider>
                          <Sidebar />
                          <ErrorBoundary>
                            {children}
                          </ErrorBoundary>
                        </SidebarProvider>
                      </ToastProvider>
                    </SecurityGuard>
                  </LiveShiftsProvider>
                </AuthGate>
              </AuthProvider>
            </DriversProvider>
          </BikesProvider>
        </ControlPanelProvider>
      </body>
    </html>
  );
}
