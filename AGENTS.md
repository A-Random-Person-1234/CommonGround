# CommonGround contributor guide

This file applies to the entire repository.

## Commands

- Install dependencies: `npm install`
- Run locally: `npm start`
- Build/production syntax verification: `npm run check`
- Run the complete test suite: `npm test`
- Run focused Command Centre unit checks: `node tests/command-centre.mjs`
- Run focused Command Centre API checks: `node tests/command-centre-integration.mjs`

CommonGround has no transpilation or bundling step. Production runs the checked-in Node and browser JavaScript directly. `npm run check` is therefore the build-equivalent verification and the current lint/type-check command; the project does not use TypeScript or a separate linter.

## Project conventions

- Use Node.js 22 or newer and ECMAScript modules on the server.
- Keep the frontend in accessible, framework-free HTML, CSS, and vanilla JavaScript.
- Prefer small pure modules for parsing, dates, validation, and scheduling logic.
- Use existing helpers and API conventions instead of creating parallel room, event, OAuth, or calendar implementations.
- Treat the server as authoritative for authentication, room membership, permissions, availability, conflict checks, and writes.
- Use `textContent` or the existing escaping helpers for user-controlled text.
- Preserve the existing 15-minute calendar granularity and timezone-aware ISO timestamps.
- Keep UI motion compositor-friendly: animate only `transform` and `opacity`, support reduced motion, and retain visible focus states.
- Do not add an LLM, AI SDK, model download, vector database, or external command-parsing service.

## Architectural boundaries

- `server.js` owns HTTP routing, sessions, persistence, provider integrations, authorization, and mutations.
- `public/app.js` owns the existing room/calendar UI and shared rendering helpers.
- `public/command-centre.js` owns Command Centre presentation and interaction state, but must use the existing room and calendar lifecycle.
- `command-centre-parser.js`, `command-centre-date-time.js`, and `command-centre-scheduling.js` must remain deterministic and independently testable.
- CommonGround-created events must continue through the existing event and Google Calendar sync paths.
- Connected-calendar data remains busy/free information; never expose private provider event titles, descriptions, locations, attendees, or tokens.
- Do not change the database, authentication providers, OAuth redirects, Render topology, or environment-variable names without a demonstrated requirement.

## Regression rules

- Preserve existing room creation/joining, member selection, calendar views, event creation/editing, drag/resize behavior, Google Calendar synchronization, notifications, privacy filtering, and responsive layouts.
- Do not persist or log raw Command Centre text by default.
- Require an explicit preview confirmation before creating or moving an event.
- Revalidate availability and permissions on the server immediately before every Command Centre mutation.
- Abort or discard stale async results when the active room changes.
- Add focused unit coverage for parser or scheduling changes and extend the smoke suite for API, privacy, permission, and UI contract changes.
- Run `npm run check` and `npm test` before handing off changes.
