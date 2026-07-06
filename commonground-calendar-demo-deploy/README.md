# CommonGround Calendar Demo

A deployable Node.js prototype for planning meetups from Google Calendar busy/free data.

## What It Does

- Google OAuth sign-in.
- Reads Google Calendar **busy/free blocks only**.
- Does not read event titles, descriptions, locations, or attendees.
- Shows busy blocks on day/week/month/year calendar views.
- Lets connected people create shared groups and add others by email.
- Resolves pending email invites automatically when that person later signs in.

## Important Prototype Limits

This is now a shared prototype with server-backed groups, but it is still not a full production app.

- The current data store is a local JSON file called `.shared-store.json`.
- Sessions are still in memory, so people may need to reconnect after a server restart.
- For a real public product, replace `.shared-store.json` with a proper database and encrypted token storage.
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

This app has no npm dependencies. Any Node host should work.

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
