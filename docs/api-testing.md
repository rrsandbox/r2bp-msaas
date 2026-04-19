# Troubleshooting de testes de API

Guia rapido para depurar falhas ao executar as colecoes REST Client:

- [api.http](api.http)
- [access-api.http](access-api.http)
- [agenda-api.http](agenda-api.http)

## Start rapido do ambiente local

Para subir tudo em um comando (Supabase + migrations + seed + check + app):

```bash
npm run dev:local
```

Ao finalizar o bootstrap, o terminal exibe a mensagem de ambiente pronto e inicia o servidor em `http://localhost:3000`.

## Pre-flight checklist

1. API local no ar (`npm run dev`) em `http://localhost:3000`
2. Supabase local em execucao (`npx supabase start`)
3. Banco preparado em uma linha (`npm run db:prepare-local`)
4. Variaveis de ambiente carregadas (`.env`)
5. Cookie de sessao valido no arquivo `.http`
6. IDs de referencia preenchidos (`userId`, `featureId`, `permissionId`, `eventId`)

Valide o setup com um unico request antes dos testes:

```http
GET /api/system/setup
```

Esse endpoint retorna:

- `databaseConnected`
- `migrationTablePresent`
- `tables` (Tenant, User, TenantMembership, AgendaEvent, AccessFeature, UserFeaturePermission)
- `missingTables`
- `recommendations`

## Setup rapido com seed local

Execute:

```bash
npm run db:prepare-local
```

O comando executa em sequencia:

1. `db:deploy` (aplica migrations)
2. `db:seed` (carrega dados base)
3. `db:check-local` (valida tabelas criticas e falha se houver lacunas)

Dados de acesso seeded:

- Tenant slug: `sistema`
- Usuario admin (sem 2FA): `admin@sistema.local`
- Senha admin: `ChangeMe123!`

O seed imprime no terminal os IDs de referencia para acelerar o preenchimento de `userId`, `featureId` e `eventId` nas colecoes `.http`.

## Como obter o SESSION_TOKEN

1. Faça login pela aplicacao web.
2. Abra o DevTools do navegador.
3. Copie o valor do cookie de sessao usado pela autenticacao.
4. No arquivo `.http`, defina:

```http
@cookie = authjs.session-token=SEU_TOKEN
```

Se estiver usando outro nome de cookie no ambiente, substitua a chave mantendo o mesmo formato `nome=valor`.

## Formato de resposta esperado

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
    "code": "ERROR_CODE",
    "message": "Descricao do erro",
    "details": {}
  }
}
```

## Erros comuns e como corrigir

### 401 Unauthorized

Causa comum:
- Cookie ausente, expirado ou invalido.

Como corrigir:
1. Refazer login e atualizar `@cookie`.
2. Confirmar que o host no arquivo `.http` corresponde ao ambiente logado.

### 403 Forbidden (`RBAC_FORBIDDEN`)

Causa comum:
- Usuario autenticado sem permissao para o endpoint.

Como corrigir:
1. Validar role do usuario.
2. Validar feature habilitada para o tenant.
3. Validar override por usuario (quando aplicavel).

### 404 Not Found

Causa comum:
- `eventId`, `featureId` ou `permissionId` inexistente.

Como corrigir:
1. Executar primeiro os requests de listagem.
2. Copiar IDs reais retornados pela API.

### 422 Validation Error

Causa comum:
- Payload fora do schema (datas invalidas, campos obrigatorios faltando, etc.).

Como corrigir:
1. Conferir corpo JSON no request.
2. Garantir ISO date-time valido em campos de data/hora.
3. Reexecutar com payload minimo valido e evoluir incrementalmente.

### 500 Internal Server Error

Causa comum:
- Erro de infraestrutura local (DB indisponivel, migrações pendentes, config incorreta).

Como corrigir:
1. Verificar logs do terminal da API.
2. Confirmar Supabase ativo.
3. Confirmar migracoes aplicadas.

## Ordem recomendada para smoke test manual

1. `GET /api/system/status`
2. Fluxo Access (listar -> criar feature -> listar permissoes -> upsert permissao -> remover permissao)
3. Fluxo Agenda (listar -> criar evento -> atualizar -> remover)

## Dicas de produtividade

- Reaproveite variaveis no topo dos arquivos `.http`.
- Execute primeiro requests sem side effects (`GET`).
- Ao criar recursos, copie o ID retornado para as variaveis subsequentes.
- Use `traceId` para correlacionar resposta e logs quando disponivel.
