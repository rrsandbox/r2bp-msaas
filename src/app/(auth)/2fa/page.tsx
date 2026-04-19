import Link from "next/link";

import { Button } from "@/ui/components/button";
import { verifyTwoFactorAction } from "@/app/(auth)/2fa/actions";

type TwoFactorPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function TwoFactorPage({ searchParams }: TwoFactorPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const error = params?.error;

  return (
    <main className="app-shell flex flex-1 items-center py-10">
      <div className="mx-auto grid w-full max-w-3xl gap-6">
        <section className="glass-panel rounded-[4px] p-8">
          <span className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Duplo fator</span>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Verificacao adicional</h1>
          <p className="mt-4 text-base leading-7 text-muted">
            Enviamos um codigo de seis digitos para seu e-mail. Informe o codigo para concluir o acesso.
          </p>

          {error ? (
            <div className="mt-6 rounded-[4px] border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{error}</div>
          ) : null}

          <form action={verifyTwoFactorAction} className="mt-8 flex flex-col gap-5">
            <label className="flex flex-col gap-2 text-sm">
              Codigo 2FA
              <input
                name="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                className="h-12 rounded-[4px] border border-border bg-surface-elevated px-4 tracking-[0.32em] transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
            </label>

            <fieldset className="rounded-[4px] border border-border bg-surface-contrast/65 p-4">
              <legend className="px-2 text-sm font-medium">Deseja confiar neste navegador?</legend>
              <div className="mt-3 flex flex-col gap-2 text-sm text-muted">
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="trustedBrowser" value="yes" />
                  Sim, confiar neste navegador
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="trustedBrowser" value="no" defaultChecked />
                  Nao, exigir verificacao em proximos acessos
                </label>
              </div>
            </fieldset>

            <Button type="submit">Validar e entrar</Button>
          </form>
          <Link href="/login" className="mt-6 inline-flex text-sm font-medium text-primary">
            Voltar para login
          </Link>
        </section>
      </div>
    </main>
  );
}