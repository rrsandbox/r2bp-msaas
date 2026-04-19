# API de Auditoria

## Objetivo

Disponibilizar uma consulta operacional dos eventos de auditoria do tenant autenticado,
com filtros, paginacao e resumo agregado por severidade e acao.

## Endpoint

- `GET /api/audit/logs`
- `GET /api/audit/logs/export`
- `POST /api/system/audit/retention`

Permissao necessaria:

- `audit:read`

## Query params

- `page` (opcional): pagina atual. Padrao `1`.
- `pageSize` (opcional): itens por pagina. Padrao `20`, maximo `100`.
- `from` (opcional): data inicial ISO-8601.
- `to` (opcional): data final ISO-8601.
- `action` (opcional): filtro por acao (contains, case-insensitive).
- `resource` (opcional): filtro por recurso (contains, case-insensitive).
- `userId` (opcional): filtra eventos de um usuario especifico.
- `severity` (opcional): `INFO`, `WARNING` ou `CRITICAL`.

### Parametro extra para exportacao

- `maxRows` (opcional): limite de linhas no CSV. Padrao `1000`, maximo `10000`.

## Exemplo de resposta

```json
{
  "ok": true,
  "traceId": "b2f95d67-1c80-4476-88c8-98590ce66f08",
  "timestamp": "2026-04-19T20:10:25.162Z",
  "data": {
    "logs": {
      "total": 128,
      "page": 1,
      "pageSize": 20,
      "totalPages": 7,
      "items": [
        {
          "id": "...",
          "action": "ACCESS_DENIED",
          "resource": "tenant:update",
          "severity": "WARNING",
          "payload": {
            "requiredPermission": "tenant:update"
          },
          "createdAt": "2026-04-19T20:05:02.001Z",
          "user": {
            "id": "...",
            "name": "Admin",
            "email": "admin@sistema.local"
          }
        }
      ]
    },
    "summary": {
      "bySeverity": [
        { "severity": "INFO", "count": 102 },
        { "severity": "WARNING", "count": 24 },
        { "severity": "CRITICAL", "count": 2 }
      ],
      "topActions": [
        { "action": "PUBLIC_TENANT_COMMENT_CREATED", "count": 33 },
        { "action": "ACCESS_DENIED", "count": 22 }
      ]
    },
    "filters": {
      "page": 1,
      "pageSize": 20,
      "from": "2026-04-01T00:00:00.000Z",
      "to": "2026-04-19T23:59:59.000Z",
      "action": "ACCESS_DENIED",
      "resource": null,
      "userId": null,
      "severity": "WARNING"
    }
  }
}
```

## Exportacao CSV

Exemplo:

`GET /api/audit/logs/export?severity=WARNING&action=ACCESS_DENIED&maxRows=2000`

Retorna `text/csv` com colunas:

- `id`
- `tenantId`
- `userId`
- `userName`
- `userEmail`
- `action`
- `resource`
- `severity`
- `payload`
- `createdAt`

## Retencao automatizada

Endpoint:

- `POST /api/system/audit/retention`

Permissao e escopo:

- requer autenticacao com `task:read`
- restrito a `SUPER_ADMIN`

Payload de exemplo:

```json
{
  "retentionDays": 180,
  "dryRun": true,
  "tenantId": "opcional-uuid-do-tenant"
}
```

Para executar delecao real (`dryRun=false`), e obrigatorio informar:

- `confirmDelete: true`
- `reason` com no minimo 10 caracteres

Resposta de exemplo:

```json
{
  "ok": true,
  "data": {
    "result": {
      "retentionDays": 180,
      "cutoff": "2025-10-21T00:00:00.000Z",
      "eligibleCount": 2380,
      "deletedCount": 0,
      "dryRun": true,
      "tenantId": null
    }
  }
}
```

## Script de operacao

Comando local:

- Basico: `npm run audit:retention`
- Com parametros (Windows PowerShell, default seguro em dry-run):

```powershell
$env:AUDIT_RETENTION_DAYS='180'
$env:AUDIT_RETENTION_DRY_RUN='true'
$env:AUDIT_RETENTION_TENANT_ID='<tenantId-opcional>'
npm run audit:retention
Remove-Item Env:AUDIT_RETENTION_DAYS -ErrorAction SilentlyContinue
Remove-Item Env:AUDIT_RETENTION_DRY_RUN -ErrorAction SilentlyContinue
Remove-Item Env:AUDIT_RETENTION_TENANT_ID -ErrorAction SilentlyContinue
```

Execucao destrutiva (exige confirmacao + motivo):

```powershell
$env:AUDIT_RETENTION_EXECUTE='true'
$env:AUDIT_RETENTION_CONFIRM_DELETE='true'
$env:AUDIT_RETENTION_REASON='retencao semestral aprovada pelo compliance'
npm run audit:retention
```

## Boas praticas de operacao

- Consultar os ultimos eventos por severidade `WARNING` e `CRITICAL` diariamente.
- Usar `traceId` para correlacionar com logs de aplicacao (`requestId`).
- Cruzar `ACCESS_DENIED` com permissoes e papeis para revisar politicas RBAC.