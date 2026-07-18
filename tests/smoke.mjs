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
const expectedParticipantPalette = [
  { name: "Bordeaux", value: "#743F45" },
  { name: "Merlot", value: "#6C4652" },
  { name: "Sienna", value: "#A36F52" },
  { name: "Cognac", value: "#A97952" },
  { name: "Gilded", value: "#B39458" },
  { name: "Verdant", value: "#777653" },
  { name: "Cashmere", value: "#83907B" },
  { name: "Sylvan", value: "#536B5E" },
  { name: "Aegean", value: "#496B70" },
  { name: "Sterling", value: "#65758A" },
  { name: "Nocturne", value: "#435267" },
  { name: "Amethyst", value: "#80768E" },
  { name: "Aubergine", value: "#665267" },
  { name: "Roselle", value: "#9A7275" },
  { name: "Truffle", value: "#8D8174" },
  { name: "Graphite", value: "#66635F" }
];
const expectedIconAssets = [
  "calendar-sync.svg", "circle-arrow-left.svg", "circle-arrow-right.svg",
  "circle-x.svg", "clock-4.svg", "link-2.svg", "lock-keyhole.svg",
  "lock-keyhole-open.svg", "map-pin.svg", "maximize-2.svg", "minimize-2.svg",
  "plus.svg", "refresh-cw.svg", "rotate-cw.svg", "settings.svg", "square.svg",
  "trash-2.svg", "user-round-plus.svg", "x.svg"
];

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

function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function splitCssList(value) {
  const entries = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === "(") depth += 1;
    if (character === ")") depth = Math.max(0, depth - 1);
    if (character === "," && depth === 0) {
      entries.push(value.slice(start, index).trim());
      start = index + 1;
    }
  }
  entries.push(value.slice(start).trim());
  return entries.filter(Boolean);
}

function assertCompositorOnlyMotion(css) {
  const source = stripCssComments(css);
  const transitions = [...source.matchAll(/(?:^|[;{])\s*(transition(?:-property)?)\s*:\s*([^;{}]+)/gim)];
  assert.ok(transitions.length > 0, "Expected at least one CSS transition declaration");
  for (const [, declaration, rawValue] of transitions) {
    const value = rawValue.replace(/\s*!important\s*$/i, "").trim();
    if (value === "none") continue;
    for (const entry of splitCssList(value)) {
      const property = entry.match(/^([\w-]+)/)?.[1];
      assert.ok(
        property === "transform" || property === "opacity",
        `${declaration} must animate only transform/opacity, received: ${rawValue.trim()}`
      );
    }
  }

  const willChangeDeclarations = [...source.matchAll(/(?:^|[;{])\s*will-change\s*:\s*([^;{}]+)/gim)];
  assert.ok(willChangeDeclarations.length > 0, "Expected compositor will-change declarations");
  for (const [, rawValue] of willChangeDeclarations) {
    const values = splitCssList(rawValue.replace(/\s*!important\s*$/i, "").trim());
    assert.ok(values.length > 0, "will-change must name a compositor property or reset to auto");
    for (const property of values) {
      assert.ok(
        property === "transform" || property === "opacity" || property === "auto",
        `will-change may only use transform, opacity, or auto; received: ${rawValue.trim()}`
      );
    }
  }
}

function keyframeBlocks(css) {
  const source = stripCssComments(css);
  const blocks = [];
  const keyframePattern = /@(?:-webkit-)?keyframes\s+([\w-]+)\s*\{/g;
  let match;
  while ((match = keyframePattern.exec(source))) {
    let depth = 1;
    let cursor = keyframePattern.lastIndex;
    while (cursor < source.length && depth > 0) {
      if (source[cursor] === "{") depth += 1;
      if (source[cursor] === "}") depth -= 1;
      cursor += 1;
    }
    assert.equal(depth, 0, `Unclosed @keyframes ${match[1]}`);
    blocks.push({ name: match[1], body: source.slice(keyframePattern.lastIndex, cursor - 1) });
    keyframePattern.lastIndex = cursor;
  }
  return blocks;
}

function assertTransformOpacityKeyframes(css) {
  const blocks = keyframeBlocks(css);
  assert.ok(blocks.length > 0, "Expected motion keyframes in the stylesheet");
  for (const block of blocks) {
    const declarations = [...block.body.matchAll(/(?:^|[;{])\s*([\w-]+)\s*:\s*([^;{}]+)/gm)];
    assert.ok(declarations.length > 0, `@keyframes ${block.name} has no declarations`);
    for (const [, property] of declarations) {
      assert.ok(
        property === "transform" || property === "opacity",
        `@keyframes ${block.name} may only animate transform/opacity, received: ${property}`
      );
    }
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
  assert.match(home.text, /class="ui-icon ui-icon-maximize" id="fullscreenIcon"/);
  assert.match(home.text, /composer-row-icon ui-icon ui-icon-clock/);
  assert.match(home.text, /button-with-icon[^>]*id="addEventButton"/);
  assert.match(
    home.text,
    /<div class="calendar-wrap">\s*<header class="room-topbar">/,
    "Room controls must live inside the calendar scroll flow"
  );
  assert.match(
    home.text,
    /<header class="room-topbar">[\s\S]*?<div class="calendar-toolbar">[\s\S]*?<div class="empty-room hidden" id="emptyRoomState">[\s\S]*?<div class="calendar-grid" id="calendarGrid"><\/div>\s*<footer class="legal-links calendar-legal-links"/,
    "Room controls, invite prompt, calendar, and legal links must share one scroll flow"
  );
  assert.match(
    home.text,
    /<div class="participants-rail" aria-hidden="true">\s*<span>Members<\/span>\s*<\/div>/,
    "The Members rail label must remain passive text"
  );
  assert.doesNotMatch(home.text, /<button[^>]*class="participants-rail"/);
  assert.doesNotMatch(home.text, /id="participantsRail"/);
  const eventComposerScript = await publicSession.request("/app.js", { accept: "text/javascript" });
  assert.match(eventComposerScript.text, /function setEventFormSaving\(saving\)/);
  assert.match(eventComposerScript.text, /setEventFormFeedback\(error\.message/);
  assert.match(eventComposerScript.text, /function updateFullscreenControl\(\)/);
  assert.match(eventComposerScript.text, /function setButtonLabelWithIcon\(button, label, iconClass\)/);
  assert.match(eventComposerScript.text, /function setPanelVisibility\(panel, visible/);
  assert.match(eventComposerScript.text, /function closeDialogWithMotion\(dialog, afterClose\)/);
  assert.match(eventComposerScript.text, /async function animateCalendarTransition\(renderAction\)/);
  assert.match(eventComposerScript.text, /function prefersReducedMotion\(\)/);
  assert.match(eventComposerScript.text, /const motionPressMs = 100;/);
  assert.match(eventComposerScript.text, /const motionFastMs = 150;/);
  assert.match(eventComposerScript.text, /const motionStandardMs = 250;/);
  assert.match(eventComposerScript.text, /const motionSlowMs = 350;/);
  assert.match(eventComposerScript.text, /const motionPageMs = 400;/);
  assert.match(eventComposerScript.text, /const panelMotionTimers = new WeakMap\(\);/);
  assert.match(eventComposerScript.text, /const dialogMotionTimers = new WeakMap\(\);/);
  assert.match(eventComposerScript.text, /const replayMotionStates = new WeakMap\(\);/);
  assert.match(
    eventComposerScript.text,
    /function resolvedCalendarRowHeight\(\) \{[\s\S]*?querySelector\("\.calendar-cell"\)\?\.getBoundingClientRect\(\)\.height[\s\S]*?Number\.isFinite\(renderedCellHeight\)/,
    "Drag-create geometry must use the rendered row height, including fullscreen calc/min tracks"
  );
  assert.match(
    eventComposerScript.text,
    /const previousState = nodeStates\.get\(className\);[\s\S]*?if \(previousState\?\.timer\) window\.clearTimeout\(previousState\.timer\);[\s\S]*?const token = Symbol\(className\);[\s\S]*?if \(nodeStates\.get\(className\)\?\.token !== token\) return;/,
    "Replayed motion must cancel stale timers and reject stale animation frames"
  );
  assert.match(
    eventComposerScript.text,
    /function prepareDialogForOpen\(dialog\) \{[\s\S]*?dialogMotionTimers\.get\(dialog\)[\s\S]*?window\.clearTimeout\(pendingTimer\)[\s\S]*?dialog\.classList\.remove\("is-closing"\)/,
    "Opening a dialog must cancel any pending close timer"
  );
  assert.match(
    eventComposerScript.text,
    /function closeDialogWithMotion\(dialog, afterClose\) \{[\s\S]*?dialogMotionTimers\.get\(dialog\) !== timer \|\| !dialog\.classList\.contains\("is-closing"\)[\s\S]*?dialogMotionTimers\.set\(dialog, timer\);/,
    "Dialog close completion must verify timer ownership and closing state"
  );
  assert.match(
    eventComposerScript.text,
    /function openCreateRoomModal\(\) \{[\s\S]*?prepareDialogForOpen\(createRoomModal\);[\s\S]*?createRoomModal\.showModal\(\);/
  );
  assert.match(
    eventComposerScript.text,
    /function openEventModal\([^)]*\) \{[\s\S]*?prepareDialogForOpen\(eventModal\);[\s\S]*?eventModal\.showModal\(\);/
  );
  assert.match(eventComposerScript.text, /let participantsDrawerGesture = null/);
  assert.match(eventComposerScript.text, /Math\.abs\(deltaX\) >= 32/);
  assert.doesNotMatch(eventComposerScript.text, /participantsRail\?\.addEventListener\("click"/);
  for (const option of expectedParticipantPalette) {
    assert.ok(
      eventComposerScript.text.includes(`{ value: "${option.value}", name: "${option.name}" }`),
      `${option.name} is missing from the participant colour picker`
    );
  }
  const eventComposerStyles = await publicSession.request("/styles.css", { accept: "text/css" });
  assert.match(eventComposerStyles.text, /\.composer-body textarea\s*\{[^}]*min-height: 48px[^}]*resize: none/s);
  assert.match(eventComposerStyles.text, /\.color-option-list\s*\{[^}]*max-height: calc\(100dvh - 96px\)/s);
  assert.match(eventComposerStyles.text, /\.ui-icon\s*\{[^}]*width: 18px[^}]*height: 18px/s);
  assert.match(eventComposerStyles.text, /--motion-press:\s*100ms;/);
  assert.match(eventComposerStyles.text, /--motion-fast:\s*150ms;/);
  assert.match(eventComposerStyles.text, /--motion-standard:\s*250ms;/);
  assert.match(eventComposerStyles.text, /--motion-slow:\s*350ms;/);
  assert.match(eventComposerStyles.text, /--motion-page:\s*400ms;/);
  assert.match(eventComposerStyles.text, /--ease-standard:\s*cubic-bezier\(0\.32, 0\.72, 0, 1\);/);
  assert.match(eventComposerStyles.text, /--ease-entrance:\s*cubic-bezier\(0\.25, 1, 0\.5, 1\);/);
  const approvedCurves = [
    "cubic-bezier(0.25,1,0.5,1)",
    "cubic-bezier(0.32,0.72,0,1)"
  ];
  const usedCurves = [...new Set(
    stripCssComments(eventComposerStyles.text)
      .match(/cubic-bezier\([^)]*\)/g)
      ?.map((curve) => curve.replace(/\s+/g, "")) || []
  )].sort();
  assert.deepEqual(usedCurves, approvedCurves, "Only the two approved motion curves may be used");
  assert.match(
    eventComposerStyles.text,
    /button:not\(:disabled\):active\s*\{[^}]*transition-duration:\s*var\(--motion-press\)[^}]*transform:\s*translate3d\(0, 0, 0\) scale\(0\.96\)/s,
    "Buttons must compress to scale(.96) on press"
  );
  assert.match(
    eventComposerStyles.text,
    /@keyframes modal-in\s*\{[\s\S]*?from\s*\{[^}]*opacity:\s*0[^}]*transform:\s*translate3d\(0, 10px, 0\) scale\(0\.9\)/,
    "Modal entrance must begin at scale(.90)"
  );
  assert.match(eventComposerStyles.text, /\.drag-create-preview::before\s*\{[^}]*height:\s*var\(--preview-base-height[^}]*transform:\s*scaleY\(var\(--preview-scale/s);
  assert.match(eventComposerStyles.text, /\.drag-create-preview-cap\s*\{[^}]*transform:\s*translate3d\(0, var\(--preview-bottom-y, 0px\), 0\)/s);
  assertCompositorOnlyMotion(eventComposerStyles.text);
  assertTransformOpacityKeyframes(eventComposerStyles.text);
  assert.match(eventComposerStyles.text, /\.modal\.is-closing \.modal-card/);
  assert.match(eventComposerStyles.text, /\.calendar-grid\.is-view-entering/);
  assert.match(eventComposerStyles.text, /\.event-composer\s*\{[^}]*max-height: calc\(100dvh - 12px\)[^}]*grid-template-rows: auto auto auto auto auto/s);
  assert.match(eventComposerStyles.text, /#eventModal\s*\{[^}]*width: 100vw[^}]*height: 100dvh[^}]*max-width: none[^}]*overflow: visible/s);
  assert.match(eventComposerStyles.text, /\.composer-body\s*\{[^}]*overflow: visible/s);
  assert.match(eventComposerStyles.text, /\.invite-dropdown-panel\s*\{[^}]*position: absolute[^}]*max-height: min\(220px, calc\(100dvh - 160px\)\)[^}]*overflow-y: auto/s);
  assert.match(eventComposerStyles.text, /@media \(max-height: 560px\)[\s\S]*?\.composer-sync-toggle small\s*\{[^}]*display: none/);
  assert.doesNotMatch(eventComposerStyles.text, /\.composer-body\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(eventComposerStyles.text, /\.calendar-legal-links\s*\{[^}]*position:\s*static[^}]*margin:\s*12px 12px 14px auto/s);
  assert.match(eventComposerStyles.text, /\.calendar-wrap > \.calendar-grid\s*\{[^}]*min-height:\s*calc\(100% \+ 1px\)/s);
  assert.match(eventComposerStyles.text, /\.room-page\s*\{[^}]*grid-template-rows:\s*minmax\(0, 1fr\)[^}]*overflow:\s*hidden/s);
  assert.match(eventComposerStyles.text, /\.room-topbar\s*\{[^}]*position:\s*relative[^}]*top:\s*auto[^}]*margin-bottom:\s*8px/s);
  assert.doesNotMatch(eventComposerStyles.text, /\.room-topbar\s*\{[^}]*position:\s*sticky/s);
  assert.match(eventComposerStyles.text, /\.calendar-stage\s*\{[^}]*grid-template-rows:\s*minmax\(0, 1fr\)[^}]*overflow:\s*hidden/s);
  assert.match(eventComposerStyles.text, /\.calendar-wrap\s*\{[^}]*grid-row:\s*1[^}]*overflow:\s*auto/s);
  assert.match(
    eventComposerStyles.text,
    /\.participants-sidebar\s*\{[^}]*overflow:\s*hidden[^}]*border:\s*1px solid var\(--line\)[^}]*border-radius:\s*0 22px 22px 0[^}]*box-shadow:\s*var\(--shadow\)[^}]*touch-action:\s*pan-y/s,
    "The participants drawer must own one unified outer surface"
  );
  assert.match(
    eventComposerStyles.text,
    /\.participants-card\s*\{[^}]*border:\s*0[^}]*border-radius:\s*0[^}]*background:\s*transparent[^}]*box-shadow:\s*none/s,
    "The participants card must not render a second surface"
  );
  assert.match(
    eventComposerStyles.text,
    /\.participants-rail\s*\{[^}]*border:\s*0[^}]*background:\s*transparent[^}]*cursor:\s*default[^}]*box-shadow:\s*none/s,
    "The Members label must be visually fused and non-interactive"
  );
  assert.match(eventComposerStyles.text, /\.participants-rail span\s*\{[^}]*pointer-events:\s*none/s);
  assert.doesNotMatch(eventComposerStyles.text, /\.participants-rail\[aria-expanded="true"\]/);
  assert.doesNotMatch(eventComposerStyles.text, /\.participants-rail:focus-visible/);
  assert.match(
    eventComposerStyles.text,
    /@media \(min-width: 900px\)[\s\S]*?\.calendar-grid\.week-view\s*\{[^}]*min-width:\s*0[^}]*minmax\(0, 1fr\)/
  );
  assert.match(eventComposerStyles.text, /@media \(prefers-reduced-motion: reduce\)[\s\S]*transition-duration: 1ms !important/);
  assert.doesNotMatch(eventComposerStyles.text, /transition:\s*all\b/);
  for (const iconAsset of expectedIconAssets) {
    const icon = await publicSession.request(`/icons/${iconAsset}`, { accept: "image/svg+xml" });
    assert.match(icon.text, /<svg[^>]*viewBox="0 0 24 24"/);
  }
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

  for (const { value: color } of expectedParticipantPalette) {
    const recolored = await host.request(`/api/rooms/${firstCode}/participants/${hostId}`, {
      method: "PATCH",
      body: { color }
    });
    assert.equal(recolored.payload.participant.color, color);
  }
  const migratedLegacyColor = await host.request(`/api/rooms/${firstCode}/participants/${hostId}`, {
    method: "PATCH",
    body: { color: "#2F6F9F" }
  });
  assert.equal(migratedLegacyColor.payload.participant.color, "#65758A");

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
