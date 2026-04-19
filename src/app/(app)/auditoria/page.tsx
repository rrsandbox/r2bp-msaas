import Link from "next/link";

import { runAuditRetentionAction } from "@/app/(app)/auditoria/actions";
import { requireAuth } from "@/lib/auth/authorization";
import { isInfrastructureUnavailableError } from "@/lib/errors/infrastructure";
import { listAuditEvents, summarizeAuditEvents } from "@/modules/audit/application/audit-service";
import { Badge, Button, Card, CardBody, CardHeader, DataTable, DataTableBody, DataTableCell, DataTableHead, DataTableHeader, DataTableRow, EmptyState, Filter, FilterGroup, PageHeader, SearchBox } from "@/ui/components";

type AuditoriaSearchParams = {
  page?: string;
  pageSize?: string;
  action?: string;
  resource?: string;
  userId?: string;
  severity?: string;
  from?: string;
  to?: string;
  success?: string;
  error?: string;
  deleted?: string;
  eligible?: string;
  dryRun?: string;
};

type AuditoriaPageProps = {
  searchParams?: Promise<AuditoriaSearchParams>;
};

function readPositiveInt(raw: string | undefined, fallback: number, max = 10000) {
  const parsed = Number(raw ?? fallback);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.trunc(parsed), max);
}

function readDate(raw: string | undefined) {
  if (!raw) return undefined;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function readSeverity(raw: string | undefined): "INFO" | "WARNING" | "CRITICAL" | undefined {
  if (!raw) return undefined;
  if (raw === "INFO" || raw === "WARNING" || raw === "CRITICAL") return raw;
  return undefined;
}

function badgeVariant(severity: string) {
  if (severity === "CRITICAL") return "danger" as const;
  if (severity === "WARNING") return "warning" as const;
  return "info" as const;
}

function mergeQuery(current: URLSearchParams, updates: Record<string, string | undefined>) {
  const next = new URLSearchParams(current.toString());

  for (const [key, value] of Object.entries(updates)) {
    if (!value) {
      next.delete(key);
      continue;
    }

    next.set(key, value);
  }

  const query = next.toString();
  return query ? `/auditoria?${query}` : "/auditoria";
}

export default async function AuditoriaPage({ searchParams }: AuditoriaPageProps) {
  const params = searchParams ? await searchParams : {};
  const context = await requireAuth("audit:read");

  const page = readPositiveInt(params.page, 1);
  const pageSize = readPositiveInt(params.pageSize, 20, 100);
  const action = params.action?.trim() || undefined;
  const resource = params.resource?.trim() || undefined;
  const userId = params.userId?.trim() || undefined;
  const severity = readSeverity(params.severity);
  const from = readDate(params.from);
  const to = readDate(params.to);

  const baseQuery = new URLSearchParams();
  baseQuery.set("page", String(page));
  baseQuery.set("pageSize", String(pageSize));
  if (action) baseQuery.set("action", action);
  if (resource) baseQuery.set("resource", resource);
  if (userId) baseQuery.set("userId", userId);
  if (severity) baseQuery.set("severity", severity);
  if (from) baseQuery.set("from", from.toISOString());
  if (to) baseQuery.set("to", to.toISOString());

  const exportHref = `/api/audit/logs/export?${baseQuery.toString()}`;

  try {
    const [logs, summary] = await Promise.all([
      listAuditEvents({
        tenantId: context.tenantId,
        page,
        pageSize,
        action,
        resource,
        userId,
        severity,
        from,
        to,
      }),
      summarizeAuditEvents({
        tenantId: context.tenantId,
        from,
        to,
      }),
    ]);

    return (
      <>
        <PageHeader
          title="Auditoria e logs de uso"
          description="Monitore eventos de seguranca, trilha operacional e exporte evidencias para compliance."
        />

        {params.success === "retention" ? (
          <div className="mb-6 rounded-[4px] border border-success/40 bg-success/10 p-4 text-sm text-success">
            Retencao executada. Elegiveis: {params.eligible ?? "0"} • Removidos: {params.deleted ?? "0"} • Dry-run: {params.dryRun ?? "false"}
          </div>
        ) : null}

        {params.error ? (
          <div className="mb-6 rounded-[4px] border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{params.error}</div>
        ) : null}

        <main className="grid gap-6">
          <Card>
            <CardHeader title="Filtros de auditoria" description="Refine por periodo, acao, recurso, usuario e severidade." />
            <CardBody className="grid gap-4">
              <form className="grid gap-3" method="get">
                <Filter>
                  <FilterGroup label="Acao">
                    <SearchBox name="action" defaultValue={action} placeholder="Ex: ACCESS_DENIED" className="w-56" />
                  </FilterGroup>
                  <FilterGroup label="Recurso">
                    <SearchBox name="resource" defaultValue={resource} placeholder="Ex: tenant:update" className="w-56" />
                  </FilterGroup>
                  <FilterGroup label="Usuario (ID)">
                    <SearchBox name="userId" defaultValue={userId} placeholder="UUID do usuario" className="w-64" />
                  </FilterGroup>
                  <FilterGroup label="Severidade">
                    <select name="severity" defaultValue={severity ?? ""} className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
                      <option value="">Todas</option>
                      <option value="INFO">INFO</option>
                      <option value="WARNING">WARNING</option>
                      <option value="CRITICAL">CRITICAL</option>
                    </select>
                  </FilterGroup>
                  <FilterGroup label="De (ISO)">
                    <input name="from" defaultValue={params.from ?? ""} className="h-10 rounded-lg border border-border bg-background px-3 text-sm" placeholder="2026-04-01T00:00:00.000Z" />
                  </FilterGroup>
                  <FilterGroup label="Ate (ISO)">
                    <input name="to" defaultValue={params.to ?? ""} className="h-10 rounded-lg border border-border bg-background px-3 text-sm" placeholder="2026-04-30T23:59:59.000Z" />
                  </FilterGroup>
                  <FilterGroup label="Page size">
                    <input name="pageSize" type="number" min={1} max={100} defaultValue={String(pageSize)} className="h-10 w-24 rounded-lg border border-border bg-background px-3 text-sm" />
                  </FilterGroup>
                </Filter>

                <input type="hidden" name="page" value="1" />

                <div className="flex flex-wrap gap-3">
                  <Button type="submit">Aplicar filtros</Button>
                  <Button asChild variant="secondary">
                    <Link href="/auditoria">Limpar filtros</Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <a href={exportHref}>Exportar CSV</a>
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
            <Card>
              <CardHeader title="Eventos de auditoria" description={`Total: ${logs.total} eventos`} />
              <CardBody>
                {logs.items.length === 0 ? (
                  <EmptyState title="Sem eventos para os filtros aplicados" description="Ajuste periodo/filtros para ampliar a consulta." />
                ) : (
                  <DataTable>
                    <DataTableHeader>
                      <DataTableRow hoverable={false}>
                        <DataTableHead>Data</DataTableHead>
                        <DataTableHead>Acao</DataTableHead>
                        <DataTableHead>Recurso</DataTableHead>
                        <DataTableHead>Severidade</DataTableHead>
                        <DataTableHead>Usuario</DataTableHead>
                      </DataTableRow>
                    </DataTableHeader>
                    <DataTableBody>
                      {logs.items.map((item) => (
                        <DataTableRow key={item.id}>
                          <DataTableCell>{item.createdAt.toLocaleString("pt-BR")}</DataTableCell>
                          <DataTableCell>
                            <div className="font-medium">{item.action}</div>
                            <div className="text-xs text-muted">ID: {item.id}</div>
                          </DataTableCell>
                          <DataTableCell>{item.resource}</DataTableCell>
                          <DataTableCell>
                            <Badge variant={badgeVariant(item.severity)}>{item.severity}</Badge>
                          </DataTableCell>
                          <DataTableCell>
                            {item.user ? (
                              <>
                                <div>{item.user.name ?? "Sem nome"}</div>
                                <div className="text-xs text-muted">{item.user.email}</div>
                              </>
                            ) : (
                              <span className="text-muted">Sem usuario</span>
                            )}
                          </DataTableCell>
                        </DataTableRow>
                      ))}
                    </DataTableBody>
                  </DataTable>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Button variant="secondary" size="sm" asChild>
                    <a
                      href={mergeQuery(baseQuery, {
                        page: page > 1 ? String(page - 1) : "1",
                      })}
                    >
                      Pagina anterior
                    </a>
                  </Button>
                  <span className="text-sm text-muted">Pagina {logs.page} de {logs.totalPages}</span>
                  <Button variant="secondary" size="sm" asChild>
                    <a
                      href={mergeQuery(baseQuery, {
                        page: String(Math.min(logs.totalPages, page + 1)),
                      })}
                    >
                      Proxima pagina
                    </a>
                  </Button>
                </div>
              </CardBody>
            </Card>

            <div className="grid gap-6">
              <Card>
                <CardHeader title="Resumo por severidade" description="Distribuicao dos eventos no periodo filtrado." />
                <CardBody className="grid gap-3">
                  {summary.bySeverity.length === 0 ? (
                    <p className="text-sm text-muted">Sem dados para o periodo atual.</p>
                  ) : (
                    summary.bySeverity.map((item) => (
                      <div key={item.severity} className="flex items-center justify-between rounded-[4px] border border-border bg-surface-muted px-3 py-2">
                        <Badge variant={badgeVariant(item.severity)}>{item.severity}</Badge>
                        <span className="text-sm font-semibold">{item.count}</span>
                      </div>
                    ))
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Top acoes" description="Acoes mais frequentes no periodo." />
                <CardBody className="grid gap-2">
                  {summary.topActions.length === 0 ? (
                    <p className="text-sm text-muted">Sem dados para o periodo atual.</p>
                  ) : (
                    summary.topActions.map((item) => (
                      <div key={item.action} className="flex items-center justify-between rounded-[4px] border border-border bg-surface-muted px-3 py-2 text-sm">
                        <span className="font-medium">{item.action}</span>
                        <span className="text-muted">{item.count}</span>
                      </div>
                    ))
                  )}
                </CardBody>
              </Card>

              {context.role === "SUPER_ADMIN" ? (
                <Card>
                  <CardHeader title="Retencao automatizada" description="Remove logs antigos para controle de custo e compliance." />
                  <CardBody>
                    <form action={runAuditRetentionAction} className="grid gap-3">
                      <label className="text-sm">
                        Dias de retencao
                        <input
                          name="retentionDays"
                          type="number"
                          min={1}
                          max={3650}
                          defaultValue={180}
                          className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                        />
                      </label>

                      <label className="text-sm">
                        Tenant alvo (opcional)
                        <input
                          name="targetTenantId"
                          className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                          placeholder="UUID do tenant para retencao seletiva"
                        />
                      </label>

                      <label className="inline-flex items-center gap-2 text-sm text-muted">
                        <input type="checkbox" name="dryRun" defaultChecked className="size-4 rounded border-border bg-background" />
                        Executar em modo simulacao (nao remove registros)
                      </label>

                      <label className="inline-flex items-center gap-2 text-sm text-muted">
                        <input type="checkbox" name="confirmDelete" className="size-4 rounded border-border bg-background" />
                        Confirmo a execucao destrutiva quando dry-run estiver desativado
                      </label>

                      <label className="text-sm">
                        Motivo da retencao destrutiva
                        <textarea
                          name="reason"
                          minLength={10}
                          className="mt-1 min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          placeholder="Ex: politica de retencao semestral de compliance"
                        />
                      </label>

                      <Button type="submit" variant="secondary">Executar retencao</Button>
                    </form>
                  </CardBody>
                </Card>
              ) : null}
            </div>
          </section>
        </main>
      </>
    );
  } catch (error) {
    if (isInfrastructureUnavailableError(error)) {
      return (
        <>
          <PageHeader title="Auditoria e logs de uso" description="Monitore eventos de seguranca e operacao do microSaaS." />
          <div className="rounded-[4px] border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
            Banco de dados ainda nao configurado. Defina DATABASE_URL, rode migrations e seed.
          </div>
        </>
      );
    }

    throw error;
  }
}
