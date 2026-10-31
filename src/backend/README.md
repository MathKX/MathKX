# MathKX backend

The mathematics domain and the thin practice service (ADR 0003, DL-005). One solution, five projects, .NET 10.

| Project | Role | Depends on |
| --- | --- | --- |
| `MathKX.Domain` | Random source, generators, validators, step models, instance resolution, and the content record types. No package references. | nothing |
| `MathKX.Content` | Loads `content/` from disk (System.Text.Json, YamlDotNet for front matter) into a `ContentCatalog`. | Domain |
| `MathKX.Api` | ASP.NET Core minimal API: lessons, skills, instances, steps, validations; serves the built learner app in production. | Content |
| `MathKX.Domain.Tests` | xUnit: seed-proposal vectors, golden seeds, property tests, boundary and replay fixtures, validator precedence, step models, the content loader. | Domain, Content |
| `MathKX.Api.Tests` | xUnit with `WebApplicationFactory`: determinism, privacy, error codes, step delivery. | Api |

## Run

```bash
dotnet run --project src/backend/MathKX.Api
```

Listens on `http://localhost:5080` in development (`Properties/launchSettings.json`). The content root is resolved in this order: `MathKX:ContentRoot` configuration, a `content/` folder beside the binaries (the published layout), then the repository checkout found by walking up from the binaries.

```bash
dotnet test src/backend/MathKX.slnx
bash src/backend/scripts/smoke-published.sh   # publishes to a temp folder and runs it outside the checkout
```

## Deploy

`.github/workflows/deploy.yml` runs on every push to `main` (and on manual dispatch). It runs the build-and-test and content-validation workflows, then builds the learner app, publishes the service with the app in `wwwroot/` and `content/` beside the binaries, deploys the folder to the `matkxv2` App Service (resource group `evkxproductionsubscription` in the "Azure Production Sites" subscription, plan `evkxpremiumv4`, PremiumV4 P1v4, Norway East), and polls `/api/health`. The service answers at `https://matkxv2.azurewebsites.net`. The first app, `mathkx` (resource group `evkx` in the "Azure Med MSDN Subscription"), served production until 2026-10-31 and is no longer deployed to.

Azure sign-in uses GitHub OIDC; no secret is stored. The user-assigned managed identity `id-mathkx-deploy` (resource group `evkx`; both subscriptions share one Entra tenant, so the identity did not move with the app) trusts only `repo:MathKX/MathKX:environment:production` and holds Website Contributor on the `matkxv2` web app alone. The GitHub `production` environment accepts deployments from `main` only and holds `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, and `AZURE_SUBSCRIPTION_ID` (the subscription that holds the web app) as variables. Basic-auth publishing is disabled on the web app, so publish profiles do not work.

## Rules the tests enforce

- **No platform randomness in generation or validation.** `SplitMix64` and `BoundedSampler` implement the seed and random-source contract (ADR 0011) exactly, and every raw, bounded, and injected-rejection vector in it is a test. Generators receive their stream from the caller.
- **Golden seeds are frozen.** `MathKX.Domain.Tests/Fixtures/addition-pair-v1.golden.json` holds ten seeds per pilot definition. A change to the enumeration, the draw count, or the sampler is a new generator version (`addition-pair@2`), registered separately; definitions keep the version they pin. Seed 42 is checked by hand against the proposal's raw vector in the tests (raw mod 45 = 28, raw mod 36 = 1).
- **The instance has no sum.** `Instance` has no total member, DTOs have none by construction, and the contract tests assert no `sum` or `validation` key in any unsolicited response. The sum appears only in a correct validation result and in a step whose `reveals` flag is true.
- **Content is the runtime source.** The loader reads the files spec 001 validates; the domain tests assert the generator and validator match their registry entries by name, version, bounds, and emitted codes.
- **Step models live here.** Guided help and worked explanations are deterministic step sequences per representation with a `reveals` flag on exactly one step, the last; the learner app renders the delivered state and computes nothing.

## Adding a generator or validator

Register it in `content/registry/` first (spec 001 checks the content), implement it under `Generators/` or `Validators/`, add it to `GeneratorRegistry.Default()` or the service wiring, and add the registry-agreement test, golden seeds, a property test, and the replay fixture before it ships (DL-034).
