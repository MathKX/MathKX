import { useEffect } from "react";
import type { PracticeApi } from "./api/types";
import { translate } from "./i18n";
import { Link, RouterProvider, matchRoute, useRouter } from "./router";
import { StoreProvider, useStore } from "./state/store";
import type { Storage } from "./state/storage";
import type { PersistedState } from "./state/store";
import { LanguageSwitch } from "./components/LanguageSwitch";
import { LessonListPage } from "./pages/LessonListPage";
import { LessonPage } from "./pages/LessonPage";
import { PracticePage } from "./pages/PracticePage";
import { RecordPage } from "./pages/RecordPage";

function Shell({ api }: { api?: PracticeApi }) {
  const { state } = useStore();
  const { path } = useRouter();
  const lang = state.language;
  // The whole document follows the selected language, so MathML and the header are read in it (specs/003 R2).
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const route = matchRoute(path);
  const lessonHref = state.skillId ? "/lessons/number-bonds-to-ten" : undefined;
  return (
    <>
      <a href="#main" className="mkx-skip">
        {translate(lang, "nav.skip")}
      </a>
      <header className="mkx-container mkx-header">
        <nav aria-label={translate(lang, "nav.app")} className="mkx-nav">
          <Link to="/">{translate(lang, "nav.home")}</Link>
          <Link to="/record">{translate(lang, "nav.record")}</Link>
        </nav>
        <LanguageSwitch />
      </header>
      <main id="main" className="mkx-container" lang={lang} data-testid="app-root">
        {route.name === "lessons" ? <LessonListPage {...(api ? { api } : {})} /> : null}
        {route.name === "lesson" ? <LessonPage id={route.id} {...(api ? { api } : {})} /> : null}
        {route.name === "practice" ? <PracticePage skillId={route.skillId} {...(lessonHref ? { lessonHref } : {})} /> : null}
        {route.name === "record" ? <RecordPage /> : null}
        {route.name === "unknown" ? <LessonListPage {...(api ? { api } : {})} /> : null}
      </main>
    </>
  );
}

export interface AppProps {
  api?: PracticeApi;
  storage?: Storage<PersistedState>;
  initialPath?: string;
}

export function App({ api, storage, initialPath }: AppProps = {}) {
  return (
    <RouterProvider {...(initialPath ? { initialPath } : {})}>
      <StoreProvider {...(api ? { api } : {})} {...(storage ? { storage } : {})}>
        <Shell {...(api ? { api } : {})} />
      </StoreProvider>
    </RouterProvider>
  );
}
