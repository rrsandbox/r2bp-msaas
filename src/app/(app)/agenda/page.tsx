import { headers } from "next/headers";

import { requirePageAuth } from "@/lib/auth/authorization";
import { isInfrastructureUnavailableError } from "@/lib/errors/infrastructure";
import { getCalendarSyncToken } from "@/modules/agenda/application/agenda-sync";
import { listAgendaEvents } from "@/modules/agenda/application/agenda-service";
import { createAgendaEventAction, ensureAgendaSyncTokenAction, updateAgendaEventAction } from "@/app/(app)/agenda/actions";
import { AgendaCardKeyboard } from "@/app/(app)/agenda/agenda-card-keyboard";
import { AgendaFlashToast } from "@/app/(app)/agenda/agenda-flash-toast";
import { AgendaSubmitButton } from "@/app/(app)/agenda/agenda-submit-button";
import { DeleteAgendaEventButton } from "@/app/(app)/agenda/delete-agenda-event-button";

type AgendaItem = {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date;
  ownerName: string | null;
  ownerEmail: string;
  recurrenceLabel: string | null;
  seriesId: string | null;
};

type AgendaPageProps = {
  searchParams?: Promise<{
    month?: string;
    view?: string;
    startsFrom?: string;
    startsTo?: string;
    ownerQuery?: string;
    query?: string;
    page?: string;
    pageSize?: string;
    startsAtSort?: string;
    success?: string;
    error?: string;
  }>;
};

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom"];

function formatTime(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

function formatMonthLabel(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(value);
}

function toDateTimeLocalValue(value: Date) {
  const offset = value.getTimezoneOffset();
  const localDate = new Date(value.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
}

function toDateKey(value: Date) {
  const offset = value.getTimezoneOffset();
  const localDate = new Date(value.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 10);
}

function parseMonthValue(value?: string) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function toMonthValue(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
}

function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth() + 1, 0, 23, 59, 59, 999);
}

function buildCalendarDays(month: Date) {
  const monthStart = startOfMonth(month);
  const dayOffset = (monthStart.getDay() + 6) % 7;
  const firstGridDay = new Date(monthStart);
  firstGridDay.setDate(monthStart.getDate() - dayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const current = new Date(firstGridDay);
    current.setDate(firstGridDay.getDate() + index);
    return current;
  });
}

function getPaginationSlots(currentPage: number, totalPages: number): Array<number | "ellipsis"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  const slots: Array<number | "ellipsis"> = [1];

  if (start > 2) {
    slots.push("ellipsis");
  }

  for (let pageNumber = start; pageNumber <= end; pageNumber += 1) {
    slots.push(pageNumber);
  }

  if (end < totalPages - 1) {
    slots.push("ellipsis");
  }

  slots.push(totalPages);
  return slots;
}

function buildAgendaHref(params: {
  month: string;
  view: "calendar" | "list";
  startsFrom?: string;
  startsTo?: string;
  ownerQuery?: string;
  query?: string;
  page?: number;
  pageSize?: number;
  startsAtSort?: "asc" | "desc";
}) {
  const search = new URLSearchParams();

  search.set("month", params.month);
  search.set("view", params.view);

  if (params.startsFrom) search.set("startsFrom", params.startsFrom);
  if (params.startsTo) search.set("startsTo", params.startsTo);
  if (params.ownerQuery) search.set("ownerQuery", params.ownerQuery);
  if (params.query) search.set("query", params.query);
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  if (params.startsAtSort) search.set("startsAtSort", params.startsAtSort);

  return `/agenda?${search.toString()}`;
}

async function getAgendaData(input: {
  month: Date;
  startsFrom?: string;
  startsTo?: string;
  ownerQuery?: string;
  query?: string;
  page: number;
  pageSize: number;
  startsAtSort: "asc" | "desc";
}) {
  try {
    const context = await requirePageAuth("agenda:read");
    const [calendarItems, listItems, syncToken] = await Promise.all([
      listAgendaEvents(
        {
          role: context.role,
          tenantId: context.tenantId,
          userId: context.userId,
        },
        {
          startsFrom: startOfMonth(input.month),
          startsTo: endOfMonth(input.month),
          ownerQuery: input.ownerQuery,
          query: input.query,
        },
        {
          page: 1,
          pageSize: 300,
        },
        {
          startsAt: "asc",
        },
      ),
      listAgendaEvents(
        {
          role: context.role,
          tenantId: context.tenantId,
          userId: context.userId,
        },
        {
          startsFrom: input.startsFrom ? new Date(`${input.startsFrom}T00:00:00.000`) : undefined,
          startsTo: input.startsTo ? new Date(`${input.startsTo}T23:59:59.999`) : undefined,
          ownerQuery: input.ownerQuery,
          query: input.query,
        },
        {
          page: input.page,
          pageSize: input.pageSize,
        },
        {
          startsAt: input.startsAtSort,
        },
      ),
      getCalendarSyncToken(context.userId),
    ]);

    return {
      calendarItems: calendarItems.items as AgendaItem[],
      listResult: {
        ...listItems,
        items: listItems.items as AgendaItem[],
      },
      syncToken,
    };
  } catch (error) {
    if (isInfrastructureUnavailableError(error)) {
      return {
        calendarItems: [] as AgendaItem[],
        listResult: {
          items: [] as AgendaItem[],
          total: 0,
          page: 1,
          pageSize: input.pageSize,
          totalPages: 1,
        },
        syncToken: null,
        warning: "Banco de dados ainda nao configurado. Defina DATABASE_URL, rode migrations e seed.",
      };
    }

    throw error;
  }
}

function renderAgendaCards(items: AgendaItem[], returnTo: string, emptyMessage: string) {
  if (items.length === 0) {
    return <article className="rounded-[1.75rem] bg-surface p-5 text-sm text-muted">{emptyMessage}</article>;
  }

  return items.map((item) => (
    <AgendaCardKeyboard
      key={item.id}
      ariaLabel={`Evento ${item.title} em ${formatDate(item.startsAt)}`}
      className="rounded-[1.75rem] bg-surface p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{formatDate(item.startsAt)} • {formatTime(item.startsAt)} - {formatTime(item.endsAt)}</p>
          <h3 className="mt-2 text-lg font-semibold text-foreground">{item.title}</h3>
          <p className="mt-1 text-sm text-muted">Responsavel: {item.ownerName ?? item.ownerEmail}</p>
          {item.recurrenceLabel ? <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-primary">{item.recurrenceLabel}</p> : null}
        </div>
      </div>

      <form action={updateAgendaEventAction} className="mt-4 grid gap-2 md:grid-cols-2">
        <input type="hidden" name="eventId" value={item.id} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <label className="flex flex-col gap-1 text-xs text-muted md:col-span-2">
          Titulo
          <input name="title" defaultValue={item.title} className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" required />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted md:col-span-2">
          Descricao
          <input name="description" defaultValue={item.description ?? ""} className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Inicio
          <input name="startsAt" type="datetime-local" defaultValue={toDateTimeLocalValue(item.startsAt)} className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" required />
        </label>
        <label className="flex flex-col gap-1 text-xs text-muted">
          Fim
          <input name="endsAt" type="datetime-local" defaultValue={toDateTimeLocalValue(item.endsAt)} className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" required />
        </label>
        <AgendaSubmitButton
          idleLabel="Salvar"
          pendingLabel="Salvando..."
          className="h-9 w-full justify-center rounded-full border border-primary/40 px-4 text-xs font-medium text-primary transition-colors hover:bg-primary/10 sm:w-fit"
          primaryAction
        />
      </form>

      <div className="mt-3">
        <DeleteAgendaEventButton eventId={item.id} returnTo={returnTo} />
      </div>
    </AgendaCardKeyboard>
  ));
}

export default async function AgendaPage({ searchParams }: AgendaPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const month = parseMonthValue(params?.month);
  const monthValue = toMonthValue(month);
  const previousMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
  const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
  const view = params?.view === "list" ? "list" : "calendar";
  const startsFrom = params?.startsFrom ?? "";
  const startsTo = params?.startsTo ?? "";
  const ownerQuery = params?.ownerQuery ?? "";
  const query = params?.query ?? "";
  const page = Math.max(1, Number(params?.page ?? "1") || 1);
  const pageSize = Math.min(50, Math.max(1, Number(params?.pageSize ?? "12") || 12));
  const startsAtSort = params?.startsAtSort === "desc" ? "desc" : "asc";
  const successCode = params?.success;
  const errorMessage = params?.error;

  const successMessage =
    successCode === "created"
      ? "Evento criado com sucesso."
      : successCode === "updated"
        ? "Evento atualizado com sucesso."
        : successCode === "deleted"
          ? "Evento excluido com sucesso."
          : successCode === "sync-enabled"
            ? "Link de sincronizacao preparado com sucesso."
            : undefined;

  const { calendarItems, listResult, syncToken, warning } = await getAgendaData({
    month,
    startsFrom: startsFrom || undefined,
    startsTo: startsTo || undefined,
    ownerQuery: ownerQuery || undefined,
    query: query || undefined,
    page,
    pageSize,
    startsAtSort,
  });

  const requestHeaders = await headers();
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const appUrl = process.env.APP_URL ?? `${protocol}://${host}`;
  const syncUrl = syncToken ? `${appUrl}/api/agenda/ics?token=${syncToken}` : null;
  const calendarDays = buildCalendarDays(month);
  const dayMap = new Map<string, AgendaItem[]>();

  for (const item of calendarItems) {
    const key = toDateKey(item.startsAt);
    dayMap.set(key, [...(dayMap.get(key) ?? []), item]);
  }

  const baseHrefParams = {
    month: monthValue,
    view,
    startsFrom: startsFrom || undefined,
    startsTo: startsTo || undefined,
    ownerQuery: ownerQuery || undefined,
    query: query || undefined,
    pageSize,
    startsAtSort,
  } as const;
  const returnTo = buildAgendaHref({ ...baseHrefParams, page: view === "list" ? listResult.page : 1 });
  const previousPage = Math.max(1, listResult.page - 1);
  const nextPageNumber = Math.min(listResult.totalPages, listResult.page + 1);
  const pageSlots = getPaginationSlots(listResult.page, listResult.totalPages);

  return (
    <>
      {successMessage ? <AgendaFlashToast kind="success" message={successMessage} /> : null}
      {errorMessage ? <AgendaFlashToast kind="error" message={errorMessage} /> : null}

      <main className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="glass-panel rounded-[2rem] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm text-muted">Agenda multi-tenant</p>
              <h2 className="text-3xl font-semibold tracking-tight">Calendario operacional</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted">Visao mensal como tela principal, alternancia para lista, filtros de busca e suporte a compromissos recorrentes com consistencia de horario por usuario.</p>
            </div>
            <div className="flex rounded-full border border-border bg-surface p-1 text-sm">
              <a href={buildAgendaHref({ ...baseHrefParams, view: "calendar", page: 1 })} className={`rounded-full px-4 py-2 font-medium ${view === "calendar" ? "bg-primary text-primary-foreground" : "text-muted"}`}>Calendario</a>
              <a href={buildAgendaHref({ ...baseHrefParams, view: "list", page: 1 })} className={`rounded-full px-4 py-2 font-medium ${view === "list" ? "bg-primary text-primary-foreground" : "text-muted"}`}>Lista</a>
            </div>
          </div>

          {warning ? <div className="mt-6 rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{warning}</div> : null}

          <div className="mt-6 grid gap-4 rounded-[1.5rem] border border-border bg-surface p-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <form method="get" className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <input type="hidden" name="view" value={view} />
              <input type="hidden" name="month" value={monthValue} />
              <input type="hidden" name="page" value="1" />
              {view === "list" ? <input type="hidden" name="pageSize" value={String(pageSize)} /> : null}
              <label className="flex flex-col gap-2 text-sm md:col-span-2 xl:col-span-2">
                Buscar por titulo ou descricao
                <input name="query" defaultValue={query} className="h-11 rounded-xl border border-border bg-background px-3 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Ex: alinhamento, revisão, cliente" />
              </label>
              <label className="flex flex-col gap-2 text-sm md:col-span-2 xl:col-span-2">
                Responsavel (nome ou e-mail)
                <input name="ownerQuery" defaultValue={ownerQuery} className="h-11 rounded-xl border border-border bg-background px-3 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Ex: admin@tenant.local" />
              </label>
              {view === "list" ? (
                <>
                  <label className="flex flex-col gap-2 text-sm">
                    De
                    <input name="startsFrom" type="date" defaultValue={startsFrom} className="h-11 rounded-xl border border-border bg-background px-3 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </label>
                  <label className="flex flex-col gap-2 text-sm">
                    Ate
                    <input name="startsTo" type="date" defaultValue={startsTo} className="h-11 rounded-xl border border-border bg-background px-3 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </label>
                  <label className="flex flex-col gap-2 text-sm">
                    Itens por pagina
                    <input name="pageSize" type="number" min={1} max={50} defaultValue={String(pageSize)} className="h-11 rounded-xl border border-border bg-background px-3 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </label>
                  <label className="flex flex-col gap-2 text-sm">
                    Ordenacao
                    <select name="startsAtSort" defaultValue={startsAtSort} className="h-11 rounded-xl border border-border bg-background px-3 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30">
                      <option value="asc">Inicio crescente</option>
                      <option value="desc">Inicio decrescente</option>
                    </select>
                  </label>
                </>
              ) : null}
              <div className="flex gap-2 md:col-span-2 xl:col-span-4">
                <AgendaSubmitButton idleLabel="Aplicar filtros" pendingLabel="Aplicando..." className="h-11 rounded-full border border-primary/40 px-5 text-sm font-medium text-primary transition-colors hover:bg-primary/10" />
                <a href={buildAgendaHref({ month: monthValue, view, page: 1 })} className="inline-flex h-11 items-center rounded-full border border-border px-5 text-sm font-medium text-muted transition-colors hover:bg-surface-muted/50 hover:border-border/70">Limpar</a>
              </div>
            </form>

            <div className="grid gap-2 text-sm text-muted">
              <span className="font-medium text-foreground">Mes de referencia</span>
              <form id="agenda-month-form" method="get" className="grid gap-2">
                <input type="month" name="month" defaultValue={monthValue} className="h-11 rounded-xl border border-border bg-background px-3 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input type="hidden" name="view" value={view} />
                <input type="hidden" name="query" value={query} />
                <input type="hidden" name="ownerQuery" value={ownerQuery} />
                <input type="hidden" name="startsFrom" value={startsFrom} />
                <input type="hidden" name="startsTo" value={startsTo} />
                <input type="hidden" name="pageSize" value={String(pageSize)} />
                <input type="hidden" name="startsAtSort" value={startsAtSort} />
                <button type="submit" className="inline-flex h-10 items-center justify-center rounded-full border border-border px-4 text-sm font-medium text-muted transition-colors hover:bg-surface-muted">Ir para o mes</button>
              </form>
            </div>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted">Mes exibido</p>
                <h3 className="text-2xl font-semibold capitalize">{formatMonthLabel(month)}</h3>
              </div>
              <div className="flex gap-2">
                <a href={buildAgendaHref({ ...baseHrefParams, month: toMonthValue(previousMonth), page: 1 })} className="inline-flex h-10 items-center rounded-full border border-border px-4 text-sm font-medium text-muted transition-colors hover:bg-surface-muted">Anterior</a>
                <a href={buildAgendaHref({ ...baseHrefParams, month: toMonthValue(nextMonth), page: 1 })} className="inline-flex h-10 items-center rounded-full border border-border px-4 text-sm font-medium text-muted transition-colors hover:bg-surface-muted">Proximo</a>
              </div>
            </div>

            {view === "calendar" ? (
              <>
                <div className="mt-4 grid grid-cols-7 gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  {WEEKDAY_LABELS.map((label) => (
                    <div key={label} className="px-2 py-1">{label}</div>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-7">
                  {calendarDays.map((day) => {
                    const dayKey = toDateKey(day);
                    const dayItems = dayMap.get(dayKey) ?? [];
                    const isCurrentMonth = day.getMonth() === month.getMonth();

                    return (
                      <article key={dayKey} className={`min-h-40 rounded-[1.25rem] border p-3 ${isCurrentMonth ? "border-border bg-background" : "border-border/50 bg-surface-muted/45 text-muted"}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm font-semibold ${isCurrentMonth ? "text-foreground" : "text-muted"}`}>{String(day.getDate()).padStart(2, "0")}</span>
                          {dayItems.length > 0 ? <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">{dayItems.length} item(ns)</span> : null}
                        </div>
                        <div className="mt-3 grid gap-2">
                          {dayItems.slice(0, 3).map((item) => (
                            <div key={item.id} className="rounded-xl border border-border/70 bg-surface px-2 py-2 text-xs text-foreground">
                              <p className="font-medium">{formatTime(item.startsAt)} • {item.title}</p>
                              <p className="mt-1 text-muted">{item.ownerName ?? item.ownerEmail}</p>
                            </div>
                          ))}
                          {dayItems.length > 3 ? <p className="text-xs text-muted">+ {dayItems.length - 3} compromisso(s)</p> : null}
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {renderAgendaCards(calendarItems.slice(0, 8), returnTo, "Nenhum compromisso no mes selecionado.")}
                </div>
              </>
            ) : (
              <>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {renderAgendaCards(listResult.items, returnTo, "Nenhum evento encontrado para os filtros selecionados.")}
                </div>

                <div className="mt-6 flex flex-col gap-3 rounded-[1.25rem] border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted">Total de eventos filtrados: {listResult.total} • Pagina {listResult.page} de {listResult.totalPages}</p>
                  <div className="flex gap-2">
                    <a href={buildAgendaHref({ ...baseHrefParams, page: previousPage })} className={`inline-flex h-10 items-center rounded-full border border-border px-4 text-sm font-medium ${listResult.page <= 1 ? "pointer-events-none opacity-50" : "text-muted"}`} aria-disabled={listResult.page <= 1}>Anterior</a>
                    {pageSlots.map((slot, index) => {
                      if (slot === "ellipsis") {
                        return <span key={`ellipsis-${index}`} className="inline-flex h-10 items-center px-1 text-sm text-muted">...</span>;
                      }

                      const isActive = slot === listResult.page;

                      return (
                        <a key={`page-${slot}`} href={buildAgendaHref({ ...baseHrefParams, page: slot })} aria-current={isActive ? "page" : undefined} className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-medium ${isActive ? "border-primary/60 bg-primary text-primary-foreground" : "border-border text-muted"}`}>
                          {slot}
                        </a>
                      );
                    })}
                    <a href={buildAgendaHref({ ...baseHrefParams, page: nextPageNumber })} className={`inline-flex h-10 items-center rounded-full border border-border px-4 text-sm font-medium ${listResult.page >= listResult.totalPages ? "pointer-events-none opacity-50" : "text-muted"}`} aria-disabled={listResult.page >= listResult.totalPages}>Proxima</a>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        <aside className="grid gap-6">
          <section className="glass-panel rounded-[2rem] p-6">
            <h3 className="text-xl font-semibold tracking-tight">Novo compromisso</h3>
            <p className="mt-2 text-sm text-muted">Crie apontamentos simples ou recorrentes. Para recorrencia, informe frequencia e uma data limite ou quantidade maxima.</p>

            <form action={createAgendaEventAction} className="mt-6 grid gap-3">
              <input type="hidden" name="returnTo" value={returnTo} />
              <label className="flex flex-col gap-2 text-sm">
                Titulo
                <input name="title" className="h-11 rounded-xl border border-border bg-background px-3 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Ex: Reuniao de status" required />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                Descricao
                <textarea name="description" className="min-h-24 rounded-xl border border-border bg-background px-3 py-2 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Contexto rapido do apontamento" />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                Inicio
                <input name="startsAt" type="datetime-local" className="h-11 rounded-xl border border-border bg-background px-3 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" required />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                Fim
                <input name="endsAt" type="datetime-local" className="h-11 rounded-xl border border-border bg-background px-3 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" required />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm">
                  Recorrencia
                  <select name="recurrenceFrequency" defaultValue="" className="h-11 rounded-xl border border-border bg-background px-3 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="">Nao recorrente</option>
                    <option value="DAILY">Diaria</option>
                    <option value="WEEKLY">Semanal</option>
                    <option value="MONTHLY">Mensal</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  Intervalo
                  <input name="recurrenceInterval" type="number" min={1} max={30} defaultValue="1" className="h-11 rounded-xl border border-border bg-background px-3 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  Ate a data
                  <input name="recurrenceUntil" type="date" className="h-11 rounded-xl border border-border bg-background px-3 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  Ou quantidade
                  <input name="recurrenceCount" type="number" min={1} max={120} className="h-11 rounded-xl border border-border bg-background px-3 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Ex: 10" />
                </label>
              </div>
              <AgendaSubmitButton idleLabel="Criar compromisso" pendingLabel="Criando..." className="h-11 w-fit rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90" />
            </form>
          </section>

          <section className="glass-panel rounded-[2rem] p-6">
            <h3 className="text-xl font-semibold tracking-tight">Sincronizacao com calendario</h3>
            <p className="mt-2 text-sm text-muted">Use um feed iCal privado do usuario atual para assinar a agenda no Google Calendar, Outlook ou Apple Calendar.</p>

            {syncUrl ? (
              <div className="mt-4 grid gap-3">
                <label className="flex flex-col gap-2 text-sm">
                  URL de assinatura
                  <input readOnly value={syncUrl} className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground" />
                </label>
                <a href={syncUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center rounded-full border border-primary/40 px-5 text-sm font-medium text-primary transition-colors hover:bg-primary/10">Abrir feed iCal</a>
              </div>
            ) : (
              <form action={ensureAgendaSyncTokenAction} className="mt-4">
                <input type="hidden" name="returnTo" value={returnTo} />
                <AgendaSubmitButton idleLabel="Gerar link de sincronizacao" pendingLabel="Gerando..." className="h-11 rounded-full border border-primary/40 px-5 text-sm font-medium text-primary transition-colors hover:bg-primary/10" />
              </form>
            )}

            <ol className="mt-4 grid gap-2 text-sm text-muted">
              <li>1. Gere o link iCal privado do seu usuario.</li>
              <li>2. No seu calendario externo, escolha a opcao de assinar por URL.</li>
              <li>3. Cole o link para manter os apontamentos sincronizados.</li>
            </ol>
          </section>
        </aside>
      </main>
    </>
  );
}