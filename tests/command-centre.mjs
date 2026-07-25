import assert from "node:assert/strict";
import {
  completeMoveTarget,
  parseCommand,
  parseDuration,
  resolveEventCandidates,
  resolveParticipants
} from "../command-centre-parser.js";
import {
  calculateAvailableSlots,
  findConflicts,
  mergeBusyIntervals
} from "../command-centre-scheduling.js";
import {
  dateAtMinute,
  dateKeyInZone
} from "../command-centre-date-time.js";

const now = new Date("2026-07-20T10:00:00.000Z");
const timezone = "Europe/London";
const members = [
  { id: "me", displayName: "Aryan Dhawan" },
  { id: "sam", displayName: "Sam Carter" },
  { id: "matthew", displayName: "Matthew Bell" },
  { id: "alex", displayName: "Alex Morgan" }
];
const options = { now, timezone, members, currentParticipantId: "me" };

const lunch = parseCommand("Lunch with Sam tomorrow at 1", options);
assert.equal(lunch.intent, "create_event");
assert.equal(lunch.title, "Lunch");
assert.deepEqual(lunch.participantIds, ["sam"]);
assert.equal(lunch.durationMinutes, 60);
assert.equal(dateKeyInZone(lunch.start, timezone), "2026-07-21");
assert.equal(new Date(lunch.start).toISOString(), "2026-07-21T12:00:00.000Z");

const dinner = parseCommand("Dinner with Matthew next Saturday from 7 to 9pm", options);
assert.equal(dinner.intent, "create_event");
assert.equal(dinner.title, "Dinner");
assert.equal(dinner.durationMinutes, 120);
assert.equal(new Date(dinner.start).toISOString(), "2026-07-25T18:00:00.000Z");
assert.equal(new Date(dinner.end).toISOString(), "2026-07-25T20:00:00.000Z");

const revision = parseCommand("Economics revision Friday at 4 for 90 minutes", options);
assert.equal(revision.intent, "create_event");
assert.equal(revision.title, "Economics revision");
assert.equal(revision.durationMinutes, 90);
assert.equal(new Date(revision.start).toISOString(), "2026-07-24T15:00:00.000Z");

const football = parseCommand("Create football on 18 August at 3pm", options);
assert.equal(football.title, "football");
assert.equal(dateKeyInZone(football.start, timezone), "2026-08-18");
assert.equal(new Date(football.start).toISOString(), "2026-08-18T14:00:00.000Z");

const allDay = parseCommand("Create away day on 18 August all day", options);
assert.equal(allDay.intent, "create_event");
assert.equal(allDay.title, "away day");
assert.equal(allDay.allDay, true);
assert.ok(!allDay.missingFields.includes("start_time"));
assert.equal(dateKeyInZone(allDay.start, timezone), "2026-08-18");
assert.equal(dateKeyInZone(new Date(new Date(allDay.end).getTime() - 1), timezone), "2026-08-18");

const findMatthew = parseCommand("Find an hour for me and Matthew next Tuesday afternoon", options);
assert.equal(findMatthew.intent, "find_time");
assert.deepEqual(new Set(findMatthew.participantIds), new Set(["me", "matthew"]));
assert.equal(findMatthew.durationMinutes, 60);
assert.equal(findMatthew.timeOfDay, "afternoon");
assert.equal(findMatthew.earliestMinute, 12 * 60);
assert.equal(findMatthew.latestMinute, 17 * 60);

const weekend = parseCommand("Find 90 minutes for Alex and Sam this weekend", options);
assert.equal(weekend.intent, "find_time");
assert.deepEqual(new Set(weekend.participantIds), new Set(["alex", "sam"]));
assert.equal(weekend.durationMinutes, 90);
assert.equal(dateKeyInZone(weekend.rangeStart, timezone), "2026-07-25");
assert.equal(dateKeyInZone(new Date(new Date(weekend.rangeEnd).getTime() - 1), timezone), "2026-07-26");

const bothFree = parseCommand("When are Alex and Sam both free next week?", options);
assert.equal(bothFree.intent, "show_availability");
assert.deepEqual(new Set(bothFree.participantIds), new Set(["alex", "sam"]));
assert.equal(dateKeyInZone(bothFree.rangeStart, timezone), "2026-07-27");

const move = parseCommand("Move economics revision to Friday at 4", options);
assert.equal(move.intent, "move_event");
assert.equal(move.eventQuery, "economics revision");
assert.equal(move.targetDateKey, "2026-07-24");
assert.equal(move.targetStartMinute, 16 * 60);

const openAugust = parseCommand("Open August", options);
assert.equal(openAugust.intent, "navigate");
assert.equal(openAugust.targetDate, "2026-08-01");
assert.equal(openAugust.targetView, "month");

const augustFifteenth = parseCommand("Go to August 15th", options);
assert.equal(augustFifteenth.intent, "navigate");
assert.equal(augustFifteenth.targetDate, "2026-08-15");
assert.equal(augustFifteenth.targetView, "week");

const showTomorrow = parseCommand("Show me tomorrow", options);
assert.equal(showTomorrow.intent, "navigate");
assert.equal(showTomorrow.targetDate, "2026-07-21");
assert.equal(showTomorrow.targetView, "week");

const jumpMonday = parseCommand("Jump to next Monday", options);
assert.equal(jumpMonday.intent, "navigate");
assert.equal(jumpMonday.targetDate, "2026-07-27");

for (const view of ["day", "week", "month", "year"]) {
  const viewCommand = parseCommand(`Switch to ${view} view`, options);
  assert.equal(viewCommand.intent, "navigate_view");
  assert.equal(viewCommand.targetView, view);
}

const openSettings = parseCommand("Open settings", options);
assert.equal(openSettings.intent, "navigate_view");
assert.equal(openSettings.targetView, "settings");

const connectGoogle = parseCommand("Connect my Google Calendar", options);
assert.equal(connectGoogle.intent, "connect_google");
assert.equal(connectGoogle.provider, "google");
assert.equal(connectGoogle.requiresUserAction, true);
assert.equal(parseCommand("Sync Google Cal", options).intent, "connect_google");
assert.equal(parseCommand("Disconnect Google Calendar", options).intent, "unsupported");

const updateRoomCode = parseCommand("Change room code to ABC234", options);
assert.equal(updateRoomCode.intent, "update_room_code");
assert.equal(updateRoomCode.newRoomCode, "ABC234");
assert.equal(updateRoomCode.requiresConfirmation, true);

const missingRoomCode = parseCommand("Set custom room code", options);
assert.equal(missingRoomCode.intent, "update_room_code");
assert.ok(missingRoomCode.missingFields.includes("room_code"));

const invalidRoomCode = parseCommand("Change room code to commonground-dev", options);
assert.equal(invalidRoomCode.intent, "update_room_code");
assert.equal(invalidRoomCode.ambiguities[0].type, "invalid_room_code");

const impossibleDate = parseCommand("Go to 31 February", options);
assert.equal(impossibleDate.intent, "navigate");
assert.equal(impossibleDate.targetDate, null);
assert.equal(impossibleDate.ambiguities[0].type, "invalid_date");

const leapDate = parseCommand("Go to February 29th 2028", options);
assert.equal(leapDate.targetDate, "2028-02-29");
const nonLeapDate = parseCommand("Go to February 29th 2027", options);
assert.equal(nonLeapDate.targetDate, null);
assert.equal(nonLeapDate.ambiguities[0].type, "invalid_date");

const designReview = parseCommand("Create event 'Design Review' tomorrow at 10 AM", options);
assert.equal(designReview.intent, "create_event");
assert.equal(designReview.title, "Design Review");

const settingsReview = parseCommand("Create settings review tomorrow at 2", options);
assert.equal(settingsReview.intent, "create_event");
assert.equal(settingsReview.title, "settings review");

const googlePlanning = parseCommand("Create Google sync planning tomorrow at 2", options);
assert.equal(googlePlanning.intent, "create_event");
assert.equal(googlePlanning.title, "Google sync planning");

const ambiguousCreate = parseCommand("Meet Sam next week", options);
assert.equal(ambiguousCreate.intent, "create_event");
assert.ok(ambiguousCreate.missingFields.includes("date"));
assert.ok(ambiguousCreate.missingFields.includes("start_time"));
assert.equal(ambiguousCreate.start, null);

const unsupported = parseCommand("Recommend a restaurant near me", options);
assert.equal(unsupported.intent, "unsupported");
assert.match(unsupported.reason, /create events, find shared free time, show availability, move events and navigate/i);
assert.equal(parseDuration("Find time with Matthew tomorrow"), null);

const fuzzyParticipant = resolveParticipants(
  "Find an hour with Mathew next week",
  members,
  "me"
);
assert.deepEqual(fuzzyParticipant.participantIds, ["matthew"]);

const duplicateParticipant = resolveParticipants(
  "Lunch with Sam tomorrow",
  [
    { id: "sam-one", displayName: "Sam Carter" },
    { id: "sam-two", displayName: "Sam Wilson" }
  ],
  "me"
);
assert.deepEqual(duplicateParticipant.participantIds, []);
assert.equal(duplicateParticipant.ambiguities[0].type, "participant");
assert.equal(duplicateParticipant.ambiguities[0].options.length, 2);

const duplicateJohnCommand = parseCommand(
  "Schedule a meeting with John tomorrow at 3",
  {
    ...options,
    members: [
      ...members,
      { id: "john-one", displayName: "John Smith" },
      { id: "john-two", displayName: "John Jones" }
    ]
  }
);
assert.equal(duplicateJohnCommand.intent, "create_event");
assert.equal(duplicateJohnCommand.ambiguities[0].type, "participant");
assert.equal(duplicateJohnCommand.ambiguities[0].options.length, 2);

const eventCandidates = resolveEventCandidates("economics revision", [
  {
    id: "event-one",
    title: "Economics revision",
    start: "2026-07-22T15:00:00.000Z",
    end: "2026-07-22T16:00:00.000Z",
    createdByParticipantId: "me",
    updatedAt: "2026-07-20T11:00:00.000Z"
  },
  {
    id: "event-two",
    title: "Economics revision",
    start: "2026-07-23T15:00:00.000Z",
    end: "2026-07-23T16:00:00.000Z",
    createdByParticipantId: "me",
    updatedAt: "2026-07-20T11:01:00.000Z"
  }
], { participantId: "me" });
assert.equal(eventCandidates.length, 2);

const focusedEventCandidates = resolveEventCandidates("economics revision edited", [
  {
    id: "event-edited",
    title: "Economics revision edited",
    start: "2026-07-22T15:00:00.000Z",
    end: "2026-07-22T16:00:00.000Z",
    createdByParticipantId: "me"
  },
  {
    id: "unrelated-event",
    title: "Availability booking",
    start: "2026-07-22T08:00:00.000Z",
    end: "2026-07-22T09:00:00.000Z",
    createdByParticipantId: "me"
  }
], { participantId: "me" });
assert.deepEqual(focusedEventCandidates.map((candidate) => candidate.id), ["event-edited"]);

const fuzzyEventCandidates = resolveEventCandidates("economcs revison", [
  {
    id: "fuzzy-event",
    title: "Economics revision",
    start: "2026-07-22T15:00:00.000Z",
    end: "2026-07-22T16:00:00.000Z",
    createdByParticipantId: "me"
  }
], { participantId: "me" });
assert.deepEqual(fuzzyEventCandidates.map((candidate) => candidate.id), ["fuzzy-event"]);

const completedMove = completeMoveTarget(move, eventCandidates[0], timezone);
assert.equal(new Date(completedMove.targetStart).toISOString(), "2026-07-24T15:00:00.000Z");
assert.equal(new Date(completedMove.targetEnd).toISOString(), "2026-07-24T16:00:00.000Z");

const merged = mergeBusyIntervals([
  { start: "2026-07-21T09:00:00.000Z", end: "2026-07-21T10:00:00.000Z", participantId: "sam" },
  { start: "2026-07-21T09:30:00.000Z", end: "2026-07-21T11:00:00.000Z", participantId: "alex" },
  { start: "2026-07-21T12:00:00.000Z", end: "2026-07-21T12:30:00.000Z", participantId: "sam" }
]);
assert.equal(merged.length, 2);
assert.equal(merged[0].start, "2026-07-21T09:00:00.000Z");
assert.equal(merged[0].end, "2026-07-21T11:00:00.000Z");
assert.deepEqual(new Set(merged[0].participantIds), new Set(["sam", "alex"]));

const availability = calculateAvailableSlots({
  rangeStart: "2026-07-21T07:00:00.000Z",
  rangeEnd: "2026-07-21T20:00:00.000Z",
  timezone,
  durationMinutes: 60,
  earliestMinute: 8 * 60,
  latestMinute: 21 * 60,
  busyIntervals: [
    { start: "2026-07-21T07:00:00.000Z", end: "2026-07-21T10:00:00.000Z", participantId: "sam" },
    { start: "2026-07-21T10:00:00.000Z", end: "2026-07-21T11:00:00.000Z", participantId: "alex" }
  ]
});
assert.equal(availability.slots[0].start, "2026-07-21T11:00:00.000Z");
assert.equal(availability.slots[0].end, "2026-07-21T12:00:00.000Z");

const noAvailability = calculateAvailableSlots({
  rangeStart: "2026-07-21T07:00:00.000Z",
  rangeEnd: "2026-07-21T20:00:00.000Z",
  timezone,
  durationMinutes: 60,
  busyIntervals: [
    { start: "2026-07-21T07:00:00.000Z", end: "2026-07-21T20:00:00.000Z", participantId: "sam" }
  ]
});
assert.deepEqual(noAvailability.slots, []);

assert.equal(findConflicts({
  start: "2026-07-21T09:30:00.000Z",
  end: "2026-07-21T10:30:00.000Z",
  busyIntervals: merged
}).length, 1);

const springDayStart = dateAtMinute("2026-03-29", 0, timezone);
const springDayEnd = dateAtMinute("2026-03-30", 0, timezone);
assert.equal(springDayEnd.getTime() - springDayStart.getTime(), 23 * 60 * 60 * 1000);
assert.throws(
  () => dateAtMinute("2026-03-29", 90, timezone),
  /does not exist/
);

const autumnDayStart = dateAtMinute("2026-10-25", 0, timezone);
const autumnDayEnd = dateAtMinute("2026-10-26", 0, timezone);
assert.equal(autumnDayEnd.getTime() - autumnDayStart.getTime(), 25 * 60 * 60 * 1000);

console.log("CommonGround Command Centre unit checks passed.");
