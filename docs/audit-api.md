# API de Auditoria

## Objetivo

Disponibilizar uma consulta operacional dos eventos de auditoria do tenant autenticado,
com filtros, paginacao e resumo agregado por severidade e acao.

## Endpoint

- `GET /api/audit/logs`

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

## Boas praticas de operacao

- Consultar os ultimos eventos por severidade `WARNING` e `CRITICAL` diariamente.
- Usar `traceId` para correlacionar com logs de aplicacao (`requestId`).
- Cruzar `ACCESS_DENIED` com permissoes e papeis para revisar politicas RBAC.