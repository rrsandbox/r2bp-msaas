import { type RoleKey } from "@prisma/client";
import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role?: RoleKey;
      tenantId?: string;
      tenantName?: string;
      tenantSlug?: string;
      tenantStatus?: string;
      tenantOnboardingStatus?: string;
      userStatus?: string;
      isProfileComplete?: boolean;
      requiresTwoFactor?: boolean;
    };
  }

  interface User {
    role?: RoleKey;
    tenantId?: string;
    tenantName?: string;
    tenantSlug?: string;
    tenantStatus?: string;
    tenantOnboardingStatus?: string;
    userStatus?: string;
    isProfileComplete?: boolean;
    requiresTwoFactor?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: RoleKey;
    tenantId?: string;
    tenantName?: string;
    tenantSlug?: string;
    tenantStatus?: string;
    tenantOnboardingStatus?: string;
    userStatus?: string;
    isProfileComplete?: boolean;
    requiresTwoFactor?: boolean;
  }
}