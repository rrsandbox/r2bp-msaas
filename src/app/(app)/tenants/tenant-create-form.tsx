"use client";

import { useState } from "react";

import { Button, FormField } from "@/ui/components";

export type TenantFormInitialValues = {
  tenantId?: string;
  name?: string;
  slug?: string;
  personType?: "PF" | "PJ";
  pfFullName?: string;
  pfCpf?: string;
  pfBirthDate?: string;
  pfEmail?: string;
  pfPhone?: string;
  pfOccupation?: string;
  pfIdentityDocument?: string;
  pjCorporateName?: string;
  pjTradeName?: string;
  pjCnpj?: string;
  pjEmail?: string;
  pjPhone?: string;
  pjMainActivity?: string;
  repFullName?: string;
  repCpf?: string;
  repBirthDate?: string;
  repEmail?: string;
  repPhone?: string;
  repOccupation?: string;
  repIdentityDocument?: string;
};

type TenantProfileFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  returnTo: string;
  submitLabel: string;
  initialValues?: TenantFormInitialValues;
};

function TenantProfileForm({ action, returnTo, submitLabel, initialValues }: TenantProfileFormProps) {
  const [personType, setPersonType] = useState<"PF" | "PJ">(initialValues?.personType ?? "PF");

  return (
    <form action={action}>
      <div className="space-y-4">
        <input type="hidden" name="returnTo" value={returnTo} />
        {initialValues?.tenantId ? <input type="hidden" name="tenantId" value={initialValues.tenantId} /> : null}

        <FormField label="Nome do Cliente" required>
          <input
            type="text"
            name="name"
            placeholder="Ex: Acme Corporation"
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            defaultValue={initialValues?.name ?? ""}
            required
          />
        </FormField>

        <FormField label="Tipo de Pessoa" required>
          <select
            name="personType"
            value={personType}
            onChange={(event) => setPersonType(event.target.value as "PF" | "PJ")}
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            required
          >
            <option value="PF">Pessoa Fisica (PF)</option>
            <option value="PJ">Pessoa Juridica (PJ)</option>
          </select>
        </FormField>

        <FormField label="Slug (Identificador)" hint="URL-friendly identifier. Ex: acme-corp">
          <input
            type="text"
            name="slug"
            placeholder="Ex: acme-corp"
            className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            defaultValue={initialValues?.slug ?? ""}
          />
        </FormField>

        {personType === "PF" ? (
          <>
            <FormField label="Nome completo (PF)" required>
              <input type="text" name="pfFullName" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" defaultValue={initialValues?.pfFullName ?? ""} required={personType === "PF"} />
            </FormField>
            <FormField label="CPF" required>
              <input type="text" name="pfCpf" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" defaultValue={initialValues?.pfCpf ?? ""} required={personType === "PF"} />
            </FormField>
            <FormField label="Data de nascimento" required>
              <input type="date" name="pfBirthDate" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" defaultValue={initialValues?.pfBirthDate ?? ""} required={personType === "PF"} />
            </FormField>
            <FormField label="E-mail" required>
              <input type="email" name="pfEmail" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" defaultValue={initialValues?.pfEmail ?? ""} required={personType === "PF"} />
            </FormField>
            <FormField label="Telefone" required>
              <input type="text" name="pfPhone" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" defaultValue={initialValues?.pfPhone ?? ""} required={personType === "PF"} />
            </FormField>
            <FormField label="Profissao" required>
              <input type="text" name="pfOccupation" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" defaultValue={initialValues?.pfOccupation ?? ""} required={personType === "PF"} />
            </FormField>
            <FormField label="Documento de identidade">
              <input type="text" name="pfIdentityDocument" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" defaultValue={initialValues?.pfIdentityDocument ?? ""} />
            </FormField>
          </>
        ) : (
          <>
            <FormField label="Razao social" required>
              <input type="text" name="pjCorporateName" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" defaultValue={initialValues?.pjCorporateName ?? ""} required={personType === "PJ"} />
            </FormField>
            <FormField label="Nome fantasia">
              <input type="text" name="pjTradeName" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" defaultValue={initialValues?.pjTradeName ?? ""} />
            </FormField>
            <FormField label="CNPJ" required>
              <input type="text" name="pjCnpj" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" defaultValue={initialValues?.pjCnpj ?? ""} required={personType === "PJ"} />
            </FormField>
            <FormField label="E-mail corporativo" required>
              <input type="email" name="pjEmail" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" defaultValue={initialValues?.pjEmail ?? ""} required={personType === "PJ"} />
            </FormField>
            <FormField label="Telefone corporativo" required>
              <input type="text" name="pjPhone" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" defaultValue={initialValues?.pjPhone ?? ""} required={personType === "PJ"} />
            </FormField>
            <FormField label="Atividade principal" required>
              <input type="text" name="pjMainActivity" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" defaultValue={initialValues?.pjMainActivity ?? ""} required={personType === "PJ"} />
            </FormField>

            <div className="rounded-lg border border-border/70 bg-surface-contrast/65 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Representante legal</p>
              <div className="mt-3 space-y-3">
                <FormField label="Nome completo do representante" required>
                  <input type="text" name="repFullName" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" defaultValue={initialValues?.repFullName ?? ""} required={personType === "PJ"} />
                </FormField>
                <FormField label="CPF do representante" required>
                  <input type="text" name="repCpf" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" defaultValue={initialValues?.repCpf ?? ""} required={personType === "PJ"} />
                </FormField>
                <FormField label="Data de nascimento" required>
                  <input type="date" name="repBirthDate" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" defaultValue={initialValues?.repBirthDate ?? ""} required={personType === "PJ"} />
                </FormField>
                <FormField label="E-mail" required>
                  <input type="email" name="repEmail" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" defaultValue={initialValues?.repEmail ?? ""} required={personType === "PJ"} />
                </FormField>
                <FormField label="Telefone" required>
                  <input type="text" name="repPhone" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" defaultValue={initialValues?.repPhone ?? ""} required={personType === "PJ"} />
                </FormField>
                <FormField label="Qualificacao/profissao" required>
                  <input type="text" name="repOccupation" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" defaultValue={initialValues?.repOccupation ?? ""} required={personType === "PJ"} />
                </FormField>
                <FormField label="Documento de identidade">
                  <input type="text" name="repIdentityDocument" className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" defaultValue={initialValues?.repIdentityDocument ?? ""} />
                </FormField>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-4">
        <Button type="submit" variant="primary">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

type TenantCreateFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  returnTo: string;
};

export function TenantCreateForm({ action, returnTo }: TenantCreateFormProps) {
  return <TenantProfileForm action={action} returnTo={returnTo} submitLabel="Cadastrar Cliente" />;
}

type TenantEditFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  returnTo: string;
  initialValues: TenantFormInitialValues;
};

export function TenantEditForm({ action, returnTo, initialValues }: TenantEditFormProps) {
  return (
    <TenantProfileForm
      action={action}
      returnTo={returnTo}
      submitLabel="Salvar Alteracoes"
      initialValues={initialValues}
    />
  );
}
