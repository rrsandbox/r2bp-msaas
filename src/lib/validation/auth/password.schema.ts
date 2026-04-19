import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(10, "Senha precisa ter pelo menos 10 caracteres.")
  .regex(/[a-z]/, "Senha precisa conter pelo menos uma letra minuscula.")
  .regex(/[A-Z]/, "Senha precisa conter pelo menos uma letra maiuscula.")
  .regex(/[0-9]/, "Senha precisa conter pelo menos um numero.")
  .regex(/[^a-zA-Z0-9]/, "Senha precisa conter pelo menos um caractere especial.");
