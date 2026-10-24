import { LANGS, LANGUAGE_NAMES, translate, type Lang } from "../i18n";
import { useStore } from "../state/store";

export function LanguageSwitch() {
  const { state, setLanguage } = useStore();
  return (
    <div className="mkx-language" role="group" aria-label={translate(state.language, "nav.language")}>
      {LANGS.map((lang: Lang) => (
        <button
          key={lang}
          type="button"
          lang={lang}
          className="mkx-target mkx-language__button"
          aria-pressed={state.language === lang}
          onClick={() => setLanguage(lang)}
          data-testid={`lang-${lang}`}
        >
          {LANGUAGE_NAMES[lang]}
        </button>
      ))}
    </div>
  );
}
