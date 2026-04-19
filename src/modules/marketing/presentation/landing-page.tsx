import Link from "next/link";
import { ArrowRight, Building2, CalendarClock, ShieldCheck } from "lucide-react";

import type { LandingPublicComment } from "@/modules/marketing/application/public-comment-service";
import { Button } from "@/ui/components/button";
import { SectionHeader } from "@/modules/shared/presentation/section-header";
import { TestimonialsCarousel } from "@/modules/marketing/presentation/testimonials-carousel";

const pillars = [
  {
    title: "Multi-tenant com governanca",
    description: "Separacao por organizacao, RBAC e trilha de auditoria como partes nativas da plataforma.",
    icon: Building2,
  },
  {
    title: "Agenda operacional pronta",
    description: "Dashboard, agenda por usuario e estrutura inicial para fluxos internos e automacoes.",
    icon: CalendarClock,
  },
  {
    title: "Seguranca preparada",
    description: "Auth.js, 2FA por e-mail, trusted browser, feature flags e observabilidade desde o bootstrap.",
    icon: ShieldCheck,
  },
];

type LandingPageProps = {
  success?: string;
  error?: string;
  testimonials: LandingPublicComment[];
};

export function LandingPage({ success, error, testimonials }: LandingPageProps) {
  const successMessage =
    success === "tenant-requested"
      ? "Pedido de cadastro enviado com sucesso. Aguarde a aprovacao e acompanhe por e-mail."
      : undefined;

  return (
    <main className="flex flex-1 flex-col pb-16">
      <section className="app-shell flex flex-1 flex-col gap-10 py-8 sm:py-12">
        {successMessage ? (
          <div className="rounded-[4px] border border-success/40 bg-success/10 p-4 text-sm text-success">{successMessage}</div>
        ) : null}
        {error ? (
          <div className="rounded-[4px] border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{error}</div>
        ) : null}

        <header className="glass-panel flex items-center justify-between rounded-full px-5 py-3">
          <div className="flex items-center gap-3 text-sm font-medium">
            <span className="status-dot" />
            R2BP MicroSaaS Boilerplate
          </div>
          <nav className="flex items-center gap-2">
            <Link href="/cadastro-tenant" className="text-sm text-muted transition-colors hover:text-foreground">
              Cadastro de tenant
            </Link>
            <Link href="/login" className="text-sm text-muted transition-colors hover:text-foreground">
              Entrar
            </Link>
            <Button asChild variant="secondary" size="sm">
              <Link href="/cadastro-tenant">Solicitar acesso</Link>
            </Button>
          </nav>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <span className="w-fit rounded-full border border-border bg-surface px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              Next.js + Prisma + Auth.js
            </span>
            <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
              Boilerplate para microsaaS com multi-tenant, RBAC, agenda e base operacional pronta.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted">
              Base executavel para produtos B2B com autenticacao forte, configuracoes por tenant, auditoria,
              jobs, agentes internos e layout claro/escuro com linguagem visual enxuta.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/cadastro-tenant" className="inline-flex items-center gap-2">
                  Cadastrar tenant
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/login">Entrar no sistema</Link>
              </Button>
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-surface-muted p-5 sm:col-span-2">
                <p className="text-sm text-muted">Primeiro acesso</p>
                <p className="mt-3 text-2xl font-semibold">Usuario mestre + tenant raiz + admin inicial</p>
              </div>
              <div className="rounded-3xl bg-surface p-5">
                <p className="text-sm text-muted">Seguranca</p>
                <p className="mt-3 text-lg font-semibold">2FA por e-mail + trusted browser</p>
              </div>
              <div className="rounded-3xl bg-surface p-5">
                <p className="text-sm text-muted">Operacao</p>
                <p className="mt-3 text-lg font-semibold">Fila, locks e key-value via Postgres</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="app-shell flex flex-col gap-8 py-8">
        <SectionHeader
          eyebrow="Pilares"
          title="Arquitetura de entrada para evoluir sem retrabalho"
          description="Os modulos iniciais ja refletem a organizacao por dominio, com separacao entre regras, infraestrutura e apresentacao de forma pragmatica."
        />

        <div className="grid gap-4 lg:grid-cols-3">
          {pillars.map(({ title, description, icon: Icon }) => (
            <article key={title} className="glass-panel rounded-[1.75rem] p-6">
              <div className="mb-5 inline-flex rounded-2xl bg-surface-muted p-3 text-primary">
                <Icon className="size-5" />
              </div>
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-muted">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="app-shell flex flex-col gap-8 py-8">
        <SectionHeader
          eyebrow="Depoimentos"
          title="Comentarios de quem ja opera no ambiente"
          description="A experiencia dos perfis do sistema precisa refletir aprovacao, onboarding, convites e isolamento real por tenant."
        />

        <TestimonialsCarousel items={testimonials} />
      </section>

      <section className="app-shell flex flex-wrap items-center justify-between gap-4 py-8 text-sm text-muted">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/politicas-de-uso" className="font-medium text-primary">Politicas de uso</Link>
          <Link href="/lgpd" className="font-medium text-primary">LGPD e tratamento de dados</Link>
          <Link href="/login" className="font-medium text-primary">Login</Link>
        </div>
        <p>Multi-tenant com aprovacao, onboarding e governanca operacional desde a entrada.</p>
      </section>
    </main>
  );
}