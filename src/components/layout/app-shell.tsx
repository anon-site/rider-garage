"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Header } from "./header";
import { useSidebar } from "./sidebar-context";

type AppShellProps = {
  children: ReactNode;
  title: string;
  description?: string;
};

export function AppShell({ children, title, description }: AppShellProps) {
  const { isOpen, isMobile } = useSidebar();

  return (
    <div className="min-h-screen bg-surface-50">
      <div
        className={cn(
          "relative flex min-h-screen flex-col transition-[margin] duration-300 ease-out",
          !isMobile && (isOpen ? "lg:ml-72" : "lg:ml-20"),
        )}
      >
        <div className="pointer-events-none fixed inset-0 opacity-[0.35]" style={{ backgroundImage: "radial-gradient(circle, #cbd5e1 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <Header title={title} description={description} />
        <main className="relative flex-1 animate-[fadeIn_0.18s_ease-out] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
