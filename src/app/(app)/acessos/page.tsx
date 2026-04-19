import { requireAuth } from "@/lib/auth/authorization";
import { isInfrastructureUnavailableError } from "@/lib/errors/infrastructure";
import { listUsers } from "@/modules/user/application/user-service";
import { listAccessFeatures, listUserFeaturePermissions } from "@/modules/access/application/access-service";
import {
  createAccessFeatureAction,
  setUserFeaturePermissionAction,
  updateAccessFeatureAction,
} from "@/app/(app)/acessos/actions";
import { AccessFlashToast } from "@/app/(app)/acessos/access-flash-toast";
import { DeleteAccessFeatureButton } from "@/app/(app)/acessos/delete-access-feature-button";
import { DeleteAccessPermissionButton } from "@/app/(app)/acessos/delete-access-permission-button";

type AcessosPageProps = {
  searchParams?: Promise<{
    success?: string;
    error?: string;
  }>;
};

type FeatureItem = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  route?: string | null;
  showInMenu?: boolean;
  showInDashboard?: boolean;
  sortOrder?: number;
  enabled: boolean;
};

type UserItem = {
  userId: string;
  name: string | null;
  email: string;
  role: string;
};

type PermissionItem = {
  id: string;
  userName: string | null;
  userEmail: string;
  featureName: string;
  featureKey: string;
  canAccess: boolean;
  featureEnabled: boolean;
};

async function getAccessData(): Promise<{
  features: FeatureItem[];
  users: UserItem[];
  permissions: PermissionItem[];
  role: string;
  warning?: string;
}> {
  try {
    const context = await requireAuth("access:read");
    const [features, users, permissions] = await Promise.all([
      listAccessFeatures({
        role: context.role,
        tenantId: context.tenantId,
      }),
      listUsers({
        role: context.role,
        tenantId: context.tenantId,
        userId: context.userId,
      }),
      listUserFeaturePermissions({
        role: context.role,
        tenantId: context.tenantId,
      }),
    ]);

    return {
      features,
      users,
      permissions,
      role: context.role,
    };
  } catch (error) {
    if (isInfrastructureUnavailableError(error)) {
      return {
        features: [],
        users: [],
        permissions: [],
        role: "USER",
        warning: "Banco de dados ainda nao configurado. Defina DATABASE_URL, rode migrations e seed.",
      };
    }

    throw error;
  }
}

export default async function AcessosPage({ searchParams }: AcessosPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const successCode = params?.success;
  const errorMessage = params?.error;

  const successMessage =
    successCode === "feature-created"
      ? "Feature de acesso criada com sucesso."
      : successCode === "feature-updated"
        ? "Feature de acesso atualizada com sucesso."
        : successCode === "feature-deleted"
          ? "Feature de acesso removida com sucesso."
      : successCode === "permission-updated"
        ? "Permissao de usuario atualizada com sucesso."
        : successCode === "permission-deleted"
          ? "Permissao de usuario removida com sucesso."
        : undefined;

  const { features, users, permissions, role, warning } = await getAccessData();
  const canManageFeatures = role === "SUPER_ADMIN";

  return (
    <>
      {successMessage ? <AccessFlashToast kind="success" message={successMessage} /> : null}
      {errorMessage ? <AccessFlashToast kind="error" message={errorMessage} /> : null}

      <main className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="glass-panel rounded-[4px] p-6">
          <h2 className="text-2xl font-semibold tracking-tight">{canManageFeatures ? "Cadastro de features de acesso" : "Features de acesso"}</h2>
          <p className="mt-2 text-sm text-muted">{canManageFeatures ? "Cadastre as funcionalidades que podem ser liberadas por tenant e usuario." : "Features disponíveis para atribuição de permissões aos usuários do tenant."}</p>

          {warning ? <div className="mt-6 rounded-[4px] border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{warning}</div> : null}

          {canManageFeatures ? (
            <form action={createAccessFeatureAction} className="mt-6 grid gap-3 rounded-[4px] border border-border bg-surface-muted p-4">
            <input type="hidden" name="returnTo" value="/acessos" />
            <label className="flex flex-col gap-2 text-sm">
              Chave da feature
              <input name="key" className="h-11 rounded-[4px] border border-border bg-surface-elevated px-3 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Ex: crm:contatos" required />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Nome de exibicao
              <input name="name" className="h-11 rounded-[4px] border border-border bg-surface-elevated px-3 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Ex: CRM - Contatos" required />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Descricao
              <input name="description" className="h-11 rounded-[4px] border border-border bg-surface-elevated px-3 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Opcional" />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Rota da feature
              <input name="route" className="h-11 rounded-[4px] border border-border bg-surface-elevated px-3 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Ex: /agenda" />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Ordem de exibicao
              <input name="sortOrder" type="number" min={0} max={9999} defaultValue={100} className="h-11 rounded-[4px] border border-border bg-surface-elevated px-3 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" name="showInMenu" className="size-4 rounded border-border bg-background" />
              Exibir no menu principal
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" name="showInDashboard" className="size-4 rounded border-border bg-background" />
              Exibir como rotina no dashboard
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" name="enabled" defaultChecked className="size-4 rounded border-border bg-background" />
              Feature ativa
            </label>
            <button className="h-11 w-fit rounded-[4px] bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">Cadastrar feature</button>
          </form>
          ) : null}

          <div className="mt-6 grid gap-3">
            {features.length === 0 ? (
              <article className="rounded-[4px] bg-surface-elevated p-4 text-sm text-muted">Nenhuma feature cadastrada.</article>
            ) : (
              features.map((feature) => (
                <article key={feature.id} className="rounded-[4px] bg-surface-elevated p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold">{feature.name}</h3>
                      <p className="text-xs text-muted">{feature.key}</p>
                    </div>
                    <span className="rounded-[4px] bg-surface-muted px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-primary">
                      {feature.enabled ? "Ativa" : "Inativa"}
                    </span>
                  </div>

                  <form action={updateAccessFeatureAction} className="mt-3 grid gap-2 rounded-[4px] bg-surface-muted p-3">
                    {canManageFeatures ? (
                      <>
                    <input type="hidden" name="returnTo" value="/acessos" />
                    <input type="hidden" name="featureId" value={feature.id} />
                    <label className="flex flex-col gap-1 text-xs text-muted">
                      Nome
                      <input name="name" defaultValue={feature.name} className="h-10 rounded-[4px] border border-border bg-surface-elevated px-3 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" required />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-muted">
                      Descricao
                      <input name="description" defaultValue={feature.description ?? ""} className="h-10 rounded-[4px] border border-border bg-surface-elevated px-3 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-muted">
                      Rota
                      <input name="route" defaultValue={feature.route ?? ""} className="h-10 rounded-[4px] border border-border bg-surface-elevated px-3 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Ex: /agenda" />
                    </label>
                    <label className="flex flex-col gap-1 text-xs text-muted">
                      Ordem
                      <input
                        name="sortOrder"
                        type="number"
                        min={0}
                        max={9999}
                        defaultValue={String(feature.sortOrder ?? 100)}
                        className="h-10 rounded-[4px] border border-border bg-surface-elevated px-3 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs text-muted">
                      <input type="checkbox" name="showInMenu" defaultChecked={Boolean(feature.showInMenu)} className="size-4 rounded border-border bg-background" />
                      Exibir no menu
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs text-muted">
                      <input
                        type="checkbox"
                        name="showInDashboard"
                        defaultChecked={Boolean(feature.showInDashboard)}
                        className="size-4 rounded border-border bg-background"
                      />
                      Exibir no dashboard
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs text-muted">
                      <input type="checkbox" name="enabled" defaultChecked={feature.enabled} className="size-4 rounded border-border bg-background" />
                      Feature ativa
                    </label>
                    <button className="h-9 w-fit rounded-[4px] border border-primary/40 px-4 text-xs font-medium text-primary transition-colors hover:bg-primary/10">Salvar feature</button>
                      </>
                    ) : (
                      <p className="text-xs text-muted py-1">Somente o administrador do sistema pode editar features.</p>
                    )}
                  </form>

                  {canManageFeatures ? (
                  <div className="mt-3">
                    <DeleteAccessFeatureButton featureId={feature.id} featureName={feature.name} returnTo="/acessos" />
                  </div>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </section>

        <section className="glass-panel rounded-[4px] p-6">
          <h2 className="text-2xl font-semibold tracking-tight">Permissao por usuario</h2>
          <p className="mt-2 text-sm text-muted">Associe cada feature a usuarios do tenant com granularidade operacional.</p>

          <form action={setUserFeaturePermissionAction} className="mt-6 grid gap-3 rounded-[4px] border border-border bg-surface-muted p-4">
            <input type="hidden" name="returnTo" value="/acessos" />

            <label className="flex flex-col gap-2 text-sm">
              Usuario
              <select name="userId" className="h-11 rounded-[4px] border border-border bg-surface-elevated px-3 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" required>
                <option value="">Selecione um usuario</option>
                {users.map((user) => (
                  <option key={user.userId} value={user.userId}>{user.name ?? user.email} ({user.role})</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              Feature
              <select name="featureId" className="h-11 rounded-[4px] border border-border bg-surface-elevated px-3 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" required>
                <option value="">Selecione uma feature</option>
                {features.map((feature) => (
                  <option key={feature.id} value={feature.id}>{feature.name} ({feature.key})</option>
                ))}
              </select>
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" name="canAccess" defaultChecked className="size-4 rounded border-border bg-background" />
              Permitir acesso
            </label>

            <button className="h-11 w-fit rounded-[4px] border border-primary/40 px-5 text-sm font-medium text-primary transition-colors hover:bg-primary/10">Salvar permissao</button>
          </form>

          <div className="mt-6 grid gap-3">
            {permissions.length === 0 ? (
              <article className="rounded-[4px] bg-surface-elevated p-4 text-sm text-muted">Nenhuma permissao personalizada registrada.</article>
            ) : (
              permissions.map((permission) => (
                <article key={permission.id} className="rounded-[4px] bg-surface-elevated p-4">
                  <p className="text-sm font-medium">{permission.userName ?? "Sem nome"} ({permission.userEmail})</p>
                  <p className="mt-1 text-xs text-muted">Feature: {permission.featureName} ({permission.featureKey})</p>
                  <p className="mt-2 text-sm text-muted">
                    Status de acesso: {permission.canAccess ? "Permitido" : "Bloqueado"} • Feature {permission.featureEnabled ? "ativa" : "inativa"}
                  </p>
                  <div className="mt-3">
                    <DeleteAccessPermissionButton
                      permissionId={permission.id}
                      userLabel={permission.userName ?? permission.userEmail}
                      featureLabel={permission.featureName}
                      returnTo="/acessos"
                    />
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </main>
    </>
  );
}
