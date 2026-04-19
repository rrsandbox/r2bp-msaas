import { prisma } from "@/infra/db/prisma";
import { requireAuth } from "@/lib/auth/authorization";
import type { AuthContext } from "@/lib/auth/authorization";
import { isInfrastructureUnavailableError } from "@/lib/errors/infrastructure";
import { listNavigationByArea } from "@/lib/navigation/runtime-navigation";

type DashboardStats = {
  tenantCount: number;
  userCount: number;
  queuedJobsCount: number;
  todayEventsCount: number;
  openTasksCount: number;
  openTicketsCount: number;
};

type DashboardData = {
  stats: DashboardStats;
  notices: Array<{
    id: string;
    title: string;
    message: string;
    tenantId: string | null;
    createdAt: Date;
  }>;
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    type: string;
    tenantName: string | null;
  }>;
  recentTickets: Array<{
    id: string;
    subject: string;
    status: string;
    priority: string;
  }>;
  warning?: string;
};

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

async function getDashboardData(context: AuthContext): Promise<DashboardData> {
  try {
    const canReadTasks = context.role !== "USER";
    const tenantWhere = context.role === "SUPER_ADMIN" ? {} : { id: context.tenantId };
    const membershipWhere = context.role === "SUPER_ADMIN" ? {} : { tenantId: context.tenantId };
    const jobsWhere = context.role === "SUPER_ADMIN" ? {} : { tenantId: context.tenantId };
    const agendaWhere = context.role === "SUPER_ADMIN" ? {} : { tenantId: context.tenantId };

    const dayStart = startOfDay(new Date());
    const nextDayStart = new Date(dayStart);
    nextDayStart.setDate(nextDayStart.getDate() + 1);

    const [tenantCount, userCount, queuedJobsCount, todayEventsCount, openTasksCount, openTicketsCount, notices, recentTasks, recentTickets] = await Promise.all([
      prisma.tenant.count({ where: tenantWhere }),
      prisma.tenantMembership.count({ where: membershipWhere }),
      prisma.backgroundJob.count({
        where: {
          ...jobsWhere,
          status: {
            in: ["PENDING", "PROCESSING"],
          },
        },
      }),
      prisma.agendaEvent.count({
        where: {
          ...agendaWhere,
          startsAt: {
            gte: dayStart,
            lt: nextDayStart,
          },
        },
      }),
      canReadTasks
        ? prisma.administrativeTask.count({
            where: {
              ...(context.role === "SUPER_ADMIN" ? {} : { tenantId: context.tenantId }),
              status: {
                in: ["OPEN", "IN_PROGRESS"],
              },
            },
          })
        : Promise.resolve(0),
      prisma.supportTicket.count({
        where: {
          ...(context.role === "SUPER_ADMIN"
            ? {}
            : context.role === "ADMIN"
              ? { tenantId: context.tenantId }
              : { tenantId: context.tenantId, requesterId: context.userId }),
          status: {
            in: ["OPEN", "IN_PROGRESS"],
          },
        },
      }),
      prisma.systemNotice.findMany({
        where: {
          isActive: true,
          OR: [{ tenantId: null }, { tenantId: context.tenantId }],
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      canReadTasks
        ? prisma.administrativeTask.findMany({
            where: {
              ...(context.role === "SUPER_ADMIN" ? {} : { tenantId: context.tenantId }),
            },
            orderBy: { createdAt: "desc" },
            take: 4,
            select: {
              id: true,
              title: true,
              status: true,
              type: true,
              tenant: {
                select: {
                  name: true,
                },
              },
            },
          })
        : Promise.resolve([]),
      prisma.supportTicket.findMany({
        where: {
          ...(context.role === "SUPER_ADMIN"
            ? {}
            : context.role === "ADMIN"
              ? { tenantId: context.tenantId }
              : { tenantId: context.tenantId, requesterId: context.userId }),
        },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: {
          id: true,
          subject: true,
          status: true,
          priority: true,
        },
      }),
    ]);

    return {
      stats: {
        tenantCount,
        userCount,
        queuedJobsCount,
        todayEventsCount,
        openTasksCount,
        openTicketsCount,
      },
      notices,
      recentTasks: recentTasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        type: task.type,
        tenantName: task.tenant?.name ?? null,
      })),
      recentTickets,
    };
  } catch (error) {
    if (isInfrastructureUnavailableError(error)) {
      return {
        stats: {
          tenantCount: 0,
          userCount: 0,
          queuedJobsCount: 0,
          todayEventsCount: 0,
          openTasksCount: 0,
          openTicketsCount: 0,
        },
        notices: [],
        recentTasks: [],
        recentTickets: [],
        warning: "Banco de dados ainda nao configurado. Defina DATABASE_URL, rode migrations e seed.",
      };
    }

    throw error;
  }
}

export default async function DashboardPage() {
  const context = await requireAuth();
  const { stats, notices, recentTasks, recentTickets, warning } = await getDashboardData(context);
  const availableShortcuts = await listNavigationByArea(context, "dashboard");

  const metrics =
    context.role === "SUPER_ADMIN"
      ? [
          { label: "Tenants ativos", value: String(stats.tenantCount).padStart(2, "0") },
          { label: "Usuarios monitorados", value: String(stats.userCount).padStart(2, "0") },
          { label: "Jobs em fila", value: String(stats.queuedJobsCount).padStart(2, "0") },
          { label: "Eventos hoje", value: String(stats.todayEventsCount).padStart(2, "0") },
          { label: "Atividades abertas", value: String(stats.openTasksCount).padStart(2, "0") },
          { label: "Tickets abertos", value: String(stats.openTicketsCount).padStart(2, "0") },
        ]
      : context.role === "ADMIN"
        ? [
            { label: "Usuarios do tenant", value: String(stats.userCount).padStart(2, "0") },
            { label: "Jobs em fila", value: String(stats.queuedJobsCount).padStart(2, "0") },
            { label: "Eventos hoje", value: String(stats.todayEventsCount).padStart(2, "0") },
            { label: "Atividades abertas", value: String(stats.openTasksCount).padStart(2, "0") },
            { label: "Tickets abertos", value: String(stats.openTicketsCount).padStart(2, "0") },
          ]
        : [
            { label: "Meus eventos hoje", value: String(stats.todayEventsCount).padStart(2, "0") },
            { label: "Meus tickets abertos", value: String(stats.openTicketsCount).padStart(2, "0") },
          ];

  return (
    <main className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="glass-panel rounded-[4px] p-6">
        <h2 className="text-3xl font-semibold tracking-tight">Dashboard operacional</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
          Visao inicial do tenant com indicadores principais, onboarding tecnico e pontos de extensao para agentes,
          auditoria, feature flags e observabilidade.
        </p>

        {warning ? <div className="mt-6 rounded-[4px] border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{warning}</div> : null}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map((metric) => (
            <article key={metric.label} className="rounded-[4px] border border-border/70 bg-surface-elevated p-5">
              <p className="text-sm text-muted">{metric.label}</p>
              <p className="mt-3 text-3xl font-semibold">{metric.value}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">Avisos do sistema</h3>
            <div className="mt-4 grid gap-3">
              {notices.length === 0 ? (
                <article className="rounded-[4px] border border-border/70 bg-surface-contrast/65 p-4 text-sm text-muted">Nenhum aviso ativo no momento.</article>
              ) : (
                notices.map((notice) => (
                  <article key={notice.id} className="rounded-[4px] border border-border/70 bg-surface-contrast/65 p-4 text-sm">
                    <p className="font-medium text-foreground">{notice.title}</p>
                    <p className="mt-1 text-muted">{notice.message}</p>
                  </article>
                ))
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">Suporte e tickets</h3>
            <div className="mt-4 grid gap-3">
              {recentTickets.length === 0 ? (
                <article className="rounded-[4px] border border-border/70 bg-surface-elevated p-4 text-sm text-muted">Nenhum ticket recente.</article>
              ) : (
                recentTickets.map((ticket) => (
                  <article key={ticket.id} className="rounded-[4px] border border-border/70 bg-surface-elevated p-4 text-sm">
                    <p className="font-medium text-foreground">{ticket.subject}</p>
                    <p className="mt-1 text-muted">{ticket.status} • {ticket.priority}</p>
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-[4px] p-6">
        <h2 className="text-xl font-semibold">Rotinas operacionais</h2>
        <div className="mt-6 grid gap-3">
          {availableShortcuts.length === 0 ? (
            <article className="rounded-[4px] border border-border/70 bg-surface-contrast/65 p-4 text-sm text-muted">
              Nenhuma rotina operacional disponivel para o seu perfil neste tenant.
            </article>
          ) : (
            availableShortcuts.map((item) => (
              <a key={item.href} href={item.href} className="rounded-[4px] border border-border/70 bg-surface-elevated p-4 text-sm transition-colors hover:bg-surface-muted/75 hover:border-border cursor-pointer">
                <p className="font-medium text-foreground">{item.label}</p>
                {item.description ? <p className="mt-1 text-muted">{item.description}</p> : null}
              </a>
            ))
          )}
        </div>

        <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.14em] text-muted">Fundacoes ativas</h3>
        <ul className="mt-6 grid gap-3 text-sm text-muted">
          <li className="rounded-[4px] border border-border/70 bg-surface-contrast/65 p-4">Prisma schema com tenant, user, 2FA, agenda, audit, flags e jobs</li>
          <li className="rounded-[4px] border border-border/70 bg-surface-elevated p-4">Jest configurado para UI e regras compartilhadas</li>
          <li className="rounded-[4px] border border-border/70 bg-surface-contrast/65 p-4">Theme provider e design tokens com modo claro/escuro</li>
          <li className="rounded-[4px] border border-border/70 bg-surface-elevated p-4">Catalogo de rotinas operacionais dinamico por permissao</li>
        </ul>

        {context.role !== "USER" ? (
          <>
            <h3 className="mt-8 text-sm font-semibold uppercase tracking-[0.14em] text-muted">Task list recente</h3>
            <div className="mt-4 grid gap-3 text-sm text-muted">
              {recentTasks.length === 0 ? (
                <article className="rounded-[4px] border border-border/70 bg-surface-contrast/65 p-4">Nenhuma atividade registrada recentemente.</article>
              ) : (
                recentTasks.map((task) => (
                  <article key={task.id} className="rounded-[4px] border border-border/70 bg-surface-elevated p-4">
                    <p className="font-medium text-foreground">{task.title}</p>
                    <p className="mt-1">{task.type} • {task.status}</p>
                    {task.tenantName ? <p className="mt-1 text-xs">Tenant: {task.tenantName}</p> : null}
                  </article>
                ))
              )}
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}