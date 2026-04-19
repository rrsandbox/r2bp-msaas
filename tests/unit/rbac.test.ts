import { hasPermission, rolePermissions } from "@/config/rbac";

describe("rbac matrix", () => {
  it("grants global capabilities only to SUPER_ADMIN", () => {
    expect(hasPermission("SUPER_ADMIN", "tenant:read")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "tenant:update")).toBe(true);
    expect(hasPermission("SUPER_ADMIN", "support:read")).toBe(true);

    expect(hasPermission("ADMIN", "tenant:read")).toBe(true);
    expect(hasPermission("ADMIN", "tenant:update")).toBe(true);
    expect(hasPermission("ADMIN", "notice:read")).toBe(true);
  });

  it("keeps tenant admin features out of USER", () => {
    expect(hasPermission("USER", "invite:create")).toBe(false);
    expect(hasPermission("USER", "task:read")).toBe(false);
    expect(hasPermission("USER", "user:update")).toBe(false);
  });

  it("allows USER self-service scope", () => {
    expect(hasPermission("USER", "agenda:read")).toBe(true);
    expect(hasPermission("USER", "agenda:write")).toBe(true);
    expect(hasPermission("USER", "profile:read")).toBe(true);
    expect(hasPermission("USER", "profile:update")).toBe(true);
    expect(hasPermission("USER", "support:write")).toBe(true);
    expect(hasPermission("USER", "notice:read")).toBe(true);
  });

  it("does not contain duplicated permissions in role matrix", () => {
    const duplicates = Object.entries(rolePermissions)
      .map(([role, permissions]) => ({
        role,
        duplicated: permissions.filter((permission, index) => permissions.indexOf(permission) !== index),
      }))
      .filter((entry) => entry.duplicated.length > 0);

    expect(duplicates).toEqual([]);
  });
});
