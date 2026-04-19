import { prisma } from "@/infra/db/prisma";
import { requireAuth } from "@/lib/auth/authorization";
import { listSupportTickets } from "@/modules/support/application/support-service";
import { createSupportTicketAction, updateSupportTicketAction } from "@/app/(app)/suporte/actions";
import { Badge, Button, Card, CardBody, CardFooter, CardHeader, FormField, PageHeader } from "@/ui/components";

type SupportPageProps = {
  searchParams?: Promise<{ success?: string; error?: string }>;
};

export default async function SuportePage({ searchParams }: SupportPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const context = await requireAuth("support:read");
  const [tickets, users] = await Promise.all([
    listSupportTickets({ role: context.role, tenantId: context.tenantId, userId: context.userId }),
    context.role === "USER"
      ? Promise.resolve([])
      : prisma.tenantMembership.findMany({
          where: { tenantId: context.tenantId },
          select: { user: { select: { id: true, name: true, email: true } } },
        }),
  ]);

  return (
    <>
      <PageHeader title="Suporte" description="Abra tickets, acompanhe tratativas e mantenha o controle operacional das demandas." />

      {params?.success ? (
        <div className="mb-6 rounded-[4px] border border-success/40 bg-success/10 p-4 text-sm text-success">Ticket processado com sucesso.</div>
      ) : null}
      {params?.error ? (
        <div className="mb-6 rounded-[4px] border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{params.error}</div>
      ) : null}

      <main className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader title="Abrir ticket" description="Canal de suporte interno por tenant." />
          <form action={createSupportTicketAction}>
            <CardBody className="grid gap-4">
              <FormField label="Assunto" required>
                <input name="subject" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
              </FormField>
              <FormField label="Prioridade" required>
                <select name="priority" defaultValue="MEDIUM" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </FormField>
              <FormField label="Descricao" required>
                <textarea name="description" className="min-h-32 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
              </FormField>
            </CardBody>
            <CardFooter>
              <Button type="submit">Abrir ticket</Button>
            </CardFooter>
          </form>
        </Card>

        <Card>
          <CardHeader title="Tickets em andamento" description="Usuarios comuns veem apenas os tickets proprios; administradores veem o tenant inteiro." />
          <CardBody className="grid gap-4">
            {tickets.length === 0 ? (
              <div className="rounded-[4px] border border-border bg-surface-muted p-4 text-sm text-muted">Nenhum ticket registrado.</div>
            ) : (
              tickets.map((ticket) => (
                <article key={ticket.id} className="rounded-[4px] border border-border bg-surface-elevated p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{ticket.subject}</p>
                      <p className="mt-1 text-sm text-muted">{ticket.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={ticket.status === "RESOLVED" || ticket.status === "CLOSED" ? "success" : ticket.status === "IN_PROGRESS" ? "warning" : "info"}>{ticket.status}</Badge>
                      <Badge variant={ticket.priority === "CRITICAL" ? "danger" : ticket.priority === "HIGH" ? "warning" : "info"}>{ticket.priority}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-muted">
                    Solicitante: {ticket.requester.name ?? ticket.requester.email}
                    {ticket.assignee ? ` • Responsavel: ${ticket.assignee.name ?? ticket.assignee.email}` : " • Sem responsavel definido"}
                  </div>
                  {context.role !== "USER" ? (
                    <form action={updateSupportTicketAction} className="mt-4 grid gap-3 md:grid-cols-2">
                      <input type="hidden" name="ticketId" value={ticket.id} />
                      <select name="status" defaultValue={ticket.status} className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
                        <option value="OPEN">Open</option>
                        <option value="IN_PROGRESS">In progress</option>
                        <option value="RESOLVED">Resolved</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                      <select name="priority" defaultValue={ticket.priority} className="h-10 rounded-lg border border-border bg-background px-3 text-sm">
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="CRITICAL">Critical</option>
                      </select>
                      <select name="assigneeId" defaultValue={ticket.assigneeId ?? ""} className="h-10 rounded-lg border border-border bg-background px-3 text-sm md:col-span-2">
                        <option value="">Sem responsavel</option>
                        {users.map((membership) => (
                          <option key={membership.user.id} value={membership.user.id}>
                            {membership.user.name ?? membership.user.email}
                          </option>
                        ))}
                      </select>
                      <textarea name="resolution" defaultValue={ticket.resolution ?? ""} placeholder="Observacoes da tratativa" className="min-h-24 rounded-lg border border-border bg-background px-3 py-2 text-sm md:col-span-2" />
                      <Button type="submit" variant="secondary">Atualizar ticket</Button>
                    </form>
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