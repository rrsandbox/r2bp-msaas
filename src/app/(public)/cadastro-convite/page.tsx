import { acceptTenantInviteAction } from "@/app/(public)/cadastro-convite/actions";
import { Button } from "@/ui/components/button";

type InviteSignupPageProps = {
  searchParams?: Promise<{ token?: string; error?: string }>;
};

export default async function InviteSignupPage({ searchParams }: InviteSignupPageProps) {
  const params = searchParams ? await searchParams : undefined;

  return (
    <main className="app-shell flex flex-1 items-center py-10">
      <div className="mx-auto w-full max-w-2xl glass-panel rounded-[4px] p-8">
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Convite da tenant</span>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Concluir cadastro pelo convite</h1>
        <p className="mt-4 text-base leading-7 text-muted">
          Depois do cadastro, voce recebera confirmacao por e-mail e sera redirecionado para completar o perfil no primeiro acesso.
        </p>

        {params?.error ? (
          <div className="mt-6 rounded-[4px] border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{params.error}</div>
        ) : null}

        <form action={acceptTenantInviteAction} className="mt-8 grid gap-4">
          <input type="hidden" name="token" value={params?.token ?? ""} />
          <label className="flex flex-col gap-2 text-sm">
            Nome completo
            <input name="name" type="text" className="h-12 rounded-[4px] border border-border bg-surface-elevated px-4" required />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            Senha
            <input name="password" type="password" className="h-12 rounded-[4px] border border-border bg-surface-elevated px-4" required />
          </label>
          <Button type="submit">Criar conta</Button>
        </form>
      </div>
    </main>
  );
}