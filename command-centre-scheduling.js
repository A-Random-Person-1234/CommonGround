import {
  addDateKeyDays,
  commandTimeWindows,
  dateAtMinute,
  dateKeyInZone,
  parseDateKey
} from "./command-centre-date-time.js";

const fifteenMinutesMs = 15 * 60 * 1000;

function validInterval(interval) {
  const start = new Date(interval?.start);
  const end = new Date(interval?.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null;
  return {
    ...interval,
    start: start.toISOString(),
    end: end.toISOString(),
    startMs: start.getTime(),
    endMs: end.getTime()
  };
}

export function mergeBusyIntervals(intervals = [], {
  rangeStart = null,
  rangeEnd = null
} = {}) {
  const lower = rangeStart ? new Date(rangeStart).getTime() : Number.NEGATIVE_INFINITY;
  const upper = rangeEnd ? new Date(rangeEnd).getTime() : Number.POSITIVE_INFINITY;
  const normalized = intervals
    .map(validInterval)
    .filter(Boolean)
    .map((interval) => ({
      ...interval,
      startMs: Math.max(interval.startMs, lower),
      endMs: Math.min(interval.endMs, upper)
    }))
    .filter((interval) => interval.endMs > interval.startMs)
    .sort((left, right) => left.startMs - right.startMs || left.endMs - right.endMs);

  const merged = [];
  for (const interval of normalized) {
    const previous = merged.at(-1);
    if (previous && interval.startMs <= previous.endMs) {
      previous.endMs = Math.max(previous.endMs, interval.endMs);
      previous.end = new Date(previous.endMs).toISOString();
      previous.participantIds = [...new Set([
        ...(previous.participantIds || []),
        ...(interval.participantIds || []),
        interval.participantId
      ].filter(Boolean))];
      continue;
    }
    merged.push({
      start: new Date(interval.startMs).toISOString(),
      end: new Date(interval.endMs).toISOString(),
      startMs: interval.startMs,
      endMs: interval.endMs,
      participantIds: [...new Set([
        ...(interval.participantIds || []),
        interval.participantId
      ].filter(Boolean))]
    });
  }
  return merged.map(({ startMs, endMs, ...interval }) => interval);
}

export function subtractBusyIntervals(windowStart, windowEnd, intervals = []) {
  const startMs = new Date(windowStart).getTime();
  const endMs = new Date(windowEnd).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return [];
  const merged = mergeBusyIntervals(intervals, { rangeStart: windowStart, rangeEnd: windowEnd });
  const free = [];
  let cursor = startMs;
  for (const interval of merged) {
    const busyStart = new Date(interval.start).getTime();
    const busyEnd = new Date(interval.end).getTime();
    if (busyStart > cursor) {
      free.push({
        start: new Date(cursor).toISOString(),
        end: new Date(busyStart).toISOString()
      });
    }
    cursor = Math.max(cursor, busyEnd);
  }
  if (cursor < endMs) {
    free.push({
      start: new Date(cursor).toISOString(),
      end: new Date(endMs).toISOString()
    });
  }
  return free;
}

function ceilToSnap(milliseconds, snapMs = fifteenMinutesMs) {
  return Math.ceil(milliseconds / snapMs) * snapMs;
}

function dailyWindow(dateKey, timezone, earliestMinute, latestMinute) {
  return {
    start: dateAtMinute(dateKey, earliestMinute, timezone),
    end: dateAtMinute(dateKey, latestMinute, timezone)
  };
}

export function calculateAvailableSlots({
  rangeStart,
  rangeEnd,
  timezone = "UTC",
  durationMinutes = 60,
  earliestMinute = 8 * 60,
  latestMinute = 21 * 60,
  timeOfDay = null,
  busyIntervals = [],
  limit = 5,
  includeEveryCandidate = false
} = {}) {
  const rangeStartDate = new Date(rangeStart);
  const rangeEndDate = new Date(rangeEnd);
  const duration = Math.max(15, Math.round(Number(durationMinutes || 60) / 15) * 15);
  if (
    Number.isNaN(rangeStartDate.getTime()) ||
    Number.isNaN(rangeEndDate.getTime()) ||
    rangeEndDate <= rangeStartDate
  ) {
    throw new Error("Choose a valid availability range.");
  }

  const preference = commandTimeWindows[timeOfDay] || null;
  const allowedStartMinute = Math.max(0, preference ? preference.startMinute : Number(earliestMinute));
  const allowedEndMinute = Math.min(24 * 60, preference ? preference.endMinute : Number(latestMinute));
  if (allowedEndMinute <= allowedStartMinute) {
    throw new Error("The latest time must be after the earliest time.");
  }

  const mergedBusy = mergeBusyIntervals(busyIntervals, {
    rangeStart: rangeStartDate,
    rangeEnd: rangeEndDate
  });
  const freeIntervals = [];
  const slots = [];
  let dateKey = dateKeyInZone(rangeStartDate, timezone);
  const finalDateKey = dateKeyInZone(new Date(rangeEndDate.getTime() - 1), timezone);

  for (let guard = 0; guard < 400; guard += 1) {
    if (!parseDateKey(dateKey) || dateKey > finalDateKey) break;
    const window = dailyWindow(dateKey, timezone, allowedStartMinute, allowedEndMinute);
    const windowStartMs = Math.max(window.start.getTime(), rangeStartDate.getTime());
    const windowEndMs = Math.min(window.end.getTime(), rangeEndDate.getTime());
    if (windowEndMs > windowStartMs) {
      const dayFree = subtractBusyIntervals(
        new Date(windowStartMs),
        new Date(windowEndMs),
        mergedBusy
      );
      for (const interval of dayFree) {
        const freeStartMs = new Date(interval.start).getTime();
        const freeEndMs = new Date(interval.end).getTime();
        if (freeEndMs - freeStartMs < duration * 60 * 1000) continue;
        freeIntervals.push(interval);
        let candidateStartMs = ceilToSnap(freeStartMs);
        while (candidateStartMs + duration * 60 * 1000 <= freeEndMs) {
          slots.push({
            start: new Date(candidateStartMs).toISOString(),
            end: new Date(candidateStartMs + duration * 60 * 1000).toISOString(),
            durationMinutes: duration,
            dateKey
          });
          if (!includeEveryCandidate) break;
          candidateStartMs += 30 * 60 * 1000;
        }
      }
    }
    if (dateKey === finalDateKey) break;
    dateKey = addDateKeyDays(dateKey, 1);
  }

  return {
    slots: slots.slice(0, Math.max(1, Math.min(20, Number(limit || 5)))),
    freeIntervals,
    durationMinutes: duration,
    timeOfDay,
    rangeStart: rangeStartDate.toISOString(),
    rangeEnd: rangeEndDate.toISOString()
  };
}

export function findConflicts({
  start,
  end,
  busyIntervals = []
} = {}) {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    throw new Error("Choose a valid event time.");
  }
  return busyIntervals
    .map(validInterval)
    .filter(Boolean)
    .filter((interval) => interval.startMs < endMs && interval.endMs > startMs)
    .map(({ startMs: _startMs, endMs: _endMs, ...interval }) => interval);
}
