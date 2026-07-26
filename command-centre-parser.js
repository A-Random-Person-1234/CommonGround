import {
  addDateKeyDays,
  commandTimeWindows,
  dateAtMinute,
  dateKeyInZone,
  monthNames,
  nextWeekdayDateKey,
  parseClockHour,
  startOfIsoWeekDateKey,
  weekdayNames,
  zonedParts
} from "./command-centre-date-time.js";
import { matchCommandViewKeyword } from "./public/command-centre-predictor.js";

const intentHelp = "CommonGround can currently create events, find shared free time, show availability, move events and navigate the calendar. It can also rename, duplicate and delete room events, manage their participants, open settings, connect Google Calendar and update a valid room code.";

const weekdayAliasGroups = Object.freeze([
  Object.freeze({ weekday: 0, aliases: Object.freeze(["sun", "sunday", "sundays"]) }),
  Object.freeze({ weekday: 1, aliases: Object.freeze(["mon", "monday", "mondays"]) }),
  Object.freeze({ weekday: 2, aliases: Object.freeze(["tue", "tues", "tuesday", "tuesdays"]) }),
  Object.freeze({ weekday: 3, aliases: Object.freeze(["wed", "weds", "wednesday", "wednesdays"]) }),
  Object.freeze({ weekday: 4, aliases: Object.freeze(["thu", "thur", "thurs", "thursday", "thursdays"]) }),
  Object.freeze({ weekday: 5, aliases: Object.freeze(["fri", "friday", "fridays"]) }),
  Object.freeze({ weekday: 6, aliases: Object.freeze(["sat", "saturday", "saturdays"]) })
]);

const commandTokenAliases = new Map(Object.entries({
  // Calendar actions and nouns. This is deliberately an allow-list: arbitrary title
  // words are never spell-corrected.
  addd: "add",
  calandar: "calendar",
  calander: "calendar",
  calender: "calendar",
  calendr: "calendar",
  ceate: "create",
  conect: "connect",
  conncet: "connect",
  connnect: "connect",
  creat: "create",
  craete: "create",
  cretae: "create",
  createe: "create",
  delet: "delete",
  deleete: "delete",
  delele: "delete",
  delte: "delete",
  duplciate: "duplicate",
  duplicte: "duplicate",
  evnt: "event",
  evennt: "event",
  fnd: "find",
  fnid: "find",
  googel: "google",
  gogle: "google",
  googl: "google",
  higlight: "highlight",
  hightlight: "highlight",
  invte: "invite",
  opne: "open",
  remane: "rename",
  renmae: "rename",
  rescedule: "reschedule",
  reshedule: "reschedule",
  schedual: "schedule",
  scheduel: "schedule",
  scedule: "schedule",
  shcedule: "schedule",
  shwo: "show",
  swich: "switch",
  swtich: "switch",
  sycn: "sync",
  udpate: "update",
  // Availability, people and room language.
  availabilty: "availability",
  availablity: "availability",
  avalability: "availability",
  avalaible: "available",
  avaliable: "available",
  availble: "available",
  evrybody: "everybody",
  evryone: "everyone",
  everone: "everyone",
  everyoen: "everyone",
  particpant: "participant",
  particpants: "participants",
  peple: "people",
  ppl: "people",
  cdoe: "code",
  rom: "room",
  // Relative dates, ranges, weekdays and months.
  "2moro": "tomorrow",
  "2morrow": "tomorrow",
  aftr: "after",
  afternon: "afternoon",
  aguust: "august",
  aprl: "april",
  aug: "august",
  dec: "december",
  decemeber: "december",
  feb: "february",
  febuary: "february",
  friady: "friday",
  jan: "january",
  janurary: "january",
  jul: "july",
  jun: "june",
  mar: "march",
  mondy: "monday",
  mornin: "morning",
  mrng: "morning",
  nov: "november",
  novemeber: "november",
  nxt: "next",
  oct: "october",
  octber: "october",
  satdy: "saturday",
  sep: "september",
  sept: "september",
  septemeber: "september",
  sundy: "sunday",
  thrs: "thursday",
  thrusday: "thursday",
  thurday: "thursday",
  thursdy: "thursday",
  tmr: "tomorrow",
  tmrw: "tomorrow",
  tmw: "tomorrow",
  tomo: "tomorrow",
  tommorow: "tomorrow",
  tomorow: "tomorrow",
  tonite: "tonight",
  tueaday: "tuesday",
  tuesdy: "tuesday",
  tusday: "tuesday",
  wedensday: "wednesday",
  wednsday: "wednesday",
  wenesday: "wednesday",
  wek: "week",
  wke: "week",
  wk: "week",
  wks: "weeks",
  // Durations and settings.
  minit: "minute",
  minits: "minutes",
  mins: "minutes",
  hr: "hour",
  hrs: "hours",
  meetng: "meeting",
  mtg: "meeting",
  mnth: "month",
  mths: "months",
  settigns: "settings",
  setings: "settings",
  setitngs: "settings",
  settngs: "settings"
}));

const contractionReplacements = Object.freeze([
  [/\bcan't\b/g, "cannot"],
  [/\bcant\b/g, "cannot"],
  [/\bdon't\b/g, "do not"],
  [/\bdont\b/g, "do not"],
  [/\bdoesn't\b/g, "does not"],
  [/\bdoesnt\b/g, "does not"],
  [/\bdidn't\b/g, "did not"],
  [/\bdidnt\b/g, "did not"],
  [/\bi'm\b/g, "i am"],
  [/\bim\b/g, "i am"],
  [/\bi'd\b/g, "i would"],
  [/\bi'll\b/g, "i will"],
  [/\blet's\b/g, "let us"],
  [/\bwhat's\b/g, "what is"],
  [/\bwhats\b/g, "what is"],
  [/\bwhen's\b/g, "when is"],
  [/\bwhens\b/g, "when is"],
  [/\bwhen're\b/g, "when are"],
  [/\bwho's\b/g, "who is"],
  [/\bwhos\b/g, "who is"],
  [/\bwe're\b/g, "we are"],
  [/\byou're\b/g, "you are"],
  [/\bthey're\b/g, "they are"],
  [/\bwon't\b/g, "will not"],
  [/\bwont\b/g, "will not"]
]);

export function normaliseCommand(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[“”]/g, "\"")
    .replace(/[’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function normaliseMatchDetails(value) {
  let text = normaliseCommand(value)
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .toLocaleLowerCase("en-GB")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "");
  text = text
    .replace(/@(?=\s*\d)/g, " at ")
    .replace(/\ba\.?\s*m\.?\b/g, "am")
    .replace(/\bp\.?\s*m\.?\b/g, "pm")
    .replace(/\bw\/(?=\s|$)/g, "with")
    .replace(/\bw\/o\b/g, "without")
    .replace(/\b(?:pls|plz)\b/g, "please");
  for (const [pattern, replacement] of contractionReplacements) {
    text = text.replace(pattern, replacement);
  }
  const sourceTokens = text
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const corrections = [];
  const tokens = sourceTokens.map((token) => {
    const replacement = commandTokenAliases.get(token) || token;
    if (replacement !== token) corrections.push({ from: token, to: replacement });
    return replacement;
  });
  text = tokens.join(" ")
    .replace(/\bevery one\b/g, "everyone")
    .replace(/\s+/g, " ")
    .trim();
  return { text, corrections };
}

function normaliseMatch(value) {
  return normaliseMatchDetails(value).text;
}

export function normaliseCommandLanguage(value) {
  return normaliseMatchDetails(value);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function levenshtein(left, right) {
  const a = String(left || "");
  const b = String(right || "");
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const held = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        previous + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      previous = held;
    }
  }
  return row[b.length];
}

function participantAliases(member) {
  const displayName = normaliseMatch(member.displayName);
  const firstName = displayName.split(" ")[0] || "";
  const aliases = new Set([displayName, firstName, ...(member.aliases || []).map(normaliseMatch)]);
  return [...aliases].filter(Boolean);
}

function weekdayAliasPattern(group) {
  return group.aliases.map(escapeRegExp).join("|");
}

function requestedAvailabilityWeekdays(command) {
  const text = normaliseMatch(command);
  const requested = new Set();
  if (/\bweekdays\b/.test(text)) [1, 2, 3, 4, 5].forEach((weekday) => requested.add(weekday));
  if (/\bweekends\b/.test(text)) [0, 6].forEach((weekday) => requested.add(weekday));
  for (const group of weekdayAliasGroups) {
    if (new RegExp(`\\b(?:${weekdayAliasPattern(group)})\\b`).test(text)) {
      requested.add(group.weekday);
    }
  }
  return [...requested].sort((left, right) => left - right);
}

function recurringAvailabilityWeekdaysRequested(text, allowedWeekdays) {
  if (allowedWeekdays.length > 1) return true;
  if (/\b(?:weekdays|weekends)\b/.test(text)) return true;
  if (!allowedWeekdays.length) return false;
  return /\b(?:any|every)\b/.test(text) ||
    weekdayAliasGroups.some((group) => (
      allowedWeekdays.includes(group.weekday) &&
      group.aliases.some((alias) => alias.endsWith("s") && new RegExp(`\\b${escapeRegExp(alias)}\\b`).test(text))
    ));
}

export function resolveParticipants(command, members = [], currentParticipantId = null) {
  const text = normaliseMatch(command);
  const allRequested = /\b(?:everyone(?:\s+in\s+(?:the\s+)?room)?|everybody|whole room|entire room|the team|whole group|all of us|all(?:\s+room)?\s+(?:members|participants|people))\b/.test(text) ||
    /\b(?:when are|are)\s+we\s+(?:all\s+)?(?:free|available)\b/.test(text) ||
    /\b(?:time|slot)\s+for\s+us\b/.test(text);
  const meRequested = /\b(me|myself|i)\b/.test(text);
  const resolvedIds = new Set();
  const ambiguities = [];
  const unmatched = [];
  const memberAliases = members.map((member) => ({
    member,
    aliases: participantAliases(member)
  }));

  if (allRequested) members.forEach((member) => resolvedIds.add(member.id));
  if (meRequested && currentParticipantId) resolvedIds.add(currentParticipantId);

  for (const { member, aliases } of memberAliases) {
    if (aliases.some((alias) => new RegExp(`(?:^| )${escapeRegExp(alias)}(?: |$)`).test(text))) {
      resolvedIds.add(member.id);
    }
  }

  const firstNameGroups = new Map();
  for (const { member } of memberAliases) {
    const first = normaliseMatch(member.displayName).split(" ")[0];
    if (!first) continue;
    const matches = firstNameGroups.get(first) || [];
    matches.push(member);
    firstNameGroups.set(first, matches);
  }
  for (const [firstName, matches] of firstNameGroups.entries()) {
    if (matches.length < 2 || !new RegExp(`(?:^| )${escapeRegExp(firstName)}(?: |$)`).test(text)) continue;
    matches.forEach((member) => resolvedIds.delete(member.id));
    ambiguities.push({
      type: "participant",
      token: firstName,
      message: `Which ${matches[0].displayName.split(" ")[0]} did you mean?`,
      options: matches.map((member) => ({ id: member.id, label: member.displayName }))
    });
  }

  if (allRequested && /\b(?:except|excluding|but not)\b/.test(text)) {
    ambiguities.push({
      type: "participant_exclusion",
      token: "except",
      message: "Choose individual room members when excluding someone from an availability search.",
      options: []
    });
  }

  const weekdayBoundary = weekdayAliasGroups
    .flatMap((group) => group.aliases)
    .map(escapeRegExp)
    .join("|");
  const possibleNameMatches = [
    ...text.matchAll(new RegExp(
      `\\b(?:with|for)\\s+([a-z][a-z0-9 ]{1,80}?)(?=\\s+(?:today|tomorrow|on|this|next|at|from|for|after|before|any|every|morning|afternoon|evening|weekend|week|month|${weekdayBoundary})\\b|$)`,
      "g"
    ))
  ];
  for (const match of allRequested ? [] : possibleNameMatches) {
    const possibleNames = match[1]
      .split(/\s+and\s+|,\s*/)
      .map((entry) => entry.replace(/\b(me|myself)\b/g, "").trim())
      .filter(Boolean);
    for (const possibleName of possibleNames) {
      if (
        /^(?:(?:an?|one|two|three|four|five|six|seven|eight|\d+(?:\.\d+)?)\s+hours?|(?:half|quarter)\s+an?\s+hour|\d+\s+minutes?)\b/.test(possibleName) ||
        /^(?:a\s+)?half\b/.test(possibleName)
      ) {
        continue;
      }
      const alreadyMatched = memberAliases.some(({ member, aliases }) => (
        resolvedIds.has(member.id) && aliases.some((alias) => possibleName.includes(alias))
      ));
      if (alreadyMatched) continue;
      const token = possibleName.split(" ")[0];
      if (!token || ["hour", "hours", "minute", "minutes", "mins", "time"].includes(token)) continue;
      const fuzzy = memberAliases
        .map(({ member, aliases }) => ({
          member,
          score: Math.min(...aliases.map((alias) => levenshtein(token, alias.split(" ")[0])))
        }))
        .filter((entry) => entry.score <= (token.length >= 6 ? 2 : 1))
        .sort((left, right) => left.score - right.score);
      if (fuzzy.length === 1 || (fuzzy[0] && fuzzy[1] && fuzzy[0].score < fuzzy[1].score)) {
        resolvedIds.add(fuzzy[0].member.id);
      } else if (fuzzy.length > 1 && fuzzy[0].score === fuzzy[1].score) {
        ambiguities.push({
          type: "participant",
          token,
          message: `Which person did you mean by “${possibleName}”?`,
          options: fuzzy.slice(0, 4).map((entry) => ({
            id: entry.member.id,
            label: entry.member.displayName
          }))
        });
      } else {
        unmatched.push(possibleName);
      }
    }
  }

  return {
    participantIds: [...resolvedIds],
    ambiguities,
    unmatched,
    allRequested,
    meRequested
  };
}

export function parseDuration(command) {
  const text = normaliseMatch(command);
  if (/\b(?:three quarters?|three fourths?) (?:of )?an? hour\b/.test(text)) return 45;
  if (/\b(?:a )?quarter (?:of )?an? hour\b/.test(text)) return 15;
  if (/\bhalf an? hour\b/.test(text)) return 30;
  if (/\b(?:an?|one) hour and (?:a )?half\b/.test(text)) return 90;
  if (/\b(?:a )?couple (?:of )?hours?\b/.test(text)) return 120;
  const compactComposite = text.match(/\b(\d{1,2})h\s*(\d{1,2})m\b/);
  if (compactComposite) {
    return Math.max(15, Number(compactComposite[1]) * 60 + Number(compactComposite[2]));
  }
  const composite = text.match(/\b(\d{1,2})\s*(?:hours?|hrs?|hr|h)\s+(?:and\s+)?(\d{1,2})\s*(?:minutes?|minute|min|m)\b/);
  if (composite) return Math.max(15, Number(composite[1]) * 60 + Number(composite[2]));
  const wordHours = {
    an: 1,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8
  };
  const wordHourMatch = text.match(/\b(?:for|find|lasting)?\s*(an|one|two|three|four|five|six|seven|eight)\s+hours?\b/);
  if (wordHourMatch) return wordHours[wordHourMatch[1]] * 60;
  const hourMatch = text.match(/\b(?:for|find|lasting)?\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|hr|h)\b/);
  if (hourMatch) return Math.max(15, Math.round(Number(hourMatch[1]) * 60));
  const minuteMatch = text.match(/\b(?:for|find|lasting)?\s*(\d+)\s*(?:minutes?|minute|min|m)\b/);
  if (minuteMatch) return Math.max(15, Number(minuteMatch[1]));
  const wordMinutes = new Map([
    ["fifteen", 15],
    ["twenty", 20],
    ["thirty", 30],
    ["forty five", 45],
    ["forty-five", 45],
    ["sixty", 60],
    ["ninety", 90]
  ]);
  const wordMinuteMatch = text.match(/\b(?:for|find|lasting)\s+(fifteen|twenty|thirty|forty five|sixty|ninety)\s+minutes?\b/);
  if (wordMinuteMatch) return wordMinutes.get(wordMinuteMatch[1]) || null;
  return null;
}

function extractTimeOfDay(text) {
  if (/\b(?:tonight|evening|after work)\b/.test(text)) return "evening";
  if (/\b(?:afternoon|midday)\b/.test(text)) return "afternoon";
  if (/\bmorning\b/.test(text)) return "morning";
  return null;
}

function clockMatchToMinute(hourText, minuteText, suffix, options = {}) {
  const hour = parseClockHour(hourText, suffix, options);
  if (hour === null) return null;
  const minute = Number(minuteText || 0);
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

export function parseTime(command) {
  const text = normaliseMatch(command);
  const rangeMatch = text.match(/\b(?:from\s+|between\s+)(\d{1,2})(?::([0-5]\d))?\s*(am|pm)?\s+(?:to|until|through|and|-)\s+(\d{1,2})(?::([0-5]\d))?\s*(am|pm)?\b/) ||
    text.match(/\b(\d{1,2})(?::([0-5]\d))?\s*(am|pm)\s+(?:to|until|through|-)\s+(\d{1,2})(?::([0-5]\d))?\s*(am|pm)?\b/);
  if (rangeMatch) {
    const sharedSuffix = rangeMatch[6] || rangeMatch[3] || "";
    const looksLikeWorkingDay = (
      !rangeMatch[3] &&
      rangeMatch[6] === "pm" &&
      Number(rangeMatch[1]) >= 8 &&
      Number(rangeMatch[4]) <= 6
    );
    const startSuffix = rangeMatch[3] || (looksLikeWorkingDay ? "am" : sharedSuffix);
    const startMinute = clockMatchToMinute(rangeMatch[1], rangeMatch[2], startSuffix);
    let endMinute = clockMatchToMinute(rangeMatch[4], rangeMatch[5], rangeMatch[6] || sharedSuffix);
    if (startMinute !== null && endMinute !== null && endMinute <= startMinute) endMinute += 24 * 60;
    return {
      startMinute,
      endMinute,
      explicitRange: true,
      timeOfDay: extractTimeOfDay(text)
    };
  }

  const namedTime = text.match(/\b(?:at|from|starting(?:\s+at)?|starts?\s+at|to)\s+(noon|midday|midnight)\b/)?.[1];
  const relativeClock = text.match(/\b(?:at|from|starting(?:\s+at)?|starts?\s+at|to)?\s*(quarter|half)\s+(past|to)\s+(\d{1,2})\s*(am|pm)?\b/);
  let relativeClockMinute = null;
  if (relativeClock) {
    const base = clockMatchToMinute(relativeClock[3], null, relativeClock[4]);
    if (base !== null) {
      const adjustment = relativeClock[1] === "half" ? 30 : 15;
      relativeClockMinute = relativeClock[2] === "to" ? base - adjustment : base + adjustment;
      if (relativeClockMinute < 0) relativeClockMinute += 24 * 60;
    }
  }
  const atMatch = text.match(/\b(?:at|from|around|starting(?:\s+at)?|starts?\s+at|to)\s+(\d{1,2})(?::([0-5]\d))?\s*(am|pm)?\b/) ||
    text.match(/\b(\d{1,2})(?::([0-5]\d))?\s*(am|pm)\b/);
  const namedMinute = namedTime
    ? (namedTime === "midnight" ? 0 : 12 * 60)
    : null;
  return {
    startMinute: namedMinute ?? relativeClockMinute ?? (
      atMatch ? clockMatchToMinute(atMatch[1], atMatch[2], atMatch[3]) : null
    ),
    endMinute: null,
    explicitRange: false,
    timeOfDay: extractTimeOfDay(text)
  };
}

function explicitDayDate(text, referenceDateKey) {
  for (const group of weekdayAliasGroups) {
    const pattern = weekdayAliasPattern(group);
    if (new RegExp(`\\b(?:next|coming|following)\\s+(?:${pattern})\\b`).test(text)) {
      return nextWeekdayDateKey(referenceDateKey, group.weekday, { includeToday: false });
    }
    if (new RegExp(`\\b(?:(?:on|this)\\s+)?(?:${pattern})\\b`).test(text)) {
      return nextWeekdayDateKey(referenceDateKey, group.weekday, { includeToday: true });
    }
  }
  return null;
}

function validDateKey(year, month, day) {
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    year < 1900 ||
    year > 2200 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function explicitMonthDate(text, referenceDateKey) {
  const monthPattern = monthNames.join("|");
  const dayFirst = text.match(new RegExp(`\\b(?:on\\s+)?(?:the\\s+)?(\\d{1,2})(?:st|nd|rd|th)?(?:\\s+of)?\\s+(${monthPattern})(?:\\s+(\\d{4}))?\\b`));
  const monthFirst = text.match(new RegExp(`\\b(?:on\\s+)?(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?\\b`));
  const match = dayFirst || monthFirst;
  if (!match) return { matched: false, dateKey: null, invalidDate: null };
  const referenceYear = Number(referenceDateKey.slice(0, 4));
  const monthName = dayFirst ? match[2] : match[1];
  const day = Number(dayFirst ? match[1] : match[2]);
  const explicitYear = dayFirst ? match[3] : match[3];
  const month = monthNames.indexOf(monthName) + 1;
  const token = match[0].replace(/^on\s+/, "").trim();
  let year = Number(explicitYear || referenceYear);
  let key = validDateKey(year, month, day);
  if (!key) return { matched: true, dateKey: null, invalidDate: token };
  if (!explicitYear && key < referenceDateKey) {
    year += 1;
    key = validDateKey(year, month, day);
  }
  return { matched: true, dateKey: key, invalidDate: key ? null : token };
}

function explicitNumericDate(command, referenceDateKey) {
  const raw = normaliseCommand(command).toLocaleLowerCase("en-GB");
  const iso = raw.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  const dayFirst = raw.match(/\b(?:on\s+)?(\d{1,2})[/.](\d{1,2})(?:[/.](\d{2}|\d{4}))?\b/);
  if (!iso && !dayFirst) return { matched: false, dateKey: null, invalidDate: null };
  const referenceYear = Number(referenceDateKey.slice(0, 4));
  const yearToken = iso ? iso[1] : dayFirst[3];
  let year = yearToken
    ? Number(yearToken.length === 2 ? `20${yearToken}` : yearToken)
    : referenceYear;
  const month = Number(iso ? iso[2] : dayFirst[2]);
  const day = Number(iso ? iso[3] : dayFirst[1]);
  const token = (iso || dayFirst)[0].replace(/^on\s+/, "").trim();
  let key = validDateKey(year, month, day);
  if (!key) return { matched: true, dateKey: null, invalidDate: token };
  if (!yearToken && key < referenceDateKey) {
    year += 1;
    key = validDateKey(year, month, day);
  }
  return { matched: true, dateKey: key, invalidDate: key ? null : token };
}

function relativeAmount(text, unit) {
  const words = {
    a: 1,
    an: 1,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12
  };
  const match = text.match(new RegExp(`\\bin\\s+(a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\\d+)\\s+${unit}s?\\b`));
  if (!match) return null;
  return /^\d+$/.test(match[1]) ? Number(match[1]) : words[match[1]];
}

function requestedView(text) {
  const keywordMatch = matchCommandViewKeyword(text);
  if (keywordMatch) return keywordMatch.view;
  return text.match(/\b(day|week|month|year)(?:\s+view)?\b/)?.[1] || null;
}

function requestedRoomCode(command) {
  const match = normaliseCommand(command).match(
    /\b(?:custom\s+)?room\s+code(?:\s+(?:to|as))?\s+["']?([a-z0-9-]+)["']?\s*$/i
  );
  if (!match) return null;
  return match[1].toUpperCase();
}

function validCustomRoomCode(code) {
  return /^[A-HJ-NP-Z2-9]{6}$/.test(String(code || ""));
}

function invalidDateAmbiguity(token) {
  return {
    type: "invalid_date",
    token,
    message: `“${token}” is not a valid calendar date.`,
    options: []
  };
}

function invalidRoomCodeAmbiguity(code) {
  return {
    type: "invalid_room_code",
    token: code,
    message: "Room codes must contain exactly six unambiguous letters or numbers.",
    options: []
  };
}

function navigationAliasPattern() {
  return /^(?:open|go to|jump to|show me|take me to|navigate to)\b/;
}

function isGoogleConnectCommand(text) {
  return /^(?:connect|link|sync|authorise|authorize|enable)\b/.test(text) &&
    /\bgoogle(?:\s+(?:calendar|cal))?\b/.test(text);
}

function isRoomCodeCommand(text) {
  return /^(?:change|set|update)\b/.test(text) && /\b(?:custom\s+)?room\s+code\b/.test(text);
}

function isViewCommand(text) {
  if (matchCommandViewKeyword(text)) return true;
  return /^(?:switch|change|open|show|go)\b/.test(text) &&
    /\b(?:day|week|month|year)\s+view\b/.test(text);
}

function explicitMonthNavigationDate(text, referenceDateKey) {
  const month = monthNames.findIndex((name) => new RegExp(`\\b${name}\\b`).test(text));
  if (month < 0) return null;
  let year = Number(text.match(/\b(20\d{2})\b/)?.[1] || referenceDateKey.slice(0, 4));
  const referenceMonth = Number(referenceDateKey.slice(5, 7)) - 1;
  if (!text.match(/\b(20\d{2})\b/) && month < referenceMonth) year += 1;
  return `${year}-${String(month + 1).padStart(2, "0")}-01`;
}

function monthNavigationTarget(command, referenceDateKey) {
  const text = normaliseMatch(command);
  const targetDate = explicitMonthNavigationDate(text, referenceDateKey);
  return targetDate
    ? { targetDate, targetView: "month" }
    : { targetDate: null, targetView: null };
}

function navigationQuery(command, targetDate) {
  if (targetDate) return null;
  return normaliseCommand(command)
    .replace(/^(?:please\s+)?(?:open|go to|jump to|show me|take me to|navigate to|show|find)\s+/i, "")
    .trim();
}

function applyDateAmbiguity(base, date) {
  if (!date.invalidDate) return;
  base.ambiguities.push(invalidDateAmbiguity(date.invalidDate));
}

function applyRoomCodeValidation(base, code) {
  if (!code) {
    base.missingFields.push("room_code");
    return;
  }
  if (!validCustomRoomCode(code)) base.ambiguities.push(invalidRoomCodeAmbiguity(code));
}

function parseNavigation(command, base, date) {
  const nav = date.invalidDate
    ? { targetDate: null, targetView: null }
    : monthNavigationTarget(command, date.referenceDateKey);
  const targetDate = date.invalidDate ? null : (date.dateKey || nav.targetDate);
  const targetView = date.dateKey ? "week" : nav.targetView;
  const query = date.invalidDate ? null : navigationQuery(command, targetDate);
  if (!targetDate && !query && !date.invalidDate) base.missingFields.push("destination");
  return {
    ...base,
    targetDate,
    targetView: targetView || (targetDate ? "week" : null),
    query
  };
}

function parseViewIntent(base, text) {
  const targetView = requestedView(text);
  if (!targetView) base.missingFields.push("view");
  return {
    ...base,
    targetView
  };
}

function parseRoomCodeIntent(base, command, semanticCommand = null) {
  const newRoomCode = requestedRoomCode(command) ||
    (semanticCommand ? requestedRoomCode(semanticCommand) : null);
  applyRoomCodeValidation(base, newRoomCode);
  return {
    ...base,
    newRoomCode,
    requiresConfirmation: true
  };
}

function parseGoogleIntent(base) {
  return {
    ...base,
    provider: "google",
    requiresUserAction: true
  };
}

function parseInvalidDateSafe(date, timezone) {
  if (!date.rangeStartKey || !date.rangeEndKey) {
    return { rangeStart: null, rangeEnd: null };
  }
  return {
    rangeStart: dateAtMinute(date.rangeStartKey, 0, timezone).toISOString(),
    rangeEnd: dateAtMinute(date.rangeEndKey, 0, timezone).toISOString()
  };
}

function monthDateParts(text, referenceDateKey) {
  return explicitMonthDate(text, referenceDateKey);
}

function firstOfRelativeMonthDateKey(referenceDateKey, monthOffset = 0) {
  const year = Number(referenceDateKey.slice(0, 4));
  const month = Number(referenceDateKey.slice(5, 7));
  const date = new Date(Date.UTC(year, month - 1 + Number(monthOffset || 0), 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

function endOfMonthRangeDateKey(monthStartKey) {
  return firstOfRelativeMonthDateKey(monthStartKey, 1);
}

function currentWeekAvailabilityKeys(referenceDateKey) {
  return {
    rangeStartKey: referenceDateKey,
    rangeEndKey: addDateKeyDays(startOfIsoWeekDateKey(referenceDateKey), 7)
  };
}

function dateRangeKeys(command, referenceDateKey, { availability = false } = {}) {
  const text = normaliseMatch(command);
  const allowedWeekdays = availability ? requestedAvailabilityWeekdays(text) : [];
  const recurringWeekdays = availability &&
    recurringAvailabilityWeekdaysRequested(text, allowedWeekdays);
  const parsedMonthDate = monthDateParts(text, referenceDateKey);
  const parsedNumericDate = explicitNumericDate(command, referenceDateKey);
  const relativeDays = relativeAmount(text, "day");
  const relativeWeeks = relativeAmount(text, "week");
  let dateKey = null;
  let rangeStartKey = null;
  let rangeEndKey = null;
  let precision = null;
  let invalidDate = null;
  let rangeKind = null;

  if (/\bday after tomorrow\b/.test(text)) {
    dateKey = addDateKeyDays(referenceDateKey, 2);
    precision = "day";
    rangeKind = "explicit_day";
  } else if (/\b(?:tomorrow|next day)\b/.test(text)) {
    dateKey = addDateKeyDays(referenceDateKey, 1);
    precision = "day";
    rangeKind = "explicit_day";
  } else if (/\b(?:today|tonight|later today)\b/.test(text)) {
    dateKey = referenceDateKey;
    precision = "day";
    rangeKind = "explicit_day";
  } else if (/\bin (?:a )?fortnight\b/.test(text)) {
    dateKey = addDateKeyDays(referenceDateKey, 14);
    precision = "day";
    rangeKind = "relative_day";
  } else if (relativeDays !== null) {
    dateKey = addDateKeyDays(referenceDateKey, relativeDays);
    precision = "day";
    rangeKind = "relative_day";
  } else if (relativeWeeks !== null) {
    dateKey = addDateKeyDays(referenceDateKey, relativeWeeks * 7);
    precision = "day";
    rangeKind = "relative_day";
  } else if (/\bnext weekend\b/.test(text)) {
    const monday = addDateKeyDays(startOfIsoWeekDateKey(referenceDateKey), 7);
    rangeStartKey = addDateKeyDays(monday, 5);
    rangeEndKey = addDateKeyDays(rangeStartKey, 2);
    precision = "range";
    rangeKind = "next_weekend";
  } else if (/\bthis weekend\b/.test(text)) {
    const monday = startOfIsoWeekDateKey(referenceDateKey);
    rangeStartKey = addDateKeyDays(monday, 5);
    if (rangeStartKey < referenceDateKey) rangeStartKey = addDateKeyDays(rangeStartKey, 7);
    rangeEndKey = addDateKeyDays(rangeStartKey, 2);
    precision = "range";
    rangeKind = "weekend";
  } else if (/\b(?:(?:this|current)\s+week|rest of (?:the )?week)\b/.test(text)) {
    ({ rangeStartKey, rangeEndKey } = currentWeekAvailabilityKeys(referenceDateKey));
    precision = "range";
    rangeKind = "current_week";
  } else if (/\b(?:the )?week after next\b/.test(text)) {
    rangeStartKey = addDateKeyDays(startOfIsoWeekDateKey(referenceDateKey), 14);
    rangeEndKey = addDateKeyDays(rangeStartKey, 7);
    precision = "range";
    rangeKind = "week_after_next";
  } else if (/\bnext week\b/.test(text)) {
    rangeStartKey = addDateKeyDays(startOfIsoWeekDateKey(referenceDateKey), 7);
    rangeEndKey = addDateKeyDays(rangeStartKey, 7);
    precision = "range";
    rangeKind = "next_week";
  } else if (availability && /\b(?:this|current) month\b/.test(text)) {
    rangeStartKey = referenceDateKey;
    rangeEndKey = firstOfRelativeMonthDateKey(referenceDateKey, 1);
    precision = "range";
    rangeKind = "current_month";
  } else if (availability && /\bnext month\b/.test(text)) {
    rangeStartKey = firstOfRelativeMonthDateKey(referenceDateKey, 1);
    rangeEndKey = firstOfRelativeMonthDateKey(referenceDateKey, 2);
    precision = "range";
    rangeKind = "next_month";
  } else if (
    availability &&
    !parsedMonthDate.matched &&
    monthNames.some((name) => new RegExp(`\\b${name}\\b`).test(text))
  ) {
    rangeStartKey = explicitMonthNavigationDate(text, referenceDateKey);
    rangeEndKey = rangeStartKey ? endOfMonthRangeDateKey(rangeStartKey) : null;
    if (
      rangeStartKey &&
      rangeStartKey.slice(0, 7) === referenceDateKey.slice(0, 7) &&
      rangeStartKey < referenceDateKey
    ) {
      rangeStartKey = referenceDateKey;
    }
    precision = rangeStartKey ? "range" : null;
    rangeKind = rangeStartKey ? "named_month" : null;
  } else if (recurringWeekdays) {
    ({ rangeStartKey, rangeEndKey } = currentWeekAvailabilityKeys(referenceDateKey));
    precision = "range";
    rangeKind = "default_current_week";
  } else {
    if (parsedNumericDate.matched) {
      dateKey = parsedNumericDate.dateKey;
      invalidDate = parsedNumericDate.invalidDate;
      precision = dateKey ? "day" : null;
      rangeKind = dateKey ? "explicit_day" : null;
    } else if (parsedMonthDate.matched) {
      dateKey = parsedMonthDate.dateKey;
      invalidDate = parsedMonthDate.invalidDate;
      precision = dateKey ? "day" : null;
      rangeKind = dateKey ? "explicit_day" : null;
    } else {
      dateKey = explicitDayDate(text, referenceDateKey);
      precision = dateKey ? "day" : null;
      rangeKind = dateKey ? "explicit_day" : null;
    }
  }

  if (dateKey) {
    rangeStartKey = dateKey;
    rangeEndKey = addDateKeyDays(dateKey, 1);
  }
  if (availability && !dateKey && !rangeStartKey && !invalidDate) {
    ({ rangeStartKey, rangeEndKey } = currentWeekAvailabilityKeys(referenceDateKey));
    precision = "range";
    rangeKind = "default_current_week";
  }

  return {
    dateKey,
    rangeStartKey,
    rangeEndKey,
    precision,
    invalidDate,
    rangeKind,
    allowedWeekdays
  };
}

export function parseDateRange(command, {
  now = new Date(),
  timezone = "UTC",
  availability = false
} = {}) {
  const referenceDateKey = dateKeyInZone(now, timezone);
  const keys = dateRangeKeys(command, referenceDateKey, { availability });
  const safeRange = parseInvalidDateSafe(keys, timezone);
  let rangeStart = safeRange.rangeStart;
  if (
    availability &&
    rangeStart &&
    safeRange.rangeEnd &&
    new Date(rangeStart) < now &&
    now < new Date(safeRange.rangeEnd)
  ) {
    rangeStart = now.toISOString();
  }
  return {
    dateKey: keys.dateKey,
    rangeStart,
    rangeEnd: safeRange.rangeEnd,
    precision: keys.precision,
    invalidDate: keys.invalidDate,
    referenceDateKey,
    rangeKind: keys.rangeKind,
    allowedWeekdays: keys.allowedWeekdays
  };
}

function stripTitleNoise(command, {
  stripParticipantPhrase = true,
  semanticCommand = null
} = {}) {
  let title = normaliseCommand(command)
    .replace(/^(?:please\s+)?(?:create|add|schedule|book|arrange)(?:\s+(?:an?\s+)?(?:event|meeting|appointment))?\s+/i, "")
    .replace(/^event(?=\s+(?:at|on|this|next|today|tomorrow|all day)\b)\s*/i, "")
    .replace(/^meet\s+/i, "");
  if (stripParticipantPhrase) {
    title = title.replace(
      /\bwith\s+.+?(?=\s+(?:today|tomorrow|day after tomorrow|on|this|next|in|at|from|for|after|before|morning|afternoon|evening|weekend|week)\b|$)/i,
      ""
    );
  }
  const cleanedTitle = title
    .replace(/\b(?:today|tomorrow|tonight|later today|day after tomorrow|this weekend|next weekend|next week|week after next|in (?:a )?fortnight)\b/gi, "")
    .replace(/\bin\s+(?:a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d+)\s+(?:days?|weeks?)\b/gi, "")
    .replace(new RegExp(`\\b(?:on\\s+)?(?:(?:this|next)\\s+)?(?:${weekdayNames.join("|")})\\b`, "gi"), "")
    .replace(new RegExp(`\\b(?:on\\s+)?\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${monthNames.join("|")})(?:\\s+\\d{4})?\\b`, "gi"), "")
    .replace(new RegExp(`\\b(?:on\\s+)?(?:${monthNames.join("|")})\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{4})?\\b`, "gi"), "")
    .replace(/\b(?:on\s+)?\d{1,2}[/.]\d{1,2}(?:[/.](?:\d{2}|\d{4}))?\b/gi, "")
    .replace(/\b(?:from|between)\s+\d{1,2}(?::[0-5]\d)?\s*(?:am|pm)?\s+(?:to|until|through|and|-)\s+\d{1,2}(?::[0-5]\d)?\s*(?:am|pm)?\b/gi, "")
    .replace(/\b(?:at|to|around|starting(?:\s+at)?)\s+(?:\d{1,2}(?::[0-5]\d)?\s*(?:am|pm)?|noon|midday|midnight|(?:quarter|half)\s+(?:past|to)\s+\d{1,2}\s*(?:am|pm)?)\b/gi, "")
    .replace(/\bfor\s+(?:(?:three quarters?|three fourths?) (?:of )?an? hour|(?:a )?quarter (?:of )?an? hour|half an? hour|(?:an?|one) hour and (?:a )?half|(?:a )?couple (?:of )?hours?|\d{1,2}h\s*\d{1,2}m|\d+(?:\.\d+)?\s*(?:hours?|hrs?|hr|h|minutes?|mins?|min|m))\b/gi, "")
    .replace(/\ball day\b/gi, "")
    .replace(/\b(?:morning|afternoon|evening)\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/^[,;:\s-]+|[,;:\s-]+$/g, "")
    .replace(/^["']|["']$/g, "")
    .trim();
  if (!semanticCommand) return cleanedTitle;
  const semanticTitle = stripTitleNoise(semanticCommand, {
    stripParticipantPhrase,
    semanticCommand: null
  });
  return normaliseMatch(cleanedTitle) === normaliseMatch(semanticTitle)
    ? cleanedTitle
    : semanticTitle;
}

function stripPolitePrefix(text) {
  let result = String(text || "").trim();
  const prefix = /^(?:please\s+|(?:could|can|would|will)\s+you\s+|can\s+we\s+|i\s+(?:would\s+like|want|need)\s+to\s+|let\s+us\s+)/;
  while (prefix.test(result)) result = result.replace(prefix, "").trim();
  return result;
}

const fuzzyIntentVerbs = Object.freeze([
  "connect",
  "create",
  "delete",
  "duplicate",
  "highlight",
  "invite",
  "navigate",
  "remove",
  "rename",
  "reschedule",
  "schedule",
  "switch",
  "update"
]);

function conservativeLeadingVerb(text) {
  const token = String(text || "").split(" ")[0] || "";
  if (
    token.length < 5 ||
    fuzzyIntentVerbs.includes(token) ||
    /(?:ed|ing|s)$/.test(token)
  ) {
    return { text, corrected: false, from: null, to: null };
  }
  const candidates = fuzzyIntentVerbs
    .map((verb) => ({ verb, distance: levenshtein(token, verb) }))
    .filter(({ verb, distance }) => (
      Math.abs(verb.length - token.length) <= 1 && distance <= 1
    ))
    .sort((left, right) => left.distance - right.distance || left.verb.localeCompare(right.verb));
  if (candidates.length !== 1) return { text, corrected: false, from: null, to: null };
  const replacement = candidates[0].verb;
  return {
    text: `${replacement}${text.slice(token.length)}`,
    corrected: true,
    from: token,
    to: replacement
  };
}

function detectIntent(sourceText) {
  const politeText = stripPolitePrefix(sourceText);
  const fuzzy = conservativeLeadingVerb(politeText);
  const text = fuzzy.text;
  const confidence = fuzzy.corrected ? 0.72 : 0.9;

  if (/^(?:add|invite)\b.+\bto\b/.test(text)) {
    return { intent: "add_participant", text, confidence };
  }
  if (/^(?:remove|uninvite)\b.+\bfrom\b/.test(text)) {
    return { intent: "remove_participant", text, confidence };
  }
  if (/^(?:rename)\b/.test(text) || /^(?:change|update)\s+(?:the\s+)?title\b/.test(text)) {
    return { intent: "rename_event", text, confidence };
  }
  if (/^(?:delete|cancel)\b/.test(text) || /^remove\s+(?:the\s+)?event\b/.test(text)) {
    return { intent: "delete_event", text, confidence };
  }
  if (/^duplicate\b/.test(text) || /^copy\s+(?:the\s+)?event\b/.test(text)) {
    return { intent: "duplicate_event", text, confidence };
  }
  if (/^(?:move|reschedule|postpone|shift)\b/.test(text)) {
    return { intent: "move_event", text, confidence };
  }
  if (isGoogleConnectCommand(text)) return { intent: "connect_google", text, confidence };
  if (isRoomCodeCommand(text)) return { intent: "update_room_code", text, confidence };
  if (isViewCommand(text)) return { intent: "navigate_view", text, confidence };
  if (navigationAliasPattern().test(text) || /^(?:take me to|navigate to)\b/.test(text)) {
    return { intent: "navigate", text, confidence };
  }
  if (/^(?:create|add|schedule|book|arrange|meet|event)\b/.test(text)) {
    return { intent: "create_event", text, confidence };
  }
  if (
    /^(?:when is|when are|show when|highlight|show availability|availability|are)\b/.test(text) ||
    /^(?:what is|who is)\b.+\b(?:free|available|availability)\b/.test(text)
  ) {
    return { intent: "show_availability", text, confidence };
  }
  if (/^when can\b.+\bmeet\b/.test(text)) return { intent: "find_time", text, confidence };
  if (/^(?:find|look for|search for)\b/.test(text)) {
    if (/\b(?:hour|hours|minute|minutes|free|available|availability|time|slot)\b/.test(text)) {
      return { intent: "find_time", text, confidence };
    }
    return { intent: "navigate", text, confidence };
  }
  if (/^(?:show)\b/.test(text) && /\b(?:free|available|availability)\b/.test(text)) {
    return { intent: "show_availability", text, confidence };
  }
  if (
    /\b(?:today|tomorrow|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/.test(text) &&
    /\b(?:at|from|noon|midday|midnight)\b/.test(text)
  ) {
    return { intent: "create_event", text, confidence: 0.76 };
  }
  return { intent: "unsupported", text, confidence: 0.1 };
}

function contextualEventTitle(context = {}) {
  const value = context.selectedEventTitle ||
    context.lastEventTitle ||
    context.activeEvent?.title ||
    context.selectedEvent?.title ||
    "";
  return normaliseCommand(value);
}

function contextualEventId(context = {}) {
  return context.selectedEventId ||
    context.lastEventId ||
    context.activeEvent?.id ||
    context.selectedEvent?.id ||
    null;
}

function contextualEventReference(query, context = {}) {
  const value = normaliseCommand(query).replace(/^(?:the\s+)?event\s+/i, "").trim();
  const requested = /^(?:it|that|this|the event|that event|this event)$/i.test(value);
  return {
    eventQuery: requested ? contextualEventTitle(context) : value,
    contextEventRequested: requested,
    usedContextEvent: requested && Boolean(contextualEventId(context) || contextualEventTitle(context)),
    contextEventId: requested ? contextualEventId(context) : null
  };
}

function parseRelativeMoveOffset(text) {
  const direction = (
    /\b(?:earlier|sooner|up|bring forward)\b/.test(text)
      ? -1
      : /\b(?:later|back|push back|postpone)\b/.test(text)
        ? 1
        : /\bforward\b/.test(text)
          ? -1
          : 0
  );
  if (!direction) return null;
  const amount = parseDuration(text) || 15;
  return direction * amount;
}

function moveEventQuery(command, context = {}) {
  const text = stripPolitePrefix(normaliseMatch(command))
    .replace(/^(?:move|reschedule|postpone|shift)\b\s*/, "")
    .split(/\s+\bto\b\s+/)[0]
    .replace(/\s+\b(?:by\s+)?(?:(?:half|quarter) an? hour|\d+(?:\.\d+)?\s*(?:hours?|hrs?|hr|h|minutes?|minute|min|m))\s+(?:earlier|later|back|forward)\b.*$/, "")
    .replace(/\s+\b(?:earlier|later|back|forward|up)(?:\s+by)?\s+(?:(?:half|quarter) an? hour|\d+(?:\.\d+)?\s*(?:hours?|hrs?|hr|h|minutes?|minute|min|m))\b.*$/, "")
    .replace(/\s+\bby\s+(?:(?:half|quarter) an? hour|\d+(?:\.\d+)?\s*(?:hours?|hrs?|hr|h|minutes?|minute|min|m))\s*$/, "")
    .replace(/\s+\b(?:earlier|later|back|forward|up)\s*$/, "")
    .trim();
  return contextualEventReference(text, context);
}

function parseRenameIntent(base, command, context = {}, semanticCommand = null) {
  const raw = normaliseCommand(command).replace(/^(?:please\s+)?/i, "");
  const semantic = semanticCommand || stripPolitePrefix(normaliseMatch(command));
  const semanticVerb = semantic.split(" ")[0] || "";
  const canonicalRaw = /^(?:rename|change|update)\b/i.test(raw)
    ? raw
    : raw.replace(/^\S+/, semanticVerb);
  const rawMatch = canonicalRaw.match(/^rename\s+(?:the\s+)?(?:event\s+)?(.+?)\s+to\s+(.+)$/i) ||
    canonicalRaw.match(/^(?:change|update)\s+(?:the\s+)?title(?:\s+(?:of|for))?\s+(.+?)\s+to\s+(.+)$/i);
  const semanticMatch = semantic.match(/^rename\s+(?:the\s+)?(?:event\s+)?(.+?)\s+to\s+(.+)$/) ||
    semantic.match(/^(?:change|update)\s+(?:the\s+)?title(?:\s+(?:of|for))?\s+(.+?)\s+to\s+(.+)$/);
  const match = rawMatch || semanticMatch;
  const eventReference = contextualEventReference(match?.[1] || "", context);
  const eventQuery = eventReference.eventQuery;
  const newTitle = normaliseCommand(match?.[2] || "").replace(/^["']|["']$/g, "").trim();
  if (!eventQuery && !eventReference.contextEventId) base.missingFields.push("event");
  if (!newTitle) base.missingFields.push("title");
  return {
    ...base,
    eventQuery,
    ...eventReference,
    eventCandidates: [],
    newTitle,
    requiresConfirmation: true
  };
}

function parseDeleteIntent(base, command, context = {}) {
  const text = stripPolitePrefix(normaliseMatch(command));
  const query = text
    .replace(/^(?:delete|cancel)\b\s*(?:the\s+)?(?:event\s+)?/, "")
    .replace(/^remove\b\s+(?:the\s+)?event\b\s*/, "")
    .trim();
  const eventReference = contextualEventReference(query, context);
  const eventQuery = eventReference.eventQuery;
  if (!eventQuery && !eventReference.contextEventId) base.missingFields.push("event");
  return {
    ...base,
    eventQuery,
    ...eventReference,
    eventCandidates: [],
    requiresConfirmation: true
  };
}

function parseDuplicateIntent(base, command, date, time, context = {}) {
  const text = stripPolitePrefix(normaliseMatch(command));
  const withoutVerb = text
    .replace(/^duplicate\b\s*(?:the\s+)?(?:event\s+)?/, "")
    .replace(/^copy\b\s*(?:the\s+)?event\b\s*/, "");
  const query = withoutVerb
    .split(/\s+(?=(?:to|on|at|from|today|tomorrow|tonight|this|next|in)\b)/)[0]
    .trim();
  const eventReference = contextualEventReference(query, context);
  const eventQuery = eventReference.eventQuery;
  if (!eventQuery && !eventReference.contextEventId) base.missingFields.push("event");
  if (!date.dateKey && time.startMinute === null) base.missingFields.push("target_date_or_time");
  return {
    ...base,
    eventQuery,
    ...eventReference,
    eventCandidates: [],
    targetDateKey: date.dateKey,
    targetStartMinute: time.startMinute,
    targetStart: null,
    targetEnd: null,
    requiresConfirmation: true
  };
}

function parseParticipantMutationIntent(base, command, members, currentParticipantId, context = {}) {
  const text = stripPolitePrefix(normaliseMatch(command));
  const adding = base.intent === "add_participant";
  const match = adding
    ? text.match(/^(?:add|invite)\s+(.+?)\s+to\s+(.+)$/)
    : text.match(/^(?:remove|uninvite)\s+(.+?)\s+from\s+(.+)$/);
  const participantToken = (match?.[1] || "")
    .replace(/^(?:participant|member|guest)\s+/, "")
    .trim();
  const eventReference = contextualEventReference(
    (match?.[2] || "").replace(/^(?:the\s+)?event\s+/, "").trim(),
    context
  );
  const eventQuery = eventReference.eventQuery;
  const participants = participantToken
    ? resolveParticipants(`with ${participantToken}`, members, currentParticipantId)
    : { participantIds: [], ambiguities: [], unmatched: [] };
  const missingFields = [...base.missingFields];
  if (!participantToken) missingFields.push("participants");
  if (!eventQuery && !eventReference.contextEventId) missingFields.push("event");
  const ambiguities = [...participants.ambiguities];
  if (participants.unmatched.length) {
    ambiguities.push({
      type: "participant_not_found",
      token: participants.unmatched[0],
      message: `I could not find “${participants.unmatched[0]}” in this room.`,
      options: []
    });
  }
  return {
    ...base,
    participantIds: participants.participantIds,
    participantTokens: participantToken ? [participantToken] : [],
    unmatchedParticipants: participants.unmatched,
    ambiguities,
    missingFields,
    eventQuery,
    ...eventReference,
    eventCandidates: [],
    requiresConfirmation: true
  };
}

function afterTimeMinute(text) {
  if (/\bafter (?:work|work hours)\b/.test(text)) return 17 * 60;
  if (/\bafter (?:lunch|lunchtime)\b/.test(text)) return 13 * 60;
  if (/\bafter (?:noon|midday)\b/.test(text)) return 12 * 60;
  const match = text.match(/\bafter\s+(\d{1,2})(?::([0-5]\d))?\s*(am|pm)?\b/);
  return match ? clockMatchToMinute(match[1], match[2], match[3]) : null;
}

function beforeTimeMinute(text) {
  if (/\bbefore (?:work|work hours)\b/.test(text)) return 9 * 60;
  if (/\bbefore (?:lunch|lunchtime|noon|midday)\b/.test(text)) return 12 * 60;
  const match = text.match(/\bbefore\s+(\d{1,2})(?::([0-5]\d))?\s*(am|pm)?\b/);
  return match ? clockMatchToMinute(match[1], match[2], match[3], { preferAfternoon: false }) : null;
}

export function parseCommand(command, {
  now = new Date(),
  timezone = "UTC",
  members = [],
  currentParticipantId = null,
  context = {}
} = {}) {
  const original = normaliseCommand(command);
  const language = normaliseMatchDetails(original);
  if (!language.text || language.text.length < 2) {
    return { intent: "unsupported", confidence: 0, reason: intentHelp };
  }

  const detected = detectIntent(language.text);
  const intent = detected.intent;
  const text = detected.text;
  const participants = resolveParticipants(original, members, currentParticipantId);
  const availabilityIntent = intent === "find_time" || intent === "show_availability";
  const date = parseDateRange(original, {
    now,
    timezone,
    availability: availabilityIntent
  });
  const time = parseTime(original);
  const parsedDuration = parseDuration(original);
  const durationMinutes = parsedDuration || (
    time.startMinute !== null && time.endMinute !== null
      ? time.endMinute - time.startMinute
      : null
  );
  const base = {
    intent,
    confidence: language.corrections.length
      ? Math.min(detected.confidence, 0.82)
      : detected.confidence,
    participantIds: participants.participantIds,
    missingFields: [],
    ambiguities: [...participants.ambiguities],
    unmatchedParticipants: participants.unmatched,
    interpretation: {
      normalised: text,
      corrections: language.corrections
    }
  };

  if (intent === "unsupported") {
    return { intent, confidence: base.confidence, reason: intentHelp };
  }

  applyDateAmbiguity(base, date);

  if (intent === "rename_event") return parseRenameIntent(base, original, context, text);
  if (intent === "delete_event") return parseDeleteIntent(base, text, context);
  if (intent === "duplicate_event") {
    return parseDuplicateIntent(base, text, date, time, context);
  }
  if (intent === "add_participant" || intent === "remove_participant") {
    return parseParticipantMutationIntent(
      base,
      text,
      members,
      currentParticipantId,
      context
    );
  }
  if (intent === "navigate_view") return parseViewIntent(base, text);
  if (intent === "connect_google") return parseGoogleIntent(base);
  if (intent === "update_room_code") return parseRoomCodeIntent(base, original, text);

  if (intent === "create_event") {
    const allDay = /\ball day\b/.test(text);
    const genericCreate = /^(?:create|add|schedule|book|arrange)(?:\s+(?:an?\s+)?event)?$/i.test(text);
    const title = genericCreate
      ? ""
      : stripTitleNoise(original, {
          stripParticipantPhrase: participants.unmatched.length === 0,
          semanticCommand: text
        });
    if (!title) base.missingFields.push("title");
    if (!date.dateKey) base.missingFields.push("date");
    if (!allDay && time.startMinute === null) base.missingFields.push("start_time");
    const resolvedDuration = allDay ? null : (durationMinutes || (time.startMinute !== null ? 60 : null));
    const start = date.dateKey && (allDay || time.startMinute !== null)
      ? dateAtMinute(date.dateKey, allDay ? 0 : time.startMinute, timezone)
      : null;
    const end = allDay && date.dateKey
      ? dateAtMinute(addDateKeyDays(date.dateKey, 1), 0, timezone)
      : (start && resolvedDuration
        ? new Date(start.getTime() + resolvedDuration * 60 * 1000)
        : null);
    const namedParticipants = members.filter((member) => participants.participantIds.includes(member.id));
    return {
      ...base,
      title: genericCreate
        ? ""
        : (title || (
          namedParticipants.length
          ? `Meeting with ${namedParticipants.map((member) => member.displayName.split(" ")[0]).join(" and ")}`
          : "New event"
        )),
      start: start?.toISOString() || null,
      end: end?.toISOString() || null,
      durationMinutes: resolvedDuration,
      dateKey: date.dateKey,
      startMinute: time.startMinute,
      timeOfDay: time.timeOfDay,
      allDay,
      description: ""
    };
  }

  if (intent === "find_time" || intent === "show_availability") {
    if (participants.unmatched.length) {
      base.ambiguities.push({
        type: "participant_not_found",
        token: participants.unmatched[0],
        message: `I could not find “${participants.unmatched[0]}” in this room.`,
        options: []
      });
    }
    const resolvedDuration = durationMinutes || (intent === "find_time" ? 60 : 30);
    if (!date.rangeStart || !date.rangeEnd) base.missingFields.push("date_range");
    if (!participants.participantIds.length && !participants.allRequested) base.missingFields.push("participants");
    const window = commandTimeWindows[time.timeOfDay] || null;
    const afterMinute = afterTimeMinute(text);
    const beforeMinute = beforeTimeMinute(text);
    const earliestMinute = Math.max(
      window?.startMinute ?? 8 * 60,
      afterMinute ?? (time.explicitRange ? time.startMinute : 0) ?? 0
    );
    const latestMinute = Math.min(
      window?.endMinute ?? 21 * 60,
      beforeMinute ?? (time.explicitRange ? time.endMinute : 24 * 60) ?? 24 * 60
    );
    if (latestMinute <= earliestMinute) {
      base.ambiguities.push({
        type: "invalid_time_window",
        token: "time window",
        message: "Choose a daily time window with an end after its start.",
        options: []
      });
    }
    return {
      ...base,
      rangeStart: date.rangeStart,
      rangeEnd: date.rangeEnd,
      durationMinutes: resolvedDuration,
      timeOfDay: time.timeOfDay,
      earliestMinute,
      latestMinute,
      allowedWeekdays: date.allowedWeekdays,
      rangeKind: date.rangeKind
    };
  }

  if (intent === "move_event") {
    const eventReference = moveEventQuery(text, context);
    const eventQuery = eventReference.eventQuery;
    const relativeOffsetMinutes = parseRelativeMoveOffset(text);
    if (!eventQuery && !eventReference.contextEventId) base.missingFields.push("event");
    if (!date.dateKey && time.startMinute === null && relativeOffsetMinutes === null) {
      base.missingFields.push("target_date_or_time");
    }
    return {
      ...base,
      eventQuery,
      ...eventReference,
      eventCandidates: [],
      targetDateKey: date.dateKey,
      targetStartMinute: time.startMinute,
      durationMinutes: relativeOffsetMinutes === null ? durationMinutes : null,
      relativeOffsetMinutes,
      targetStart: null,
      targetEnd: null
    };
  }

  return parseNavigation(original, base, date);
}

export function resolveEventCandidates(query, events = [], {
  participantId = null,
  isHost = false,
  limit = 8
} = {}) {
  const normalizedQuery = normaliseMatch(query);
  if (!normalizedQuery) return [];
  return events
    .filter((event) => isHost || event.createdByParticipantId === participantId)
    .map((event) => {
      const title = normaliseMatch(event.title);
      let score = 100;
      if (title === normalizedQuery) score = 0;
      else if (title.includes(normalizedQuery)) score = 10 + title.indexOf(normalizedQuery);
      else if (normalizedQuery.includes(title)) score = 20;
      else {
        const distance = levenshtein(title, normalizedQuery);
        const fuzzyLimit = Math.max(2, Math.floor(Math.max(title.length, normalizedQuery.length) * 0.3));
        score = distance <= fuzzyLimit ? 40 + distance : 100;
      }
      return { event, score };
    })
    .filter((entry) => entry.score < 65)
    .sort((left, right) => left.score - right.score || new Date(left.event.start) - new Date(right.event.start))
    .slice(0, limit)
    .map(({ event, score }) => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      timezone: event.timezone || "UTC",
      updatedAt: event.updatedAt || event.createdAt,
      inviteeParticipantIds: [...(event.inviteeParticipantIds || [])],
      location: event.location || "",
      description: event.description || "",
      allDay: event.allDay === true,
      createdByParticipantId: event.createdByParticipantId || null,
      score
    }));
}

export function completeMoveTarget(result, candidate, timezone = "UTC") {
  if (
    !result ||
    !["move_event", "duplicate_event"].includes(result.intent) ||
    !candidate
  ) {
    return result;
  }
  const originalStart = new Date(candidate.start);
  const originalEnd = new Date(candidate.end);
  const durationMinutes = result.durationMinutes || Math.max(
    15,
    Math.round((originalEnd.getTime() - originalStart.getTime()) / 60000)
  );
  if (Number.isFinite(result.relativeOffsetMinutes)) {
    const targetStart = new Date(
      originalStart.getTime() + Number(result.relativeOffsetMinutes) * 60000
    );
    return {
      ...result,
      targetStart: targetStart.toISOString(),
      targetEnd: new Date(targetStart.getTime() + durationMinutes * 60000).toISOString(),
      durationMinutes
    };
  }
  const originalParts = zonedParts(originalStart, timezone);
  const originalMinute = originalParts.hour * 60 + originalParts.minute;
  const targetDateKey = result.targetDateKey || dateKeyInZone(originalStart, timezone);
  const targetMinute = result.targetStartMinute ?? originalMinute;
  const targetStart = dateAtMinute(targetDateKey, targetMinute, timezone);
  return {
    ...result,
    targetStart: targetStart.toISOString(),
    targetEnd: new Date(targetStart.getTime() + durationMinutes * 60000).toISOString(),
    durationMinutes
  };
}

export const unsupportedCommandHelp = intentHelp;
