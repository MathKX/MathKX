# ADR 0012: Authenticate learners with ASP.NET Core Identity and server-side sessions

**Status:** Accepted (owner decision, 2026-11-20; decision log DL-007, DL-022, DL-027, DL-042)

## Context

[ADR 0006](0006-support-profiles-without-personal-details.md) requires profiles that need no personal details, credentials that work without email, an optional verified recovery email, and honest wording about loss. It leaves the authentication technology, the credential format, recovery beyond email, and session handling open. [ADR 0008](0008-store-profiles-and-progress-in-postgresql.md) stores profiles in PostgreSQL through EF Core and Npgsql. [ADR 0009](0009-host-on-azure-app-service.md) keeps learner IDs and answers out of URLs and logs.

The [profiles, recovery, and persistence proposal](../proposals/profiles-recovery-and-persistence.md) answered those questions and was reviewed in PR 58. The owner accepted its recommendations. This ADR records the durable parts: the credential, the framework, and the session model. The proposal keeps the reasoning, the alternatives, and the details the specification needs.

## Decision

- **Credentials.** A generated learner ID is the user name: `MKX-` and 8 characters from a 31-symbol alphabet without look-alikes. It is not a secret, and it never appears in a URL or a log line. The learner chooses a password of at least 8 characters, with no composition rules, checked against a list of common passwords kept in the repository. No outside breach service is called. An email address is optional and not unique.
- **Framework.** ASP.NET Core Identity's core (user manager, sign-in manager, security stamp) on its EF Core store with Npgsql. Identity's email-link flows are turned off.
- **Password hash.** Identity's `PasswordHasher` with PBKDF2-HMAC-SHA512, its iteration count raised to OWASP's current figure (210,000 when the proposal was written; confirmed in the specification). The stored format carries its version, so a later algorithm can rehash at sign-in.
- **Sign-in.** One message for a wrong ID and a wrong password. Repeated failures are throttled by learner ID and by network address; a profile is never locked, because IDs are not secret. Network addresses used for throttling are held in memory only.
- **Sessions.** Server-side. The browser holds an opaque random token in a `Secure`, `HttpOnly`, `SameSite=Lax` cookie, and the database holds only its hash. State-changing requests carry an anti-forgery token.
  - "Keep me signed in on this device" is unchecked on a new device. Unchecked, a session ends after 30 minutes without activity. Checked, it lasts 30 days from the last use, and never more than 90 days.
  - "Sign out everywhere" ends every session. A password change or a recovery ends every other session.
  - Settings shows how many devices are signed in and when each was last used, and nothing else about them.
- **Recovery.** Codes, never links, so no reset token is put in a URL.
  - A verified email receives six-digit codes, valid for 15 minutes, with three tries.
  - Ten one-time recovery codes are generated at setup, shown once, and stored hashed.
  - A learner with neither is told plainly that the profile cannot be recovered.
- **Setup.** A profile is created only when the learner confirms they have saved the ID. Until then the setup is pending, cannot sign in, and expires after 24 hours (DL-027).

## Consequences

- Hashing, throttling, and session invalidation come from reviewed code rather than code MathKX writes.
- Identity's tables include columns this design never uses, such as phone and two-factor fields. Its defaults must be configured for a user name without email.
- The F9 specification must show that sign-in with the learner ID and no email works on Identity before building on it. If it does not, a new ADR replaces the framework choice; the credential and session rules stand.
- Passkeys can be added later as a second way in, with their own decision. They are not a release requirement.
- Where the email provider may process data is recorded separately, in [ADR 0013](0013-email-provider-in-the-eu-eea.md).
