# ADR 0006: Support profiles without personal details

**Status:** Accepted

## Context

Learners need to sign in to a profile and retain learning progress across sessions and devices. This must not require disclosing a real-world identity or email address. Some learners will prefer to supply an email address so they can recover access.

## Decision

- Support persistent learner profiles with sign-in and saved learning progress.
- Require no real name, email address, or other identifying profile details to create or use a profile. Do not require an external identity-provider account.
- Identify profiles independently of email addresses. Keep learning records associated with a stable internal profile identity so adding, changing, or removing a recovery email does not replace the profile or its progress.
- Provide sign-in credentials that work without email. An ordinary profile identifier is not sufficient proof of ownership; the precise authentication mechanism remains undecided.
- Offer an optional recovery email at setup and allow it to be managed later. Verify control of the address before enabling it for recovery. Its purpose is recovery, not marketing or public profile display.
- Provide the same learning capabilities and progress retention whether or not a recovery email is supplied.
- Help learners save their sign-in details during setup. Explain clearly that a profile cannot be recovered when all credentials and any supported recovery means are lost. Do not imply that support can recover an account through personal details that were never collected.
- Describe this as anonymous profile setup or a profile without personal details. A stable profile and its learning history remain linkable within MathKX; this does not promise complete anonymity across network traffic, hosting, logs, or a voluntarily supplied recovery email.

## Consequences

- Durable progress storage and access control are now concrete application requirements, although no application infrastructure is introduced by this decision.
- The learning domain must not depend on an email address or real-world identity.
- The setup experience must make retaining access practical, including a clear way to save credentials; it must not rely solely on memorization.
- Email-free sign-in, verified optional recovery, progress continuity after email changes, and rejection of unauthorized access need implementation tests when these behaviors are built.
- Authentication technology, credential format, recovery codes or other recovery mechanisms, session handling, storage technology, retention/deletion rules, and learner/parent/teacher relationships remain future decisions.
