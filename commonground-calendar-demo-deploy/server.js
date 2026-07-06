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
  if (!fs.existsSync(dataFile)) {
    return {
      users: {},
      groups: []
    };
  }

  try {
    const saved = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return {
      users: saved.users || {},
      groups: Array.isArray(saved.groups) ? saved.groups : []
    };
  } catch {
    return {
      users: {},
      groups: []
    };
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

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Request body too large."));
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });
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
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const payload = await response.json();
  if (!response.ok) {
    return null;
  }

  const email = normalizeEmail(payload.email);
  return {
    id: email || payload.sub,
    sub: payload.sub || null,
    name: payload.name || payload.given_name || payload.email || "You",
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
    isYou: user.id === currentUserId
  };
}

function serializeGroup(group, currentUserId) {
  const members = group.memberIds
    .map((memberId) => dataStore.users[memberId])
    .filter(Boolean)
    .map((user) => publicUser(user, currentUserId));

  return {
    id: group.id,
    name: group.name,
    type: group.type,
    ownerId: group.ownerId,
    members,
    pendingMembers: group.pendingMembers || [],
    memberCount: members.length + (group.pendingMembers || []).length,
    connectedCount: members.filter((member) => member.connected).length
  };
}

function userCanAccessGroup(group, user) {
  if (!user) return false;
  if (group.memberIds.includes(user.id)) return true;
  return (group.pendingMembers || []).some((pending) => normalizeEmail(pending.email) === user.email);
}

function reconcilePendingMemberships(user) {
  if (!user?.email) return;

  let changed = false;
  for (const group of dataStore.groups) {
    if (group.memberIds.includes(user.id)) continue;
    const pendingMembers = [];
    for (const pending of group.pendingMembers || []) {
      if (normalizeEmail(pending.email) === user.email) {
        group.memberIds.push(user.id);
        changed = true;
      } else {
        pendingMembers.push(pending);
      }
    }
    group.pendingMembers = pendingMembers;
  }

  if (changed) saveStore();
}

async function getFreshTokensForUser(userId) {
  const user = dataStore.users[userId];
  if (!user?.googleTokens?.access_token) return null;

  if (!user.googleTokens.expires_at || Date.now() < user.googleTokens.expires_at - 60_000) {
    return user.googleTokens;
  }

  user.googleTokens = await refreshAccessToken(user.googleTokens);
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
  const ownerName = profile?.name || profile?.email || "You";
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

async function fetchGroupFreeBusy(group, timeMin, timeMax) {
  const results = await Promise.all(group.memberIds.map(async (memberId) => {
    try {
      const user = dataStore.users[memberId];
      if (!user) {
        return {
          memberId,
          connected: false,
          busy: [],
          error: "missing_user"
        };
      }

      const tokens = await getFreshTokensForUser(memberId);
      if (!tokens?.access_token) {
        return {
          memberId,
          connected: false,
          busy: [],
          error: "not_connected"
        };
      }

      const result = await fetchFreeBusy(tokens.access_token, timeMin, timeMax, user);
      return {
        memberId,
        connected: true,
        busy: result.busy,
        calendarCount: result.calendarCount,
        calendarListError: result.calendarListError,
        needsReconnect: result.needsReconnect,
        fetchedAt: result.fetchedAt
      };
    } catch (error) {
      return {
        memberId,
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
      memberId: entry.memberId,
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

function findGroup(groupId) {
  return dataStore.groups.find((group) => group.id === groupId) || null;
}

function listUserGroups(user) {
  return dataStore.groups.filter((group) => userCanAccessGroup(group, user));
}

function createGroup(owner, payload) {
  const name = String(payload.name || "").trim();
  if (!name) throw new Error("Group name is required.");

  const type = String(payload.type || "Friend group").trim() || "Friend group";
  const group = {
    id: crypto.randomBytes(8).toString("hex"),
    name,
    type,
    ownerId: owner.id,
    memberIds: [owner.id],
    pendingMembers: [],
    createdAt: new Date().toISOString()
  };

  dataStore.groups.push(group);
  saveStore();
  return group;
}

function addMemberToGroup(group, identifier) {
  const raw = String(identifier || "").trim();
  if (!raw) throw new Error("Enter an email or name.");

  const email = raw.includes("@") ? normalizeEmail(raw) : null;
  const existingUser = email
    ? Object.values(dataStore.users).find((user) => user.email === email)
    : null;

  if (existingUser) {
    group.pendingMembers = (group.pendingMembers || []).filter((pending) => normalizeEmail(pending.email) !== email);
    if (!group.memberIds.includes(existingUser.id)) {
      group.memberIds.push(existingUser.id);
      saveStore();
    }
    return;
  }

  const pendingMembers = group.pendingMembers || [];
  const duplicatePending = pendingMembers.some((pending) => {
    if (email && pending.email) return normalizeEmail(pending.email) === email;
    return pending.name.toLowerCase() === raw.toLowerCase();
  });

  if (duplicatePending) return;

  pendingMembers.push({
    id: crypto.randomBytes(6).toString("hex"),
    name: raw,
    email
  });
  group.pendingMembers = pendingMembers;
  saveStore();
}

function requireSignedInUser(req, res) {
  const session = getSession(req, res);
  const user = currentUserFromSession(session);
  if (!user) {
    sendJson(res, 401, { error: "Sign in with Google first." });
    return null;
  }
  reconcilePendingMemberships(user);
  return { session, user: currentUserFromSession(session) };
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
  const groupMemberMatch = url.pathname.match(/^\/api\/groups\/([^/]+)\/members$/);
  const groupFreeBusyMatch = url.pathname.match(/^\/api\/groups\/([^/]+)\/freebusy$/);

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
      const user = currentUserFromSession(session);
      sendJson(res, 200, {
        connected: Boolean(user?.googleTokens?.access_token),
        durableSession: false,
        user: user ? publicUser(user, user.id) : null,
        needsProfileReconnect: false
      });
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
        userId: user?.id || null
      });
      return;
    }

    if (url.pathname === "/api/groups" && req.method === "GET") {
      const auth = requireSignedInUser(req, res);
      if (!auth) return;

      const groups = listUserGroups(auth.user).map((group) => serializeGroup(group, auth.user.id));
      sendJson(res, 200, {
        groups,
        user: publicUser(auth.user, auth.user.id)
      });
      return;
    }

    if (url.pathname === "/api/groups" && req.method === "POST") {
      const auth = requireSignedInUser(req, res);
      if (!auth) return;

      const body = await readJsonBody(req);
      const group = createGroup(auth.user, body);
      sendJson(res, 201, {
        group: serializeGroup(group, auth.user.id)
      });
      return;
    }

    if (groupMemberMatch && req.method === "POST") {
      const auth = requireSignedInUser(req, res);
      if (!auth) return;

      const group = findGroup(groupMemberMatch[1]);
      if (!group || !group.memberIds.includes(auth.user.id)) {
        sendJson(res, 404, { error: "Group not found." });
        return;
      }

      const body = await readJsonBody(req);
      addMemberToGroup(group, body.identifier);
      sendJson(res, 200, {
        group: serializeGroup(group, auth.user.id)
      });
      return;
    }

    if (groupFreeBusyMatch && req.method === "GET") {
      const auth = requireSignedInUser(req, res);
      if (!auth) return;

      const group = findGroup(groupFreeBusyMatch[1]);
      if (!group || !group.memberIds.includes(auth.user.id)) {
        sendJson(res, 404, { error: "Group not found." });
        return;
      }

      const result = await fetchGroupFreeBusy(
        group,
        url.searchParams.get("timeMin"),
        url.searchParams.get("timeMax")
      );

      sendJson(res, 200, {
        ...result,
        group: serializeGroup(group, auth.user.id)
      });
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
        const googleTokens = await exchangeCodeForTokens(code);
        const profile = await fetchGoogleProfile(googleTokens.access_token);

        if (!profile?.id) {
          throw new Error("Could not read your Google profile.");
        }

        const userId = profile.id;
        const existing = dataStore.users[userId] || {};
        dataStore.users[userId] = {
          ...existing,
          id: userId,
          sub: profile.sub,
          name: profile.name,
          email: profile.email,
          picture: profile.picture,
          googleTokens
        };
        session.userId = userId;
        reconcilePendingMemberships(dataStore.users[userId]);
        saveStore();
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
