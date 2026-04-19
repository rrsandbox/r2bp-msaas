import { passwordSchema } from "@/lib/validation/auth/password.schema";

describe("password policy", () => {
  it("accepts a strong password", () => {
    const parsed = passwordSchema.safeParse("SenhaForte@123");

    expect(parsed.success).toBe(true);
  });

  it("rejects password without uppercase", () => {
    const parsed = passwordSchema.safeParse("senhaforte@123");

    expect(parsed.success).toBe(false);
  });

  it("rejects password without special char", () => {
    const parsed = passwordSchema.safeParse("SenhaForte123");

    expect(parsed.success).toBe(false);
  });
});
