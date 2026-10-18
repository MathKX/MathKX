// Strings added or changed after the round-03 reviews (Claude and Codex, 2026-10-18).
// Deep-merged over i18n.js and i18n-iteration2.js.
export const nb3 = {
  error: {
    title: 'Noe gikk galt på denne siden',
    body: 'Siden kunne ikke vises. Arbeidet ditt er lagret, og resten av MathKX fungerer. Prøv en annen side, eller last inn siden på nytt.',
    home: 'Til forsiden',
  },
  topic: { startCheck: 'Sjekk forståelsen min' },
  support: {
    visualBefore: 'Visuell hjelp før svar',
    visualAfter: 'Visuell hjelp etter svar',
    lessonBefore: 'Leste i leksjonen før svar',
    explainPartBefore: 'Deler av forklaringen før svar',
    reveal_explanation: 'Svaret vist i forklaringen',
    reveal_counting: 'Svaret vist ved å telle alle',
    reveal_lesson: 'Svaret vist i leksjonen',
    explainAfter: 'Forklaring åpnet etter svar',
  },
  outcome: {
    correctWithHelp: 'Riktig med hjelp',
    correctAfterExplanation: 'Svart etter at svaret ble vist',
  },
  outcomeDef: {
    correctFirst: 'Det første svaret var riktig, og ingen hjelp, forklaring eller leksjon var åpnet fra oppgaven før det. Hjelp utenfor MathKX kan vi ikke se.',
    correctWithHelp: 'Riktig svar etter hjelp som ikke viste svaret, for eksempel de første stegene i forklaringen eller leksjonen. Merkene viser hvilken hjelp.',
    correctAfterExplanation: 'Svaret ble vist før det riktige svaret: i forklaringen, ved å telle alle brikkene eller i leksjonen. Merket viser hvor.',
    unfinished: 'Oppgaven ble vist, men økten ble avsluttet eller forlatt før du svarte. Du kan fortsette den fra Min læring.',
  },
  ex: {
    revealTitle: 'Forklaringen ender med svaret',
    revealBody: 'De første stegene viser metoden. Svaret kommer i steg {n} av {total}. Hvis du kommer dit før du har svart, blir oppgaven registrert som «svart etter at svaret ble vist».',
    revealHelpNote: 'Visuell hjelp viser regnestykket uten å gi svaret.',
    revealHelpNoteCount: 'Visuell hjelp viser regnestykket. Den viser ikke svaret, med mindre du teller helt til siste brikke.',
    revealYes: 'Åpne forklaringen',
    revealedNote: 'Du har åpnet forklaringen før du svarte. Du kan fortsatt skrive inn svaret.',
    nextReveals: 'Neste steg viser svaret.',
    thisReveals: 'Dette steget viser svaret.',
    lessonRevealTitle: 'Leksjonen viser svaret på {q}',
    lessonRevealBody: 'Leksjonen går gjennom akkurat denne oppgaven, med svaret. Hvis du leser den nå, blir oppgaven registrert som «svart etter at svaret ble vist». Arbeidet ditt er lagret, og du kommer tilbake hit.',
    lessonRevealYes: 'Åpne leksjonen (viser svaret)',
    outcome: {
      correctWithHelp: 'Riktig. Du brukte hjelp underveis – det er en vanlig del av å lære.',
      revealed_explanation: 'Du svarte etter at forklaringen viste svaret. Prøv gjerne en lignende oppgave på egen hånd etterpå.',
      revealed_counting: 'Du svarte etter at tellingen viste hvor mange det er til sammen. Prøv gjerne en lignende oppgave uten å telle alle.',
      revealed_lesson: 'Du svarte etter at leksjonen viste svaret. Prøv gjerne en lignende oppgave på egen hånd etterpå.',
    },
  },
  help: {
    countRevealNote: 'Teller du helt til siste brikke, ser du hvor mange det er til sammen. Da blir det registrert som at svaret ble vist.',
    countNextReveals: 'Neste brikke er den siste. Teller du den, ser du svaret.',
    countDoneNote: 'Du har talt alle, så tellingen viser hvor mange det er til sammen. Svarer du nå, blir det registrert som «svart etter at svaret ble vist».',
    countDoneAfter: 'Du har talt alle brikkene.',
    inPlaceOfX: 'i stedet for x',
  },
  practice: {
    resumedTag: 'fortsatt fra en tidligere økt',
    resumedNotice: 'Du fortsetter {q} der du slapp. Det du hadde skrevet og hjelpen du hadde brukt, er tatt med.',
    droppedPending: '«Flere slike oppgaver» beholder «{variant}», så endringen til «{dropped}» ble ikke brukt.',
    sameReplaces: 'Beholder {variant} – erstatter endringen',
    finish: 'Avslutt økten',
    finishNote: 'Du får en oppsummering. Du kan alltid starte en ny økt.',
    finishNoteOpen: 'Du har ikke svart på {q}. Den blir registrert som ikke fullført, og du kan fortsette den senere fra Min læring.',
    activeChoiceNote: 'Lenken du fulgte, ba om en annen variant. Starter du ny, blir den pågående økten avsluttet og får en oppsummering.',
    replacedNotice: 'Den forrige økten er avsluttet.',
    replacedLink: 'Se oppsummeringen av den',
  },
  session: {
    lead: 'Du fikk {shown} oppgaver: {answered} besvart, {skipped} hoppet over og {unfinished} ikke fullført.',
    solved: 'Du fant riktig svar på {n} av dem før svaret ble vist.',
    solved1: 'Du fant riktig svar på 1 av dem før svaret ble vist.',
    afterReveal: '{n} ble besvart etter at svaret ble vist.',
    replacedNote: 'Denne økten ble avsluttet fordi du startet en ny med en annen variant.',
    resumeTitle: 'Fortsett der du slapp',
    resumeTyped: 'Du hadde skrevet «{a}» på {q}, men ikke sjekket svaret.',
    resumeOpen: 'Du har ikke svart på {q} ennå.',
    resumeBtn: 'Fortsett med {q}',
    later: 'Fremgangen er lagret. Du finner økten igjen under Min læring.',
  },
  progress: {
    invalid1: '1 svar kunne ikke leses',
    count: {
      correctWithHelp: '{n} riktig med annen hjelp', correctAfterExplanation: '{n} besvart etter at svaret ble vist',
      guest: '{n} gjort som gjest før du logget inn',
    },
    endedImported: 'lagt til fra gjestearbeid', endedReplaced: 'avsluttet da en ny økt startet',
  },
  check: {
    supportedTag: 'øving med hjelp i sjekk',
    skipLast: 'Hopp over og se oppsummeringen',
    lastSummary: 'Se oppsummeringen av forrige sjekk',
  },
  home: {
    fromCheckSupported: 'i sjekk, etter bytte til øving med hjelp',
    cont: {
      resumeTyped: '{q} fra økten du avsluttet. Du hadde skrevet «{a}», men ikke sjekket svaret.',
      resumeOpen: '{q} fra økten du avsluttet. Ikke besvart ennå.',
    },
  },
  suggest: {
    reason: {
      correctAfterExplanation: 'Du svarte på en oppgave med {variant} etter at svaret ble vist. En lignende oppgave lar deg prøve metoden selv.',
    },
  },
};

export const en3 = {
  error: {
    title: 'Something went wrong on this page',
    body: 'The page could not be shown. Your work is saved, and the rest of MathKX still works. Try another page, or reload this one.',
    home: 'Go to the front page',
  },
  topic: { startCheck: 'Check my understanding' },
  support: {
    visualBefore: 'Visual help before answering',
    visualAfter: 'Visual help after answering',
    lessonBefore: 'Read the lesson before answering',
    explainPartBefore: 'Part of the explanation before answering',
    reveal_explanation: 'Answer shown in the explanation',
    reveal_counting: 'Answer shown by counting all',
    reveal_lesson: 'Answer shown in the lesson',
    explainAfter: 'Explanation opened after answering',
  },
  outcome: {
    correctWithHelp: 'Correct with help',
    correctAfterExplanation: 'Answered after the answer was shown',
  },
  outcomeDef: {
    correctFirst: 'The first answer was correct, and no help, explanation or lesson had been opened from the exercise before it. Help outside MathKX is not something we can see.',
    correctWithHelp: 'A correct answer after help that did not show the answer, such as the first steps of the explanation or the lesson. The tags show which help.',
    correctAfterExplanation: 'The answer was shown before the correct answer: in the explanation, by counting all the counters, or in the lesson. The tag shows where.',
    unfinished: 'The exercise was shown, but the session was finished or left before you answered. You can continue it from My learning.',
  },
  ex: {
    revealTitle: 'The explanation ends with the answer',
    revealBody: 'The first steps show the method. The answer appears in step {n} of {total}. If you reach it before answering, the exercise is recorded as “answered after the answer was shown”.',
    revealHelpNote: 'Visual help shows the problem without giving the answer.',
    revealHelpNoteCount: 'Visual help shows the problem. It does not show the answer unless you count all the way to the last counter.',
    revealYes: 'Open the explanation',
    revealedNote: 'You opened the explanation before answering. You can still enter the answer.',
    nextReveals: 'The next step shows the answer.',
    thisReveals: 'This step shows the answer.',
    lessonRevealTitle: 'The lesson shows the answer to {q}',
    lessonRevealBody: 'The lesson works through this exact exercise, including the answer. If you read it now, the exercise is recorded as “answered after the answer was shown”. Your work is saved, and you can come back here.',
    lessonRevealYes: 'Open the lesson (shows the answer)',
    outcome: {
      correctWithHelp: 'Correct. You used help along the way, which is an ordinary part of learning.',
      revealed_explanation: 'You answered after the explanation showed the answer. Try a similar exercise on your own afterwards if you like.',
      revealed_counting: 'You answered after counting showed how many there are altogether. Try a similar exercise without counting them all if you like.',
      revealed_lesson: 'You answered after the lesson showed the answer. Try a similar exercise on your own afterwards if you like.',
    },
  },
  help: {
    countRevealNote: 'If you count all the way to the last counter, you will see how many there are altogether. That is recorded as the answer being shown.',
    countNextReveals: 'The next counter is the last one. Counting it shows the answer.',
    countDoneNote: 'You have counted them all, so the count shows how many there are altogether. If you answer now, it is recorded as “answered after the answer was shown”.',
    countDoneAfter: 'You have counted all the counters.',
    inPlaceOfX: 'in place of x',
  },
  practice: {
    resumedTag: 'continued from an earlier session',
    resumedNotice: 'You are continuing {q} where you left off. What you had typed and the help you had used are kept.',
    droppedPending: '“More like this” keeps “{variant}”, so the change to “{dropped}” was not used.',
    sameReplaces: 'Keeps {variant} – replaces your change',
    finish: 'Finish this session',
    finishNote: 'You will see a summary. You can always start a new session.',
    finishNoteOpen: 'You haven’t answered {q}. It is recorded as unfinished, and you can continue it later from My learning.',
    activeChoiceNote: 'The link you followed asked for a different variation. Starting a new one finishes the current session and gives it a summary.',
    replacedNotice: 'Your previous session has been finished.',
    replacedLink: 'See its summary',
  },
  session: {
    lead: 'You had {shown} exercises: {answered} answered, {skipped} skipped and {unfinished} unfinished.',
    solved: 'You found the correct answer to {n} of them before the answer was shown.',
    solved1: 'You found the correct answer to 1 of them before the answer was shown.',
    afterReveal: '{n} answered after the answer was shown.',
    replacedNote: 'This session was finished because you started a new one with a different variation.',
    resumeTitle: 'Continue where you left off',
    resumeTyped: 'You had typed “{a}” for {q} but not checked it.',
    resumeOpen: 'You haven’t answered {q} yet.',
    resumeBtn: 'Continue with {q}',
    later: 'Your progress is saved. You will find this session under My learning.',
  },
  progress: {
    invalid1: '1 answer could not be read',
    count: {
      correctWithHelp: '{n} correct with other help', correctAfterExplanation: '{n} answered after the answer was shown',
      guest: '{n} done as a guest before you signed in',
    },
    endedImported: 'added from guest work', endedReplaced: 'finished when a new session started',
  },
  check: {
    supportedTag: 'supported practice in a check',
    skipLast: 'Skip and see the summary',
    lastSummary: 'See the summary of your last check',
  },
  home: {
    fromCheckSupported: 'in a check, after switching to supported practice',
    cont: {
      resumeTyped: '{q} from the session you finished. You had typed “{a}” but not checked it.',
      resumeOpen: '{q} from the session you finished. Not answered yet.',
    },
  },
  suggest: {
    reason: {
      correctAfterExplanation: 'You answered an exercise in {variant} after the answer was shown. A similar one lets you try the method yourself.',
    },
  },
};

// Added after the Gemini round-03 review.
const nb4 = {
  support: {
    visualBefore: 'Visuell hjelp underveis',
    visualAfter: 'Visuell hjelp etter riktig svar',
    lessonBefore: 'Leste i leksjonen underveis',
    explainPartBefore: 'Deler av forklaringen underveis',
    explainAfter: 'Forklaring åpnet etter riktig svar',
  },
  ex: { revealedNote: 'Du har åpnet forklaringen før du har funnet svaret. Du kan fortsatt skrive det inn.' },
  practice: {
    cleared: 'Neste oppgave blir fortsatt «{variant}». Endringen er fjernet.',
    keepThis: 'Tilbake til {variant}',
  },
  check: {
    explanationsLead: 'Hver oppgave har en forklaring steg for steg. Å se på dem nå endrer ikke resultatet.',
    explanationOf: 'Forklaring av {q}',
    inLesson: 'Les mer i leksjonen: {section}',
  },
  home: { cont: { check: 'Du er på oppgave {i} av {n} i sjekken.' } },
  progress: {
    lessonViewed: 'Leksjonen «{title}» er åpnet ved {n} ulike anledninger',
    lessonViewed1: 'Leksjonen «{title}» er åpnet én gang',
    viewedNote: 'At en leksjon er åpnet, betyr bare at den ble åpnet. Åpninger med mindre enn 30 minutters mellomrom telles som én.',
  },
  deriv: {
    revealTitle: 'Forklaringen viser svaret',
    revealBody: 'Forklaringen regner ut x-verdien du leter etter. Ingenting på denne siden lagres som fremgang.',
  },
  profile: {
    cancelChange: 'Avbryt endringen og behold {email}',
    pendingReplace: '{email} er ikke bekreftet ennå. Til den er bekreftet, brukes fortsatt {old} til gjenoppretting.',
    pendingReplaceExplain: 'Du kan bekrefte senere under Innstillinger. Til da brukes fortsatt {email} til gjenoppretting.',
  },
};

const en4 = {
  support: {
    visualBefore: 'Visual help while solving',
    visualAfter: 'Visual help after the correct answer',
    lessonBefore: 'Read the lesson while solving',
    explainPartBefore: 'Part of the explanation while solving',
    explainAfter: 'Explanation opened after the correct answer',
  },
  ex: { revealedNote: 'You opened the explanation before finding the answer. You can still enter it.' },
  practice: {
    cleared: 'The next exercise stays “{variant}”. The change has been removed.',
    keepThis: 'Back to {variant}',
  },
  check: {
    explanationsLead: 'Every exercise has a step-by-step explanation. Looking at them now does not change the result.',
    explanationOf: 'Explanation of {q}',
    inLesson: 'Read more in the lesson: {section}',
  },
  home: { cont: { check: 'You are on exercise {i} of {n} in the check.' } },
  progress: {
    lessonViewed: 'The lesson “{title}” was opened on {n} separate occasions',
    lessonViewed1: 'The lesson “{title}” was opened once',
    viewedNote: 'An opened lesson only means it was opened. Opens less than 30 minutes apart count as one.',
  },
  deriv: {
    revealTitle: 'The explanation shows the answer',
    revealBody: 'The explanation works out the x-value you are looking for. Nothing on this page is saved as progress.',
  },
  profile: {
    cancelChange: 'Cancel the change and keep {email}',
    pendingReplace: '{email} is not confirmed yet. Until it is, {old} is still used for recovery.',
    pendingReplaceExplain: 'You can confirm later in Settings. Until then, {email} is still used for recovery.',
  },
};

const merge = (a, b) => { const o = { ...a }; for (const [k, v] of Object.entries(b)) o[k] = v && typeof v === 'object' && typeof a[k] === 'object' ? merge(a[k], v) : v; return o; };
export const nb3x = merge(nb3, nb4);
export const en3x = merge(en3, en4);
