# CommonGround Command Centre

The Command Centre is a deterministic calendar command interface built into the existing CommonGround room experience. It does not use an LLM, an AI API key, or a separately hosted service.

Open it with the **Ask CommonGround** toolbar button, `Cmd+K` on macOS, `Ctrl+K` on Windows or Linux, or `/` while focus is not inside another editable control. Use the arrow keys to move through options, Enter to select, `Cmd/Ctrl+Enter` to confirm the displayed primary action, and Escape to close.

## Supported commands

The deterministic router supports eight intent families.

### Create an event

Examples:

```text
Lunch with Sam tomorrow at 1
Dinner with Matthew next Saturday from 7 to 9pm
Economics revision Friday at 4 for 90 minutes
Create football on 18 August at 3pm
Create away day on 18 August all day
```

CommonGround extracts a title, date, time or all-day status, duration, and current-room members. It shows editable event fields and requires confirmation before writing.

### Find mutual availability

Examples:

```text
Find an hour for me and Matthew next Tuesday afternoon
Find 90 minutes for Alex and Sam this weekend
When can everyone meet next week?
Find two hours after 4pm on Thursday
```

The result contains up to three ranked 15-minute-aligned choices. Selecting a choice opens a final editable event preview; it does not create the event immediately.

### Show availability

Examples:

```text
When is Matthew free next week?
Show when Alex and Sam are both free this weekend
Highlight everyone's free time on Tuesday
```

Matching intervals are highlighted in the existing day or week calendar. No event is created.

### Move an event

Examples:

```text
Move economics revision to Friday at 4
Move dinner with Sam to next Saturday
Reschedule football to 6pm
```

Only editable CommonGround events are candidates. Multiple title matches produce a selection step. The interface shows the current and proposed ranges and requires confirmation.

### Navigate or search

Examples:

```text
Open August
Go to next Tuesday
Show Matthew
Find economics revision
```

Navigation reuses the existing calendar view, date, member sidebar, and event-detail behavior.

### Switch views or open settings

```text
Switch to week view
Open month view
Open settings
```

Supported view names are `day`, `week`, `month`, `year`, and `settings`.

### Connect Google Calendar

```text
Connect my Google Calendar
Sync Google Cal
```

The result exposes a user-clicked quick action that reuses CommonGround's existing centered, same-origin OAuth popup. The parser never handles credentials or OAuth tokens.

### Update the room code

```text
Change room code to ABC234
Set custom room code to HJK567
```

The host receives a confirmation preview before the existing room update endpoint is called. Room codes remain exactly six unambiguous uppercase letters or numbers; unsupported slugs are rejected rather than truncated.

Requests outside these intent families return a bounded help message. The Command Centre does not answer general questions, recommend venues, search the web, plan routes, or fabricate unsupported results.

## Architecture

The feature uses the existing CommonGround application and deployment:

```text
public/index.html
  Command Centre trigger and accessible dialog markup

public/command-centre.js
  Dialog state machine, previews, clarification UI, keyboard handling,
  availability results, confirmation actions, and calendar highlights

public/command-centre-actions.js
  Reusable action handlers returning { success, message, payload }, including
  date/view navigation, availability, event creation, OAuth, and room settings

command-centre-parser.js
  Pure command normalization, intent detection, participant resolution,
  duration/time/date extraction, and event candidate resolution

command-centre-date-time.js
  Timezone-aware date keys, British calendar phrases, time labels,
  ISO-week calculations, and daylight-saving validation

command-centre-scheduling.js
  Busy-interval normalization, free-interval subtraction, slot generation,
  and conflict detection

server.js
  Room-scoped parsing, authoritative availability, permission enforcement,
  conflict revalidation, event creation, and event movement
```

The UI follows these phases:

```text
closed → idle → parsing → needs_clarification/preview
       → searching_availability → results
       → confirming → saving → success/error
```

The browser debounces lightweight command submission, cancels obsolete requests, and rejects responses for a room that is no longer active. It keeps the original command editable. It does not store a raw command history.

## Parser pipeline

`parseCommand()` follows a fixed pipeline:

1. Normalize whitespace, punctuation, matching case, and common wording.
2. Detect an intent from explicit verbs and supported calendar patterns.
3. Parse a British date or date range in the supplied timezone.
4. Parse start/end times, duration, `after` constraints, and morning/afternoon/evening windows.
5. Resolve names only against current-room members plus `me`/`myself` and `everyone`/`the whole room`.
6. Resolve editable CommonGround event titles for move commands.
7. Apply safe defaults, such as a one-hour duration when a create command supplies a start time.
8. Return missing fields and ambiguities rather than guessing a material date, time, person, or event.

Default time windows are:

- Morning: 08:00–12:00
- Afternoon: 12:00–17:00
- Evening: 17:00–21:00

Availability defaults to 08:00–21:00. Durations are restricted to 15-minute increments from 15 minutes through 8 hours. A single availability request may span at most 31 days.

## Availability calculation

The authoritative server:

1. Verifies the requester is still a member of the named room.
2. Resolves selected IDs strictly against that room.
3. Collects busy intervals from CommonGround events for each selected participant.
4. Fetches connected-calendar free/busy intervals through the existing provider integration.
5. Stops with an incomplete result when any required provider availability cannot be confirmed.
6. Merges overlapping busy intervals.
7. Subtracts busy time from the requested daily window.
8. Filters intervals shorter than the requested duration.
9. Generates deterministic 15-minute-aligned candidates and returns the earliest suitable results, prioritizing the requested time-of-day window.

Event creation and movement repeat the availability collection immediately before writing. A newly introduced conflict returns `409 availability_conflict`; the browser then requests and displays up to three privacy-safe alternatives. Unavailable provider data returns `503 availability_unavailable`. A successful create exposes Undo through the existing authorized event-deletion workflow.

## API contract

All routes are scoped to an existing room:

```text
POST /api/rooms/:roomCode/command-centre/parse
POST /api/rooms/:roomCode/command-centre/availability
POST /api/rooms/:roomCode/command-centre/create-event
POST /api/rooms/:roomCode/command-centre/move-event
```

The parse route accepts at most 500 characters. Availability is read-only. Create and move are serialized per room and use the existing event persistence, notifications, and Google Calendar synchronization paths. Move requests include the previewed `updatedAt` value; a stale preview is rejected with `409 event_changed`.

## Security and privacy

- Every endpoint requires a valid session and current membership in the requested room.
- Participant IDs are never trusted merely because the browser supplied them.
- Only the event creator or room host can move a CommonGround event.
- Dates, durations, timezones, invitees, and event fields are validated on the server.
- Parse, availability, create, and move routes have separate rate limits.
- External calendar data contributes busy intervals only. The Command Centre does not expose provider titles, descriptions, locations, attendees, raw payloads, or OAuth tokens.
- Responses use the existing public-event projection.
- Raw command text is not persisted or logged by the feature.
- Creating or moving always requires a visible preview and explicit user confirmation.
- Google Calendar writes remain within the existing CommonGround event-sync workflow and permissions.

## Adding an intent

1. Add a deterministic branch to intent detection in `command-centre-parser.js`.
2. Return a structured result with `missingFields` and `ambiguities`.
3. Keep parsing pure; do not fetch or mutate from the parser.
4. Add any authoritative lookup or mutation to the room-scoped server route and reuse existing auth/event helpers.
5. Add or reuse a structured action in `public/command-centre-actions.js`, then add the corresponding preview, clarification, result, and confirmation renderer in `public/command-centre.js`.
6. Add parser, permission, conflict, and UI-contract tests.
7. Add examples and limitations to this document.

Mutating intents must never write from the first parse result. They require preview, confirmation, server permission checks, and conflict revalidation.

## Adding a parsing rule

1. Normalize only the smallest new phrase family required.
2. Reuse `command-centre-date-time.js` for timezone and daylight-saving behavior.
3. Avoid an inference when two interpretations could select different people, events, dates, or times.
4. Add positive, ambiguous, and unsupported examples to `tests/command-centre.mjs`.
5. Verify existing phrases still parse identically.

Prefer explicit deterministic patterns over a growing chain of broad substitutions.

## Development and tests

Requirements:

- Node.js 22 or newer
- No AI provider key
- Existing OAuth variables only when testing live calendar connections

Commands:

```bash
npm install
npm run check
node tests/command-centre.mjs
node tests/command-centre-integration.mjs
npm test
npm start
```

`npm run check` is the production syntax/build-equivalent check because this repository has no transpilation step. `tests/command-centre.mjs` covers parsing, participant ambiguity and fuzzy matching, event ambiguity, interval merging, availability/no-availability, conflicts, and Europe/London daylight-saving transitions. `tests/command-centre-integration.mjs` covers strict membership, confirmed creation, server conflict revalidation, metadata-preserving moves, and stale-preview rejection. The main smoke suite covers the wider HTTP application, privacy, persistence, existing event flows, and frontend contracts.

When changing the feature, test keyboard-only use, mobile bottom-sheet layout, focus restoration, stale-room request cancellation, confirmation behavior, conflict responses, and the absence of calls to external AI services.

## Render deployment

The Command Centre requires no second service, model process, model download, AI key, database migration, or new environment variable. It runs in the existing Node web service defined by `render.yaml`.

Deploy using the existing flow:

1. Install from the repository lockfile.
2. Run `npm run check` and `npm test`.
3. Deploy the same service with `npm start`.
4. Preserve the existing persistent disk/database configuration and OAuth callback URLs.
5. Verify the toolbar trigger, keyboard shortcut, event confirmation, availability search, movement, and Google sync on the deployed URL.

The normal Render persistence warning still applies: SQLite data needs the configured persistent disk, and multiple service instances are not coordinated by a single local SQLite file.

## Known limitations

- Parsing is deterministic English, with British date/time conventions; it is not general natural-language understanding.
- Only current-room members can be resolved or invited.
- Fuzzy matching is deliberately conservative, and similar names require selection.
- Move commands target CommonGround events, not arbitrary external Google Calendar events.
- Availability searches are limited to 31 days, 15-minute granularity, and 15-minute-to-8-hour durations.
- Default daily availability is 08:00–21:00 unless a supported phrase narrows it.
- Ranking is deterministic and favors requested windows and earlier suitable slots; it does not learn personal preferences.
- Connected-calendar outages block authoritative confirmation rather than creating a potentially conflicting event.
- Navigation search is limited to supported dates, months, current-room members, and visible CommonGround events.
- The feature does not recommend places, inspect email, send messages, plan travel, use weather, or answer general questions.
