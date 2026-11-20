# Feature Specification: Profiles, Recovery, and Persistence

**Feature Branch**: `claude/profiles-spec` (spec directory `specs/007-profiles-and-persistence/`; Spec Kit treats the two as independent)

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: "F9 Profiles, recovery, and persistence (decision-log feature F9). Specify learner profiles from the accepted design: docs/architecture/proposals/profiles-recovery-and-persistence.md (accepted 2026-11-20), ADR 0006, ADR 0008, ADR 0009, ADR 0012, ADR 0013, and decision-log rows DL-007, DL-022, DL-027, DL-042, DL-043. Short name: profiles-and-persistence."

**Words used here**:
- **Guest**: a learner without a profile, as every learner is today. A guest's **guest record** is the record specs 002 to 006 keep in one browser.
- **Profile**: what this feature adds. It holds a learner's work on the server, reachable from any device by signing in.
- **Learner ID**: the profile's generated user name, such as `MKX-7K3P9QXD`. It is shown and typed, and it is not a secret.
- **Pending setup**: a profile being created that cannot yet be signed in to.
- **Recovery code**: one of ten one-time codes that, with the learner ID, reset a forgotten password.
- **Email code**: a six-digit code sent to an email address, to verify it or to reset a password.
- **Session**: one signed-in device. A **kept** session is one where the learner chose "Keep me signed in on this device".

## Sources this specification depends on

Per the constitution's specification rules, this feature restates existing decisions and creates no new requirement. Every choice below is the owner's, recorded on 2026-11-20.

- **The accepted design**: [profiles, recovery, and persistence](../../docs/architecture/proposals/profiles-recovery-and-persistence.md), reviewed in PRs 58 and 60. Its sections are cited as "design §n".
- **ADRs**:
  - [ADR 0006](../../docs/architecture/decisions/0006-support-profiles-without-personal-details.md): profiles need no personal details, credentials work without email, the ID is not proof, profiles with and without email are equal, and loss is stated honestly.
  - [ADR 0008](../../docs/architecture/decisions/0008-store-profiles-and-progress-in-postgresql.md): profiles and progress are stored in PostgreSQL, with tests against the real database.
  - [ADR 0009](../../docs/architecture/decisions/0009-host-on-azure-app-service.md): learner data stays in Norway East, and no learner IDs or answers go in URLs or logs.
  - [ADR 0012](../../docs/architecture/decisions/0012-authenticate-with-identity-and-server-side-sessions.md): the credential, the sign-in framework, throttling, sessions, recovery by codes, and the pending setup.
  - [ADR 0013](../../docs/architecture/decisions/0013-email-provider-in-the-eu-eea.md): the email provider may process the profile messages within the EU/EEA.
  - ADR 0004 and ADR 0011: an observation keeps its identity, so it can be replayed.
- **Decision-log rows**:
  - **F9**: "Proposal accepted by the owner, 2026-11-20 … the specification may start".
  - **DL-007**: recovery codes, export, "Keep me signed in" and "Sign out everywhere", device sessions in the smallest form, the guest-merge prompt with no preselected answer, and the privacy notice as a release item.
  - **DL-022**: a verified email stays in use until its replacement is verified.
  - **DL-027**: the profile is created when the learner confirms saving the ID.
  - **DL-042**: the eight design questions, including session lengths, the deletion grace, inactive profiles, and log retention.
  - **DL-043**: the email provider within the EU/EEA.
- **Earlier features**: specs [002](../002-practice-flow/spec.md) to [006](../006-self-checks/spec.md). Their behaviour for a guest does not change. For a signed-in learner it reads and writes the profile instead of the guest record.
- **Evidence**:
  - **The prototype's profile flow**: `Prototype/mathkx-designsystemet/src/pages/Profile.jsx` and `store.jsx`, as the design reference for setup and recovery screens. Its hashing and storage are labelled as simulation.
  - **Review rounds 01 to 03** on that flow, as adopted by the design.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - A learner creates a profile without giving any personal details (Priority: P1)

A guest who has practised addition wants to keep their work and use it on another device. They choose "Create a profile". Setup has four steps (design §2):
1. **Choose a password.** The learner sees the learner ID they will get, with "The ID is not secret…", and the password rules before the field. If they have guest work in this browser, setup says: "It will be added to the new profile, marked as guest work."
2. **Keep your sign-in details.** They copy or download the ID reminder, which holds the ID and the sign-in address but never the password. They download their ten recovery codes, offered apart from the reminder and with a warning that the ID and one code are enough to take over the profile. They confirm "I have saved my ID."
3. **Recovery email (optional).** They enter an address and the code sent to it, or choose "Continue without email".
4. **Done.** They are signed in, and their guest work is now in the profile.

Nothing in setup asks for a name, age, school, or outside account. Setup says plainly what happens if the learner loses both the ID and the password with no email and no recovery code: the profile cannot be recovered.

**Why this priority**: a profile is the release's established requirement (revised brief §9.1); every other story needs one.

**Independent Test**: As a guest with two answered questions, create a profile without email. Sign out, sign in on another browser with the ID and password, and see both questions in "My work", marked as guest work.

**Acceptance Scenarios**:

1. **Given** a guest at step 1, **Then** the learner ID, "The ID is not secret…", and the password rules are shown before the password field, in the selected language.
2. **Given** a password shorter than 8 characters or on the common-password list, **When** the learner continues, **Then** the password is refused with the rule it breaks, and no setup is created.
3. **Given** step 1 completed, **When** the learner closes the tab before confirming step 2, **Then** no profile exists, the learner ID cannot be signed in to, and the guest record in the browser is unchanged.
4. **Given** step 2 confirmed, **Then** the profile is created, the guest work is attached and marked as guest work, and the learner is signed in, all together or not at all.
5. **Given** step 3, **When** the learner chooses "Continue without email", **Then** setup finishes, and the profile learns and keeps progress exactly as one with email does.
6. **Given** step 3, **When** the learner enters an address and then a wrong code three times, **Then** a new code is needed, and the address stays unverified.

---

### User Story 2 - A learner signs in on any device and their work follows them (Priority: P1)

A learner with a profile signs in at school on a shared iPad with their learner ID and password. "Keep me signed in on this device" is unchecked, as it always is on a new device. They practise, view a lesson, and start a check. Everything they do is saved to their profile as it happens. At home they sign in again, check "Keep me signed in", and find the same work in "My work", including the check they had not finished, with its typed draft. On the shared iPad, they signed out when they left. The next learner finds nothing of theirs: no work, no ID, no draft.

**Why this priority**: keeping progress across sessions and devices is the purpose of a profile (ADR 0006).

**Independent Test**: Sign in on one browser, answer a question, and type a draft into the next. Reload: the draft is there. Sign in on a second browser: both the answer and the draft are there. Sign out on the first: its page and storage hold nothing about the profile.

**Acceptance Scenarios**:

1. **Given** a wrong learner ID or a wrong password, **When** the learner signs in, **Then** the same message is shown for both: "That ID and password don't match."
2. **Given** many failed sign-ins on one learner ID, or from one network address, **Then** further tries are slowed with "Too many tries. Wait a minute and try again." The profile is never locked, and the right password works once the wait is over.
3. **Given** a session that is not kept, **When** 30 minutes pass without activity, **Then** the session ends, and the learner is asked to sign in again.
4. **Given** a kept session, **Then** it lasts 30 days from the last use, and never more than 90 days from sign-in.
5. **Given** a signed-in learner who has typed a draft and not submitted it, **When** they reload, **Then** the draft, the open help, and the explanation step are as they were at the last save, in practice and in a check.
6. **Given** a submission whose response is lost, **When** the app retries it, **Then** the answer is recorded once. A second genuine help event on the same question is recorded as a second event.
7. **Given** a signed-in learner, **When** they sign out, **Then** the session ends on the server, and nothing about the profile remains in the page or the browser's storage.
8. **Given** a signed-in learner, **Then** "My work", practice summaries, replay, and check summaries show the same things they show a guest, from the profile's record, without "this browser" wording.

---

### User Story 3 - A learner who forgot their password or ID gets back in, or is told honestly that they cannot (Priority: P1)

A learner forgot their password. On the sign-in page they choose "I forgot my password", enter their learner ID and one of their recovery codes, and choose a new password. Another learner forgot their ID too, but has a verified email: they enter the address and receive a message with their learner ID and a reset code. Two siblings who share a parent's address both appear in that one message, each with their own code. A third learner has neither the ID nor any recovery code or email. The page tells them plainly that the profile cannot be recovered, and offers to create a new one.

**Why this priority**: without recovery, a forgotten password loses all work. Honest loss is an ADR 0006 requirement.

**Independent Test**: Reset a password with a recovery code, then try the same code again: it fails. Reset with an email code. Request the forgotten-ID message for an address shared by two profiles: one message lists both, and each code works only with its own ID.

**Acceptance Scenarios**:

1. **Given** a learner ID and an unused recovery code, **When** the learner sets a new password, **Then** the password changes, the code is used up, and every session of the profile ends, including one in this browser. The learner then signs in with the new password.
2. **Given** a verified email, **When** the learner asks for a reset by learner ID, **Then** an email code is sent to that address, and the reset works as in scenario 1. After the reset, a short notice is sent to the verified address.
3. **Given** the "I don't know my ID" page, **When** any address is entered, **Then** the page says "If this address is on a profile, we have sent it a message.", whether or not it is.
4. **Given** an address verified on two profiles, **Then** one message lists both learner IDs, each with its own reset code. A code works only with its own profile's ID.
5. **Given** a learner with no ID, **Then** the page says the profile cannot be recovered without the ID and a recovery code or a verified email, and offers to create a new profile. It never suggests that support can find the profile.
6. **Given** a used code, another profile's code, an expired email code, or a wrong code, **Then** the reset fails, and nothing about the profile changes.

---

### User Story 4 - A learner with guest work signs in to an existing profile (Priority: P2)

A learner practised as a guest on a family computer, then signs in to their profile there. The app asks once: "Add it to the profile" or "Don't add it". Neither is selected, because on a shared computer the guest work may be someone else's. They choose to add it. The service checks every imported answer again, so the profile's results are its own. Both the profile and the browser had an unfinished addition check: the one started later stays open to continue, and the other is ended with its answers kept.

**Why this priority**: it prevents both silent loss of guest work and silent attachment of someone else's work (DL-007), but it only matters to learners who were guests first.

**Independent Test**: As a guest, answer two questions and leave a check unfinished. Sign in to a profile that also has an unfinished check. Choose "Add it to the profile": both questions appear, marked as guest work. The later check can be continued, and the earlier one shows its summary. The browser's guest record is gone.

**Acceptance Scenarios**:

1. **Given** guest work in the browser, **When** the learner signs in to an existing profile, **Then** the prompt is shown once, with no answer preselected.
2. **Given** "Add it to the profile", **Then** each imported answer's result is the service's own, from the answer's original text and its identity. An imported result that disagrees with the service's is replaced by the service's.
3. **Given** "Don't add it", **Then** nothing is added, and the guest record is removed from the browser.
4. **Given** "Add it to the profile", **Then** the guest record is removed from the browser only after the profile confirms the import. A retried import is stored once.
5. **Given** an unfinished check of the same skill in the browser and on the profile, **Then** the one started later stays resumable with its draft. The other is ended as spec 006 FR-003 ends a check: its answers are kept, and its unreached questions are recorded as not answered.
6. **Given** a practice question in progress in each, **Then** the one delivered later stays resumable, and the other is closed as a practice entry closes it (specs 002 and 003).

---

### User Story 5 - A learner manages their profile (Priority: P2)

In settings, a signed-in learner can:
- add, change, or remove their recovery email;
- make a new set of recovery codes;
- change their password;
- see how many devices are signed in, and when each was last used;
- sign out everywhere;
- download their work;
- delete their profile.

**Why this priority**: these complete the approved design (DL-007, DL-022, DL-042), but a profile is usable without them.

**Independent Test**: Add an email and verify it, start a change to a second address, and cancel: the first address is still verified. Download the work: it holds the learner's record and nothing about any other profile. Delete the profile and sign in again within 7 days: the deletion is cancelled.

**Acceptance Scenarios**:

1. **Given** a verified email, **When** the learner starts a change to a new address, **Then** the verified address stays in use until the new address's code succeeds. The change can be cancelled, and a mistyped address can be edited on the code screen.
2. **Given** "Remove email", **Then** the learner is told, before confirming, that they will lose email recovery.
3. **Given** "Make new recovery codes", **Then** a new set of ten is shown once, and every earlier code stops working.
4. **Given** a password change, **Then** it asks for the current password, ends every other session, and keeps this one.
5. **Given** two signed-in devices, **Then** settings shows "2 devices", each with its last-used date, and nothing else about them. "Sign out everywhere" ends both, this one included.
6. **Given** "Download my work", **Then** the learner gets their record as one file, in the guest record's shape plus their learner ID.
7. **Given** "Delete my profile", **When** the learner confirms with their password, **Then** every session ends, and the profile is hidden at once. The confirmation says that signing in within 7 days cancels the deletion, that the profile's data is deleted after 7 days, and how long backups keep it.

---

### User Story 6 - Profiles work in both languages, with assistive technology, and with an honest privacy notice (Priority: P3)

A learner sets up a profile in Norwegian Bokmål with a keyboard and a screen reader on an iPad. Every screen, message, and email is in the selected language. Before setup, they can read a privacy notice in plain language. It says what is stored and what is not, where the data is, how long each item is kept, and how to download or delete their work.

**Why this priority**: the constitution requires both languages and accessibility for every interaction; the privacy notice is a release item (DL-007). They apply to every story above rather than adding a flow of their own.

**Independent Test**: The dictionary-parity and literal checks pass with the new texts. A keyboard-only tester creates a profile, signs out, and signs in without a pointer, in both languages. The privacy notice is reachable from setup and from the footer.

**Acceptance Scenarios**:

1. **Given** a language switch during setup, **Then** the step, the learner ID, the typed password, and the email state are kept, and every text changes language.
2. **Given** a screen reader, **Then** each step's heading, the learner ID, the password rules, and every error are announced, and focus moves to the error or the next step's heading.
3. **Given** an iPad, **Then** every new control is at least 44 by 44 pixels, and the learner ID can be copied.
4. **Given** the privacy notice, **Then** it states, in both languages:
   - what is stored: the learner ID, the password hash, the optional email, the learning record, and sessions;
   - what is not stored: names, ages, schools, or device details;
   - what leaves the browser for a guest: each request's own data, such as a validation's exercise identity, answer text, and submission ID, none of which the service stores;
   - where the data is: Norway East, and the email provider within the EU/EEA;
   - how long each item is kept, and how to download and delete;
   - that anonymous setup is not network anonymity.

### Edge Cases

- **A session ends while the learner is working**: the next save fails as signed out. The learner is told they were signed out, and after signing in again they return to the same place, with the draft as of the last save.
- **The service is unreachable while signed in**: a save shows spec 002's "could not be saved" pattern and retries with the same write identifier. Work is never dropped silently.
- **A draft save arrives after a newer one**: the older save does not replace the newer draft.
- **The last characters before a crash**: they may be lost. The draft as of the last save is restored.
- **Signing in while signed in elsewhere**: allowed; each device has its own session.
- **A pending setup expires** after 24 hours: nothing of it is kept.
- **A learner who leaves during step 2**: starts again with a new learner ID, because they had not saved the first.
- **A pending email change** is discarded after 7 days. The verified address, if any, stays.
- **Signing in during the deletion grace**: cancels the deletion, and the learner is told so.
- **A profile with no sign-in for 3 years**: with a verified email, a notice is sent 30 days before deletion; without one, it is deleted as setup said it would be.
- **A guest record too large to import**: the import is refused with a message, and the guest record stays in the browser.
- **An imported answer that cannot be placed**: an event whose question cannot be resolved from its identity is dropped. The rest of the import continues, and the learner is told how many were left out.
- **Records from before this feature**: a guest record loads unchanged, and guests see no change apart from the new "Create a profile" and "Sign in" entries.
- **"Clear my work"**: stays a guest action. A signed-in learner has "Download my work" and "Delete my profile" instead.
- **Two tabs signed in to the same profile**: both save to the profile. Each question's resume state follows the latest save.
- **Changing the language**: stays a per-browser setting and is not stored on the profile.

## Requirements *(mandatory)*

### Functional Requirements

**Credentials and setup**

- **FR-001**: A profile MUST NOT require or ask for a real name, age, school, email address, or outside account. Its learner ID MUST be generated as `MKX-` and 8 characters from a 31-symbol alphabet without look-alikes (ADR 0006, ADR 0012).
- **FR-002**: A password MUST be at least 8 characters, of any characters, with no composition rules, and MUST NOT be on the repository's list of common passwords. The rules MUST be shown before the field in both languages. An outside breach service MUST NOT be called (design §1).
- **FR-003**: Setup MUST have the four steps of User Story 1. Step 1 MUST create only a pending setup, which cannot be signed in to and expires after 24 hours. Confirming step 2 MUST create the profile, attach any guest work, and sign in, all together or not at all (DL-027).
- **FR-004**: The ID reminder MUST hold the learner ID and the sign-in address and never the password. Recovery codes MUST be offered as a separate download, with the warning that the ID and one code are enough to take over the profile (design §2, §4).
- **FR-005**: Setup MUST state that a profile without its ID and without a recovery code or a verified email cannot be recovered, and that a profile with no sign-in for 3 years is deleted (ADR 0006; DL-042).

**Sign-in and sessions**

- **FR-006**: Sign-in MUST take the learner ID and the password. A wrong ID and a wrong password MUST get the same message (design §3).
- **FR-007**: Repeated failed sign-ins MUST be throttled both by learner ID and by network address, with "Too many tries. Wait a minute and try again." A profile MUST NOT be locked. Network addresses used for throttling MUST NOT be stored (ADR 0012).
- **FR-008**: A session MUST be held on the server and MUST be revocable there. The browser MUST hold only an opaque session token, and state-changing requests MUST be protected against cross-site forgery (ADR 0012).
- **FR-009**: "Keep me signed in on this device" MUST be unchecked on a device that has not been used before. A session that is not kept MUST end after 30 minutes without activity. A kept session MUST end 30 days after its last use, and never more than 90 days after sign-in (DL-042).
- **FR-010**: Signing out MUST end the session on the server and remove everything about the profile from the page and the browser's storage. While signed in, the profile's record MUST NOT be kept in the browser's storage (design §3, §5).
- **FR-011**: "Sign out everywhere" MUST end every session of the profile, this one included. A password change MUST ask for the current password, end every other session, and keep this one (DL-007; ADR 0012).
- **FR-012**: Settings MUST show the number of signed-in devices and each one's last-used date, and nothing else about them (DL-007).

**Recovery**

- **FR-013**: Ten one-time recovery codes MUST be generated at setup, shown once, and stored only as hashes. A code with its profile's learner ID MUST allow one password reset and then stop working. Making a new set MUST replace the old one (DL-007; ADR 0012).
- **FR-014**: A verified email MUST be able to receive a six-digit email code for a password reset, valid for 15 minutes, with three tries. Sends MUST be limited per address and per profile. A reset MUST NOT use a link or put a token in a URL (ADR 0009; ADR 0012).
- **FR-015**: "I don't know my ID" MUST send, to a verified address, one message listing every profile verified with it, each with its learner ID and its own reset code. The page MUST give the same answer whether or not the address is on a profile (design §4).
- **FR-016**: A reset MUST end every session of the profile, including one in the browser that completed it, and MUST send a short notice to a verified address (ADR 0012).
- **FR-017**: A learner with neither the ID nor a recovery code or verified email MUST be told that the profile cannot be recovered, and offered a new profile. Text MUST NOT suggest that support can find a profile (ADR 0006).

**Email**

- **FR-018**: Adding or changing an email MUST keep a verified address in use until the new address's code succeeds. A pending change MUST be cancellable, a mistyped address MUST be editable on the code screen, and "Continue without email" MUST be offered at every stage (DL-022).
- **FR-019**: Email codes for verification MUST follow FR-014's rules. A pending change MUST be discarded after 7 days. Removing the address MUST always be allowed, after the learner is told they will lose email recovery (DL-022; design §7).
- **FR-020**: Profile messages MUST be only verification, recovery, the notice after a reset, and the notice before an inactive profile is deleted. Each MUST carry only the address and, where it needs them, the learner ID and a code. They MUST be sent through a provider that processes them within the EU/EEA (ADR 0013).

**The signed-in record**

- **FR-021**: For a signed-in learner, every answer, help or explanation event, lesson view, check-run step, and session change MUST be saved to the profile as it happens (design §5).
- **FR-022**: Each logical write MUST carry its own write identifier, made once when the learner acts and reused on every retry. The profile MUST store each identifier once. A submission's identifier MUST be its existing submission ID (design §5).
- **FR-023**: For a signed-in learner, a submission MUST be validated and recorded in one request, so the stored result is the service's own (design §5).
- **FR-024**: The question in progress MUST keep its resume state on the profile: the typed draft, whether help and the explanation are open, and their steps. It MUST be saved after a pause in typing, on each help or explanation change, and when the page is hidden or left. A save MUST carry a sequence number, and an older save MUST NOT replace a newer one. On load, the app MUST restore it (design §5; spec 006 FR-015; DL-026 (4)).
- **FR-025**: "My work", practice summaries, replay, check summaries, practice's repeat avoidance, and sessions MUST behave as specs 004 to 006 specify, reading the profile's record. Text that says "this browser" MUST be shown only to guests.
- **FR-026**: Each observation MUST keep its exercise identity (definition, version, and seed), so it can be replayed (ADR 0004, ADR 0011).

**Guests and guest work**

- **FR-027**: A guest's record MUST stay in the browser and MUST NOT be stored on the server. A guest's single requests MAY send what the service needs to answer them, and the service MUST NOT store any of it (DL-042 (3)).
- **FR-028**: Creating a profile MUST attach the browser's guest work, marked as guest work. Signing in to an existing profile with guest work in the browser MUST ask once, "Add it to the profile" or "Don't add it", with neither preselected. Either way, the guest record MUST then be removed from the browser; with "Add it", only after the profile confirms the import (DL-007; design §5).
- **FR-029**: An import MUST be treated as untrusted. The service MUST resolve each question from its identity and validate each submission's original text again, store its own results, drop events it cannot place, keep the provenance "guest import", cap the import's size, and carry one write identifier for the whole import. Check runs and lesson views MUST follow the same rules (design §5).
- **FR-030**: When the browser and the profile each hold an unfinished check of the same skill, the one started later MUST stay resumable, and the other MUST be ended as spec 006 FR-003 ends a check. When each holds a practice question in progress, the one delivered later MUST stay resumable, and the other MUST be closed as a practice entry closes it (design §5).

**Deletion, retention, and export**

- **FR-031**: "Delete my profile" MUST ask for the password, end every session, and hide the profile at once. Signing in within 7 days MUST cancel the deletion. After 7 days, the profile and everything under it MUST be deleted from the live store; backups expire on their own retention (DL-042 (5)).
- **FR-032**: Retention MUST follow design §7: pending setups 24 hours; pending email changes 7 days; sessions as FR-009; deleted profiles 7 days; profiles with no sign-in for 3 years deleted, with a notice 30 days before when an email is verified; platform request logs 30 days (DL-042).
- **FR-033**: "Download my work" MUST give the signed-in learner's whole record as one JSON file, in the guest record's shape plus the learner ID, and nothing about any other profile (DL-007).

**Privacy and logs**

- **FR-034**: A privacy notice MUST be available in both languages, linked from setup and from the footer, with the contents of User Story 6, scenario 4 (DL-007; design §8).
- **FR-035**: A learner ID, email address, code, password, or answer MUST NOT appear in a URL or in a request log. Failed sign-ins MUST be counted, not logged with their learner IDs (ADR 0009; design §8).
- **FR-036**: An email address MUST be stored only on the profile itself. A learning record MUST NOT hold the learner ID or an email, and deleting a profile MUST remove everything under it in one operation (design §6).

**Languages and accessibility**

- **FR-037**: Every new screen, message, and email MUST exist in Norwegian Bokmål and English and MUST pass the dictionary-parity and literal checks. Profile emails MUST be in the language selected when they were requested; the inactivity notice MUST be in both.
- **FR-038**: Every new screen MUST work with a keyboard and a screen reader, MUST move focus to the next step's heading or to the error, and MUST have touch targets of at least 44 by 44 pixels (constitution V).

### Key Entities

- **Profile**: a learner's account. It holds an internal identifier that never leaves the server, the learner ID, the password hash, the recovery-code hashes, and the email state: a verified address, a pending address, and their code state.
- **Pending setup**: a reserved learner ID and a password hash, for at most 24 hours, that cannot be signed in to.
- **Session**: one signed-in device: the token's hash, whether it is kept, its start, and its last use.
- **Profile record**: the profile's deliveries with their events, lesson views, practice sessions, check runs, and the resume state of the question in progress. Each item carries its write identifier and its provenance (its own, or "guest import").
- **Guest record**: unchanged from specs 002 to 006, and never stored on the server.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A learner can create a profile without email in under 3 minutes, and sign in on a second device in under 1 minute, with no personal detail asked at any point.
- **SC-002**: In 100 percent of automated runs, every rejection case is refused: a learner ID alone, a wrong password, a used or another profile's recovery code, an expired or wrong email code, and a revoked or expired session.
- **SC-003**: In 100 percent of automated runs, a signed-in learner's answers, help events, lesson views, check runs, and draft are the same on a second device and after a reload. A retried write is stored once.
- **SC-004**: In 100 percent of automated import runs, forged results are replaced by the service's own, provenance is kept, two unfinished checks resolve as FR-030 says, and the guest record is removed only after the import is confirmed.
- **SC-005**: After signing out, no item about the profile remains in the page or in the browser's storage, checked automatically on every new screen.
- **SC-006**: A throttled guessing loop of 100 tries, on one learner ID from many addresses or from one address on many IDs, is slowed, and the profile can still be signed in to with the right password once the wait is over.
- **SC-007**: Every requirement above has an automated test in continuous integration, run against the same kind of data store as production (ADR 0008), and continuous integration still finishes in under 10 minutes.
- **SC-008**: A keyboard-only tester creates a profile, signs out, recovers the password with a recovery code, and signs in, in both languages, without a pointer.
- **SC-009**: Three people, one learner of the target age, one adult, and one on an iPad, complete setup with recovery codes offered (design §11). Afterwards each can say where they saved the ID, whether they kept the codes, and what happens if they lose both. Findings are recorded, not scored.

## Assumptions

- **Scope**: decision-log F9, as the accepted design states it. This feature leaves out, as the design does:
  - learner, parent, and teacher relationships (ADR 0006);
  - passkeys (ADR 0012 leaves them for later);
  - importing an export into another profile;
  - any mastery model, recommendation, or AI use;
  - "Clear my work" for a signed-in learner: clearing a profile's record without deleting the profile is not in the design.
- **Before release, not before building**: the owner's legal check of the privacy notice, and of what applies to learners under 13 (DL-042 (8)), comes before release. This feature builds the notice with the contents FR-034 lists.
- **Facts the plan confirms**: OWASP's current iteration count for PBKDF2-HMAC-SHA512 (210,000 when the design was written); the database's backup retention on the chosen tier, which the deletion confirmation and the privacy notice state; and the email provider and where it processes data (ADR 0013).
- **Asking for the password again**: deletion and a password change ask for it, as the design says. Making new recovery codes also asks for it, because a new set is enough to take over the profile. This is a reversible default.
- **Plan decisions**: the size cap on an import; the pause before a draft save (about a second); how the session lifetime and the throttling limits are configured; and whether throttling uses the framework's rate limiting or a limiter in the sign-in handler (ADR 0012).
- **Language**: stays a per-browser setting and is not stored on the profile. "Keep me signed in" is remembered per device, never per profile.
- **Dependencies**: specs 001 to 006 merged and deployed; the database and the email provider provisioned in their decided regions (ADR 0009, ADR 0013).
- **Before this specification leaves Draft**: the three-person observation (SC-009) can run on the prototype's setup flow, which already offers the ID reminder. Its findings may change User Story 1's wording, not its steps.
