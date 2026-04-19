# How To: Criar Novo Projeto a Partir do Baseline 1.0

## Objetivo

Este guia mostra como iniciar um novo projeto derivado a partir do estado atual do repositório, preservando compatibilidade, rastreabilidade e governança de versões.

Ponto de partida recomendado:

- Tag de baseline: `v1.0.0`
- Ledger de compatibilidade: `VERSION-CONTROL.md`
- Manual do ledger: `VERSION-CONTROL-MANUAL.md`

## Estrategia de Origem (Qual base usar)

Use esta regra:

- `v1.0.0`: melhor escolha para novo derivado estável.
- `support/1.x`: quando quiser herdar hotfixes já aplicados na linha 1.x.
- `next/2.0`: apenas se o derivado já nascer mirando a linha 2.x.

## Fluxo A (Recomendado): Criar Derivado Mantendo Histórico Git

### 1) Clonar e partir da tag

```bash
git clone https://github.com/rrsandbox/r2bp-msaas.git meu-novo-projeto
cd meu-novo-projeto
git checkout v1.0.0
git switch -c init/meu-novo-projeto
```

### 2) Trocar remoto para o novo repositório

```bash
git remote remove origin
git remote add origin https://github.com/seu-org/meu-novo-projeto.git
git push -u origin init/meu-novo-projeto
```

### 3) Validar baseline no novo projeto

```bash
npm install
npm run typecheck
npm run version:check-ledger
```

## Fluxo B: Criar Derivado Sem Histórico Git (Repo Limpo)

Use este fluxo quando você quer um repositório novo sem histórico antigo.

### 1) Clonar e posicionar na tag

```bash
git clone https://github.com/rrsandbox/r2bp-msaas.git meu-novo-projeto
cd meu-novo-projeto
git checkout v1.0.0
```

### 2) Remover histórico e reiniciar

PowerShell:

```powershell
Remove-Item -Recurse -Force .git
git init
git add .
git commit -m "chore: initialize project from r2bp-msaas v1.0.0"
git branch -M main
git remote add origin https://github.com/seu-org/meu-novo-projeto.git
git push -u origin main
```

## Ajustes Obrigatórios no Novo Projeto

### 1) Identidade e metadados

- Atualizar `name` e `version` no `package.json`.
- Ajustar conteúdo de `README.md` para o novo domínio/produto.

### 2) Registro de derivação no ledger

No `VERSION-CONTROL.md`, seção "Derived Project Registration", adicionar uma linha com:

- Nome do projeto derivado
- Versão inicial (ex.: 0.1.0)
- Versão de origem (ex.: 1.0.0)
- Commit/tag de origem
- Data de criação
- Alvo de compatibilidade (ex.: 1.x)

### 3) Ambiente e execução

- Revisar `.env` e variáveis obrigatórias.
- Validar scripts de banco e execução local.

## Checklist de Primeiro Dia

Execute no projeto derivado:

```bash
npm install
npm run typecheck
npm run test
npm run version:check-ledger
```

Checklist:

- [ ] Projeto compila sem erros.
- [ ] Testes críticos passam.
- [ ] Ledger está consistente.
- [ ] Registro de derivação foi preenchido.
- [ ] README e metadados foram atualizados.

## Governança de Versão no Derivado

Regra SemVer para o derivado:

- MAJOR: quebra de compatibilidade.
- MINOR: nova funcionalidade compatível.
- PATCH: correção compatível.

Antes de cada release do derivado:

- Atualizar `package.json`.
- Adicionar entrada em `VERSION-CONTROL.md`.
- Rodar `npm run version:check-ledger`.
- Criar tag da release (ex.: `v0.1.0`, `v0.1.1`).

## Backport e Evolução Paralela

Se seu derivado tiver duas linhas ativas (ex.: `support/1.x` e `next/2.0`):

- Correções de produção: aplicar em `support/1.x`.
- Evolução maior: aplicar em `next/2.0`.
- Quando necessário, usar cherry-pick entre linhas com registro no ledger.

## Erros Comuns

- Iniciar derivado direto da branch de feature em vez da tag estável.
- Esquecer de trocar o remoto.
- Não registrar derivação no ledger.
- Publicar release sem atualizar changelog/compatibilidade.

## Decisão Rápida

Se houver dúvida, use sempre:

1. Origem: `v1.0.0`
2. Fluxo: A (com histórico)
3. Compatibilidade alvo: `1.x`

Isso garante maior previsibilidade para manutenção futura.
