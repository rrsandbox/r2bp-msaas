import { z } from "zod";

import { passwordSchema } from "@/lib/validation/auth/password.schema";

export const createUserSchema = z.object({
  email: z.email(),
  name: z.string().min(2).max(120),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "USER"]),
  tenantId: z.string().min(1).optional(),
  password: passwordSchema.optional(),
  profile: z.record(z.string(), z.unknown()).optional(),
  isProfileComplete: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  status: z.enum(["PENDING_APPROVAL", "INVITED", "ACTIVE", "INACTIVE", "BLOCKED", "DELETED"]).optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "USER"]).optional(),
  profile: z.record(z.string(), z.unknown()).optional(),
  isProfileComplete: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;