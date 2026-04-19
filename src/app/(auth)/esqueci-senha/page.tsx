import Link from "next/link";

import { requestPasswordResetAction } from "@/app/(auth)/esqueci-senha/actions";
import { Button } from "@/ui/components/button";

type ForgotPasswordPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const params = searchParams ? await searchParams : undefined;

  return (
    <main className="app-shell flex flex-1 items-center justify-center py-10">
      <div className="w-full max-w-xl glass-panel rounded-[4px] p-8">
        <h1 className="text-3xl font-semibold tracking-tight">Esqueci minha senha</h1>
        <p className="mt-3 text-sm leading-7 text-muted">Informe seu e-mail. Se a conta existir, enviaremos um link seguro para redefinicao.</p>

        {params?.error ? (
          <div className="mt-6 rounded-[4px] border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{params.error}</div>
        ) : null}

        <form action={requestPasswordResetAction} className="mt-8 grid gap-4">
          <label className="flex flex-col gap-2 text-sm">
            E-mail
            <input name="email" type="email" className="h-12 rounded-[4px] border border-border bg-surface-elevated px-4" required />
          </label>
          <Button type="submit">Enviar link</Button>
        </form>

        <Link href="/login" className="mt-6 inline-flex text-sm font-medium text-primary">Voltar para login</Link>
      </div>
    </main>
  );
}