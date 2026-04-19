# API de Comentarios Publicos (Landing)

Referencia dos endpoints para publicar, listar, editar e excluir comentarios exibidos na landing page.

Para executar requests no VS Code com REST Client, use [api.http](api.http).

## Regras de autorizacao

- Apenas `SUPER_ADMIN` e `ADMIN` podem criar, editar e excluir comentarios.
- Todas as operacoes sao restritas ao `tenantId` da sessao autenticada.
- A landing publica exibe apenas os **20 comentarios mais recentes**.

## Endpoints

### GET /api/tenants/comments

Lista comentarios do tenant autenticado.

#### Query params

- `limit` (opcional): entre 1 e 20. Padrao: 5.

#### Resposta 200 (exemplo)

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "comment-id",
        "comment": "Comentario sobre a experiencia do tenant",
        "createdAt": "2026-04-19T17:20:00.000Z",
        "authorName": "Admin Sistema"
      }
    ]
  }
}
```

### POST /api/tenants/comments

Cria comentario para exibicao na landing.

#### Body

```json
{
  "comment": "Texto entre 8 e 400 caracteres"
}
```

### PUT /api/tenants/comments

Atualiza comentario existente do tenant autenticado.

#### Body

```json
{
  "commentId": "comment-id",
  "comment": "Novo texto entre 8 e 400 caracteres"
}
```

### DELETE /api/tenants/comments

Exclui comentario existente do tenant autenticado.

#### Body

```json
{
  "commentId": "comment-id"
}
```

## Erros comuns

- `AUTH_UNAUTHORIZED` (401): sessao ausente/invalida.
- `RBAC_FORBIDDEN` (403): perfil sem permissao para mutacao.
- `PUBLIC_COMMENT_NOT_FOUND` (404): comentario nao encontrado no tenant atual.
- `VALIDATION_ERROR` (400): payload invalido (ex.: comentario fora do limite).
