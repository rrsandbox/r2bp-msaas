import Link from "next/link";

import { registerTenantPreSignupAction } from "@/app/(public)/cadastro-tenant/actions";
import { Button } from "@/ui/components/button";

type TenantSignupPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function TenantSignupPage({ searchParams }: TenantSignupPageProps) {
  const params = searchParams ? await searchParams : undefined;

  return (
    <main className="app-shell flex flex-1 items-center py-10">
      <div className="grid w-full gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section className="glass-panel rounded-[4px] p-8">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Pre-cadastro de tenant</span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Solicitar acesso administrativo</h1>
          <p className="mt-4 text-base leading-7 text-muted">
            O super usuario da tenant envia o pre-cadastro, entra na fila de aprovacao do sistema e recebe e-mail quando o acesso for liberado.
          </p>

          {params?.error ? (
            <div className="mt-6 rounded-[4px] border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{params.error}</div>
          ) : null}

          <form action={registerTenantPreSignupAction} className="mt-8 grid gap-4">
            <label className="flex flex-col gap-2 text-sm">
              E-mail administrativo
              <input name="email" type="email" className="h-12 rounded-[4px] border border-border bg-surface-elevated px-4" required />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Senha inicial
              <input name="password" type="password" className="h-12 rounded-[4px] border border-border bg-surface-elevated px-4" required />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Nome desejado da tenant
              <input name="tenantName" type="text" className="h-12 rounded-[4px] border border-border bg-surface-elevated px-4" />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Slug sugerido
              <input name="tenantSlug" type="text" className="h-12 rounded-[4px] border border-border bg-surface-elevated px-4" />
            </label>
            <Button type="submit">Enviar para aprovacao</Button>
          </form>
        </section>

        <section className="glass-panel rounded-[4px] p-8">
          <h2 className="text-2xl font-semibold">Como o fluxo funciona</h2>
          <ol className="mt-6 grid gap-4 text-sm text-muted">
            <li className="rounded-[4px] border border-border/70 bg-surface-contrast/70 p-5">1. Voce envia o pre-cadastro do tenant.</li>
            <li className="rounded-[4px] border border-border/70 bg-surface-elevated p-5">2. O super usuario do sistema aprova ou rejeita a solicitacao.</li>
            <li className="rounded-[4px] border border-border/70 bg-surface-contrast/70 p-5">3. Apos aprovacao, o acesso e liberado por e-mail.</li>
            <li className="rounded-[4px] border border-border/70 bg-surface-elevated p-5">4. No primeiro login, voce completa os dados juridicos, administrativos e financeiros da tenant.</li>
          </ol>
          <Link href="/login" className="mt-6 inline-flex text-sm font-medium text-primary">Voltar para login</Link>
        </section>
      </div>
    </main>
  );
}