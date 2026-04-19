import { createTenantSchema, tenantLegalProfileSchema, updateTenantSchema } from "@/lib/validation/tenant/tenant.schema";

describe("tenant schema PF/PJ", () => {
  it("accepts PF legal profile on create", () => {
    const parsed = createTenantSchema.safeParse({
      name: "Cliente PF",
      slug: "cliente-pf",
      legalProfile: {
        personType: "PF",
        qualification: {
          fullName: "Maria Souza",
          document: {
            type: "CPF",
            number: "12345678901",
          },
          birthDate: "1990-02-10",
          email: "maria@example.com",
          phone: "11999990000",
          occupation: "Engenheira",
        },
      },
      billingProfile: {
        contactEmail: "maria@example.com",
      },
      adminProfile: {
        personType: "PF",
      },
    });

    expect(parsed.success).toBe(true);
  });

  it("accepts PJ with legal representative", () => {
    const parsed = tenantLegalProfileSchema.safeParse({
      personType: "PJ",
      qualification: {
        corporateName: "Acme LTDA",
        tradeName: "Acme",
        document: {
          type: "CNPJ",
          number: "12345678000199",
        },
        email: "contato@acme.com",
        phone: "1133330000",
        mainActivity: "Tecnologia",
      },
      legalRepresentative: {
        fullName: "Joao Silva",
        document: {
          type: "CPF",
          number: "98765432100",
        },
        birthDate: "1987-05-15",
        email: "joao@acme.com",
        phone: "11998887777",
        occupation: "Administrador",
      },
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects PJ without legal representative", () => {
    const parsed = tenantLegalProfileSchema.safeParse({
      personType: "PJ",
      qualification: {
        corporateName: "Acme LTDA",
        document: {
          type: "CNPJ",
          number: "12345678000199",
        },
        email: "contato@acme.com",
        phone: "1133330000",
        mainActivity: "Tecnologia",
      },
    });

    expect(parsed.success).toBe(false);
  });

  it("keeps legalProfile optional on update", () => {
    const parsed = updateTenantSchema.safeParse({
      status: "inactive",
    });

    expect(parsed.success).toBe(true);
  });
});
