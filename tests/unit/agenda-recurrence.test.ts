import { buildAgendaOccurrences, formatRecurrenceLabel, hasRecurrence } from "@/modules/agenda/application/agenda-recurrence";

describe("agenda recurrence", () => {
  it("keeps a single occurrence when recurrence is not configured", () => {
    const startsAt = new Date("2026-04-19T10:00:00.000Z");
    const endsAt = new Date("2026-04-19T11:00:00.000Z");

    const items = buildAgendaOccurrences({ startsAt, endsAt }, {});

    expect(items).toHaveLength(1);
    expect(items[0]?.startsAt.toISOString()).toBe(startsAt.toISOString());
    expect(items[0]?.endsAt.toISOString()).toBe(endsAt.toISOString());
    expect(hasRecurrence({})).toBe(false);
  });

  it("expands weekly recurrence using count", () => {
    const items = buildAgendaOccurrences(
      {
        startsAt: new Date("2026-04-21T13:00:00.000Z"),
        endsAt: new Date("2026-04-21T14:30:00.000Z"),
      },
      {
        frequency: "WEEKLY",
        interval: 1,
        count: 3,
      },
    );

    expect(items).toHaveLength(3);
    expect(items.map((item) => item.startsAt.toISOString())).toEqual([
      "2026-04-21T13:00:00.000Z",
      "2026-04-28T13:00:00.000Z",
      "2026-05-05T13:00:00.000Z",
    ]);
  });

  it("stops monthly recurrence at the until date", () => {
    const items = buildAgendaOccurrences(
      {
        startsAt: new Date("2026-01-15T09:00:00.000Z"),
        endsAt: new Date("2026-01-15T10:00:00.000Z"),
      },
      {
        frequency: "MONTHLY",
        interval: 1,
        until: new Date("2026-03-20T00:00:00.000Z"),
      },
    );

    expect(items).toHaveLength(3);
    expect(items.at(-1)?.startsAt.toISOString()).toBe("2026-03-15T09:00:00.000Z");
  });

  it("formats recurrence labels for display", () => {
    expect(formatRecurrenceLabel({ frequency: "DAILY", interval: 1 })).toBe("Diario");
    expect(formatRecurrenceLabel({ frequency: "WEEKLY", interval: 2 })).toBe("A cada 2 semanas");
    expect(formatRecurrenceLabel({})).toBeNull();
  });
});