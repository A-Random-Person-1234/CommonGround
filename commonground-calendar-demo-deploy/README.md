# CommonGround

A deployable Node.js shared calendar prototype built around rooms.

## What It Does

- Homepage lets people create a room or join a room by code.
- Room URLs use `/room/:code`.
- Users can enter a room before connecting Google Calendar.
- Google OAuth is room-aware and returns users to the same room after callback.
- Signed-in users now keep a durable Google-led identity across rooms, including their preferred display name and colour.
- Only Google Calendar busy/free data is fetched.
- Busy blocks never show Google event titles, descriptions, locations, or attendees.
- Shared room calendars support day, week, month, and year views.
- Overlapping busy people are rendered as stacked expandable calendar cards.
- Room participants can create group event proposals, vote yes/maybe/no, comment, and download `.ics`.
- Participant and account sync state now tracks the last successful Google refresh and reconnect issues.

## Important Prototype Limits

This is a working room-based shared prototype, but it is still not a production system.

- The app now persists rooms, users, and sessions in a local SQLite database called `.commonground.db`.
- If an older `.room-store.json` file exists, it is imported automatically on first boot.
- For a real public product, the next step would be moving from local SQLite to a managed database plus encrypted token storage.
- Rotate your Google client secret before using this beyond local testing, because it was pasted into chat earlier.

## Google Cloud Setup

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

## Environment Variables

Create these in your hosting provider:

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

## Run Locally

```bash
npm start
```

Then open:

```text
http://localhost:3000
```

## Deploy

This app has no npm dependencies. Use Node 22+ so the built-in SQLite runtime is available.

Start command:

```bash
node server.js
```

For Render, this repo includes `render.yaml`. Set the environment variables in the Render dashboard.

## Files

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
