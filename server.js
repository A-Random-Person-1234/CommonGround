import http from "node:http";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import {
  completeMoveTarget,
  parseCommand,
  resolveEventCandidates
} from "./command-centre-parser.js";
import {
  calculateAvailableSlots,
  findConflicts
} from "./command-centre-scheduling.js";

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
const defaultRoomEmoji = "ðŸ“…";
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
const commandMutationQueues = new Map();
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
        laçNôêÚ$z{-®éÜj×V&Æ–4WfVçB†WfVçBÂWF‚ç&ööÒÂWF‚ç'F–6—çBæ–B’Ò“°¢&WGW&ã°¢Ð ¢–b‡&ööÔWfVçDÖF6‚bb&WæÖWF†öBÓÓÒ$DTÄUDR"’°¢6öç7BWF‚Ò&WV—&U&ööÕ'F–6—çB‡&WÂ&W2Â&ööÔWfVçDÖF6…³Ò“°¢–b‚WF‚’&WGW&ã°¢6öç7BWfVçBÒWF‚ç&ööÒæWfVçG2æf–æB‚†—FVÒ’Óâ—FVÒæ–BÓÓÒ&ööÔWfVçDÖF6…³%Ò“°¢–b‚WfVçB’°¢6VæD§6öâ‡&W2ÂCBÂ²W'&÷#¢$WfVçBæ÷Bf÷VæBâ"Ò“°¢&WGW&ã°¢Ð¢6öç7B6äFVÆWFRÒWfVçBæ7&VFVD'•'F–6—çD–BÓÓÒWF‚ç'F–6—çBæ–BÇÂ—4†÷7B†WF‚ç&ööÒÂWF‚ç6W76–öâÂWF‚çW6W"“°¢–b‚6äFVÆWFR’°¢6VæD§6öâ‡&W2ÂC2Â²W'&÷#¢%–÷R6ææ÷BFVÆWFRF†—2WfVçBâ"Ò“°¢&WGW&ã°¢Ð ¢v—BFVÆWFU7–æ6VDvöövÆT6ÆVæF$WfVçG2†WF‚ç&ööÒÂWfVçB“°¢v—BFVÆWFU7–æ6VD÷WFÆöö´6ÆVæF$WfVçG2†WF‚ç&ööÒÂWfVçB“°¢æ÷F–g”WfVçE'F–6—çG2†WF‚ç&ööÒÂWfVçBÂWF‚ç'F–6—çBÂ&WfVçEö6æ6VÆÆVB"ÂWfVçBæ–çf—FVU'F–6—çD–G2ÇÂµÒÂ°¢FVGWU7Vff—ƒ¢æ÷t—6ò‚¢Ò“°¢WF‚ç&ööÒæWfVçG2ÒWF‚ç&ööÒæWfVçG2æf–ÇFW"‚†—FVÒ’Óâ—FVÒæ–BÓÒWfVçBæ–B“°¢WF‚ç&ööÒçWFFVDBÒæ÷t—6ò‚“°¢6fU7F÷&R‚“°¢6VæD§6öâ‡&W2Â#Â²FVÆWFVC¢G'VRÒ“°¢&WGW&ã°¢Ð ¢–b‡&ööÔWfVçE&W7öæDÖF6‚bb&WæÖWF†öBÓÓÒ%õ5B"’°¢–b‚Væf÷&6U&FTÆ–Ö—B‡&WÂ&W2Â&WfVçB×&W7öç6R"Â#Â¢c¢’’&WGW&ã°¢6öç7BWF‚Ò&WV—&U&ööÕ'F–6—çB‡&WÂ&W2Â&ööÔWfVçE&W7öæDÖF6…³Ò“°¢–b‚WF‚’&WGW&ã°¢6öç7BWfVçBÒWF‚ç&ööÒæWfVçG2æf–æB‚†—FVÒ’Óâ—FVÒæ–BÓÓÒ&ööÔWfVçE&W7öæDÖF6…³%Ò“°¢–b‚WfVçB’°¢6VæD§6öâ‡&W2ÂCBÂ²W'&÷#¢$WfVçBæ÷Bf÷VæBâ"Ò“°¢&WGW&ã°¢Ð¢–b‚†WfVçBæ–çf—FVU'F–6—çD–G2ÇÂµÒ’æ–æ6ÇVFW2†WF‚ç'F–6—çBæ–B’’°¢6VæD§6öâ‡&W2ÂC2Â²W'&÷#¢$öæÇ’–çf—FVB'F–6—çG26â&W7öæBFòF†—2WfVçBâ"Ò“°¢&WGW&ã°¢Ð ¢6öç7B&öG’Òv—B&VD§6öä&öG’‡&W“°¢6öç7B&W7öç6UfÇVRÒ7G&–ær†&öG’ç&W7öç6RÇÂ""’çG&–Ò‚’çFôÆ÷vW$66R‚“°¢–b‚²'–W2"Â&Ö–&R"Â&æò%Òæ–æ6ÇVFW2‡&W7öç6UfÇVR’’°¢6VæD§6öâ‡&W2ÂCÂ²W'&÷#¢%&W7öç6R×W7B&R–W2ÂÖ–&RÂ÷"æòâ"Ò“°¢&WGW&ã°¢Ð ¢WfVçBç&W7öç6W2ÒWfVçBç&W7öç6W2ÇÂ·Ó°¢WfVçBç&W7öç6W5¶WF‚ç'F–6—çBæ–EÒÒ&W7öç6UfÇVS°¢F—6Ö—74WfVçE&W7öç6Tæ÷F–f–6F–öç2†WF‚ç&ööÒÂWfVçBæ–BÂWF‚ç'F–6—çBæ–B“°¢WfVçBçWFFVDBÒæ÷t—6ò‚“°¢WF‚ç&ööÒçWFFVDBÒæ÷t—6ò‚“°¢6fU7F÷&R‚“°¢6VæD§6öâ‡&W2Â#Â²WfVçC¢V&Æ–4WfVçB†WfVçBÂWF‚ç&ööÒÂWF‚ç'F–6—çBæ–B’Ò“°¢&WGW&ã°¢Ð ¢–b‡&ööÔWfVçD6öÖÖVçG4ÖF6‚bb&WæÖWF†öBÓÓÒ%õ5B"’°¢–b‚Væf÷&6U&FTÆ–Ö—B‡&WÂ&W2Â&WfVçBÖ6öÖÖVçB"ÂcÂ¢c¢’’&WGW&ã°¢6öç7BWF‚Ò&WV—&U&ööÕ'F–6—çB‡&WÂ&W2Â&ööÔWfVçD6öÖÖVçG4ÖF6…³Ò“°¢–b‚WF‚’&WGW&ã°¢6öç7BWfVçBÒWF‚ç&ööÒæWfVçG2æf–æB‚†—FVÒ’Óâ—FVÒæ–BÓÓÒ&ööÔWfVçD6öÖÖVçG4ÖF6…³%Ò“°¢–b‚WfVçB’°¢6VæD§6öâ‡&W2ÂCBÂ²W'&÷#¢$WfVçBæ÷Bf÷VæBâ"Ò“°¢&WGW&ã°¢Ð ¢6öç7B&öG’Òv—B&VD§6öä&öG’‡&W“°¢6öç7BFW‡BÒ&÷VæFVEFW‡B†&öG’çFW‡BÂ°¢f–VÆC¢$6öÖÖVçB"À¢Öƒ¢FW‡DÆ–Ö—G2æ6öÖÖVçBÀ¢&WV—&VC¢G'VRÀ¢×VÇF–Æ–æS¢G'VP¢Ò“° ¢WfVçBæ6öÖÖVçG2ÒWfVçBæ6öÖÖVçG2ÇÂµÓ°¢6öç7B6öÖÖVçBÒ°¢–C¢vVæW&FT–B‚&6öÖÖVçB"’À¢'F–6—çD–C¢WF‚ç'F–6—çBæ–BÀ¢F—7Æ”æÖS¢WF‚ç'F–6—çBæF—7Æ”æÖRÀ¢FW‡BÀ¢7&VFVDC¢æ÷t—6ò‚¢Ó°¢WfVçBæ6öÖÖVçG2çW6‚†6öÖÖVçB“°¢æ÷F–g”WfVçE'F–6—çG2†WF‚ç&ööÒÂWfVçBÂWF‚ç'F–6—çBÂ&WfVçEö6öÖÖVçB"ÂWfVçBæ–çf—FVU'F–6—çD–G2ÇÂµÒÂ°¢FVGWU7Vff—ƒ¢6öÖÖVçBæ–BÀ¢ÖWF¢°¢6öÖÖVçEFW‡C¢FW‡@¢Ð¢Ò“°¢WF‚ç&ööÒçWFFVDBÒæ÷t—6ò‚“°¢6fU7F÷&R‚“°¢6VæD§6öâ‡&W2Â#Â²WfVçC¢V&Æ–4WfVçB†WfVçBÂWF‚ç&ööÒÂWF‚ç'F–6—çBæ–B’Ò“°¢&WGW&ã°¢Ð ¢–b‡&ööÔWfVçD–74ÖF6‚bb&WæÖWF†öBÓÓÒ$tUB"’°¢6öç7BWF‚Ò&WV—&U&ööÕ'F–6—çB‡&WÂ&W2Â&ööÔWfVçD–74ÖF6…³Ò“°¢–b‚WF‚’&WGW&ã°¢6öç7BWfVçBÒWF‚ç&ööÒæWfVçG2æf–æB‚†—FVÒ’Óâ—FVÒæ–BÓÓÒ&ööÔWfVçD–74ÖF6…³%Ò“°¢–b‚WfVçB’°¢6VæD§6öâ‡&W2ÂCBÂ²W'&÷#¢$WfVçBæ÷Bf÷VæBâ"Ò“°¢&WGW&ã°¢Ð ¢6öç7BWfVçEF–ÖW¦öæRÒWfVçBçF–ÖW¦öæRÇÂ%UD2#°¢6öç7B–757F'BÒWfVçBæÆÄF¢òEE5D%CµdÅTSÔDDS¢G¶FFT¶W”–åF–ÖW¦öæR†WfVçBç7F'BÂWfVçEF–ÖW¦öæR’ç&WÆ6TÆÂ‚"Ò"Â""—Ö ¢¢EE5D%C¢G¶–74FFR†WfVçBç7F'B—Ö°¢6öç7B–74VæBÒWfVçBæÆÄF¢òEDTäCµdÅTSÔDDS¢G¶FFT¶W”–åF–ÖW¦öæR†WfVçBæVæBÂWfVçEF–ÖW¦öæR’ç&WÆ6TÆÂ‚"Ò"Â""—Ö ¢¢EDTäC¢G¶–74FFR†WfVçBæVæB—Ö°¢6öç7B–72Ò°¢$$Tt”ã¥d4ÄTäD""À¢%dU%4”ôã£"ã"À¢%$ôD”C¢Òòô6öÖÖöäw&÷VæBòõ6†&VB6ÆVæF"òôTâ"À¢‚Õu"ÕD”ÔU¤ôäS¢G¶W66T–72†WfVçEF–ÖW¦öæR—ÖÀ¢$$Tt”ã¥dUdTåB"À¢T”C¢G¶WfVçBæ–GÔ6öÖÖöæw&÷VæFÀ¢EE5DÕ¢G¶–74FFR†æ÷t—6ò‚’—ÖÀ¢–757F'BÀ¢–74VæBÀ¢5TÔÔ%“¢G¶W66T–72†WfVçBçF—FÆR—ÖÀ¢Äô4D”ôã¢G¶W66T–72†WfVçBæÆö6F–öâÇÂ""—ÖÀ¢DU45$•D”ôã¢G¶W66T–72†WfVçBæFW67&—F–öâÇÂ""—ÖÀ¢$TäC¥dUdTåB"À¢$TäC¥d4ÄTäD" ¢Òæ¦ö–â‚%Ç%Æâ"“° ¢&W2çw&—FT†VBƒ#Â°¢$6öçFVçBÕG—R#¢'FW‡Bö6ÆVæF#²6†'6WC×WFbÓ‚"À¢$6öçFVçBÔF—7÷6—F–öâ#¢GF6†ÖVçC²f–ÆVæÖSÕÂ"G¶WfVçBçF—FÆRç&WÆ6R‚õµæ×£Ó•Ò²öv’Â"Ò"’çFôÆ÷vW$66R‚’ÇÂ&WfVçB'Òæ–75Â&À¢$66†RÔ6öçG&öÂ#¢&æò×7F÷&R ¢Ò“°¢&W2æVæB†–72“°¢&WGW&ã°¢Ð ¦–b‡W&ÂçF†æÖRÓÓÒ"öWF‚övöövÆR"’°¢–b‡&WæÖWF†öBÓÒ$tUB"’°¢6VæDÖWF†öDæ÷DÆÆ÷vVB‡&W2Â²$tUB%Ò“°¢&WGW&ã°¢Ð¢–b‚Væf÷&6U&FTÆ–Ö—B‡&WÂ&W2Â&öWF‚ÖvöövÆR"Â#Â¢c¢’’&WGW&ã°¢6öç7B6W76–öâÒvWE6W76–öâ‡&WÂ&W2“°¢6öç7B&ööÔ6öFRÒæ÷&ÖÆ—¦U&ööÔ6öFR‡W&Âç6V&6…&×2ævWB‚'&ööÒ"’ÇÂ6W76–öâæÆ7E&ööÔ6öFRÇÂ""“°¢6öç7B6ÆVæF%w&—FRÒW&Âç6V&6…&×2ævWB‚&6ÆVæF%w&—FR"’ÓÒ##°¢6öç7BWF…W&ÂÒ'V–ÆDvöövÆTWF…W&Â‡6W76–öâÂ&ööÔ6öFRÇÂçVÆÂÂ²6ÆVæF%w&—FRÒ“°¢–b‚WF…W&Â’°¢6VæE&VF—&V7B‡&W2ÂG·&ööÔ6öFRò÷&ööÒòG·&ööÔ6öFWÖ¢"ò'ÓöW'&÷#ÖÖ—76–æuövöövÆUö7&VFVçF–Ç6“°¢&WGW&ã°¢Ð¢6VæE&VF—&V7B‡&W2ÂWF…W&Â“°¢&WGW&ã°¢Ð ¢–b‡W&ÂçF†æÖRÓÓÒ"öWF‚öÖ–7&÷6ögB"’°¢–b‡&WæÖWF†öBÓÒ$tUB"’°¢6VæDÖWF†öDæ÷DÆÆ÷vVB‡&W2Â²$tUB%Ò“°¢&WGW&ã°¢Ð¢–b‚Væf÷&6U&FTÆ–Ö—B‡&WÂ&W2Â&öWF‚ÖÖ–7&÷6ögB"Â#Â¢c¢’’&WGW&ã°¢6öç7B6W76–öâÒvWE6W76–öâ‡&WÂ&W2“°¢6öç7B&ööÔ6öFRÒæ÷&ÖÆ—¦U&ööÔ6öFR‡W&Âç6V&6…&×2ævWB‚'&ööÒ"’ÇÂ6W76–öâæÆ7E&ööÔ6öFRÇÂ""“°¢6öç7B6ÆVæF%w&—FRÒW&Âç6V&6…&×2ævWB‚&6ÆVæF%w&—FR"’ÓÓÒ##°¢6öç7BWF…W&ÂÒ'V–ÆDÖ–7&÷6ögDWF…W&Â‡6W76–öâÂ&ööÔ6öFRÇÂçVÆÂÂ²6ÆVæF%w&—FRÒ“°¢–b‚WF…W&Â’°¢6VæE&VF—&V7B‡&W2ÂG·&ööÔ6öFRò÷&ööÒòG·&ööÔ6öFWÖ¢"ò'ÓöW'&÷#ÖÖ—76–æuöÖ–7&÷6ögEö7&VFVçF–Ç6“°¢&WGW&ã°¢Ð¢6VæE&VF—&V7B‡&W2ÂWF…W&Â“°¢&WGW&ã°¢Ð ¢–b‡W&ÂçF†æÖRÓÓÒ"öWF‚övöövÆRö6ÆÆ&6²"’°¢–b‡&WæÖWF†öBÓÒ$tUB"’°¢6VæDÖWF†öDæ÷DÆÆ÷vVB‡&W2Â²$tUB%Ò“°¢&WGW&ã°¢Ð¢6öç7B6öFRÒW&Âç6V&6…&×2ævWB‚&6öFR"“°¢6öç7B7FFRÒW&Âç6V&6…&×2ævWB‚'7FFR"“°¢6öç7B&÷f–FW$W'&÷"ÒW&Âç6V&6…&×2ævWB‚&W'&÷""“°¢6öç7B7FFTFFÒ7FFRòöWF…7FFW2ævWB‡7FFR’¢çVÆÃ°¢6öç7B6W76–öä&Vf÷&U&÷FF–öâÒvWE6W76–öâ‡&WÂ&W2“°¢6öç7BfÆ–E7FFRÒ&ööÆVâ€¢7FFTFFb`¢7FFTFFç&÷f–FW"ÓÓÒ&vöövÆR"b`¢7FFTFFæW‡—&W4BâFFRææ÷r‚’b`¢7FFTFFç6W76–öä–BÓÓÒ6W76–öä&Vf÷&U&÷FF–öâæ–@¢“°¢–b‡7FFR’öWF…7FFW2æFVÆWFR‡7FFR“°¢6öç7B&WGW&åF‚Ò7FFTFFòç&ööÔ6öFRbbf–æE&ööÒ‡7FFTFFç&ööÔ6öFR¢ò÷&ööÒòG·7FFTFFç&ööÔ6öFWÖ ¢¢"ò#°¢–b‚fÆ–E7FFR’°¢6VæDvöövÆTöWF…&W7VÇB‡&W2Â7FFTFFÂ°¢gVÆÅvTÆö6F–öã¢G·&WGW&åF‡ÓöW'&÷#Ö–çfÆ–EööWF…÷7FFVÀ¢7FGW3¢&W'&÷""À¢W'&÷$6öFS¢&6ÆVæF%ö6öææV7F–öåöf–ÆVB ¢Ò“°¢&WGW&ã°¢Ð¢–b‚6öFRbb&÷f–FW$W'&÷"’°¢6VæDvöövÆTöWF…&W7VÇB‡&W2Â7FFTFFÂ°¢gVÆÅvTÆö6F–öã¢G·&WGW&åF‡ÓöW'&÷#Ö–çfÆ–EööWF…÷7FFVÀ¢7FGW3¢&W'&÷""À¢W'&÷$6öFS¢&6ÆVæF%ö6öææV7F–öåöf–ÆVB ¢Ò“°¢&WGW&ã°¢Ð¢–b‡&÷f–FW$W'&÷"’°¢6VæDvöövÆTöWF…&W7VÇB‡&W2Â7FFTFFÂ°¢gVÆÅvTÆö6F–öã¢G·&WGW&åF‡ÓöW'&÷#ÒG¶Væ6öFUU$”6ö×öæVçB‡&÷f–FW$W'&÷"—ÖÀ¢7FGW3¢&W'&÷""À¢W'&÷$6öFS¢&÷f–FW$W'&÷"ÓÓÒ&66W75öFVæ–VB"ò&66W75öFVæ–VB"¢'&÷f–FW%öW'&÷" ¢Ò“°¢&WGW&ã°¢Ð ¢G'’°¢6öç7BvöövÆUFö¶Vç2Òv—BW†6†ævT6öFTf÷%Fö¶Vç2†6öFR“°¢6öç7B&öf–ÆRÒv—BfWF6„vöövÆU&öf–ÆR†vöövÆUFö¶Vç2æ66W75÷Fö¶Vâ“°¢–b‚&öf–ÆSòæ–B’F‡&÷ræWrW'&÷"‚$6÷VÆBæ÷B&VB–÷W"vöövÆR&öf–ÆRâ"“°¢6öç7BW6W$–BÒ&W6öÇfU&÷f–FW%W6W$–B‡6W76–öä&Vf÷&U&÷FF–öâÂ&öf–ÆRÂ&vöövÆR"“°¢6öç7B6W76–öâÒ&÷FFU6W76–öâ‡6W76–öä&Vf÷&U&÷FF–öâÂ&W2“°¢6W76–öâçW6W$–BÒW6W$–C°¢6öç7BW6W%&V6÷&BÒ6WEW6W$vöövÆT6öææV7F–öâ‡W6W$–BÂ&öf–ÆRÂvöövÆUFö¶Vç2“°¢Æ–æµ6W76–öå'F–6—çG5FõW6W"‡6W76–öâÂW6W%&V6÷&B“°¢&÷vFUW6W$–FVçF—G•Fõ&öö×2‡W6W$–B“°¢–b‚6W76–öâçVæF–ætF—7Æ”æÖR’°¢6W76–öâçVæF–ætF—7Æ”æÖRÒW6W$F—7Æ”æÖR‡W6W%&V6÷&B’ÇÂ$wVW7B#°¢Ð ¢6öç7B&ööÔ6öFRÒ7FFTFFç&ööÔ6öFRÇÂ6W76–öâæÆ7E&ööÔ6öFRÇÂ"#°¢–b‡&ööÔ6öFRbb7F÷&Rç&öö×5·&ööÔ6öFUÒ’°¢6öç7B&ööÒÒ7F÷&Rç&öö×5·&ööÔ6öFUÓ°¢6W76–öâæÆ7E&ööÔ6öFRÒ&ööÔ6öFS°¢–b†—5&ööÔÆö6¶VB‡&ööÒ’bb6ä¦ö–äÆö6¶VE&ööÒ‡&ööÒÂ6W76–öâÂW6W%&V6÷&B’’°¢6öç7B&WVW7BÒW6W'D¦ö–å&WVW7B‡&ööÒÂ6W76–öâÂW6W%&V6÷&BÂ6W76–öâçVæF–ætF—7Æ”æÖRÂ&vöövÆR"“°¢æ÷F–g”†÷7G4öd¦ö–å&WVW7B‡&ööÒÂ&WVW7B“°¢&ööÒçWFFVDBÒæ÷t—6ò‚“°¢6fU7F÷&R‚“°¢6VæDvöövÆTöWF…&W7VÇB‡&W2Â7FFTFFÂ°¢gVÆÅvTÆö6F–öã¢÷&ööÒòG·&ööÔ6öFWÓ÷&WVW7C×6VçFÀ¢7FGW3¢'7V66W72 ¢Ò“°¢&WGW&ã°¢Ð¢6öç7B'F–6—çBÒVç7W&U'F–6—çB‡&ööÒÂ6W76–öâÂW6W%&V6÷&BÂ6W76–öâçVæF–ætF—7Æ”æÖR“°¢WFFU'F–6—çDg&öÕW6W"‡&ööÒÂ'F–6—çBÂW6W%&V6÷&B“°¢6WGFÆT¦ö–å&WVW7G4f÷$–FVçF—G’‡&ööÒÂ6W76–öâÂW6W%&V6÷&B“°¢–b‡&ööÒæ†÷7E6W76–öä–BÓÓÒ6W76–öâæ–Bbb&ööÒæ†÷7EW6W$–B’&ööÒæ†÷7EW6W$–BÒW6W$–C°¢6fU7F÷&R‚“°¢6VæDvöövÆTöWF…&W7VÇB‡&W2Â7FFTFFÂ°¢gVÆÅvTÆö6F–öã¢÷&ööÒòG·&ööÔ6öFWÓö6öææV7FVCÖvöövÆRG·7FFTFFæ6ÆVæF%w&—FRò"f6ÆVæF%w&—FSÓ"¢"'ÖÀ¢7FGW3¢'7V66W72 ¢Ò“°¢&WGW&ã°¢Ð ¢6fU7F÷&R‚“°¢6VæDvöövÆTöWF…&W7VÇB‡&W2Â7FFTFFÂ°¢gVÆÅvTÆö6F–öã¢óö6öææV7FVCÖvöövÆRG·7FFTFFæ6ÆVæF%w&—FRò"f6ÆVæF%w&—FSÓ"¢"'ÖÀ¢7FGW3¢'7V66W72 ¢Ò“°¢Ò6F6‚°¢6VæDvöövÆTöWF…&W7VÇB‡&W2Â7FFTFFÂ°¢gVÆÅvTÆö6F–öã¢G·&WGW&åF‡ÓöW'&÷#Ö6ÆVæF%ö6öææV7F–öåöf–ÆVFÀ¢7FGW3¢&W'&÷""À¢W'&÷$6öFS¢&6ÆVæF%ö6öææV7F–öåöf–ÆVB ¢Ò“°¢Ð¢&WGW&ã°¢Ð ¢–b‡W&ÂçF†æÖRÓÓÒ"öWF‚öÖ–7&÷6ögBö6ÆÆ&6²"’°¢–b‡&WæÖWF†öBÓÒ$tUB"’°¢6VæDÖWF†öDæ÷DÆÆ÷vVB‡&W2Â²$tUB%Ò“°¢&WGW&ã°¢Ð¢6öç7B6öFRÒW&Âç6V&6…&×2ævWB‚&6öFR"“°¢6öç7B7FFRÒW&Âç6V&6…&×2ævWB‚'7FFR"“°¢6öç7B&÷f–FW$W'&÷"ÒW&Âç6V&6…&×2ævWB‚&W'&÷""“°¢6öç7B7FFTFFÒ7FFRòöWF…7FFW2ævWB‡7FFR’¢çVÆÃ°¢6öç7B6W76–öä&Vf÷&U&÷FF–öâÒvWE6W76–öâ‡&WÂ&W2“°¢6öç7BfÆ–E7FFRÒ&ööÆVâ€¢7FFTFFb`¢7FFTFFç&÷f–FW"ÓÓÒ&Ö–7&÷6ögB"b`¢7FFTFFæW‡—&W4BâFFRææ÷r‚’b`¢7FFTFFç6W76–öä–BÓÓÒ6W76–öä&Vf÷&U&÷FF–öâæ–@¢“°¢–b‡7FFR’öWF…7FFW2æFVÆWFR‡7FFR“°¢6öç7B&WGW&åF‚Ò7FFTFFòç&ööÔ6öFRbbf–æE&ööÒ‡7FFTFFç&ööÔ6öFR¢ò÷&ööÒòG·7FFTFFç&ööÔ6öFWÖ ¢¢"ò#°¢–b‚fÆ–E7FFRÇÂ‚6öFRbb&÷f–FW$W'&÷"’’°¢6VæE&VF—&V7B‡&W2ÂG·&WGW&åF‡ÓöW'&÷#Ö–çfÆ–EööWF…÷7FFV“°¢&WGW&ã°¢Ð¢–b‡&÷f–FW$W'&÷"’°¢6VæE&VF—&V7B‡&W2ÂG·&WGW&åF‡ÓöW'&÷#ÒG¶Væ6öFUU$”6ö×öæVçB‡&÷f–FW$W'&÷"—Ö“°¢&WGW&ã°¢Ð ¢G'’°¢6öç7BÖ–7&÷6ögEFö¶Vç2Òv—BW†6†ævTÖ–7&÷6ögD6öFTf÷%Fö¶Vç2†6öFR“°¢6öç7B&öf–ÆRÒv—BfWF6„Ö–7&÷6ögE&öf–ÆR†Ö–7&÷6ögEFö¶Vç2æ66W75÷Fö¶Vâ“°¢–b‚&öf–ÆSòæ–B’F‡&÷ræWrW'&÷"‚$6÷VÆBæ÷B&VB–÷W"Ö–7&÷6ögB&öf–ÆRâ"“°¢6öç7BW6W$–BÒ&W6öÇfU&÷f–FW%W6W$–B‡6W76–öä&Vf÷&U&÷FF–öâÂ&öf–ÆRÂ&Ö–7&÷6ögB"“°¢6öç7B6W76–öâÒ&÷FFU6W76–öâ‡6W76–öä&Vf÷&U&÷FF–öâÂ&W2“°¢6W76–öâçW6W$–BÒW6W$–C°¢6öç7BW6W%&V6÷&BÒ6WEW6W$Ö–7&÷6ögD6öææV7F–öâ‡W6W$–BÂ&öf–ÆRÂÖ–7&÷6ögEFö¶Vç2“°¢Æ–æµ6W76–öå'F–6—çG5FõW6W"‡6W76–öâÂW6W%&V6÷&B“°¢&÷vFUW6W$–FVçF—G•Fõ&öö×2‡W6W$–B“°¢–b‚6W76–öâçVæF–ætF—7Æ”æÖR’°¢6W76–öâçVæF–ætF—7Æ”æÖRÒW6W$F—7Æ”æÖR‡W6W%&V6÷&B’ÇÂ$wVW7B#°¢Ð ¢6öç7B&ööÔ6öFRÒ7FFTFFç&ööÔ6öFRÇÂ6W76–öâæÆ7E&ööÔ6öFRÇÂ"#°¢–b‡&ööÔ6öFRbb7F÷&Rç&öö×5·&ööÔ6öFUÒ’°¢6öç7B&ööÒÒ7F÷&Rç&öö×5·&ööÔ6öFUÓ°¢6W76–öâæÆ7E&ööÔ6öFRÒ&ööÔ6öFS°¢–b†—5&ööÔÆö6¶VB‡&ööÒ’bb6ä¦ö–äÆö6¶VE&ööÒ‡&ööÒÂ6W76–öâÂW6W%&V6÷&B’’°¢6öç7B&WVW7BÒW6W'D¦ö–å&WVW7B‡&ööÒÂ6W76–öâÂW6W%&V6÷&BÂ6W76–öâçVæF–ætF—7Æ”æÖRÂ&Ö–7&÷6ögB"“°¢æ÷F–g”†÷7G4öd¦ö–å&WVW7B‡&ööÒÂ&WVW7B“°¢&ööÒçWFFVDBÒæ÷t—6ò‚“°¢6fU7F÷&R‚“°¢6VæE&VF—&V7B‡&W2Â÷&ööÒòG·&ööÔ6öFWÓ÷&WVW7C×6VçF“°¢&WGW&ã°¢Ð¢6öç7B'F–6—çBÒVç7W&U'F–6—çB‡&ööÒÂ6W76–öâÂW6W%&V6÷&BÂ6W76–öâçVæF–ætF—7Æ”æÖR“°¢WFFU'F–6—çDg&öÕW6W"‡&ööÒÂ'F–6—çBÂW6W%&V6÷&B“°¢6WGFÆT¦ö–å&WVW7G4f÷$–FVçF—G’‡&ööÒÂ6W76–öâÂW6W%&V6÷&B“°¢–b‡&ööÒæ†÷7E6W76–öä–BÓÓÒ6W76–öâæ–Bbb&ööÒæ†÷7EW6W$–B’&ööÒæ†÷7EW6W$–BÒW6W$–C°¢6fU7F÷&R‚“°¢6VæE&VF—&V7B€¢&W2À¢÷&ööÒòG·&ööÔ6öFWÓö6öææV7FVCÖÖ–7&÷6ögBG·7FFTFFæ6ÆVæF%w&—FRò"f6ÆVæF%w&—FSÓ"¢"'Ö ¢“°¢&WGW&ã°¢Ð ¢6fU7F÷&R‚“°¢6VæE&VF—&V7B‡&W2Âóö6öææV7FVCÖÖ–7&÷6ögBG·7FFTFFæ6ÆVæF%w&—FRò"f6ÆVæF%w&—FSÓ"¢"'Ö“°¢Ò6F6‚°¢6VæE&VF—&V7B‡&W2ÂG·&WGW&åF‡ÓöW'&÷#Ö6ÆVæF%ö6öææV7F–öåöf–ÆVF“°¢Ð¢&WGW&ã°¢Ð ¢–b‡W&ÂçF†æÖRç7F'G5v—F‚‚"ö’ò"’’°¢6VæD§6öâ‡&W2ÂCBÂ²W'&÷#¢$’&÷WFRæ÷Bf÷VæBâ"Ò“°¢&WGW&ã°¢Ð¢–b‡W&ÂçF†æÖRç7F'G5v—F‚‚"öWF‚ò"’’°¢6VæD§6öâ‡&W2ÂCBÂ²W'&÷#¢$WF†VçF–6F–öâ&÷WFRæ÷Bf÷VæBâ"Ò“°¢&WGW&ã°¢Ð ¢6W'fU7FF–2‡&WÂ&W2“°¢Ò6F6‚†W'&÷"’°¢6öç7B7FGW2ÒçVÖ&W"†W'&÷"ç7FGW2ÇÂS“°¢6öç7B6fU7FGW2Ò7FGW2ãÒCbb7FGW2Âcò7FGW2¢S°¢6öç7B–ÆöBÒ°¢W'&÷#¢6fU7FGW2ÂSÇÂ6fU7FGW2ÓÓÒS0¢òW'&÷"æÖW76vP¢¢%F†R6W'fW"6÷VÆBæ÷B6ö×ÆWFRF†—2&WVW7Bâ ¢Ó°¢–b‡G—VöbW'&÷"æ6öFRÓÓÒ'7G&–ær"bbõå¶×£Ó•õ×³ÃƒÒBòçFW7B†W'&÷"æ6öFR’’°¢–ÆöBæ6öFRÒW'&÷"æ6öFS°¢Ð¢–b†W'&÷"æFWF–Ç2bbG—VöbW'&÷"æFWF–Ç2ÓÓÒ&ö&¦V7B"’°¢–ÆöBæFWF–Ç2ÒW'&÷"æFWF–Ç3°¢Ð¢6VæD§6öâ‡&W2Â6fU7FGW2Â–ÆöB“°¢Ð§Ò“° §6W'fW"æÆ—7FVâ‡÷'BÂ†÷7BÂ‚’Óâ°¢6öç6öÆRæÆör†6öÖÖöäw&÷VæB'Vææ–ærB‡GG¢òöÆö6Æ†÷7C¢G·÷'GÖ“°¢6öç6öÆRæÆör†vöövÆR&VF—&V7BU$“¢G·&VF—&V7EW&—Ö“°§Ò“°