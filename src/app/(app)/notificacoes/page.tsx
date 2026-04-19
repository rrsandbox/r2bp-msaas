import { prisma } from "@/infra/db/prisma";
import { requireAuth } from "@/lib/auth/authorization";
import { createNoticeAction } from "@/app/(app)/notificacoes/actions";
import { Badge, Button, Card, CardBody, CardFooter, CardHeader, FormField, PageHeader } from "@/ui/components";

type NotificationsPageProps = {
  searchParams?: Promise<{ success?: string; error?: string }>;
};

export default async function NotificacoesPage({ searchParams }: NotificationsPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const context = await requireAuth("notice:read");
  const notices = await prisma.systemNotice.findMany({
    where: {
      isActive: true,
      OR: [{ tenantId: null }, { tenantId: context.tenantId }],
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return (
    <>
      <PageHeader title="Avisos e notificacoes" description="Comunicados globais do sistema e avisos aplicados ao seu tenant." />

      {params?.success ? (
        <div className="mb-6 rounded-[4px] border border-success/40 bg-success/10 p-4 text-sm text-success">Aviso publicado com sucesso.</div>
      ) : null}
      {params?.error ? (
        <div className="mb-6 rounded-[4px] border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{params.error}</div>
      ) : null}

      <main className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader title="Feed de comunicados" description="Atualizacoes do sistema, manutencoes e avisos operacionais." />
          <CardBody className="grid gap-4">
            {notices.length === 0 ? (
              <div className="rounded-[4px] border border-border bg-surface-muted p-4 text-sm text-muted">Nenhum aviso ativo. O feed sera preenchido conforme o sistema e os tenants publicarem comunicados.</div>
            ) : (
              notices.map((notice) => (
                <article key={notice.id} className="rounded-[4px] border border-border bg-surface-elevated p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-foreground">{notice.title}</p>
                    <Badge variant={notice.tenantId ? "info" : "success"}>{notice.tenantId ? "TENANT" : "SISTEMA"}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted">{notice.message}</p>
                  <p className="mt-3 text-xs text-muted">Publicado em {notice.createdAt.toLocaleDateString("pt-BR")}</p>
                </article>
              ))
            )}
          </CardBody>
        </Card>

        {context.role === "SUPER_ADMIN" ? (
          <Card>
            <CardHeader title="Publicar aviso" description="Disponivel para o super usuario do sistema." />
            <form action={createNoticeAction}>
              <CardBody className="grid gap-4">
                <FormField label="Titulo" required>
                  <input name="title" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                </FormField>
                <FormField label="Escopo" required>
                  <select name="scope" defaultValue="system" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
                    <option value="system">Sistema</option>
                    <option value="tenant">Tenant atual</option>
                  </select>
                </FormField>
                <FormField label="Mensagem" required>
                  <textarea name="message" className="min-h-32 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" required />
                </FormField>
              </CardBody>
              <CardFooter>
                <Button type="submit">Publicar aviso</Button>
              </CardFooter>
            </form>
          </Card>
        ) : null}
      </main>
    </>
  );
}
