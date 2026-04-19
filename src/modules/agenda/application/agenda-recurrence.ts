export type AgendaRecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY";

export type AgendaRecurrenceInput = {
  frequency?: AgendaRecurrenceFrequency;
  interval?: number;
  until?: Date;
  count?: number;
};

type AgendaOccurrenceSeed = {
  startsAt: Date;
  endsAt: Date;
};

type AgendaOccurrence = AgendaOccurrenceSeed & {
  index: number;
};

const MAX_OCCURRENCES = 120;

function addMonths(date: Date, amount: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

function shiftDate(date: Date, frequency: AgendaRecurrenceFrequency, interval: number) {
  const next = new Date(date);

  if (frequency === "DAILY") {
    next.setDate(next.getDate() + interval);
    return next;
  }

  if (frequency === "WEEKLY") {
    next.setDate(next.getDate() + interval * 7);
    return next;
  }

  return addMonths(next, interval);
}

export function hasRecurrence(input: AgendaRecurrenceInput) {
  return Boolean(input.frequency);
}

export function normalizeRecurrence(input: AgendaRecurrenceInput) {
  if (!input.frequency) {
    return null;
  }

  return {
    frequency: input.frequency,
    interval: input.interval ?? 1,
    until: input.until,
    count: input.count,
  };
}

export function buildAgendaOccurrences(seed: AgendaOccurrenceSeed, recurrence: AgendaRecurrenceInput) {
  const normalized = normalizeRecurrence(recurrence);

  if (!normalized) {
    return [{ ...seed, index: 0 }] satisfies AgendaOccurrence[];
  }

  const items: AgendaOccurrence[] = [];
  const totalCount = normalized.count ? Math.min(normalized.count, MAX_OCCURRENCES) : MAX_OCCURRENCES;
  const durationMs = seed.endsAt.getTime() - seed.startsAt.getTime();

  let currentStart = new Date(seed.startsAt);

  for (let index = 0; index < totalCount; index += 1) {
    const currentEnd = new Date(currentStart.getTime() + durationMs);

    if (normalized.until && currentStart > normalized.until) {
      break;
    }

    items.push({
      startsAt: new Date(currentStart),
      endsAt: currentEnd,
      index,
    });

    currentStart = shiftDate(currentStart, normalized.frequency, normalized.interval);
  }

  return items;
}

export function formatRecurrenceLabel(recurrence: AgendaRecurrenceInput) {
  const normalized = normalizeRecurrence(recurrence);

  if (!normalized) {
    return null;
  }

  if (normalized.frequency === "DAILY") {
    return normalized.interval > 1 ? `A cada ${normalized.interval} dias` : "Diario";
  }

  if (normalized.frequency === "WEEKLY") {
    return normalized.interval > 1 ? `A cada ${normalized.interval} semanas` : "Semanal";
  }

  return normalized.interval > 1 ? `A cada ${normalized.interval} meses` : "Mensal";
}