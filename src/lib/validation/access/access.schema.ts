import { z } from "zod";

export const createAccessFeatureSchema = z.object({
  tenantId: z.string().min(1).optional(),
  key: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9:_-]+$/, "Use apenas letras minusculas, numeros, :, _ e -."),
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  route: z.string().startsWith("/").max(160).optional(),
  showInMenu: z.boolean().optional(),
  showInDashboard: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  enabled: z.boolean().optional(),
});

export const updateAccessFeatureSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional(),
  route: z.string().startsWith("/").max(160).optional(),
  showInMenu: z.boolean().optional(),
  showInDashboard: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  enabled: z.boolean().optional(),
});

export const setUserFeaturePermissionSchema = z.object({
  tenantId: z.string().min(1).optional(),
  userId: z.string().min(1),
  featureId: z.string().min(1),
  canAccess: z.boolean(),
});

export type CreateAccessFeatureInput = z.infer<typeof createAccessFeatureSchema>;
export type UpdateAccessFeatureInput = z.infer<typeof updateAccessFeatureSchema>;
export type SetUserFeaturePermissionInput = z.infer<typeof setUserFeaturePermissionSchema>;
