import { useEffect, useRef, useState } from 'react';
import { Button, Card, Heading, Paragraph, Link, Tag, Alert, Textfield, Checkbox, Dialog, ErrorSummary, Radio, Fieldset, useRadioGroup } from '@digdir/designsystemet-react';
import { FilesIcon, DownloadIcon, ArrowRightIcon, EnvelopeClosedIcon, ShieldCheckmarkIcon } from '@navikt/aksel-icons';
import { useStore, generateLearnerId, checkCredentials, DEMO, go } from '../store.jsx';
import { PageHead } from '../components/Page.jsx';
import { LanguageSwitch } from '../App.jsx';

// All authentication here is SIMULATED. Credential format, hashing, recovery and
// session handling are open decisions (ADR 0006).
const PROTO_CODE = '246810';
const MAX_CODE_TRIES = 3;
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

export function guestSummary(learner) {
  const tasks = learner.events.filter((e) => e.type === 'delivery').length;
  const lessons = new Set(learner.events.filter((e) => e.type === 'lesson-viewed').map((e) => e.lesson)).size;
  return { tasks, lessons, any: learner.events.length > 0 };
}

function IdBox({ id }) {
  const { t, lang } = useStore();
  const [msg, setMsg] = useState('');
  const copy = async () => {
    try { await navigator.clipboard.writeText(id); setMsg(t('profile.copied')); } catch { setMsg(t('profile.copyFailed')); }
  };
  const download = async () => {
    const text = t('profile.reminderFile', { id, date: new Date().toLocaleDateString(lang === 'nb' ? 'nb-NO' : 'en-GB'), url: 'https://mathkx.example/signin (prototype)' });
    const filename = `mathkx-${id}.txt`;
    const dl = window.claude?.use ? await window.claude.use('downloads').catch(() => null) : null;
    if (dl) {
      try { await dl.save({ filename, data: text }); setMsg(t('profile.reminderSaved')); }
      catch (e) { if (e?.code !== 'declined') setMsg(t('profile.reminderFailed')); }
      return;
    }
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  return (
    <div className="mkx-panel-accent flex flex-col gap-3">
      <span className="text-sm font-semibold">{t('profile.yourId')}</span>
      <span className="mkx-id select-all" aria-label={`${t('profile.yourId')}: ${id.split('').join(' ')}`}>{id}</span>
      <Paragraph data-size="sm" className="m-0">{t('profile.idNotSecret')}</Paragraph>
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={copy}><FilesIcon aria-hidden="true" />{t('profile.copy')}</Button>
        <Button variant="secondary" onClick={download}><DownloadIcon aria-hidden="true" />{t('profile.download')}</Button>
      </div>
      <p className="m-0 text-sm" role="status">{msg}</p>
      <Paragraph data-size="sm" className="m-0">{t('profile.downloadNote')}</Paragraph>
    </div>
  );
}

/** Email + verification: enter → code (correctable address, resend, failure) → verified, or verify later. */
function EmailSetup({ onDone, onCancel, cancelLabel, initialEmail = '', startAtEnter = false }) {
  const { t, dispatch, profile } = useStore();
  // Changing a confirmed address: the old one stays in use for recovery until the
  // new one is confirmed (Gemini round-03). The new one waits in pendingEmail.
  const replacing = profile?.emailState === 'verified';
  const [email, setEmail] = useState(initialEmail || profile?.pendingEmail || (profile?.emailState === 'pending' ? profile.email : ''));
  const [stage, setStage] = useState(!startAtEnter && ((profile?.emailState === 'pending') || profile?.pendingEmail) && !initialEmail ? 'verify' : 'enter');
  const [code, setCode] = useState('');
  const [err, setErr] = useState(null);
  const [tries, setTries] = useState(0);
  const [sentMsg, setSentMsg] = useState('');
  const locked = tries >= MAX_CODE_TRIES;

  if (stage === 'enter') {
    return (
      <form noValidate className="flex flex-col gap-4" onSubmit={(e) => {
        e.preventDefault();
        if (!validEmail(email)) { setErr(t('profile.emailInvalid')); return; }
        setErr(null); setTries(0); setCode('');
        dispatch({ type: 'profilePatch', patch: replacing ? { pendingEmail: email.trim() } : { email: email.trim(), emailState: 'pending' } });
        setStage('verify'); setSentMsg('');
      }}>
        <Textfield type="email" autoComplete="email" inputMode="email" label={t('profile.emailLabel')} description={t('profile.emailPurpose')} value={email} onChange={(e) => { setEmail(e.target.value); setErr(null); }} error={err ?? undefined} />
        <div className="flex flex-wrap gap-3">
          <Button type="submit">{t('profile.sendCode')}</Button>
          {onCancel && <Button type="button" variant="secondary" onClick={onCancel}>{cancelLabel}</Button>}
        </div>
      </form>
    );
  }
  return (
    <form noValidate className="flex flex-col gap-4" onSubmit={(e) => {
      e.preventDefault();
      if (locked) return;
      if (code.replace(/\s/g, '') !== PROTO_CODE) {
        const n = tries + 1; setTries(n);
        setErr(n >= MAX_CODE_TRIES ? t('profile.codeLocked') : t('profile.codeWrong', { left: MAX_CODE_TRIES - n }));
        return;
      }
      dispatch({ type: 'profilePatch', patch: replacing ? { email: profile.pendingEmail ?? email.trim(), emailState: 'verified', pendingEmail: null } : { emailState: 'verified' } });
      onDone?.('verified');
    }}>
      <Heading level={3} data-size="xs" className="m-0">{t('profile.verifyTitle')}</Heading>
      <Paragraph className="m-0">{t('profile.verifyLead', { email })}</Paragraph>
      <p className="m-0 text-sm" role="status">{sentMsg}</p>
      <Alert data-color="info"><Paragraph data-size="sm">{t('profile.verifyProto')}</Paragraph></Alert>
      <div className="w-full max-w-sm"><Textfield label={t('profile.code')} inputMode="numeric" autoComplete="one-time-code" value={code} disabled={locked}
        onChange={(e) => { setCode(e.target.value); if (!locked) setErr(null); }} error={err ?? undefined} /></div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={locked}>{t('profile.verify')}</Button>
        <Button type="button" variant="secondary" onClick={() => { setTries(0); setErr(null); setCode(''); setSentMsg(t('profile.codeResent', { email })); }}>{t('profile.resend')}</Button>
        <Button type="button" variant="tertiary" onClick={() => { setStage('enter'); setErr(null); }}>{t('profile.changeEmail')}</Button>
        {replacing && onCancel && <Button type="button" variant="tertiary" onClick={() => { dispatch({ type: 'profilePatch', patch: { pendingEmail: null } }); onCancel(); }}>{t('profile.cancelChange', { email: profile.email })}</Button>}
      </div>
      <div className="pt-2 border-t flex flex-col gap-2" style={{ borderColor: 'var(--ds-color-neutral-border-subtle)' }}>
        <Paragraph data-size="sm" className="m-0">{replacing ? t('profile.pendingReplaceExplain', { email: profile.email }) : t('profile.pendingExplain')}</Paragraph>
        <div><Button type="button" variant="tertiary" onClick={() => onDone?.('pending')}>{t('profile.verifyLater')}</Button></div>
      </div>
    </form>
  );
}

export function SetupBanner() {
  const { state, t } = useStore();
  const s = state.signup;
  if (!s || s.step < 2 || s.step > 3 || !state.profileId) return null;
  return (
    <Alert data-color="warning" className="mb-4">
      <Paragraph>{t('profile.interrupted', { id: s.id })}</Paragraph>
      <Link href="#/profile/new">{t('profile.resumeSetup')}</Link>
    </Alert>
  );
}

export function CreateProfile() {
  const { t, state, dispatch, profile } = useStore();
  const [initialId] = useState(generateLearnerId);
  const signup = state.signup ?? { step: 1, id: initialId };
  useEffect(() => { if (!state.signup && !profile) dispatch({ type: 'signup', signup }); }, []); // eslint-disable-line
  const setSignup = (p) => dispatch({ type: 'signup', signup: { ...signup, ...p } });
  // Passwords stay in component memory only, never in storage.
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [savedErr, setSavedErr] = useState(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const total = 4;
  const step = signup.step;
  const guest = guestSummary(state.learner);

  if (profile && !state.signup) {
    return (
      <div className="mkx-container max-w-[44rem]">
        <PageHead title={t('profile.createTitle')} />
        <Alert data-color="info"><Paragraph>{t('home.signedInAs')} {profile.id}.</Paragraph></Alert>
        <div className="mt-4"><Button asChild><a href="#/home">{t('profile.goHome')}</a></Button></div>
      </div>
    );
  }

  const submitStep1 = (e) => {
    e.preventDefault();
    const errs = {};
    if (pw.length < 10) errs.pw = t('profile.pwShort');
    else if (pw !== pw2) errs.pw2 = t('profile.pwMismatch');
    setErrors(errs);
    if (Object.keys(errs).length) return;
    dispatch({ type: 'createProfile', id: signup.id, password: pw });
    setPw(''); setPw2('');
    setSignup({ step: 2 });
  };
  const keepLearning = (
    <Paragraph data-size="sm" className="m-0"><Link href="#/home">{t('profile.continueLearning')}</Link> {step >= 2 ? t('profile.continueLearningNote') : ''}</Paragraph>
  );

  return (
    <div className="mkx-container max-w-[44rem] pb-8">
      <PageHead title={t('profile.createTitle')} lead={step === 1 ? t('profile.createLead') : undefined}
        eyebrow={<span className="text-sm font-semibold block mb-2" style={{ color: 'var(--ds-color-neutral-text-subtle)' }}>{t('profile.step', { i: step, n: total })}</span>} />

      {step === 1 && (
        <form noValidate onSubmit={submitStep1} className="flex flex-col gap-6">
          <Alert data-color="info">
            <Heading level={2} data-size="2xs">{t('profile.noPersonal')}</Heading>
            <Paragraph data-size="sm">{t('profile.notAnon')}</Paragraph>
          </Alert>
          {guest.any && (
            <Card variant="tinted">
              <Heading level={2} data-size="2xs">{t('profile.guestTitle')}</Heading>
              <Paragraph data-size="sm" className="m-0">{t('profile.guestBody', { tasks: guest.tasks, lessons: guest.lessons })}</Paragraph>
            </Card>
          )}
          {Object.keys(errors).length > 0 && (
            <ErrorSummary>
              <ErrorSummary.Heading>{t('profile.fixErrors')}</ErrorSummary.Heading>
              <ErrorSummary.List>
                {Object.entries(errors).map(([k, v]) => <ErrorSummary.Item key={k}><ErrorSummary.Link href="#" onClick={(e) => { e.preventDefault(); document.getElementById(`f-${k}`)?.focus(); }}>{v}</ErrorSummary.Link></ErrorSummary.Item>)}
              </ErrorSummary.List>
            </ErrorSummary>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="mkx-panel-accent flex flex-col gap-2">
              <span className="text-sm font-semibold">{t('profile.yourId')}</span>
              <span className="mkx-id" aria-label={`${t('profile.yourId')}: ${signup.id.split('').join(' ')}`}>{signup.id}</span>
              <Paragraph data-size="sm" className="m-0">{t('profile.idExplain')}</Paragraph>
              <div><Button type="button" variant="tertiary" data-size="sm" onClick={() => setSignup({ id: generateLearnerId() })}>{t('profile.newId')}</Button></div>
            </div>
            <div className="mkx-panel flex flex-col gap-2">
              <span className="text-sm font-semibold">{t('profile.passwordBox')}</span>
              <Paragraph data-size="sm" className="m-0">{t('profile.passwordExplain')}</Paragraph>
            </div>
          </div>
          <input type="text" name="username" autoComplete="username" value={signup.id} readOnly hidden />
          <Textfield id="f-pw" type={show ? 'text' : 'password'} autoComplete="new-password" label={t('profile.password')} description={t('profile.passwordDesc')} value={pw} onChange={(e) => setPw(e.target.value)} error={errors.pw} />
          <Textfield id="f-pw2" type={show ? 'text' : 'password'} autoComplete="new-password" label={t('profile.password2')} value={pw2} onChange={(e) => setPw2(e.target.value)} error={errors.pw2} />
          <Checkbox label={t('profile.show')} checked={show} onChange={(e) => setShow(e.target.checked)} />
          <div className="flex flex-wrap items-center gap-4">
            <Button type="submit" data-size="lg">{t('profile.create')}<ArrowRightIcon aria-hidden="true" /></Button>
            <Button type="button" variant="tertiary" onClick={() => { dispatch({ type: 'signup', signup: null }); go('#/home'); }}>{t('profile.notNow')}</Button>
          </div>
          <Paragraph data-size="xs" className="m-0">{t('profile.simulated')}</Paragraph>
        </form>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-6">
          <Alert data-color="success"><Paragraph>{t('profile.created', { tasks: guest.tasks })}</Paragraph></Alert>
          <Heading level={2} data-size="sm">{t('profile.saveTitle')}</Heading>
          <Paragraph data-size="lg" className="m-0">{t('profile.saveLead')}</Paragraph>
          <IdBox id={signup.id} />
          <Checkbox label={t('profile.confirmSaved')} checked={saved} onChange={(e) => { setSaved(e.target.checked); setSavedErr(null); }} error={savedErr ?? undefined} />
          <div><Button data-size="lg" onClick={() => { if (!saved) { setSavedErr(t('profile.confirmRequired')); return; } setSignup({ step: 3 }); }}>{t('profile.continue')}<ArrowRightIcon aria-hidden="true" /></Button></div>
          {keepLearning}
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-6">
          <Heading level={2} data-size="sm">{t('profile.emailTitle')}</Heading>
          <Paragraph data-size="lg" className="m-0">{t('profile.emailLead')}</Paragraph>
          <Card variant="tinted">
            <Paragraph className="m-0">{t('profile.emailRisk')}</Paragraph>
            <Paragraph data-size="sm" className="m-0">{t('profile.emailLater')}</Paragraph>
          </Card>
          {!emailOpen ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Button variant="secondary" data-size="lg" className="w-full" onClick={() => setEmailOpen(true)}><EnvelopeClosedIcon aria-hidden="true" />{t('profile.addEmail')}</Button>
              <Button variant="secondary" data-size="lg" className="w-full" onClick={() => setSignup({ step: 4, email: 'none' })}>{t('profile.noEmail')}</Button>
            </div>
          ) : (
            <EmailSetup onDone={(s) => setSignup({ step: 4, email: s })} onCancel={() => { dispatch({ type: 'profilePatch', patch: { email: null, emailState: 'none', pendingEmail: null } }); setSignup({ step: 4, email: 'none' }); }} cancelLabel={t('profile.noEmail')} />
          )}
          {keepLearning}
        </div>
      )}

      {step === 4 && (
        <div className="flex flex-col gap-6">
          <Alert data-color="success">
            <Heading level={2} data-size="xs">{t('profile.doneTitle')}</Heading>
            <Paragraph>{t('profile.doneLead')}</Paragraph>
          </Alert>
          <EmailStatus />
          <div className="mkx-panel"><span className="text-sm font-semibold block">{t('profile.yourId')}</span><span className="mkx-id">{signup.id}</span></div>
          <div><Button data-size="lg" onClick={() => { dispatch({ type: 'signup', signup: null }); go('#/home'); }}>{t('profile.goHome')}<ArrowRightIcon aria-hidden="true" /></Button></div>
        </div>
      )}
    </div>
  );
}

function EmailStatus() {
  const { t, profile } = useStore();
  if (!profile) return null;
  if (profile.emailState === 'verified') return (
    <div className="flex flex-col items-start gap-1">
      <Paragraph className="m-0"><ShieldCheckmarkIcon aria-hidden="true" /> {t('profile.verifiedFor', { email: profile.email })}</Paragraph>
      {profile.pendingEmail && <><Tag data-color="warning" data-size="sm">{t('profile.pending')}</Tag><Paragraph className="m-0">{t('profile.pendingReplace', { email: profile.pendingEmail, old: profile.email })}</Paragraph></>}
    </div>
  );
  if (profile.emailState === 'pending') return <div className="flex flex-col items-start gap-1"><Tag data-color="warning" data-size="sm">{t('profile.pending')}</Tag><Paragraph className="m-0">{t('profile.pendingFor', { email: profile.email })}</Paragraph></div>;
  return <Paragraph className="m-0">{t('settings.noEmail')}</Paragraph>;
}

export function SignIn() {
  const { t, state, dispatch } = useStore();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(null);
  const guest = guestSummary(state.learner);
  const { getRadioProps, value: guestChoice } = useRadioGroup({ name: 'guest-work', value: 'import' });
  const submit = (e) => {
    e.preventDefault();
    if (!id.trim() || !pw) { setErr(t('signin.missing')); return; }
    const p = checkCredentials(state.profiles, id, pw);
    if (!p) { setErr(t('signin.failed')); return; }
    dispatch({ type: 'signIn', id: p.id, guest: guest.any ? guestChoice : 'none' });
    go('#/home');
  };
  return (
    <div className="mkx-container max-w-[36rem] pb-8">
      <PageHead title={t('signin.title')} lead={t('signin.lead')} />
      <form noValidate onSubmit={submit} className="flex flex-col gap-5">
        {err && <Alert data-color="danger" role="alert"><Paragraph>{err}</Paragraph></Alert>}
        <Textfield label={t('signin.id')} description={t('signin.idDesc')} autoComplete="username" autoCapitalize="characters" spellCheck={false} value={id} onChange={(e) => setId(e.target.value)} />
        <Textfield type="password" label={t('signin.password')} autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} />
        {guest.any && (
          <Fieldset>
            <Fieldset.Legend>{t('signin.guestTitle')}</Fieldset.Legend>
            <Fieldset.Description>{t('signin.guestBody', { tasks: guest.tasks, lessons: guest.lessons })}</Fieldset.Description>
            <Radio label={t('signin.guestImport')} description={t('signin.guestImportDesc')} {...getRadioProps('import')} />
            <Radio label={t('signin.guestDiscard')} description={t('signin.guestDiscardDesc')} {...getRadioProps('none')} />
          </Fieldset>
        )}
        <div><Button type="submit" data-size="lg">{t('signin.submit')}</Button></div>
      </form>
      <div className="flex flex-col gap-2 mt-6">
        <Link href="#/recovery">{t('signin.forgot')}</Link>
        <span>{t('signin.noProfile')} <Link href="#/profile/new">{t('nav.createProfile')}</Link></span>
        <span><Link href="#/home">{t('signin.asGuest')}</Link></span>
      </div>
      <Alert data-color="info" className="mt-8">
        <Paragraph data-size="sm">{t('signin.demo', { id: DEMO.id, pw: DEMO.password })}</Paragraph>
        <Button data-color="accent" variant="tertiary" data-size="sm" onClick={() => { setId(DEMO.id); setPw(DEMO.password); setErr(null); }}>{t('signin.useDemo')}</Button>
      </Alert>
    </div>
  );
}

export function Recovery() {
  const { t } = useStore();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState(null);
  return (
    <div className="mkx-container max-w-[44rem] pb-8">
      <PageHead title={t('recovery.title')} lead={t('recovery.lead')} />
      <div className="flex flex-col gap-4">
        <Card>
          <Heading level={2} data-size="xs">{t('recovery.p1t')}</Heading>
          <Paragraph>{t('recovery.p1')}</Paragraph>
        </Card>
        <Card>
          <Heading level={2} data-size="xs">{t('recovery.p2t')}</Heading>
          <Paragraph>{t('recovery.p2')}</Paragraph>
        </Card>
        <Card variant="tinted" data-color="accent">
          <form noValidate className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); if (!validEmail(email)) { setErr(t('profile.emailInvalid')); return; } setErr(null); setSent(true); }}>
            <Textfield type="email" inputMode="email" autoComplete="email" label={t('recovery.emailLabel')} value={email} onChange={(e) => { setEmail(e.target.value); setSent(false); }} error={err ?? undefined} />
            <div><Button type="submit">{t('recovery.send')}</Button></div>
            <div role="status">{sent && <Alert data-color="info"><Paragraph data-size="sm">{t('recovery.sent')}</Paragraph></Alert>}</div>
          </form>
        </Card>
        <Card variant="tinted">
          <Heading level={2} data-size="xs">{t('recovery.p3t')}</Heading>
          <Paragraph>{t('recovery.p3')}</Paragraph>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" asChild><a href="#/profile/new">{t('recovery.newProfile')}</a></Button>
            <Button variant="tertiary" asChild><a href="#/home">{t('signin.asGuest')}</a></Button>
          </div>
        </Card>
        <Paragraph data-size="xs">{t('recovery.open')}</Paragraph>
      </div>
    </div>
  );
}

export function Settings() {
  const { t, profile, dispatch } = useStore();
  const confirmRef = useRef(null);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState('');
  if (!profile) {
    return (
      <div className="mkx-container max-w-[40rem]">
        <PageHead title={t('settings.title')} />
        <Alert data-color="info"><Paragraph>{t('home.guestNote')}</Paragraph></Alert>
        <div className="mt-4 flex gap-3"><Button asChild><a href="#/signin">{t('nav.signIn')}</a></Button><Button variant="secondary" asChild><a href="#/profile/new">{t('nav.createProfile')}</a></Button></div>
      </div>
    );
  }
  return (
    <div className="mkx-container max-w-[44rem] pb-8">
      <PageHead title={t('settings.title')} crumbs={[{ href: '#/home', label: t('home.title') }, { href: '#/settings', label: t('settings.title') }]} />
      <div className="flex flex-col gap-6">
        <section aria-labelledby="s-prof"><Card>
          <Heading level={2} data-size="xs" id="s-prof">{t('settings.profile')}</Heading>
          <IdBox id={profile.id} />
          <Paragraph data-size="sm" className="m-0">{t('settings.passwordNote')}</Paragraph>
        </Card></section>

        <section aria-labelledby="s-lang"><Card>
          <Heading level={2} data-size="xs" id="s-lang">{t('settings.language')}</Heading>
          <Paragraph data-size="sm">{t('settings.languageDesc')}</Paragraph>
          <div><LanguageSwitch size="md" /></div>
        </Card></section>

        <section aria-labelledby="s-rec"><Card>
          <Heading level={2} data-size="xs" id="s-rec">{t('settings.recovery')}</Heading>
          <div role="status">{msg && <Paragraph data-size="sm">{msg}</Paragraph>}</div>
          {adding ? (
            <EmailSetup startAtEnter={adding === 'enter'} initialEmail={profile.emailState === 'pending' && adding !== 'enter' ? profile.email : ''} onDone={(s) => { setAdding(false); setMsg(s === 'verified' ? t('profile.verified') : t('profile.pending')); }} onCancel={() => setAdding(false)} cancelLabel={t('settings.cancel')} />
          ) : profile.email ? (
            <>
              <EmailStatus />
              <div className="flex flex-wrap gap-3">
                {(profile.emailState === 'pending' || profile.pendingEmail) && <Button onClick={() => { setAdding(true); setMsg(''); }}>{t('settings.finishVerify')}</Button>}
                <Button variant="secondary" onClick={() => { setAdding('enter'); setMsg(''); }}>{t('settings.change')}</Button>
                <Button variant="secondary" data-color="danger" onClick={() => confirmRef.current?.showModal()}>{t('settings.remove')}</Button>
              </div>
            </>
          ) : (
            <>
              <Paragraph>{t('settings.noEmail')}</Paragraph>
              <div><Button variant="secondary" onClick={() => { setAdding(true); setMsg(''); }}><EnvelopeClosedIcon aria-hidden="true" />{t('profile.addEmail')}</Button></div>
            </>
          )}
        </Card></section>

        <section aria-labelledby="s-priv"><Card variant="tinted">
          <Heading level={2} data-size="xs" id="s-priv">{t('settings.privacy')}</Heading>
          <Paragraph data-size="sm">{t('settings.privacyList')}</Paragraph>
        </Card></section>

        <div><Button variant="secondary" onClick={() => { dispatch({ type: 'signOut' }); go('#/'); }}>{t('settings.signOut')}</Button></div>
        <Paragraph data-size="xs">{t('settings.signOutNote')}</Paragraph>
      </div>

      <Dialog ref={confirmRef} closeButton={t('settings.cancel')} closedby="any" className="w-[min(32rem,calc(100vw-2rem))]">
        <Dialog.Block>
          <Heading level={2} data-size="xs">{t('settings.removeConfirmTitle')}</Heading>
          <Paragraph className="mt-3">{t('settings.removeConfirm')}</Paragraph>
        </Dialog.Block>
        <Dialog.Block className="flex flex-wrap gap-3">
          <Button data-color="danger" onClick={() => { dispatch({ type: 'profilePatch', patch: { email: null, emailState: 'none', pendingEmail: null } }); confirmRef.current?.close(); setMsg(t('settings.removed')); }}>{t('settings.removeYes')}</Button>
          <Button variant="secondary" onClick={() => confirmRef.current?.close()}>{t('settings.cancel')}</Button>
        </Dialog.Block>
      </Dialog>
    </div>
  );
}
