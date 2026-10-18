# ADR 0008: Store profiles and progress in PostgreSQL

**Status:** Accepted (owner decision, 2026-10-18)

## Context

[ADR 0006](0006-support-profiles-without-personal-details.md) requires learner profiles with saved progress across sessions and devices, which makes durable server-side storage a concrete requirement while leaving the technology open.

The data is small and record-shaped: one profile per learner (internal identity, learner-visible ID, credential hash, optional recovery-email state) and one observation per delivered exercise instance (definition ID, version, seed, submissions with typed results, support events). Writes happen after every answer; reads happen on every sign-in. The release design needs transactions (attach guest work to a profile, change a recovery email without touching progress), idempotent submissions, and server-side validation, all of which are row-level concerns.

MathKX is open source. Contributors must be able to run the full stack locally without licences or Windows-only tooling.

Options considered: PostgreSQL, Azure SQL Database, Azure Table Storage, and Azure Blob Storage as the primary store. Blob storage was rejected as a primary store because blobs are files: no row-level updates, concurrency control, or queries, so the application would have to rebuild a database on top of them. Table Storage was rejected because it lacks cross-row transactions and would push the merge and idempotency logic into application code. Azure SQL is a sound relational alternative but is heavier for contributors to run locally.

## Decision

- Use **PostgreSQL** as the relational store for learner profiles and learning observations.
- In production, use **Azure Database for PostgreSQL Flexible Server** in the region chosen in [ADR 0009](0009-host-on-azure-app-service.md), starting on the smallest burstable tier with automated backups enabled.
- Access the database from the ASP.NET Core backend through Entity Framework Core with the Npgsql provider. Schema migrations live in the repository and run as part of deployment.
- Store the canonical mathematical identity of each observation (definition ID, definition version, seed) and the resolved generator and validator versions as indexed columns, so instances can be replayed and queried. Store submission artifacts and support events as JSONB alongside them.
- Keep credential hashes and recovery-email state in the same database under least-privilege access. The hashing algorithm, session handling, and recovery mechanisms remain the subject of the profile design required before any account code (see ADR 0006).
- Run integration tests against a real PostgreSQL instance (a container in CI and locally). Do not substitute another database engine for behaviour that depends on PostgreSQL features.
- Blob storage may be used later for progress exports, content assets, or database backups. It is not a store for profiles or progress.

## Consequences

- Contributors run PostgreSQL locally with a single container; no proprietary tooling is needed.
- The first server-side milestone gains a concrete persistence target; the browser-only guest progress of the first internal milestone is unaffected.
- Replay, idempotent submission, and the guest-to-profile merge become ordinary transactional operations.
- Costs are predictable and small at the project's scale; the tier can grow without changing the application.
- Retention and deletion rules, data-export format, and the authentication design remain future decisions and must be made before public release.
- Backups contain learner data and are subject to the same residency and access rules as the live database.
