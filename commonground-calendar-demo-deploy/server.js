import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";
const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${port}`;
const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${publicBaseUrl}/auth/google/callback`;
const localSessionFile = path.join(__dirname, ".local-session.json");
const googleScopes = [
  "openid",
  "profile",
  "email",
  "https://www.googleapis.com/auth/calendar.freebusy",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly"
];

const sessions = new Map();
const oauthStates = new Set();
let durableGoogleTokens = loadDurableGoogleTokens();
let durableGoogleProfile = loadDurableGoogleProfile();

function loadDurableGoogleTokens() {
  if (!fs.existsSync(localSessionFile)) return null;

  try {
    const saved = JSON.parse(fs.readFileSync(localSessionFile, "utf8"));
    return saved.googleTokens?.access_token ? saved.googleTokens : null;
  } catch {
    return null;
  }
}

function loadDurableGoogleProfile() {
  if (!fs.existsSync(localSessionFile)) return null;

  try {
    const saved = JSON.parse(fs.readFileSync(localSessionFile, "utf8"));
    return saved.googleProfile || null;
  } catch {
    return null;
  }
}

function saveDurableGoogleSession(tokens, profile = durableGoogleProfile) {
  durableGoogleTokens = tokens;
  durableGoogleProfile = profile || null;
  fs.writeFileSync(localSessionFile, JSON.stringify({
    googleTokens: tokens,
    googleProfile: durableGoogleProfile
  }, null, 2));
}

function loadGoogleCredentials() {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authUri: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUri: "https://oauth2.googleapis.com/token"
    };
  }

  const clientFile = process.env.GOOGLE_OAUTH_CLIENT_FILE;
  if (!clientFile) return null;
  if (!fs.existsSync(clientFile)) return null;

  const raw = JSON.parse(fs.readFileSync(clientFile, "utf8"));
  const config = raw.web || raw.installed;
  if (!config?.client_id || !config?.client_secret) return null;

  return {
    clientId: config.client_id,
    clientSecret: config.client_secret,
    authUri: config.auth_uri || "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUri: config.token_uri || "https://oauth2.googleapis.com/token"
  };
}

function parseCookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || "")
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const [key, ...rest] = cookie.split("=");
        return [key, decodeURIComponent(rest.join("="))];
      })
  );
}

function getSession(req, res) {
  const cookies = parseCookies(req);
  let sid = cookies.cg_sid;
  if (!sid || !sessions.has(sid)) {
    sid = crypto.randomBytes(18).toString("hex");
    sessions.set(sid, {});
    res.setHeader("Set-Cookie", `cg_sid=${encodeURIComponent(sid)}; HttpOnly; SameSite=Lax; Path=/`);
  }
  return sessions.get(sid);
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function sendRedirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requested = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.join(__dirname, "public", path.normalize(requested));

  if (!filePath.startsWith(path.join(__dirname, "public"))) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const ext = path.extname(filePath);
  const type =
    ext === ".css" ? "text/css" :
    ext === ".js" ? "text/javascript" :
    "text/html";

  res.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": "no-store"
  });
  fs.createReadStream(filePath).pipe(res);
}

async function exchangeCodeForTokens(code) {
  const credentials = loadGoogleCredentials();
  if (!credentials) throw new Error("Google OAuth credentials are not configured.");

  const body = new URLSearchParams({
    code,
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code"
  });

  const response = await fetch(credentials.tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || "Token exchange failed.");
  }
  return withTokenExpiry(payload);
}

async function fetchGoogleProfile(accessToken) {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const payload = await response.json();
  if (!response.ok) {
    return null;
  }

  return {
    name: payload.name || payload.given_name || payload.email || "You",
    email: payload.email || null,
    picture: payload.picture || null
  };
}

function withTokenExpiry(tokens) {
  return {
    ...tokens,
    expires_at: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : tokens.expires_at
  };
}

async function refreshAccessToken(tokens) {
  if (!tokens.refresh_token) return tokens;

  const credentials = loadGoogleCredentials();
  if (!credentials) throw new Error("Google OAuth credentials are not configured.");

  const body = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    refresh_token: tokens.refresh_token,
    grant_type: "refresh_token"
  });

  const response = await fetch(credentials.tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || "Token refresh failed.");
  }

  return withTokenExpiry({
    ...tokens,
    ...payload,
    refresh_token: tokens.refresh_token
  });
}

async function getFreshTokens(session) {
  const tokens = session.googleTokens || durableGoogleTokens;
  if (!tokens?.access_token) return null;
  if (!tokens.expires_at || Date.now() < tokens.expires_at - 60_000) {
    session.googleTokens = tokens;
    session.googleProfile = session.googleProfile || durableGoogleProfile;
    return tokens;
  }
  session.googleTokens = await refreshAccessToken(tokens);
  session.googleProfile = session.googleProfile || durableGoogleProfile;
  saveDurableGoogleSession(session.googleTokens, session.googleProfile);
  return session.googleTokens;
}

function dateFromQuery(value, fallback) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

async function fetchCalendarList(accessToken) {
  const response = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList?showHidden=false", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  });

  const payload = await response.json();
  if (!response.ok) {
    return {
      calendars: [{ id: "primary", summary: "Google calendar", primary: true }],
      needsReconnect: response.status === 401 || response.status === 403,
      calendarListError: payload.error?.message || "Could not list calendars."
    };
  }

  const calendars = (payload.items || [])
    .filter((calendar) => calendar.selected !== false && !calendar.deleted)
    .map((calendar) => ({
      id: calendar.id,
      summary: calendar.summaryOverride || calendar.summary || calendar.id,
      primary: Boolean(calendar.primary),
      backgroundColor: calendar.backgroundColor
    }));

  return {
    calendars: calendars.length ? calendars : [{ id: "primary", summary: "Google calendar", primary: true }],
    needsReconnect: false,
    calendarListError: null
  };
}

async function fetchFreeBusy(accessToken, timeMin, timeMax, profile) {
  const fallbackStart = new Date();
  fallbackStart.setHours(0, 0, 0, 0);
  const fallbackEnd = new Date(fallbackStart);
  fallbackEnd.setDate(fallbackEnd.getDate() + 7);

  const start = dateFromQuery(timeMin, fallbackStart);
  const end = dateFromQuery(timeMax, fallbackEnd);
  const calendarList = await fetchCalendarList(accessToken);

  const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      timeMin: start.toISOString(),
      timeMax: end.toISOString(),
      items: calendarList.calendars.map((calendar) => ({ id: calendar.id }))
    })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || "Could not fetch calendar availability.");
  }

  const calendarsById = new Map(calendarList.calendars.map((calendar) => [calendar.id, calendar]));
  const ownerName = profile?.name || profile?.email || "You";
  const busy = Object.entries(payload.calendars || {}).flatMap(([calendarId, calendarResult]) => {
    const calendar = calendarsById.get(calendarId) || { id: calendarId, summary: calendarId };
    return (calendarResult.busy || []).map((block) => ({
      ...block,
      calendarId,
      ownerName,
      calendarSummary: calendar.summary,
      calendarColor: calendar.backgroundColor,
      calendarErrors: calendarResult.errors || []
    }));
  });

  return {
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    busy,
    calendars: calendarList.calendars.map((calendar) => ({
      id: calendar.id,
      summary: calendar.summary,
      primary: Boolean(calendar.primary)
    })),
    calendarCount: calendarList.calendars.length,
    needsReconnect: calendarList.needsReconnect,
    calendarListError: calendarList.calendarListError,
    fetchedAt: new Date().toISOString()
  };
}

function buildGoogleAuthUrl() {
  const credentials = loadGoogleCredentials();
  if (!credentials) return null;

  const state = crypto.randomBytes(16).toString("hex");
  oauthStates.add(state);

  const url = new URL(credentials.authUri);
  url.searchParams.set("client_id", credentials.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", googleScopes.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return url.toString();
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (url.pathname === "/api/config") {
      const credentials = loadGoogleCredentials();
      sendJson(res, 200, {
        googleReady: Boolean(credentials),
        redirectUri
      });
      return;
    }

    if (url.pathname === "/api/me") {
      const session = getSession(req, res);
      const profile = session.googleProfile || durableGoogleProfile;
      sendJson(res, 200, {
        connected: Boolean(session.googleTokens?.access_token || durableGoogleTokens?.access_token),
        durableSession: Boolean(durableGoogleTokens?.access_token),
        user: profile,
        needsProfileReconnect: Boolean((session.googleTokens?.access_token || durableGoogleTokens?.access_token) && !profile)
      });
      return;
    }

    if (url.pathname === "/api/auth-debug") {
      const cookies = parseCookies(req);
      const session = getSession(req, res);
      const tokens = session.googleTokens || durableGoogleTokens;
      const profile = session.googleProfile || durableGoogleProfile;
      sendJson(res, 200, {
        hasCookie: Boolean(cookies.cg_sid),
        sessionCount: sessions.size,
        connected: Boolean(tokens?.access_token),
        durableSession: Boolean(durableGoogleTokens?.access_token),
        expiresAt: tokens?.expires_at ? new Date(tokens.expires_at).toISOString() : null,
        scopes: tokens?.scope || null,
        profileName: profile?.name || null,
        profileEmail: profile?.email || null
      });
      return;
    }

    if (url.pathname === "/api/freebusy") {
      const session = getSession(req, res);
      const tokens = await getFreshTokens(session);
      if (!tokens?.access_token) {
        sendJson(res, 200, { source: "none", busy: [], reason: "not_connected" });
        return;
      }

      const result = await fetchFreeBusy(
        tokens.access_token,
        url.searchParams.get("timeMin"),
        url.searchParams.get("timeMax"),
        session.googleProfile || durableGoogleProfile
      );
      sendJson(res, 200, { source: "google", ...result });
      return;
    }

    if (url.pathname === "/auth/google") {
      const authUrl = buildGoogleAuthUrl();
      if (!authUrl) {
        sendRedirect(res, "/?error=missing_google_credentials");
        return;
      }
      sendRedirect(res, authUrl);
      return;
    }

    if (url.pathname === "/auth/google/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");
      if (error) {
        sendRedirect(res, `/?error=${encodeURIComponent(error)}`);
        return;
      }
      if (!code || !state || !oauthStates.has(state)) {
        sendRedirect(res, "/?error=invalid_oauth_state");
        return;
      }
      oauthStates.delete(state);

      try {
        const session = getSession(req, res);
        session.googleTokens = await exchangeCodeForTokens(code);
        session.googleProfile = await fetchGoogleProfile(session.googleTokens.access_token);
        saveDurableGoogleSession(session.googleTokens, session.googleProfile);
        sendRedirect(res, "/?connected=google");
      } catch (authError) {
        sendRedirect(res, `/?error=${encodeURIComponent(authError.message)}`);
      }
      return;
    }

    serveStatic(req, res);
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
});

server.listen(port, host, () => {
  console.log(`CommonGround demo running at http://localhost:${port}`);
  console.log(`Google redirect URI: ${redirectUri}`);
});
