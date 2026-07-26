const predictionWordCorrections = Object.freeze({
  addd: "add",
  aftr: "after",
  availabilty: "availability",
  availablity: "availability",
  availibility: "availability",
  b4: "before",
  cal: "calendar",
  calander: "calendar",
  caledar: "calendar",
  calender: "calendar",
  calndr: "calendar",
  conect: "connect",
  connnect: "connect",
  creat: "create",
  craete: "create",
  delet: "delete",
  delte: "delete",
  dupe: "duplicate",
  duplicte: "duplicate",
  evemt: "event",
  eventt: "event",
  evnt: "event",
  evrybody: "everybody",
  evryone: "everyone",
  everyoen: "everyone",
  fri: "friday",
  fnd: "find",
  googl: "google",
  gcal: "google calendar",
  hrs: "hours",
  hr: "hour",
  invitee: "invite",
  mins: "minutes",
  min: "minute",
  mon: "monday",
  mov: "move",
  mtg: "meeting",
  mting: "meeting",
  nxt: "next",
  opn: "open",
  pls: "please",
  plz: "please",
  ppl: "people",
  resched: "reschedule",
  reschedual: "reschedule",
  rescedule: "reschedule",
  sched: "schedule",
  schedual: "schedule",
  seting: "settings",
  setings: "settings",
  settngs: "settings",
  shw: "show",
  shcedule: "schedule",
  tmr: "tomorrow",
  tmrw: "tomorrow",
  tomo: "tomorrow",
  tommorow: "tomorrow",
  tomorow: "tomorrow",
  tue: "tuesday",
  tues: "tuesday",
  thu: "thursday",
  thur: "thursday",
  thurs: "thursday",
  thrusday: "thursday",
  tonite: "tonight",
  updte: "update",
  wensday: "wednesday",
  wed: "wednesday",
  weds: "wednesday",
  wk: "week",
  wks: "weeks",
  wth: "with",
  yr: "year"
});

const predictionContractions = Object.freeze([
  [/\bw\/\b/gi, "with"],
  [/\bwhat['’]s\b/gi, "what is"],
  [/\bwhen['’]s\b/gi, "when is"],
  [/\bwhen['’]re\b/gi, "when are"],
  [/\bwhere['’]s\b/gi, "where is"],
  [/\bwho['’]s\b/gi, "who is"],
  [/\blet['’]s\b/gi, "let us"],
  [/\bi['’]m\b/gi, "i am"],
  [/\bwe['’]re\b/gi, "we are"],
  [/\bthey['’]re\b/gi, "they are"],
  [/\bcan['’]t\b/gi, "cannot"],
  [/\bcouldn['’]t\b/gi, "could not"],
  [/\bdon['’]t\b/gi, "do not"],
  [/\bdoesn['’]t\b/gi, "does not"],
  [/\bisn['’]t\b/gi, "is not"],
  [/\baren['’]t\b/gi, "are not"],
  [/\bwon['’]t\b/gi, "will not"]
]);

function expandPredictionContractions(value) {
  return predictionContractions.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    String(value || "")
  );
}

export function normalizeCommandPrediction(value, { correctVocabulary = false } = {}) {
  const normalized = expandPredictionContractions(value)
    .normalize("NFKC")
    .toLocaleLowerCase("en-GB")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  if (!correctVocabulary || !normalized) return normalized;
  return normalized
    .split(" ")
    .flatMap((word) => String(predictionWordCorrections[word] || word).split(" "))
    .join(" ");
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
  const text = normalizeCommandPrediction(value, { correctVocabulary: true });
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
  { trigger: "connect google calendar", command: "connect Google Calendar", label: "Connect Google Calendar", parseTyped: true },
  { trigger: "sync google", command: "sync Google Calendar", label: "Connect Google Calendar", parseTyped: true },
  { trigger: "sync google calendar", command: "sync Google Calendar", label: "Connect Google Calendar", parseTyped: true },
  { trigger: "create", command: "create an event", label: "Create an event", parseTyped: true },
  { trigger: "create event", command: "create an event", label: "Create an event", parseTyped: true },
  { trigger: "new event", command: "create an event", label: "Create an event", parseTyped: false },
  { trigger: "find time", command: "find a time for everyone", label: "Find shared time", parseTyped: true },
  { trigger: "find a time", command: "find a time for everyone", label: "Find shared time", parseTyped: true },
  { trigger: "free time", command: "find a time for everyone", label: "Find shared time", parseTyped: false },
  { trigger: "availability", command: "show availability for everyone next week", label: "Show availability", parseTyped: false }
  ,
  { trigger: "move event", command: "move event", label: "Move an event", parseTyped: true },
  { trigger: "reschedule event", command: "reschedule event", label: "Move an event", parseTyped: true },
  { trigger: "rename event", command: "rename event", label: "Rename an event", parseTyped: true },
  { trigger: "update event", command: "update event", label: "Update an event", parseTyped: true },
  { trigger: "delete event", command: "delete event", label: "Delete an event", parseTyped: true },
  { trigger: "remove event", command: "delete event", label: "Delete an event", parseTyped: true },
  { trigger: "duplicate event", command: "duplicate event", label: "Duplicate an event", parseTyped: true },
  { trigger: "copy event", command: "duplicate event", label: "Duplicate an event", parseTyped: true },
  { trigger: "tomorrow", command: "show tomorrow", label: "Open tomorrow", parseTyped: true },
  { trigger: "today", command: "show today", label: "Open today", parseTyped: true }
]);

function contextualPredictions(context = {}) {
  const entries = [];
  const seenMembers = new Set();
  const members = context.members || [];
  const firstNameCounts = new Map();
  for (const member of members) {
    const firstName = normalizeCommandPrediction(String(member?.displayName || "").trim().split(/\s+/)[0]);
    if (firstName) firstNameCounts.set(firstName, (firstNameCounts.get(firstName) || 0) + 1);
  }
  for (const member of members) {
    const displayName = String(member?.displayName || "").trim();
    if (!displayName) continue;
    const firstName = displayName.split(/\s+/)[0];
    const names = [
      displayName,
      ...(firstNameCounts.get(normalizeCommandPrediction(firstName)) === 1 ? [firstName] : [])
    ];
    for (const name of names) {
      const normalizedName = normalizeCommandPrediction(name);
      if (!normalizedName || seenMembers.has(normalizedName)) continue;
      seenMembers.add(normalizedName);
      entries.push(
        {
          trigger: `find time with ${normalizedName}`,
          command: `find a time with ${name}`,
          label: `Find time with ${name}`,
          parseTyped: true
        },
        {
          trigger: `show availability for ${normalizedName}`,
          command: `show availability for ${name}`,
          label: `Show ${name}'s availability`,
          parseTyped: true
        },
        {
          trigger: `create event with ${normalizedName}`,
          command: `create an event with ${name}`,
          label: `Create an event with ${name}`,
          parseTyped: true
        }
      );
    }
  }

  for (const event of (context.events || []).slice(0, 80)) {
    const title = String(event?.title || "").trim();
    const normalizedTitle = normalizeCommandPrediction(title);
    if (!normalizedTitle || normalizedTitle === "no title") continue;
    entries.push(
      {
        trigger: `open ${normalizedTitle}`,
        command: `open ${title}`,
        label: `Open ${title}`,
        parseTyped: true
      },
      {
        trigger: `move ${normalizedTitle}`,
        command: `move ${title}`,
        label: `Move ${title}`,
        parseTyped: true
      },
      {
        trigger: `rename ${normalizedTitle}`,
        command: `rename ${title}`,
        label: `Rename ${title}`,
        parseTyped: true
      },
      {
        trigger: `delete ${normalizedTitle}`,
        command: `delete ${title}`,
        label: `Delete ${title}`,
        parseTyped: true
      },
      {
        trigger: `duplicate ${normalizedTitle}`,
        command: `duplicate ${title}`,
        label: `Duplicate ${title}`,
        parseTyped: true
      }
    );
  }
  return entries;
}

function predictionTypoDistance(text, trigger) {
  const length = Math.max(text.length, trigger.length);
  if (length < 5 || Math.abs(text.length - trigger.length) > 3) return null;
  const limit = length >= 24 ? 3 : length >= 12 ? 2 : 1;
  const distance = damerauLevenshtein(text, trigger);
  return distance <= limit ? distance : null;
}

function predictionComparableText(value) {
  return normalizeCommandPrediction(value, { correctVocabulary: true })
    .replace(/^(?:please\s+|can you\s+|could you\s+|would you\s+|will you\s+|commonground\s+|common ground\s+)+/, "")
    .trim();
}

export function predictCommand(value, context = {}) {
  const raw = String(value || "");
  const text = normalizeCommandPrediction(raw);
  const correctedText = predictionComparableText(raw);
  if (text.length < 3) return null;

  const candidates = [];
  const predictions = [...commandPredictions, ...contextualPredictions(context)];
  for (const entry of predictions) {
    const trigger = normalizeCommandPrediction(entry.trigger);
    if (text === trigger) {
      candidates.push({ ...entry, trigger, kind: "exact", rank: 0 });
      continue;
    }
    if (correctedText === trigger && correctedText !== text) {
      candidates.push({ ...entry, trigger, kind: "typo", rank: 20 });
      continue;
    }
    if (trigger.startsWith(correctedText)) {
      candidates.push({
        ...entry,
        trigger,
        kind: correctedText === text ? "prefix" : "corrected-prefix",
        rank: 100 + trigger.length - correctedText.length
      });
      continue;
    }
    const distance = predictionTypoDistance(text, trigger);
    if (distance !== null) {
      candidates.push({ ...entry, trigger, kind: "typo", rank: 200 + distance });
    }
  }

  candidates.sort((left, right) => (
    left.rank - right.rank ||
    left.command.length - right.command.length ||
    left.trigger.localeCompare(right.trigger)
  ));
  const match = candidates[0];
  if (!match) return null;
  if (
    ["prefix", "corrected-prefix"].includes(match.kind) &&
    candidates.some((candidate, index) => (
      index > 0 &&
      candidate.rank === match.rank &&
      candidate.kind === match.kind &&
      candidate.trigger.startsWith(correctedText) &&
      normalizeCommandPrediction(candidate.command) !== normalizeCommandPrediction(match.command)
    ))
  ) {
    return null;
  }

  const rawComparable = raw.trim().toLocaleLowerCase("en-GB");
  const commandComparable = match.command.toLocaleLowerCase("en-GB");
  const inlineSuffix = (
    match.kind === "prefix" &&
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
    corrected: match.kind === "typo" || match.kind === "corrected-prefix",
    parseTyped: match.parseTyped === true
  };
}
