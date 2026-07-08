import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";
const publicBaseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${port}`;
const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${publicBaseUrl}/auth/google/callback`;
const databaseFile = path.join(__dirname, ".commonground.db");
const legacyStoreFile = path.join(__dirname, ".room-store.json");
const publicDir = path.join(__dirname, "public");
const roomCodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const participantPalette = [
  "#1a73e8",
  "#d93025",
  "#188038",
  "#a142f4",
  "#f29900",
  "#12a4af",
  "#e8710a",
  "#b80672",
  "#0b8043",
  "#1967d2",
  "#5f6368",
  "#00897b"
];

const participantPaletteSet = new Set(participantPalette);
const googleScopes = [
  "openid",
  "profile",
  "email",
  "https://www.googleapis.com/auth/calendar.freebusy",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  "https://www.googleapis.com/auth/calendar.readonly"
];

const database = openDatabase();
const oauthStates = new Map();
let store = loadStore();
const sessions = new Map(Object.entries(store.sessions || {}));

function openDatabase() {
  const db = new DatabaseSync(databaseFile);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  return db;
}

function uniqueStrings(values = []) {
  return [...new Set(
    (Array.isArray(values) ? values : [values])
      .map((value) => String(value || "").trim())
      .filter(Boolean)
  )];
}

function normalizeSyncState(sync = {}, fallbackStatus = "guest") {
  return {
    status: sync.status || fallbackStatus,
    lastAttemptAt: sync.lastAttemptAt || null,
    lastSuccessAt: sync.lastSuccessAt || null,
    lastError: sync.lastError || null,
    calendarId: sync.calendarId || null,
    calendarName: sync.calendarName || null
  };
}

function normalizeUserRecord(user = {}) {
  const googleTokens = user.auth?.google?.tokens || user.googleTokens || null;
  const scopes = uniqueStrings(
    user.auth?.google?.scopes ||
    user.googleScopes ||
    (typeof googleTokens?.scope === "string" ? googleTokens.scope.split(" ") : [])
  );
  const googleName = String(
    user.profile?.googleName ||
    user.name ||
    user.email ||
    "Guest"
  ).trim() || "Guest";
  const picture = user.profile?.picture || user.picture || null;
  const preferredDisplayName = String(
    user.profile?.preferredDisplayName ||
    user.displayName ||
    googleName
  ).trim() || googleName;
  const preferredColor = user.profile?.preferredColor || user.color || null;
  const connected = Boolean(googleTokens?.access_token);

  return {
    ...user,
    id: user.id,
    googleSub: user.googleSub || null,
    email: user.email || null,
    name: googleName,
    displayName: preferredDisplayName,
    color: preferredColor,
    picture,
    googleTokens,
    googleScopes: scopes,
    profile: {
      googleName,
      picture,
      preferredDisplayName,
      preferredColor
    },
    auth: {
      google: {
        tokens: googleTokens,
        scopes,
        connectedAt: user.auth?.google?.connectedAt || user.connectedAt || (connected ? user.createdAt || nowIso() : null),
        updatedAt: user.auth?.google?.updatedAt || user.updatedAt || nowIso()
      }
    },
    sync: normalizeSyncState(user.sync, connected ? "connected" : "guest"),
    createdAt: user.createdAt || nowIso(),
    updatedAt: user.updatedAt || nowIso()
  };
}

function normalizeAvailabilityItem(item = {}) {
  return {
    ...item,
    id: item.id,
    title: String(item.title || "Busy").trim() || "Busy",
    location: String(item.location || "").trim(),
    description: String(item.description || "").trim(),
    visibility: item.visibility === "shared" ? "shared" : "busy",
    sharedWithParticipantIds: uniqueStrings(item.sharedWithParticipantIds),
    start: item.start,
    end: item.end,
    createdAt: item.createdAt || nowIso()
  };
}

function normalizeParticipantRecord(participant = {}) {
  const sessionIds = uniqueStrings([participant.sessionId, ...(participant.sessionIds || [])]);
  const connected = Boolean(participant.connected);
  const needsReconnect = Boolean(participant.needsReconnect);

  return {
    ...participant,
    id: participant.id,
    sessionId: sessionIds[sessionIds.length - 1] || null,
    sessionIds,
    userId: participant.userId || null,
    displayName: String(participant.displayName || "Guest").trim() || "Guest",
    displayNameSource: participant.displayNameSource === "custom" ? "custom" : "google",
    color: participantPaletteSet.has(participant.color) ? participant.color : participantPalette[0],
    connected,
    needsReconnect,
    syncStatus: participant.syncStatus || (needsReconnect ? "needs_reconnect" : (connected ? "connected" : "guest")),
    lastSyncedAt: participant.lastSyncedAt || null,
    lastSyncError: participant.lastSyncError || null,
    lastCalendarId: participant.lastCalendarId || null,
    lastCalendarName: participant.lastCalendarName || null,
    joinedAt: participant.joinedAt || nowIso(),
    lastSeenAt: participant.lastSeenAt || nowIso(),
    picture: participant.picture || null,
    availabilityOverrides: participant.availabilityOverrides || {},
    localAvailabilityItems: (participant.localAvailabilityItems || []).map(normalizeAvailabilityItem)
  };
}

function normalizeEventRecord(event = {}) {
  return {
    ...event,
    id: event.id,
    title: String(event.title || "Busy").trim() || "Busy",
    location: String(event.location || "").trim(),
    description: String(event.description || "").trim(),
    inviteeParticipantIds: uniqueStrings(event.inviteeParticipantIds),
    createdByParticipantId: event.createdByParticipantId || null,
    createdAt: event.createdAt || nowIso(),
    responses: event.responses || {},
    comments: Array.isArray(event.comments) ? event.comments : []
  };
}

function normalizeRoomIcon(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "";
  return Array.from(trimmed)[0] || "";
}

function normalizeJoinRequestRecord(request = {}) {
  return {
    id: request.id,
    sessionId: request.sessionId || null,
    userId: request.userId || null,
    displayName: String(request.displayName || "Guest").trim() || "Guest",
    picture: request.picture || null,
    source: request.source === "google" ? "google" : "guest",
    status: request.status === "approved" || request.status === "denied" ? request.status : "pending",
    requestedAt: request.requestedAt || nowIso(),
    updatedAt: request.updatedAt || request.requestedAt || nowIso()
  };
}

function normalizeRoomRecord(room = {}) {
  const participants = (room.participants || []).map(normalizeParticipantRecord);
  return {
    ...room,
    id: room.id || room.code,
    code: normalizeRoomCode(room.code || room.id),
    name: String(room.name || "Untitled room").trim() || "Untitled room",
    icon: normalizeRoomIcon(room.icon),
    hostSessionId: room.hostSessionId || null,
    hostUserId: room.hostUserId || null,
    access: {
      locked: Boolean(room.access?.locked),
      approvedSessionIds: uniqueStrings(room.access?.approvedSessionIds),
      approvedUserIds: uniqueStrings(room.access?.approvedUserIds),
      updatedAt: room.access?.updatedAt || room.updatedAt || nowIso()
    },
    joinRequests: (room.joinRequests || []).map(normalizeJoinRequestRecord),
    participants,
    events: (room.events || []).map(normalizeEventRecord),
    structureVersion: Math.max(Number(room.structureVersion || 0), 3),
    createdAt: room.createdAt || nowIso(),
    updatedAt: room.updatedAt || nowIso()
  };
}

function normalizeLoadedStore(saved = {}) {
  return {
    meta: {
      schemaVersion: 2,
      updatedAt: saved.meta?.updatedAt || nowIso()
    },
    users: Object.fromEntries(
      Object.entries(saved.users || {})
        .map(([key, user]) => [key, normalizeUserRecord({ ...user, id: user?.id || key })])
    ),
    rooms: Object.fromEntries(
      Object.entries(saved.rooms || {})
        .map(([key, room]) => {
          const normalizedRoom = normalizeRoomRecord({ ...room, code: room?.code || key, id: room?.id || key });
          return [normalizedRoom.code, normalizedRoom];
        })
    ),
    sessions: saved.sessions || {}
  };
}

function hasPersistedStore() {
  const row = database.prepare("SELECT COUNT(*) AS count FROM app_state").get();
  return Number(row?.count || 0) > 0;
}

function loadLegacyStore() {
  if (!fs.existsSync(legacyStoreFile)) return null;

  try {
    const saved = JSON.parse(fs.readFileSync(legacyStoreFile, "utf8"));
    return normalizeLoadedStore(saved);
  } catch {
    return null;
  }
}

function readStoreSection(key) {
  const row = database.prepare("SELECT value FROM app_state WHERE key = ?").get(key);
  if (!row?.value) return {};

  try {
    return JSON.parse(row.value);
  } catch {
    return {};
  }
}

function persistStoreSnapshot(snapshot) {
  const normalized = normalizeLoadedStore(snapshot);
  const savedAt = nowIso();
  const upsert = database.prepare(`
    INSERT INTO app_state (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `);

  database.exec("BEGIN");
  try {
    upsert.run("meta", JSON.stringify({ ...normalized.meta, updatedAt: savedAt }), savedAt);
    upsert.run("users", JSON.stringify(normalized.users), savedAt);
    upsert.run("rooms", JSON.stringify(normalized.rooms), savedAt);
    upsert.run("sessions", JSON.stringify(normalized.sessions), savedAt);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function loadStore() {
  if (hasPersistedStore()) {
    return normalizeLoadedStore({
      meta: readStoreSection("meta"),
      users: readStoreSection("users"),
      rooms: readStoreSection("rooms"),
      sessions: readStoreSection("sessions")
    });
  }

  const legacyStore = loadLegacyStore();
  const initialStore = legacyStore || { users: {}, rooms: {}, sessions: {} };
  persistStoreSnapshot(initialStore);
  return initialStore;
}

function saveStore() {
  store.sessions = Object.fromEntries(sessions.entries());
  persistStoreSnapshot(store);
}

function nowIso() {
  return new Date().toISOString();
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
    sessions.set(sid, { id: sid, createdAt: nowIso() });
    saveStore();
    res.setHeader("Set-Cookie", `cg_sid=${encodeURIComponent(sid)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`);
  }

  const session = sessions.get(sid);
  session.id = sid;
  session.lastSeenAt = nowIso();
  return session;
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store"
  });
  res.end(body);
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
  const pathname = decodeURIComponent(url.pathname);
  const isSpaRoute = pathname === "/" || pathname.startsWith("/room/");
  const requested = isSpaRoute ? "/index.html" : pathname;
  const filePath = path.join(publicDir, path.normalize(requested));

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
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
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const payload = await response.json();
  if (!response.ok) return null;

  return {
    id: payload.sub || normalizeEmail(payload.email),
    googleSub: payload.sub || null,
    email: normalizeEmail(payload.email),
    name: payload.name || payload.given_name || payload.email || "You",
    picture: payload.picture || null
  };
}

function currentUserFromSession(session) {
  return session.userId ? store.users[session.userId] || null : null;
}

function userTokens(user) {
  return user?.auth?.google?.tokens || user?.googleTokens || null;
}

function userConnected(user) {
  return Boolean(userTokens(user)?.access_token);
}

function rawUserGoogleName(user) {
  return String(user?.profile?.googleName || user?.name || user?.email || "Guest").trim() || "Guest";
}

function abbreviatedDefaultDisplayName(name) {
  const value = String(name || "").trim();
  if (!value) return "Guest";
  if (value.includes("@")) {
    return value.split("@")[0] || value;
  }

  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] || value;
  const [firstName, ...rest] = parts;
  const surname = rest[rest.length - 1];
  return `${firstName} ${surname.charAt(0).toUpperCase()}.`;
}

function userGoogleName(user) {
  return abbreviatedDefaultDisplayName(rawUserGoogleName(user));
}

function userDisplayName(user) {
  const rawGoogleName = rawUserGoogleName(user);
  const preferred = String(user?.profile?.preferredDisplayName || user?.displayName || "").trim();
  if (!preferred || preferred === rawGoogleName) {
    return userGoogleName(user);
  }
  return preferred;
}

function userPreferredColor(user) {
  return user?.profile?.preferredColor || user?.color || null;
}

function userPicture(user) {
  return user?.profile?.picture || user?.picture || null;
}

function preferredDisplayNameSource(user) {
  const preferred = String(user?.profile?.preferredDisplayName || user?.displayName || "").trim();
  return !preferred || preferred === rawUserGoogleName(user) ? "google" : "custom";
}

function updateUserRecord(userId, updates = {}) {
  const existing = normalizeUserRecord(store.users[userId] || { id: userId });
  const next = normalizeUserRecord({
    ...existing,
    ...updates,
    profile: {
      ...existing.profile,
      ...(updates.profile || {})
    },
    auth: {
      ...existing.auth,
      google: {
        ...existing.auth?.google,
        ...(updates.auth?.google || {})
      }
    },
    sync: {
      ...existing.sync,
      ...(updates.sync || {})
    },
    updatedAt: nowIso()
  });
  store.users[userId] = next;
  return next;
}

function setUserGoogleConnection(userId, profile, tokens) {
  const existingPreferred = String(store.users[userId]?.profile?.preferredDisplayName || "").trim();
  const existingGoogleName = rawUserGoogleName(store.users[userId]);
  const shouldKeepPreferred = existingPreferred && existingPreferred !== existingGoogleName;
  const defaultDisplayName = abbreviatedDefaultDisplayName(profile.name || profile.email || "Guest");
  return updateUserRecord(userId, {
    googleSub: profile.googleSub,
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
    googleTokens: tokens,
    googleScopes: uniqueStrings(typeof tokens?.scope === "string" ? tokens.scope.split(" ") : []),
    profile: {
      googleName: profile.name,
      picture: profile.picture,
      preferredDisplayName: shouldKeepPreferred ? existingPreferred : defaultDisplayName,
      preferredColor: store.users[userId]?.profile?.preferredColor || null
    },
    auth: {
      google: {
        tokens,
        scopes: uniqueStrings(typeof tokens?.scope === "string" ? tokens.scope.split(" ") : []),
        connectedAt: store.users[userId]?.auth?.google?.connectedAt || nowIso(),
        updatedAt: nowIso()
      }
    },
    sync: {
      status: "connected",
      lastAttemptAt: nowIso(),
      lastError: null
    },
    createdAt: store.users[userId]?.createdAt || nowIso()
  });
}

function setUserPreferredIdentity(userId, { displayName, color } = {}) {
  const user = store.users[userId];
  if (!user) return null;

  return updateUserRecord(userId, {
    displayName: typeof displayName === "string" ? displayName.trim() || userDisplayName(user) : userDisplayName(user),
    color: color || userPreferredColor(user),
    profile: {
      preferredDisplayName: typeof displayName === "string" ? displayName.trim() || userDisplayName(user) : userDisplayName(user),
      preferredColor: color || userPreferredColor(user)
    }
  });
}

function updateUserSync(userId, patch = {}) {
  const user = store.users[userId];
  if (!user) return null;
  return updateUserRecord(userId, {
    sync: {
      ...user.sync,
      ...patch
    }
  });
}

function propagateUserIdentityToRooms(userId) {
  const user = store.users[userId];
  if (!user) return;
  const nextDisplayName = userDisplayName(user);
  const nextDisplayNameSource = preferredDisplayNameSource(user);
  const nextColor = userPreferredColor(user);
  const nextPicture = userPicture(user);
  const connected = userConnected(user);

  for (const room of Object.values(store.rooms)) {
    let roomChanged = false;
    for (const participant of room.participants || []) {
      if (participant.userId !== userId) continue;
      participant.displayName = nextDisplayName;
      participant.displayNameSource = nextDisplayNameSource;
      if (nextColor) participant.color = nextColor;
      participant.picture = nextPicture;
      participant.connected = connected;
      roomChanged = true;
    }
    if (roomChanged) {
      room.updatedAt = nowIso();
    }
  }
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email || null,
    name: userGoogleName(user),
    displayName: userDisplayName(user),
    preferredColor: userPreferredColor(user),
    picture: userPicture(user),
    connected: userConnected(user),
    sync: user.sync || normalizeSyncState({}, "guest")
  };
}

function generateId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function generateRoomCode() {
  let code = "";
  for (let index = 0; index < 6; index += 1) {
    code += roomCodeAlphabet[Math.floor(Math.random() * roomCodeAlphabet.length)];
  }
  if (store.rooms[code]) return generateRoomCode();
  return code;
}

function normalizeRoomCode(code) {
  return String(code || "").trim().toUpperCase();
}

function isValidRoomCode(code) {
  return /^[A-Z]{3,16}$/.test(normalizeRoomCode(code));
}

function escapeIcs(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function icsDate(value) {
  return new Date(value).toISOString().replace(/[-:]/g, "").replace(".000", "");
}

function clampDate(value, fallback) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function pickRoomColor(room) {
  const usage = new Map(participantPalette.map((color) => [color, 0]));
  for (const participant of room.participants) {
    if (usage.has(participant.color)) {
      usage.set(participant.color, usage.get(participant.color) + 1);
    }
  }

  return [...usage.entries()].sort((a, b) => a[1] - b[1])[0][0];
}

function getDisplayNameForSession(session, user, fallback = "Guest") {
  return String(session.pendingDisplayName || userDisplayName(user) || fallback).trim() || fallback;
}

function findRoom(code) {
  return store.rooms[normalizeRoomCode(code)] || null;
}

function isHost(room, session, user) {
  if (!room) return false;
  if (room.hostSessionId && room.hostSessionId === session.id) return true;
  if (room.hostUserId && user?.id && room.hostUserId === user.id) return true;
  return false;
}

function findParticipant(room, session, user = null) {
  return room.participants.find((participant) => participant.sessionIds?.includes(session.id))
    || (user?.id ? room.participants.find((participant) => participant.userId === user.id) : null)
    || null;
}

function findParticipantById(room, participantId) {
  return room.participants.find((participant) => participant.id === participantId) || null;
}

function isRoomLocked(room) {
  return Boolean(room?.access?.locked);
}

function hasApprovedRoomAccess(room, session, user) {
  if (!room?.access) return false;
  if (room.access.approvedSessionIds?.includes(session.id)) return true;
  if (user?.id && room.access.approvedUserIds?.includes(user.id)) return true;
  return false;
}

function canJoinLockedRoom(room, session, user) {
  return isHost(room, session, user) || Boolean(findParticipant(room, session, user)) || hasApprovedRoomAccess(room, session, user);
}

function activeJoinRequest(room, session, user) {
  return (room.joinRequests || []).find((request) => {
    if (request.status !== "pending") return false;
    if (user?.id && request.userId === user.id) return true;
    return request.sessionId === session.id;
  }) || null;
}

function upsertJoinRequest(room, session, user, displayName, source = "guest") {
  room.joinRequests = room.joinRequests || [];
  const existing = (room.joinRequests || []).find((request) => {
    if (user?.id && request.userId === user.id) return true;
    return request.sessionId === session.id;
  });
  const time = nowIso();

  if (existing) {
    existing.displayName = String(displayName || existing.displayName || "Guest").trim() || "Guest";
    existing.picture = userPicture(user) || existing.picture || null;
    existing.source = source === "google" ? "google" : "guest";
    existing.status = "pending";
    existing.updatedAt = time;
    existing.requestedAt = existing.requestedAt || time;
    return existing;
  }

  const request = {
    id: generateId("joinrequest"),
    sessionId: session.id,
    userId: user?.id || null,
    displayName: String(displayName || getDisplayNameForSession(session, user, "Guest")).trim() || "Guest",
    picture: userPicture(user) || null,
    source: source === "google" ? "google" : "guest",
    status: "pending",
    requestedAt: time,
    updatedAt: time
  };
  room.joinRequests.push(request);
  return request;
}

function approveJoinRequest(room, request) {
  room.access = room.access || { locked: false, approvedSessionIds: [], approvedUserIds: [], updatedAt: nowIso() };
  room.access.approvedSessionIds = uniqueStrings([...(room.access.approvedSessionIds || []), request.sessionId]);
  if (request.userId) {
    room.access.approvedUserIds = uniqueStrings([...(room.access.approvedUserIds || []), request.userId]);
  }
  request.status = "approved";
  request.updatedAt = nowIso();
  room.access.updatedAt = nowIso();
}

function settleJoinRequestsForIdentity(room, session, user) {
  for (const request of room.joinRequests || []) {
    if (request.status !== "pending") continue;
    if (user?.id && request.userId === user.id) {
      request.status = "approved";
      request.updatedAt = nowIso();
    } else if (request.sessionId === session.id) {
      request.status = "approved";
      request.updatedAt = nowIso();
    }
  }
}

function ensureParticipant(room, session, user, displayName = null) {
  let participant = findParticipant(room, session, user);
  const time = nowIso();
  const fallbackName = getDisplayNameForSession(session, user, "Guest");
  const nextDisplayName = String(displayName || fallbackName).trim() || fallbackName;
  const accountColor = userPreferredColor(user);
  const nextDisplayNameSource = user && nextDisplayName === userDisplayName(user) ? preferredDisplayNameSource(user) : (displayName ? "custom" : "google");

  if (!participant) {
    participant = {
      id: generateId("participant"),
      sessionId: session.id,
      sessionIds: [session.id],
      userId: user?.id || null,
      displayName: nextDisplayName,
      displayNameSource: nextDisplayNameSource,
      color: accountColor || pickRoomColor(room),
      connected: userConnected(user),
      needsReconnect: false,
      syncStatus: userConnected(user) ? "connected" : "guest",
      lastSyncedAt: null,
      lastSyncError: null,
      lastCalendarId: null,
      lastCalendarName: null,
      joinedAt: time,
      lastSeenAt: time,
      picture: userPicture(user)
    };
    room.participants.push(participant);
  } else {
    participant.sessionIds = uniqueStrings([...(participant.sessionIds || []), participant.sessionId, session.id]);
    participant.sessionId = session.id;
    participant.lastSeenAt = time;
    if (displayName) {
      participant.displayName = nextDisplayName;
      participant.displayNameSource = nextDisplayNameSource;
    }
    if (!participant.displayName) {
      participant.displayName = nextDisplayName;
      participant.displayNameSource = nextDisplayNameSource;
    }
    if (user?.id) participant.userId = user.id;
    if (accountColor && participant.userId === user?.id && participant.displayNameSource !== "custom") {
      participant.color = accountColor;
    }
    if (userPicture(user)) participant.picture = userPicture(user);
    participant.connected = userConnected(user);
    participant.syncStatus = participant.needsReconnect ? "needs_reconnect" : (participant.connected ? "connected" : "guest");
  }

  if (participant.userId && !room.hostUserId && room.hostSessionId === session.id) {
    room.hostUserId = participant.userId;
  }

  room.updatedAt = time;
  return participant;
}

function roomPublic(room, session, user, viewerParticipantId = null) {
  const viewerIsHost = isHost(room, session, user);
  return {
    id: room.id,
    code: room.code,
    name: room.name,
    icon: room.icon || "",
    accessLocked: isRoomLocked(room),
    pendingJoinRequests: viewerIsHost
      ? (room.joinRequests || [])
          .filter((request) => request.status === "pending")
          .map((request) => ({
            id: request.id,
            displayName: request.displayName,
            picture: request.picture || null,
            source: request.source,
            requestedAt: request.requestedAt
          }))
      : [],
    participants: room.participants.map((participant) => ({
      id: participant.id,
      userId: participant.userId,
      displayName: participant.displayName,
      color: participant.color,
      connected: Boolean(participant.connected),
      needsReconnect: Boolean(participant.needsReconnect),
      joinedAt: participant.joinedAt,
      lastSeenAt: participant.lastSeenAt,
      picture: participant.picture || null,
      syncStatus: participant.syncStatus || (participant.needsReconnect ? "needs_reconnect" : (participant.connected ? "connected" : "guest")),
      lastSyncedAt: participant.lastSyncedAt || null,
      lastSyncError: participant.lastSyncError || null,
      lastCalendarName: participant.lastCalendarName || null,
      isCurrent: participant.sessionIds?.includes(session.id) || participant.sessionId === session.id
    })),
    events: room.events.map((event) => publicEvent(event, room, viewerParticipantId)),
    createdAt: room.createdAt,
    updatedAt: room.updatedAt
  };
}

function participantPayload(participant, room, session) {
  if (!participant) return null;
  return {
    id: participant.id,
    userId: participant.userId,
    displayName: participant.displayName,
    color: participant.color,
    connected: Boolean(participant.connected),
    needsReconnect: Boolean(participant.needsReconnect),
    joinedAt: participant.joinedAt,
    lastSeenAt: participant.lastSeenAt,
    picture: participant.picture || null,
    syncStatus: participant.syncStatus || (participant.needsReconnect ? "needs_reconnect" : (participant.connected ? "connected" : "guest")),
    lastSyncedAt: participant.lastSyncedAt || null,
    lastSyncError: participant.lastSyncError || null,
    lastCalendarName: participant.lastCalendarName || null,
    isHost: isHost(room, session, currentUserFromSession(session))
  };
}

function buildRoomResponse(room, session, participant) {
  const user = currentUserFromSession(session);
  return {
    room: roomPublic(room, session, user, participant?.id || null),
    participant: participantPayload(participant, room, session),
    isHost: isHost(room, session, user)
  };
}

function requireRoomParticipant(req, res, roomCode) {
  const session = getSession(req, res);
  const user = currentUserFromSession(session);
  const room = findRoom(roomCode);
  if (!room) {
    sendJson(res, 404, { error: "Room not found." });
    return null;
  }

  if (isRoomLocked(room) && !canJoinLockedRoom(room, session, user)) {
    sendJson(res, 403, { error: "This room is locked. Send a join request for host approval.", locked: true });
    return null;
  }

  const participant = ensureParticipant(room, session, user);
  settleJoinRequestsForIdentity(room, session, user);
  saveStore();
  return { session, user, room, participant };
}

function updateParticipantFromUser(room, participant, user) {
  if (!participant || !user) return;
  participant.userId = user.id;
  participant.connected = userConnected(user);
  participant.picture = userPicture(user) || participant.picture || null;
  participant.needsReconnect = false;
  participant.syncStatus = participant.connected ? "connected" : "guest";
  if (!participant.displayName || participant.displayName === "Guest" || participant.displayNameSource !== "custom") {
    participant.displayName = userDisplayName(user) || participant.displayName;
    participant.displayNameSource = preferredDisplayNameSource(user);
  }
  if (userPreferredColor(user)) participant.color = userPreferredColor(user);
  room.updatedAt = nowIso();
}

function ensureParticipantAvailabilityState(participant) {
  participant.availabilityOverrides = participant.availabilityOverrides || {};
  participant.localAvailabilityItems = participant.localAvailabilityItems || [];
}

function normalizeSharedParticipantIds(room, participant, requestedIds) {
  const validIds = new Set(
    room.participants
      .map((entry) => entry.id)
      .filter((id) => id !== participant.id)
  );

  return [...new Set(
    (Array.isArray(requestedIds) ? requestedIds : [])
      .map((value) => String(value || "").trim())
      .filter((value) => value && validIds.has(value))
  )];
}

function googleItemSourceId(calendarId, eventId) {
  return `google:${calendarId}:${eventId}`;
}

function localItemSourceId(itemId) {
  return `local:${itemId}`;
}

function parseGoogleEventTime(value, fallbackToEnd = false) {
  if (value?.dateTime) return new Date(value.dateTime);
  if (value?.date) {
    const date = new Date(`${value.date}T00:00:00.000Z`);
    if (fallbackToEnd) {
      return date;
    }
    return date;
  }
  return null;
}

async function fetchPrimaryCalendarEvents(accessToken, calendarId, timeMin, timeMax) {
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("timeMin", timeMin.toISOString());
  url.searchParams.set("timeMax", timeMax.toISOString());
  url.searchParams.set("maxResults", "2500");
  url.searchParams.set("fields", "items(id,summary,location,description,start,end,transparency,status)");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || "Could not fetch calendar event details.");
  }
  return payload.items || [];
}

function listConnectedParticipants(room) {
  return room.participants.filter((participant) => participant.userId && userConnected(store.users[participant.userId]));
}

async function getFreshTokensForUser(userId) {
  const user = store.users[userId];
  const tokens = userTokens(user);
  if (!tokens?.access_token) return null;
  if (!tokens.expires_at || Date.now() < tokens.expires_at - 60_000) {
    return tokens;
  }

  const refreshed = await refreshAccessToken(tokens);
  updateUserRecord(userId, {
    googleTokens: refreshed,
    auth: {
      google: {
        tokens: refreshed,
        scopes: uniqueStrings(typeof refreshed?.scope === "string" ? refreshed.scope.split(" ") : user.googleScopes || []),
        updatedAt: nowIso()
      }
    }
  });
  saveStore();
  return refreshed;
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

async function fetchUserFreeBusy(room, user, participant, timeMin, timeMax, viewerParticipantId) {
  const fallbackStart = new Date();
  fallbackStart.setHours(0, 0, 0, 0);
  const fallbackEnd = new Date(fallbackStart);
  fallbackEnd.setDate(fallbackEnd.getDate() + 7);

  const start = clampDate(timeMin, fallbackStart);
  const end = clampDate(timeMax, fallbackEnd);
  const tokens = await getFreshTokensForUser(user.id);
  if (!tokens?.access_token) {
    participant.syncStatus = "needs_reconnect";
    participant.lastSyncError = "Google Calendar needs reconnecting.";
    updateUserSync(user.id, {
      status: "needs_reconnect",
      lastAttemptAt: nowIso(),
      lastError: "Google Calendar needs reconnecting."
    });
    return { busy: [], connected: false, needsReconnect: true, calendarCount: 0 };
  }

  const calendarList = await fetchCalendarList(tokens.access_token);
  const primaryCalendar = calendarList.calendars[0];
  ensureParticipantAvailabilityState(participant);
  const response = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
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
    const message = payload.error?.message || "Could not fetch calendar availability.";
    participant.lastSyncError = message;
    participant.lastSyncedAt = null;
    if (response.status === 401 || response.status === 403) {
      participant.needsReconnect = true;
      participant.connected = false;
      participant.syncStatus = "needs_reconnect";
      updateUserSync(user.id, {
        status: "needs_reconnect",
        lastAttemptAt: nowIso(),
        lastError: message
      });
      saveStore();
    } else {
      participant.syncStatus = "error";
      updateUserSync(user.id, {
        status: "error",
        lastAttemptAt: nowIso(),
        lastError: message
      });
      saveStore();
    }
    throw new Error(message);
  }

  participant.connected = true;
  participant.needsReconnect = false;
  participant.syncStatus = "connected";
  participant.lastSyncedAt = nowIso();
  participant.lastSyncError = null;
  participant.lastCalendarId = primaryCalendar?.id || null;
  participant.lastCalendarName = primaryCalendar?.summary || "Primary calendar";
  participant.lastSeenAt = nowIso();
  updateUserSync(user.id, {
    status: "connected",
    lastAttemptAt: nowIso(),
    lastSuccessAt: nowIso(),
    lastError: null,
    calendarId: primaryCalendar?.id || null,
    calendarName: primaryCalendar?.summary || "Primary calendar"
  });
  const calendarsById = new Map(calendarList.calendars.map((calendar) => [calendar.id, calendar]));
  const detailEvents = primaryCalendar ? await fetchPrimaryCalendarEvents(tokens.access_token, primaryCalendar.id, start, end) : [];
  const busy = detailEvents
    .filter((event) => event.status !== "cancelled" && event.transparency !== "transparent")
    .map((event) => {
      const sourceId = googleItemSourceId(primaryCalendar.id, event.id);
      const override = participant.availabilityOverrides[sourceId] || {};
      if (override.hidden) return null;

      const startDate = override.start ? new Date(override.start) : parseGoogleEventTime(event.start);
      const endDate = override.end ? new Date(override.end) : parseGoogleEventTime(event.end, true);
      if (!startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
        return null;
      }

      const visibility = override.visibility === "shared" ? "shared" : "busy";
      const sharedWithParticipantIds = normalizeSharedParticipantIds(room, participant, override.sharedWithParticipantIds);
      const viewerCanSeeDetails =
        participant.id === viewerParticipantId ||
        visibility === "shared" ||
        sharedWithParticipantIds.includes(viewerParticipantId);
      const title = override.title ?? event.summary ?? "";
      const location = override.location ?? event.location ?? "";
      const description = override.description ?? event.description ?? "";
      const item = {
        sourceId,
        provider: "google",
        title: viewerCanSeeDetails ? title : "",
        location: viewerCanSeeDetails ? location : "",
        description: viewerCanSeeDetails ? description : "",
        visibility,
        sharedWithParticipantIds,
        editable: participant.id === viewerParticipantId,
        start: startDate.toISOString(),
        end: endDate.toISOString()
      };

      return {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        ownerId: user.id,
        participantId: participant.id,
        ownerName: participant.displayName,
        ownerEmail: user.email || null,
        color: participant.color,
        busy: true,
        calendarId: primaryCalendar.id,
        calendarColor: primaryCalendar.backgroundColor || participant.color,
        items: [item]
      };
    })
    .filter(Boolean);

  for (const localItem of participant.localAvailabilityItems) {
    const startDate = new Date(localItem.start);
    const endDate = new Date(localItem.end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) continue;
    if (endDate <= start || startDate >= end) continue;
    const visibility = localItem.visibility === "shared" ? "shared" : "busy";
    const sharedWithParticipantIds = normalizeSharedParticipantIds(room, participant, localItem.sharedWithParticipantIds);
    const viewerCanSeeDetails =
      participant.id === viewerParticipantId ||
      visibility === "shared" ||
      sharedWithParticipantIds.includes(viewerParticipantId);
    busy.push({
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      ownerId: user.id,
      participantId: participant.id,
      ownerName: participant.displayName,
      ownerEmail: user.email || null,
      color: participant.color,
      busy: true,
      calendarId: "local",
      calendarColor: participant.color,
      items: [{
        sourceId: localItemSourceId(localItem.id),
        provider: "local",
        title: viewerCanSeeDetails ? localItem.title : "",
        location: viewerCanSeeDetails ? localItem.location || "" : "",
        description: viewerCanSeeDetails ? localItem.description || "" : "",
        visibility,
        sharedWithParticipantIds,
        editable: participant.id === viewerParticipantId,
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }]
    });
  }

  saveStore();
  return {
    busy,
    connected: true,
    needsReconnect: calendarList.needsReconnect,
    calendarCount: calendarList.calendars.length,
    calendarListError: calendarList.calendarListError
  };
}

async function fetchRoomFreeBusy(room, timeMin, timeMax, viewerParticipantId) {
  const participants = room.participants.map((participant) => ({ ...participant }));
  const busy = [];
  let connectedCount = 0;

  for (const participant of room.participants) {
    if (!participant.userId) continue;
    const user = store.users[participant.userId];
    if (!user) continue;

    try {
      const result = await fetchUserFreeBusy(room, user, participant, timeMin, timeMax, viewerParticipantId);
      if (result.connected) connectedCount += 1;
      busy.push(...result.busy);
    } catch (error) {
      participant.needsReconnect = true;
      participant.syncStatus = participant.connected ? "error" : "needs_reconnect";
      participant.lastSyncError = error.message || "Could not refresh Google Calendar.";
    }
  }

  room.updatedAt = nowIso();
  saveStore();
  return {
    source: "google",
    busy,
    participants: room.participants.map((participant) => ({
      id: participant.id,
      displayName: participant.displayName,
      color: participant.color,
      connected: Boolean(participant.connected),
      needsReconnect: Boolean(participant.needsReconnect),
      syncStatus: participant.syncStatus || (participant.needsReconnect ? "needs_reconnect" : (participant.connected ? "connected" : "guest")),
      lastSyncedAt: participant.lastSyncedAt || null,
      lastSyncError: participant.lastSyncError || null,
      lastCalendarName: participant.lastCalendarName || null
    })),
    connectedCount,
    fetchedAt: nowIso()
  };
}

function buildGoogleAuthUrl(session, roomCode) {
  const credentials = loadGoogleCredentials();
  if (!credentials) return null;

  const state = crypto.randomBytes(16).toString("hex");
  oauthStates.set(state, {
    roomCode: roomCode ? normalizeRoomCode(roomCode) : null,
    sessionId: session.id
  });

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

function validateEventInput(body) {
  const title = String(body.title || "").trim() || "No title";
  const start = new Date(body.start);
  const end = new Date(body.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Event start and end are required.");
  }
  if (end <= start) throw new Error("Event end must be after start.");

  return {
    title,
    date: start.toISOString().slice(0, 10),
    start: start.toISOString(),
    end: end.toISOString(),
    location: String(body.location || "").trim(),
    description: String(body.description || "").trim()
  };
}

function normalizeInviteeParticipantIds(room, inviteeParticipantIds, creatorParticipantId) {
  const requestedIds = Array.isArray(inviteeParticipantIds) ? inviteeParticipantIds : [];
  const validIds = new Set(room.participants.map((participant) => participant.id));
  const normalized = [...new Set(
    requestedIds
      .map((value) => String(value || "").trim())
      .filter((value) => value && validIds.has(value))
  )];
  if (creatorParticipantId && validIds.has(creatorParticipantId) && !normalized.includes(creatorParticipantId)) {
    normalized.unshift(creatorParticipantId);
  }
  return normalized;
}

function responseSummary(event) {
  const counts = { yes: 0, maybe: 0, no: 0 };
  const invitees = new Set(event.inviteeParticipantIds || []);
  for (const [participantId, response] of Object.entries(event.responses || {})) {
    if (!invitees.has(participantId)) continue;
    if (counts[response] !== undefined) counts[response] += 1;
  }
  return counts;
}

function publicEvent(event, room, viewerParticipantId = null) {
  const responseMap = event.responses || {};
  const creator = room.participants.find((participant) => participant.id === event.createdByParticipantId) || null;
  const voters = { yes: [], maybe: [], no: [] };
  const inviteeParticipantIds = event.inviteeParticipantIds || [];
  const inviteeSet = new Set(inviteeParticipantIds);
  for (const participant of room.participants) {
    if (!inviteeSet.has(participant.id)) continue;
    const response = responseMap[participant.id];
    if (response && voters[response]) {
      voters[response].push({
        participantId: participant.id,
        displayName: participant.displayName,
        color: participant.color
      });
    }
  }

  const canSeeDetails = viewerParticipantId === event.createdByParticipantId || inviteeParticipantIds.includes(viewerParticipantId);

  return {
    ...event,
    createdByDisplayName: creator?.displayName || "Someone",
    createdByColor: creator?.color || participantPalette[0],
    title: canSeeDetails ? event.title : "Busy",
    location: canSeeDetails ? event.location : "",
    description: canSeeDetails ? event.description : "",
    viewerCanSeeDetails: canSeeDetails,
    isInvited: inviteeParticipantIds.includes(viewerParticipantId),
    invitees: inviteeParticipantIds
      .map((participantId) => room.participants.find((participant) => participant.id === participantId))
      .filter(Boolean)
      .map((participant) => ({
        participantId: participant.id,
        displayName: participant.displayName,
        color: participant.color
      })),
    responseSummary: responseSummary(event),
    voters
  };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const roomCodeMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)$/);
  const roomJoinMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/join$/);
  const roomJoinRequestMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/join-requests\/([^/]+)$/);
  const roomRefreshCodeMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/refresh-code$/);
  const roomParticipantPatchMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/participants\/([^/]+)$/);
  const roomParticipantDeleteMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/participants\/([^/]+)$/);
  const roomFreeBusyMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/freebusy$/);
  const roomAvailabilityItemsMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/availability-items$/);
  const roomAvailabilityItemMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/availability-items\/([^/]+)$/);
  const roomEventsMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/events$/);
  const roomEventMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/events\/([^/]+)$/);
  const roomEventRespondMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/events\/([^/]+)\/respond$/);
  const roomEventCommentsMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/events\/([^/]+)\/comments$/);
  const roomEventIcsMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/events\/([^/]+)\/ics$/);

  try {
    if (url.pathname === "/api/config") {
      sendJson(res, 200, {
        googleReady: Boolean(loadGoogleCredentials()),
        redirectUri
      });
      return;
    }

    if (url.pathname === "/api/me") {
      const session = getSession(req, res);
      const user = currentUserFromSession(session);
      sendJson(res, 200, {
        sessionId: session.id,
        connected: userConnected(user),
        user: publicUser(user),
        displayName: session.pendingDisplayName || userDisplayName(user) || "",
        roomCode: session.lastRoomCode || null
      });
      return;
    }

    if (url.pathname === "/api/rooms" && req.method === "POST") {
      const session = getSession(req, res);
      const user = currentUserFromSession(session);
      const body = await readJsonBody(req);
      const roomName = String(body.name || "").trim() || "Untitled room";
      const displayName = String(body.displayName || "").trim() || getDisplayNameForSession(session, user, "Guest");
      const code = generateRoomCode();
      const time = nowIso();

      session.pendingDisplayName = displayName;
      session.lastRoomCode = code;

      const room = {
        id: code,
        code,
        name: roomName,
        icon: normalizeRoomIcon(body.icon),
        hostSessionId: session.id,
        hostUserId: user?.id || null,
        access: {
          locked: false,
          approvedSessionIds: [],
          approvedUserIds: [],
          updatedAt: time
        },
        joinRequests: [],
        participants: [],
        events: [],
        createdAt: time,
        updatedAt: time
      };

      const participant = ensureParticipant(room, session, user, displayName);
      updateParticipantFromUser(room, participant, user);
      store.rooms[code] = room;
      saveStore();

      sendJson(res, 201, buildRoomResponse(room, session, participant));
      return;
    }

    if (roomCodeMatch && req.method === "GET") {
      const code = normalizeRoomCode(roomCodeMatch[1]);
      const session = getSession(req, res);
      const user = currentUserFromSession(session);
      const room = findRoom(code);
      if (!room) {
        sendJson(res, 404, { error: "Room not found." });
        return;
      }

       if (isRoomLocked(room) && !canJoinLockedRoom(room, session, user)) {
        sendJson(res, 403, { error: "This room is locked. Send a join request for host approval.", locked: true });
        return;
      }

      session.lastRoomCode = code;
      const participant = ensureParticipant(room, session, user);
      updateParticipantFromUser(room, participant, user);
      settleJoinRequestsForIdentity(room, session, user);
      saveStore();
      sendJson(res, 200, buildRoomResponse(room, session, participant));
      return;
    }

    if (roomJoinMatch && req.method === "POST") {
      const code = normalizeRoomCode(roomJoinMatch[1]);
      const session = getSession(req, res);
      const user = currentUserFromSession(session);
      const room = findRoom(code);
      if (!room) {
        sendJson(res, 404, { error: "Room not found." });
        return;
      }

      const body = await readJsonBody(req);
      const displayName = String(body.displayName || "").trim() || getDisplayNameForSession(session, user, "Guest");
      session.pendingDisplayName = displayName;
      session.lastRoomCode = code;

      if (isRoomLocked(room) && !canJoinLockedRoom(room, session, user)) {
        const request = upsertJoinRequest(room, session, user, displayName, userConnected(user) ? "google" : "guest");
        room.updatedAt = nowIso();
        saveStore();
        sendJson(res, 202, {
          requested: true,
          requestId: request.id,
          message: "This room is locked. Your join request has been sent to the host."
        });
        return;
      }

      const participant = ensureParticipant(room, session, user, displayName);
      updateParticipantFromUser(room, participant, user);
      settleJoinRequestsForIdentity(room, session, user);
      saveStore();
      sendJson(res, 200, buildRoomResponse(room, session, participant));
      return;
    }

    if (roomCodeMatch && req.method === "PATCH") {
      const auth = requireRoomParticipant(req, res, roomCodeMatch[1]);
      if (!auth) return;
      if (!isHost(auth.room, auth.session, auth.user)) {
        sendJson(res, 403, { error: "Only the host can edit the room." });
        return;
      }

      const body = await readJsonBody(req);
      const name = String(body.name || "").trim();
      const nextCode = typeof body.code === "string" ? normalizeRoomCode(body.code) : "";
      const nextIcon = typeof body.icon === "string" ? normalizeRoomIcon(body.icon) : null;
      const nextLocked = typeof body.locked === "boolean" ? body.locked : null;

      if (!name && !nextCode && nextIcon === null && nextLocked === null) {
        sendJson(res, 400, { error: "Room name, icon, code, or lock state is required." });
        return;
      }

      if (name) {
        auth.room.name = name;
      }

      if (nextIcon !== null) {
        auth.room.icon = nextIcon;
      }

      if (nextLocked !== null) {
        auth.room.access = auth.room.access || { locked: false, approvedSessionIds: [], approvedUserIds: [], updatedAt: nowIso() };
        auth.room.access.locked = nextLocked;
        auth.room.access.updatedAt = nowIso();
      }

      if (nextCode && nextCode !== auth.room.code) {
        if (!isValidRoomCode(nextCode)) {
          sendJson(res, 400, { error: "Room codes must be 3-16 letters." });
          return;
        }
        if (store.rooms[nextCode]) {
          sendJson(res, 409, { error: "That room code is already taken." });
          return;
        }

        const oldCode = auth.room.code;
        auth.room.code = nextCode;
        auth.room.id = nextCode;
        delete store.rooms[oldCode];
        store.rooms[nextCode] = auth.room;
        auth.session.lastRoomCode = nextCode;
      }

      auth.room.updatedAt = nowIso();
      saveStore();
      sendJson(res, 200, buildRoomResponse(auth.room, auth.session, auth.participant));
      return;
    }

    if (roomJoinRequestMatch && req.method === "PATCH") {
      const auth = requireRoomParticipant(req, res, roomJoinRequestMatch[1]);
      if (!auth) return;
      if (!isHost(auth.room, auth.session, auth.user)) {
        sendJson(res, 403, { error: "Only the host can manage join requests." });
        return;
      }

      const request = (auth.room.joinRequests || []).find((entry) => entry.id === roomJoinRequestMatch[2]);
      if (!request) {
        sendJson(res, 404, { error: "Join request not found." });
        return;
      }

      const body = await readJsonBody(req);
      const status = String(body.status || "").trim().toLowerCase();
      if (!["approved", "denied"].includes(status)) {
        sendJson(res, 400, { error: "Status must be approved or denied." });
        return;
      }

      if (status === "approved") {
        approveJoinRequest(auth.room, request);
      } else {
        request.status = "denied";
        request.updatedAt = nowIso();
      }

      auth.room.updatedAt = nowIso();
      saveStore();
      sendJson(res, 200, buildRoomResponse(auth.room, auth.session, auth.participant));
      return;
    }

    if (roomRefreshCodeMatch && req.method === "POST") {
      const auth = requireRoomParticipant(req, res, roomRefreshCodeMatch[1]);
      if (!auth) return;
      if (!isHost(auth.room, auth.session, auth.user)) {
        sendJson(res, 403, { error: "Only the host can refresh the room code." });
        return;
      }

      const oldCode = auth.room.code;
      const newCode = generateRoomCode();
      auth.room.code = newCode;
      auth.room.id = newCode;
      auth.room.updatedAt = nowIso();
      delete store.rooms[oldCode];
      store.rooms[newCode] = auth.room;
      auth.session.lastRoomCode = newCode;
      saveStore();
      sendJson(res, 200, buildRoomResponse(auth.room, auth.session, auth.participant));
      return;
    }

    if (roomCodeMatch && req.method === "DELETE") {
      const auth = requireRoomParticipant(req, res, roomCodeMatch[1]);
      if (!auth) return;
      if (!isHost(auth.room, auth.session, auth.user)) {
        sendJson(res, 403, { error: "Only the host can delete the room." });
        return;
      }

      delete store.rooms[auth.room.code];
      saveStore();
      sendJson(res, 200, { deleted: true });
      return;
    }

    if (roomParticipantPatchMatch && req.method === "PATCH") {
      const auth = requireRoomParticipant(req, res, roomParticipantPatchMatch[1]);
      if (!auth) return;

      const target = findParticipantById(auth.room, roomParticipantPatchMatch[2]);
      if (!target) {
        sendJson(res, 404, { error: "Participant not found." });
        return;
      }

      const canEdit = target.id === auth.participant.id || isHost(auth.room, auth.session, auth.user);
      if (!canEdit) {
        sendJson(res, 403, { error: "You cannot edit this participant." });
        return;
      }

      const body = await readJsonBody(req);
      const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
      const color = typeof body.color === "string" ? body.color.trim() : "";

      if (!displayName && !color) {
        sendJson(res, 400, { error: "Display name or colour is required." });
        return;
      }

      if (displayName) {
        target.displayName = displayName;
        target.displayNameSource = "custom";
      }

      if (color) {
        if (!participantPaletteSet.has(color)) {
          sendJson(res, 400, { error: "Choose a valid participant colour." });
          return;
        }
        target.color = color;
      }

      target.lastSeenAt = nowIso();
      auth.room.updatedAt = nowIso();
      if (target.id === auth.participant.id && displayName) {
        auth.session.pendingDisplayName = displayName;
      }
      const isSelfAuthenticatedIdentity = target.id === auth.participant.id && target.userId && auth.user?.id === target.userId;
      if (isSelfAuthenticatedIdentity && (displayName || color)) {
        setUserPreferredIdentity(target.userId, {
          displayName: displayName || undefined,
          color: color || undefined
        });
        propagateUserIdentityToRooms(target.userId);
      }
      saveStore();
      sendJson(res, 200, buildRoomResponse(auth.room, auth.session, auth.participant));
      return;
    }

    if (roomParticipantDeleteMatch && req.method === "DELETE") {
      const auth = requireRoomParticipant(req, res, roomParticipantDeleteMatch[1]);
      if (!auth) return;
      if (!isHost(auth.room, auth.session, auth.user)) {
        sendJson(res, 403, { error: "Only the host can remove participants." });
        return;
      }

      const targetId = roomParticipantDeleteMatch[2];
      auth.room.participants = auth.room.participants.filter((participant) => participant.id !== targetId);
      for (const event of auth.room.events) {
        delete event.responses?.[targetId];
        event.comments = (event.comments || []).filter((comment) => comment.participantId !== targetId);
        event.inviteeParticipantIds = (event.inviteeParticipantIds || []).filter((participantId) => participantId !== targetId);
      }
      auth.room.updatedAt = nowIso();
      saveStore();
      sendJson(res, 200, buildRoomResponse(auth.room, auth.session, auth.participant));
      return;
    }

    if (roomAvailabilityItemsMatch && req.method === "POST") {
      const auth = requireRoomParticipant(req, res, roomAvailabilityItemsMatch[1]);
      if (!auth) return;
      ensureParticipantAvailabilityState(auth.participant);
      const body = await readJsonBody(req);
      const start = new Date(body.start);
      const end = new Date(body.end);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
        sendJson(res, 400, { error: "Start and end are required." });
        return;
      }
      auth.participant.localAvailabilityItems.push({
        id: generateId("localbusy"),
        title: String(body.title || "Busy").trim() || "Busy",
        location: String(body.location || "").trim(),
        description: String(body.description || "").trim(),
        visibility: body.visibility === "shared" ? "shared" : "busy",
        sharedWithParticipantIds: normalizeSharedParticipantIds(auth.room, auth.participant, body.sharedWithParticipantIds),
        start: start.toISOString(),
        end: end.toISOString(),
        createdAt: nowIso()
      });
      auth.participant.lastSeenAt = nowIso();
      auth.room.updatedAt = nowIso();
      saveStore();
      sendJson(res, 201, { ok: true });
      return;
    }

    if (roomAvailabilityItemMatch && req.method === "PATCH") {
      const auth = requireRoomParticipant(req, res, roomAvailabilityItemMatch[1]);
      if (!auth) return;
      ensureParticipantAvailabilityState(auth.participant);
      const itemId = decodeURIComponent(roomAvailabilityItemMatch[2]);
      const body = await readJsonBody(req);

      if (itemId.startsWith("local:")) {
        const localId = itemId.slice(6);
        const item = auth.participant.localAvailabilityItems.find((entry) => entry.id === localId);
        if (!item) {
          sendJson(res, 404, { error: "Local item not found." });
          return;
        }
        if (typeof body.title === "string") item.title = body.title.trim() || "Busy";
        if (typeof body.location === "string") item.location = body.location.trim();
        if (typeof body.description === "string") item.description = body.description.trim();
        if (typeof body.visibility === "string") item.visibility = body.visibility === "shared" ? "shared" : "busy";
        if (Array.isArray(body.sharedWithParticipantIds)) {
          item.sharedWithParticipantIds = normalizeSharedParticipantIds(auth.room, auth.participant, body.sharedWithParticipantIds);
        }
        if (typeof body.start === "string") item.start = new Date(body.start).toISOString();
        if (typeof body.end === "string") item.end = new Date(body.end).toISOString();
      } else {
        const override = auth.participant.availabilityOverrides[itemId] || {};
        if (typeof body.title === "string") override.title = body.title.trim();
        if (typeof body.location === "string") override.location = body.location.trim();
        if (typeof body.description === "string") override.description = body.description.trim();
        if (typeof body.visibility === "string") override.visibility = body.visibility === "shared" ? "shared" : "busy";
        if (Array.isArray(body.sharedWithParticipantIds)) {
          override.sharedWithParticipantIds = normalizeSharedParticipantIds(auth.room, auth.participant, body.sharedWithParticipantIds);
        }
        if (typeof body.start === "string") override.start = new Date(body.start).toISOString();
        if (typeof body.end === "string") override.end = new Date(body.end).toISOString();
        if (typeof body.hidden === "boolean") override.hidden = body.hidden;
        auth.participant.availabilityOverrides[itemId] = override;
      }

      auth.participant.lastSeenAt = nowIso();
      auth.room.updatedAt = nowIso();
      saveStore();
      sendJson(res, 200, { ok: true });
      return;
    }

    if (roomAvailabilityItemMatch && req.method === "DELETE") {
      const auth = requireRoomParticipant(req, res, roomAvailabilityItemMatch[1]);
      if (!auth) return;
      ensureParticipantAvailabilityState(auth.participant);
      const itemId = decodeURIComponent(roomAvailabilityItemMatch[2]);
      if (itemId.startsWith("local:")) {
        const localId = itemId.slice(6);
        auth.participant.localAvailabilityItems = auth.participant.localAvailabilityItems.filter((entry) => entry.id !== localId);
      } else {
        auth.participant.availabilityOverrides[itemId] = {
          ...(auth.participant.availabilityOverrides[itemId] || {}),
          hidden: true
        };
      }
      auth.participant.lastSeenAt = nowIso();
      auth.room.updatedAt = nowIso();
      saveStore();
      sendJson(res, 200, { ok: true });
      return;
    }

    if (roomFreeBusyMatch && req.method === "GET") {
      const auth = requireRoomParticipant(req, res, roomFreeBusyMatch[1]);
      if (!auth) return;
      const result = await fetchRoomFreeBusy(
        auth.room,
        url.searchParams.get("timeMin"),
        url.searchParams.get("timeMax"),
        auth.participant.id
      );
      sendJson(res, 200, result);
      return;
    }

    if (roomEventsMatch && req.method === "POST") {
      const auth = requireRoomParticipant(req, res, roomEventsMatch[1]);
      if (!auth) return;

      const body = await readJsonBody(req);
      const eventFields = validateEventInput(body);
      const inviteeParticipantIds = normalizeInviteeParticipantIds(
        auth.room,
        body.inviteeParticipantIds,
        auth.participant.id
      );
      const event = {
        id: generateId("event"),
        ...eventFields,
        inviteeParticipantIds,
        createdByParticipantId: auth.participant.id,
        createdAt: nowIso(),
        responses: {},
        comments: []
      };

      auth.room.events.push(event);
      auth.room.updatedAt = nowIso();
      saveStore();
      sendJson(res, 201, { event: publicEvent(event, auth.room, auth.participant.id) });
      return;
    }

    if (roomEventMatch && req.method === "PATCH") {
      const auth = requireRoomParticipant(req, res, roomEventMatch[1]);
      if (!auth) return;
      const event = auth.room.events.find((item) => item.id === roomEventMatch[2]);
      if (!event) {
        sendJson(res, 404, { error: "Event not found." });
        return;
      }
      const canEdit = event.createdByParticipantId === auth.participant.id || isHost(auth.room, auth.session, auth.user);
      if (!canEdit) {
        sendJson(res, 403, { error: "You cannot edit this event." });
        return;
      }

      const body = await readJsonBody(req);
      Object.assign(event, validateEventInput(body));
      event.inviteeParticipantIds = normalizeInviteeParticipantIds(
        auth.room,
        body.inviteeParticipantIds,
        event.createdByParticipantId
      );
      auth.room.updatedAt = nowIso();
      saveStore();
      sendJson(res, 200, { event: publicEvent(event, auth.room, auth.participant.id) });
      return;
    }

    if (roomEventMatch && req.method === "DELETE") {
      const auth = requireRoomParticipant(req, res, roomEventMatch[1]);
      if (!auth) return;
      const event = auth.room.events.find((item) => item.id === roomEventMatch[2]);
      if (!event) {
        sendJson(res, 404, { error: "Event not found." });
        return;
      }
      const canDelete = event.createdByParticipantId === auth.participant.id || isHost(auth.room, auth.session, auth.user);
      if (!canDelete) {
        sendJson(res, 403, { error: "You cannot delete this event." });
        return;
      }

      auth.room.events = auth.room.events.filter((item) => item.id !== event.id);
      auth.room.updatedAt = nowIso();
      saveStore();
      sendJson(res, 200, { deleted: true });
      return;
    }

    if (roomEventRespondMatch && req.method === "POST") {
      const auth = requireRoomParticipant(req, res, roomEventRespondMatch[1]);
      if (!auth) return;
      const event = auth.room.events.find((item) => item.id === roomEventRespondMatch[2]);
      if (!event) {
        sendJson(res, 404, { error: "Event not found." });
        return;
      }
      if (!(event.inviteeParticipantIds || []).includes(auth.participant.id)) {
        sendJson(res, 403, { error: "Only invited participants can respond to this event." });
        return;
      }

      const body = await readJsonBody(req);
      const responseValue = String(body.response || "").trim().toLowerCase();
      if (!["yes", "maybe", "no"].includes(responseValue)) {
        sendJson(res, 400, { error: "Response must be yes, maybe, or no." });
        return;
      }

      event.responses = event.responses || {};
      event.responses[auth.participant.id] = responseValue;
      if (body.proposedStart || body.proposedEnd) {
        const proposedStart = new Date(body.proposedStart);
        const proposedEnd = new Date(body.proposedEnd);
        if (Number.isNaN(proposedStart.getTime()) || Number.isNaN(proposedEnd.getTime()) || proposedEnd <= proposedStart) {
          sendJson(res, 400, { error: "Proposed time must have a valid start and end." });
          return;
        }
        event.date = proposedStart.toISOString().slice(0, 10);
        event.start = proposedStart.toISOString();
        event.end = proposedEnd.toISOString();
        event.lastProposedByParticipantId = auth.participant.id;
        event.lastProposedAt = nowIso();
      }
      auth.room.updatedAt = nowIso();
      saveStore();
      sendJson(res, 200, { event: publicEvent(event, auth.room, auth.participant.id) });
      return;
    }

    if (roomEventCommentsMatch && req.method === "POST") {
      const auth = requireRoomParticipant(req, res, roomEventCommentsMatch[1]);
      if (!auth) return;
      const event = auth.room.events.find((item) => item.id === roomEventCommentsMatch[2]);
      if (!event) {
        sendJson(res, 404, { error: "Event not found." });
        return;
      }

      const body = await readJsonBody(req);
      const text = String(body.text || "").trim();
      if (!text) {
        sendJson(res, 400, { error: "Comment cannot be empty." });
        return;
      }
      if (text.length > 500) {
        sendJson(res, 400, { error: "Comment must be 500 characters or fewer." });
        return;
      }

      event.comments = event.comments || [];
      event.comments.push({
        id: generateId("comment"),
        participantId: auth.participant.id,
        displayName: auth.participant.displayName,
        text,
        createdAt: nowIso()
      });
      auth.room.updatedAt = nowIso();
      saveStore();
      sendJson(res, 201, { event: publicEvent(event, auth.room, auth.participant.id) });
      return;
    }

    if (roomEventIcsMatch && req.method === "GET") {
      const auth = requireRoomParticipant(req, res, roomEventIcsMatch[1]);
      if (!auth) return;
      const event = auth.room.events.find((item) => item.id === roomEventIcsMatch[2]);
      if (!event) {
        sendJson(res, 404, { error: "Event not found." });
        return;
      }

      const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//CommonGround//Shared Calendar//EN",
        "BEGIN:VEVENT",
        `UID:${event.id}@commonground`,
        `DTSTAMP:${icsDate(nowIso())}`,
        `DTSTART:${icsDate(event.start)}`,
        `DTEND:${icsDate(event.end)}`,
        `SUMMARY:${escapeIcs(event.title)}`,
        `LOCATION:${escapeIcs(event.location || "")}`,
        `DESCRIPTION:${escapeIcs(event.description || "")}`,
        "END:VEVENT",
        "END:VCALENDAR"
      ].join("\r\n");

      res.writeHead(200, {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename=\"${event.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "event"}.ics\"`,
        "Cache-Control": "no-store"
      });
      res.end(ics);
      return;
    }

    if (url.pathname === "/auth/google") {
      const session = getSession(req, res);
      const roomCode = normalizeRoomCode(url.searchParams.get("room") || session.lastRoomCode || "");
      const authUrl = buildGoogleAuthUrl(session, roomCode || null);
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

      const stateData = state ? oauthStates.get(state) : null;
      if (!code || !stateData) {
        sendRedirect(res, "/?error=invalid_oauth_state");
        return;
      }
      oauthStates.delete(state);

      try {
        const session = getSession(req, res);
        const googleTokens = await exchangeCodeForTokens(code);
        const profile = await fetchGoogleProfile(googleTokens.access_token);
        if (!profile?.id) throw new Error("Could not read your Google profile.");

        const userRecord = setUserGoogleConnection(profile.id, profile, googleTokens);
        propagateUserIdentityToRooms(profile.id);

        session.userId = profile.id;
        if (!session.pendingDisplayName) {
          session.pendingDisplayName = userDisplayName(userRecord) || "Guest";
        }

        const roomCode = stateData.roomCode || session.lastRoomCode || "";
        if (roomCode && store.rooms[roomCode]) {
          const room = store.rooms[roomCode];
          session.lastRoomCode = roomCode;
          if (isRoomLocked(room) && !canJoinLockedRoom(room, session, store.users[profile.id])) {
            upsertJoinRequest(room, session, store.users[profile.id], session.pendingDisplayName, "google");
            room.updatedAt = nowIso();
            saveStore();
            sendRedirect(res, "/?request=sent");
            return;
          }
          const participant = ensureParticipant(room, session, store.users[profile.id], session.pendingDisplayName);
          updateParticipantFromUser(room, participant, store.users[profile.id]);
          settleJoinRequestsForIdentity(room, session, store.users[profile.id]);
          if (room.hostSessionId === session.id && !room.hostUserId) {
            room.hostUserId = profile.id;
          }
          saveStore();
          sendRedirect(res, `/room/${roomCode}?connected=google`);
          return;
        }

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
  console.log(`CommonGround running at http://localhost:${port}`);
  console.log(`Google redirect URI: ${redirectUri}`);
});
