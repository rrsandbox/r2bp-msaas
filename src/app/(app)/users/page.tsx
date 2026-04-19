import { requireAuth, type AuthContext } from "@/lib/auth/authorization";
import { isInfrastructureUnavailableError } from "@/lib/errors/infrastructure";
import { listTenantInvites } from "@/modules/auth/application/tenant-onboarding-service";
import { listTenants } from "@/modules/tenant/application/tenant-service";
import { listUsersPaginated } from "@/modules/user/application/user-service";
import { createTenantInviteAction, createUserAction, resendTenantInviteAction, updateUserAction } from "@/app/(app)/users/actions";
import { DeleteUserButton } from "@/app/(app)/users/delete-user-button";
import { UserFlashToast } from "@/app/(app)/users/user-flash-toast";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeader,
  DataTableRow,
  EmptyState,
  FilterGroup,
  FormField,
  FormSection,
  PageHeader,
  SearchBox,
} from "@/ui/components";

type UsersPageProps = {
  searchParams?: Promise<{
    tenantId?: string;
    query?: string;
    page?: string;
    success?: string;
    error?: string;
  }>;
};

type UserItem = {
  userId: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  tenantName: string;
};

type TenantFilterItem = {
  id: string;
  name: string;
};

type InviteItem = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
};

async function getUserData(
  context: AuthContext,
  filters: { tenantId?: string; query?: string; page?: number },
): Promise<{
  items: UserItem[];
  tenants: TenantFilterItem[];
  invites: InviteItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  warning?: string;
}> {
  try {
    const [result, tenants, invites] = await Promise.all([
      listUsersPaginated(
        {
          role: context.role,
          tenantId: context.tenantId,
          userId: context.userId,
        },
        {
          tenantId: filters.tenantId,
          query: filters.query,
        },
        {
          page: filters.page,
          pageSize: 10,
        },
      ),
      listTenants({
        role: context.role,
        tenantId: context.tenantId,
      }),
      listTenantInvites({
        role: context.role,
        tenantId: context.tenantId,
        userId: context.userId,
      }),
    ]);

    return {
      ...result,
      tenants: tenants.map((tenant) => ({
        id: tenant.id,
        name: tenant.name,
      })),
      invites: invites.map((invite) => ({
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        expiresAt: invite.expiresAt,
      })),
    };
  } catch (error) {
    if (isInfrastructureUnavailableError(error)) {
      return {
        items: [],
        tenants: [],
        invites: [],
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

function mapSuccessMessage(successCode?: string) {
  if (successCode === "created") return "Usuario criado com sucesso.";
  if (successCode === "updated") return "Usuario atualizado com sucesso.";
  if (successCode === "deleted") return "Usuario removido com sucesso.";
  if (successCode === "invite-created") return "Convite enviado com sucesso.";
  if (successCode === "invite-resent") return "Convite reenviado com sucesso.";
  return undefined;
}

function getBadgeVariant(status: string) {
  if (status === "ACTIVE" || status === "ACCEPTED") return "success" as const;
  if (status === "INVITED" || status === "PENDING" || status === "PENDING_APPROVAL") return "warning" as const;
  if (status === "INACTIVE" || status === "EXPIRED") return "info" as const;
  return "danger" as const;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const tenantFilter = params?.tenantId?.trim();
  const query = params?.query?.trim() ?? "";
  const pageParam = Number(params?.page ?? "1");
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const context = await requireAuth("user:read");
  const successMessage = mapSuccessMessage(params?.success);
  const canSelectTenant = context.role === "SUPER_ADMIN";
  const canManageTenantUsers = context.role !== "USER";
  const canDeleteUser = context.role === "SUPER_ADMIN";
  const { items, tenants, invites, warning, page: currentPage, totalPages, total } = await getUserData(context, {
    tenantId: tenantFilter,
    query,
    page,
  });

  const listQueryBase = new URLSearchParams();
  if (tenantFilter) listQueryBase.set("tenantId", tenantFilter);
  if (query) listQueryBase.set("query", query);
  const returnTo = listQueryBase.size > 0 ? `/users?${listQueryBase.toString()}` : "/users";

  function buildPageHref(targetPage: number) {
    const target = new URLSearchParams(listQueryBase);
    target.set("page", String(targetPage));
    return `/users?${target.toString()}`;
  }

  return (
    <>
      {successMessage ? <UserFlashToast kind="success" message={successMessage} /> : null}
      {params?.error ? <UserFlashToast kind="error" message={params.error} /> : null}

      <div className="grid gap-8">
        <PageHeader
          title="Gerenciamento de usuários"
          description="O super usuário do sistema gerencia todos os usuários; o super usuário da tenant convida, reenvia convite e desabilita usuários do próprio tenant."
        />

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {warning ? <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{warning}</div> : null}

            <Card>
              <CardBody className="!space-y-0">
                <form method="get" className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-3">
                  <div className="flex-1">
                    <FilterGroup label="Buscar usuário">
                      <SearchBox name="query" defaultValue={query} placeholder="Nome ou e-mail..." className="w-full" />
                    </FilterGroup>
                  </div>
                  {canSelectTenant ? (
                    <div className="w-40">
                      <FilterGroup label="Filtrar por tenant">
                        <select name="tenantId" defaultValue={tenantFilter ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30">
                          <option value="">Todos</option>
                          {tenants.map((tenant) => (
                            <option key={tenant.id} value={tenant.id}>
                              {tenant.name}
                            </option>
                          ))}
                        </select>
                      </FilterGroup>
                    </div>
                  ) : null}
                  <Button type="submit" variant="primary">Filtrar</Button>
                </form>
              </CardBody>
            </Card>

            {canSelectTenant ? (
              <Card>
                <CardHeader title="Novo usuário" description="Cadastro direto disponível apenas para administração global." />
                <form action={createUserAction}>
                  <CardBody className="space-y-4">
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <FormSection title="Informações básicas">
                      <FormField label="Nome completo" required>
                        <input type="text" name="name" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                      </FormField>
                      <FormField label="E-mail" required>
                        <input type="email" name="email" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                      </FormField>
                    </FormSection>
                    <FormSection title="Acesso">
                      <FormField label="Role" required>
                        <select name="role" defaultValue="USER" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required>
                          <option value="USER">Usuário</option>
                          <option value="ADMIN">Administrador</option>
                          <option value="SUPER_ADMIN">Super Admin</option>
                        </select>
                      </FormField>
                      <FormField label="Tenant" required>
                        <select name="tenantId" defaultValue={tenantFilter ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required>
                          <option value="">Selecione um tenant</option>
                          {tenants.map((tenant) => (
                            <option key={tenant.id} value={tenant.id}>
                              {tenant.name}
                            </option>
                          ))}
                        </select>
                      </FormField>
                      <FormField label="Senha (opcional)" hint="Sem senha, o usuário entra como convidado.">
                        <input type="password" name="password" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
                      </FormField>
                    </FormSection>
                  </CardBody>
                  <CardFooter>
                    <Button type="submit">Cadastrar usuário</Button>
                  </CardFooter>
                </form>
              </Card>
            ) : canManageTenantUsers ? (
              <Card>
                <CardHeader title="Convidar usuário da tenant" description="O convite é enviado por e-mail e o usuário conclui o cadastro em link próprio." />
                <form action={createTenantInviteAction}>
                  <CardBody className="space-y-4">
                    <input type="hidden" name="returnTo" value={returnTo} />
                    <FormField label="E-mail" required>
                      <input type="email" name="email" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                    </FormField>
                    <FormField label="Validade do convite" required>
                      <select name="expiresInDays" defaultValue="7" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required>
                        <option value="3">3 dias</option>
                        <option value="7">7 dias</option>
                        <option value="15">15 dias</option>
                        <option value="30">30 dias</option>
                      </select>
                    </FormField>
                  </CardBody>
                  <CardFooter>
                    <Button type="submit">Enviar convite</Button>
                  </CardFooter>
                </form>
              </Card>
            ) : null}

            <Card>
              <CardHeader title="Usuários" description={`Mostrando ${items.length} de ${total} usuário(s)`} />
              <CardBody className="!space-y-0">
                {items.length === 0 ? (
                  <EmptyState title="Nenhum usuário encontrado" description={query || tenantFilter ? "Tente ajustar seus filtros de busca" : "Crie ou convide o primeiro usuário usando o formulário acima."} />
                ) : (
                  <DataTable>
                    <DataTableHeader>
                      <tr className="border-b border-border bg-surface-muted">
                        <DataTableHead>Nome</DataTableHead>
                        <DataTableHead>E-mail</DataTableHead>
                        <DataTableHead align="center">Role</DataTableHead>
                        <DataTableHead align="center">Status</DataTableHead>
                        <DataTableHead>Tenant</DataTableHead>
                        <DataTableHead align="right">Ações</DataTableHead>
                      </tr>
                    </DataTableHeader>
                    <DataTableBody>
                      {items.map((user) => (
                        <DataTableRow key={user.userId}>
                          <DataTableCell>
                            <p className="font-medium text-foreground">{user.name ?? "—"}</p>
                          </DataTableCell>
                          <DataTableCell>
                            <code className="rounded bg-surface-muted px-2 py-1 text-xs text-muted">{user.email}</code>
                          </DataTableCell>
                          <DataTableCell align="center">
                            <Badge variant="info">{user.role}</Badge>
                          </DataTableCell>
                          <DataTableCell align="center">
                            <Badge variant={getBadgeVariant(user.status)}>{user.status}</Badge>
                          </DataTableCell>
                          <DataTableCell>
                            <span className="text-sm text-muted">{user.tenantName}</span>
                          </DataTableCell>
                          <DataTableCell align="right">
                            <div className="flex items-center justify-end gap-2">
                              {canManageTenantUsers && user.status !== "DELETED" ? (
                                <form action={updateUserAction}>
                                  <input type="hidden" name="returnTo" value={returnTo} />
                                  <input type="hidden" name="userId" value={user.userId} />
                                  <input type="hidden" name="status" value={user.status === "INACTIVE" ? "ACTIVE" : "INACTIVE"} />
                                  <Button type="submit" variant="secondary">{user.status === "INACTIVE" ? "Reativar" : "Desabilitar"}</Button>
                                </form>
                              ) : null}
                              {canDeleteUser ? <DeleteUserButton userId={user.userId} userLabel={user.name ?? user.email} returnTo={returnTo} /> : null}
                            </div>
                          </DataTableCell>
                        </DataTableRow>
                      ))}
                    </DataTableBody>
                  </DataTable>
                )}
              </CardBody>

              {items.length > 0 ? (
                <CardFooter className="border-t border-border">
                  <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <p className="text-xs text-muted">Página {currentPage} de {totalPages} • {total} usuário(s)</p>
                    <div className="flex items-center gap-2">
                      <a href={currentPage > 1 ? buildPageHref(currentPage - 1) : "#"} aria-disabled={currentPage <= 1} className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${currentPage <= 1 ? "pointer-events-none border-border/40 text-muted/50" : "border-border hover:bg-surface-muted"}`}>
                        ← Anterior
                      </a>
                      <a href={currentPage < totalPages ? buildPageHref(currentPage + 1) : "#"} aria-disabled={currentPage >= totalPages} className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${currentPage >= totalPages ? "pointer-events-none border-border/40 text-muted/50" : "border-border hover:bg-surface-muted"}`}>
                        Próxima →
                      </a>
                    </div>
                  </div>
                </CardFooter>
              ) : null}
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader title="Resumo" description="Estatísticas gerais" />
              <CardBody className="space-y-3">
                <div className="rounded-lg bg-surface-muted p-3">
                  <p className="text-xs text-muted">Total de usuários</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{total}</p>
                </div>
                <div className="rounded-lg bg-surface-muted p-3">
                  <p className="text-xs text-muted">Usuários ativos</p>
                  <p className="mt-1 text-lg font-semibold text-success">{items.filter((user) => user.status === "ACTIVE").length}</p>
                </div>
                <div className="rounded-lg bg-surface-muted p-3">
                  <p className="text-xs text-muted">Convites pendentes</p>
                  <p className="mt-1 text-lg font-semibold text-warning">{invites.filter((invite) => invite.status === "PENDING").length}</p>
                </div>
              </CardBody>
            </Card>

            {!canSelectTenant && canManageTenantUsers ? (
              <Card>
                <CardHeader title="Convites enviados" description="Reenvie o convite ou acompanhe o status do aceite." />
                <CardBody className="space-y-3">
                  {invites.length === 0 ? (
                    <div className="rounded-lg bg-surface-muted p-3 text-sm text-muted">Nenhum convite enviado ainda.</div>
                  ) : (
                    invites.map((invite) => (
                      <div key={invite.id} className="rounded-lg bg-surface-muted p-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-foreground">{invite.email}</p>
                          <Badge variant={getBadgeVariant(invite.status)}>{invite.status}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted">Role {invite.role} • expira em {invite.expiresAt.toLocaleDateString("pt-BR")}</p>
                        {invite.status === "PENDING" ? (
                          <form action={resendTenantInviteAction} className="mt-3">
                            <input type="hidden" name="returnTo" value={returnTo} />
                            <input type="hidden" name="inviteId" value={invite.id} />
                            <Button type="submit" variant="secondary">Reenviar convite</Button>
                          </form>
                        ) : null}
                      </div>
                    ))
                  )}
                </CardBody>
              </Card>
            ) : null}

            <Card>
              <CardHeader title="Navegação rápida" />
              <CardBody className="space-y-2">
                <a href="/tenants" className="flex flex-col gap-1 rounded-lg border border-border p-3 transition-colors hover:bg-surface-muted">
                  <p className="font-medium text-foreground">🏢 Tenants</p>
                  <p className="text-xs text-muted">Gerenciar clientes</p>
                </a>
                <a href="/acessos" className="flex flex-col gap-1 rounded-lg border border-border p-3 transition-colors hover:bg-surface-muted">
                  <p className="font-medium text-foreground">🔐 Acessos</p>
                  <p className="text-xs text-muted">Controlar permissões</p>
                </a>
                <a href="/suporte" className="flex flex-col gap-1 rounded-lg border border-border p-3 transition-colors hover:bg-surface-muted">
                  <p className="font-medium text-foreground">🎫 Suporte</p>
                  <p className="text-xs text-muted">Acompanhar tickets</p>
                </a>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}