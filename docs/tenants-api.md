# API de Clientes (Tenants)

## Objetivo

Documentar o contrato atual da API de clientes com suporte a cadastro de PF/PJ e representante legal obrigatorio para PJ.

## Autenticacao

Todas as rotas exigem sessao ativa via cookie:

- `Cookie: authjs.session-token=<SESSION_TOKEN>`

## GET /api/tenants

Lista tenants visiveis para o usuario autenticado.

### Resposta 200 (resumo)

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "tenant_id",
        "name": "Cliente Exemplo",
        "slug": "cliente-exemplo",
        "status": "active",
        "onboardingStatus": "PENDING",
        "personType": "PF",
        "registrationId": "12345678901",
        "admins": 1,
        "createdAt": "2026-04-19T12:00:00.000Z"
      }
    ]
  }
}
```

## POST /api/tenants

Cria tenant. O campo `legalProfile` e obrigatorio.

### Exemplo PF

```json
{
  "name": "Cliente PF",
  "slug": "cliente-pf",
  "legalProfile": {
    "personType": "PF",
    "qualification": {
      "fullName": "Maria Souza",
      "document": {
        "type": "CPF",
        "number": "12345678901"
      },
      "birthDate": "1990-02-10",
      "email": "maria@example.com",
      "phone": "11999990000",
      "occupation": "Engenheira"
    }
  },
  "billingProfile": {
    "contactEmail": "maria@example.com",
    "contactPhone": "11999990000",
    "personType": "PF"
  },
  "adminProfile": {
    "personType": "PF",
    "fullName": "Maria Souza",
    "email": "maria@example.com"
  }
}
```

### Exemplo PJ

```json
{
  "name": "Cliente PJ",
  "slug": "cliente-pj",
  "legalProfile": {
    "personType": "PJ",
    "qualification": {
      "corporateName": "Cliente PJ LTDA",
      "tradeName": "Cliente PJ",
      "document": {
        "type": "CNPJ",
        "number": "12345678000199"
      },
      "email": "contato@clientepj.com",
      "phone": "1133330000",
      "mainActivity": "Servicos"
    },
    "legalRepresentative": {
      "fullName": "Joao Silva",
      "document": {
        "type": "CPF",
        "number": "98765432100"
      },
      "birthDate": "1988-03-20",
      "email": "joao@clientepj.com",
      "phone": "11998887766",
      "occupation": "Administrador"
    }
  },
  "billingProfile": {
    "contactEmail": "contato@clientepj.com",
    "contactPhone": "1133330000",
    "personType": "PJ"
  },
  "adminProfile": {
    "personType": "PF",
    "fullName": "Joao Silva",
    "email": "joao@clientepj.com"
  }
}
```

## PATCH /api/tenants/:tenantId

Atualiza tenant existente. Campos aceitos:

- `name`
- `slug`
- `status` (`active`, `inactive`, `archived`)
- `onboardingStatus` (`PENDING`, `IN_PROGRESS`, `COMPLETED`)
- `legalProfile` (PF ou PJ com representante)
- `billingProfile`
- `adminProfile`

## DELETE /api/tenants/:tenantId

Remove tenant (somente papel autorizado no RBAC).
