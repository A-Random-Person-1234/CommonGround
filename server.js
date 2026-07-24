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
const microsoftRedirectUri = process.env.MICROSOFT_REDIRECT_URI || `${publicBaseUrl}/auth/microsoft/callback`;
const configuredDatabasePath = String(process.env.DATABASE_PATH || "").trim();
const configuredDataDir = String(process.env.DATA_DIR || "").trim();
const databaseFile = configuredDatabasePath || path.join(configuredDataDir || __dirname, ".commonground.db");
const legacyStoreFile = path.join(__dirname, ".room-store.json");
const publicDir = path.join(__dirname, "public");
const emojiKeywordDictionaryRoute = "/assets/emojilib/3.0.11/emoji-en-US.json";
const emojiKeywordDictionaryPath = path.join(__dirname, "node_modules", "emojilib", "dist", "emoji-en-US.json");
const emojiKeywordDictionary = fs.readFileSync(emojiKeywordDictionaryPath);
const emojiKeywordDictionaryEtag = `"${crypto.createHash("sha256").update(emojiKeywordDictionary).digest("base64url")}"`;
const roomCodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const defaultRoomEmoji = "📅";
const oauthStateLifetimeMs = 10 * 60 * 1000;
const sessionLifetimeMs = 30 * 24 * 60 * 60 * 1000;
const sessionRotationAliasLifetimeMs = 60 * 1000;
const configuredOutboundRequestTimeoutMs = Number(process.env.OUTBOUND_REQUEST_TIMEOUT_MS || 15_000);
const outboundRequestTimeoutMs = Number.isFinite(configuredOutboundRequestTimeoutMs) && configuredOutboundRequestTimeoutMs >= 1_000
  ? configuredOutboundRequestTimeoutMs
  : 15_000;
const isProduction = process.env.NODE_ENV === "production" || publicBaseUrl.startsWith("https://");
const textLimits = Object.freeze({
  roomName: 80,
  displayName: 60,
  eventTitle: 120,
  eventLocation: 200,
  eventDescription: 4000,
  comment: 500
});
const rateLimits = new Map();
const participantPalette = [
  "#743F45",
  "#6C4652",
  "#A36F52",
  "#A97952",
  "#B39458",
  "#777653",
  "#83907B",
  "#536B5E",
  "#496B70",
  "#65758A",
  "#435267",
  "#80768E",
  "#665267",
  "#9A7275",
  "#8D8174",
  "#66635F"
];

const participantPaletteSet = new Set(participantPalette);
const legacyParticipantColorMap = new Map([
  ["#2f6f9f", "#65758A"],
  ["#9b3f35", "#743F45"],
  ["#5f7a45", "#777653"],
  ["#6d4a8e", "#665267"],
  ["#b9822e", "#B39458"],
  ["#2f7c78", "#496B70"],
  ["#b7653f", "#A36F52"],
  ["#9a4d63", "#9A7275"],
  ["#3f6f54", "#536B5E"],
  ["#5c6773", "#66635F"],
  ["#76543e", "#8D8174"],
  ["#465a96", "#435267"],
  ["#1a73e8", "#65758A"],
  ["#d93025", "#743F45"],
  ["#188038", "#777653"],
  ["#a142f4", "#80768E"],
  ["#f29900", "#B39458"],
  ["#12a4af", "#496B70"],
  ["#e8710a", "#A36F52"],
  ["#b80672", "#9A7275"],
  ["#0b8043", "#536B5E"],
  ["#1967d2", "#435267"],
  ["#5f6368", "#66635F"],
  ["#00897b", "#496B70"]
]);

function canonicalParticipantColor(color) {
  const value = typeof color === "string" ? color.trim() : "";
  if (!value) return null;
  const current = participantPalette.find((entry) => entry.toLowerCase() === value.toLowerCase());
  if (current) return current;
  return legacyParticipantColorMap.get(value.toLowerCase()) || null;
}

function normalizeParticipantColor(color) {
  return canonicalParticipantColor(color) || participantPalette[0];
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function boundedText(value, {
  field = "Value",
  max,
  required = false,
  fallback = "",
  multiline = false
} = {}) {
  let text = value === undefined || value === null ? "" : String(value);
  text = text
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
  if (!multiline) text = text.replace(/\s+/g, " ");
  if (!text) {
    if (required) throw httpError(400, `${field} is required.`);
    return fallback;
  }
  if (max && [...text].length > max) {
    throw httpError(400, `${field} must be ${max} characters or fewer.`);
  }
  return text;
}

function normalizeRoomEmoji(value, fallback = defaultRoomEmoji) {
  const text = boundedText(value, { field: "Room emoji", max: 16, fallback });
  if (!text) return fallback;
  try {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return segmenter.segment(text)[Symbol.iterator]().next().value?.segment || fallback;
  } catch {
    return Array.from(text)[0] || fallback;
  }
}

function normalizeTimezone(value, fallback = "UTC") {
  const timezone = boundedText(value, { field: "Timezone", max: 100, fallback });
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format();
    return timezone;
  } catch {
    throw httpError(400, "Choose a valid IANA timezone.");
  }
}

function dateKeyInTimezone(value, timezone = "UTC") {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function applySecurityHeaders(res) {
  if (res.headersSent) return;
  res.setHeader("Content-Security-Policy", [
    "default-src 'self'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://unpkg.com"
  ].join("; "));
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  if (isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
}

function requestOrigins(req) {
  const origins = new Set();
  try {
    origins.add(new URL(publicBaseUrl).origin);
  } catch {
    // PUBLIC_BASE_URL is trusted deployment configuration; the request host remains a fallback.
  }
  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  const protocol = forwardedProto || (req.socket?.encrypted ? "https" : "http");
  if (req.headers.host) origins.add(`${protocol}://${req.headers.host}`);
  return origins;
}

function isAllowedMutationOrigin(req) {
  const fetchSite = String(req.headers["sec-fetch-site"] || "").toLowerCase();
  if (fetchSite === "cross-site") return false;
  const origin = String(req.headers.origin || "").trim();
  if (!origin) return true;
  if (origin === "null") return false;
  return requestOrigins(req).has(origin);
}

function requestClientKey(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.socket?.remoteAddress || "unknown";
}

function enforceRateLimit(req, res, bucket, limit, windowMs) {
  const key = `${bucket}:${requestClientKey(req)}`;
  const now = Date.now();
  const existing = rateLimits.get(key);
  const entry = !existing || existing.resetAt <= now
    ? { count: 0, resetAt: now + windowMs }
    : existing;
  entry.count += 1;
  rateLimits.set(key, entry);
  if (rateLimits.size > 2000) {
    for (const [candidate, value] of rateLimits.entries()) {
      if (value.resetAt <= now) rateLimits.delete(candidate);
    }
  }
  res.setHeader("RateLimit-Limit", String(limit));
  res.setHeader("RateLimit-Remaining", String(Math.max(0, limit - entry.count)));
  res.setHeader("RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));
  if (entry.count <= limit) return true;
  res.setHeader("Retry-After", String(Math.max(1, Math.ceil((entry.resetAt - now) / 1000))));
  sendJson(res, 429, { error: "Too many requests. Please try again shortly." });
  return false;
}

async function fetchWithTimeout(resource, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), outboundRequestTimeoutMs);
  try {
    return await fetch(resource, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw httpError(504, "The external service did not respond in time.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

const googleCalendarEventsScope = "https://www.googleapis.com/auth/calendar.events";
const googleBaseScopes = [
  "openid",
  "profile",
  "email",
  "https://www.googleapis.com/auth/calendar.freebusy",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly"
];
const googleWriteScopes = [...googleBaseScopes, googleCalendarEventsScope];
const microsoftCalendarReadScope = "Calendars.Read";
const microsoftCalendarWriteScope = "Calendars.ReadWrite";
const microsoftBaseScopes = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "User.Read",
  microsoftCalendarReadScope
];
const microsoftWriteScopes = microsoftBaseScopes.map((scope) => (
  scope === microsoftCalendarReadScope ? microsoftCalendarWriteScope : scope
));

const database = openDatabase();
const oauthStates = new Map();
const sessionRotationAliases = new Map();
let store = loadStore();
const sessions = new Map(Object.entries(store.sessions || {}));

function openDatabase() {
  fs.mkdirSync(path.dirname(databaseFile), { recursive: true });
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

function hasGoogleCalendarWriteScope(scopes = []) {
  return uniqueStrings(scopes).includes(googleCalendarEventsScope);
}

function hasMicrosoftCalendarWriteScope(scopes = []) {
  return uniqueStrings(scopes).includes(microsoftCalendarWriteScope);
}

function normalizeCalendarEventSync(sync = {}, scopes = []) {
  return {
    enabled: typeof sync.enabled === "boolean" ? sync.enabled : true,
    updatedAt: sync.updatedAt || nowIso()
  };
}

function normalizeOutlookEventSync(sync = {}, scopes = []) {
  return {
    enabled: typeof sync.enabled === "boolean" ? sync.enabled : false,
    updatedAt: sync.updatedAt || nowIso()
  };
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
  const microsoftTokens = user.auth?.microsoft?.tokens || user.microsoftTokens || null;
  const scopes = uniqueStrings(
    user.auth?.google?.scopes ||
    user.googleScopes ||
    (typeof googleTokens?.scope === "string" ? googleTokens.scope.split(" ") : [])
  );
  const microsoftScopesValue = uniqueStrings(
    user.auth?.microsoft?.scopes ||
    user.microsoftScopes ||
    (typeof microsoftTokens?.scope === "string" ? microsoftTokens.scope.split(" ") : [])
  );
  const accountName = String(
    user.profile?.googleName ||
    user.profile?.microsoftName ||
    user.name ||
    user.email ||
    "Guest"
  ).trim() || "Guest";
  const picture = user.profile?.picture || user.profile?.microsoftPicture || user.picture || null;
  const preferredDisplayName = String(
    user.profile?.preferredDisplayName ||
    user.displayName ||
    accountName
  ).trim() || accountName;
  const preferredColor = canonicalParticipantColor(user.profile?.preferredColor) || canonicalParticipantColor(user.color);
  const googleConnected = Boolean(googleTokens?.access_token);
  const microsoftConnected = Boolean(microsoftTokens?.access_token);
  const connected = googleConnected || microsoftConnected;

  return {
    ...user,
    id: user.id,
    googleSub: user.googleSub || null,
    microsoftId: user.microsoftId || null,
    email: user.email || null,
    name: accountName,
    displayName: preferredDisplayName,
    color: preferredColor,
    picture,
    googleTokens,
    googleScopes: scopes,
    microsoftTokens,
    microsoftScopes: microsoftScopesValue,
    profile: {
      googleName: user.profile?.googleName || (user.googleSub ? accountName : null),
      microsoftName: user.profile?.microsoftName || null,
      picture,
      preferredDisplayName,
      preferredColor
    },
    auth: {
      google: {
        tokens: googleTokens,
        scopes,
        connectedAt: user.auth?.google?.connectedAt || user.connectedAt || (googleConnected ? user.createdAt || nowIso() : null),
        updatedAt: user.auth?.google?.updatedAt || user.updatedAt || nowIso()
      },
      microsoft: {
        tokens: microsoftTokens,
        scopes: microsoftScopesValue,
        connectedAt: user.auth?.microsoft?.connectedAt || (microsoftConnected ? user.createdAt || nowIso() : null),
        updatedAt: user.auth?.microsoft?.updatedAt || user.updatedAt || nowIso()
      }
    },
    sync: normalizeSyncState(user.sync, connected ? "connected" : "guest"),
    calendarEventSync: normalizeCalendarEventSync(user.calendarEventSync || user.calendarSync, scopes),
    outlookEventSync: normalizeOutlookEventSync(user.outlookEventSync, microsoftScopesValue),
    createdAt: user.createdAt || nowIso(),
    updatedAt: user.updatedAt || nowIso()
  };
}

function normalizeGoogleCalendarSync(sync = {}) {
  return Object.fromEntries(
    Object.entries(sync || {})
      .filter(([userId, entry]) => userId && entry)
      .map(([userId, entry]) => [userId, {
        calendarId: entry.calendarId || "primary",
        googleEventId: entry.googleEventId || entry.eventId || null,
        htmlLink: entry.htmlLink || null,
        status: entry.status || "pending",
        lastAttemptAt: entry.lastAttemptAt || null,
        lastSyncedAt: entry.lastSyncedAt || null,
        lastError: entry.lastError || null,
        organizerParticipantId: entry.organizerParticipantId || null,
        organizerEmail: entry.organizerEmail || null,
        sentAt: entry.sentAt || entry.lastSyncedAt || null
      }])
  );
}

function normalizeOutlookCalendarSync(sync = {}) {
  return Object.fromEntries(
    Object.entries(sync || {})
      .filter(([userId, entry]) => userId && entry)
      .map(([userId, entry]) => [userId, {
        calendarId: entry.calendarId || "primary",
        outlookEventId: entry.outlookEventId || entry.eventId || null,
        webLink: entry.webLink || null,
        status: entry.status || "pending",
        lastAttemptAt: entry.lastAttemptAt || null,
        lastSyncedAt: entry.lastSyncedAt || null,
        lastError: entry.lastError || null,
        organizerParticipantId: entry.organizerParticipantId || null,
        organizerEmail: entry.organizerEmail || null,
        sentAt: entry.sentAt || entry.lastSyncedAt || null
      }])
  );
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
    color: normalizeParticipantColor(participant.color),
    connected,
    needsReconnect,
    syncStatus: participant.syncStatus || (needsReconnect ? "needs_reconnect" : (connected ? "connected" : "guest")),
    lastSyncedAt: participant.lastSyncedAt || null,
    lastSyncError: participant.lastSyncError || null,
    lastCalendarId: participant.lastCalendarId || null,
    lastCalendarName: participant.lastCalendarName || null,
    joinedAt: participant.joinedAt || nowIso(),
    lastSeenAt: participant.lastSeenAt || nowIso(),
    picture: participant.picture || null
  };
}

function normalizeEventRecord(event = {}) {
  const timezone = normalizeTimezone(event.timezone || "UTC");
  return {
    ...event,
    id: event.id,
    title: String(event.title || "(No title)").trim().slice(0, textLimits.eventTitle) || "(No title)",
    date: dateKeyInTimezone(event.start, timezone) || String(event.date || "").slice(0, 10),
    location: String(event.location || "").trim(),
    description: String(event.description || "").trim(),
    timezone,
    allDay: event.allDay === true,
    inviteeParticipantIds: uniqueStrings(event.inviteeParticipantIds),
    createdByParticipantId: event.createdByParticipantId || null,
    syncToGoogle: event.syncToGoogle === true,
    syncToOutlook: event.syncToOutlook === true,
    googleCalendarSync: normalizeGoogleCalendarSync(event.googleCalendarSync || event.googleSync),
    outlookCalendarSync: normalizeOutlookCalendarSync(event.outlookCalendarSync || event.microsoftCalendarSync || event.outlookSync),
    createdAt: event.createdAt || nowIso(),
    updatedAt: event.updatedAt || event.createdAt || nowIso(),
    responses: event.responses || {},
    comments: Array.isArray(event.comments) ? event.comments : []
  };
}

function normalizeJoinRequestRecord(request = {}) {
  const source = ["google", "microsoft"].includes(request.source) ? request.source : "guest";
  return {
    id: request.id,
    sessionId: request.sessionId || null,
    userId: request.userId || null,
    displayName: String(request.displayName || "Guest").trim() || "Guest",
    picture: request.picture || null,
    source,
    status: request.status === "approved" || request.status === "denied" ? request.status : "pending",
    requestedAt: request.requestedAt || nowIso(),
    updatedAt: request.updatedAt || request.requestedAt || nowIso()
  };
}

function normalizeNotificationRecord(notification = {}) {
  const type = String(notification.type || "general").trim() || "general";
  return {
    id: notification.id || generateId("notif"),
    type,
    roomCode: normalizeRoomCode(notification.roomCode),
    eventId: notification.eventId || null,
    requestId: notification.requestId || notification.meta?.requestId || null,
    recipientParticipantId: notification.recipientParticipantId || null,
    actorParticipantId: notification.actorParticipantId || null,
    title: String(notification.title || "Notification").trim() || "Notification",
    message: String(notification.message || "").trim(),
    meta: notification.meta && typeof notification.meta === "object" ? notification.meta : {},
    dedupeKey: notification.dedupeKey || null,
    read: Boolean(notification.read),
    dismissed: Boolean(notification.dismissed),
    createdAt: notification.createdAt || nowIso(),
    updatedAt: notification.updatedAt || notification.createdAt || nowIso()
  };
}

function normalizeRoomRecord(room = {}) {
  const participants = (room.participants || []).map(normalizeParticipantRecord);
  return {
    ...room,
    id: room.id || room.code,
    code: normalizeRoomCode(room.code || room.id),
    name: String(room.name || "Untitled room").trim().slice(0, textLimits.roomName) || "Untitled room",
    emoji: normalizeRoomEmoji(room.emoji || room.icon || defaultRoomEmoji),
    icon: normalizeRoomEmoji(room.emoji || room.icon || defaultRoomEmoji),
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
  const sourceSchemaVersion = Number(saved.meta?.schemaVersion || 0);
  return {
    meta: {
      schemaVersion: 3,
      updatedAt: saved.meta?.updatedAt || nowIso()
    },
    users: Object.fromEntries(
      Object.entries(saved.users || {})
        .map(([key, user]) => {
          const migratedUser = { ...user, id: user?.id || key };
          if (sourceSchemaVersion < 3) {
            migratedUser.calendarEventSync = {
              ...(user?.calendarEventSync || user?.calendarSync || {}),
              enabled: true,
              updatedAt: user?.calendarEventSync?.updatedAt || nowIso()
            };
          }
          return [key, normalizeUserRecord(migratedUser)];
        })
    ),
    rooms: Object.fromEntries(
      Object.entries(saved.rooms || {})
        .map(([key, room]) => {
          const normalizedRoom = normalizeRoomRecord({ ...room, code: room?.code || key, id: room?.id || key });
          return [normalizedRoom.code, normalizedRoom];
        })
    ),
    notifications: (Array.isArray(saved.notifications) ? saved.notifications : [])
      .map(normalizeNotificationRecord)
      .filter((notification) => notification.id && notification.recipientParticipantId),
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
    upsert.run("notifications", JSON.stringify(normalized.notifications), savedAt);
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
      notifications: readStoreSection("notifications"),
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

function setSessionCookie(res, sid, maxAge = Math.floor(sessionLifetimeMs / 1000)) {
  const secure = isProduction ? "; Secure" : "";
  res.setHeader(
    "Set-Cookie",
    `cg_sid=${encodeURIComponent(sid)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}; Priority=High${secure}`
  );
}

function sessionIsExpired(session) {
  const timestamp = new Date(session?.lastSeenAt || session?.createdAt || 0).getTime();
  return !Number.isFinite(timestamp) || Date.now() - timestamp > sessionLifetimeMs;
}

function replaceSessionReference(oldId, newId) {
  for (const room of Object.values(store.rooms || {})) {
    if (room.hostSessionId === oldId) room.hostSessionId = newId;
    if (room.access?.approvedSessionIds) {
      room.access.approvedSessionIds = uniqueStrings(
        room.access.approvedSessionIds.map((sessionId) => sessionId === oldId ? newId : sessionId)
      );
    }
    for (const request of room.joinRequests || []) {
      if (request.sessionId === oldId) request.sessionId = newId;
    }
    for (const participant of room.participants || []) {
      participant.sessionIds = uniqueStrings(
        [participant.sessionId, ...(participant.sessionIds || [])]
          .map((sessionId) => sessionId === oldId ? newId : sessionId)
      );
      if (participant.sessionId === oldId) participant.sessionId = newId;
    }
  }
}

function rotateSession(session, res) {
  const oldId = session.id;
  const newId = crypto.randomBytes(18).toString("hex");
  const nextSession = {
    ...session,
    id: newId,
    rotatedAt: nowIso(),
    lastSeenAt: nowIso()
  };
  sessions.delete(oldId);
  sessions.set(newId, nextSession);
  sessionRotationAliases.set(oldId, {
    newId,
    expiresAt: Date.now() + sessionRotationAliasLifetimeMs
  });
  replaceSessionReference(oldId, newId);
  setSessionCookie(res, newId);
  return nextSession;
}

function getSession(req, res) {
  const cookies = parseCookies(req);
  let sid = cookies.cg_sid;
  for (const [oldId, alias] of sessionRotationAliases.entries()) {
    if (!alias?.expiresAt || alias.expiresAt <= Date.now() || !sessions.has(alias.newId)) {
      sessionRotationAliases.delete(oldId);
    }
  }
  const rotatedAlias = sid ? sessionRotationAliases.get(sid) : null;
  if (rotatedAlias?.newId && sessions.has(rotatedAlias.newId)) {
    sid = rotatedAlias.newId;
    setSessionCookie(res, sid);
  }
  const existing = sid ? sessions.get(sid) : null;
  if (existing && sessionIsExpired(existing)) {
    sessions.delete(sid);
    sid = null;
  }
  if (!sid || !sessions.has(sid)) {
    sid = crypto.randomBytes(18).toString("hex");
    sessions.set(sid, { id: sid, createdAt: nowIso(), lastSeenAt: nowIso() });
    saveStore();
    setSessionCookie(res, sid);
  }

  const session = sessions.get(sid);
  session.id = sid;
  session.lastSeenAt = nowIso();
  return session;
}

function sendJson(res, status, payload) {
  applySecurityHeaders(res);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, body, contentType = "text/plain; charset=utf-8") {
  applySecurityHeaders(res);
  res.writeHead(status, {
    "Content-Type": contentType,
    "Cache-Control": "no-store"
  });
  res.end(body);
}

function sendRedirect(res, location) {
  applySecurityHeaders(res);
  res.writeHead(302, {
    Location: location,
    "Cache-Control": "no-store"
  });
  res.end();
}

function sendMethodNotAllowed(res, allowed) {
  applySecurityHeaders(res);
  res.setHeader("Allow", allowed.join(", "));
  sendJson(res, 405, { error: "Method not allowed." });
}

function sendEmojiKeywordDictionary(req, res) {
  if (!["GET", "HEAD"].includes(req.method || "GET")) {
    sendMethodNotAllowed(res, ["GET", "HEAD"]);
    return;
  }
  applySecurityHeaders(res);
  if (req.headers["if-none-match"] === emojiKeywordDictionaryEtag) {
    res.writeHead(304, {
      ETag: emojiKeywordDictionaryEtag,
      "Cache-Control": "public, max-age=31536000, immutable"
    });
    res.end();
    return;
  }
  res.writeHead(200, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": emojiKeywordDictionary.length,
    "Cache-Control": "public, max-age=31536000, immutable",
    ETag: emojiKeywordDictionaryEtag
  });
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  res.end(emojiKeywordDictionary);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let failed = false;
    req.on("data", (chunk) => {
      if (failed) return;
      body += chunk;
      if (body.length > 1_000_000) {
        failed = true;
        reject(httpError(413, "Request body too large."));
      }
    });
    req.on("end", () => {
      if (failed) return;
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(httpError(400, "Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });
}

function serveStatic(req, res) {
  if (!["GET", "HEAD"].includes(req.method || "GET")) {
    sendMethodNotAllowed(res, ["GET", "HEAD"]);
    return;
  }
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);
  const legalRoutes = {
    "/privacy": "/privacy.html",
    "/privacy/": "/privacy.html",
    "/terms": "/terms.html",
    "/terms/": "/terms.html"
  };
  const isSpaRoute = pathname === "/" || pathname.startsWith("/room/");
  const requested = legalRoutes[pathname] || (isSpaRoute ? "/index.html" : pathname);
  const filePath = path.resolve(publicDir, requested.replace(/^[/\\]+/, ""));
  const relativePath = path.relative(publicDir, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
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
    ext === ".png" ? "image/png" :
    ext === ".ico" ? "image/x-icon" :
    ext === ".webmanifest" ? "application/manifest+json" :
    ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
    "text/html";

  applySecurityHeaders(res);
  res.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": "no-store"
  });
  if (req.method === "HEAD") {
    res.end();
    return;
  }
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

function loadMicrosoftCredentials() {
  if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
    return null;
  }

  const tenant = process.env.MICROSOFT_TENANT || "common";
  const baseUrl = `https://login.microsoftonline.com/${encodeURIComponent(tenant)}/oauth2/v2.0`;
  return {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    authUri: `${baseUrl}/authorize`,
    tokenUri: `${baseUrl}/token`
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

  const response = await fetchWithTimeout(credentials.tokenUri, {
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

  const response = await fetchWithTimeout(credentials.tokenUri, {
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

async function exchangeMicrosoftCodeForTokens(code) {
  const credentials = loadMicrosoftCredentials();
  if (!credentials) throw new Error("Microsoft OAuth credentials are not configured.");

  const body = new URLSearchParams({
    code,
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    redirect_uri: microsoftRedirectUri,
    grant_type: "authorization_code"
  });

  const response = await fetchWithTimeout(credentials.tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || "Microsoft token exchange failed.");
  }
  return withTokenExpiry(payload);
}

async function refreshMicrosoftAccessToken(tokens) {
  if (!tokens.refresh_token) return tokens;

  const credentials = loadMicrosoftCredentials();
  if (!credentials) throw new Error("Microsoft OAuth credentials are not configured.");

  const body = new URLSearchParams({
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    refresh_token: tokens.refresh_token,
    grant_type: "refresh_token"
  });

  const response = await fetchWithTimeout(credentials.tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || "Microsoft token refresh failed.");
  }

  return withTokenExpiry({
    ...tokens,
    ...payload,
    refresh_token: payload.refresh_token || tokens.refresh_token
  });
}

async function fetchGoogleProfile(accessToken) {
  const response = await fetchWithTimeout("https://openidconnect.googleapis.com/v1/userinfo", {
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

async function fetchMicrosoftProfile(accessToken) {
  const response = await fetchWithTimeout("https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  });

  const payload = await response.json();
  if (!response.ok) return null;
  const email = normalizeEmail(payload.mail || payload.userPrincipalName);

  return {
    id: payload.id || email,
    email,
    name: payload.displayName || email || "You",
    picture: null
  };
}

async function fetchMicrosoftPrimaryCalendar(accessToken) {
  const response = await fetchWithTimeout("https://graph.microsoft.com/v1.0/me/calendar?$select=id,name", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  });

  const payload = await response.json();
  if (!response.ok) return null;

  return {
    id: payload.id || "primary",
    summary: payload.name || "Outlook calendar",
    primary: true,
    backgroundColor: null
  };
}

function resolveProviderUserId(session, profile, provider) {
  const current = currentUserFromSession(session);
  if (current?.id) return current.id;
  const exactMatch = Object.values(store.users || {}).find((user) => (
    provider === "google"
      ? Boolean(profile.googleSub && user.googleSub === profile.googleSub)
      : Boolean(profile.id && user.microsoftId === profile.id)
  ));
  return exactMatch?.id || profile.id;
}

function currentUserFromSession(session) {
  return session.userId ? store.users[session.userId] || null : null;
}

function userTokens(user) {
  return user?.auth?.google?.tokens || user?.googleTokens || null;
}

function microsoftUserTokens(user) {
  return user?.auth?.microsoft?.tokens || user?.microsoftTokens || null;
}

function userConnected(user) {
  return Boolean(userTokens(user)?.access_token || microsoftUserTokens(user)?.access_token);
}

function userGoogleConnected(user) {
  return Boolean(userTokens(user)?.access_token);
}

function userMicrosoftConnected(user) {
  return Boolean(microsoftUserTokens(user)?.access_token);
}

function userHasGoogleCalendarWriteAccess(user) {
  return Boolean(userGoogleConnected(user) && hasGoogleCalendarWriteScope(user?.auth?.google?.scopes || user?.googleScopes || []));
}

function userHasMicrosoftCalendarWriteAccess(user) {
  return Boolean(userMicrosoftConnected(user) && hasMicrosoftCalendarWriteScope(user?.auth?.microsoft?.scopes || user?.microsoftScopes || []));
}

function hasConnectedCalendar(user) {
  return userGoogleConnected(user) || userMicrosoftConnected(user);
}

function activeCalendarProvider(user) {
  if (userGoogleConnected(user)) return "google";
  if (userMicrosoftConnected(user)) return "microsoft";
  return "guest";
}

function rawUserGoogleName(user) {
  return String(
    user?.profile?.googleName ||
    user?.profile?.microsoftName ||
    user?.name ||
    user?.email ||
    "Guest"
  ).trim() || "Guest";
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
  return canonicalParticipantColor(user?.profile?.preferredColor) || canonicalParticipantColor(user?.color);
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
      },
      microsoft: {
        ...existing.auth?.microsoft,
        ...(updates.auth?.microsoft || {})
      }
    },
    sync: {
      ...existing.sync,
      ...(updates.sync || {})
    },
    calendarEventSync: {
      ...existing.calendarEventSync,
      ...(updates.calendarEventSync || {})
    },
    updatedAt: nowIso()
  });
  store.users[userId] = next;
  return next;
}

function setUserGoogleConnection(userId, profile, tokens) {
  const existingUser = normalizeUserRecord(store.users[userId] || { id: userId });
  const existingTokens = userTokens(existingUser) || {};
  const mergedTokens = withTokenExpiry({
    ...existingTokens,
    ...tokens,
    refresh_token: tokens?.refresh_token || existingTokens.refresh_token
  });
  const existingPreferred = String(store.users[userId]?.profile?.preferredDisplayName || "").trim();
  const existingGoogleName = rawUserGoogleName(store.users[userId]);
  const shouldKeepPreferred = existingPreferred && existingPreferred !== existingGoogleName;
  const defaultDisplayName = abbreviatedDefaultDisplayName(profile.name || profile.email || "Guest");
  const scopes = uniqueStrings([
    ...(existingUser.auth?.google?.scopes || existingUser.googleScopes || []),
    ...(typeof tokens?.scope === "string" ? tokens.scope.split(" ") : [])
  ]);
  const existingEventSync = store.users[userId]?.calendarEventSync || {};
  return updateUserRecord(userId, {
    googleSub: profile.googleSub,
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
    googleTokens: mergedTokens,
    googleScopes: scopes,
    profile: {
      googleName: profile.name,
      picture: profile.picture,
      preferredDisplayName: shouldKeepPreferred ? existingPreferred : defaultDisplayName,
      preferredColor: store.users[userId]?.profile?.preferredColor || null
    },
    auth: {
      google: {
        tokens: mergedTokens,
        scopes,
        connectedAt: store.users[userId]?.auth?.google?.connectedAt || nowIso(),
        updatedAt: nowIso()
      }
    },
    sync: {
      status: "connected",
      lastAttemptAt: nowIso(),
      lastError: null
    },
    calendarEventSync: {
      enabled: typeof existingEventSync.enabled === "boolean" ? existingEventSync.enabled : true,
      updatedAt: nowIso()
    },
    createdAt: store.users[userId]?.createdAt || nowIso()
  });
}

function setUserMicrosoftConnection(userId, profile, tokens) {
  const existingUser = normalizeUserRecord(store.users[userId] || { id: userId });
  const existingTokens = microsoftUserTokens(existingUser) || {};
  const mergedTokens = withTokenExpiry({
    ...existingTokens,
    ...tokens,
    refresh_token: tokens?.refresh_token || existingTokens.refresh_token
  });
  const existingPreferred = String(store.users[userId]?.profile?.preferredDisplayName || "").trim();
  const existingName = rawUserGoogleName(store.users[userId]);
  const shouldKeepPreferred = existingPreferred && existingPreferred !== existingName;
  const defaultDisplayName = abbreviatedDefaultDisplayName(profile.name || profile.email || "Guest");
  const scopes = uniqueStrings([
    ...(existingUser.auth?.microsoft?.scopes || existingUser.microsoftScopes || []),
    ...(typeof tokens?.scope === "string" ? tokens.scope.split(" ") : [])
  ]);
  const existingEventSync = store.users[userId]?.outlookEventSync || {};
  return updateUserRecord(userId, {
    microsoftId: profile.id,
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
    microsoftTokens: mergedTokens,
    microsoftScopes: scopes,
    profile: {
      microsoftName: profile.name,
      picture: profile.picture,
      preferredDisplayName: shouldKeepPreferred ? existingPreferred : defaultDisplayName,
      preferredColor: store.users[userId]?.profile?.preferredColor || null
    },
    auth: {
      microsoft: {
        tokens: mergedTokens,
        scopes,
        connectedAt: store.users[userId]?.auth?.microsoft?.connectedAt || nowIso(),
        updatedAt: nowIso()
      }
    },
    sync: {
      status: "connected",
      lastAttemptAt: nowIso(),
      lastError: null
    },
    outlookEventSync: {
      enabled: typeof existingEventSync.enabled === "boolean" ? existingEventSync.enabled : false,
      updatedAt: nowIso()
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
  const nextPicture = userPicture(user);
  const connected = userConnected(user);

  for (const room of Object.values(store.rooms)) {
    let roomChanged = false;
    for (const participant of room.participants || []) {
      if (participant.userId !== userId) continue;
      if (participant.displayNameSource !== "custom") {
        participant.displayName = nextDisplayName;
        participant.displayNameSource = nextDisplayNameSource;
      }
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
    calendarWriteReady: userHasGoogleCalendarWriteAccess(user),
    outlookWriteReady: userHasMicrosoftCalendarWriteAccess(user),
    calendarEventSync: user.calendarEventSync || normalizeCalendarEventSync({}, user.googleScopes),
    outlookEventSync: user.outlookEventSync || normalizeOutlookEventSync({}, user.microsoftScopes),
    sync: user.sync || normalizeSyncState({}, "guest")
  };
}

function generateId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function generateRoomCode() {
  let code = "";
  for (let index = 0; index < 6; index += 1) {
    code += roomCodeAlphabet[crypto.randomInt(roomCodeAlphabet.length)];
  }
  if (store.rooms[code]) return generateRoomCode();
  return code;
}

function normalizeRoomCode(code) {
  return String(code || "").trim().toUpperCase();
}

function isValidRoomCode(code) {
  return /^[A-HJ-NP-Z2-9]{6}$/.test(normalizeRoomCode(code));
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

function validateFreeBusyRange(timeMin, timeMax) {
  const fallbackStart = new Date();
  fallbackStart.setHours(0, 0, 0, 0);
  const fallbackEnd = new Date(fallbackStart);
  fallbackEnd.setDate(fallbackEnd.getDate() + 7);
  const start = clampDate(timeMin, fallbackStart);
  const end = clampDate(timeMax, fallbackEnd);
  if (end <= start) throw httpError(400, "timeMax must be after timeMin.");
  if (end.getTime() - start.getTime() > 370 * 24 * 60 * 60 * 1000) {
    throw httpError(400, "Availability ranges cannot exceed 370 days.");
  }
  return { start, end };
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

function updateRoomCodeReferences(room, oldCode, newCode) {
  for (const session of sessions.values()) {
    if (session.lastRoomCode === oldCode) session.lastRoomCode = newCode;
  }
  for (const stateData of oauthStates.values()) {
    if (stateData.roomCode === oldCode) stateData.roomCode = newCode;
  }
  for (const notification of store.notifications || []) {
    if (notification.roomCode !== oldCode) continue;
    notification.roomCode = newCode;
    notification.meta = {
      ...(notification.meta || {}),
      roomCode: newCode,
      roomName: room.name
    };
    if (notification.dedupeKey) {
      notification.dedupeKey = notification.dedupeKey.split(oldCode).join(newCode);
    }
    notification.updatedAt = nowIso();
  }
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

function participantMatchesIdentity(participant, session, user = null) {
  const sessionIds = uniqueStrings([participant.sessionId, ...(participant.sessionIds || [])]);
  if (sessionIds.includes(session.id)) return true;
  return Boolean(user?.id && participant.userId === user.id);
}

function replaceParticipantReferences(room, fromParticipantId, toParticipantId) {
  if (!fromParticipantId || !toParticipantId || fromParticipantId === toParticipantId) return;

  for (const event of room.events || []) {
    if (event.createdByParticipantId === fromParticipantId) {
      event.createdByParticipantId = toParticipantId;
    }
    event.inviteeParticipantIds = uniqueStrings(
      (event.inviteeParticipantIds || []).map((participantId) => (
        participantId === fromParticipantId ? toParticipantId : participantId
      ))
    );
    if (event.responses?.[fromParticipantId]) {
      event.responses[toParticipantId] = event.responses[toParticipantId] || event.responses[fromParticipantId];
      delete event.responses[fromParticipantId];
    }
    event.comments = (event.comments || []).map((comment) => (
      comment.participantId === fromParticipantId
        ? { ...comment, participantId: toParticipantId }
        : comment
    ));
  }

  for (const notification of store.notifications || []) {
    if (notification.roomCode !== room.code) continue;
    if (notification.recipientParticipantId === fromParticipantId) {
      notification.recipientParticipantId = toParticipantId;
    }
    if (notification.actorParticipantId === fromParticipantId) {
      notification.actorParticipantId = toParticipantId;
    }
    if (notification.dedupeKey) {
      notification.dedupeKey = notification.dedupeKey.split(fromParticipantId).join(toParticipantId);
    }
  }
  const seenNotificationKeys = new Set();
  store.notifications = (store.notifications || []).filter((notification) => {
    if (!notification.dedupeKey) return true;
    if (seenNotificationKeys.has(notification.dedupeKey)) return false;
    seenNotificationKeys.add(notification.dedupeKey);
    return true;
  });
}

function mergeParticipantIntoRoom(room, target, source) {
  target.sessionIds = uniqueStrings([
    ...(target.sessionIds || []),
    target.sessionId,
    ...(source.sessionIds || []),
    source.sessionId
  ]);
  target.sessionId = target.sessionIds[target.sessionIds.length - 1] || target.sessionId || source.sessionId || null;
  if (target.displayNameSource !== "custom" && source.displayNameSource === "custom") {
    target.displayName = source.displayName;
    target.displayNameSource = source.displayNameSource;
  }
  replaceParticipantReferences(room, source.id, target.id);
  room.participants = room.participants.filter((participant) => participant.id !== source.id);
}

function linkSessionParticipantsToUser(session, user) {
  if (!session?.id || !user?.id) return;

  for (const room of Object.values(store.rooms)) {
    let changed = false;
    const sessionParticipants = [...(room.participants || [])].filter((participant) => (
      uniqueStrings([participant.sessionId, ...(participant.sessionIds || [])]).includes(session.id)
    ));

    for (const sessionParticipant of sessionParticipants) {
      let userParticipant = (room.participants || []).find((participant) => (
        participant.userId === user.id && participant.id !== sessionParticipant.id
      ));

      if (userParticipant) {
        mergeParticipantIntoRoom(room, userParticipant, sessionParticipant);
        updateParticipantFromUser(room, userParticipant, user);
      } else {
        sessionParticipant.userId = user.id;
        updateParticipantFromUser(room, sessionParticipant, user);
      }
      changed = true;
    }

    if (room.hostSessionId === session.id && !room.hostUserId) {
      room.hostUserId = user.id;
      changed = true;
    }

    if (changed) {
      room.updatedAt = nowIso();
    }
  }
}

function roomSummaryForIdentity(room, session, user) {
  return {
    code: room.code,
    name: room.name,
    emoji: room.emoji || room.icon || defaultRoomEmoji,
    icon: room.emoji || room.icon || defaultRoomEmoji,
    isHost: isHost(room, session, user),
    participantCount: room.participants.length,
    connectedCount: room.participants.filter((participant) => participant.connected).length
  };
}

function roomsForIdentity(session, user) {
  return Object.values(store.rooms)
    .filter((room) => (
      isHost(room, session, user) ||
      (room.participants || []).some((participant) => participantMatchesIdentity(participant, session, user))
    ))
    .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
    .map((room) => roomSummaryForIdentity(room, session, user));
}

function participantIdsForIdentity(session, user) {
  const ids = new Set();
  for (const room of Object.values(store.rooms)) {
    for (const participant of room.participants || []) {
      if (participantMatchesIdentity(participant, session, user)) {
        ids.add(participant.id);
      }
    }
  }
  return ids;
}

function hostParticipantIds(room) {
  const ids = new Set();
  for (const participant of room.participants || []) {
    const sessionIds = uniqueStrings([participant.sessionId, ...(participant.sessionIds || [])]);
    if (room.hostSessionId && sessionIds.includes(room.hostSessionId)) {
      ids.add(participant.id);
    }
    if (room.hostUserId && participant.userId === room.hostUserId) {
      ids.add(participant.id);
    }
  }
  return [...ids];
}

function publicNotification(notification) {
  const room = findRoom(notification.roomCode);
  const event = room?.events?.find((item) => item.id === notification.eventId) || null;
  return {
    id: notification.id,
    type: notification.type,
    roomCode: notification.roomCode,
    eventId: notification.eventId,
    requestId: notification.requestId,
    title: notification.title,
    message: notification.message,
    meta: {
      ...(notification.meta || {}),
      roomName: notification.meta?.roomName || room?.name || notification.roomCode,
      eventExists: Boolean(event)
    },
    read: Boolean(notification.read),
    dismissed: Boolean(notification.dismissed),
    createdAt: notification.createdAt
  };
}

function notificationsForIdentity(session, user) {
  const participantIds = participantIdsForIdentity(session, user);
  const recentCutoff = Date.now() - 1000 * 60 * 60 * 24 * 14;
  return (store.notifications || [])
    .filter((notification) => participantIds.has(notification.recipientParticipantId))
    .filter((notification) => !notification.dismissed)
    .filter((notification) => !notification.read || new Date(notification.createdAt).getTime() >= recentCutoff)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 30)
    .map(publicNotification);
}

function findNotificationForIdentity(notificationId, session, user) {
  const participantIds = participantIdsForIdentity(session, user);
  return (store.notifications || []).find((notification) => (
    notification.id === notificationId &&
    participantIds.has(notification.recipientParticipantId)
  )) || null;
}

function upsertNotification(notification) {
  if (!notification?.recipientParticipantId || !notification.roomCode) return null;
  store.notifications = store.notifications || [];
  const time = nowIso();
  const dedupeKey = notification.dedupeKey || [
    notification.type,
    notification.roomCode,
    notification.eventId || notification.requestId || "",
    notification.recipientParticipantId
  ].join(":");
  const existing = store.notifications.find((entry) => entry.dedupeKey === dedupeKey);

  if (existing) {
    existing.title = notification.title || existing.title;
    existing.message = notification.message || existing.message;
    existing.meta = { ...(existing.meta || {}), ...(notification.meta || {}) };
    existing.read = false;
    existing.dismissed = false;
    existing.createdAt = time;
    existing.updatedAt = time;
    return existing;
  }

  const nextNotification = normalizeNotificationRecord({
    ...notification,
    id: generateId("notif"),
    dedupeKey,
    read: false,
    dismissed: false,
    createdAt: time,
    updatedAt: time
  });
  store.notifications.unshift(nextNotification);
  store.notifications = store.notifications.slice(0, 500);
  return nextNotification;
}

function eventNotificationTitle(type) {
  if (type === "event_updated") return "Event updated";
  if (type === "event_cancelled") return "Event cancelled";
  if (type === "event_comment") return "New comment";
  return "New invite";
}

function eventNotificationMessage(type, actor, event) {
  const actorName = actor?.displayName || "Someone";
  const eventTitle = event.title || "Untitled event";
  if (type === "event_updated") return `${actorName} updated ${eventTitle}`;
  if (type === "event_cancelled") return `${actorName} cancelled ${eventTitle}`;
  if (type === "event_comment") return `${actorName} commented on ${eventTitle}`;
  return `${actorName} invited you to ${eventTitle}`;
}

function notifyEventParticipants(room, event, actorParticipant, type, recipientParticipantIds, options = {}) {
  const recipients = uniqueStrings(recipientParticipantIds)
    .filter((participantId) => participantId && participantId !== actorParticipant?.id)
    .filter((participantId) => findParticipantById(room, participantId));

  for (const recipientParticipantId of recipients) {
    const dedupePart = options.dedupeSuffix ? `:${options.dedupeSuffix}` : "";
    upsertNotification({
      type,
      roomCode: room.code,
      eventId: event.id,
      recipientParticipantId,
      actorParticipantId: actorParticipant?.id || null,
      title: options.title || eventNotificationTitle(type),
      message: options.message || eventNotificationMessage(type, actorParticipant, event),
      meta: {
        roomName: room.name,
        eventTitle: event.title || "Untitled event",
        start: event.start,
        end: event.end,
        location: event.location || "",
        ...(options.meta || {})
      },
      dedupeKey: `${type}:${room.code}:${event.id}:${recipientParticipantId}${dedupePart}`
    });
  }
}

function notifyHostsOfJoinRequest(room, request) {
  for (const hostParticipantId of hostParticipantIds(room)) {
    upsertNotification({
      type: "room_join_request",
      roomCode: room.code,
      requestId: request.id,
      recipientParticipantId: hostParticipantId,
      actorParticipantId: null,
      title: "Join request",
      message: `${request.displayName || "Someone"} wants to join ${room.name || room.code}`,
      meta: {
        roomName: room.name,
        requesterName: request.displayName || "Someone",
        requestId: request.id,
        roomCode: room.code
      },
      dedupeKey: `room_join_request:${room.code}:${request.id}:${hostParticipantId}`
    });
  }
}

function dismissJoinRequestNotifications(room, requestId) {
  const time = nowIso();
  for (const notification of store.notifications || []) {
    if (
      notification.type === "room_join_request" &&
      notification.roomCode === room.code &&
      (notification.requestId === requestId || notification.meta?.requestId === requestId)
    ) {
      notification.read = true;
      notification.dismissed = true;
      notification.updatedAt = time;
    }
  }
}

function dismissEventResponseNotifications(room, eventId, participantId) {
  const time = nowIso();
  for (const notification of store.notifications || []) {
    if (
      notification.roomCode === room.code &&
      notification.eventId === eventId &&
      notification.recipientParticipantId === participantId &&
      ["event_invite", "event_updated"].includes(notification.type)
    ) {
      notification.read = true;
      notification.dismissed = true;
      notification.updatedAt = time;
    }
  }
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
    existing.source = source === "google" || source === "microsoft" ? source : "guest";
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
    source: source === "google" || source === "microsoft" ? source : "guest",
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
    emoji: room.emoji || room.icon || defaultRoomEmoji,
    icon: room.emoji || room.icon || defaultRoomEmoji,
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
      displayName: participant.displayName,
      color: participant.color,
      connected: Boolean(participant.connected),
      needsReconnect: Boolean(participant.needsReconnect),
      joinedAt: participant.joinedAt,
      lastSeenAt: participant.lastSeenAt,
      picture: participant.picture || null,
      syncStatus: participant.syncStatus || (participant.needsReconnect ? "needs_reconnect" : (participant.connected ? "connected" : "guest")),
      lastSyncedAt: participant.lastSyncedAt || null,
      lastSyncError: participant.id === viewerParticipantId ? participant.lastSyncError || null : null,
      lastCalendarName: participant.id === viewerParticipantId ? participant.lastCalendarName || null : null,
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
  if (!canonicalParticipantColor(participant.color) && userPreferredColor(user)) {
    participant.color = userPreferredColor(user);
  }
  room.updatedAt = nowIso();
}

function googleItemSourceId(calendarId, eventId) {
  return `google:${calendarId}:${eventId}`;
}

function outlookItemSourceId(calendarId, eventId) {
  return `outlook:${calendarId}:${eventId}`;
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

function googleCalendarCanWriteEvents(calendar = {}) {
  return ["owner", "writer", "writerWithoutPrivateAccess"].includes(calendar.accessRole);
}

function googleTimedEventRange(event = {}) {
  if (!event.start?.dateTime || !event.end?.dateTime) return null;
  const start = parseGoogleEventTime(event.start);
  const end = parseGoogleEventTime(event.end, true);
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return null;
  }
  return { start, end };
}

function googleEventCanMove(event = {}) {
  return Boolean(
    googleTimedEventRange(event) &&
    event.status !== "cancelled" &&
    event.transparency !== "transparent" &&
    event.locked !== true &&
    (
      event.organizer?.self === true ||
      event.creator?.self === true ||
      event.guestsCanModify === true
    )
  );
}

function parseOutlookDateTime(value) {
  if (!value) return null;
  if (typeof value === "string") return new Date(value);
  if (value.dateTime) return new Date(value.dateTime);
  return null;
}

async function fetchOutlookCalendarEvents(accessToken, timeMin, timeMax) {
  const url = new URL("https://graph.microsoft.com/v1.0/me/calendar/calendarView");
  url.searchParams.set("startDateTime", timeMin.toISOString());
  url.searchParams.set("endDateTime", timeMax.toISOString());
  url.searchParams.set("$select", "id,start,end,showAs,isCancelled");
  url.searchParams.set("$orderby", "start/dateTime");
  url.searchParams.set("$top", "2500");

  const response = await fetchWithTimeout(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    }
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error?.message || "Could not fetch Outlook calendar events.");
  }
  return payload.value || [];
}

function syncedGoogleCalendarMirrorIds(room, userId) {
  const ids = new Set();
  for (const roomEvent of room.events || []) {
    const entry = normalizeGoogleCalendarSync(roomEvent.googleCalendarSync || roomEvent.googleSync)[userId];
    if (entry?.googleEventId) ids.add(String(entry.googleEventId));
  }
  return ids;
}

function syncedGoogleCalendarMirrorIntervals(room, participant, userId) {
  const intervals = [];
  for (const roomEvent of room.events || []) {
    if (roomEvent.syncToGoogle !== true) continue;

    const syncEntries = normalizeGoogleCalendarSync(roomEvent.googleCalendarSync || roomEvent.googleSync);
    const ownEntry = syncEntries[userId];
    const syncedByCreator = Object.values(syncEntries).some((entry) => entry?.googleEventId);
    const isCreatorMirror = roomEvent.createdByParticipantId === participant?.id && ownEntry?.googleEventId;
    const isInviteeMirror = (roomEvent.inviteeParticipantIds || []).includes(participant?.id) && syncedByCreator;
    if (!isCreatorMirror && !isInviteeMirror) continue;

    const start = new Date(roomEvent.start).getTime();
    const end = new Date(roomEvent.end).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
    intervals.push({ start, end });
  }

  return intervals.sort((left, right) => left.start - right.start || left.end - right.end);
}

function subtractGoogleMirrorIntervals(startDate, endDate, mirrorIntervals = []) {
  let fragments = [{
    start: startDate.getTime(),
    end: endDate.getTime()
  }];

  for (const mirror of mirrorIntervals) {
    const next = [];
    for (const fragment of fragments) {
      if (mirror.end <= fragment.start || mirror.start >= fragment.end) {
        next.push(fragment);
        continue;
      }
      if (mirror.start > fragment.start) {
        next.push({ start: fragment.start, end: Math.min(mirror.start, fragment.end) });
      }
      if (mirror.end < fragment.end) {
        next.push({ start: Math.max(mirror.end, fragment.start), end: fragment.end });
      }
    }
    fragments = next;
    if (!fragments.length) break;
  }

  return fragments.filter((fragment) => fragment.end > fragment.start);
}

function syncedOutlookCalendarMirrorIds(room, userId) {
  const ids = new Set();
  for (const roomEvent of room.events || []) {
    const entry = normalizeOutlookCalendarSync(
      roomEvent.outlookCalendarSync || roomEvent.microsoftCalendarSync || roomEvent.outlookSync
    )[userId];
    if (entry?.outlookEventId) ids.add(String(entry.outlookEventId));
  }
  return ids;
}

function isSyncedGoogleMirrorEvent(room, detailEvent, mirroredIds) {
  if (!detailEvent?.id) return false;
  if (mirroredIds.has(String(detailEvent.id))) return true;

  const privateProps = detailEvent.extendedProperties?.private || {};
  const mirroredRoomCode = privateProps.commonGroundRoomCode || privateProps.freeTimeRoomCode;
  const mirroredEventId = privateProps.commonGroundEventId || privateProps.freeTimeEventId;
  if (mirroredRoomCode !== room.code || !mirroredEventId) {
    return false;
  }

  return (room.events || []).some((roomEvent) => roomEvent.id === mirroredEventId);
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

async function getFreshMicrosoftTokensForUser(userId) {
  const user = store.users[userId];
  const tokens = microsoftUserTokens(user);
  if (!tokens?.access_token) return null;

  if (!tokens.expires_at || Date.now() < tokens.expires_at - 60_000) {
    return tokens;
  }

  const refreshed = await refreshMicrosoftAccessToken(tokens);
  updateUserRecord(userId, {
    microsoftTokens: refreshed,
    auth: {
      microsoft: {
        tokens: refreshed,
        scopes: uniqueStrings(typeof refreshed?.scope === "string" ? refreshed.scope.split(" ") : user.microsoftScopes || []),
        updatedAt: nowIso()
      }
    }
  });
  saveStore();
  return refreshed;
}

async function googleCalendarRequest(
  userId,
  calendarId,
  eventId,
  { method = "GET", body = null, sendUpdates = "none", query = null } = {}
) {
  const tokens = await getFreshTokensForUser(userId);
  if (!tokens?.access_token) {
    const error = new Error("Google Calendar needs reconnecting.");
    error.status = 401;
    throw error;
  }

  const encodedCalendarId = encodeURIComponent(calendarId || "primary");
  const pathSuffix = eventId ? `/${encodeURIComponent(eventId)}` : "";
  const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodedCalendarId}/events${pathSuffix}`);
  if (sendUpdates) url.searchParams.set("sendUpdates", sendUpdates);
  for (const [key, rawValue] of Object.entries(query || {})) {
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    for (const value of values) {
      if (value !== null && value !== undefined && value !== "") {
        url.searchParams.append(key, String(value));
      }
    }
  }

  const response = await fetchWithTimeout(url, {
    method,
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  let payload = null;
  if (response.status !== 204) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const error = new Error(payload?.error?.message || "Google Calendar sync failed.");
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function fetchGoogleCalendarEventsForRange(userId, calendarId, timeMin, timeMax) {
  const items = [];
  let pageToken = null;
  let pageCount = 0;

  do {
    const payload = await googleCalendarRequest(userId, calendarId, null, {
      method: "GET",
      sendUpdates: null,
      query: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        showDeleted: false,
        orderBy: "startTime",
        maxResults: 2500,
        pageToken
      }
    });
    items.push(...(payload?.items || []));
    pageToken = payload?.nextPageToken || null;
    pageCount += 1;
  } while (pageToken && pageCount < 20);

  return items;
}

async function outlookCalendarRequest(userId, eventId, { method = "GET", body = null, sendUpdates = null } = {}) {
  const tokens = await getFreshMicrosoftTokensForUser(userId);
  if (!tokens?.access_token) {
    const error = new Error("Outlook Calendar needs reconnecting.");
    error.status = 401;
    throw error;
  }

  const encodedEventId = eventId ? encodeURIComponent(eventId) : null;
  const url = new URL("https://graph.microsoft.com/v1.0/me/events");
  if (encodedEventId) {
    url.pathname = `/v1.0/me/events/${encodedEventId}`;
  }

  if (sendUpdates) {
    url.searchParams.set("sendUpdates", sendUpdates);
  }

  const response = await fetchWithTimeout(url, {
    method,
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  let payload = null;
  if (response.status !== 204) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const error = new Error(payload?.error?.message || "Outlook Calendar sync failed.");
    error.status = response.status;
    throw error;
  }

  return payload;
}

function googleCalendarEventDescription(room, event) {
  const counts = responseSummary(event);
  return [
    event.description || "",
    event.description ? "" : null,
    `CommonGround room: ${room.name} (${room.code})`,
    `${publicBaseUrl}/room/${room.code}`,
    "",
    `Responses: ${counts.yes} yes · ${counts.maybe} maybe · ${counts.no} no`
  ].filter((line) => line !== null).join("\n");
}

function googleCalendarPayload(room, event, ownerParticipant, includeAttendees = false) {
  const creator = findParticipantById(room, event.createdByParticipantId);
  const timezone = event.timezone || "UTC";
  const inviteeParticipants = (event.inviteeParticipantIds || [])
    .map((participantId) => findParticipantById(room, participantId))
    .filter(Boolean);
  const attendeeEmails = includeAttendees
    ? inviteeParticipants
        .filter((participant) => participant.userId && participant.userId !== ownerParticipant?.userId)
        .map((participant) => {
          const user = store.users[participant.userId];
          return user?.email ? {
            email: user.email,
            displayName: participant.displayName
          } : null;
        })
        .filter(Boolean)
    : [];

  return {
    summary: String(event.title || "(No title)").trim() || "(No title)",
    location: event.location || undefined,
    description: googleCalendarEventDescription(room, event),
    start: event.allDay
      ? { date: dateKeyInTimezone(event.start, timezone) }
      : { dateTime: new Date(event.start).toISOString(), timeZone: timezone },
    end: event.allDay
      ? { date: dateKeyInTimezone(event.end, timezone) }
      : { dateTime: new Date(event.end).toISOString(), timeZone: timezone },
    reminders: { useDefault: true },
    extendedProperties: {
      private: {
        commonGroundRoomCode: room.code,
        commonGroundEventId: event.id,
        commonGroundParticipantId: ownerParticipant?.id || "",
        commonGroundCreator: creator?.displayName || ""
      }
    },
    ...(attendeeEmails.length ? { attendees: attendeeEmails } : {})
  };
}

function outlookCalendarEventDescription(room, event) {
  const counts = responseSummary(event);
  return [
    event.description || "",
    event.description ? "" : null,
    `CommonGround room: ${room.name} (${room.code})`,
    `${publicBaseUrl}/room/${room.code}`,
    "",
    `Responses: ${counts.yes} yes · ${counts.maybe} maybe · ${counts.no} no`
  ].filter((line) => line !== null).join("\n");
}

function outlookCalendarPayload(room, event, ownerParticipant, includeAttendees = false) {
  const timezone = event.timezone || "UTC";
  const inviteeParticipants = (event.inviteeParticipantIds || [])
    .map((participantId) => findParticipantById(room, participantId))
    .filter(Boolean);
  const attendeeEmails = includeAttendees
    ? inviteeParticipants
        .filter((participant) => participant.userId && participant.userId !== ownerParticipant?.userId)
        .map((participant) => {
          const user = store.users[participant.userId];
          return user?.email ? {
            emailAddress: {
              address: user.email,
              name: participant.displayName
            }
          } : null;
        })
        .filter(Boolean)
    : [];

  return {
    subject: String(event.title || "(No title)").trim() || "(No title)",
    body: {
      contentType: "text",
      content: outlookCalendarEventDescription(room, event)
    },
    location: {
      displayName: event.location || ""
    },
    start: {
      dateTime: event.allDay
        ? `${dateKeyInTimezone(event.start, timezone)}T00:00:00`
        : new Date(event.start).toISOString(),
      timeZone: timezone
    },
    end: {
      dateTime: event.allDay
        ? `${dateKeyInTimezone(event.end, timezone)}T00:00:00`
        : new Date(event.end).toISOString(),
      timeZone: timezone
    },
    isAllDay: event.allDay === true,
    isReminderOn: true,
    showAs: "busy",
    categories: [],
    sensitivity: "normal",
    importance: "normal",
    responseRequested: true,
    ...(attendeeEmails.length ? { attendees: attendeeEmails } : {})
  };
}

async function deleteGoogleCalendarEntry(userId, entry, sendUpdates = "none") {
  if (!entry?.googleEventId) return;
  try {
    if (!userGoogleConnected(store.users[userId])) {
      throw httpError(409, "Google Calendar must be reconnected before this event can be deleted.");
    }
    await googleCalendarRequest(userId, entry.calendarId || "primary", entry.googleEventId, {
      method: "DELETE",
      sendUpdates
    });
  } catch (error) {
    if (error.status !== 404 && error.status !== 410) {
      entry.status = "delete_error";
      entry.lastAttemptAt = nowIso();
      entry.lastError = error.message;
      throw error;
    }
  }
}

function deterministicGoogleCalendarEventId(room, event, userId) {
  const digest = crypto.createHash("sha256")
    .update(`commonground|${room.code}|${event.id}|${userId}`)
    .digest("hex");
  return `cg${digest}`;
}

async function findGoogleCalendarMirrorEvent(userId, calendarId, room, event) {
  const result = await googleCalendarRequest(userId, calendarId || "primary", null, {
    method: "GET",
    sendUpdates: null,
    query: {
      privateExtendedProperty: [
        `commonGroundRoomCode=${room.code}`,
        `commonGroundEventId=${event.id}`
      ],
      maxResults: 10,
      showDeleted: false,
      singleEvents: true
    }
  });
  return (result?.items || []).find((item) => {
    const privateProps = item.extendedProperties?.private || {};
    return privateProps.commonGroundRoomCode === room.code && privateProps.commonGroundEventId === event.id;
  }) || null;
}

async function upsertGoogleCalendarEvent(room, event, participant) {
  if (!participant?.userId) return;
  const user = store.users[participant.userId];
  event.googleCalendarSync = normalizeGoogleCalendarSync(event.googleCalendarSync);
  const previousEntry = event.googleCalendarSync[user.id] || null;
  const includeAttendees = true;
  const sendUpdates = "all";
  const shouldSync = event.syncToGoogle === true && user?.calendarEventSync?.enabled === true && userHasGoogleCalendarWriteAccess(user);

  if (!shouldSync) {
    if (previousEntry?.googleEventId) {
      await deleteGoogleCalendarEntry(user.id, previousEntry, sendUpdates);
    }
    delete event.googleCalendarSync[user.id];
    return;
  }

  const calendarId = previousEntry?.calendarId || "primary";
  const payload = googleCalendarPayload(room, event, participant, includeAttendees);
  const syncStartedAt = nowIso();

  try {
    let googleEvent = null;
    if (previousEntry?.googleEventId) {
      try {
        googleEvent = await googleCalendarRequest(user.id, calendarId, previousEntry.googleEventId, {
          method: "PATCH",
          body: payload,
          sendUpdates
        });
      } catch (error) {
        if (error.status !== 404 && error.status !== 410) throw error;
      }
    }

    if (!googleEvent) {
      const existingMirror = await findGoogleCalendarMirrorEvent(user.id, "primary", room, event);
      if (existingMirror?.id) {
        googleEvent = await googleCalendarRequest(user.id, "primary", existingMirror.id, {
          method: "PATCH",
          body: payload,
          sendUpdates
        });
      }
    }

    if (!googleEvent) {
      const deterministicEventId = deterministicGoogleCalendarEventId(room, event, user.id);
      try {
        googleEvent = await googleCalendarRequest(user.id, "primary", null, {
          method: "POST",
          body: { id: deterministicEventId, ...payload },
          sendUpdates
        });
      } catch (error) {
        if (error.status !== 409) throw error;
        googleEvent = await googleCalendarRequest(user.id, "primary", deterministicEventId, {
          method: "PATCH",
          body: payload,
          sendUpdates
        });
      }
    }

    event.googleCalendarSync[user.id] = {
      calendarId: "primary",
      googleEventId: googleEvent?.id || previousEntry?.googleEventId || null,
      htmlLink: googleEvent?.htmlLink || previousEntry?.htmlLink || null,
      status: "synced",
      lastAttemptAt: syncStartedAt,
      lastSyncedAt: nowIso(),
      lastError: null,
      organizerParticipantId: participant.id,
      organizerEmail: user.email || null,
      sentAt: previousEntry?.sentAt || nowIso()
    };
  } catch (error) {
    event.googleCalendarSync[user.id] = {
      ...(previousEntry || {}),
      calendarId,
      status: "error",
      lastAttemptAt: syncStartedAt,
      lastError: error.message
    };
  }
}

async function deleteOutlookCalendarEntry(userId, entry, sendUpdates = null) {
  if (!entry?.outlookEventId) return;
  try {
    if (!userMicrosoftConnected(store.users[userId])) {
      throw httpError(409, "Outlook Calendar must be reconnected before this event can be deleted.");
    }
    await outlookCalendarRequest(userId, entry.outlookEventId, {
      method: "DELETE",
      sendUpdates
    });
  } catch (error) {
    if (error.status !== 404 && error.status !== 410) {
      entry.status = "delete_error";
      entry.lastAttemptAt = nowIso();
      entry.lastError = error.message;
      throw error;
    }
  }
}

async function upsertOutlookCalendarEvent(room, event, participant) {
  if (!participant?.userId) return;
  const user = store.users[participant.userId];
  event.outlookCalendarSync = normalizeOutlookCalendarSync(event.outlookCalendarSync);
  const previousEntry = event.outlookCalendarSync[user.id] || null;
  const includeAttendees = true;
  const sendUpdates = null;
  const shouldSync = event.syncToOutlook === true && user?.outlookEventSync?.enabled === true && userHasMicrosoftCalendarWriteAccess(user);

  if (!shouldSync) {
    if (previousEntry?.outlookEventId) {
      await deleteOutlookCalendarEntry(user.id, previousEntry, sendUpdates);
    }
    delete event.outlookCalendarSync[user.id];
    return;
  }

  const payload = outlookCalendarPayload(room, event, participant, includeAttendees);
  const syncStartedAt = nowIso();

  try {
    let outlookEvent = null;
    if (previousEntry?.outlookEventId) {
      try {
        outlookEvent = await outlookCalendarRequest(user.id, previousEntry.outlookEventId, {
          method: "PATCH",
          body: payload,
          sendUpdates
        });
      } catch (error) {
        if (error.status !== 404 && error.status !== 410) throw error;
      }
    }

    if (!outlookEvent) {
      outlookEvent = await outlookCalendarRequest(user.id, null, {
        method: "POST",
        body: payload,
        sendUpdates
      });
    }

    event.outlookCalendarSync[user.id] = {
      calendarId: "primary",
      outlookEventId: outlookEvent?.id || previousEntry?.outlookEventId || null,
      webLink: outlookEvent?.webLink || previousEntry?.webLink || null,
      status: "synced",
      lastAttemptAt: syncStartedAt,
      lastSyncedAt: nowIso(),
      lastError: null,
      organizerParticipantId: participant.id,
      organizerEmail: user.email || null,
      sentAt: previousEntry?.sentAt || nowIso()
    };
  } catch (error) {
    event.outlookCalendarSync[user.id] = {
      ...(previousEntry || {}),
      calendarId: "primary",
      status: "error",
      lastAttemptAt: syncStartedAt,
      lastError: error.message
    };
  }
}

function eventSyncParticipants(room, event) {
  return uniqueStrings([event.createdByParticipantId])
    .map((participantId) => findParticipantById(room, participantId))
    .filter((participant) => participant?.userId);
}

async function syncGoogleCalendarForEvent(room, event) {
  event.googleCalendarSync = normalizeGoogleCalendarSync(event.googleCalendarSync);
  const participants = eventSyncParticipants(room, event);
  const targetUserIds = new Set(participants.map((participant) => participant.userId));

  for (const [userId, entry] of Object.entries(event.googleCalendarSync)) {
    if (!targetUserIds.has(userId) || event.syncToGoogle === false) {
      await deleteGoogleCalendarEntry(userId, entry, "all");
      delete event.googleCalendarSync[userId];
    }
  }

  if (event.syncToGoogle === false) return;

  for (const participant of participants) {
    await upsertGoogleCalendarEvent(room, event, participant);
  }
}

async function deleteSyncedGoogleCalendarEvents(room, event) {
  event.googleCalendarSync = normalizeGoogleCalendarSync(event.googleCalendarSync);
  for (const [userId, entry] of Object.entries(event.googleCalendarSync)) {
    await deleteGoogleCalendarEntry(userId, entry, "all");
  }
  event.googleCalendarSync = {};
}

async function syncOutlookCalendarForEvent(room, event) {
  event.outlookCalendarSync = normalizeOutlookCalendarSync(event.outlookCalendarSync);
  const participants = eventSyncParticipants(room, event);
  const targetUserIds = new Set(participants.map((participant) => participant.userId));

  for (const [userId, entry] of Object.entries(event.outlookCalendarSync)) {
    if (!targetUserIds.has(userId) || event.syncToOutlook === false) {
      await deleteOutlookCalendarEntry(userId, entry, null);
      delete event.outlookCalendarSync[userId];
    }
  }

  if (event.syncToOutlook === false) return;

  for (const participant of participants) {
    await upsertOutlookCalendarEvent(room, event, participant);
  }
}

async function deleteSyncedOutlookCalendarEvents(room, event) {
  event.outlookCalendarSync = normalizeOutlookCalendarSync(event.outlookCalendarSync);
  for (const [userId, entry] of Object.entries(event.outlookCalendarSync)) {
    await deleteOutlookCalendarEntry(userId, entry, null);
  }
  event.outlookCalendarSync = {};
}

async function syncRoomCalendarsForEvent(room, event) {
  await syncGoogleCalendarForEvent(room, event);
  await syncOutlookCalendarForEvent(room, event);
}

async function fetchCalendarList(accessToken) {
  const response = await fetchWithTimeout("https://www.googleapis.com/calendar/v3/users/me/calendarList?showHidden=false", {
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
      summary: calendar.summaryOverride || calendar.summary || "Google Calendar",
      primary: Boolean(calendar.primary),
      backgroundColor: calendar.backgroundColor,
      accessRole: calendar.accessRole || null
    }));

  calendars.sort((left, right) => Number(right.primary) - Number(left.primary));

  return {
    calendars: calendars.length ? calendars.slice(0, 50) : [{ id: "primary", summary: "Google calendar", primary: true }],
    needsReconnect: false,
    calendarListError: null
  };
}

async function fetchOutlookCalendarList(accessToken) {
  try {
    const primary = await fetchMicrosoftPrimaryCalendar(accessToken);
    return {
      calendars: primary ? [primary] : [{ id: "primary", summary: "Outlook calendar", primary: true }],
      needsReconnect: false,
      calendarListError: null
    };
  } catch (error) {
    return {
      calendars: [{ id: "primary", summary: "Outlook calendar", primary: true }],
      needsReconnect: false,
      calendarListError: error?.message || "Could not load Outlook calendar details."
    };
  }
}

async function fetchUserFreeBusy(room, user, participant, timeMin, timeMax, viewerParticipantId = null) {
  const fallbackStart = new Date();
  fallbackStart.setHours(0, 0, 0, 0);
  const fallbackEnd = new Date(fallbackStart);
  fallbackEnd.setDate(fallbackEnd.getDate() + 7);
  const start = clampDate(timeMin, fallbackStart);
  const end = clampDate(timeMax, fallbackEnd);
  const busy = [];
  const providerResults = [];
  const providerErrors = [];
  const successfulProviders = [];

  if (userGoogleConnected(user)) {
    try {
      const tokens = await getFreshTokensForUser(user.id);
      if (!tokens?.access_token) throw httpError(401, "Google Calendar needs reconnecting.");
      const googleCalendarList = await fetchCalendarList(tokens.access_token);
      const calendars = (googleCalendarList.calendars || []).slice(0, 50);
      const mirroredIntervals = syncedGoogleCalendarMirrorIntervals(room, participant, user.id);
      const editableEventsByCalendar = new Map();
      const canExposeEditableGoogleEvents = (
        participant.id === viewerParticipantId &&
        userHasGoogleCalendarWriteAccess(user)
      );

      if (canExposeEditableGoogleEvents) {
        const mirroredIds = syncedGoogleCalendarMirrorIds(room, user.id);
        const writableCalendars = calendars.filter(googleCalendarCanWriteEvents);
        for (let offset = 0; offset < writableCalendars.length; offset += 4) {
          const batch = writableCalendars.slice(offset, offset + 4);
          const results = await Promise.all(batch.map(async (calendar) => {
            try {
              const events = await fetchGoogleCalendarEventsForRange(user.id, calendar.id, start, end);
              return {
                calendarId: calendar.id,
                events: events
                  .filter((event) => (
                    event?.id &&
                    googleEventCanMove(event) &&
                    !isSyncedGoogleMirrorEvent(room, event, mirroredIds)
                  ))
                  .map((event) => {
                    const range = googleTimedEventRange(event);
                    if (!range) return null;
                    return {
                      calendarId: calendar.id,
                      eventId: String(event.id),
                      start: range.start.toISOString(),
                      end: range.end.toISOString()
                    };
                  })
                  .filter(Boolean)
              };
            } catch {
              return { calendarId: calendar.id, events: [] };
            }
          }));

          for (const result of results) {
            editableEventsByCalendar.set(result.calendarId, result.events);
          }
        }
      }

      const response = await fetchWithTimeout("https://www.googleapis.com/calendar/v3/freeBusy", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          timeMin: start.toISOString(),
          timeMax: end.toISOString(),
          items: calendars.map((calendar) => ({ id: calendar.id }))
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw httpError(response.status, payload.error?.message || "Could not fetch Google calendar availability.");
      }
      for (const calendar of calendars) {
        const editableEvents = editableEventsByCalendar.get(calendar.id) || [];
        for (const editableEvent of editableEvents) {
          busy.push({
            start: editableEvent.start,
            end: editableEvent.end,
            participantId: participant.id,
            ownerName: participant.displayName,
            color: participant.color,
            busy: true,
            calendarId: "google",
            calendarColor: participant.color,
            items: [{
              sourceId: googleItemSourceId(editableEvent.calendarId, editableEvent.eventId),
              provider: "google",
              title: "",
              location: "",
              description: "",
              visibility: "busy",
              sharedWithParticipantIds: [],
              editable: true,
              googleCalendarId: editableEvent.calendarId,
              googleEventId: editableEvent.eventId,
              start: editableEvent.start,
              end: editableEvent.end
            }]
          });
        }

        const hiddenIntervals = [
          ...mirroredIntervals,
          ...editableEvents.map((event) => ({
            start: new Date(event.start).getTime(),
            end: new Date(event.end).getTime()
          }))
        ];
        for (const interval of payload.calendars?.[calendar.id]?.busy || []) {
          const startDate = new Date(interval.start);
          const endDate = new Date(interval.end);
          if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) continue;
          for (const fragment of subtractGoogleMirrorIntervals(startDate, endDate, hiddenIntervals)) {
            const fragmentStart = new Date(fragment.start).toISOString();
            const fragmentEnd = new Date(fragment.end).toISOString();
            const digest = crypto.createHash("sha256")
              .update(`${calendar.id}|${fragmentStart}|${fragmentEnd}`)
              .digest("hex")
              .slice(0, 24);
            busy.push({
              start: fragmentStart,
              end: fragmentEnd,
              participantId: participant.id,
              ownerName: participant.displayName,
              color: participant.color,
              busy: true,
              calendarId: "google",
              calendarColor: participant.color,
              items: [{
                sourceId: `google-freebusy:${digest}`,
                provider: "google",
                title: "",
                location: "",
                description: "",
                visibility: "busy",
                sharedWithParticipantIds: [],
                editable: false,
                start: fragmentStart,
                end: fragmentEnd
              }]
            });
          }
        }
      }
      const primary = calendars.find((calendar) => calendar.primary) || calendars[0] || null;
      participant.lastCalendarId = primary?.id || null;
      participant.lastCalendarName = primary?.summary || "Google Calendar";
      providerResults.push({ calendars });
      successfulProviders.push("google");
    } catch (error) {
      providerErrors.push({
        provider: "google",
        status: Number(error.status || 0),
        message: error.message || "Could not fetch Google calendar availability."
      });
    }
  }

  if (userMicrosoftConnected(user)) {
    try {
      const tokens = await getFreshMicrosoftTokensForUser(user.id);
      if (!tokens?.access_token) throw httpError(401, "Outlook Calendar needs reconnecting.");
      const outlookCalendar = await fetchMicrosoftPrimaryCalendar(tokens.access_token);
      const mirroredIds = syncedOutlookCalendarMirrorIds(room, user.id);
      const intervals = await fetchOutlookCalendarEvents(tokens.access_token, start, end);
      for (const interval of intervals || []) {
        const status = String(interval.showAs || "").toLowerCase();
        if (interval.isCancelled || mirroredIds.has(String(interval.id)) || status === "free") continue;
        const startDate = parseOutlookDateTime(interval.start);
        const endDate = parseOutlookDateTime(interval.end);
        if (!startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) continue;
        const digest = crypto.createHash("sha256")
          .update(`${outlookCalendar?.id || "primary"}|${interval.id}|${startDate.toISOString()}|${endDate.toISOString()}`)
          .digest("hex")
          .slice(0, 24);
        busy.push({
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          participantId: participant.id,
          ownerName: participant.displayName,
          color: participant.color,
          busy: true,
          calendarId: "outlook",
          calendarColor: participant.color,
          items: [{
            sourceId: `outlook-freebusy:${digest}`,
            provider: "outlook",
            title: "",
            location: "",
            description: "",
            visibility: "busy",
            sharedWithParticipantIds: [],
            editable: false,
            start: startDate.toISOString(),
            end: endDate.toISOString()
          }]
        });
      }
      participant.lastCalendarId = outlookCalendar?.id || participant.lastCalendarId;
      participant.lastCalendarName = outlookCalendar?.summary || "Outlook Calendar";
      providerResults.push({ calendars: outlookCalendar ? [outlookCalendar] : [] });
      successfulProviders.push("outlook");
    } catch (error) {
      providerErrors.push({
        provider: "outlook",
        status: Number(error.status || 0),
        message: error.message || "Could not fetch Outlook calendar availability."
      });
    }
  }

  const uniqueBusy = [];
  const seenBusyKeys = new Set();
  for (const entry of busy) {
    const key = `${entry.participantId}|${entry.start}|${entry.end}|${entry.items?.[0]?.provider || "calendar"}`;
    if (seenBusyKeys.has(key)) continue;
    seenBusyKeys.add(key);
    uniqueBusy.push(entry);
  }

  const authFailure = providerErrors.some((entry) => [401, 403].includes(entry.status));
  const connected = hasConnectedCalendar(user);
  const status = successfulProviders.length
    ? (providerErrors.length ? "partial_error" : "connected")
    : (authFailure ? "needs_reconnect" : (providerErrors.length ? "error" : "guest"));
  participant.connected = connected;
  participant.needsReconnect = authFailure && !successfulProviders.length;
  participant.syncStatus = status;
  participant.lastSyncedAt = successfulProviders.length ? nowIso() : participant.lastSyncedAt || null;
  participant.lastSyncError = providerErrors.length
    ? providerErrors.map((entry) => `${entry.provider}: ${entry.message}`).join(" | ")
    : null;
  participant.lastSeenAt = nowIso();
  updateUserSync(user.id, {
    status,
    lastAttemptAt: nowIso(),
    lastSuccessAt: successfulProviders.length ? nowIso() : user.sync?.lastSuccessAt || null,
    lastError: participant.lastSyncError,
    calendarId: null,
    calendarName: participant.lastCalendarName || "Connected calendar"
  });
  return {
    busy: uniqueBusy,
    connected,
    needsReconnect: participant.needsReconnect,
    calendarCount: providerResults.reduce((total, current) => total + (current.calendars || []).length, 0),
    calendarListError: participant.lastSyncError
  };
}

async function fetchRoomFreeBusy(room, timeMin, timeMax, viewerParticipantId) {
  const { start, end } = validateFreeBusyRange(timeMin, timeMax);
  const busy = [];
  let connectedCount = 0;

  for (const participant of room.participants) {
    if (!participant.userId) continue;
    const user = store.users[participant.userId];
    if (!user) continue;

    try {
      const result = await fetchUserFreeBusy(room, user, participant, start, end, viewerParticipantId);
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
    source: "calendar",
    busy,
    participants: room.participants.map((participant) => ({
      id: participant.id,
      displayName: participant.displayName,
      color: participant.color,
      connected: Boolean(participant.connected),
      needsReconnect: Boolean(participant.needsReconnect),
      syncStatus: participant.syncStatus || (participant.needsReconnect ? "needs_reconnect" : (participant.connected ? "connected" : "guest")),
      lastSyncedAt: participant.lastSyncedAt || null,
      lastSyncError: participant.id === viewerParticipantId ? participant.lastSyncError || null : null,
      lastCalendarName: participant.id === viewerParticipantId ? participant.lastCalendarName || null : null
    })),
    connectedCount,
    fetchedAt: nowIso()
  };
}

function pruneOauthStates() {
  const now = Date.now();
  for (const [state, data] of oauthStates.entries()) {
    if (!data?.expiresAt || data.expiresAt <= now) oauthStates.delete(state);
  }
}

function buildGoogleAuthUrl(session, roomCode, { calendarWrite = false, requestId = null } = {}) {
  const credentials = loadGoogleCredentials();
  if (!credentials) return null;

  pruneOauthStates();
  const state = crypto.randomBytes(16).toString("hex");
  oauthStates.set(state, {
    roomCode: roomCode ? normalizeRoomCode(roomCode) : null,
    sessionId: session.id,
    provider: "google",
    calendarWrite,
    popup: Boolean(requestId),
    requestId: requestId || null,
    expiresAt: Date.now() + oauthStateLifetimeMs
  });

  const url = new URL(credentials.authUri);
  url.searchParams.set("client_id", credentials.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", (calendarWrite ? googleWriteScopes : googleBaseScopes).join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", state);
  return url.toString();
}

function validOauthPopupRequestId(value) {
  return typeof value === "string" && /^[A-Za-z0-9_-]{32,128}$/.test(value);
}

function googleOauthPopupRelayLocation(stateData, {
  status,
  errorCode = null
} = {}) {
  if (
    stateData?.provider !== "google" ||
    stateData.popup !== true ||
    !validOauthPopupRequestId(stateData.requestId)
  ) {
    return null;
  }

  const safeStatus = status === "success" ? "success" : "error";
  const safeErrors = new Set([
    "access_denied",
    "provider_error",
    "calendar_connection_failed"
  ]);
  const params = new URLSearchParams({
    provider: "google",
    status: safeStatus,
    requestId: stateData.requestId
  });
  if (safeStatus === "error") {
    params.set("errorCode", safeErrors.has(errorCode) ? errorCode : "calendar_connection_failed");
  }
  return `/oauth-popup.html#${params.toString()}`;
}

function sendGoogleOauthResult(res, stateData, {
  fullPageLocation,
  status,
  errorCode = null
}) {
  const popupLocation = googleOauthPopupRelayLocation(stateData, { status, errorCode });
  sendRedirect(res, popupLocation || fullPageLocation);
}

function buildMicrosoftAuthUrl(session, roomCode, { calendarWrite = false } = {}) {
  const credentials = loadMicrosoftCredentials();
  if (!credentials) return null;

  pruneOauthStates();
  const state = crypto.randomBytes(16).toString("hex");
  oauthStates.set(state, {
    roomCode: roomCode ? normalizeRoomCode(roomCode) : null,
    sessionId: session.id,
    provider: "microsoft",
    calendarWrite,
    expiresAt: Date.now() + oauthStateLifetimeMs
  });

  const url = new URL(credentials.authUri);
  url.searchParams.set("client_id", credentials.clientId);
  url.searchParams.set("redirect_uri", microsoftRedirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", (calendarWrite ? microsoftWriteScopes : microsoftBaseScopes).join(" "));
  url.searchParams.set("response_mode", "query");
  url.searchParams.set("state", state);
  return url.toString();
}

function validateEventInput(body, existingEvent = null) {
  const title = boundedText(body.title, {
    field: "Event title",
    max: textLimits.eventTitle,
    fallback: "(No title)"
  });
  const start = new Date(body.start);
  const end = new Date(body.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw httpError(400, "Event start and end are required.");
  }
  if (end <= start) throw httpError(400, "Event end must be after start.");
  if (end.getTime() - start.getTime() > 366 * 24 * 60 * 60 * 1000) {
    throw httpError(400, "Events cannot be longer than 366 days.");
  }

  const timezone = body.timezone === undefined
    ? normalizeTimezone(existingEvent?.timezone || "UTC")
    : normalizeTimezone(body.timezone || "UTC");
  if (body.allDay !== undefined && typeof body.allDay !== "boolean") {
    throw httpError(400, "All-day must be true or false.");
  }
  const allDay = body.allDay === undefined ? existingEvent?.allDay === true : body.allDay;
  const date = dateKeyInTimezone(start, timezone);
  const exclusiveEndDate = dateKeyInTimezone(end, timezone);
  if (allDay && exclusiveEndDate <= date) {
    throw httpError(400, "All-day event end date must be after its start date.");
  }

  return {
    title,
    date,
    start: start.toISOString(),
    end: end.toISOString(),
    timezone,
    allDay,
    location: boundedText(body.location, { field: "Location", max: textLimits.eventLocation }),
    description: boundedText(body.description, {
      field: "Description",
      max: textLimits.eventDescription,
      multiline: true
    })
  };
}

function requiredOpaqueGoogleId(value, field) {
  if (typeof value !== "string" || !value.trim() || value.length > 2048) {
    throw httpError(400, `${field} is required.`);
  }
  return value.trim();
}

function validateGoogleTimedEventMove(body = {}) {
  const calendarId = requiredOpaqueGoogleId(body.calendarId, "Google calendar ID");
  const eventId = requiredOpaqueGoogleId(body.eventId, "Google event ID");
  const start = new Date(body.start);
  const end = new Date(body.end);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw httpError(400, "Event start and end are required.");
  }
  if (end <= start) {
    throw httpError(400, "Event end must be after start.");
  }
  if (end.getTime() - start.getTime() > 366 * 24 * 60 * 60 * 1000) {
    throw httpError(400, "Events cannot be longer than 366 days.");
  }
  return { calendarId, eventId, start, end };
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

function removeResponsesForUninvitedParticipants(event) {
  const invitees = new Set(event.inviteeParticipantIds || []);
  for (const participantId of Object.keys(event.responses || {})) {
    if (!invitees.has(participantId)) {
      delete event.responses[participantId];
    }
  }
}

function summarizeCalendarSync(sync = {}) {
  const entries = Object.values(sync || {});
  if (!entries.length) return { status: "not_synced", lastSyncedAt: null };
  const error = entries.find((entry) => entry.status === "error" || entry.status === "delete_error");
  const latest = entries
    .map((entry) => entry.lastSyncedAt)
    .filter(Boolean)
    .sort()
    .at(-1) || null;
  return {
    status: error ? "needs_attention" : (entries.every((entry) => entry.status === "synced") ? "synced" : "pending"),
    lastSyncedAt: latest
  };
}

function publicEvent(event, room, viewerParticipantId = null) {
  const responseMap = event.responses || {};
  const creator = room.participants.find((participant) => participant.id === event.createdByParticipantId) || null;
  const voters = { yes: [], maybe: [], no: [] };
  const inviteeParticipantIds = uniqueStrings(event.inviteeParticipantIds || []);
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

  return {
    id: event.id,
    title: event.title || "(No title)",
    date: dateKeyInTimezone(event.start, event.timezone || "UTC") || event.date,
    start: event.start,
    end: event.end,
    timezone: event.timezone || "UTC",
    allDay: event.allDay === true,
    location: event.location || "",
    description: event.description || "",
    inviteeParticipantIds,
    createdByParticipantId: event.createdByParticipantId,
    createdByDisplayName: creator?.displayName || "Someone",
    createdByColor: creator?.color || participantPalette[0],
    syncToGoogle: event.syncToGoogle === true,
    syncToOutlook: event.syncToOutlook === true,
    googleCalendarSyncStatus: summarizeCalendarSync(event.googleCalendarSync),
    outlookCalendarSyncStatus: summarizeCalendarSync(event.outlookCalendarSync),
    createdAt: event.createdAt,
    updatedAt: event.updatedAt || event.createdAt,
    responses: Object.fromEntries(
      Object.entries(responseMap).filter(([participantId]) => inviteeSet.has(participantId))
    ),
    comments: (event.comments || []).map((comment) => ({
      id: comment.id,
      participantId: comment.participantId,
      displayName: comment.displayName,
      text: comment.text,
      createdAt: comment.createdAt
    })),
    viewerCanSeeDetails: true,
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
  applySecurityHeaders(res);
  const url = new URL(req.url, `http://${req.headers.host}`);
  const roomCodeMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)$/);
  const roomJoinMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/join$/);
  const roomJoinRequestMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/join-requests\/([^/]+)$/);
  const roomJoinRequestActionMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/join-requests\/([^/]+)\/(approve|decline)$/);
  const roomRefreshCodeMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/refresh-code$/);
  const roomParticipantPatchMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/participants\/([^/]+)$/);
  const roomParticipantDeleteMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/participants\/([^/]+)$/);
  const roomFreeBusyMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/freebusy$/);
  const roomGoogleCalendarEventsMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/google-calendar-events$/);
  const roomEventsMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/events$/);
  const roomEventMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/events\/([^/]+)$/);
  const roomEventRespondMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/events\/([^/]+)\/respond$/);
  const roomEventCommentsMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/events\/([^/]+)\/comments$/);
  const roomEventIcsMatch = url.pathname.match(/^\/api\/rooms\/([^/]+)\/events\/([^/]+)\/ics$/);
  const notificationActionMatch = url.pathname.match(/^\/api\/notifications\/([^/]+)\/(read|dismiss)$/);

  try {
    if (
      url.pathname.startsWith("/api/") &&
      ["POST", "PATCH", "DELETE"].includes(req.method) &&
      !isAllowedMutationOrigin(req)
    ) {
      sendJson(res, 403, { error: "Cross-site request blocked." });
      return;
    }

    if (url.pathname === emojiKeywordDictionaryRoute) {
      sendEmojiKeywordDictionary(req, res);
      return;
    }

    if (url.pathname === "/api/auth/google") {
      if (req.method !== "GET") {
        sendMethodNotAllowed(res, ["GET"]);
        return;
      }
      if (!enforceRateLimit(req, res, "oauth-google", 20, 10 * 60 * 1000)) return;

      const popupToken = url.searchParams.get("popupToken") || "";
      const calendarWriteValue = url.searchParams.get("calendarWrite");
      if (url.searchParams.get("popup") !== "1" || !validOauthPopupRequestId(popupToken)) {
        sendJson(res, 400, { error: "A valid OAuth popup token is required." });
        return;
      }
      if (calendarWriteValue !== null && calendarWriteValue !== "0" && calendarWriteValue !== "1") {
        sendJson(res, 400, { error: "calendarWrite must be 1 or 0." });
        return;
      }

      const session = getSession(req, res);
      const roomCode = normalizeRoomCode(url.searchParams.get("room") || session.lastRoomCode || "");
      const calendarWrite = calendarWriteValue !== "0";
      const authorizationUrl = buildGoogleAuthUrl(session, roomCode || null, {
        calendarWrite,
        requestId: popupToken
      });
      if (!authorizationUrl) {
        sendGoogleOauthResult(res, {
          provider: "google",
          popup: true,
          requestId: popupToken
        }, {
          fullPageLocation: `${roomCode ? `/room/${roomCode}` : "/"}?error=missing_google_credentials`,
          status: "error",
          errorCode: "calendar_connection_failed"
        });
        return;
      }

      sendRedirect(res, authorizationUrl);
      return;
    }

    if (url.pathname === "/api/config") {
      if (req.method !== "GET") {
        sendMethodNotAllowed(res, ["GET"]);
        return;
      }
      sendJson(res, 200, {
        googleReady: Boolean(loadGoogleCredentials()),
        outlookReady: Boolean(loadMicrosoftCredentials()),
        redirectUri,
        microsoftRedirectUri
      });
      return;
    }

    if (url.pathname === "/api/me") {
      if (req.method !== "GET") {
        sendMethodNotAllowed(res, ["GET"]);
        return;
      }
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

    if (url.pathname === "/api/notifications" && req.method === "GET") {
      const session = getSession(req, res);
      const user = currentUserFromSession(session);
      sendJson(res, 200, {
        notifications: notificationsForIdentity(session, user)
      });
      return;
    }

    if (url.pathname === "/api/notifications/read-all" && req.method === "PATCH") {
      const session = getSession(req, res);
      const user = currentUserFromSession(session);
      const participantIds = participantIdsForIdentity(session, user);
      const time = nowIso();
      for (const notification of store.notifications || []) {
        if (!participantIds.has(notification.recipientParticipantId)) continue;
        notification.read = true;
        notification.updatedAt = time;
      }
      saveStore();
      sendJson(res, 200, {
        notifications: notificationsForIdentity(session, user)
      });
      return;
    }

    if (notificationActionMatch && req.method === "PATCH") {
      const session = getSession(req, res);
      const user = currentUserFromSession(session);
      const notification = findNotificationForIdentity(notificationActionMatch[1], session, user);
      if (!notification) {
        sendJson(res, 404, { error: "Notification not found." });
        return;
      }

      notification.read = true;
      notification.updatedAt = nowIso();
      if (notificationActionMatch[2] === "dismiss") {
        notification.dismissed = true;
      }
      saveStore();
      sendJson(res, 200, {
        notification: publicNotification(notification)
      });
      return;
    }

    if (url.pathname === "/api/me/calendar-event-sync" && req.method === "PATCH") {
      const session = getSession(req, res);
      const user = currentUserFromSession(session);
      if (!user) {
        sendJson(res, 401, { error: "Connect a calendar before enabling event sync." });
        return;
      }

      const body = await readJsonBody(req);
      const provider = body.provider === "outlook" ? "outlook" : "google";
      const enabled = Boolean(body.enabled);
      const writeReady = provider === "google"
        ? userHasGoogleCalendarWriteAccess(user)
        : userHasMicrosoftCalendarWriteAccess(user);
      if (enabled && !writeReady) {
        sendJson(res, 409, {
          error: provider === "google"
            ? "Grant Google Calendar event permission to send invitations."
            : "Grant Outlook event permission to send invitations.",
          needsReconnect: true,
          authorizationUrl: provider === "google"
            ? `/auth/google?room=${encodeURIComponent(session.lastRoomCode || "")}&calendarWrite=1`
            : `/auth/microsoft?room=${encodeURIComponent(session.lastRoomCode || "")}&calendarWrite=1`,
          user: publicUser(user)
        });
        return;
      }

      const nextUser = provider === "google"
        ? updateUserRecord(user.id, {
          calendarEventSync: {
            enabled,
            updatedAt: nowIso()
          }
        })
        : updateUserRecord(user.id, {
          outlookEventSync: {
            enabled,
            updatedAt: nowIso()
          }
        });
      saveStore();
      sendJson(res, 200, {
        user: publicUser(nextUser)
      });
      return;
    }

    if (url.pathname === "/api/my-rooms" && req.method === "GET") {
      const session = getSession(req, res);
      const user = currentUserFromSession(session);
      const rooms = roomsForIdentity(session, user);
      const roomCodes = new Set(rooms.map((room) => room.code));
      let activeRoomCode = session.lastRoomCode && roomCodes.has(session.lastRoomCode)
        ? session.lastRoomCode
        : null;

      if (!activeRoomCode && rooms.length) {
        activeRoomCode = rooms[0].code;
      }

      sendJson(res, 200, {
        rooms,
        activeRoomCode
      });
      return;
    }

    if (url.pathname === "/api/rooms" && req.method === "POST") {
      if (!enforceRateLimit(req, res, "room-create", 10, 60 * 60 * 1000)) return;
      const session = getSession(req, res);
      const user = currentUserFromSession(session);
      const body = await readJsonBody(req);
      const roomName = boundedText(body.name, {
        field: "Room name",
        max: textLimits.roomName,
        fallback: "Untitled room"
      });
      const displayName = boundedText(body.displayName, {
        field: "Display name",
        max: textLimits.displayName,
        fallback: getDisplayNameForSession(session, user, "Guest")
      });
      const emoji = normalizeRoomEmoji(body.emoji || body.icon || defaultRoomEmoji);
      const code = generateRoomCode();
      const time = nowIso();

      session.pendingDisplayName = displayName;
      session.lastRoomCode = code;

      const room = {
        id: code,
        code,
        name: roomName,
        emoji,
        icon: emoji,
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
      if (!enforceRateLimit(req, res, "room-join", 30, 15 * 60 * 1000)) return;
      const code = normalizeRoomCode(roomJoinMatch[1]);
      const session = getSession(req, res);
      const user = currentUserFromSession(session);
      const room = findRoom(code);
      if (!room) {
        sendJson(res, 404, { error: "Room not found." });
        return;
      }

      const body = await readJsonBody(req);
      const displayName = boundedText(body.displayName, {
        field: "Display name",
        max: textLimits.displayName,
        fallback: getDisplayNameForSession(session, user, "Guest")
      });
      session.pendingDisplayName = displayName;
      session.lastRoomCode = code;

      if (isRoomLocked(room) && !canJoinLockedRoom(room, session, user)) {
        const source = userGoogleConnected(user) ? "google" : (userMicrosoftConnected(user) ? "microsoft" : "guest");
        const request = upsertJoinRequest(room, session, user, displayName, source);
        notifyHostsOfJoinRequest(room, request);
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
      const name = typeof body.name === "string"
        ? boundedText(body.name, { field: "Room name", max: textLimits.roomName, required: true })
        : "";
      const emoji = typeof body.emoji === "string" || typeof body.icon === "string"
        ? normalizeRoomEmoji(body.emoji || body.icon)
        : "";
      const nextCode = typeof body.code === "string" ? normalizeRoomCode(body.code) : "";
      const nextLocked = typeof body.locked === "boolean" ? body.locked : null;
      let codeChanged = false;

      if (!name && !emoji && !nextCode && nextLocked === null) {
        sendJson(res, 400, { error: "Room name, emoji, code, or lock state is required." });
        return;
      }

      if (name) {
        auth.room.name = name;
      }

      if (emoji) {
        auth.room.emoji = emoji;
        auth.room.icon = emoji;
      }

      if (nextLocked !== null) {
        auth.room.access = auth.room.access || { locked: false, approvedSessionIds: [], approvedUserIds: [], updatedAt: nowIso() };
        auth.room.access.locked = nextLocked;
        auth.room.access.updatedAt = nowIso();
      }

      if (nextCode && nextCode !== auth.room.code) {
        if (!isValidRoomCode(nextCode)) {
          sendJson(res, 400, { error: "Room codes must be six unambiguous uppercase letters or numbers." });
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
        updateRoomCodeReferences(auth.room, oldCode, nextCode);
        codeChanged = true;
      }

      auth.room.updatedAt = nowIso();
      if (codeChanged) {
        for (const event of auth.room.events || []) {
          await syncRoomCalendarsForEvent(auth.room, event);
        }
      }
      saveStore();
      sendJson(res, 200, buildRoomResponse(auth.room, auth.session, auth.participant));
      return;
    }

    if (roomJoinRequestActionMatch && req.method === "POST") {
      const auth = requireRoomParticipant(req, res, roomJoinRequestActionMatch[1]);
      if (!auth) return;
      if (!isHost(auth.room, auth.session, auth.user)) {
        sendJson(res, 403, { error: "Only the host can manage join requests." });
        return;
      }

      const request = (auth.room.joinRequests || []).find((entry) => entry.id === roomJoinRequestActionMatch[2]);
      if (!request) {
        sendJson(res, 404, { error: "Join request not found." });
        return;
      }

      const status = roomJoinRequestActionMatch[3] === "approve" ? "approved" : "denied";
      if (status === "approved") {
        approveJoinRequest(auth.room, request);
      } else {
        request.status = "denied";
        request.updatedAt = nowIso();
      }
      dismissJoinRequestNotifications(auth.room, request.id);

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
      dismissJoinRequestNotifications(auth.room, request.id);

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
      updateRoomCodeReferences(auth.room, oldCode, newCode);
      for (const event of auth.room.events || []) {
        await syncRoomCalendarsForEvent(auth.room, event);
      }
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

      for (const event of auth.room.events || []) {
        await deleteSyncedGoogleCalendarEvents(auth.room, event);
        await deleteSyncedOutlookCalendarEvents(auth.room, event);
      }
      store.notifications = (store.notifications || []).filter((notification) => notification.roomCode !== auth.room.code);
      for (const session of sessions.values()) {
        if (session.lastRoomCode === auth.room.code) session.lastRoomCode = null;
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
      const displayName = typeof body.displayName === "string"
        ? boundedText(body.displayName, { field: "Display name", max: textLimits.displayName, required: true })
        : "";
      const color = typeof body.color === "string" ? body.color.trim() : "";
      const normalizedColor = color ? canonicalParticipantColor(color) : "";

      if (!displayName && !color) {
        sendJson(res, 400, { error: "Display name or colour is required." });
        return;
      }

      if (displayName) {
        target.displayName = displayName;
        target.displayNameSource = "custom";
      }

      if (color) {
        if (!normalizedColor) {
          sendJson(res, 400, { error: "Choose a valid participant colour." });
          return;
        }
        target.color = normalizedColor;
      }

      target.lastSeenAt = nowIso();
      auth.room.updatedAt = nowIso();
      if (target.id === auth.participant.id && displayName) {
        auth.session.pendingDisplayName = displayName;
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
      const target = findParticipantById(auth.room, targetId);
      if (!target) {
        sendJson(res, 404, { error: "Participant not found." });
        return;
      }
      if (hostParticipantIds(auth.room).includes(targetId)) {
        sendJson(res, 409, { error: "The room host cannot be removed." });
        return;
      }

      auth.room.participants = auth.room.participants.filter((participant) => participant.id !== targetId);
      for (const event of auth.room.events) {
        if (event.createdByParticipantId === targetId) {
          await deleteSyncedGoogleCalendarEvents(auth.room, event);
          await deleteSyncedOutlookCalendarEvents(auth.room, event);
          event.createdByParticipantId = auth.participant.id;
          event.syncToGoogle = false;
          event.syncToOutlook = false;
        }
        delete event.responses?.[targetId];
        event.comments = (event.comments || []).filter((comment) => comment.participantId !== targetId);
        event.inviteeParticipantIds = (event.inviteeParticipantIds || []).filter((participantId) => participantId !== targetId);
        event.updatedAt = nowIso();
        await syncRoomCalendarsForEvent(auth.room, event);
      }
      auth.room.access.approvedSessionIds = (auth.room.access.approvedSessionIds || [])
        .filter((sessionId) => !uniqueStrings([target.sessionId, ...(target.sessionIds || [])]).includes(sessionId));
      if (target.userId) {
        auth.room.access.approvedUserIds = (auth.room.access.approvedUserIds || [])
          .filter((userId) => userId !== target.userId);
      }
      const targetSessionIds = new Set(uniqueStrings([target.sessionId, ...(target.sessionIds || [])]));
      auth.room.joinRequests = (auth.room.joinRequests || []).filter((request) => !(
        (target.userId && request.userId === target.userId) || targetSessionIds.has(request.sessionId)
      ));
      store.notifications = (store.notifications || [])
        .filter((notification) => !(notification.roomCode === auth.room.code && notification.recipientParticipantId === targetId))
        .map((notification) => notification.roomCode === auth.room.code && notification.actorParticipantId === targetId
          ? { ...notification, actorParticipantId: null }
          : notification);
      auth.room.updatedAt = nowIso();
      saveStore();
      sendJson(res, 200, buildRoomResponse(auth.room, auth.session, auth.participant));
      return;
    }

    if (roomGoogleCalendarEventsMatch && req.method === "PATCH") {
      if (!enforceRateLimit(req, res, "google-event-update", 120, 60 * 60 * 1000)) return;
      const auth = requireRoomParticipant(req, res, roomGoogleCalendarEventsMatch[1]);
      if (!auth) return;
      if (!auth.user || auth.participant.userId !== auth.user.id) {
        sendJson(res, 401, { error: "Sign in with Google Calendar before moving this event." });
        return;
      }
      if (!userHasGoogleCalendarWriteAccess(auth.user)) {
        sendJson(res, 409, {
          error: "Reconnect Google Calendar and grant event access before moving this event.",
          needsReconnect: true
        });
        return;
      }

      const body = await readJsonBody(req);
      const { calendarId, eventId, start, end } = validateGoogleTimedEventMove(body);
      const googleTokens = await getFreshTokensForUser(auth.user.id);
      const calendarList = googleTokens?.access_token
        ? await fetchCalendarList(googleTokens.access_token)
        : { calendars: [] };
      const writableCalendar = (calendarList.calendars || []).find((calendar) => (
        calendar.id === calendarId && googleCalendarCanWriteEvents(calendar)
      ));
      if (!writableCalendar) {
        sendJson(res, 403, { error: "This Google Calendar is not writable." });
        return;
      }
      const googleEvent = await googleCalendarRequest(auth.user.id, calendarId, eventId, {
        method: "GET",
        sendUpdates: null
      });
      if (
        !googleEvent ||
        !googleEventCanMove(googleEvent)
      ) {
        sendJson(res, 409, { error: "This Google Calendar event cannot be moved from CommonGround." });
        return;
      }

      const mirroredIds = syncedGoogleCalendarMirrorIds(auth.room, auth.user.id);
      if (isSyncedGoogleMirrorEvent(auth.room, googleEvent, mirroredIds)) {
        sendJson(res, 409, { error: "Move this CommonGround event instead of its Google Calendar copy." });
        return;
      }

      const startTimeZone = googleEvent.start?.timeZone || null;
      const endTimeZone = googleEvent.end?.timeZone || startTimeZone;
      const updatedGoogleEvent = await googleCalendarRequest(auth.user.id, calendarId, eventId, {
        method: "PATCH",
        body: {
          start: {
            dateTime: start.toISOString(),
            ...(startTimeZone ? { timeZone: startTimeZone } : {})
          },
          end: {
            dateTime: end.toISOString(),
            ...(endTimeZone ? { timeZone: endTimeZone } : {})
          }
        },
        sendUpdates: "all"
      });
      const updatedRange = googleTimedEventRange(updatedGoogleEvent) || { start, end };
      auth.participant.lastSyncedAt = nowIso();
      auth.participant.lastSyncError = null;
      auth.room.updatedAt = nowIso();
      saveStore();
      sendJson(res, 200, {
        ok: true,
        event: {
          googleCalendarId: calendarId,
          googleEventId: String(updatedGoogleEvent?.id || eventId),
          start: updatedRange.start.toISOString(),
          end: updatedRange.end.toISOString()
        }
      });
      return;
    }

    if (roomFreeBusyMatch && req.method === "GET") {
      if (!enforceRateLimit(req, res, "freebusy", 30, 60 * 1000)) return;
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
      if (!enforceRateLimit(req, res, "event-create", 30, 60 * 60 * 1000)) return;
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
        syncToGoogle: body.syncToGoogle === true,
        syncToOutlook: body.syncToOutlook === true,
        googleCalendarSync: {},
        outlookCalendarSync: {},
        createdAt: nowIso(),
        updatedAt: nowIso(),
        responses: {},
        comments: []
      };

      auth.room.events.push(event);
      notifyEventParticipants(
        auth.room,
        event,
        auth.participant,
        "event_invite",
        inviteeParticipantIds
      );
      auth.room.updatedAt = nowIso();
      await syncRoomCalendarsForEvent(auth.room, event);
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
      const previousInviteeIds = new Set(event.inviteeParticipantIds || []);
      const previousDetails = {
        title: event.title,
        start: event.start,
        end: event.end,
        location: event.location,
        description: event.description
      };
      Object.assign(event, validateEventInput(body, event));
      event.inviteeParticipantIds = normalizeInviteeParticipantIds(
        auth.room,
        body.inviteeParticipantIds,
        event.createdByParticipantId
      );
      removeResponsesForUninvitedParticipants(event);
      event.updatedAt = nowIso();
      if (typeof body.syncToGoogle === "boolean") {
        event.syncToGoogle = body.syncToGoogle;
      }
      if (typeof body.syncToOutlook === "boolean") {
        event.syncToOutlook = body.syncToOutlook;
      }
      const newInviteeIds = (event.inviteeParticipantIds || []).filter((participantId) => !previousInviteeIds.has(participantId));
      const existingInviteeIds = (event.inviteeParticipantIds || []).filter((participantId) => previousInviteeIds.has(participantId));
      const detailsChanged = Object.entries(previousDetails).some(([key, value]) => event[key] !== value);
      notifyEventParticipants(auth.room, event, auth.participant, "event_invite", newInviteeIds);
      if (detailsChanged) {
        notifyEventParticipants(auth.room, event, auth.participant, "event_updated", existingInviteeIds, {
          dedupeSuffix: event.updatedAt
        });
      }
      auth.room.updatedAt = nowIso();
      await syncRoomCalendarsForEvent(auth.room, event);
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

      await deleteSyncedGoogleCalendarEvents(auth.room, event);
      await deleteSyncedOutlookCalendarEvents(auth.room, event);
      notifyEventParticipants(auth.room, event, auth.participant, "event_cancelled", event.inviteeParticipantIds || [], {
        dedupeSuffix: nowIso()
      });
      auth.room.events = auth.room.events.filter((item) => item.id !== event.id);
      auth.room.updatedAt = nowIso();
      saveStore();
      sendJson(res, 200, { deleted: true });
      return;
    }

    if (roomEventRespondMatch && req.method === "POST") {
      if (!enforceRateLimit(req, res, "event-response", 120, 10 * 60 * 1000)) return;
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
      dismissEventResponseNotifications(auth.room, event.id, auth.participant.id);
      event.updatedAt = nowIso();
      auth.room.updatedAt = nowIso();
      saveStore();
      sendJson(res, 200, { event: publicEvent(event, auth.room, auth.participant.id) });
      return;
    }

    if (roomEventCommentsMatch && req.method === "POST") {
      if (!enforceRateLimit(req, res, "event-comment", 60, 10 * 60 * 1000)) return;
      const auth = requireRoomParticipant(req, res, roomEventCommentsMatch[1]);
      if (!auth) return;
      const event = auth.room.events.find((item) => item.id === roomEventCommentsMatch[2]);
      if (!event) {
        sendJson(res, 404, { error: "Event not found." });
        return;
      }

      const body = await readJsonBody(req);
      const text = boundedText(body.text, {
        field: "Comment",
        max: textLimits.comment,
        required: true,
        multiline: true
      });

      event.comments = event.comments || [];
      const comment = {
        id: generateId("comment"),
        participantId: auth.participant.id,
        displayName: auth.participant.displayName,
        text,
        createdAt: nowIso()
      };
      event.comments.push(comment);
      notifyEventParticipants(auth.room, event, auth.participant, "event_comment", event.inviteeParticipantIds || [], {
        dedupeSuffix: comment.id,
        meta: {
          commentText: text
        }
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

      const eventTimezone = event.timezone || "UTC";
      const icsStart = event.allDay
        ? `DTSTART;VALUE=DATE:${dateKeyInTimezone(event.start, eventTimezone).replaceAll("-", "")}`
        : `DTSTART:${icsDate(event.start)}`;
      const icsEnd = event.allDay
        ? `DTEND;VALUE=DATE:${dateKeyInTimezone(event.end, eventTimezone).replaceAll("-", "")}`
        : `DTEND:${icsDate(event.end)}`;
      const ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//CommonGround//Shared Calendar//EN",
        `X-WR-TIMEZONE:${escapeIcs(eventTimezone)}`,
        "BEGIN:VEVENT",
        `UID:${event.id}@commonground`,
        `DTSTAMP:${icsDate(nowIso())}`,
        icsStart,
        icsEnd,
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
    if (req.method !== "GET") {
      sendMethodNotAllowed(res, ["GET"]);
      return;
    }
    if (!enforceRateLimit(req, res, "oauth-google", 20, 10 * 60 * 1000)) return;
    const session = getSession(req, res);
    const roomCode = normalizeRoomCode(url.searchParams.get("room") || session.lastRoomCode || "");
    const calendarWrite = url.searchParams.get("calendarWrite") !== "0";
    const authUrl = buildGoogleAuthUrl(session, roomCode || null, { calendarWrite });
    if (!authUrl) {
      sendRedirect(res, `${roomCode ? `/room/${roomCode}` : "/"}?error=missing_google_credentials`);
      return;
    }
    sendRedirect(res, authUrl);
    return;
  }

  if (url.pathname === "/auth/microsoft") {
    if (req.method !== "GET") {
      sendMethodNotAllowed(res, ["GET"]);
      return;
    }
    if (!enforceRateLimit(req, res, "oauth-microsoft", 20, 10 * 60 * 1000)) return;
    const session = getSession(req, res);
    const roomCode = normalizeRoomCode(url.searchParams.get("room") || session.lastRoomCode || "");
    const calendarWrite = url.searchParams.get("calendarWrite") === "1";
    const authUrl = buildMicrosoftAuthUrl(session, roomCode || null, { calendarWrite });
    if (!authUrl) {
      sendRedirect(res, `${roomCode ? `/room/${roomCode}` : "/"}?error=missing_microsoft_credentials`);
      return;
    }
    sendRedirect(res, authUrl);
    return;
  }

  if (url.pathname === "/auth/google/callback") {
    if (req.method !== "GET") {
      sendMethodNotAllowed(res, ["GET"]);
      return;
    }
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const providerError = url.searchParams.get("error");
    const stateData = state ? oauthStates.get(state) : null;
    const sessionBeforeRotation = getSession(req, res);
    const validState = Boolean(
      stateData &&
      stateData.provider === "google" &&
      stateData.expiresAt > Date.now() &&
      stateData.sessionId === sessionBeforeRotation.id
    );
    if (state) oauthStates.delete(state);
    const returnPath = stateData?.roomCode && findRoom(stateData.roomCode)
      ? `/room/${stateData.roomCode}`
      : "/";
    if (!validState) {
      sendGoogleOauthResult(res, stateData, {
        fullPageLocation: `${returnPath}?error=invalid_oauth_state`,
        status: "error",
        errorCode: "calendar_connection_failed"
      });
      return;
    }
    if (!code && !providerError) {
      sendGoogleOauthResult(res, stateData, {
        fullPageLocation: `${returnPath}?error=invalid_oauth_state`,
        status: "error",
        errorCode: "calendar_connection_failed"
      });
      return;
    }
    if (providerError) {
      sendGoogleOauthResult(res, stateData, {
        fullPageLocation: `${returnPath}?error=${encodeURIComponent(providerError)}`,
        status: "error",
        errorCode: providerError === "access_denied" ? "access_denied" : "provider_error"
      });
      return;
    }

    try {
      const googleTokens = await exchangeCodeForTokens(code);
      const profile = await fetchGoogleProfile(googleTokens.access_token);
      if (!profile?.id) throw new Error("Could not read your Google profile.");
      const userId = resolveProviderUserId(sessionBeforeRotation, profile, "google");
      const session = rotateSession(sessionBeforeRotation, res);
      session.userId = userId;
      const userRecord = setUserGoogleConnection(userId, profile, googleTokens);
      linkSessionParticipantsToUser(session, userRecord);
      propagateUserIdentityToRooms(userId);
      if (!session.pendingDisplayName) {
        session.pendingDisplayName = userDisplayName(userRecord) || "Guest";
      }

      const roomCode = stateData.roomCode || session.lastRoomCode || "";
      if (roomCode && store.rooms[roomCode]) {
        const room = store.rooms[roomCode];
        session.lastRoomCode = roomCode;
        if (isRoomLocked(room) && !canJoinLockedRoom(room, session, userRecord)) {
          const request = upsertJoinRequest(room, session, userRecord, session.pendingDisplayName, "google");
          notifyHostsOfJoinRequest(room, request);
          room.updatedAt = nowIso();
          saveStore();
          sendGoogleOauthResult(res, stateData, {
            fullPageLocation: `/room/${roomCode}?request=sent`,
            status: "success"
          });
          return;
        }
        const participant = ensureParticipant(room, session, userRecord, session.pendingDisplayName);
        updateParticipantFromUser(room, participant, userRecord);
        settleJoinRequestsForIdentity(room, session, userRecord);
        if (room.hostSessionId === session.id && !room.hostUserId) room.hostUserId = userId;
        saveStore();
        sendGoogleOauthResult(res, stateData, {
          fullPageLocation: `/room/${roomCode}?connected=google${stateData.calendarWrite ? "&calendarWrite=1" : ""}`,
          status: "success"
        });
        return;
      }

      saveStore();
      sendGoogleOauthResult(res, stateData, {
        fullPageLocation: `/?connected=google${stateData.calendarWrite ? "&calendarWrite=1" : ""}`,
        status: "success"
      });
    } catch {
      sendGoogleOauthResult(res, stateData, {
        fullPageLocation: `${returnPath}?error=calendar_connection_failed`,
        status: "error",
        errorCode: "calendar_connection_failed"
      });
    }
    return;
  }

  if (url.pathname === "/auth/microsoft/callback") {
    if (req.method !== "GET") {
      sendMethodNotAllowed(res, ["GET"]);
      return;
    }
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const providerError = url.searchParams.get("error");
    const stateData = state ? oauthStates.get(state) : null;
    const sessionBeforeRotation = getSession(req, res);
    const validState = Boolean(
      stateData &&
      stateData.provider === "microsoft" &&
      stateData.expiresAt > Date.now() &&
      stateData.sessionId === sessionBeforeRotation.id
    );
    if (state) oauthStates.delete(state);
    const returnPath = stateData?.roomCode && findRoom(stateData.roomCode)
      ? `/room/${stateData.roomCode}`
      : "/";
    if (!validState || (!code && !providerError)) {
      sendRedirect(res, `${returnPath}?error=invalid_oauth_state`);
      return;
    }
    if (providerError) {
      sendRedirect(res, `${returnPath}?error=${encodeURIComponent(providerError)}`);
      return;
    }

    try {
      const microsoftTokens = await exchangeMicrosoftCodeForTokens(code);
      const profile = await fetchMicrosoftProfile(microsoftTokens.access_token);
      if (!profile?.id) throw new Error("Could not read your Microsoft profile.");
      const userId = resolveProviderUserId(sessionBeforeRotation, profile, "microsoft");
      const session = rotateSession(sessionBeforeRotation, res);
      session.userId = userId;
      const userRecord = setUserMicrosoftConnection(userId, profile, microsoftTokens);
      linkSessionParticipantsToUser(session, userRecord);
      propagateUserIdentityToRooms(userId);
      if (!session.pendingDisplayName) {
        session.pendingDisplayName = userDisplayName(userRecord) || "Guest";
      }

      const roomCode = stateData.roomCode || session.lastRoomCode || "";
      if (roomCode && store.rooms[roomCode]) {
        const room = store.rooms[roomCode];
        session.lastRoomCode = roomCode;
        if (isRoomLocked(room) && !canJoinLockedRoom(room, session, userRecord)) {
          const request = upsertJoinRequest(room, session, userRecord, session.pendingDisplayName, "microsoft");
          notifyHostsOfJoinRequest(room, request);
          room.updatedAt = nowIso();
          saveStore();
          sendRedirect(res, `/room/${roomCode}?request=sent`);
          return;
        }
        const participant = ensureParticipant(room, session, userRecord, session.pendingDisplayName);
        updateParticipantFromUser(room, participant, userRecord);
        settleJoinRequestsForIdentity(room, session, userRecord);
        if (room.hostSessionId === session.id && !room.hostUserId) room.hostUserId = userId;
        saveStore();
        sendRedirect(
          res,
          `/room/${roomCode}?connected=microsoft${stateData.calendarWrite ? "&calendarWrite=1" : ""}`
        );
        return;
      }

      saveStore();
      sendRedirect(res, `/?connected=microsoft${stateData.calendarWrite ? "&calendarWrite=1" : ""}`);
    } catch {
      sendRedirect(res, `${returnPath}?error=calendar_connection_failed`);
    }
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    sendJson(res, 404, { error: "API route not found." });
    return;
  }
  if (url.pathname.startsWith("/auth/")) {
    sendJson(res, 404, { error: "Authentication route not found." });
    return;
  }

    serveStatic(req, res);
  } catch (error) {
    const status = Number(error.status || 500);
    sendJson(res, status >= 400 && status < 600 ? status : 500, {
      error: status >= 400 && status < 500 ? error.message : "The server could not complete this request."
    });
  }
});

server.listen(port, host, () => {
  console.log(`CommonGround running at http://localhost:${port}`);
  console.log(`Google redirect URI: ${redirectUri}`);
});
