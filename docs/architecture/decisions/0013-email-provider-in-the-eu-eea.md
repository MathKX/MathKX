# ADR 0013: Allow the email provider to process learner data in the EU/EEA

**Status:** Accepted (owner decision, 2026-11-20; decision log DL-043). Amends [ADR 0009](0009-host-on-azure-app-service.md) for the email provider only.

## Context

[ADR 0009](0009-host-on-azure-app-service.md) keeps learner data, including backups, in Norway East unless a later decision changes that. The optional recovery email ([ADR 0006](0006-support-profiles-without-personal-details.md), [ADR 0012](0012-authenticate-with-identity-and-server-side-sessions.md)) needs a provider to send messages, and learner data passes through it:
- a verification message carries the address and a code;
- a forgotten-ID message carries the address, the learner ID, and a reset code.

The [profile design proposal](../proposals/profiles-recovery-and-persistence.md#4-recovery) required either a provider that keeps these data within ADR 0009's rule or a recorded exception approved before a provider is chosen. The owner accepted a provider in Europe.

## Decision

- The email provider may process and store the messages it sends within the EU/EEA.
- It receives only what a message needs: the address, and the learner ID and a code where the message carries them. No learning data, answers, or progress are sent to it.
- The provider is chosen in the F9 specification, which confirms where it processes and stores data before it is used.
- Everything else ADR 0009 places in Norway East stays there: the application, the database, and its backups.

## Consequences

- The privacy notice names the email provider and where it processes data.
- A provider that processes outside the EU/EEA needs a new decision.
- The exception covers only email for profile verification and recovery. Any other service that would receive learner data needs its own decision.
