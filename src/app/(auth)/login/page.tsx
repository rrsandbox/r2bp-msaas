import Link from "next/link";

import { loginAction } from "@/app/(auth)/login/actions";
import { Button } from "@/ui/components/button";

type LoginPageProps = {
  searchParams?: Promise<{ error?: string; success?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const error = params?.error;
  const success = params?.success;

  const successMessage =
    success === "invite-accepted"
      ? "Cadastro concluido. Entre para completar seu perfil."
      : success === "password-reset-requested"
        ? "Se a conta existir, o link de redefinicao foi enviado por e-mail."
        : success === "password-reset-done"
          ? "Senha atualizada com sucesso."
          : success === "account-deleted"
            ? "Conta desativada e anonimizada com sucesso."
            : undefined;

  return (
    <main className="app-shell flex flex-1 items-center py-10">
      <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="glass-panel rounded-[4px] p-8">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Acesso seguro</span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Entrar no workspace</h1>
          <p className="mt-4 text-base leading-7 text-muted">
            Fluxo ativo com Auth.js, 2FA por e-mail, trusted browser e controle de tentativas por credencial e IP.
          </p>

          {error ? (
            <div className="mt-6 rounded-[4px] border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{error}</div>
          ) : null}

          {successMessage ? (
            <div className="mt-6 rounded-[4px] border border-success/40 bg-success/10 p-4 text-sm text-success">{successMessage}</div>
          ) : null}

          <form action={loginAction} className="mt-8 flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm">
              E-mail
              <input
                name="email"
                type="email"
                placeholder="voce@empresa.com"
                className="h-12 rounded-[4px] border border-border bg-surface-elevated px-4 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Senha
              <input
                name="password"
                type="password"
                placeholder="********"
                className="h-12 rounded-[4px] border border-border bg-surface-elevated px-4 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
            </label>
            <Button type="submit">Continuar</Button>
          </form>

          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <Link href="/cadastro-tenant" className="font-medium text-primary">Cadastrar tenant</Link>
            <Link href="/esqueci-senha" className="font-medium text-primary">Esqueci minha senha</Link>
          </div>
        </section>

        <section className="glass-panel rounded-[4px] p-8">
          <h2 className="text-2xl font-semibold">Fluxo de autenticacao preparado</h2>
          <div className="mt-6 grid gap-4 text-sm text-muted sm:grid-cols-2">
            <div className="rounded-[4px] border border-border/70 bg-surface-contrast/70 p-5">1. Auth.js com Prisma Adapter</div>
            <div className="rounded-[4px] border border-border/70 bg-surface-elevated p-5">2. Codigo 2FA com TTL por tenant</div>
            <div className="rounded-[4px] border border-border/70 bg-surface-contrast/70 p-5">3. Trusted browser por fingerprint + TTL</div>
            <div className="rounded-[4px] border border-border/70 bg-surface-elevated p-5">4. Rate limit e bloqueio por brute force</div>
          </div>
          <p className="mt-6 text-sm text-muted">
            O login agora usa server action, dispara 2FA quando necessario e segue para o dashboard apos validacao.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <Link href="/" className="inline-flex font-medium text-primary">Voltar para a landing</Link>
            <Link href="/cadastro-tenant" className="inline-flex font-medium text-primary">Solicitar tenant</Link>
          </div>
        </section>
      </div>
    </main>
  );
}