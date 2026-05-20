import {
  Bike,
  Gauge,
  LayoutDashboard,
  Settings,
  Users,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview and quick stats",
  },
  {
    title: "Bikes",
    href: "/bikes",
    icon: Bike,
    description: "Fleet and maintenance",
  },
  {
    title: "Drivers",
    href: "/drivers",
    icon: Users,
    description: "Rider profiles and assignments",
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    description: "Analytics and insights",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "System preferences",
  },
  {
    title: "Control Panel",
    href: "/control-panel",
    icon: Gauge,
    description: "Operations and monitoring",
  },
];
