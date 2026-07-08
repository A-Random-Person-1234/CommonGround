# Free Time

A deployable Node.js shared calendar prototype built around rooms.

## What It Does

- Homepage lets people create a room or join a room by code.
- Room URLs use `/room/:code`.
- Users can enter a room before connecting Google Calendar.
- Google and Microsoft OAuth are room-aware and return users to the same room after callback.
- Signed-in users keep a durable identity across rooms, including preferred display name and colour.
- Google and Outlook busy/free data are fetched with visibility controls.
- Busy blocks never show private event details unless the host marks specific events as shared.
- Shared room calendars support day, week, month, and year views.
- Overlapping busy people are rendered as stacked expandable calendar cards.
- Room participants can create group event proposals, vote yes/maybe/no, comment, download `.ics`, and sync invited/created events back to their own Google Calendar.
- Participant and account sync state now tracks the last successful calendar refresh and reconnect issues.
- Google/Outlook event sync is a per-user setting for each provider. Existing connected users may reconnect once to refresh OAuth event-write permission.

## Important Prototype Limits

This is a working room-based shared prototype, but it is still not a production system.

- The app persists rooms, users, and sessions in a local SQLite database called `.commonground.db`.
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

This version requests Google Calendar event-write access so Free Time can create/update/delete event copies on a connected user's own primary Google Calendar.

## Microsoft Identity Setup

1. Open Azure Active Directory App registrations.
2. Create a public/client OAuth app.
3. Add these permissions: `Calendars.ReadWrite`, `User.Read`, `offline_access`.
4. Add a redirect URI:

```text
https://YOUR-DOMAIN/auth/microsoft/callback
```

For local development:

```text
http://localhost:3000/auth/microsoft/callback
```

## Environment Variables

Create these in your hosting provider:

```text
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
PUBLIC_BASE_URL=https://YOUR-DOMAIN
```

Optional:

```text
GOOGLE_REDIRECT_URI=https://YOUR-DOMAIN/auth/google/callback
MICROSOFT_REDIRECT_URI=https://YOUR-DOMAIN/auth/microsoft/callback
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
