# CommonGround Single Shared Calendar

A deployable Node.js prototype for one shared availability board powered by Google Calendar free/busy data.

## What changed

This version removes the Groups flow. The app now opens directly to a shared calendar page. Anyone who connects Google Calendar becomes a participant on the same shared board, and their busy blocks appear alongside everyone else.

## Privacy model

- Uses Google OAuth sign-in.
- Reads Google Calendar busy/free blocks only.
- Does not read event titles, descriptions, locations, or attendees.
- Shows each connected person as busy during their busy blocks.

## Prototype limits

- The current data store is a local JSON file called `.shared-store.json`.
- Sessions are in memory, so users may need to reconnect after a server restart.
- For a real product, replace `.shared-store.json` with a proper database and encrypted token storage.
- If any Google client secret was pasted into chat or exposed elsewhere, rotate it before public use.

## Google Cloud setup

1. Open Google Cloud Console.
2. Enable **Google Calendar API**.
3. Configure the OAuth consent screen.
4. Add yourself and test users while the app is in testing mode.
5. Create an OAuth **Web application** client.
6. Add this Authorized redirect URI:

```text
https://YOUR-DOMAIN/auth/google/callback
```

For local development:

```text
http://localhost:3000/auth/google/callback
```

Authorized JavaScript origins are not required for this backend OAuth flow.

## Environment variables

Create these in Render or your hosting provider:

```text
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
PUBLIC_BASE_URL=https://YOUR-DOMAIN
```

Optional:

```text
GOOGLE_REDIRECT_URI=https://YOUR-DOMAIN/auth/google/callback
PORT=3000
```

## Run locally

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

## Deploy

Start command:

```bash
node server.js
```

For Render, this repo includes `render.yaml`. Set the environment variables in the Render dashboard.

## Main files

```text
server.js
package.json
Procfile
render.yaml
.env.example
public/index.html
public/styles.css
public/app.js
```
