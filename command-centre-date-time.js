const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;

export const commandTimeWindows = Object.freeze({
  morning: Object.freeze({ startMinute: 8 * 60, endMinute: 12 * 60 }),
  afternoon: Object.freeze({ startMinute: 12 * 60, endMinute: 17 * 60 }),
  evening: Object.freeze({ startMinute: 17 * 60, endMinute: 21 * 60 })
});

export const weekdayNames = Object.freeze([
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
]);

export const monthNames = Object.freeze([
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december"
]);

export function assertTimezone(timezone = "UTC") {
  const value = String(timezone || "UTC").trim() || "UTC";
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: value }).format();
    return value;
  } catch {
    throw new Error("Choose a valid IANA timezone.");
  }
}

export function zonedParts(value, timezone = "UTC") {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error("Choose a valid date.");
  const timeZone = assertTimezone(timezone);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second)
  };
}

export function formatDateKey(parts) {
  return [
    String(parts.year).padStart(4, "0"),
    String(parts.month).padStart(2, "0"),
    String(parts.day).padStart(2, "0")
  ].join("-");
}

export function dateKeyInZone(value, timezone = "UTC") {
  return formatDateKey(zonedParts(value, timezone));
}

export function parseDateKey(value) {
  const text = String(value || "").trim();
  if (!dateKeyPattern.test(text)) return null;
  const [year, month, day] = text.split("-").map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

export function addDateKeyDays(dateKey, amount) {
  const parts = parseDateKey(dateKey);
  if (!parts) throw new Error("Choose a valid date.");
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + Number(amount || 0)));
  return formatDateKey({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  });
}

export function weekdayForDateKey(dateKey) {
  const parts = parseDateKey(dateKey);
  if (!parts) throw new Error("Choose a valid date.");
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
}

export function startOfIsoWeekDateKey(dateKey) {
  const weekday = weekdayForDateKey(dateKey);
  const offset = weekday === 0 ? -6 : 1 - weekday;
  return addDateKeyDays(dateKey, offset);
}

export function nextWeekdayDateKey(dateKey, weekday, { includeToday = true } = {}) {
  const current = weekdayForDateKey(dateKey);
  let offset = (Number(weekday) - current + 7) % 7;
  if (!includeToday && offset === 0) offset = 7;
  return addDateKeyDays(dateKey, offset);
}

export function zonedDateTimeToDate({
  year,
  month,
  day,
  hour = 0,
  minute = 0,
  second = 0
}, timezone = "UTC") {
  const timeZone = assertTimezone(timezone);
  const targetUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  let guess = targetUtc;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const actual = zonedParts(new Date(guess), timeZone);
    const actualUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second
    );
    const adjustment = targetUtc - actualUtc;
    guess += adjustment;
    if (adjustment === 0) break;
  }

  const result = new Date(guess);
  const finalParts = zonedParts(result, timeZone);
  if (
    finalParts.year !== year ||
    finalParts.month !== month ||
    finalParts.day !== day ||
    finalParts.hour !== hour ||
    finalParts.minute !== minute
  ) {
    throw new Error("That local time does not exist in the selected timezone.");
  }
  return result;
}

export function dateAtMinute(dateKey, minuteOfDay, timezone = "UTC") {
  const parts = parseDateKey(dateKey);
  if (!parts) throw new Error("Choose a valid date.");
  const minute = Math.max(0, Math.min(24 * 60, Number(minuteOfDay)));
  if (minute === 24 * 60) {
    return dateAtMinute(addDateKeyDays(dateKey, 1), 0, timezone);
  }
  return zonedDateTimeToDate({
    ...parts,
    hour: Math.floor(minute / 60),
    minute: minute % 60
  }, timezone);
}

export function minuteOfDayInZone(value, timezone = "UTC") {
  const parts = zonedParts(value, timezone);
  return parts.hour * 60 + parts.minute;
}

export function dateRangeForKey(dateKey, timezone = "UTC") {
  return {
    start: dateAtMinute(dateKey, 0, timezone),
    end: dateAtMinute(addDateKeyDays(dateKey, 1), 0, timezone)
  };
}

export function formatLocalInputValue(value, timezone = "UTC") {
  const parts = zonedParts(value, timezone);
  return `${formatDateKey(parts)}T${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

export function parseClockHour(rawHour, suffix = "", {
  preferAfternoon = true
} = {}) {
  let hour = Number(rawHour);
  if (!Number.isFinite(hour) || hour < 0 || hour > 24) return null;
  const meridiem = String(suffix || "").toLowerCase();
  if (meridiem === "am") {
    if (hour === 12) hour = 0;
  } else if (meridiem === "pm") {
    if (hour < 12) hour += 12;
  } else if (preferAfternoon && hour >= 1 && hour <= 7) {
    hour += 12;
  }
  if (hour === 24) hour = 0;
  return hour;
}

export function formatTimeLabel(value, timezone = "UTC") {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: assertTimezone(timezone),
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).format(value instanceof Date ? value : new Date(value));
}

export function formatDateLabel(value, timezone = "UTC") {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: assertTimezone(timezone),
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(value instanceof Date ? value : new Date(value));
}
