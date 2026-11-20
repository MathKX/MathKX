# Proposal: Learner profiles, recovery, and persistence

**Status**: Accepted by the owner on 2026-11-20, after review in PR 58 (decision log DL-007, DL-022, DL-027, DL-042, DL-043). [ADR 0012](../decisions/0012-authenticate-with-identity-and-server-side-sessions.md) records the credential, the framework, and the session model; [ADR 0013](../decisions/0013-email-provider-in-the-eu-eea.md) records where the email provider may process data. The F9 specification starts from this document.

This is the profile design that [CLAUDE-FABLE-R01-007](../../reviews/round-01/claude-fable/recommendations.md#claude-fable-r01-007--decide-the-production-profile-design-before-building-accounts) asks for and that the decision log's F9 verdict requires: "write the design proposal first". Its recommendations were written before the owner decided; [section 9](#9-decisions-for-the-owner) records what was decided.

## Context

Today every learner is a guest. The whole record lives in one browser (`mathkx.guest.v1` in `localStorage`): practice deliveries with their events, lesson views, the practice session, and self-check runs. The service is stateless. It resolves instances, validates answers, and serves content, and it stores nothing about anyone.

The release needs more than that ([revised brief §9.1](../../reviews/round-01/claude-fable/revised-build-brief.md#91-established-requirements-release-gates)):
- a profile that keeps progress across sessions and devices;
- no required real name, email address, or external identity provider;
- an optional recovery email, verified before use.

The storage and the region are decided: PostgreSQL ([ADR 0008](../decisions/0008-store-profiles-and-progress-in-postgresql.md)) on Azure in Norway East ([ADR 0009](../decisions/0009-host-on-azure-app-service.md)).

What [ADR 0006](../decisions/0006-support-profiles-without-personal-details.md) leaves open is the subject of this proposal:
- the authentication technology and the credential format;
- recovery beyond email;
- session handling;
- retention and deletion.

The prototype's profile flow (`Prototype/mathkx-designsystemet/src/pages/Profile.jsx`, `store.jsx`) is the only concrete shape so far. Its hashing and storage are labelled as simulation. Its screens and wording have been reviewed three times (rounds 01 to 03), and this proposal keeps what those reviews kept.

## What is settled

These are inputs, not choices:
- **No personal details** (ADR 0006): no real name, email, age, school, or external account is needed to create or use a profile, and the learning domain never depends on one.
- **A stable internal identity** (ADR 0006): progress belongs to an internal profile ID, so adding, changing, or removing an email never replaces the profile or its progress.
- **The ID is not proof** (ADR 0006): an ordinary profile identifier is not enough to sign in.
- **Equal capability** (ADR 0006): a profile without email learns and keeps progress exactly like one with email.
- **Honest loss** (ADR 0006): setup helps the learner save their sign-in details and says plainly when a profile cannot be recovered. It never implies that support can recover a profile from details that were never collected.
- **Storage and place** (ADRs 0008 and 0009): PostgreSQL through EF Core and Npgsql, migrations in the repository, integration tests against real PostgreSQL. Learner data and backups stay in Norway East. No learner IDs or answers go in URLs, and logging is kept to what operations needs.
- **Replay** (ADR 0004, ADR 0011): an observation stores the definition ID, version, and seed, so it can be replayed.

## Scope

**In**: creating a profile, signing in and out, sessions on shared devices, recovery, guest work on sign-in, the server-side record, deletion, retention, export, and the privacy notice.

**Out**:
- learner, parent, and teacher relationships (still open, ADR 0006);
- passkeys as the only credential ([section 1](#1-identity-and-credentials) treats them as a later addition);
- any mastery model;
- AI use;
- the content and library items that DL-007 also lists, which are not profile matters ([section 9](#9-decisions-for-the-owner)).

## 1. Identity and credentials

**The internal ID** is a random UUID that never leaves the server. Rows refer to it. The web app never sees it.

**The learner ID** is the username. It is generated, not chosen, and keeps the prototype's form: `MKX-` and 8 characters from a 31-symbol alphabet without look-alikes (about 39.6 bits).
- **Not a secret**: the ID is shown on screen, saved in the reminder file, and typed at sign-in. It never appears in a URL or a log line.
- **Why generated**: a chosen name invites real names, and it collides.

**The password** is chosen by the learner. That follows ADR 0006's "credentials that work without email" and the prototype's reviewed setup.
- **Rules**: at least 8 characters, any characters, no composition rules, and a check against a short list of common passwords kept in the repository.
- **No breach service**: checking against an outside breach list would send a hash prefix to a third party, so it is not proposed.
- **Copy**: the rules are stated in both languages before the field, not only as errors.

**The password hash.** Recommendation: ASP.NET Core Identity's `PasswordHasher`, with its iteration count raised to OWASP's current figure for PBKDF2-HMAC-SHA512. That figure is 210,000; it is external guidance, to confirm when specified. The stored format carries its version, so a later move (for example to Argon2id) can rehash at the next sign-in.
- **The alternative, Argon2id**: OWASP's first preference. It needs a third-party library in .NET, and contributors would have to keep it current.

**The framework.** Recommendation: ASP.NET Core Identity's core (user manager, sign-in manager, security stamp) on the EF Core store with Npgsql. Its lockout is turned off ([section 3](#3-sign-in-sessions-and-shared-devices)). The learner ID is the user name, and the email is optional and not unique ([section 4](#4-recovery) covers recovery for a shared address).
- **For**: reviewed code for hashing and invalidating sessions. Throttling is not part of it ([section 3](#3-sign-in-sessions-and-shared-devices)). R01-007's warning is that "the first person to need login will build something plausible and insecure."
- **Against**: Identity's tables carry columns this design never uses (phone, two-factor). Its email flows assume links, and this design uses codes, so its defaults must be turned off.
- **The alternative**: cookie authentication with `PasswordHasher` alone and a small schema of our own. It is smaller, but MathKX would own throttling and session revocation.

**Passkeys** (WebAuthn) are worth adding later as a second way in. They work well on iPad. But cross-device sync depends on the platform account, which sits awkwardly with "no external identity provider", and recovery still needs a second key (R01-007's alternative). They are not proposed for release.

## 2. Setup

The prototype's setup and its reviewed corrections:
1. **Choose a password.** The candidate learner ID is shown, with "The ID is not secret…". Guest work in this browser is summarized: "It will be added to the new profile, marked as guest work."
2. **Keep your sign-in details.** Copy or download the ID reminder (the ID and the sign-in address, never the password). If recovery codes are approved, download them too ([section 4](#4-recovery)). Confirm "I have saved my ID."
3. **Recovery email (optional).** Enter an address, or choose "Continue without email". A code is sent. The learner can enter it, send a new one, edit the address, or confirm later.
4. **Done.**

**When the profile is created (DL-027)**:
- **Option A, the prototype**: create the profile at step 1 and sign in, and a banner asks the learner to finish.
  - **For**: an interrupted setup keeps the ID and the attached guest work.
  - **Against**: a profile can exist whose ID the learner never saved (round-03 area 7, finding 2), and the guest work was moved into it. If the session ends, that work is reachable only by an ID nobody kept.
- **Option B, pending until step 2 (GEMINI-R02-009)**: step 1 reserves the ID and stores the password hash in a pending setup that cannot sign in. Confirming step 2 creates the profile, attaches the guest work, and signs in, in one transaction.
  - **For**: no profile exists that nobody can reach. Until the confirmation, the guest work never leaves the browser, so an interrupted setup loses nothing. A pending setup expires after 24 hours.
  - **Against**: a learner who leaves during step 2 starts again with a new ID. They had not saved the first one.
- **Recommendation: option B.** It keeps both of A's benefits that matter: no guest work is lost, and the learner is never stuck. It removes the unreachable profile.

**Changing an email (DL-022)**: round-03 area 7, finding 1, is adopted as the rule.
- **A verified address stays in use** until the new address's code succeeds. The record holds a verified address and a pending one separately.
- **The pending change can be cancelled**, which keeps the verified address.
- **A mistyped address can be edited** on the code screen.
- **"Continue without email"** is offered at every stage.
- **Codes**: six digits, valid for 15 minutes, three wrong tries before a new code is needed (the prototype's `MAX_CODE_TRIES`), and a limit on sends per address and per profile.
- **Removing the address** is always allowed, with the loss-of-recovery sentence shown before it is confirmed.

## 3. Sign-in, sessions, and shared devices

**Sign-in** takes the learner ID and the password.
- **One error**: a wrong ID and a wrong password get the same message, "That ID and password don't match.", so the form does not reveal which IDs exist.
- **Throttling**: after repeated failures, by learner ID and by network address, the service slows down and says "Too many tries. Wait a minute and try again." It does not lock the profile.
- **Why not lock**: IDs are not secret, so a lock would let anyone shut a learner out.
- **Who builds it**: Identity offers lockout, not this throttling, and its lockout is turned off. F9 builds both limits, by learner ID and by network address, with ASP.NET Core's rate limiting or a limiter in the sign-in handler, and tests each.
- **Network addresses** used for throttling are held in memory only, never stored.

**Sessions** are server-side rows.
- **The cookie**: an opaque random token in a `Secure`, `HttpOnly`, `SameSite=Lax` cookie. The database holds only the token's hash.
- **Revocation**: deleting a row signs that device out, and deleting all rows signs out everywhere.
- **Requests**: every state-changing request carries an anti-forgery token as well.
- **With Identity**: this is Identity's cookie with a server-side ticket store, or a small session table. That choice belongs to the specification.

**"Keep me signed in on this device"** (DL-007) is a checkbox at sign-in. It is unchecked on a new device, and remembered per device, never per profile.
- **Unchecked**: the session ends after 30 minutes without activity, and when the browser ends it. On an iPad, Safari can keep a "session" cookie for days, which is why the idle limit is the real protection.
- **Checked**: the session lasts 30 days from the last use, and never longer than 90 days.

**Signing out** deletes the session row and clears everything about the profile from the page and the browser. When signed in, the record is not kept in `localStorage` at all ([section 5](#5-guest-work-and-the-server-record)), so the next person on a shared iPad finds nothing.

**"Sign out everywhere"** (DL-007) is in settings and ends every session, this one included. A password change in settings, which asks for the current password, ends every other session and keeps this one. A recovery ends every session of the profile, including one in the browser that completed it; the learner then signs in with the new password.

**Device lists**: settings shows how many devices are signed in and when each was last used. It shows no device names, browsers, or places, because collecting them would mean storing what the platform knows about a learner's devices. This is the smallest form of DL-007's "explicit device sessions".

## 4. Recovery

**Three honest cases**, kept from the prototype's recovery page:
- **I know my ID but not my password**: reset it with a recovery code, or with a code sent to the verified email.
- **I don't know my ID**: if the profile has a verified email, entering the address sends the ID and a reset code. The page says "If this address is on a profile, we have sent it a message.", whether or not it is.
- **One address on several profiles**: an email is not unique ([section 1](#1-identity-and-credentials)), so siblings may share a parent's inbox. One message then lists each profile verified with that address, by learner ID, each with its own reset code.
  - **Bound codes**: a reset code belongs to one profile and works only with that profile's ID. Using one never touches the others.
  - **One message**: the profile count is not revealed on the page, and the per-address send limit counts the message once.
  - **The setup copy** for the email step says that whoever reads the inbox can reset the profile. It never says whether other profiles share the address.
- **I have neither**: the profile cannot be recovered. MathKX has no other details to find it by, and the page offers to create a new profile. This is the ADR's honest sentence, said once at setup and again here.

**Codes, not links.** The prototype's page offered to "send a link to choose a new password". This design sends a code instead, the same kind as email verification. A link would carry a reset token in a URL, which mail scanners open and logs keep, against ADR 0009's rule on URLs.

**Email recovery** is ADR 0006's established option.
- **Who it reaches**: only a verified address receives reset codes.
- **The reset**: a reset ends every session of the profile, including one in the browser that completed it ([section 3](#3-sign-in-sessions-and-shared-devices)), and, when an email is verified, sends a short notice to it.
- **The email service**: sending needs a provider, and learner data passes through it. A verification message carries the address and a code. A forgotten-ID message carries the address, the learner ID, and a reset code. ADR 0009 keeps learner data in Norway East unless a later decision changes that, so the provider must keep these data within that rule. If no suitable provider does, the owner must approve and record a residency exception, as a decision that amends ADR 0009, before a provider is chosen. Naming the transfer in the privacy notice is required either way, but it is not enough on its own.
  - **Decided** (DL-043, [ADR 0013](../decisions/0013-email-provider-in-the-eu-eea.md)): the provider may process within the EU/EEA. It sends every profile message this design names: verification codes, recovery messages, the notice after a reset, and the notice before an inactive profile is deleted. It receives only what a message needs, and the specification confirms where it processes before it is used.

**Recovery codes** (DL-007):
- **What they are**: ten one-time codes, generated at step 2, shown once, and offered as a separate download from the ID reminder.
- **Using one**: a code with the ID resets the password, and that code is used up. Settings can make a new set, which replaces the old one.
- **Storage**: the codes are stored hashed, like passwords.
- **The tradeoff**: a learner who declines email still has a second key, which removes the "no recovery at all" cliff. Anyone who has the ID and one code can take over the profile, so the download says so and is kept apart from the ID reminder.
- **Recommendation: approve.** It is small once sign-in exists, and it is the only recovery a profile without email can have. R01-007's open question, whether learners will keep the codes, is worth one observation with three people (section 11).

## 5. Guest work and the server record

**A guest's record stays in the browser.** The accumulated record (deliveries and their events, lesson views, the practice session, and check runs) is never sent to the server or stored there. A guest's single requests still carry what the service needs to answer them: a validation sends the exercise identity, the answer text, and the submission ID, and the service returns a result and stores none of it. That keeps today's privacy for everyone who never makes a profile.

**Signed-in work is the server's.**
- **Recording**: each answer, support event, lesson view, check-run step, and session change is written to the server as it happens.
- **Idempotency**: every logical write carries its own write ID, made once in the browser when the learner acts and reused on every retry. The server stores each write ID once per profile, so a retry never duplicates.
  - **Why not the delivery ID**: one question can have several genuine support events, and today only submissions and input-guidance events carry an ID (`submissionId`). A help event saved with its response lost would count twice on retry, and deduplicating by delivery would drop later genuine events.
  - **Submissions** keep `submissionId` as their write ID.
- **Server results**: a submission is validated and recorded in one request, so the stored result is the server's, never the browser's. Today the browser records the result `/api/validations` returned to it, and that is acceptable only for a guest.
- **Resume state**: the question in progress keeps its screen state on the server, as the guest record keeps it today: the typed draft, whether help and the explanation are open, and their steps. That is what lets a draft survive a reload (spec 006 FR-015; DL-026 (4)).
  - **When it is saved**: after a pause in typing (about a second, to set in the specification), on each help or explanation change, and when the page is hidden or left, with a request that outlives the page.
  - **Order**: each save carries a sequence number, so an older save that arrives late never overwrites a newer one. A save replaces the previous one; it is screen state, not an event.
  - **Restoring it**: on load, the app reads the resume state with the question, as it reads the guest record today.
  - **The limit**: characters typed in the last moment before a crash or a lost connection may be lost. The draft as of the last save is restored.
- **The browser** keeps nothing about the profile between page loads. A failed write shows the existing "could not be saved" pattern and retries with the same write ID; it never silently drops work.

**Guest work on sign-in**: R01-008 and the brief's §9.2 attach prompt.
- **Creating a profile** attaches the browser's guest work, marked as guest work, and says so on step 1.
- **Signing in to an existing profile** with guest work in the browser asks once, with the prototype's two choices: "Add it to the profile" or "Don't add it".
  - **No preselection**: the prompt has no default, because on a shared iPad the guest work may be someone else's.
  - **Either way**, the guest record is then removed from the browser. With "Add it", that happens only after the server confirms the import. The import carries its own write ID, so a retried import is stored once.
- **Two unfinished checks**: the browser and the profile may each hold an unfinished check of the same skill. Spec 006 allows one per skill (FR-003), so the import applies FR-003's own rule, as if the later check had been started while the earlier one was unfinished.
  - **The run started later stays resumable**, with its draft.
  - **The other run is ended**: its answers and their results are kept, its unreached questions are recorded as not answered, and "My work" shows it with its summary.
  - **Practice** has the same pair, a question in progress in each. The question delivered later stays resumable, and the other is closed as a practice entry closes it (specs 002 and 003).
- **Re-validation**: the guest record is client-written, so the server treats it as untrusted.
  - It resolves each instance from its identity and validates each submission's original text again, so stored results are its own.
  - It drops events it cannot place, and keeps provenance `guest-import`.
  - It caps the size of an import.
  - Check runs and lesson views follow the same rules.

**Progress views do not change.** "My work", practice summaries, and check summaries read the same derived outcomes, now from the server's record. The specs 004 to 006 contracts stay as written, with "this browser" wording made conditional on being a guest.

## 6. Storage shape

The schema is the specification's work (ADR 0008). These are the shape's rules:
- **Accounts**: one profile row holds the internal ID, the learner ID, the credential hash, and the email state (verified address, pending address, and their code state). It is the only place an email exists.
- **Observations**: one delivery row per resolved instance, with indexed definition ID, version, seed, generator and validator versions, purpose, and provenance. Its events are JSONB, in order (ADR 0008).
- **Other records**: lesson views, check runs, resume state, sessions, recovery-code hashes, and pending setups each have their own rows, keyed by the internal ID.
- **Write IDs**: every stored write keeps its write ID, unique per profile ([section 5](#5-guest-work-and-the-server-record)).
- **Separation**: no learning row holds the learner ID or an email, and deletion is one cascade from the profile.

## 7. Deletion, retention, and export

**Deleting a profile.** Settings offers "Delete my profile", which asks for the password again.
- **Signing out**: it ends every session at once.
- **The grace period**: the profile is hidden at once, and its live data is deleted after 7 days. Backups that hold it expire on their own retention (below). Signing in during those 7 days cancels the deletion, and the confirmation screen says so.
- **The trade**: a 7-day grace protects a learner from an accidental or someone else's deletion. It keeps the data for a week after the learner asked for it to go. The owner should confirm the trade ([section 9](#9-decisions-for-the-owner)); this is not legal advice.
- **Backups**: they age out on their own retention. Azure's default for this tier is 7 days (external, to confirm), and the notice states the total.

**Retention**:

| Data | Kept | Then |
| --- | --- | --- |
| Pending setup | 24 hours | Deleted |
| Pending email change and its codes | 7 days | Discarded; the verified address, if any, stays |
| Session | 30 minutes idle unless kept; 30 days idle, at most 90 days, if kept | Deleted |
| Profile with no sign-in | A period the owner sets; this proposal suggests 3 years | With a verified email: a notice 30 days before. Without: deleted, as the setup screen said |
| Deleted profile | 7 days | Live data deleted with everything under it; backups expire on their own retention |
| Platform request logs | A period set deliberately (ADR 0009); this proposal suggests 30 days | Deleted |

**Export** (DL-007): "Download my work" in settings gives the learner's record as JSON, in the same shape as the guest record, plus the learner ID.
- **Recommendation: approve.** It is small, the learner owns their record, and it makes leaving and deletion credible.
- **Import of an export** into another profile is not proposed.

## 8. Privacy notice and logs

**A privacy notice** in both languages (DL-007). Recommendation: approve, as a release item. It is plain language, linked from setup and the footer, and covers:
- what is stored: the learner ID, the password hash, the optional email, the learning record, and sessions;
- for a guest, what leaves the browser: each request's own data, such as the exercise identity, the answer text, and the submission ID of a validation, none of which the service stores;
- what is not stored: names, ages, schools, or device details;
- where the data is (Norway East, and the email provider within the EU/EEA, ADR 0013) and who processes it (the hosting provider and the email provider);
- how long each item is kept (section 7);
- how to export and delete;
- that anonymous setup is not network anonymity (ADR 0006).

The owner should check what the law requires for learners under the age of digital consent, which in Norway is said to be 13. That is external, not verified here, and not legal advice. Profiles collect no age, so the notice and setup copy carry that question, not a form field.

**Logs**:
- **What they omit**: no learner IDs, emails, codes, or answers in request logs. That extends ADR 0009's rule from URLs to every logged field.
- **Sign-in failures**: they are counted, not logged with their IDs.

## 9. Decisions for the owner

**Decided by the owner, 2026-11-20**: every recommendation in this section, and question 9 as an email provider within the EU/EEA. The decision log records them as DL-007, DL-022, DL-027, DL-042, and DL-043.

**DL-007, each addition on its own**:

| Addition | Recommendation | Why |
| --- | --- | --- |
| One-time recovery codes | Approve | The only recovery a profile without email can have; small once sign-in exists ([section 4](#4-recovery)) |
| Progress export (JSON) | Approve | Small, and makes ownership and deletion credible ([section 7](#7-deletion-retention-and-export)) |
| "Keep me signed in on this device", default off on a new device; "Sign out everywhere" | Approve | The shared-iPad protection, and cheap with server-side sessions ([section 3](#3-sign-in-sessions-and-shared-devices)) |
| Explicit device sessions | Approve in the smallest form: a count and last-used dates, no device details | Lets a learner see that another device is signed in without collecting device data |
| Guest-merge prompt with server re-validation | Approve, with no preselected answer | Prevents both silent loss and silent attachment of someone else's work ([section 5](#5-guest-work-and-the-server-record)) |
| Two topics at release | Not a profile matter; leave to milestone-two planning | Unrelated to accounts |
| Library opens on ready topics | Not a profile matter; decide when the library has more than one lesson | The current app has one lesson |
| Privacy notice | Approve, as a release item | Needed for trust and, the owner should check, likely by law ([section 8](#8-privacy-notice-and-logs)) |

**DL-027**: create the profile when step 2 is confirmed, not at step 1 (option B, [section 2](#2-setup)).

**DL-022**: keep a verified email until its replacement is verified, with edit, cancel, and "Continue without email" at every stage ([section 2](#2-setup)).

**New questions this design raises**:
1. **The framework**: ASP.NET Core Identity's core, or cookie authentication with a small schema of our own ([section 1](#1-identity-and-credentials))?
2. **The hash**: PBKDF2 through Identity with raised iterations, or Argon2id through a library?
3. **Guest work**: should a guest's record stay in the browser, never stored on the server, while single requests such as a validation still send what the service needs to answer ([section 5](#5-guest-work-and-the-server-record))?
4. **Session lengths**: 30 minutes idle when not kept; 30 days, at most 90, when kept.
5. **Deletion grace**: 7 days, or immediate.
6. **Inactive profiles**: deleted after how long, if at all (suggested: 3 years)?
7. **Log retention**: 30 days suggested.
8. **The legal check** for the privacy notice and for learners under 13.
9. **The email provider**: one that keeps learner data within ADR 0009's rule, or, if none fits, a recorded residency exception approved before the choice ([section 4](#4-recovery)). Decided: a provider within the EU/EEA (ADR 0013).

The decision log records each choice. ADR 0012 records the durable ones (the credential, the authentication framework, and the session model), ADR 0013 the email provider's region, and F9's specification starts from this document.

## 10. Tests the specification must carry

From ADR 0006's consequences and ADR 0008, as acceptance for the built feature:
- **Without email**: sign-in works with no email anywhere in the profile.
- **Unauthorized access is rejected**: a learner ID alone, a wrong password, a used or another profile's recovery code, an expired or wrong email code, and a revoked session all fail.
- **Email changes**: progress and identity are unchanged after an email is added, changed, cancelled, or removed, and a verified address stays usable until its replacement is verified.
- **Setup**: a pending setup cannot sign in; confirming step 2 creates the profile and attaches guest work in one transaction; an expired setup leaves nothing.
- **Shared recovery address**: two profiles verified with one address both appear in one forgotten-ID message, and each reset code works only with its own profile's ID.
- **Retries**: a retried support event is stored once, and a second genuine support event on the same question is stored as a second event.
- **Drafts**: a signed-in learner types an answer, reloads before submitting, and finds the draft, in practice and in a check. An older draft save arriving late does not replace a newer one.
- **Guest import**: both answers to the prompt; re-validation replaces a forged result; provenance is kept; a retried import is stored once; the browser record is cleared only after the server confirms.
- **Two unfinished checks**: an import with an unfinished check of the same skill in the browser and on the profile leaves the later one resumable with its draft and the earlier one ended with its answers kept. The browser record is cleared only after that merge is stored.
- **Sessions**: idle expiry, kept expiry, and "Sign out everywhere". A password change ends every other session and keeps the current one. A recovery ends every session, including one already signed in to the profile in the browser that completed it.
- **Throttling**: it slows a guessing loop on one learner ID from many addresses, and one address trying many IDs, and never locks a profile.
- **Deletion**: cancelled by signing in within the grace period, and complete after it.
- **Export**: it contains the whole record and nothing about any other profile.
- **Storage**: all of the above against real PostgreSQL in a container (ADR 0008).
- **The learner**: both languages, the keyboard, and the iPad project for every new screen, as specs 002 to 006 do.

## 11. The smallest validation

Before the specification is final, watch three people complete setup with recovery codes offered (R01-007): one learner of the target age, one adult, and one person on an iPad. Ask afterwards:
- where they saved the ID;
- whether they kept the codes;
- what they think happens if they lose both.

Record findings, not scores, as the learner checks carried forward by DL-041 are recorded.

## What would make this wrong

- **Learners don't keep codes or reminders**: recovery codes add setup work for little gain, and email becomes the only real recovery. The section 11 observation tests this.
- **Shared iPads are rarer than assumed**: the prompts and short sessions cost convenience for little benefit. "Keep me signed in" makes that cost one checkbox.
- **Identity's defaults fight the design**: the custom-schema alternative becomes cheaper. The specification should prove that sign-in with the learner ID and no email works on Identity before committing to it.
