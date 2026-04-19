import { type RoleKey } from "@prisma/client";

export const rolePermissions: Record<RoleKey, string[]> = {
  SUPER_ADMIN: ["*"],
  ADMIN: [
    "tenant:read",
    "tenant:update",
    "tenant:onboarding",
    "user:read",
    "user:create",
    "user:update",
    "invite:read",
    "invite:create",
    "invite:update",
    "agenda:read",
    "agenda:write",
    "audit:read",
    "feature-flag:read",
    "access:read",
    "access:write",
    "profile:read",
    "profile:update",
    "task:read",
    "support:read",
    "support:write",
    "notice:read",
  ],
  USER: ["agenda:read", "agenda:write", "profile:read", "profile:update", "support:read", "support:write", "notice:read"],
};

export function hasPermission(role: RoleKey, permission: string) {
  const permissions = rolePermissions[role] ?? [];
  return permissions.includes("*") || permissions.includes(permission);
}