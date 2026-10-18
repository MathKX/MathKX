import { useEffect, useRef, useState } from 'react';
import { Button, ToggleGroup, SkipLink, Link, Paragraph } from '@digdir/designsystemet-react';
import { MenuHamburgerIcon, XMarkIcon, PersonCircleIcon } from '@navikt/aksel-icons';
import { useStore, useRoute } from './store.jsx';
import { Landing } from './pages/Landing.jsx';
import { Library, DomainPage, TopicPage } from './pages/Library.jsx';
import { LessonPage } from './pages/Lesson.jsx';
import { PracticePage, CheckPage } from './pages/Practice.jsx';
import { CreateProfile, SignIn, Recovery, Settings } from './pages/Profile.jsx';
import { Home } from './pages/Home.jsx';
import { About } from './pages/About.jsx';

export const REPO_URL = 'https://github.com/MathKX/MathKX';

function Logo() {
  return (
    <a href="#/" className="flex items-center gap-2 no-underline" style={{ color: 'var(--ds-color-neutral-text-default)' }} aria-label="MathKX">
      <span aria-hidden="true" className="grid place-items-center rounded-lg font-bold" style={{ width: 36, height: 36, background: 'var(--ds-color-accent-base-default)', color: 'var(--ds-color-accent-base-contrast-default)', fontSize: 15, letterSpacing: '-0.02em' }}>
        <span className="grid grid-cols-2 gap-[2px]">
          {[0, 1, 2, 3].map((i) => <span key={i} style={{ width: 7, height: 7, borderRadius: 2, background: i === 3 ? 'transparent' : 'currentColor', outline: i === 3 ? '1.5px solid currentColor' : 'none', outlineOffset: -1.5 }} />)}
        </span>
      </span>
      <span className="text-xl font-bold tracking-tight">MathKX</span>
    </a>
  );
}

export function LanguageSwitch({ size = 'sm' }) {
  const { lang, dispatch, t } = useStore();
  return (
    <ToggleGroup data-size={size} value={lang} onChange={(v) => dispatch({ type: 'lang', lang: v })} aria-label={t('meta.switchLabel')} variant="primary">
      <ToggleGroup.Item value="nb" lang="nb" aria-label="Norsk bokmål">NB</ToggleGroup.Item>
      <ToggleGroup.Item value="en" lang="en" aria-label="English">EN</ToggleGroup.Item>
    </ToggleGroup>
  );
}

function Header({ path }) {
  const { t, profile } = useStore();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const links = [
    { href: '#/library', label: t('nav.library'), active: /^\/(library|domain|topic|lesson|practice|check)/.test(path) },
    { href: '#/about', label: t('nav.about'), active: path.startsWith('/about') },
  ];
  const profileLink = profile
    ? { href: '#/home', label: t('nav.myPage'), active: path.startsWith('/home') || path.startsWith('/settings') }
    : { href: '#/signin', label: t('nav.signIn'), active: path.startsWith('/signin') };
  return (
    <header className="sticky z-20 border-b" style={{ top: 'env(safe-area-inset-top, 0px)', background: 'color-mix(in srgb, var(--ds-color-neutral-background-default) 94%, transparent)', backdropFilter: 'blur(8px)', borderColor: 'var(--ds-color-neutral-border-subtle)' }}>
      <div className="mkx-container flex items-center gap-3 py-2 min-h-16">
        <Logo />
        <nav aria-label={t('nav.main')} className="hidden lg:flex items-center gap-1 ml-6">
          {links.map((l) => (
            <Button key={l.href} variant="tertiary" asChild aria-current={l.active ? 'page' : undefined} className={l.active ? 'underline underline-offset-8 decoration-2' : ''}>
              <a href={l.href}>{l.label}</a>
            </Button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitch />
          <div className="hidden lg:flex items-center gap-2">
            <Button variant={profile ? 'tertiary' : 'secondary'} asChild aria-current={profileLink.active ? 'page' : undefined}>
              <a href={profileLink.href}><PersonCircleIcon aria-hidden="true" fontSize="1.4rem" />{profileLink.label}</a>
            </Button>
            {!profile && <Button asChild><a href="#/profile/new">{t('nav.createProfile')}</a></Button>}
          </div>
          <Button className="lg:hidden" variant="tertiary" icon aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? t('nav.closeMenu') : t('nav.menu')} onClick={() => setOpen((o) => !o)}>
            {open ? <XMarkIcon aria-hidden="true" fontSize="1.6rem" /> : <MenuHamburgerIcon aria-hidden="true" fontSize="1.6rem" />}
          </Button>
        </div>
      </div>
      <nav id="mobile-nav" hidden={!open} aria-label={t('nav.main')} className="lg:hidden border-t" style={{ borderColor: 'var(--ds-color-neutral-border-subtle)' }}>
        <ul className="mkx-container list-none m-0 py-3 flex flex-col gap-1">
          {[{ href: '#/', label: t('nav.home') }, ...links, profileLink].map((l) => (
            <li key={l.href}><Button variant="tertiary" asChild className="w-full justify-start" aria-current={l.active ? 'page' : undefined}><a href={l.href}>{l.label}</a></Button></li>
          ))}
          {!profile && <li className="pt-2"><Button asChild className="w-full"><a href="#/profile/new">{t('nav.createProfile')}</a></Button></li>}
        </ul>
      </nav>
    </header>
  );
}

function Footer() {
  const { t } = useStore();
  return (
    <footer className="mt-16 border-t" style={{ borderColor: 'var(--ds-color-neutral-border-subtle)', background: 'var(--ds-color-neutral-background-tinted)' }}>
      <div className="mkx-container py-8 flex flex-col md:flex-row gap-6 md:items-center justify-between">
        <div className="flex flex-col gap-2">
          <Logo />
          <Paragraph data-size="sm">{t('footer.tagline')} {t('footer.proto')}</Paragraph>
        </div>
        <ul className="list-none m-0 p-0 flex flex-wrap gap-x-6 gap-y-2">
          <li><Link href="#/library">{t('nav.library')}</Link></li>
          <li><Link href="#/about">{t('nav.about')}</Link></li>
          <li><Link href={REPO_URL} target="_blank" rel="noreferrer">GitHub</Link></li>
        </ul>
      </div>
    </footer>
  );
}

function NotFound() {
  return <div className="mkx-container py-12"><h1 tabIndex={-1}>404</h1><Link href="#/">MathKX</Link></div>;
}

export function App() {
  const { path, parts } = useRoute();
  const { t } = useStore();
  const mainRef = useRef(null);
  const first = useRef(true);

  // Move focus to the new page heading on navigation (not on language change).
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    window.scrollTo({ top: 0 });
    const h = mainRef.current?.querySelector('h1');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }, [path]);

  const [a, b] = parts;
  let page;
  switch (a) {
    case undefined: page = <Landing />; break;
    case 'library': page = <Library />; break;
    case 'domain': page = <DomainPage id={b} />; break;
    case 'topic': page = <TopicPage id={b} />; break;
    case 'lesson': page = <LessonPage id={b} />; break;
    case 'practice': page = <PracticePage id={b} />; break;
    case 'check': page = <CheckPage id={b} />; break;
    case 'profile': page = <CreateProfile />; break;
    case 'signin': page = <SignIn />; break;
    case 'recovery': page = <Recovery />; break;
    case 'settings': page = <Settings />; break;
    case 'home': page = <Home />; break;
    case 'about': page = <About />; break;
    default: page = <NotFound />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SkipLink href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>{t('nav.skip')}</SkipLink>
      <section aria-label={t('proto.tag')} className="text-sm py-2" style={{ background: 'var(--ds-color-ochre-surface-tinted)', color: 'var(--ds-color-ochre-text-default)' }}>
        <p className="mkx-container m-0"><strong>{t('proto.tag')}.</strong> {t('proto.banner').replace(/^Prototype:\s*/, '')}</p>
      </section>
      <Header path={path} />
      <main id="main" ref={mainRef} className="flex-1" tabIndex={-1}>{page}</main>
      <Footer />
    </div>
  );
}
