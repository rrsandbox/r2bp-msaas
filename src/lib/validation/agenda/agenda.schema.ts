import { z } from "zod";

const optionalDate = z.coerce.date().optional();

export const createAgendaEventSchema = z
  .object({
    tenantId: z.string().min(1).optional(),
    ownerId: z.string().min(1).optional(),
    title: z.string().min(2).max(160),
    description: z.string().max(2000).optional(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    recurrenceFrequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).optional(),
    recurrenceInterval: z.coerce.number().int().min(1).max(30).optional(),
    recurrenceUntil: optionalDate,
    recurrenceCount: z.coerce.number().int().min(1).max(120).optional(),
  })
  .refine((value) => value.endsAt > value.startsAt, {
    path: ["endsAt"],
    message: "Data de termino deve ser maior que a data de inicio.",
  })
  .refine((value) => !(value.recurrenceUntil && value.recurrenceUntil < value.startsAt), {
    path: ["recurrenceUntil"],
    message: "Fim da recorrencia deve ser posterior ao inicio do evento.",
  })
  .refine((value) => !(value.recurrenceFrequency && !value.recurrenceUntil && !value.recurrenceCount), {
    path: ["recurrenceUntil"],
    message: "Informe termino ou quantidade para compromissos recorrentes.",
  });

export const updateAgendaEventSchema = z
  .object({
    ownerId: z.string().min(1).optional(),
    title: z.string().min(2).max(160).optional(),
    description: z.string().max(2000).optional(),
    startsAt: optionalDate,
    endsAt: optionalDate,
    deleteSeries: z.coerce.boolean().optional(),
  })
  .refine(
    (value) => {
      if (!value.startsAt || !value.endsAt) {
        return true;
      }

      return value.endsAt > value.startsAt;
    },
    {
      path: ["endsAt"],
      message: "Data de termino deve ser maior que a data de inicio.",
    },
  );

export type CreateAgendaEventInput = z.infer<typeof createAgendaEventSchema>;
export type UpdateAgendaEventInput = z.infer<typeof updateAgendaEventSchema>;
