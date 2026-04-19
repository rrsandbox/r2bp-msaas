# API de Acessos (Features e Permissoes)

Esta referencia descreve os endpoints de gestao de features e permissoes por usuario/tenant.

Para executar requests direto no VS Code com a extensao REST Client, use [access-api.http](access-api.http).

## Envelopes padrao

### Sucesso

```json
{
  "ok": true,
  "traceId": "optional-request-id",
  "timestamp": "2026-04-18T12:00:00.000Z",
  "data": {}
}
```

### Erro

```json
{
  "ok": false,
  "traceId": "optional-request-id",
  "timestamp": "2026-04-18T12:00:00.000Z",
  "error": {
    "code": "RBAC_FORBIDDEN",
    "message": "Permissao insuficiente para esta operacao.",
    "details": {}
  }
}
```

## Autorizacao

- Leitura: permissao `access:read`
- Escrita: permissao `access:write`

A autorizacao considera RBAC e politica dinamica por tenant/usuario.

## Testes manuais com curl

Use uma sessao autenticada (cookie do Auth.js) para testar os endpoints protegidos.

### Variaveis uteis

```bash
HOST="http://localhost:3000"
COOKIE="next-auth.session-token=<SEU_COOKIE_AQUI>"
```

No Windows PowerShell, prefira `curl.exe` para evitar conflitos com alias.

### Listar features

```bash
curl -X GET "$HOST/api/access/features" \
  -H "Cookie: $COOKIE"
```

### Criar feature

```bash
curl -X POST "$HOST/api/access/features" \
  -H "Content-Type: application/json" \
  -H "Cookie: $COOKIE" \
  -d '{
    "key": "agenda:read",
    "name": "Agenda leitura",
    "description": "Permite consultar agenda",
    "route": "/agenda",
    "showInMenu": true,
    "showInDashboard": true,
    "sortOrder": 10,
    "enabled": true
  }'
```

### Listar permissoes customizadas

```bash
curl -X GET "$HOST/api/access/permissions" \
  -H "Cookie: $COOKIE"
```

### Criar/atualizar permissao

```bash
curl -X PUT "$HOST/api/access/permissions" \
  -H "Content-Type: application/json" \
  -H "Cookie: $COOKIE" \
  -d '{
    "userId": "user-id",
    "featureId": "feature-id",
    "canAccess": true
  }'
```

### Remover permissao

```bash
curl -X DELETE "$HOST/api/access/permissions" \
  -H "Content-Type: application/json" \
  -H "Cookie: $COOKIE" \
  -d '{
    "permissionId": "permission-id"
  }'
```

---

## Features de acesso

### GET /api/access/features

Lista as features de acesso no escopo autorizado.

#### Resposta 200 (exemplo)

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "feature-id",
        "tenantId": "tenant-id",
        "tenantName": "Tenant Sistema",
        "tenantSlug": "tenant-sistema",
        "key": "agenda:read",
        "name": "Agenda leitura",
        "description": "Permite consultar agenda",
        "route": "/agenda",
        "showInMenu": true,
        "showInDashboard": true,
        "sortOrder": 10,
        "enabled": true,
        "createdAt": "2026-04-18T10:00:00.000Z",
        "updatedAt": "2026-04-18T10:00:00.000Z"
      }
    ]
  }
}
```

### POST /api/access/features

Cria uma nova feature de acesso.

#### Body

```json
{
  "key": "agenda:read",
  "name": "Agenda leitura",
  "description": "Permite consultar agenda",
  "route": "/agenda",
  "showInMenu": true,
  "showInDashboard": true,
  "sortOrder": 10,
  "enabled": true
}
```

#### Regras

- `key`: minusculo, com letras, numeros, `:`, `_`, `-`
- `route`: deve iniciar com `/` quando informada
- Escopo por tenant respeitado no backend

---

## Permissoes por usuario

### GET /api/access/permissions

Lista permissoes customizadas (matriz usuario x feature).

#### Resposta 200 (exemplo)

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "permission-id",
        "tenantId": "tenant-id",
        "tenantName": "Tenant Sistema",
        "tenantSlug": "tenant-sistema",
        "userId": "user-id",
        "userName": "Admin",
        "userEmail": "admin@tenant.local",
        "featureId": "feature-id",
        "featureKey": "agenda:read",
        "featureName": "Agenda leitura",
        "featureEnabled": true,
        "canAccess": true,
        "updatedAt": "2026-04-18T10:30:00.000Z"
      }
    ]
  }
}
```

### PUT /api/access/permissions

Cria ou atualiza permissao customizada para usuario/feature.

#### Body

```json
{
  "userId": "user-id",
  "featureId": "feature-id",
  "canAccess": true
}
```

### DELETE /api/access/permissions

Remove permissao customizada pelo id.

#### Body

```json
{
  "permissionId": "permission-id"
}
```

#### Resposta 200 (exemplo)

```json
{
  "ok": true,
  "data": {
    "deleted": true,
    "permissionId": "permission-id"
  }
}
```

---

## Eventos de auditoria gerados

- `ACCESS_FEATURE_CREATED`
- `ACCESS_FEATURE_UPDATED`
- `ACCESS_FEATURE_DELETED`
- `ACCESS_PERMISSION_UPDATED`
- `ACCESS_PERMISSION_DELETED`

---

## Cenarios de erro comuns

- `RBAC_FORBIDDEN`: usuario sem permissao
- `ACCESS_FEATURE_NOT_FOUND`: feature inexistente no tenant
- `ACCESS_PERMISSION_NOT_FOUND`: permissao inexistente
- `USER_NOT_FOUND`: usuario nao pertence ao tenant
- `VALIDATION_ERROR`: payload invalido
