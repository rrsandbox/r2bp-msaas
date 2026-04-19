# VERSION-CONTROL Manual

## Objective

This manual explains how to correctly fill and maintain VERSION-CONTROL.md as the official compatibility ledger for the frozen baseline and all derived projects.

Use this document as an operational guide for release preparation, compatibility management, and maintenance across parallel version lines (for example, 1.x and 2.x).

## When to Update VERSION-CONTROL.md

Update VERSION-CONTROL.md whenever one of the following happens:

- A new version is released.
- A compatibility decision is made.
- A contract is intentionally broken.
- A derived project is created from the baseline.
- A maintenance fix is released on support branch (for example, support/1.x).

## Source of Truth Priority

When information conflicts, follow this order:

1. Git tag and commit history.
2. VERSION-CONTROL.md entries.
3. PR description.
4. Other docs.

## SemVer Decision Rules

Choose version type using these rules:

- MAJOR (X.0.0): incompatible contract change.
- MINOR (X.Y.0): backward-compatible feature.
- PATCH (X.Y.Z): backward-compatible fix.

Quick decision table:

| Scenario | Version Type |
|---|---|
| API shape changed in a breaking way | MAJOR |
| New endpoint, backward-compatible | MINOR |
| Security fix without breaking contract | PATCH |
| Internal refactor with no behavior break | PATCH |

## Required Sections to Maintain

Always keep these sections valid in VERSION-CONTROL.md:

- Baseline Status
- Versioning Policy
- Compatibility Contracts
- Change Log Entries
- Derived Project Registration
- Governance Checklist

## Step-by-Step: Releasing a New Version

### 1) Confirm release branch and target

Example:

- support/1.x for maintenance releases (1.0.1, 1.0.2)
- next/2.0 for next major line (2.0.0)

### 2) Update project version

Update package.json version using SemVer.

### 3) Add changelog entry in VERSION-CONTROL.md

Insert a new entry at the top of "Change Log Entries" using the template:

- [X.Y.Z] - YYYY-MM-DD
- Type: MAJOR|MINOR|PATCH
- Summary
- Compatibility impact
- Migration notes
- References (PR and commit list)

### 4) Document compatibility impact explicitly

At minimum, include:

- Breaking: yes|no
- Affected contracts: API envelope | auth | audit | tenant isolation | other

### 5) Add migration notes if needed

If breaking or behavior-sensitive changes exist, write exact migration steps.

### 6) Validate governance

Run checks and tests before tagging:

- npm run version:check-ledger
- npm run typecheck
- npm run test (or selected release suite)

### 7) Tag and publish

Create tag aligned with release version, for example:

- v1.0.1
- v2.0.0

### 8) Backport strategy

If a fix must exist in both branches:

- Apply to maintenance branch (support/1.x).
- Cherry-pick to next line if still relevant (next/2.0).
- Register both references in release notes.

## How to Register a Derived Project

When a new project is derived, add one row in "Derived Project Registration" with:

- Derived Project: repository or project name
- Initial Version: usually 0.1.0
- Derived From Version: for example 1.0.0
- Derived From Commit: exact hash
- Date: creation date
- Compatibility Target: for example 1.x

Example row:

| Derived Project | Initial Version | Derived From Version | Derived From Commit | Date | Compatibility Target |
|---|---:|---:|---|---|---|
| my-derived-app | 0.1.0 | 1.0.0 | 06dd89c | 2026-04-19 | 1.x |

## How to Record a Breaking Change (MAJOR)

When a contract is broken intentionally:

- Bump MAJOR version.
- Add explicit "Breaking: yes" in compatibility impact.
- List affected contracts.
- Add migration notes with concrete old/new behavior.
- Include references to PR and commit(s).

Example migration notes format:

- Old: endpoint returned field "foo".
- New: endpoint returns "fooDetails".
- Action required: consumers must map fooDetails before deploy.

## Release Quality Checklist (Operational)

Before finalizing a version, verify all items:

- [ ] Version in package.json matches intended release.
- [ ] New changelog entry exists in VERSION-CONTROL.md.
- [ ] Compatibility impact declared.
- [ ] Migration notes present when needed.
- [ ] version:check-ledger passed.
- [ ] typecheck passed.
- [ ] test suite passed.
- [ ] Release tag created and pushed.
- [ ] Branch strategy respected (support/1.x, next/2.0).

## Common Mistakes to Avoid

- Releasing without changelog entry.
- Bumping version but not tagging.
- Applying maintenance fixes only in next major branch.
- Omitting compatibility impact statement.
- Treating a breaking change as MINOR or PATCH.

## Suggested Ownership

- Engineering lead: version decision and compatibility sign-off.
- Maintainer: ledger update and tag creation.
- Reviewer: confirms migration notes and contract impact.

## Quick Templates

### New release entry

```md
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

### Backport note (optional line in Summary)

```md
- Backport: fix cherry-picked from next/2.0 to support/1.x (commit abc1234).
```

## Final Note

VERSION-CONTROL.md is not only a changelog. It is a compatibility contract ledger. Keep entries concise, explicit, and auditable.
