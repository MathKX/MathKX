# ADR 0009: Host on Azure App Service in Norway East

**Status:** Accepted (owner decision, 2026-10-18)

## Context

The intended stack is an ASP.NET Core backend with a React/TypeScript frontend ([architecture](../architecture.md), [ADR 0007](0007-use-designsystemet-and-tailwind.md)). Learner profiles and progress will be stored in PostgreSQL ([ADR 0008](0008-store-profiles-and-progress-in-postgresql.md)). Hosting and region were undecided.

The project's learners are initially in Norway, and [ADR 0006](0006-support-profiles-without-personal-details.md) is explicit that anonymous profile setup does not extend to hosting, network traffic, or operational logs. Where data lives and what the platform logs are therefore product concerns, not only operational ones.

Options considered: Azure App Service, Azure Container Apps, and Azure Static Web Apps for the frontend with App Service for the API. Container Apps offers scale-to-zero but needs container images and a registry; Static Web Apps splits the deployment in two with cross-origin configuration. App Service is the simplest arrangement that serves both the API and the built frontend from one place.

Regions considered: Norway East, West Europe, and Sweden Central. Norway East keeps learner data in Norway and has every service this project needs.

## Decision

- Host the ASP.NET Core backend and the built React frontend on a single **Azure App Service** (Linux) plan, starting on a small tier, with HTTPS enforced.
- Place the App Service and the PostgreSQL server in **Norway East**. Learner data, including backups, stays in that region unless a later decision changes it.
- Deploy from GitHub Actions on merges to `main`, after the repository's tests and content validation pass.
- Keep configuration and secrets out of the repository: App Service application settings for configuration, Azure Key Vault for secrets such as the database connection string.
- Treat platform logs as learner-adjacent data: do not put learner IDs or answers in URLs or query strings, keep request logging to what operations needs, and set retention deliberately.
- Describe the infrastructure as code (Bicep or equivalent) once there is more than one resource to manage, so the environment can be recreated.

## Consequences

- One deployable, one plan, one region: the smallest operational surface for a small team.
- Data residency is a stated property of the service and can be described to learners in the privacy notice.
- Cold starts and idle cost are those of App Service rather than scale-to-zero; acceptable at the project's scale and revisable.
- A content delivery network, a separate static host, or containers can be added later without changing the application's boundaries.
- Operational monitoring, alerting, and the exact App Service and PostgreSQL tiers are implementation choices for the first server-side milestone, not decisions recorded here.
