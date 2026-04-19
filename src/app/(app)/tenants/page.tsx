import { requireAuth, type AuthContext } from "@/lib/auth/authorization";
import { isInfrastructureUnavailableError } from "@/lib/errors/infrastructure";
import { listTenantsPaginated } from "@/modules/tenant/application/tenant-service";
import { createTenantAction, updateTenantAction } from "@/app/(app)/tenants/actions";
import { TenantFlashToast } from "@/app/(app)/tenants/tenant-flash-toast";
import { DeleteTenantButton } from "@/app/(app)/tenants/delete-tenant-button";
import {
  TenantCreateForm,
  TenantEditForm,
  type TenantFormInitialValues,
} from "@/app/(app)/tenants/tenant-create-form";
import type { TenantLegalProfileInput } from "@/lib/validation/tenant/tenant.schema";
import {
  PageHeader,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  Badge,
  Button,
  SearchBox,
  EmptyState,
} from "@/ui/components";

type TenantsPageProps = {
  searchParams?: Promise<{
    query?: string;
    page?: string;
    success?: string;
    error?: string;
  }>;
};

type TenantItem = {
  id: string;
  name: string;
  slug: string;
  status: string;
  onboardingStatus?: string;
  personType: "PF" | "PJ" | "N/A";
  registrationId: string | null;
  legalProfile: TenantLegalProfileInput | null;
  admins: number;
  createdAt: Date;
};

function mapTenantToInitialValues(tenant: TenantItem): TenantFormInitialValues {
  const legalProfile = tenant.legalProfile;

  if (!legalProfile) {
    return {
      tenantId: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      personType: "PF",
    };
  }

  if (legalProfile.personType === "PF") {
    return {
      tenantId: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      personType: "PF",
      pfFullName: legalProfile.qualification.fullName,
      pfCpf: legalProfile.qualification.document.number,
      pfBirthDate: legalProfile.qualification.birthDate,
      pfEmail: legalProfile.qualification.email,
      pfPhone: legalProfile.qualification.phone,
      pfOccupation: legalProfile.qualification.occupation,
      pfIdentityDocument: legalProfile.qualification.identityDocument,
    };
  }

  return {
    tenantId: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    personType: "PJ",
    pjCorporateName: legalProfile.qualification.corporateName,
    pjTradeName: legalProfile.qualification.tradeName,
    pjCnpj: legalProfile.qualification.document.number,
    pjEmail: legalProfile.qualification.email,
    pjPhone: legalProfile.qualification.phone,
    pjMainActivity: legalProfile.qualification.mainActivity,
    repFullName: legalProfile.legalRepresentative.fullName,
    repCpf: legalProfile.legalRepresentative.document.number,
    repBirthDate: legalProfile.legalRepresentative.birthDate,
    repEmail: legalProfile.legalRepresentative.email,
    repPhone: legalProfile.legalRepresentative.phone,
    repOccupation: legalProfile.legalRepresentative.occupation,
    repIdentityDocument: legalProfile.legalRepresentative.identityDocument,
  };
}

async function getTenantItems(
  context: AuthContext,
  filters: { query?: string; page?: number },
): Promise<{
  items: TenantItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  warning?: string;
}> {
  try {
    const result = await listTenantsPaginated(
      {
        role: context.role,
        tenantId: context.tenantId,
      },
      {
        query: filters.query,
      },
      {
        page: filters.page,
        pageSize: 10,
      },
    );

    return {
      ...result,
    };
  } catch (error) {
    if (isInfrastructureUnavailableError(error)) {
      return {
        items: [],
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 1,
        warning: "Banco de dados ainda nao configurado. Defina DATABASE_URL, rode migrations e seed.",
      };
    }

    throw error;
  }
}

export default async function TenantsPage({ searchParams }: TenantsPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const query = params?.query?.trim() ?? "";
  const pageParam = Number(params?.page ?? "1");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const successCode = params?.success;
  const errorMessage = params?.error;

  const successMessage =
    successCode === "created"
      ? "Cliente (tenant) cadastrado com sucesso."
      : successCode === "updated"
        ? "Cliente (tenant) atualizado com sucesso."
        : successCode === "deleted"
          ? "Cliente (tenant) removido com sucesso."
          : undefined;

  const context = await requireAuth("tenant:read");
  const canCreateTenant = context.role === "SUPER_ADMIN";
  const canDeleteTenant = context.role === "SUPER_ADMIN";
  const { items, warning, page: currentPage, totalPages, total } = await getTenantItems(context, {
    query,
    page,
  });

  const listQueryBase = new URLSearchParams();
  if (query) {
    listQueryBase.set("query", query);
  }
  const returnTo = listQueryBase.size > 0 ? `/tenants?${listQueryBase.toString()}` : "/tenants";

  function buildPageHref(targetPage: number) {
    const params = new URLSearchParams(listQueryBase);
    params.set("page", String(targetPage));
    return `/tenants?${params.toString()}`;
  }

  function statusVariant(status: string) {
    if (status === "active") return "success" as const;
    if (status === "inactive") return "warning" as const;
    return "danger" as const;
  }

  function onboardingVariant(status?: string) {
    if (status === "COMPLETED") return "success" as const;
    if (status === "IN_PROGRESS") return "warning" as const;
    return "info" as const;
  }

  return (
    <>
      {successMessage ? <TenantFlashToast kind="success" message={successMessage} /> : null}
      {errorMessage ? <TenantFlashToast kind="error" message={errorMessage} /> : null}

      <div className="grid gap-8">
        <PageHeader
          title="Cadastro de Clientes"
          description="Gerencie todos os clientes (tenants) da plataforma. Crie novos, edite informações e configure acessos."
        />

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {warning && (
              <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
                {warning}
              </div>
            )}

            <Card>
              <CardBody className="!space-y-0">
                <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <SearchBox
                      name="query"
                      defaultValue={query}
                      placeholder="Buscar por nome ou slug..."
                      className="w-full"
                    />
                  </div>
                  <Button type="submit" variant="primary">
                    Filtrar
                  </Button>
                </form>
              </CardBody>
            </Card>

            {canCreateTenant ? (
              <Card>
                <CardHeader title="Novo Cliente" description="Adicione um novo cliente à plataforma" />
                <CardBody className="space-y-4">
                  <TenantCreateForm action={createTenantAction} returnTo={returnTo} />
                </CardBody>
              </Card>
            ) : null}

            <Card>
              <CardHeader
                title="Clientes"
                description={`Mostrando ${items.length} de ${total} cliente(s)`}
              />

              <CardBody className="!space-y-0">
                {items.length === 0 ? (
                  <EmptyState
                    title="Nenhum cliente encontrado"
                    description={
                      query
                        ? "Tente ajustar seus filtros de busca"
                        : "Crie o primeiro cliente usando o formulário acima"
                    }
                  />
                ) : (
                  <DataTable>
                    <DataTableHeader>
                      <tr className="border-b border-border bg-surface-muted">
                        <DataTableHead>Nome</DataTableHead>
                        <DataTableHead>Slug</DataTableHead>
                        <DataTableHead align="center">Tipo</DataTableHead>
                        <DataTableHead>Documento</DataTableHead>
                        <DataTableHead align="center">Status</DataTableHead>
                        <DataTableHead align="center">Onboarding</DataTableHead>
                        <DataTableHead align="center">Admins</DataTableHead>
                        <DataTableHead align="right">Data Criação</DataTableHead>
                        <DataTableHead align="right">Ações</DataTableHead>
                      </tr>
                    </DataTableHeader>
                    <DataTableBody>
                      {items.map((tenant) => (
                        <DataTableRow key={tenant.id}>
                          <DataTableCell>
                            <div>
                              <p className="font-medium text-foreground">{tenant.name}</p>
                            </div>
                          </DataTableCell>
                          <DataTableCell>
                            <code className="rounded bg-surface-muted px-2 py-1 text-xs text-muted">
                              {tenant.slug}
                            </code>
                          </DataTableCell>
                          <DataTableCell align="center">
                            <Badge variant={tenant.personType === "PJ" ? "info" : tenant.personType === "PF" ? "success" : "warning"}>
                              {tenant.personType}
                            </Badge>
                          </DataTableCell>
                          <DataTableCell>
                            <span className="text-xs text-muted">{tenant.registrationId ?? "-"}</span>
                          </DataTableCell>
                          <DataTableCell align="center">
                            <Badge variant={statusVariant(tenant.status)}>{tenant.status}</Badge>
                          </DataTableCell>
                          <DataTableCell align="center">
                            <Badge variant={onboardingVariant(tenant.onboardingStatus)}>{tenant.onboardingStatus ?? "PENDING"}</Badge>
                          </DataTableCell>
                          <DataTableCell align="center">
                            <span className="text-sm font-medium">{tenant.admins}</span>
                          </DataTableCell>
                          <DataTableCell align="right">
                            <span className="text-xs text-muted">
                              {tenant.createdAt.toLocaleDateString("pt-BR")}
                            </span>
                          </DataTableCell>
                          <DataTableCell align="right">
                            <div className="flex items-center justify-end gap-2">
                              <details className="relative">
                                <summary className="cursor-pointer rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-surface-muted">
                                  Editar
                                </summary>
                                <div className="absolute right-0 z-10 mt-2 w-[26rem] max-w-[80vw] rounded-xl border border-border bg-background p-4 shadow-lg">
                                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                    Editar cliente
                                  </p>
                                  <TenantEditForm
                                    action={updateTenantAction}
                                    returnTo={returnTo}
                                    initialValues={mapTenantToInitialValues(tenant)}
                                  />
                                </div>
                              </details>
                              {canDeleteTenant ? (
                                <form action={updateTenantAction}>
                                  <input type="hidden" name="returnTo" value={returnTo} />
                                  <input type="hidden" name="tenantId" value={tenant.id} />
                                  <input type="hidden" name="status" value={tenant.status === "inactive" ? "active" : "inactive"} />
                                  <Button type="submit" variant="secondary">
                                    {tenant.status === "inactive" ? "Ativar" : "Inativar"}
                                  </Button>
                                </form>
                              ) : null}
                              {canDeleteTenant && (
                                <DeleteTenantButton
                                  tenantId={tenant.id}
                                  tenantName={tenant.name}
                                  returnTo={returnTo}
                                />
                              )}
                            </div>
                          </DataTableCell>
                        </DataTableRow>
                      ))}
                    </DataTableBody>
                  </DataTable>
                )}
              </CardBody>

              {items.length > 0 && (
                <CardFooter className="border-t border-border">
                  <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <p className="text-xs text-muted">
                      Página {currentPage} de {totalPages} • {total} cliente(s)
                    </p>
                    <div className="flex items-center gap-2">
                      <a
                        href={currentPage > 1 ? buildPageHref(currentPage - 1) : "#"}
                        aria-disabled={currentPage <= 1}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                          currentPage <= 1
                            ? "pointer-events-none border-border/40 text-muted/50"
                            : "border-border hover:bg-surface-muted"
                        }`}
                      >
                        ← Anterior
                      </a>
                      <a
                        href={currentPage < totalPages ? buildPageHref(currentPage + 1) : "#"}
                        aria-disabled={currentPage >= totalPages}
                        className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                          currentPage >= totalPages
                            ? "pointer-events-none border-border/40 text-muted/50"
                            : "border-border hover:bg-surface-muted"
                        }`}
                      >
                        Próxima →
                      </a>
                    </div>
                  </div>
                </CardFooter>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader title="Resumo" description="Estatísticas gerais" />
              <CardBody className="space-y-3">
                <div className="rounded-lg bg-surface-muted p-3">
                  <p className="text-xs text-muted">Total de Clientes</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{total}</p>
                </div>
                <div className="rounded-lg bg-surface-muted p-3">
                  <p className="text-xs text-muted">Clientes Ativos</p>
                  <p className="mt-1 text-lg font-semibold text-success">
                    {items.filter((t) => t.status === "active").length}
                  </p>
                </div>
                <div className="rounded-lg bg-surface-muted p-3">
                  <p className="text-xs text-muted">Administradores Totais</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {items.reduce((sum, t) => sum + t.admins, 0)}
                  </p>
                </div>
                <div className="rounded-lg bg-surface-muted p-3">
                  <p className="text-xs text-muted">Onboarding Pendente</p>
                  <p className="mt-1 text-lg font-semibold text-warning">
                    {items.filter((t) => t.onboardingStatus !== "COMPLETED").length}
                  </p>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Módulos Rápidos" />
              <CardBody className="space-y-2">
                <a
                  href="/users"
                  className="flex flex-col gap-1 rounded-lg border border-border p-3 transition-colors hover:bg-surface-muted"
                >
                  <p className="font-medium text-foreground">👥 Usuários</p>
                  <p className="text-xs text-muted">Gerenciar usuários</p>
                </a>
                <a
                  href="/agenda"
                  className="flex flex-col gap-1 rounded-lg border border-border p-3 transition-colors hover:bg-surface-muted"
                >
                  <p className="font-medium text-foreground">📅 Agenda</p>
                  <p className="text-xs text-muted">Eventos operacionais</p>
                </a>
                <a
                  href="/acessos"
                  className="flex flex-col gap-1 rounded-lg border border-border p-3 transition-colors hover:bg-surface-muted"
                >
                  <p className="font-medium text-foreground">🔐 Acessos</p>
                  <p className="text-xs text-muted">Controle de permissões</p>
                </a>
                <a
                  href="/dashboard"
                  className="flex flex-col gap-1 rounded-lg border border-border p-3 transition-colors hover:bg-surface-muted"
                >
                  <p className="font-medium text-foreground">📊 Dashboard</p>
                  <p className="text-xs text-muted">Visão consolidada</p>
                </a>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
