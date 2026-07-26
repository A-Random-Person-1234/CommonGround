import assert from "node:assert/strict";
import {
  completeMoveTarget,
  normaliseCommandLanguage,
  parseCommand,
  parseDateRange,
  parseDuration,
  parseTime,
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
import {
  matchCommandViewKeyword,
  predictCommand
} from "../public/command-centre-predictor.js";

const now = new Date("2026-07-20T10:00:00.000Z");
const timezone = "Europe/London";
const members = [
  { id: "me", displayName: "Aryan Dhawan" },
  { id: "sam", displayName: "Sam Carter" },
  { id: "matthew", displayName: "Matthew Bell" },
  { id: "alex", displayName: "Alex Morgan" }
];
const options = { now, timezone, members, currentParticipantId: "me" };

const genericCreate = parseCommand("Create an event", options);
assert.equal(genericCreate.intent, "create_event");
assert.equal(genericCreate.title, "");
assert.ok(genericCreate.missingFields.includes("title"));

const navigatedCreate = parseCommand("event at 4pm this sunday", options);
assert.equal(navigatedCreate.intent, "create_event");
assert.equal(navigatedCreate.title, "New event");
assert.ok(navigatedCreate.missingFields.includes("title"));
assert.equal(dateKeyInZone(navigatedCreate.start, timezone), "2026-07-26");
assert.equal(new Date(navigatedCreate.start).toISOString(), "2026-07-26T15:00:00.000Z");

const titledEventCreate = parseCommand("event planning at 4pm this sunday", options);
assert.equal(titledEventCreate.title, "event planning");

const onSundayCreate = parseCommand("event on Sunday at 4pm", options);
assert.equal(onSundayCreate.title, "New event");
assert.ok(onSundayCreate.missingFields.includes("title"));

const timeOnlyCreate = parseCommand("event at 4pm", options);
assert.equal(timeOnlyCreate.start, null);
assert.equal(timeOnlyCreate.startMinute, 16 * 60);

const lunch = parseCommand("Lunch with Sam tomorrow at 1", options);
assert.equal(lunch.intent, "create_event");
assert.equal(lunch.title, "Lunch");
assert.deepEqual(lunch.participantIds, ["sam"]);
assert.equal(lunch.durationMinutes, 60);
assert.equal(dateKeyInZone(lunch.start, timezone), "2026-07-21");
assert.equal(new Date(lunch.start).toISOString(), "2026-07-21T12:00:00.000Z");

const soloOptions = {
  ...options,
  members: [{ id: "me", displayName: "Aryan Dhawan" }]
};
const lunchWithExternalSam = parseCommand("Lunch with Sam tomorrow at 1", soloOptions);
assert.equal(lunchWithExternalSam.intent, "create_event");
assert.equal(lunchWithExternalSam.title, "Lunch with Sam");
assert.deepEqual(lunchWithExternalSam.participantIds, []);
assert.deepEqual(lunchWithExternalSam.unmatchedParticipants, ["sam"]);
assert.deepEqual(lunchWithExternalSam.ambiguities, []);
assert.equal(new Date(lunchWithExternalSam.start).toISOString(), "2026-07-21T12:00:00.000Z");

const unavailableExternalSam = parseCommand("Find time with Sam tomorrow", soloOptions);
assert.equal(unavailableExternalSam.intent, "find_time");
assert.equal(unavailableExternalSam.ambiguities[0].type, "participant_not_found");

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

const allRoomParticipantIds = new Set(members.map((member) => member.id));
for (const alias of [
  "everyone",
  "everyone in the room",
  "everybody",
  "the whole room",
  "all room members",
  "all members"
]) {
  const wholeRoom = parseCommand(`Find a time for ${alias}`, options);
  assert.equal(wholeRoom.intent, "find_time", `${alias} should request shared time`);
  assert.deepEqual(
    new Set(wholeRoom.participantIds),
    allRoomParticipantIds,
    `${alias} should resolve every room member`
  );
  assert.deepEqual(
    wholeRoom.unmatchedParticipants,
    [],
    `${alias} should not be treated as an unmatched participant`
  );
  assert.equal(
    wholeRoom.ambiguities.some((ambiguity) => ambiguity.type === "participant_not_found"),
    false,
    `${alias} should not create a participant-not-found ambiguity`
  );
}

const everyoneThisWeek = parseCommand("Find a time for everyone", options);
assert.equal(everyoneThisWeek.rangeKind, "default_current_week");
assert.equal(everyoneThisWeek.rangeStart, now.toISOString());
assert.equal(everyoneThisWeek.rangeEnd, "2026-07-26T23:00:00.000Z");
assert.ok(new Date(everyoneThisWeek.rangeStart) >= now);

const everyoneNextWeek = parseCommand("Find a time for everyone next week", options);
assert.equal(everyoneNextWeek.rangeKind, "next_week");
assert.equal(everyoneNextWeek.rangeStart, "2026-07-26T23:00:00.000Z");
assert.equal(everyoneNextWeek.rangeEnd, "2026-08-02T23:00:00.000Z");

const everyoneThisMonth = parseCommand("Find a time for everyone this month", options);
assert.equal(everyoneThisMonth.rangeKind, "current_month");
assert.equal(everyoneThisMonth.rangeStart, now.toISOString());
assert.equal(everyoneThisMonth.rangeEnd, "2026-07-31T23:00:00.000Z");

const everyoneAfterFive = parseCommand("Find a time for everyone any day after 5pm", options);
assert.equal(everyoneAfterFive.rangeKind, "default_current_week");
assert.equal(everyoneAfterFive.earliestMinute, 17 * 60);
assert.equal(everyoneAfterFive.latestMinute, 21 * 60);
assert.deepEqual(everyoneAfterFive.allowedWeekdays, []);

for (const command of [
  "Find a time for everyone Tue/Thu this month",
  "Find a time for everyone on Tuesdays and Thursdays this month",
  "Find a time for everyone Tuesdays, Thursdays this month",
  "Find a time for everyone Tuesdays & Thursdays this month"
]) {
  const tuesdayThursday = parseCommand(command, options);
  assert.equal(tuesdayThursday.intent, "find_time", `${command} should request shared time`);
  assert.equal(tuesdayThursday.rangeKind, "current_month");
  assert.deepEqual(
    tuesdayThursday.allowedWeekdays,
    [2, 4],
    `${command} should retain both weekday filters`
  );
}

const constrainedEveryone = parseCommand(
  "Find 30 minutes for everyone next week on weekdays after 5pm",
  options
);
assert.equal(constrainedEveryone.durationMinutes, 30);
assert.equal(constrainedEveryone.rangeKind, "next_week");
assert.equal(constrainedEveryone.rangeStart, "2026-07-26T23:00:00.000Z");
assert.equal(constrainedEveryone.rangeEnd, "2026-08-02T23:00:00.000Z");
assert.equal(constrainedEveryone.earliestMinute, 17 * 60);
assert.equal(constrainedEveryone.latestMinute, 21 * 60);
assert.deepEqual(constrainedEveryone.allowedWeekdays, [1, 2, 3, 4, 5]);
assert.deepEqual(new Set(constrainedEveryone.participantIds), allRoomParticipantIds);

const alexAnyDay = parseCommand("Find a time for Alex any day", options);
assert.deepEqual(alexAnyDay.participantIds, ["alex"]);
assert.deepEqual(alexAnyDay.unmatchedParticipants, []);
assert.deepEqual(alexAnyDay.ambiguities, []);

const excludedRoomMember = parseCommand(
  "Find a time for everyone except Sam this week",
  options
);
assert.deepEqual(new Set(excludedRoomMember.participantIds), allRoomParticipantIds);
assert.deepEqual(excludedRoomMember.unmatchedParticipants, []);
assert.equal(excludedRoomMember.ambiguities.length, 1);
assert.equal(excludedRoomMember.ambiguities[0].type, "participant_exclusion");

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

for (const command of ["settings", "setings", "settigns", "open setings"]) {
  const settingsCommand = parseCommand(command, options);
  assert.equal(settingsCommand.intent, "navigate_view", `${command} should open settings`);
  assert.equal(settingsCommand.targetView, "settings", `${command} should target settings`);
}

for (const command of ["set", "sett", "settings review", "asset", "upsetting"]) {
  assert.equal(
    parseCommand(command, options).intent,
    "unsupported",
    `${command} should not be treated as a settings command`
  );
}

assert.equal(matchCommandViewKeyword("settings")?.view, "settings");
assert.equal(matchCommandViewKeyword("setings")?.view, "settings");
assert.equal(matchCommandViewKeyword("settigns")?.corrected, "settings");
assert.equal(matchCommandViewKeyword("open setings")?.view, "settings");
assert.equal(matchCommandViewKeyword("set"), null);
assert.equal(matchCommandViewKeyword("settings review"), null);

const setPrediction = predictCommand("set");
assert.equal(setPrediction?.kind, "prefix");
assert.equal(setPrediction?.acceptedCommand, "settings");
assert.equal(setPrediction?.inlineSuffix, "tings");
assert.equal(setPrediction?.corrected, false);
assert.equal(predictCommand("set ")?.inlineSuffix, "");

const settPrediction = predictCommand("sett");
assert.equal(settPrediction?.acceptedCommand, "settings");
assert.equal(settPrediction?.inlineSuffix, "ings");

const openSetPrediction = predictCommand("open set");
assert.equal(openSetPrediction?.acceptedCommand, "open settings");
assert.equal(openSetPrediction?.inlineSuffix, "tings");

const typoPrediction = predictCommand("setings");
assert.equal(typoPrediction?.kind, "typo");
assert.equal(typoPrediction?.acceptedCommand, "settings");
assert.equal(typoPrediction?.inlineSuffix, "");
assert.equal(typoPrediction?.corrected, true);

const exactSettingsPrediction = predictCommand("settings");
assert.equal(exactSettingsPrediction?.kind, "exact");
assert.equal(exactSettingsPrediction?.label, "Open settings");
assert.equal(predictCommand("set room code"), null);
assert.equal(predictCommand("create set"), null);

assert.equal(
  predictCommand("conect googl calender")?.acceptedCommand,
  "connect Google Calendar"
);
assert.equal(
  predictCommand("please opn setings")?.acceptedCommand,
  "open settings"
);
assert.equal(
  predictCommand("could you fnd time")?.acceptedCommand,
  "find a time for everyone"
);

const memberPrediction = predictCommand("find time with my", {
  members: [{ id: "mylo", displayName: "Mylo Hart" }]
});
assert.equal(memberPrediction?.acceptedCommand, "find a time with Mylo");
assert.equal(memberPrediction?.label, "Find time with Mylo");

const eventPrediction = predictCommand("move design rev", {
  events: [{ id: "design-review", title: "Design Review" }]
});
assert.equal(eventPrediction?.acceptedCommand, "move Design Review");

const duplicateFirstNamePredictionContext = {
  members: [
    { id: "john-smith", displayName: "John Smith" },
    { id: "john-jones", displayName: "John Jones" }
  ]
};
assert.equal(
  predictCommand("find time with john", duplicateFirstNamePredictionContext),
  null,
  "A shared first name must not silently choose one room member."
);
assert.equal(
  predictCommand("find time with john sm", duplicateFirstNamePredictionContext)?.acceptedCommand,
  "find a time with John Smith"
);

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

const setRoomCode = parseCommand("Set room code to ABC234", options);
assert.equal(setRoomCode.intent, "update_room_code");
assert.equal(setRoomCode.newRoomCode, "ABC234");

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

const correctedLanguage = normaliseCommandLanguage(
  "Could you craete an evnt w/ Sam tmrw for 45 mins?"
);
assert.equal(
  correctedLanguage.text,
  "could you create an event with sam tomorrow for 45 minutes"
);
assert.deepEqual(
  correctedLanguage.corrections.map(({ from, to }) => `${from}:${to}`),
  ["craete:create", "evnt:event", "tmrw:tomorrow", "mins:minutes"]
);

const typoCreate = parseCommand(
  "craete lunch w/ Sam tmrw @ 1pm for 45 mins",
  options
);
assert.equal(typoCreate.intent, "create_event");
assert.equal(typoCreate.title, "lunch");
assert.deepEqual(typoCreate.participantIds, ["sam"]);
assert.equal(typoCreate.dateKey, "2026-07-21");
assert.equal(typoCreate.startMinute, 13 * 60);
assert.equal(typoCreate.durationMinutes, 45);
assert.ok(typoCreate.confidence < 0.9);
assert.equal(typoCreate.interpretation.normalised.includes("tomorrow"), true);

for (const verb of ["creat", "ceate", "craete", "cretae", "createe"]) {
  assert.equal(
    parseCommand(`${verb} planning tmrw at 2pm`, options).intent,
    "create_event",
    `${verb} should conservatively normalize to create`
  );
}
for (const verb of ["schedual", "scheduel", "scedule", "shcedule"]) {
  assert.equal(
    parseCommand(`${verb} planning tomorrow at 2pm`, options).intent,
    "create_event",
    `${verb} should conservatively normalize to schedule`
  );
}
for (const tomorrow of ["tmr", "tmrw", "tmw", "tomo", "tomorow", "tommorow", "2moro"]) {
  assert.equal(
    parseCommand(`create planning ${tomorrow} at 2pm`, options).dateKey,
    "2026-07-21",
    `${tomorrow} should normalize to tomorrow`
  );
}
for (const [misspelling, expectedDate] of [
  ["tueaday", "2026-07-21"],
  ["wednsday", "2026-07-22"],
  ["thurday", "2026-07-23"],
  ["friady", "2026-07-24"]
]) {
  assert.equal(
    parseCommand(`create planning on ${misspelling} at 2pm`, options).dateKey,
    expectedDate
  );
}

const politeTypoFind = parseCommand(
  "could you fnd an hr for evryone nxt wk after 5 p.m.",
  options
);
assert.equal(politeTypoFind.intent, "find_time");
assert.deepEqual(new Set(politeTypoFind.participantIds), allRoomParticipantIds);
assert.equal(politeTypoFind.durationMinutes, 60);
assert.equal(politeTypoFind.rangeKind, "next_week");
assert.equal(politeTypoFind.earliestMinute, 17 * 60);

const contractedAvailability = parseCommand(
  "when's everyone free nxt wk?",
  options
);
assert.equal(contractedAvailability.intent, "show_availability");
assert.equal(contractedAvailability.rangeKind, "next_week");
assert.deepEqual(new Set(contractedAvailability.participantIds), allRoomParticipantIds);

const contractedRoomAvailability = parseCommand("when're we free nxt wk?", options);
assert.equal(contractedRoomAvailability.intent, "show_availability");
assert.deepEqual(
  new Set(contractedRoomAvailability.participantIds),
  allRoomParticipantIds
);

const contractedCreate = parseCommand(
  "Let's meet Sam tomorrow at quarter past 4",
  options
);
assert.equal(contractedCreate.intent, "create_event");
assert.deepEqual(contractedCreate.participantIds, ["sam"]);
assert.equal(contractedCreate.startMinute, 16 * 60 + 15);

const typoGoogle = parseCommand("conect my googel calender", options);
assert.equal(typoGoogle.intent, "connect_google");
assert.equal(typoGoogle.provider, "google");

const typoNamedDate = parseCommand("opne the 15th of Aug", options);
assert.equal(typoNamedDate.intent, "navigate");
assert.equal(typoNamedDate.targetDate, "2026-08-15");

const typoCreateWithRichTime = parseCommand(
  "schedual a meetng with Mathew day after tomorrow at half past 3 for an hour and a half",
  options
);
assert.equal(typoCreateWithRichTime.intent, "create_event");
assert.deepEqual(typoCreateWithRichTime.participantIds, ["matthew"]);
assert.equal(typoCreateWithRichTime.dateKey, "2026-07-22");
assert.equal(typoCreateWithRichTime.startMinute, 15 * 60 + 30);
assert.equal(typoCreateWithRichTime.durationMinutes, 90);
assert.deepEqual(typoCreateWithRichTime.unmatchedParticipants, []);

assert.equal(parseDuration("for a quarter of an hour"), 15);
assert.equal(parseDuration("lasting three quarters of an hour"), 45);
assert.equal(parseDuration("for an hour and a half"), 90);
assert.equal(parseDuration("for 1h 30m"), 90);
assert.equal(parseDuration("for 2 hours and 15 minutes"), 135);
assert.equal(parseDuration("for forty five minutes"), 45);

assert.equal(parseTime("at noon").startMinute, 12 * 60);
assert.equal(parseTime("at midnight").startMinute, 0);
assert.equal(parseTime("at quarter to 4pm").startMinute, 15 * 60 + 45);
assert.equal(parseTime("at half past 3").startMinute, 15 * 60 + 30);
assert.deepEqual(
  {
    startMinute: parseTime("between 9am and 5pm").startMinute,
    endMinute: parseTime("between 9am and 5pm").endMinute
  },
  { startMinute: 9 * 60, endMinute: 17 * 60 }
);

assert.equal(
  parseDateRange("day after tomorrow", options).dateKey,
  "2026-07-22"
);
assert.equal(parseDateRange("in three days", options).dateKey, "2026-07-23");
assert.equal(parseDateRange("in a fortnight", options).dateKey, "2026-08-03");
assert.equal(parseDateRange("on 29/07/2026", options).dateKey, "2026-07-29");
assert.equal(parseDateRange("on 2026-08-04", options).dateKey, "2026-08-04");

const nextWeekendTypo = parseCommand(
  "fnd time w/ Sam nxt weekend",
  options
);
assert.equal(nextWeekendTypo.intent, "find_time");
assert.equal(nextWeekendTypo.rangeKind, "next_weekend");
assert.equal(dateKeyInZone(nextWeekendTypo.rangeStart, timezone), "2026-08-01");
assert.equal(
  dateKeyInZone(new Date(new Date(nextWeekendTypo.rangeEnd).getTime() - 1), timezone),
  "2026-08-02"
);

const weekAfterNext = parseCommand(
  "Find a time for all of us the week after next",
  options
);
assert.equal(weekAfterNext.intent, "find_time");
assert.equal(weekAfterNext.rangeKind, "week_after_next");
assert.equal(dateKeyInZone(weekAfterNext.rangeStart, timezone), "2026-08-03");

const workingDayAvailability = parseCommand(
  "Find 30 minutes for everyone next week between 9am and 5pm",
  options
);
assert.equal(workingDayAvailability.earliestMinute, 9 * 60);
assert.equal(workingDayAvailability.latestMinute, 17 * 60);

const afterWorkAvailability = parseCommand(
  "Find time with Sam this week after work",
  options
);
assert.equal(afterWorkAvailability.earliestMinute, 17 * 60);

const renamedEvent = parseCommand(
  "Rename Economics revision to Macro Review",
  options
);
assert.equal(renamedEvent.intent, "rename_event");
assert.equal(renamedEvent.eventQuery, "Economics revision");
assert.equal(renamedEvent.newTitle, "Macro Review");
assert.equal(renamedEvent.requiresConfirmation, true);

const typoRenamedEvent = parseCommand(
  "renmae Economics revision to Team Planning",
  options
);
assert.equal(typoRenamedEvent.intent, "rename_event");
assert.equal(typoRenamedEvent.eventQuery, "Economics revision");
assert.equal(typoRenamedEvent.newTitle, "Team Planning");

const bareDelete = parseCommand("delete", options);
assert.equal(bareDelete.intent, "delete_event");
assert.equal(bareDelete.eventQuery, "");
assert.ok(bareDelete.missingFields.includes("event"));

const typoDelete = parseCommand("delet Economics revision", options);
assert.equal(typoDelete.intent, "delete_event");
assert.equal(typoDelete.eventQuery, "economics revision");
assert.equal(typoDelete.requiresConfirmation, true);

const duplicateEvent = parseCommand(
  "duplicte Economics revision tomorrow at 2pm",
  options
);
assert.equal(duplicateEvent.intent, "duplicate_event");
assert.equal(duplicateEvent.eventQuery, "economics revision");
assert.equal(duplicateEvent.targetDateKey, "2026-07-21");
assert.equal(duplicateEvent.targetStartMinute, 14 * 60);
assert.equal(duplicateEvent.requiresConfirmation, true);

const bareCopy = parseCommand("copy event", options);
assert.equal(bareCopy.intent, "duplicate_event");
assert.ok(bareCopy.missingFields.includes("event"));
assert.ok(bareCopy.missingFields.includes("target_date_or_time"));
assert.equal(parseCommand("copy notes", options).intent, "unsupported");

const typoInvite = parseCommand(
  "invte Mathew to Economics revision",
  options
);
assert.equal(typoInvite.intent, "add_participant");
assert.equal(typoInvite.eventQuery, "economics revision");
assert.deepEqual(typoInvite.participantIds, ["matthew"]);
assert.deepEqual(typoInvite.unmatchedParticipants, []);

const ambiguousInvite = parseCommand(
  "invite John to Economics revision",
  {
    ...options,
    members: [
      ...members,
      { id: "john-smith", displayName: "John Smith" },
      { id: "john-jones", displayName: "John Jones" }
    ]
  }
);
assert.equal(ambiguousInvite.intent, "add_participant");
assert.deepEqual(ambiguousInvite.participantIds, []);
assert.equal(ambiguousInvite.ambiguities[0].type, "participant");

const contextOptions = {
  ...options,
  context: {
    selectedEventId: "event-selected",
    selectedEventTitle: "Economics revision"
  }
};
const contextRemoval = parseCommand("remove Sam from it", contextOptions);
assert.equal(contextRemoval.intent, "remove_participant");
assert.deepEqual(contextRemoval.participantIds, ["sam"]);
assert.equal(contextRemoval.eventQuery, "Economics revision");
assert.equal(contextRemoval.contextEventRequested, true);
assert.equal(contextRemoval.usedContextEvent, true);
assert.equal(contextRemoval.contextEventId, "event-selected");

const relativeMove = parseCommand(
  "move Economics revision 15 mins earlier",
  options
);
assert.equal(relativeMove.intent, "move_event");
assert.equal(relativeMove.eventQuery, "economics revision");
assert.equal(relativeMove.relativeOffsetMinutes, -15);
assert.equal(relativeMove.missingFields.includes("target_date_or_time"), false);
const relativeMoveCompleted = completeMoveTarget(relativeMove, {
  id: "relative-event",
  title: "Economics revision",
  start: "2026-07-22T15:00:00.000Z",
  end: "2026-07-22T16:00:00.000Z",
  createdByParticipantId: "me"
}, timezone);
assert.equal(relativeMoveCompleted.targetStart, "2026-07-22T14:45:00.000Z");
assert.equal(relativeMoveCompleted.targetEnd, "2026-07-22T15:45:00.000Z");

const contextMove = parseCommand("move it back 30m", contextOptions);
assert.equal(contextMove.eventQuery, "Economics revision");
assert.equal(contextMove.relativeOffsetMinutes, 30);
assert.equal(contextMove.contextEventId, "event-selected");
assert.equal(contextMove.usedContextEvent, true);

for (const [command, expectedIntent] of [
  ["created equal", "unsupported"],
  ["connective tissue", "unsupported"],
  ["copy notes", "unsupported"],
  ["update budget", "unsupported"],
  ["remove blockers tomorrow at 3", "create_event"],
  ["assets and settings review", "unsupported"]
]) {
  assert.equal(
    parseCommand(command, options).intent,
    expectedIntent,
    `${command} must not be over-corrected into a destructive command`
  );
}

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
    updatedAt: "2026-07-20T11:00:00.000Z",
    inviteeParticipantIds: ["sam"],
    location: "Library",
    description: "Bring notes",
    allDay: false
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
assert.equal(eventCandidates[0].createdByParticipantId, "me");
assert.deepEqual(eventCandidates[0].inviteeParticipantIds, ["sam"]);
assert.equal(eventCandidates[0].location, "Library");
assert.equal(eventCandidates[0].description, "Bring notes");
assert.equal(eventCandidates[0].allDay, false);

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

const weekdayFilteredBeforeLimit = calculateAvailableSlots({
  rangeStart: "2026-07-20T07:00:00.000Z",
  rangeEnd: "2026-07-24T20:00:00.000Z",
  timezone,
  durationMinutes: 30,
  earliestMinute: 8 * 60,
  latestMinute: 21 * 60,
  allowedWeekdays: [4],
  limit: 1
});
assert.equal(weekdayFilteredBeforeLimit.slots.length, 1);
assert.equal(weekdayFilteredBeforeLimit.slots[0].dateKey, "2026-07-23");
assert.deepEqual(weekdayFilteredBeforeLimit.allowedWeekdays, [4]);

const futureOnlyAvailability = calculateAvailableSlots({
  rangeStart: "2026-07-20T10:07:00.000Z",
  rangeEnd: "2026-07-20T20:00:00.000Z",
  timezone,
  durationMinutes: 30,
  earliestMinute: 8 * 60,
  latestMinute: 21 * 60,
  allowedWeekdays: [1],
  limit: 20,
  includeEveryCandidate: true
});
assert.ok(futureOnlyAvailability.slots.length > 0);
assert.equal(futureOnlyAvailability.slots[0].start, "2026-07-20T10:15:00.000Z");
assert.equal(
  futureOnlyAvailability.slots.every(
    (slot) => new Date(slot.start) >= new Date("2026-07-20T10:07:00.000Z")
  ),
  true
);

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
