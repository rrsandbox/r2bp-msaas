# Version Control and Compatibility Ledger

## Purpose

This file is the official ledger for baseline versioning, fixes, improvements, and compatibility decisions.

Use it as the single source of truth when this repository is frozen and used as a starting point for derived projects.

## Baseline Status

- Baseline name: `r2bp-msaas`
- Baseline state: `FROZEN`
- Freeze date: `2026-04-19`
- Baseline version: `1.0.0`
- Baseline branch: `feat/logs-auditoria`
- Baseline commit: `0670c41`

## Versioning Policy

Use SemVer:

- `MAJOR` for incompatible changes.
- `MINOR` for backward-compatible new features.
- `PATCH` for backward-compatible fixes.

Compatibility rules for derived projects:

- A derived project claiming compatibility with baseline `1.x.y` must not break contracts listed in "Compatibility Contracts".
- Any intentional contract break requires a MAJOR bump and an explicit migration note.

## Compatibility Contracts (Must Preserve)

### API envelope contract

- Success envelope:
  - `ok: true`
  - `traceId?: string`
  - `timestamp: string`
  - `data: unknown`
- Error envelope:
  - `ok: false`
  - `traceId?: string`
  - `timestamp: string`
  - `error.code: string`
  - `error.message: string`
  - `error.details?: object`

### Auth and security baseline

- Protected APIs must require session/auth context.
- RBAC denial must keep using forbidden semantics (`403`) where applicable.
- Unauthorized access must keep using unauthorized semantics (`401`) where applicable.
- Security headers/CSP behavior from `src/proxy.ts` must be preserved or tightened.

### Audit and observability baseline

- Audit logs must keep tenant scoping.
- Audit retention must default to safe mode (dry-run) unless explicit destructive confirmation is provided.
- CSV export must preserve CSV-injection protection.

### Tenant isolation baseline

- Tenant data access must remain scoped by `tenantId` unless explicitly `SUPER_ADMIN`.

## Change Log Entries

> Add one entry per released version in reverse chronological order.

### [1.0.0] - 2026-04-19

Type: `MAJOR` (frozen baseline release)

Summary:

- Finalized tenant PF/PJ flows and validation.
- Hardened auth and password reset flow.
- Added CSP via `src/proxy.ts`.
- Added audit logs API, export, retention, and audit UI.
- Added retention safety controls and audit tests.

Compatibility impact:

- Baseline contracts established.
- No known breaking changes relative to this frozen baseline itself.

Migration notes:

- None.

## Entry Template

Copy and fill this template for each new version:

```
### [X.Y.Z] - YYYY-MM-DD
Type: MAJOR|MINOR|PATCH

Summary:
- ...

Compatibility impact:
- Breaking: yes|no
- Affected contracts: API envelope | auth | audit | tenant isolation | other

Migration notes:
- ...

References:
- PR: ...
- Commit(s): ...
```

## Derived Project Registration

Each derived project should add one record here when created.

| Derived Project | Initial Version | Derived From Version | Derived From Commit | Date | Compatibility Target |
|---|---:|---:|---|---|---|
| (fill) | 0.1.0 | 1.0.0 | 0670c41 | YYYY-MM-DD | 1.x |

## Governance Checklist (Before Releasing New Version)

- [ ] Version number updated (SemVer).
- [ ] Change entry added in this file.
- [ ] Compatibility impact explicitly documented.
- [ ] Migration notes added for any break.
- [ ] Tests and typecheck executed.
- [ ] Security-sensitive changes reviewed.

## Recommended Companion Files

- `README.md` for project-level documentation.
- `docs/` for endpoint and operational runbooks.
- `VERSION-CONTROL.md` (this file) as the compatibility ledger.
- `VERSION-CONTROL-MANUAL.md` for operational instructions on how to fill and maintain this ledger.
