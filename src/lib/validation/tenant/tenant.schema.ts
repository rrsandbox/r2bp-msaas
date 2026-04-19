import { z } from "zod";

export const createTenantSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  legalProfile: z.record(z.string(), z.unknown()).optional(),
  billingProfile: z.record(z.string(), z.unknown()).optional(),
  adminProfile: z.record(z.string(), z.unknown()).optional(),
});

export const updateTenantSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  status: z.enum(["active", "inactive", "archived"]).optional(),
  onboardingStatus: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
  legalProfile: z.record(z.string(), z.unknown()).optional(),
  billingProfile: z.record(z.string(), z.unknown()).optional(),
  adminProfile: z.record(z.string(), z.unknown()).optional(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;