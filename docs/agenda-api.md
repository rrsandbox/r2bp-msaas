# API de Agenda

Referencia dos endpoints de agenda com filtros, paginação e ordenação.

## Autorizacao

- Leitura: permissao `agenda:read`
- Escrita: permissao `agenda:write`

## Endpoints

### GET /api/agenda

Lista eventos com suporte a filtros e paginação.

#### Query params

- `startsFrom` (opcional): data inicial no formato `YYYY-MM-DD`
- `startsTo` (opcional): data final no formato `YYYY-MM-DD`
- `ownerQuery` (opcional): busca por nome/e-mail do responsavel
- `page` (opcional): pagina atual, default `1`
- `pageSize` (opcional): itens por pagina, default `10`
- `startsAtSort` (opcional): `asc` ou `desc`, default `asc`

#### Resposta 200 (exemplo)

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "event-id",
        "tenantId": "tenant-id",
        "tenantName": "Tenant Sistema",
        "tenantSlug": "tenant-sistema",
        "ownerId": "user-id",
        "ownerName": "Admin",
        "ownerEmail": "admin@tenant.local",
        "title": "Reuniao de operacao",
        "description": "Revisao semanal",
        "startsAt": "2026-04-18T10:00:00.000Z",
        "endsAt": "2026-04-18T11:00:00.000Z",
        "createdAt": "2026-04-18T09:00:00.000Z",
        "updatedAt": "2026-04-18T09:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```

### POST /api/agenda

Cria evento de agenda.

#### Body

```json
{
  "title": "Reuniao de operacao",
  "description": "Revisao semanal",
  "startsAt": "2026-04-18T10:00:00.000Z",
  "endsAt": "2026-04-18T11:00:00.000Z"
}
```

### PATCH /api/agenda/[eventId]

Atualiza evento de agenda.

#### Body (exemplo)

```json
{
  "title": "Reuniao atualizada",
  "description": "Revisao semanal atualizada",
  "startsAt": "2026-04-18T10:30:00.000Z",
  "endsAt": "2026-04-18T11:30:00.000Z"
}
```

### DELETE /api/agenda/[eventId]

Remove evento de agenda.

#### Resposta 200 (exemplo)

```json
{
  "ok": true,
  "data": {
    "deleted": true
  }
}
```

## Eventos de auditoria

- `AGENDA_EVENT_CREATED`
- `AGENDA_EVENT_UPDATED`
- `AGENDA_EVENT_DELETED`

## Cenarios de erro comuns

- `RBAC_FORBIDDEN`
- `AGENDA_EVENT_NOT_FOUND`
- `VALIDATION_ERROR`
