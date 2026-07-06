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
const dataFile = path.join(__dirname, ".shared-store.json");
const googleScopes = [
  "openid",
  "profile",
  "email",
  "https://www.googleapis.com/auth/calendar.freebusy",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly"
];

const sessions = new Map();
const oauthStates = new Set();
let dataStore = loadStore();

function loadStore() {
  if (!fs.existsSync(dataFile)) return { users: {} };

  try {
    const saved = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return { users: saved.users || {} };
  } catch {
    return { users: {} };
  }
}

function saveStore() {
  fs.writeFileSync(dataFile, JSON.stringify(dataStore, null, 2));
}

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : null;
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
  const publicRoot = path.join(__dirname, "public");
  const filePath = path.join(publicRoot, path.normalize(requested));

  if (!filePath.startsWith(publicRoot)) {
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
    ext === ".svg" ? "image/svg+xml" :
    "text/html";

  res.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": "no-store"
  });
  fs.createReadStream(filePath).pipe(res);
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
  if (!clientFile || !fs.existsSync(clientFile)) return null;

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

function withTokenExpiry(tokens) {
  return {
    ...tokens,
    expires_at: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : tokens.expires_at
  };
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

async function fetchGoogleProfile(accessToken) {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const payload = await response.json();
  if (!response.ok) return null;

  const email = normalizeEmail(payload.email);
  return {
    id: email || payload.sub,
    sub: payload.sub || null,
    name: payload.name || payload.given_name || payload.email || "Member",
    email,
    picture: payload.picture || null
  };
}

function dateFromQuery(value, fallback) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function currentUserFromSession(session) {
  return session.userId ? dataStore.users[session.userId] || null : null;
}

function publicUser(user, currentUserId) {
  return {
    id: user.id,
    name: user.name || user.email || "Member",
    email: user.email || null,
    picture: user.picture || null,
    connected: Boolean(user.googleTokens?.access_token),
    isYou: user.id === currentUserId,
    joinedAt: user.joinedAt || null,
    lastSeenAt: user.lastSeenAt || null
  };
}

function connectedUsers() {
  return Object.values(dataStore.users)
    .filter((user) => user.googleTokens?.access_token)
    .sort((a, b) => String(a.joinedAt || "").localeCompare(String(b.joinedAt || "")));
}

async function getFreshTokensForUser(userId) {
  const user = dataStore.users[userId];
  if (!user?.googleTokens?.access_token) return null;

  if (!user.googleTokens.expires_at || Date.now() < user.googleTokens.expires_at - 60_000) {
    return user.googleTokens;
  }

  user.googleTokens = await refreshAccessToken(user.googleTokens);
  user.lastSeenAt = new Date().toISOString();
  saveStore();
  return user.googleTokens;
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

  const primaryCalendar = calendars.find((calendar) => calendar.primary);
  const preferredCalendars = primaryCalendar ? [primaryCalendar] : calendars.slice(0, 1);

  return {
    calendars: preferredCalendars.length ? preferredCalendars : [{ id: "primary", summary: "Google calendar", primary: true }],
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
  const ownerName = profile?.name || profile?.email || "Member";
  const busy = Object.entries(payload.calendars || {}).flatMap(([calendarId, calendarResult]) => {
    const calendar = calendarsById.get(calendarId) || { id: calendarId, summary: calendarId };
    return (calendarResult.busy || []).map((block) => ({
      ...block,
      calendarId,
      ownerId: profile?.id || null,
      ownerName,
      ownerEmail: profile?.email || null,
      calendarSummary: calendar.summary,
      calendarColor: calendar.backgroundColor,
      calendarErrors: calendarResult.errors || []
    }));
  });

  return {
    timeMin: start.toISOString(),
    timeMax: end.toISOString(),
    busy,
    calendarCount: calendarList.calendars.length,
    needsReconnect: calendarList.needsReconnect,
    calendarListError: calendarList.calendarListError,
    fetchedAt: new Date().toISOString()
  };
}

async function fetchSharedFreeBusy(timeMin, timeMax) {
  const members = connectedUsers();
  const results = await Promise.all(members.map(async (user) => {
    try {
      const tokens = await getFreshTokensForUser(user.id);
      if (!tokens?.access_token) {
        return { member: publicUser(user, null), connected: false, busy: [], error: "not_connected" };
      }

      const result = await fetchFreeBusy(tokens.access_token, timeMin, timeMax, user);
      return {
        member: publicUser(user, null),
        connected: true,
        busy: result.busy,
        calendarCount: result.calendarCount,
        calendarListError: result.calendarListError,
        needsReconnect: result.needsReconnect,
        fetchedAt: result.fetchedAt
      };
    } catch (error) {
      return {
        member: publicUser(user, null),
        connected: true,
        busy: [],
        error: error.message
      };
    }
  }));

  return {
    source: "google",
    busy: results.flatMap((entry) => entry.busy || []),
    members: results.map((entry) => ({
      ...entry.member,
      connected: entry.connected,
      calendarCount: entry.calendarCount || 0,
      calendarListError: entry.calendarListError || null,
      needsReconnect: Boolean(entry.needsReconnect),
      error: entry.error || null
    })),
    connectedCount: results.filter((entry) => entry.connected).length,
    fetchedAt: new Date().toISOString()
  };
}

function requireSignedInUser(req, res) {
  const session = getSession(req, res);
  const user = currentUserFromSession(session);
  if (!user) {
    sendJson(res, 401, { error: "Sign in with Google first." });
    return null;
  }
  return { session, user };
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
      sendJson(res, 200, { googleReady: Boolean(credentials), redirectUri });
      return;
    }

    if (url.pathname === "/api/me") {
      const session = getSession(req, res);
      const user = currentUserFromSession(session);
      if (user) {
        user.lastSeenAt = new Date().toISOString();
        saveStore();
      }
      sendJson(res, 200, {
        connected: Boolean(user?.googleTokens?.access_token),
        durableSession: false,
        user: user ? publicUser(user, user.id) : null
      });
      return;
    }

    if (url.pathname === "/api/participants") {
      const session = getSession(req, res);
      const currentUser = currentUserFromSession(session);
      sendJson(res, 200, {
        participants: connectedUsers().map((user) => publicUser(user, currentUser?.id || null))
      });
      return;
    }

    if (url.pathname === "/api/shared/freebusy") {
      const auth = requireSignedInUser(req, res);
      if (!auth) return;

      const result = await fetchSharedFreeBusy(
        url.searchParams.get("timeMin"),
        url.searchParams.get("timeMax")
      );

      sendJson(res, 200, result);
      return;
    }

    if (url.pathname === "/api/freebusy") {
      const auth = requireSignedInUser(req, res);
      if (!auth) return;

      const tokens = await getFreshTokensForUser(auth.user.id);
      if (!tokens?.access_token) {
        sendJson(res, 200, { source: "none", busy: [], reason: "not_connected" });
        return;
      }

      const result = await fetchFreeBusy(
        tokens.access_token,
        url.searchParams.get("timeMin"),
        url.searchParams.get("timeMax"),
        auth.user
      );
      sendJson(res, 200, { source: "google", ...result });
      return;
    }

    if (url.pathname === "/api/auth-debug") {
      const cookies = parseCookies(req);
      const session = getSession(req, res);
      const user = currentUserFromSession(session);
      sendJson(res, 200, {
        hasCookie: Boolean(cookies.cg_sid),
        sessionCount: sessions.size,
        connected: Boolean(user?.googleTokens?.access_token),
        durableSession: false,
        expiresAt: user?.googleTokens?.expires_at ? new Date(user.googleTokens.expires_at).toISOString() : null,
        scopes: user?.googleTokens?.scope || null,
        profileName: user?.name || null,
        profileEmail: user?.email || null,
        userId: user?.id || null,
        participants: connectedUsers().length
      });
      return;
    }

    if (url.pathname === "/auth/google") {
      const authUrl = buildGoogleAuthUrl();
      if (!authUrl) {
        sendRedirect(res, "/?error=google_not_configured");
        return;
      }
      sendRedirect(res, authUrl);
      return;
    }

    if (url.pathname === "/auth/google/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      if (!code || !state || !oauthStates.has(state)) {
        sendRedirect(res, "/?error=bad_oauth_state");
        return;
      }
      oauthStates.delete(state);

      const tokens = await exchangeCodeForTokens(code);
      const profile = await fetchGoogleProfile(tokens.access_token);
      if (!profile?.id) {
        sendRedirect(res, "/?error=profile_failed");
        return;
      }

      const existing = dataStore.users[profile.id] || {};
      dataStore.users[profile.id] = {
        ...existing,
        ...profile,
        googleTokens: {
          ...tokens,
          refresh_token: tokens.refresh_token || existing.googleTokens?.refresh_token
        },
        joinedAt: existing.joinedAt || new Date().toISOString(),
        lastSeenAt: new Date().toISOString()
      };
      saveStore();

      const session = getSession(req, res);
      session.userId = profile.id;
      sendRedirect(res, "/?connected=google");
      return;
    }

    serveStatic(req, res);
  } catch (error) {
    console.error(error);
    if (url.pathname.startsWith("/api/")) {
      sendJson(res, 500, { error: error.message || "Server error." });
    } else {
      sendRedirect(res, `/?error=${encodeURIComponent(error.message || "Server error")}`);
    }
  }
});

server.listen(port, host, () => {
  console.log(`CommonGround running on http://${host}:${port}`);
  console.log(`Google redirect URI: ${redirectUri}`);
});
