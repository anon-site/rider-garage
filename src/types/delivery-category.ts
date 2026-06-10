export type DeliveryCategoryId = string;

export interface DeliveryCategory {
  id: DeliveryCategoryId;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  priority?: number; // Lower number = higher priority
  isActive?: boolean;
}

export const DELIVERY_CATEGORIES: DeliveryCategory[] = [
  {
    id: "standard",
    name: "Standard Delivery",
    description: "Regular food and package delivery",
    color: "#3b82f6",
    icon: "package",
    priority: 1,
    isActive: true,
  },
  {
    id: "express",
    name: "Express Delivery",
    description: "Urgent and time-sensitive deliveries",
    color: "#ef4444",
    icon: "zap",
    priority: 2,
    isActive: true,
  },
  {
    id: "bulk",
    name: "Bulk Delivery",
    description: "Large volume and heavy items",
    color: "#f59e0b",
    icon: "truck",
    priority: 3,
    isActive: true,
  },
  {
    id: "premium",
    name: "Premium Delivery",
    description: "High-value and fragile items",
    color: "#8b5cf6",
    icon: "crown",
    priority: 4,
    isActive: true,
  },
  {
    id: "night",
    name: "Night Delivery",
    description: "Overnight and late night deliveries",
    color: "#6366f1",
    icon: "moon",
    priority: 5,
    isActive: true,
  },
];
