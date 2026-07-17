import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const runtimeDir = mkdtempSync(path.join(tmpdir(), "commonground-smoke-"));
const databasePath = path.join(runtimeDir, "commonground.db");
const port = 44000 + Math.floor(Math.random() * 1000);
const baseUrl = `http://127.0.0.1:${port}`;

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

class BrowserSession {
  constructor() {
    this.cookie = "";
  }

  async request(pathname, options = {}) {
    const method = String(options.method || "GET").toUpperCase();
    const headers = new Headers(options.headers || {});
    headers.set("Accept", options.accept || "application/json");
    if (this.cookie) headers.set("Cookie", this.cookie);
    if (!["GET", "HEAD", "OPTIONS"].includes(method)) headers.set("Origin", baseUrl);

    let body;
    if (options.body !== undefined) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.body);
    }

    const response = await fetch(`${baseUrl}${pathname}`, {
      method,
      headers,
      body,
      redirect: options.redirect || "manual"
    });

    const setCookie = response.headers.get("set-cookie");
    if (setCookie) this.cookie = setCookie.split(";", 1)[0];

    const text = await response.text();
    let payload = text;
    if ((response.headers.get("content-type") || "").includes("application/json") && text) {
      payload = JSON.parse(text);
    }

    const expected = Array.isArray(options.expected)
      ? options.expected
      : [options.expected ?? 200];
    assert.ok(
      expected.includes(response.status),
      `${method} ${pathname} returned ${response.status}: ${text}`
    );

    return { response, payload, text };
  }
}

function assertNoKeys(value, prohibitedKeys, trail = "response") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoKeys(entry, prohibitedKeys, `${trail}[${index}]`));
    return;
  }
  for (const [key, entry] of Object.entries(value)) {
    assert.ok(!prohibitedKeys.has(key), `${trail} unexpectedly exposed ${key}`);
    assertNoKeys(entry, prohibitedKeys, `${trail}.${key}`);
  }
}

async function startServer() {
  let stdout = "";
  let stderr = "";
  const child = spawn(process.execPath, ["server.js"], {
    cwd: rootDir,
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: String(port),
      PUBLIC_BASE_URL: baseUrl,
      DATABASE_PATH: databasePath,
      DATA_DIR: runtimeDir,
      NODE_ENV: "test"
    },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });

  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });

  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`Server exited during startup.\n${stdout}\n${stderr}`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/config`);
      if (response.ok) return { child, logs: () => `${stdout}\n${stderr}` };
    } catch {
      // The listener is not ready yet.
    }
    await delay(50);
  }
  child.kill();
  throw new Error(`Server did not become ready.\n${stdout}\n${stderr}`);
}

async function stopServer(server) {
  if (!server?.child || server.child.exitCode !== null) return;
  server.child.kill();
  await Promise.race([
    new Promise((resolve) => server.child.once("exit", resolve)),
    delay(2000)
  ]);
}

let server;

try {
  server = await startServer();

  const publicSession = new BrowserSession();
  const home = await publicSession.request("/", { accept: "text/html" });
  assert.match(home.text, /CommonGround/);
  assert.match(home.text, /id="googleEventSyncToggle" type="checkbox" checked/);
  assert.match(home.text, /id="eventForm"/);
  assert.doesNotMatch(home.text, /id="eventForm" method="dialog"/);
  assert.match(home.text, /id="eventFormFeedback" role="status" aria-live="polite"/);
  const eventComposerScript = await publicSession.request("/app.js", { accept: "text/javascript" });
  assert.match(eventComposerScript.text, /function setEventFormSaving\(saving\)/);
  assert.match(eventComposerScript.text, /setEventFormFeedback\(error\.message/);
  const eventComposerStyles = await publicSession.request("/styles.css", { accept: "text/css" });
  assert.match(eventComposerStyles.text, /grid-template-rows: auto auto minmax\(0, 1fr\) auto auto/);
  assert.match(eventComposerStyles.text, /\.composer-body textarea\s*\{[^}]*min-height: 72px/s);
  const contentSecurityPolicy = home.response.headers.get("content-security-policy");
  assert.ok(contentSecurityPolicy, "CSP header is missing");
  assert.doesNotMatch(contentSecurityPolicy, /script-src[^;]*'unsafe-inline'/);
  assert.equal(home.response.headers.get("x-content-type-options"), "nosniff");
  assert.ok(home.response.headers.get("referrer-policy"), "Referrer-Policy header is missing");
  await publicSession.request("/privacy", { accept: "text/html" });
  await publicSession.request("/terms", { accept: "text/html" });
  await publicSession.request("/api/me", { method: "POST", expected: 405 });

  const host = new BrowserSession();
  const guest = new BrowserSession();
  const spectator = new BrowserSession();
  await host.request("/api/me");
  await guest.request("/api/me");
  await spectator.request("/api/me");

  const created = await host.request("/api/rooms", {
    method: "POST",
    expected: 201,
    body: { name: "Decagon", emoji: "🧭", displayName: "Host" }
  });
  const firstCode = created.payload.room.code;
  assert.match(firstCode, /^[A-HJ-NP-Z2-9]{6}$/);
  assert.equal(created.payload.room.emoji, "🧭");
  assert.equal(created.payload.isHost, true);

  const secondRoom = await host.request("/api/rooms", {
    method: "POST",
    expected: 201,
    body: { name: "Second room", emoji: "🎒", displayName: "Host" }
  });
  assert.notEqual(secondRoom.payload.room.code, firstCode);
  const memberships = await host.request("/api/my-rooms");
  assert.equal(memberships.payload.rooms.length, 2);
  assert.ok(memberships.payload.rooms.some((room) => room.code === firstCode && room.emoji === "🧭"));

  const joined = await guest.request(`/api/rooms/${firstCode.toLowerCase()}/join`, {
    method: "POST",
    body: { displayName: "Guest <img src=x onerror=alert(1)>" }
  });
  assert.equal(joined.payload.room.code, firstCode);
  const guestId = joined.payload.participant.id;

  const spectatorJoin = await spectator.request(`/api/rooms/${firstCode}/join`, {
    method: "POST",
    body: { displayName: "Spectator" }
  });
  const spectatorId = spectatorJoin.payload.participant.id;

  const hostRoom = await host.request(`/api/rooms/${firstCode}`);
  const hostId = hostRoom.payload.participant.id;
  assert.equal(hostRoom.payload.room.participants.length, 3);
  assertNoKeys(hostRoom.payload, new Set(["userId", "ownerEmail", "tokens", "googleTokens", "microsoftTokens"]));

  await guest.request(`/api/rooms/${firstCode}`, {
    method: "PATCH",
    expected: 403,
    body: { name: "Not allowed" }
  });

  const start = "2026-07-20T10:00:00.000Z";
  const end = "2026-07-20T10:30:00.000Z";
  const createdEvent = await host.request(`/api/rooms/${firstCode}/events`, {
    method: "POST",
    expected: 201,
    body: {
      title: "",
      start,
      end,
      timezone: "Asia/Kolkata",
      location: "Cafe",
      description: "Room-visible proposal",
      inviteeParticipantIds: [hostId, guestId],
      syncToGoogle: false
    }
  });
  const eventId = createdEvent.payload.event.id;
  assert.equal(createdEvent.payload.event.title, "(No title)");
  assert.equal(createdEvent.payload.event.timezone, "Asia/Kolkata");
  assertNoKeys(createdEvent.payload, new Set(["googleCalendarSync", "outlookCalendarSync", "ownerEmail", "userId"]));

  const allDayStart = "2026-07-19T18:30:00.000Z";
  const allDayEnd = "2026-07-20T18:30:00.000Z";
  const allDayEvent = await host.request(`/api/rooms/${firstCode}/events`, {
    method: "POST",
    expected: 201,
    body: {
      title: "Local all-day plan",
      start: allDayStart,
      end: allDayEnd,
      timezone: "Asia/Kolkata",
      allDay: true,
      inviteeParticipantIds: [hostId]
    }
  });
  assert.equal(allDayEvent.payload.event.date, "2026-07-20");
  assert.equal(allDayEvent.payload.event.allDay, true);

  const preservedAllDayEvent = await host.request(`/api/rooms/${firstCode}/events/${allDayEvent.payload.event.id}`, {
    method: "PATCH",
    body: {
      title: "Renamed all-day plan",
      start: allDayStart,
      end: allDayEnd,
      inviteeParticipantIds: [hostId]
    }
  });
  assert.equal(preservedAllDayEvent.payload.event.timezone, "Asia/Kolkata");
  assert.equal(preservedAllDayEvent.payload.event.date, "2026-07-20");
  assert.equal(preservedAllDayEvent.payload.event.allDay, true);
  const allDayIcs = await host.request(
    `/api/rooms/${firstCode}/events/${allDayEvent.payload.event.id}/ics`,
    { accept: "text/calendar" }
  );
  assert.match(allDayIcs.text, /DTSTART;VALUE=DATE:20260720/);
  assert.match(allDayIcs.text, /DTEND;VALUE=DATE:20260721/);

  const guestInviteNotifications = await guest.request("/api/notifications");
  assert.ok(guestInviteNotifications.payload.notifications.some((item) => item.type === "event_invite"));

  const spectatorRoom = await spectator.request(`/api/rooms/${firstCode}`);
  const spectatorEvent = spectatorRoom.payload.room.events.find((event) => event.id === eventId);
  assert.equal(spectatorEvent.title, "(No title)");
  assert.equal(spectatorEvent.isInvited, false);
  await spectator.request(`/api/rooms/${firstCode}/events/${eventId}/respond`, {
    method: "POST",
    expected: 403,
    body: { response: "yes" }
  });

  const vote = await guest.request(`/api/rooms/${firstCode}/events/${eventId}/respond`, {
    method: "POST",
    body: { response: "yes" }
  });
  assert.equal(vote.payload.event.responseSummary.yes, 1);

  await guest.request(`/api/rooms/${firstCode}/events/${eventId}/comments`, {
    method: "POST",
    expected: 201,
    body: { text: "<img id=xss src=x onerror=alert(1)> Looks good" }
  });

  await guest.request(`/api/rooms/${firstCode}/events/${eventId}/respond`, {
    method: "POST",
    expected: [200, 400, 422],
    body: {
      response: "yes",
      proposedStart: "2026-07-20T12:00:00.000Z",
      proposedEnd: "2026-07-20T13:00:00.000Z"
    }
  });
  const unchangedRoom = await host.request(`/api/rooms/${firstCode}`);
  const unchangedEvent = unchangedRoom.payload.room.events.find((event) => event.id === eventId);
  assert.equal(unchangedEvent.start, start);
  assert.equal(unchangedEvent.end, end);

  const freeBusy = await host.request(
    `/api/rooms/${firstCode}/freebusy?timeMin=2026-07-20T00:00:00.000Z&timeMax=2026-07-21T00:00:00.000Z`
  );
  assertNoKeys(freeBusy.payload, new Set([
    "userId",
    "ownerEmail",
    "title",
    "location",
    "description",
    "googleCalendarSync",
    "outlookCalendarSync"
  ]));

  await stopServer(server);
  server = await startServer();
  const persistedRoom = await host.request(`/api/rooms/${firstCode}`);
  assert.ok(persistedRoom.payload.room.events.some((event) => event.id === eventId));

  const refreshed = await host.request(`/api/rooms/${firstCode}/refresh-code`, {
    method: "POST"
  });
  const refreshedCode = refreshed.payload.room.code;
  assert.match(refreshedCode, /^[A-HJ-NP-Z2-9]{6}$/);
  assert.notEqual(refreshedCode, firstCode);
  await publicSession.request(`/api/rooms/${firstCode}`, { expected: 404 });

  const migratedNotifications = await guest.request("/api/notifications");
  assert.ok(
    migratedNotifications.payload.notifications
      .filter((item) => item.eventId === eventId)
      .every((item) => item.roomCode === refreshedCode),
    "Event notifications were not migrated to the refreshed room code"
  );

  await host.request(`/api/rooms/${refreshedCode}`, { method: "DELETE" });
  const afterDeleteRooms = await guest.request("/api/my-rooms");
  assert.ok(!afterDeleteRooms.payload.rooms.some((room) => room.code === refreshedCode));
  const afterDeleteNotifications = await guest.request("/api/notifications");
  assert.ok(!afterDeleteNotifications.payload.notifications.some((item) => item.roomCode === refreshedCode));

  console.log("CommonGround smoke checks passed.");
} catch (error) {
  console.error(error.stack || error.message || error);
  if (server) console.error(server.logs());
  process.exitCode = 1;
} finally {
  await stopServer(server);
  rmSync(runtimeDir, { recursive: true, force: true });
}
