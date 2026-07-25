import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const runtimeDir = mkdtempSync(path.join(tmpdir(), "commonground-command-integration-"));
const databasePath = path.join(runtimeDir, "commonground.db");
const port = 45000 + Math.floor(Math.random() * 1000);
const baseUrl = `http://127.0.0.1:${port}`;

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

class BrowserSession {
  constructor() {
    this.cookie = "";
  }

  async request(pathname, options = {}) {
    const method = String(options.method || "GET").toUpperCase();
    const headers = new Headers(options.headers || {});
    headers.set("Accept", "application/json");
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
      redirect: "manual"
    });
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) this.cookie = setCookie.split(";", 1)[0];

    const text = await response.text();
    const payload = (response.headers.get("content-type") || "").includes("application/json") && text
      ? JSON.parse(text)
      : text;
    const expectedStatuses = Array.isArray(options.expected)
      ? options.expected
      : [options.expected ?? 200];
    assert.ok(
      expectedStatuses.includes(response.status),
      `${method} ${pathname} returned ${response.status}: ${text}`
    );
    return { response, payload, text };
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
      // The server has not started listening yet.
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

function inviteeIds(event) {
  return (event.invitees || []).map((invitee) => invitee.participantId).sort();
}

let server;

try {
  server = await startServer();

  const host = new BrowserSession();
  const guest = new BrowserSession();
  const outsider = new BrowserSession();

  await Promise.all([
    host.request("/api/me"),
    guest.request("/api/me"),
    outsider.request("/api/me")
  ]);

  const createdRoom = await host.request("/api/rooms", {
    method: "POST",
    expected: 201,
    body: {
      name: "Command integration room",
      displayName: "Host"
    }
  });
  const roomCode = createdRoom.payload.room.code;
  const hostId = createdRoom.payload.participant.id;

  const joinedGuest = await guest.request(`/api/rooms/${roomCode}/join`, {
    method: "POST",
    body: { displayName: "Guest" }
  });
  const guestId = joinedGuest.payload.participant.id;
  const expectedInviteeIds = [guestId, hostId].sort();

  const beforeOutsiderRequest = await host.request(`/api/rooms/${roomCode}`);
  assert.equal(beforeOutsiderRequest.payload.room.participants.length, 2);

  const outsiderCreate = await outsider.request(
    `/api/rooms/${roomCode}/command-centre/create-event`,
    {
      method: "POST",
      expected: 403,
      body: {
        title: "Unauthorised event",
        start: "2030-01-15T08:00:00.000Z",
        end: "2030-01-15T09:00:00.000Z",
        timezone: "UTC",
        inviteeParticipantIds: [hostId]
      }
    }
  );
  assert.match(outsiderCreate.payload.error, /join this room/i);

  const afterOutsiderRequest = await host.request(`/api/rooms/${roomCode}`);
  assert.equal(
    afterOutsiderRequest.payload.room.participants.length,
    2,
    "A rejected Command Centre call must not silently create room membership"
  );
  assert.equal(afterOutsiderRequest.payload.room.events.length, 0);

  const unknownParticipant = await host.request(
    `/api/rooms/${roomCode}/command-centre/create-event`,
    {
      method: "POST",
      expected: 403,
      body: {
        title: "Invalid invitee",
        start: "2030-01-15T08:00:00.000Z",
        end: "2030-01-15T09:00:00.000Z",
        timezone: "UTC",
        inviteeParticipantIds: ["participant-not-in-room"]
      }
    }
  );
  assert.equal(unknownParticipant.payload.code, "participant_access_denied");

  const blockingEvent = await host.request(`/api/rooms/${roomCode}/events`, {
    method: "POST",
    expected: 201,
    body: {
      title: "Existing commitment",
      start: "2030-01-15T10:00:00.000Z",
      end: "2030-01-15T11:00:00.000Z",
      timezone: "UTC",
      location: "Private",
      description: "Must not leak through a conflict response",
      inviteeParticipantIds: [hostId, guestId],
      syncToGoogle: false
    }
  });
  assert.deepEqual(inviteeIds(blockingEvent.payload.event), expectedInviteeIds);

  const conflict = await host.request(
    `/api/rooms/${roomCode}/command-centre/create-event`,
    {
      method: "POST",
      expected: 409,
      body: {
        title: "Overlapping command event",
        start: "2030-01-15T10:30:00.000Z",
        end: "2030-01-15T11:30:00.000Z",
        timezone: "UTC",
        location: "Meeting room",
        description: "Should never be saved",
        inviteeParticipantIds: [hostId, guestId],
        syncToGoogle: false
      }
    }
  );
  assert.equal(conflict.payload.code, "availability_conflict");
  assert.deepEqual(
    [...(conflict.payload.details?.conflictingParticipantIds || [])].sort(),
    expectedInviteeIds
  );
  assert.ok(!("title" in conflict.payload), "Conflict responses must not expose event titles");
  assert.ok(!("location" in conflict.payload), "Conflict responses must not expose event locations");
  assert.ok(!("description" in conflict.payload), "Conflict responses must not expose event descriptions");

  const afterConflict = await host.request(`/api/rooms/${roomCode}`);
  assert.equal(
    afterConflict.payload.room.events.length,
    1,
    "Conflict revalidation must happen before an event is written"
  );

  const confirmedCreate = await host.request(
    `/api/rooms/${roomCode}/command-centre/create-event`,
    {
      method: "POST",
      expected: 201,
      body: {
        title: "Planning session",
        start: "2030-01-15T12:00:00.000Z",
        end: "2030-01-15T13:00:00.000Z",
        timezone: "UTC",
        location: "Library",
        description: "Bring the project outline",
        inviteeParticipantIds: [guestId, hostId],
        syncToGoogle: false
      }
    }
  );
  const createdEvent = confirmedCreate.payload.event;
  assert.equal(createdEvent.title, "Planning session");
  assert.equal(createdEvent.location, "Library");
  assert.equal(createdEvent.description, "Bring the project outline");
  assert.equal(createdEvent.start, "2030-01-15T12:00:00.000Z");
  assert.equal(createdEvent.end, "2030-01-15T13:00:00.000Z");
  assert.deepEqual(inviteeIds(createdEvent), expectedInviteeIds);

  const forbiddenGuestMove = await guest.request(
    `/api/rooms/${roomCode}/command-centre/move-event`,
    {
      method: "POST",
      expected: 403,
      body: {
        eventId: createdEvent.id,
        expectedUpdatedAt: createdEvent.updatedAt,
        start: "2030-01-15T13:00:00.000Z",
        end: "2030-01-15T14:00:00.000Z",
        timezone: "UTC"
      }
    }
  );
  assert.match(forbiddenGuestMove.payload.error, /cannot move/i);

  // Ensure updatedAt changes even on filesystems/runtimes with millisecond timestamps.
  await delay(10);
  const confirmedMove = await host.request(
    `/api/rooms/${roomCode}/command-centre/move-event`,
    {
      method: "POST",
      body: {
        eventId: createdEvent.id,
        expectedUpdatedAt: createdEvent.updatedAt,
        start: "2030-01-15T14:00:00.000Z",
        end: "2030-01-15T15:00:00.000Z",
        timezone: "UTC"
      }
    }
  );
  const movedEvent = confirmedMove.payload.event;
  assert.equal(movedEvent.start, "2030-01-15T14:00:00.000Z");
  assert.equal(movedEvent.end, "2030-01-15T15:00:00.000Z");
  assert.notEqual(movedEvent.updatedAt, createdEvent.updatedAt);
  assert.equal(movedEvent.title, createdEvent.title);
  assert.equal(movedEvent.location, createdEvent.location);
  assert.equal(movedEvent.description, createdEvent.description);
  assert.deepEqual(inviteeIds(movedEvent), expectedInviteeIds);

  const staleMove = await host.request(
    `/api/rooms/${roomCode}/command-centre/move-event`,
    {
      method: "POST",
      expected: 409,
      body: {
        eventId: createdEvent.id,
        expectedUpdatedAt: createdEvent.updatedAt,
        start: "2030-01-15T16:00:00.000Z",
        end: "2030-01-15T17:00:00.000Z",
        timezone: "UTC"
      }
    }
  );
  assert.equal(staleMove.payload.code, "event_changed");

  const finalRoom = await host.request(`/api/rooms/${roomCode}`);
  const finalEvent = finalRoom.payload.room.events.find((event) => event.id === createdEvent.id);
  assert.ok(finalEvent, "The moved event must remain in the room");
  assert.equal(finalEvent.start, movedEvent.start);
  assert.equal(finalEvent.end, movedEvent.end);
  assert.equal(finalEvent.title, "Planning session");
  assert.equal(finalEvent.location, "Library");
  assert.equal(finalEvent.description, "Bring the project outline");
  assert.deepEqual(inviteeIds(finalEvent), expectedInviteeIds);
  assert.equal(finalRoom.payload.room.events.length, 2);

  console.log("CommonGround Command Centre integration checks passed.");
} catch (error) {
  console.error(error.stack || error.message || error);
  if (server) console.error(server.logs());
  process.exitCode = 1;
} finally {
  await stopServer(server);
  rmSync(runtimeDir, { recursive: true, force: true });
}
