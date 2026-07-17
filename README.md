# CommonGround

CommonGround is a room-based shared calendar for comparing live free/busy availability and proposing group events without exposing private calendar details.

This directory is the complete deployable application. Run and deploy from this folder; there is no nested deployment project.

## Requirements

- Node.js 22 or newer (the server uses the built-in `node:sqlite` module)
- Google OAuth credentials for Google Calendar connection
- Microsoft OAuth credentials only if Outlook connection is enabled

## Run locally

```bash
npm start
```

The app listens on `http://localhost:3000` by default.

## Verify the build

```bash
npm run check
npm test
```

`npm test` starts CommonGround against a temporary SQLite database and checks the core room, guest, event, voting, notification, privacy, persistence, room-code refresh, and deletion flows.

## Environment variables

Required for the public Google Calendar flow:

```text
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
PUBLIC_BASE_URL=https://YOUR-DOMAIN
```

Optional overrides and integrations:

```text
PORT=3000
HOST=0.0.0.0
GOOGLE_REDIRECT_URI=https://YOUR-DOMAIN/auth/google/callback
GOOGLE_OAUTH_CLIENT_FILE=/absolute/path/to/google-client.json
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_TENANT=common
MICROSOFT_REDIRECT_URI=https://YOUR-DOMAIN/auth/microsoft/callback
DATA_DIR=/absolute/path/to/durable/data
DATABASE_PATH=/absolute/path/to/commonground.db
OUTBOUND_REQUEST_TIMEOUT_MS=15000
```

Do not commit OAuth secrets. Configure them in the hosting provider's secret/environment settings.

## OAuth redirect setup

In Google Cloud Console, enable the Google Calendar API, configure the OAuth consent screen, create a Web application client, and register this exact redirect URI:

```text
https://YOUR-DOMAIN/auth/google/callback
```

For local development, also register:

```text
http://localhost:3000/auth/google/callback
```

If `GOOGLE_REDIRECT_URI` is omitted, CommonGround derives it from `PUBLIC_BASE_URL`. Microsoft OAuth follows the same pattern with `/auth/microsoft/callback`.

## Render deployment

The included `render.yaml` defines one Node web service and starts it with `npm start`.

1. Create a Render Blueprint from this folder/repository.
2. Set the secret environment variables requested by the Blueprint.
3. Set `PUBLIC_BASE_URL` to the final HTTPS service URL.
4. Add that URL's `/auth/google/callback` path to the Google OAuth client before testing sign-in.

### Persistence limitation

By default, the server stores rooms, sessions, participants, votes, comments, and OAuth tokens in `.commonground.db` beside `server.js`. A Render service without a persistent disk has an ephemeral filesystem, so redeploys or instance replacement can erase that database.

For a prototype, attach a persistent disk and point `DATA_DIR` or `DATABASE_PATH` at its mount path. For production, move state to a managed database and encrypt stored OAuth tokens; a local SQLite file does not provide multi-instance coordination or production-grade secret storage.

## Calendar privacy model

- Joining as a guest does not require OAuth.
- Google access is optional and used for identity plus free/busy availability.
- Other room members see busy/free blocks, not private Google event titles, locations, descriptions, or attendee lists.
- CommonGround-created room events may show their own title, location, description, votes, and comments.
- Writing CommonGround events back to a calendar requires the additional event-write permission.

## Deployable files

```text
server.js
package.json
Procfile
render.yaml
.env.example
.gitignore
public/index.html
public/styles.css
public/app.js
public/privacy.html
public/terms.html
tests/smoke.mjs
```

The legal pages are editable starter documents and should receive professional review before production use.
