# API de Sistema

Referencia rapida dos endpoints de diagnostico de sistema.

## GET /api/system/status

Health check basico do servico.

### Resposta 200 (exemplo)

```json
{
  "ok": true,
  "data": {
    "service": "r2bp-msaas",
    "status": "ok"
  }
}
```

## GET /api/system/setup

Diagnostico de setup local para validar conectividade e schema antes de rodar smoke tests.

### O que valida

- Conectividade com banco (`databaseConnected`)
- Presenca da tabela de migracoes (`migrationTablePresent`)
- Existencia das tabelas criticas:
  - `Tenant`
  - `User`
  - `TenantMembership`
  - `AgendaEvent`
  - `AccessFeature`
  - `UserFeaturePermission`

### Resposta 200 (exemplo)

```json
{
  "ok": true,
  "data": {
    "service": "r2bp-msaas",
    "status": "degraded",
    "databaseConnected": true,
    "migrationTablePresent": true,
    "tables": [
      { "table": "Tenant", "exists": true },
      { "table": "User", "exists": true },
      { "table": "TenantMembership", "exists": true },
      { "table": "AgendaEvent", "exists": true },
      { "table": "AccessFeature", "exists": false },
      { "table": "UserFeaturePermission", "exists": false }
    ],
    "missingTables": ["AccessFeature", "UserFeaturePermission"],
    "recommendations": [
      "Aplique as migracoes pendentes e rode npm run db:seed novamente."
    ]
  }
}
```

## Uso recomendado

1. Chame `GET /api/system/setup` antes do smoke test manual.
2. Se houver tabelas faltando, rode migration/seed.
3. Reexecute o setup check para confirmar ambiente pronto.
