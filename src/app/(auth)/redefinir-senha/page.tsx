import { resetPasswordAction } from "@/app/(auth)/redefinir-senha/actions";
import { Button } from "@/ui/components/button";

type ResetPasswordPageProps = {
  searchParams?: Promise<{ token?: string; error?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = searchParams ? await searchParams : undefined;

  return (
    <main className="app-shell flex flex-1 items-center justify-center py-10">
      <div className="w-full max-w-xl glass-panel rounded-[4px] p-8">
        <h1 className="text-3xl font-semibold tracking-tight">Redefinir senha</h1>
        <p className="mt-3 text-sm leading-7 text-muted">Defina uma nova senha para voltar ao sistema.</p>

        {params?.error ? (
          <div className="mt-6 rounded-[4px] border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{params.error}</div>
        ) : null}

        <form action={resetPasswordAction} className="mt-8 grid gap-4">
          <input type="hidden" name="token" value={params?.token ?? ""} />
          <label className="flex flex-col gap-2 text-sm">
            Nova senha
            <input name="password" type="password" className="h-12 rounded-[4px] border border-border bg-surface-elevated px-4" required />
          </label>
          <Button type="submit">Atualizar senha</Button>
        </form>
      </div>
    </main>
  );
}