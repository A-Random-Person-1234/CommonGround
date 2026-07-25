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

const intentHelp = "CommonGround can currently create events, find shared free time, show availability, move events and navigate the calendar. It can also open settings, connect Google Calendar and update a valid room code.";

export function normaliseCommand(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[“”]/g, "\"")
    .replace(/[’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function normaliseMatch(value) {
  return normaliseCommand(value)
    .toLocaleLowerCase("en-GB")
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
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

export function resolveParticipants(command, members = [], currentParticipantId = null) {
  const text = normaliseMatch(command);
  const allRequested = /\b(everyone|whole room|everybody)\b/.test(text);
  const meRequested = /\b(me|myself)\b/.test(text);
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

  const possibleNameMatches = [
    ...text.matchAll(/\b(?:with|for)\s+([a-z][a-z0-9 ]{1,80}?)(?=\s+(?:today|tomorrow|on|this|next|at|from|for|after|before|morning|afternoon|evening|weekend|week)\b|$)/g)
  ];
  for (const match of possibleNameMatches) {
    const possibleNames = match[1]
      .split(/\s+and\s+|,\s*/)
      .map((entry) => entry.replace(/\b(me|myself)\b/g, "").trim())
      .filter(Boolean);
    for (const possibleName of possibleNames) {
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
  if (/\bhalf an? hour\b/.test(text)) return 30;
  const wordHours = { an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };
  const wordHourMatch = text.match(/\b(?:for|find)\s+(an|one|two|three|four|five|six)\s+hours?\b/);
  if (wordHourMatch) return wordHours[wordHourMatch[1]] * 60;
  const hourMatch = text.match(/\b(?:for|find)?\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|hr)\b/);
  if (hourMatch) return Math.max(15, Math.round(Number(hourMatch[1]) * 60));
  const minuteMatch = text.match(/\b(?:for|find)?\s*(\d+)\s*(?:minutes?|mins?|min)\b/);
  if (minuteMatch) return Math.max(15, Number(minuteMatch[1]));
  return null;
}

function extractTimeOfDay(text) {
  return ["morning", "afternoon", "evening"].find((period) => new RegExp(`\\b${period}\\b`).test(text)) || null;
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
  const rangeMatch = text.match(/\bfrom\s+(\d{1,2})(?::([0-5]\d))?\s*(am|pm)?\s+(?:to|-)\s+(\d{1,2})(?::([0-5]\d))?\s*(am|pm)?\b/);
  if (rangeMatch) {
    const sharedSuffix = rangeMatch[6] || rangeMatch[3] || "";
    const startMinute = clockMatchToMinute(rangeMatch[1], rangeMatch[2], rangeMatch[3] || sharedSuffix);
    let endMinute = clockMatchToMinute(rangeMatch[4], rangeMatch[5], rangeMatch[6] || sharedSuffix);
    if (startMinute !== null && endMinute !== null && endMinute <= startMinute) endMinute += 24 * 60;
    return {
      startMinute,
      endMinute,
      explicitRange: true,
      timeOfDay: extractTimeOfDay(text)
    };
  }

  const atMatch = text.match(/\b(?:at|to)\s+(\d{1,2})(?::([0-5]\d))?\s*(am|pm)?\b/);
  return {
    startMinute: atMatch ? clockMatchToMinute(atMatch[1], atMatch[2], atMatch[3]) : null,
    endMinute: null,
    explicitRange: false,
    timeOfDay: extractTimeOfDay(text)
  };
}

function explicitDayDate(text, referenceDateKey) {
  for (let weekday = 0; weekday < weekdayNames.length; weekday += 1) {
    const name = weekdayNames[weekday];
    if (new RegExp(`\\bnext\\s+${name}\\b`).test(text)) {
      return nextWeekdayDateKey(referenceDateKey, weekday, { includeToday: false });
    }
    if (new RegExp(`\\b(?:on\\s+)?${name}\\b`).test(text)) {
      return nextWeekdayDateKey(referenceDateKey, weekday, { includeToday: true });
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
  const dayFirst = text.match(new RegExp(`\\b(?:on\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthPattern})(?:\\s+(\\d{4}))?\\b`));
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
  return /^(?:open|go to|jump to|show me)\b/;
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
    .replace(/^(?:open|go to|jump to|show me|show|find)\s+/i, "")
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

function parseRoomCodeIntent(base, command) {
  const newRoomCode = requestedRoomCode(command);
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

function dateRangeKeys(command, referenceDateKey) {
  const text = normaliseMatch(command);
  let dateKey = null;
  let rangeStartKey = null;
  let rangeEndKey = null;
  let precision = null;
  let invalidDate = null;

  if (/\btomorrow\b/.test(text)) {
    dateKey = addDateKeyDays(referenceDateKey, 1);
    precision = "day";
  } else if (/\btoday\b/.test(text)) {
    dateKey = referenceDateKey;
    precision = "day";
  } else if (/\bthis weekend\b/.test(text)) {
    const monday = startOfIsoWeekDateKey(referenceDateKey);
    rangeStartKey = addDateKeyDays(monday, 5);
    if (rangeStartKey < referenceDateKey) rangeStartKey = addDateKeyDays(rangeStartKey, 7);
    rangeEndKey = addDateKeyDays(rangeStartKey, 2);
    precision = "range";
  } else if (/\bnext week\b/.test(text)) {
    rangeStartKey = addDateKeyDays(startOfIsoWeekDateKey(referenceDateKey), 7);
    rangeEndKey = addDateKeyDays(rangeStartKey, 7);
    precision = "range";
  } else {
    const monthDate = monthDateParts(text, referenceDateKey);
    if (monthDate.matched) {
      dateKey = monthDate.dateKey;
      invalidDate = monthDate.invalidDate;
    } else {
      dateKey = explicitDayDate(text, referenceDateKey);
    }
    precision = dateKey ? "day" : null;
  }

  if (dateKey) {
    rangeStartKey = dateKey;
    rangeEndKey = addDateKeyDays(dateKey, 1);
  }

  return {
    dateKey,
    rangeStartKey,
    rangeEndKey,
    precision,
    invalidDate
  };
}

export function parseDateRange(command, {
  now = new Date(),
  timezone = "UTC"
} = {}) {
  const referenceDateKey = dateKeyInZone(now, timezone);
  const keys = dateRangeKeys(command, referenceDateKey);
  const safeRange = parseInvalidDateSafe(keys, timezone);
  return {
    dateKey: keys.dateKey,
    rangeStart: safeRange.rangeStart,
    rangeEnd: safeRange.rangeEnd,
    precision: keys.precision,
    invalidDate: keys.invalidDate,
    referenceDateKey
  };
}

function stripTitleNoise(command, { stripParticipantPhrase = true } = {}) {
  let title = normaliseCommand(command)
    .replace(/^(?:create|add|schedule)(?:\s+(?:an?\s+)?event)?\s+/i, "")
    .replace(/^meet\s+/i, "");
  if (stripParticipantPhrase) {
    title = title.replace(
      /\bwith\s+.+?(?=\s+(?:today|tomorrow|on|this|next|at|from|for|after|before|morning|afternoon|evening|weekend|week)\b|$)/i,
      ""
    );
  }
  return title
    .replace(/\b(?:today|tomorrow|this weekend|next week)\b/gi, "")
    .replace(new RegExp(`\\b(?:next\\s+)?(?:${weekdayNames.join("|")})\\b`, "gi"), "")
    .replace(new RegExp(`\\b(?:on\\s+)?\\d{1,2}(?:st|nd|rd|th)?\\s+(?:${monthNames.join("|")})(?:\\s+\\d{4})?\\b`, "gi"), "")
    .replace(new RegExp(`\\b(?:on\\s+)?(?:${monthNames.join("|")})\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{4})?\\b`, "gi"), "")
    .replace(/\bfrom\s+\d{1,2}(?::[0-5]\d)?\s*(?:am|pm)?\s+(?:to|-)\s+\d{1,2}(?::[0-5]\d)?\s*(?:am|pm)?\b/gi, "")
    .replace(/\b(?:at|to)\s+\d{1,2}(?::[0-5]\d)?\s*(?:am|pm)?\b/gi, "")
    .replace(/\bfor\s+(?:half an? hour|an hour|one hour|two hours|three hours|\d+(?:\.\d+)?\s*(?:hours?|hrs?|hr|minutes?|mins?|min))\b/gi, "")
    .replace(/\ball day\b/gi, "")
    .replace(/\b(?:morning|afternoon|evening)\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/^[,;:\s-]+|[,;:\s-]+$/g, "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

function detectIntent(text) {
  if (/^(?:move|reschedule)\b/.test(text)) return "move_event";
  if (/^(?:create|add|schedule|meet)\b/.test(text)) return "create_event";
  if (isGoogleConnectCommand(text)) return "connect_google";
  if (isRoomCodeCommand(text)) return "update_room_code";
  if (isViewCommand(text)) return "navigate_view";
  if (navigationAliasPattern().test(text)) return "navigate";
  if (/^(?:when is|when are|show when|highlight)\b/.test(text)) return "show_availability";
  if (/^when can\b.+\bmeet\b/.test(text)) return "find_time";
  if (/^find\b/.test(text)) {
    if (/\b(?:hour|hours|minute|minutes|mins|free|time|slot)\b/.test(text)) return "find_time";
    return "navigate";
  }
  if (/^(?:show)\b/.test(text) && /\bfree\b/.test(text)) return "show_availability";
  if (/\b(?:today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/.test(text) && /\b(?:at|from)\b/.test(text)) {
    return "create_event";
  }
  return "unsupported";
}

function moveEventQuery(command) {
  return normaliseCommand(command)
    .replace(/^(?:move|reschedule)\s+/i, "")
    .split(/\s+\bto\b\s+/i)[0]
    .trim();
}

function afterTimeMinute(text) {
  const match = text.match(/\bafter\s+(\d{1,2})(?::([0-5]\d))?\s*(am|pm)?\b/);
  return match ? clockMatchToMinute(match[1], match[2], match[3]) : null;
}

export function parseCommand(command, {
  now = new Date(),
  timezone = "UTC",
  members = [],
  currentParticipantId = null
} = {}) {
  const original = normaliseCommand(command);
  const text = normaliseMatch(original);
  if (!text || text.length < 2) {
    return { intent: "unsupported", confidence: 0, reason: intentHelp };
  }

  const intent = detectIntent(text);
  const participants = resolveParticipants(original, members, currentParticipantId);
  const date = parseDateRange(original, { now, timezone });
  const time = parseTime(original);
  const parsedDuration = parseDuration(original);
  const durationMinutes = parsedDuration || (
    time.startMinute !== null && time.endMinute !== null
      ? time.endMinute - time.startMinute
      : null
  );
  const base = {
    intent,
    confidence: intent === "unsupported" ? 0.1 : 0.86,
    participantIds: participants.participantIds,
    missingFields: [],
    ambiguities: [...participants.ambiguities],
    unmatchedParticipants: participants.unmatched
  };

  if (intent === "unsupported") {
    return { intent, confidence: base.confidence, reason: intentHelp };
  }

  applyDateAmbiguity(base, date);

  if (intent === "navigate_view") return parseViewIntent(base, text);
  if (intent === "connect_google") return parseGoogleIntent(base);
  if (intent === "update_room_code") return parseRoomCodeIntent(base, original);

  if (intent === "create_event") {
    const allDay = /\ball day\b/.test(text);
    const title = stripTitleNoise(original, {
      stripParticipantPhrase: participants.unmatched.length === 0
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
      title: title || (
        namedParticipants.length
          ? `Meeting with ${namedParticipants.map((member) => member.displayName.split(" ")[0]).join(" and ")}`
          : "New event"
      ),
      start: start?.toISOString() || null,
      end: end?.toISOString() || null,
      durationMinutes: resolvedDuration,
      dateKey: date.dateKey,
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
    return {
      ...base,
      rangeStart: date.rangeStart,
      rangeEnd: date.rangeEnd,
      durationMinutes: resolvedDuration,
      timeOfDay: time.timeOfDay,
      earliestMinute: window?.startMinute ?? afterTimeMinute(text) ?? 8 * 60,
      latestMinute: window?.endMinute ?? 21 * 60
    };
  }

  if (intent === "move_event") {
    const eventQuery = moveEventQuery(original);
    if (!eventQuery) base.missingFields.push("event");
    if (!date.dateKey && time.startMinute === null) base.missingFields.push("target_date_or_time");
    return {
      ...base,
      eventQuery,
      eventCandidates: [],
      targetDateKey: date.dateKey,
      targetStartMinute: time.startMinute,
      durationMinutes,
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
      score
    }));
}

export function completeMoveTarget(result, candidate, timezone = "UTC") {
  if (!result || result.intent !== "move_event" || !candidate) return result;
  const originalStart = new Date(candidate.start);
  const originalEnd = new Date(candidate.end);
  const durationMinutes = result.durationMinutes || Math.max(
    15,
    Math.round((originalEnd.getTime() - originalStart.getTime()) / 60000)
  );
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
