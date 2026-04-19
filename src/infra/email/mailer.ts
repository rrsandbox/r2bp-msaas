import nodemailer from "nodemailer";

import { logger } from "@/infra/observability/logger";

const smtpPort = Number(process.env.SMTP_PORT ?? 1025);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "localhost",
  port: Number.isFinite(smtpPort) ? smtpPort : 1025,
  secure: false,
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
});

type MailMessage = {
  to: string;
  subject: string;
  text: string;
};

function getBaseUrl() {
  return process.env.APP_URL ?? "http://localhost:3000";
}

async function sendMailWithFallback(message: MailMessage, logContext?: Record<string, unknown>) {
  const from = process.env.MAIL_FROM ?? "noreply@r2bp.local";

  try {
    await transporter.sendMail({
      from,
      ...message,
    });

    if (process.env.NODE_ENV !== "production") {
      logger.info({ to: message.to, subject: message.subject, ...logContext }, "E-mail emitido (dev local).");
    }
  } catch (error) {
    logger.warn(
      {
        error,
        to: message.to,
        subject: message.subject,
      },
      "Falha no envio SMTP. Conteudo registrado para ambiente local.",
    );

    logger.info({ to: message.to, subject: message.subject, text: message.text, ...logContext }, "E-mail gerado (fallback local).");
  }
}

export async function sendTwoFactorCodeEmail(to: string, code: string, ttlMinutes: number) {
  const subject = "Seu codigo de verificacao";
  const text = `Seu codigo de verificacao e ${code}. Ele expira em ${ttlMinutes} minutos.`;

  await sendMailWithFallback({ to, subject, text }, { code, ttlMinutes });
}

export async function sendTenantApprovalEmail(to: string, tenantName: string) {
  const subject = "Cadastro de tenant aprovado";
  const text = `Seu cadastro para o tenant ${tenantName} foi aprovado. Acesse ${getBaseUrl()}/login para entrar e concluir o onboarding.`;

  await sendMailWithFallback({ to, subject, text }, { tenantName, flow: "tenant-approval" });
}

export async function sendTenantRequestReceivedEmail(to: string) {
  const subject = "Solicitacao de tenant recebida";
  const text = "Recebemos sua solicitacao de cadastro de tenant e ela sera analisada pela equipe responsavel. Voce recebera um novo e-mail com o resultado da aprovacao.";

  await sendMailWithFallback({ to, subject, text }, { flow: "tenant-request-received" });
}

export async function sendTenantRejectionEmail(to: string, notes?: string | null) {
  const subject = "Cadastro de tenant nao aprovado";
  const text = notes
    ? `Seu pre-cadastro de tenant nao foi aprovado. Observacao da revisao: ${notes}`
    : "Seu pre-cadastro de tenant nao foi aprovado neste momento.";

  await sendMailWithFallback({ to, subject, text }, { flow: "tenant-rejection" });
}

export async function sendTenantInviteEmail(params: { to: string; tenantName: string; inviterName?: string | null; token: string }) {
  const subject = `Convite para acessar ${params.tenantName}`;
  const inviteUrl = `${getBaseUrl()}/cadastro-convite?token=${params.token}`;
  const text = `${params.inviterName ?? "Um administrador"} convidou voce para acessar o tenant ${params.tenantName}. Conclua o cadastro em ${inviteUrl}`;

  await sendMailWithFallback({ to: params.to, subject, text }, { tenantName: params.tenantName, inviteUrl, flow: "tenant-invite" });
}

export async function sendAccountConfirmationEmail(to: string) {
  const subject = "Cadastro confirmado";
  const text = `Seu cadastro foi confirmado. Acesse ${getBaseUrl()}/login para entrar e completar seu perfil.`;

  await sendMailWithFallback({ to, subject, text }, { flow: "account-confirmation" });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const subject = "Redefinicao de senha";
  const resetUrl = `${getBaseUrl()}/redefinir-senha?token=${token}`;
  const text = `Recebemos uma solicitacao para redefinir sua senha. Acesse ${resetUrl} para continuar.`;

  await sendMailWithFallback({ to, subject, text }, { flow: "password-reset", resetUrl });
}