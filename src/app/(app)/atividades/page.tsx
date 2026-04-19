import { prisma } from "@/infra/db/prisma";
import { requireAuth } from "@/lib/auth/authorization";
import { listTenantRegistrationRequests } from "@/modules/auth/application/tenant-onboarding-service";
import { listAdministrativeTasks } from "@/modules/system/application/admin-task-service";
import { approveTenantRegistrationAction, rejectTenantRegistrationAction, updateTaskStatusAction } from "@/app/(app)/atividades/actions";
import { Badge, Button, Card, CardBody, CardHeader, PageHeader } from "@/ui/components";

type ActivitiesPageProps = {
  searchParams?: Promise<{ success?: string; error?: string }>;
};

export default async function AtividadesPage({ searchParams }: ActivitiesPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const context = await requireAuth("task:read");
  const canReviewRegistrations = context.role === "SUPER_ADMIN";
  const [tasks, registrations] = await Promise.all([
    listAdministrativeTasks({ role: context.role, tenantId: context.tenantId, userId: context.userId }),
    canReviewRegistrations ? listTenantRegistrationRequests(context) : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeader
        title="Lista de atividades"
        description="Fila administrativa com aprovacoes, onboarding, tickets e demais pendencias operacionais."
      />

      {params?.success ? (
        <div className="mb-6 rounded-[4px] border border-success/40 bg-success/10 p-4 text-sm text-success">Operacao concluida com sucesso.</div>
      ) : null}

      {params?.error ? (
        <div className="mb-6 rounded-[4px] border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{params.error}</div>
      ) : null}

      <main className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader title="Pendencias administrativas" description="Atividades geradas pelo sistema e pelas tenants." />
          <CardBody className="grid gap-4">
            {tasks.length === 0 ? (
              <div className="rounded-[4px] border border-border bg-surface-muted p-4 text-sm text-muted">Nenhuma atividade pendente no momento.</div>
            ) : (
              tasks.map((task) => (
                <article key={task.id} className="rounded-[4px] border border-border bg-surface-elevated p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{task.title}</p>
                      <p className="mt-1 text-sm text-muted">{task.description ?? "Sem descricao adicional."}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={task.status === "COMPLETED" ? "success" : task.status === "IN_PROGRESS" ? "warning" : "info"}>{task.status}</Badge>
                      <Badge variant="info">{task.type}</Badge>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted">
                    <span>Tenant: {task.tenant?.name ?? "Sistema"}</span>
                    <span>Criada em {task.createdAt.toLocaleDateString("pt-BR")}</span>
                    {task.assignedTo ? <span>Responsavel: {task.assignedTo.name ?? task.assignedTo.email}</span> : null}
                  </div>
                  <form action={updateTaskStatusAction} className="mt-4 flex flex-wrap items-center gap-3">
                    <input type="hidden" name="taskId" value={task.id} />
                    <select name="status" defaultValue={task.status} className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="DISMISSED">Dismissed</option>
                    </select>
                    <Button type="submit" variant="secondary">Atualizar</Button>
                  </form>
                </article>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Aprovacoes de tenant" description="Solicitacoes de novos tenants aguardando revisao do sistema." />
          <CardBody className="grid gap-4">
            {!canReviewRegistrations ? (
              <div className="rounded-[4px] border border-border bg-surface-muted p-4 text-sm text-muted">A fila global de aprovacao e exclusiva do super usuario do sistema.</div>
            ) : registrations.length === 0 ? (
              <div className="rounded-[4px] border border-border bg-surface-muted p-4 text-sm text-muted">Nenhum pre-cadastro de tenant aguardando revisao.</div>
            ) : (
              registrations.map((registration) => (
                <article key={registration.id} className="rounded-[4px] border border-border bg-surface-elevated p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{registration.email}</p>
                      <p className="mt-1 text-sm text-muted">Tenant sugerido: {registration.requestedTenantName ?? "Nao informado"}</p>
                    </div>
                    <Badge variant={registration.status === "PENDING_APPROVAL" ? "warning" : registration.status === "APPROVED" ? "success" : "danger"}>{registration.status}</Badge>
                  </div>
                  <p className="mt-3 text-xs text-muted">Criado em {registration.createdAt.toLocaleDateString("pt-BR")}</p>
                  {registration.status === "PENDING_APPROVAL" ? (
                    <div className="mt-4 grid gap-3">
                      <form action={approveTenantRegistrationAction}>
                        <input type="hidden" name="registrationId" value={registration.id} />
                        <Button type="submit">Aprovar cadastro</Button>
                      </form>
                      <form action={rejectTenantRegistrationAction} className="grid gap-3">
                        <input type="hidden" name="registrationId" value={registration.id} />
                        <textarea name="reviewNotes" placeholder="Motivo da rejeicao" className="min-h-24 rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                        <Button type="submit" variant="secondary" className="border-danger/40 text-danger hover:bg-danger/10">Rejeitar cadastro</Button>
                      </form>
                    </div>
                  ) : null}
                </article>
              ))
            )}
          </CardBody>
        </Card>
      </main>
    </>
  );
}