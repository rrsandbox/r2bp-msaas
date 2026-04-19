import { PrismaClient, RoleKey, UserStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = "ChangeMe123!";
  const tenant = await prisma.tenant.upsert({
    where: { slug: "sistema" },
    update: {},
    create: {
      slug: "sistema",
      name: "Sistema",
      settings: {
        create: {
          locale: "pt-BR",
          timezone: "America/Sao_Paulo",
        },
      },
    },
  });

  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const masterUser = await prisma.user.upsert({
    where: { email: "master@r2bp.local" },
    update: {},
    create: {
      email: "master@r2bp.local",
      name: "Master User",
      passwordHash,
      status: UserStatus.ACTIVE,
      twoFactorEnabled: true,
      trustedQuestion: "Deseja confiar neste navegador?",
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@sistema.local" },
    update: {
      name: "Admin Sistema",
      status: UserStatus.ACTIVE,
      twoFactorEnabled: false,
    },
    create: {
      email: "admin@sistema.local",
      name: "Admin Sistema",
      passwordHash,
      status: UserStatus.ACTIVE,
      twoFactorEnabled: false,
    },
  });

  await prisma.tenantMembership.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: masterUser.id,
      },
    },
    update: { role: RoleKey.SUPER_ADMIN },
    create: {
      tenantId: tenant.id,
      userId: masterUser.id,
      role: RoleKey.SUPER_ADMIN,
    },
  });

  await prisma.tenantMembership.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: adminUser.id,
      },
    },
    update: { role: RoleKey.ADMIN },
    create: {
      tenantId: tenant.id,
      userId: adminUser.id,
      role: RoleKey.ADMIN,
    },
  });

  // Usuário comum para smoke test de isolamento
  const commonUser = await prisma.user.upsert({
    where: { email: "user@sistema.local" },
    update: {
      name: "Usuario Comum",
      status: UserStatus.ACTIVE,
    },
    create: {
      email: "user@sistema.local",
      name: "Usuario Comum",
      passwordHash,
      status: UserStatus.ACTIVE,
      twoFactorEnabled: false,
    },
  });

  await prisma.tenantMembership.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: commonUser.id,
      },
    },
    update: { role: RoleKey.USER },
    create: {
      tenantId: tenant.id,
      userId: commonUser.id,
      role: RoleKey.USER,
    },
  });

  console.log("[seed] user:", commonUser.email, "(role: USER, 2FA: disabled)");

  await prisma.featureFlag.upsert({
    where: {
      tenantId_key: {
        tenantId: tenant.id,
        key: "billing.enabled",
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      key: "billing.enabled",
      enabled: false,
      description: "Estrutura preparada, sem ativacao em producao.",
    },
  });

  const accessFeatureKeys = ["access:read", "access:write", "agenda:read", "agenda:write"];
  const seededAccessFeatures: Array<{ id: string; key: string }> = [];
  let seededAgendaEventId: string | null = null;

  try {
    for (const key of accessFeatureKeys) {
      const feature = await prisma.accessFeature.upsert({
        where: {
          tenantId_key: {
            tenantId: tenant.id,
            key,
          },
        },
        update: {
          enabled: true,
        },
        create: {
          tenantId: tenant.id,
          key,
          name: key,
          description: `Feature seeded para ${key}`,
          enabled: true,
        },
        select: {
          id: true,
          key: true,
        },
      });

      seededAccessFeatures.push(feature);

      await prisma.userFeaturePermission.upsert({
        where: {
          tenantId_userId_featureId: {
            tenantId: tenant.id,
            userId: adminUser.id,
            featureId: feature.id,
          },
        },
        update: {
          canAccess: true,
        },
        create: {
          tenantId: tenant.id,
          userId: adminUser.id,
          featureId: feature.id,
          canAccess: true,
        },
      });
    }

    const seededStartsAt = new Date("2026-04-18T10:00:00.000Z");
    const seededEndsAt = new Date("2026-04-18T11:00:00.000Z");

    let seededAgendaEvent = await prisma.agendaEvent.findFirst({
      where: {
        tenantId: tenant.id,
        ownerId: adminUser.id,
        title: "Reuniao Seeded",
        startsAt: seededStartsAt,
        endsAt: seededEndsAt,
      },
      select: {
        id: true,
      },
    });

    if (!seededAgendaEvent) {
      seededAgendaEvent = await prisma.agendaEvent.create({
        data: {
          tenantId: tenant.id,
          ownerId: adminUser.id,
          title: "Reuniao Seeded",
          description: "Evento base para smoke test da API.",
          startsAt: seededStartsAt,
          endsAt: seededEndsAt,
        },
        select: {
          id: true,
        },
      });
    }

    seededAgendaEventId = seededAgendaEvent.id;
  } catch (error) {
    const code = typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code)
      : "UNKNOWN";

    if (code !== "P2021") {
      throw error;
    }

    console.warn("[seed] Tabelas opcionais de access/agenda nao encontradas. Pulando este bloco.");
  }

  await prisma.auditLog.create({
    data: {
      tenantId: tenant.id,
      userId: masterUser.id,
      action: "SEED_EXECUTED",
      resource: "system",
      payload: {
        masterEmail: masterUser.email,
      },
    },
  });

  console.log("[seed] tenant:", tenant.slug, tenant.id);
  console.log("[seed] master:", masterUser.email, "(2FA: enabled)");
  console.log("[seed] admin:", adminUser.email, "(2FA: disabled)");
  console.log("[seed] admin password:", defaultPassword);
  console.log("[seed] admin userId:", adminUser.id);
  if (seededAgendaEventId) {
    console.log("[seed] seeded eventId:", seededAgendaEventId);
  }

  if (seededAccessFeatures.length > 0) {
    console.table(
      seededAccessFeatures.map((feature) => ({
        key: feature.key,
        featureId: feature.id,
      })),
    );
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });