import Link from "next/link";
import { prisma } from "@/infra/db/prisma";
import { requireAuth } from "@/lib/auth/authorization";
import { completeProfileAction, completeTenantOnboardingAction, requestAccountDeletionAction } from "@/app/(app)/perfil/actions";
import { Badge, Button, Card, CardBody, CardFooter, CardHeader, FormField, PageHeader } from "@/ui/components";

type PerfilPageProps = {
  searchParams?: Promise<{ success?: string; error?: string; step?: string; personType?: string }>;
};

export default async function PerfilPage({ searchParams }: PerfilPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const context = await requireAuth("profile:read");

  const [user, tenant] = await Promise.all([
    prisma.user.findUnique({
      where: { id: context.userId },
      select: {
        name: true,
        email: true,
        profile: true,
        isProfileComplete: true,
      },
    }),
    prisma.tenant.findUnique({
      where: { id: context.tenantId },
      select: {
        name: true,
        slug: true,
        status: true,
        onboardingStatus: true,
        legalProfile: true,
        billingProfile: true,
        adminProfile: true,
      },
    }),
  ]);

  const profile = (user?.profile as Record<string, string> | null) ?? {};
  const personType = params?.personType === "PJ" || params?.personType === "PF"
    ? params.personType
    : profile.personType === "PJ"
      ? "PJ"
      : "PF";
  const legalProfile = (tenant?.legalProfile as Record<string, string> | null) ?? {};
  const billingProfile = (tenant?.billingProfile as Record<string, string> | null) ?? {};
  const adminProfile = (tenant?.adminProfile as Record<string, string> | null) ?? {};
  const mustCompleteProfile = !context.isProfileComplete || params?.step === "profile";
  const mustCompleteTenant = context.role === "ADMIN" && context.tenantOnboardingStatus !== "COMPLETED";

  return (
    <>
      <PageHeader
        title="Meu Perfil"
        description="Complete seus dados pessoais e, se voce administra o tenant, finalize tambem o onboarding organizacional."
      />

      {params?.success ? (
        <div className="mb-6 rounded-[4px] border border-success/40 bg-success/10 p-4 text-sm text-success">
          {params.success === "profile"
            ? "Perfil concluido com sucesso."
            : params.success === "tenant"
              ? "Dados administrativos do tenant atualizados com sucesso."
              : "Operacao concluida com sucesso."}
        </div>
      ) : null}

      {params?.error ? (
        <div className="mb-6 rounded-[4px] border border-danger/40 bg-danger/10 p-4 text-sm text-danger">{params.error}</div>
      ) : null}

      <main className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader
            title="Perfil do usuario"
            description="Este preenchimento e obrigatorio no primeiro acesso para liberar o restante da aplicacao."
          />
          <form action={completeProfileAction}>
            <CardBody className="grid gap-4 md:grid-cols-2">
              <FormField label="Nome" required>
                <input name="name" defaultValue={user?.name ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
              </FormField>
              <FormField label="E-mail">
                <input value={user?.email ?? ""} disabled className="h-10 w-full rounded-lg border border-border bg-surface-muted px-3 text-sm text-muted" />
              </FormField>
              <div className="md:col-span-2">
                <p className="mb-2 text-sm font-medium text-foreground">Tipo de cadastro</p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/perfil?personType=PF"
                    className={`rounded-[4px] border px-3 py-2 text-sm ${personType === "PF" ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted"}`}
                  >
                    Pessoa fisica
                  </Link>
                  <Link
                    href="/perfil?personType=PJ"
                    className={`rounded-[4px] border px-3 py-2 text-sm ${personType === "PJ" ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted"}`}
                  >
                    Pessoa juridica
                  </Link>
                </div>
                <p className="mt-2 text-xs text-muted">A selecao define os campos obrigatorios no formulario.</p>
                <input type="hidden" name="personType" value={personType} />
              </div>
              {personType === "PJ" ? (
                <>
                  <FormField label="Razao social da PJ" required>
                    <input name="companyName" defaultValue={profile.companyName ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                  </FormField>
                  <FormField label="Nome fantasia">
                    <input name="tradeName" defaultValue={profile.tradeName ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
                  </FormField>
                  <FormField label="CNPJ" required>
                    <input name="companyDocumentNumber" defaultValue={profile.companyDocumentNumber ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                  </FormField>
                  <FormField label="Nome completo do responsavel" required>
                    <input name="responsibleFullName" defaultValue={profile.responsibleFullName ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                  </FormField>
                  <FormField label="Identidade do responsavel" required>
                    <input name="responsibleIdentity" defaultValue={profile.responsibleIdentity ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                  </FormField>
                  <FormField label="CPF do responsavel" required>
                    <input name="responsibleCpf" defaultValue={profile.responsibleCpf ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                  </FormField>
                  <FormField label="E-mail do responsavel" required>
                    <input name="responsibleEmail" type="email" defaultValue={profile.responsibleEmail ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                  </FormField>
                  <FormField label="Telefone do responsavel" required>
                    <input name="responsiblePhone" defaultValue={profile.responsiblePhone ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                  </FormField>
                  <div className="md:col-span-2 rounded-[4px] border border-border bg-surface-muted p-3 text-xs text-muted">
                    Dados bancarios para PJ: informe apenas contas e meios financeiros da pessoa juridica.
                  </div>
                  <FormField label="Banco da PJ" required>
                    <input name="legalEntityBankName" defaultValue={profile.legalEntityBankName ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                  </FormField>
                  <FormField label="Agencia da PJ" required>
                    <input name="legalEntityBankAgency" defaultValue={profile.legalEntityBankAgency ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                  </FormField>
                  <FormField label="Conta da PJ" required>
                    <input name="legalEntityBankAccount" defaultValue={profile.legalEntityBankAccount ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                  </FormField>
                  <FormField label="Chave PIX da PJ">
                    <input name="legalEntityPixKey" defaultValue={profile.legalEntityPixKey ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
                  </FormField>
                </>
              ) : (
                <>
                  <FormField label="Documento" required>
                    <input name="documentNumber" defaultValue={profile.documentNumber ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                  </FormField>
                  <FormField label="Identidade (RG)" required>
                    <input name="identityNumber" defaultValue={profile.identityNumber ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                  </FormField>
                  <FormField label="CPF" required>
                    <input name="cpf" defaultValue={profile.cpf ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                  </FormField>
                  <FormField label="Telefone" required>
                    <input name="phone" defaultValue={profile.phone ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                  </FormField>
                  <FormField label="Endereco principal" required>
                    <input name="address" defaultValue={profile.address ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                  </FormField>
                  <FormField label="Cidade" required>
                    <input name="city" defaultValue={profile.city ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                  </FormField>
                  <FormField label="UF" required>
                    <input name="state" defaultValue={profile.state ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                  </FormField>
                  <FormField label="CEP" required>
                    <input name="zipCode" defaultValue={profile.zipCode ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                  </FormField>
                  <FormField label="Data de nascimento">
                    <input name="birthDate" type="date" defaultValue={profile.birthDate ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
                  </FormField>
                  <FormField label="Profissao">
                    <input name="occupation" defaultValue={profile.occupation ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
                  </FormField>
                  <FormField label="Renda mensal">
                    <input name="monthlyIncome" defaultValue={profile.monthlyIncome ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
                  </FormField>
                  <FormField label="Banco pessoal">
                    <input name="personalBankName" defaultValue={profile.personalBankName ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
                  </FormField>
                  <FormField label="Agencia">
                    <input name="personalBankAgency" defaultValue={profile.personalBankAgency ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
                  </FormField>
                  <FormField label="Conta">
                    <input name="personalBankAccount" defaultValue={profile.personalBankAccount ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
                  </FormField>
                  <FormField label="Chave PIX">
                    <input name="personalPixKey" defaultValue={profile.personalPixKey ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
                  </FormField>
                </>
              )}
            </CardBody>
            <CardFooter className="flex items-center justify-between gap-3">
              <div className="text-xs text-muted">
                Status atual: <Badge variant={user?.isProfileComplete ? "success" : "warning"}>{user?.isProfileComplete ? "COMPLETO" : "PENDENTE"}</Badge>
              </div>
              <Button type="submit">Salvar perfil</Button>
            </CardFooter>
          </form>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader title="Resumo de acesso" description="Seu escopo atual e definido por tenant e role." />
            <CardBody className="space-y-3 text-sm">
              <div className="rounded-[4px] border border-border bg-surface-muted p-4">
                <p className="text-muted">Role</p>
                <p className="mt-1 font-semibold">{context.role}</p>
              </div>
              <div className="rounded-[4px] border border-border bg-surface-muted p-4">
                <p className="text-muted">Tenant</p>
                <p className="mt-1 font-semibold">{tenant?.name ?? context.tenantName}</p>
                <p className="text-xs text-muted">/{tenant?.slug}</p>
              </div>
              <div className="rounded-[4px] border border-border bg-surface-muted p-4">
                <p className="text-muted">Pendencias</p>
                <ul className="mt-2 space-y-2 text-xs text-muted">
                  <li>{mustCompleteProfile ? "Perfil do usuario precisa ser concluido." : "Perfil do usuario concluido."}</li>
                  <li>{mustCompleteTenant ? "Dados administrativos do tenant aguardam preenchimento." : "Cadastro administrativo do tenant concluido ou nao aplicavel."}</li>
                </ul>
              </div>
            </CardBody>
          </Card>

          {context.role === "ADMIN" ? (
            <Card>
              <CardHeader
                title="Propriedades do tenant"
                description="Tela administrativa da tenant para dados juridicos, representante legal e parametros financeiros."
              />
              <form action={completeTenantOnboardingAction}>
                <CardBody className="grid gap-4">
                  <FormField label="Tipo de entidade" required>
                    <select name="entityType" defaultValue={legalProfile.entityType ?? "PJ"} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required>
                      <option value="PJ">Pessoa juridica</option>
                      <option value="PF">Pessoa fisica</option>
                    </select>
                  </FormField>
                  <FormField label="Razao social / nome" required>
                    <input name="legalName" defaultValue={legalProfile.legalName ?? tenant?.name ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                  </FormField>
                  <FormField label="Nome fantasia">
                    <input name="tradeName" defaultValue={legalProfile.tradeName ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
                  </FormField>
                  <FormField label="Documento da tenant" required>
                    <input name="tenantDocumentNumber" defaultValue={legalProfile.documentNumber ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                  </FormField>
                  <FormField label="Representante legal" required>
                    <input name="representativeName" defaultValue={legalProfile.representativeName ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                  </FormField>
                  <FormField label="E-mail do representante" required>
                    <input name="representativeEmail" type="email" defaultValue={legalProfile.representativeEmail ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                  </FormField>
                  <FormField label="E-mail financeiro" required>
                    <input name="billingEmail" type="email" defaultValue={billingProfile.billingEmail ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                  </FormField>
                  <FormField label="Telefone financeiro" required>
                    <input name="billingPhone" defaultValue={billingProfile.billingPhone ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" required />
                  </FormField>
                  <FormField label="Banco / instituicao">
                    <input name="bankName" defaultValue={billingProfile.bankName ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
                  </FormField>
                  <FormField label="Chave PIX">
                    <input name="pixKey" defaultValue={billingProfile.pixKey ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
                  </FormField>
                  <FormField label="E-mail administrativo">
                    <input name="supportEmail" type="email" defaultValue={adminProfile.supportEmail ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
                  </FormField>
                  <FormField label="Telefone administrativo">
                    <input name="supportPhone" defaultValue={adminProfile.supportPhone ?? ""} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
                  </FormField>
                  <FormField label="Observacoes internas">
                    <textarea name="notes" defaultValue={adminProfile.notes ?? ""} className="min-h-24 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                  </FormField>
                </CardBody>
                <CardFooter className="flex items-center justify-between gap-3">
                  <div className="text-xs text-muted">
                    Status do onboarding: <Badge variant={tenant?.onboardingStatus === "COMPLETED" ? "success" : "warning"}>{tenant?.onboardingStatus ?? context.tenantOnboardingStatus ?? "PENDENTE"}</Badge>
                  </div>
                  <Button type="submit">Salvar dados da tenant</Button>
                </CardFooter>
              </form>
            </Card>
          ) : null}

          <Card>
            <CardHeader title="Privacidade e acesso" description="Solicite a exclusao da conta quando necessario." />
            <form action={requestAccountDeletionAction}>
              <CardBody className="text-sm text-muted">
                Ao solicitar exclusao, sua conta sera desativada imediatamente e os dados pessoais serao minimizados conforme a politica de privacidade.
              </CardBody>
              <CardFooter>
                <Button type="submit" variant="secondary" className="border-danger/40 text-danger hover:bg-danger/10">Solicitar exclusao da conta</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </>
  );
}
