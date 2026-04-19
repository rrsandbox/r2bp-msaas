import { z } from "zod";

const documentNumberSchema = z.string().min(8).max(20);

const tenantPersonTypeSchema = z.enum(["PF", "PJ"]);

const pfQualificationSchema = z.object({
  fullName: z.string().min(2).max(160),
  document: z.object({
    type: z.literal("CPF"),
    number: documentNumberSchema,
  }),
  birthDate: z.string().min(10).max(10),
  email: z.email(),
  phone: z.string().min(8).max(30),
  occupation: z.string().min(2).max(120),
  identityDocument: z.string().min(3).max(40).optional(),
});

const pjQualificationSchema = z.object({
  corporateName: z.string().min(2).max(200),
  tradeName: z.string().min(2).max(160).optional(),
  document: z.object({
    type: z.literal("CNPJ"),
    number: documentNumberSchema,
  }),
  email: z.email(),
  phone: z.string().min(8).max(30),
  mainActivity: z.string().min(2).max(160),
});

export const tenantLegalProfileSchema = z.discriminatedUnion("personType", [
  z.object({
    personType: z.literal("PF"),
    qualification: pfQualificationSchema,
  }),
  z.object({
    personType: z.literal("PJ"),
    qualification: pjQualificationSchema,
    legalRepresentative: pfQualificationSchema,
  }),
]);

export const createTenantSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  legalProfile: tenantLegalProfileSchema,
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
  legalProfile: tenantLegalProfileSchema.optional(),
  billingProfile: z.record(z.string(), z.unknown()).optional(),
  adminProfile: z.record(z.string(), z.unknown()).optional(),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type TenantLegalProfileInput = z.infer<typeof tenantLegalProfileSchema>;
export type TenantPersonTypeInput = z.infer<typeof tenantPersonTypeSchema>;