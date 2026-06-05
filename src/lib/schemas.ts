import { z } from "zod";

// ===== User Schemas =====
export const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  username: z.string().min(3, "Username must be at least 3 characters").max(50, "Username must be less than 50 characters").regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password must be less than 100 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number must be at least 10 characters").max(20, "Phone number must be less than 20 characters").optional().or(z.literal("")),
  role: z.enum(["admin", "supervisor", "observer", "garage"]),
  garageId: z.string().optional(),
  customPermissions: z.object({
    canEdit: z.boolean().optional(),
    canManageUsers: z.boolean().optional(),
    canViewAll: z.boolean().optional(),
    canClockDriver: z.boolean().optional(),
    canViewReports: z.boolean().optional(),
  }).optional(),
});

export const userEditSchema = userSchema.partial().extend({
  password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password must be less than 100 characters").optional().or(z.literal("")),
});

// ===== Garage Schemas =====
export const garageSchema = z.object({
  name: z.string().min(2, "Garage name must be at least 2 characters").max(100, "Garage name must be less than 100 characters"),
  location: z.string().min(2, "Location must be at least 2 characters").max(200, "Location must be less than 200 characters"),
  capacity: z.number().int().min(1, "Capacity must be at least 1").max(1000, "Capacity must be less than 1000"),
  managerId: z.string().optional().or(z.literal("")),
});

export const garageEditSchema = garageSchema.partial();

// ===== Bike Schemas =====
export const bikeSchema = z.object({
  plateNumber: z.string().min(3, "Plate number must be at least 3 characters").max(20, "Plate number must be less than 20 characters"),
  bikeType: z.string().min(1, "Bike type is required"),
  color: z.string().min(2, "Color must be at least 2 characters").max(50, "Color must be less than 50 characters"),
  status: z.enum(["good", "maintenance", "defective"]),
  garageId: z.string().optional().or(z.literal("")),
  driverId: z.string().optional().or(z.literal("")),
  registrationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  defectDescription: z.string().max(500, "Defect description must be less than 500 characters").optional().or(z.literal("")),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional().or(z.literal("")),
});

export const bikeEditSchema = bikeSchema.partial();

// ===== Driver Schemas =====
export const driverSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 characters").max(20, "Phone number must be less than 20 characters"),
  bikeId: z.string().optional().or(z.literal("")),
  garageId: z.string().optional().or(z.literal("")),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional().or(z.literal("")),
});

export const driverEditSchema = driverSchema.partial();

// ===== Login Schema =====
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Type exports
export type UserFormData = z.infer<typeof userSchema>;
export type UserEditFormData = z.infer<typeof userEditSchema>;
export type GarageFormData = z.infer<typeof garageSchema>;
export type GarageEditFormData = z.infer<typeof garageEditSchema>;
export type BikeFormData = z.infer<typeof bikeSchema>;
export type BikeEditFormData = z.infer<typeof bikeEditSchema>;
export type DriverFormData = z.infer<typeof driverSchema>;
export type DriverEditFormData = z.infer<typeof driverEditSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
