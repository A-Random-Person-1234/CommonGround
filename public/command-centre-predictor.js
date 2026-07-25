export function normalizeCommandPrediction(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLocaleLowerCase("en-GB")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function damerauLevenshtein(left, right) {
  const a = String(left || "");
  const b = String(right || "");
  const rows = Array.from(
    { length: a.length + 1 },
    (_, row) => Array.from({ length: b.length + 1 }, (_, column) => (
      row === 0 ? column : column === 0 ? row : 0
    ))
  );

  for (let row = 1; row <= a.length; row += 1) {
    for (let column = 1; column <= b.length; column += 1) {
      const substitution = a[row - 1] === b[column - 1] ? 0 : 1;
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + substitution
      );
      if (
        row > 1 &&
        column > 1 &&
        a[row - 1] === b[column - 2] &&
        a[row - 2] === b[column - 1]
      ) {
        rows[row][column] = Math.min(rows[row][column], rows[row - 2][column - 2] + 1);
      }
    }
  }

  return rows[a.length][b.length];
}

const viewKeywords = Object.freeze([
  { view: "settings", keyword: "settings" },
  { view: "day", keyword: "day" },
  { view: "week", keyword: "week" },
  { view: "month", keyword: "month" },
  { view: "year", keyword: "year" }
]);

export function matchCommandViewKeyword(value) {
  const text = normalizeCommandPrediction(value);
  const phrase = text
    .replace(/^(?:open|show|go to|switch to|change to)\s+/, "")
    .replace(/\s+view$/, "")
    .trim();
  if (!phrase || phrase.includes(" ")) return null;

  for (const entry of viewKeywords) {
    if (phrase === entry.keyword || (entry.view === "settings" && phrase === "setting")) {
      return { ...entry, match: "exact", corrected: entry.keyword };
    }
  }

  if (
    phrase.length >= 5 &&
    Math.abs(phrase.length - "settings".length) <= 1 &&
    damerauLevenshtein(phrase, "settings") <= 1
  ) {
    return {
      view: "settings",
      keyword: phrase,
      match: "typo",
      corrected: "settings"
    };
  }

  return null;
}

const commandPredictions = Object.freeze([
  { trigger: "settings", command: "settings", label: "Open settings", parseTyped: true },
  { trigger: "open settings", command: "open settings", label: "Open settings", parseTyped: true },
  { trigger: "show settings", command: "show settings", label: "Open settings", parseTyped: true },
  { trigger: "day", command: "day view", label: "Open day view", parseTyped: true },
  { trigger: "day view", command: "day view", label: "Open day view", parseTyped: true },
  { trigger: "week", command: "week view", label: "Open week view", parseTyped: true },
  { trigger: "week view", command: "week view", label: "Open week view", parseTyped: true },
  { trigger: "month", command: "month view", label: "Open month view", parseTyped: true },
  { trigger: "month view", command: "month view", label: "Open month view", parseTyped: true },
  { trigger: "year", command: "year view", label: "Open year view", parseTyped: true },
  { trigger: "year view", command: "year view", label: "Open year view", parseTyped: true },
  { trigger: "google", command: "connect Google Calendar", label: "Connect Google Calendar", parseTyped: false },
  { trigger: "google calendar", command: "connect Google Calendar", label: "Connect Google Calendar", parseTyped: false },
  { trigger: "connect google", command: "connect Google Calendar", label: "Connect Google Calendar", parseTyped: true },
  { trigger: "sync google", command: "sync Google Calendar", label: "Connect Google Calendar", parseTyped: true },
  { trigger: "create", command: "create an event", label: "Create an event", parseTyped: true },
  { trigger: "create event", command: "create an event", label: "Create an event", parseTyped: true },
  { trigger: "new event", command: "create an event", label: "Create an event", parseTyped: false },
  { trigger: "find time", command: "find a time for everyone", label: "Find shared time", parseTyped: true },
  { trigger: "find a time", command: "find a time for everyone", label: "Find shared time", parseTyped: true },
  { trigger: "free time", command: "find a time for everyone", label: "Find shared time", parseTyped: false },
  { trigger: "availability", command: "show availability for everyone next week", label: "Show availability", parseTyped: false }
]);

export function predictCommand(value) {
  const raw = String(value || "");
  const text = normalizeCommandPrediction(raw);
  if (text.length < 3) return null;

  const candidates = [];
  for (const entry of commandPredictions) {
    if (text === entry.trigger) {
      candidates.push({ ...entry, kind: "exact", rank: 0 });
      continue;
    }
    if (entry.trigger.startsWith(text)) {
      candidates.push({
        ...entry,
        kind: "prefix",
        rank: 100 + entry.trigger.length - text.length
      });
      continue;
    }
    if (
      text.length >= 5 &&
      Math.abs(text.length - entry.trigger.length) <= 1 &&
      damerauLevenshtein(text, entry.trigger) <= 1
    ) {
      candidates.push({ ...entry, kind: "typo", rank: 200 });
    }
  }

  candidates.sort((left, right) => (
    left.rank - right.rank ||
    left.command.length - right.command.length ||
    left.trigger.localeCompare(right.trigger)
  ));
  const match = candidates[0];
  if (!match) return null;

  const rawComparable = raw.trim().toLocaleLowerCase("en-GB");
  const commandComparable = match.command.toLocaleLowerCase("en-GB");
  const inlineSuffix = (
    match.kind !== "typo" &&
    raw === raw.trim() &&
    rawComparable === text &&
    commandComparable.startsWith(rawComparable) &&
    match.command.length > raw.trim().length
  )
    ? match.command.slice(raw.trim().length)
    : "";

  return {
    kind: match.kind,
    label: match.label,
    acceptedCommand: match.command,
    inlineSuffix,
    corrected: match.kind === "typo",
    parseTyped: match.parseTyped === true
  };
}
