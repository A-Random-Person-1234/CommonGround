import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const runtimeDir = mkdtempSync(path.join(tmpdir(), "commonground-smoke-"));
const databasePath = path.join(runtimeDir, "commonground.db");
const port = 44000 + Math.floor(Math.random() * 1000);
const baseUrl = `http://127.0.0.1:${port}`;
const serverSource = readFileSync(path.join(rootDir, "server.js"), "utf8");
const commandParserSource = readFileSync(path.join(rootDir, "command-centre-parser.js"), "utf8");
const commandSchedulingSource = readFileSync(path.join(rootDir, "command-centre-scheduling.js"), "utf8");
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
  "move-vertical.svg", "plus.svg", "refresh-cw.svg", "rotate-cw.svg", "settings.svg", "square.svg",
  "trash-2.svg", "user-round-plus.svg", "x.svg"
];
const expectedWeatherIconAssets = [
  "sun.svg",
  "cloud-sun.svg",
  "cloudy.svg",
  "cloud-drizzle.svg",
  "cloud-lightning.svg",
  "snowflake.svg",
  "wind.svg",
  "thermometer-sun.svg",
  "thermometer-snowflake.svg"
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

function assertInOrder(source, expectedFragments, message) {
  let cursor = -1;
  for (const fragment of expectedFragments) {
    const nextIndex = source.indexOf(fragment, cursor + 1);
    assert.ok(nextIndex > cursor, `${message}: expected ${fragment}`);
    cursor = nextIndex;
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
      GOOGLE_CLIENT_ID: "commonground-smoke-client",
      GOOGLE_CLIENT_SECRET: "commonground-smoke-secret",
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
  const publicConfig = await publicSession.request("/api/config");
  assert.equal(publicConfig.payload.placesReady, false);
  assert.equal(publicConfig.payload.weatherReady, false);
  assert.ok(!("googleMapsApiKey" in publicConfig.payload));
  assert.doesNotMatch(home.text, /AIza[0-9A-Za-z_-]{20,}/, "Public HTML must never contain a Google Maps API key");
  assert.match(home.text, /CommonGround/);
  assert.match(home.text, /href="\/styles\.css\?v=20260804-topbar-identity"/);
  assert.match(home.text, /src="\/date-picker\.js\?v=20260726-shared-date-picker"/);
  assert.match(home.text, /src="\/app\.js\?v=20260804-hourly-weather"/);
  assert.match(home.text, /src="\/command-centre-actions\.js\?v=20260726-assistant-upgrade"/);
  assert.match(home.text, /src="\/command-centre\.js\?v=20260726-assistant-input-reset"/);
  assertInOrder(
    home.text,
    [
      'src="/date-picker.js?v=20260726-shared-date-picker"',
      'src="/app.js?v=20260804-weather-clickoff"'
    ],
    "The shared date-picker controller must load before the app controller"
  );
  assert.doesNotMatch(home.text, /id="roomStatus"|sidebar-room-status/);
  assert.match(
    home.text,
    /id="weatherAttribution" translate="no" hidden>Source: Includes weather data from Google<\/span>/,
    "Displayed forecasts must have the required Google Weather attribution nearby"
  );
  assert.match(home.text, /id="weatherHighLowTooltip"[^>]*role="tooltip"[^>]*aria-hidden="true"/);
  assert.match(
    home.text,
    /id="weatherHourlyPopover"[^>]*popover="auto"[^>]*role="dialog"[\s\S]*?id="weatherHourlyList"[\s\S]*?Source: Includes weather data from Google/,
    "The hourly weather popover needs a top-layer dialog, list, and nearby attribution"
  );
  assert.match(home.text, /<script src="\/site-guard\.js\?v=20260724-contextmenu" defer><\/script>/);
  assert.match(home.text, /<meta name="theme-color" content="#101c31" \/>/);
  assert.match(home.text, /<link rel="icon" href="\/icons\/favicon\.ico\?v=20260724-appicon-new" sizes="any" \/>/);
  assert.match(home.text, /<link rel="icon" type="image\/png" sizes="32x32" href="\/icons\/favicon-32\.png\?v=20260724-appicon-new" \/>/);
  assert.match(home.text, /<link rel="icon" type="image\/png" sizes="16x16" href="\/icons\/favicon-16\.png\?v=20260724-appicon-new" \/>/);
  assert.match(home.text, /<link rel="apple-touch-icon" sizes="180x180" href="\/icons\/apple-touch-icon\.png\?v=20260724-appicon-new" \/>/);
  assert.match(home.text, /<link rel="manifest" href="\/site\.webmanifest\?v=20260724-appicon-new" \/>/);
  assert.equal(
    (home.text.match(/src="\/icons\/icon-192\.png\?v=20260724-appicon-new"/g) || []).length,
    4,
    "Every home, room-entry, calendar, and sidebar product lockup must use the new CommonGround icon"
  );
  assert.match(
    home.text,
    /<div class="calendar-product" aria-label="CommonGround calendar">[\s\S]*?<img class="calendar-product-mark app-brand-icon"[\s\S]*?<span class="calendar-product-name">CommonGround<\/span>/,
    "The calendar shell must use the CommonGround product lockup"
  );
  assert.doesNotMatch(home.text, /Free\/busy only\. No private event titles, locations, or descriptions\./);
  assert.doesNotMatch(home.text, /class="privacy-note"/);
  assert.match(home.text, /id="joinRoomCode"[^>]*aria-label="Room code"/);
  assert.doesNotMatch(home.text, /Six-character room code/);
  assert.doesNotMatch(home.text, /Letters and numbers; uppercase or lowercase both work\./);
  assert.match(home.text, /id="googleEventSyncToggle" type="checkbox" checked/);
  assert.equal((home.text.match(/class="emoji-trigger"/g) || []).length, 3, "Every room emoji control needs a picker trigger");
  for (const [inputId, triggerId] of [
    ["createRoomEmoji", "createRoomEmojiTrigger"],
    ["renameRoomEmojiInput", "renameRoomEmojiTrigger"],
    ["quickRoomEmojiInput", "quickRoomEmojiTrigger"]
  ]) {
    assert.match(home.text, new RegExp(`id="${inputId}"[^>]*type="hidden"`));
    assert.match(
      home.text,
      new RegExp(`id="${triggerId}"[^>]*type="button"[^>]*data-emoji-target="${inputId}"[^>]*aria-haspopup="dialog"[^>]*aria-controls="emojiPickerPopover"[^>]*aria-expanded="false"`)
    );
  }
  assert.doesNotMatch(home.text, /id="roomEmojiOptions"|<datalist|\blist="roomEmojiOptions"/);
  assert.match(home.text, /id="emojiPickerPopover" popover="manual" role="dialog" aria-labelledby="emojiPickerTitle"/);
  assert.match(home.text, /id="emojiPickerSearch" type="search" placeholder="Search emoji\.\.\."[^>]*aria-controls="emojiPickerGrid"/);
  assert.match(home.text, /id="emojiPickerGrid" role="group" aria-label="Emoji results"/);
  assert.match(home.text, /id="emojiPickerStatus" role="status" aria-live="polite"/);
  const staticDateInputIds = [
    "detailDateInput",
    "eventDateInput",
    "eventEndDateInput"
  ];
  for (const inputId of staticDateInputIds) {
    assert.match(
      home.text,
      new RegExp(`id="${inputId}"\\s+type="date"`),
      `${inputId} must retain native date-input semantics beneath the shared picker`
    );
  }
  assert.equal(
    (home.text.match(/type="date"/g) || []).length,
    staticDateInputIds.length,
    "The static shell must expose exactly three canonical date inputs"
  );
  assert.match(home.text, /<dialog class="modal time-picker-surface" id="eventModal" aria-labelledby="eventComposerTitle">/);
  const eventModalStart = home.text.indexOf('<dialog class="modal time-picker-surface" id="eventModal"');
  const eventModalEnd = home.text.indexOf("</dialog>", eventModalStart);
  assert.ok(eventModalStart >= 0 && eventModalEnd > eventModalStart, "Event composer dialog markup is incomplete");
  const eventModalMarkup = home.text.slice(eventModalStart, eventModalEnd);
  assert.match(eventModalMarkup, /<form class="modal-card event-composer" id="eventForm">/);
  assert.doesNotMatch(eventModalMarkup, /<form[^>]*id="eventForm"[^>]*method="dialog"/);
  assert.match(eventModalMarkup, /<h2 class="sr-only" id="eventComposerTitle">Create a group event<\/h2>/);
  assert.doesNotMatch(home.text, /\sautofocus(?:\s|\/?>)/i, "Text fields must not receive a caret before deliberate user focus");
  assert.doesNotMatch(eventModalMarkup, /composer-handle/, "The event composer must not show the decorative menu lines");
  assert.doesNotMatch(eventModalMarkup, /event-composer-top/, "The title must not be pushed down by an empty top row");
  assert.match(
    eventModalMarkup,
    /<header class="composer-heading-section">\s*<button class="icon-button composer-close" id="cancelEventButton"[\s\S]*?<\/button>\s*<input class="composer-title" id="eventTitleInput"/,
    "The close button must overlay the heading instead of occupying a separate row"
  );
  assert.match(eventModalMarkup, /<section class="composer-section composer-schedule-section" aria-label="Date and time">/);
  assert.match(eventModalMarkup, /<section class="composer-section composer-meta-section" aria-label="Event options">/);
  assert.match(eventModalMarkup, /id="eventStartInput" type="hidden"/);
  assert.match(eventModalMarkup, /id="eventEndInput" type="hidden"/);
  assert.match(
    eventModalMarkup,
    /id="eventStartTimeInput"[\s\S]*?role="combobox"[\s\S]*?aria-expanded="false"[\s\S]*?aria-controls="eventStartTimeListbox"/,
    "Start time must use an accessible editable combobox"
  );
  assert.match(
    eventModalMarkup,
    /id="eventEndTimeInput"[\s\S]*?role="combobox"[\s\S]*?aria-expanded="false"[\s\S]*?aria-controls="eventEndTimeListbox"/,
    "End time must use an accessible editable combobox"
  );
  assert.match(eventModalMarkup, /id="eventStartTimeListbox" role="listbox" aria-label="Start time options"/);
  assert.match(eventModalMarkup, /id="eventEndTimeListbox" role="listbox" aria-label="End time options"/);
  assert.match(eventModalMarkup, /<label class="mini-toggle" for="eventGoogleSyncInput" aria-label="Sync this event to Google Calendar">/);
  assert.match(eventModalMarkup, /<span class="oauth-spinner" aria-hidden="true"><\/span>/);
  assert.match(eventModalMarkup, /id="eventFormFeedback" role="status" aria-live="polite"/);
  assert.match(eventModalMarkup, /<div class="composer-field-row composer-input-row location-autocomplete-host">/);
  const discardEventDraftStart = home.text.indexOf('<dialog\n      class="modal discard-event-draft-dialog"');
  const discardEventDraftEnd = home.text.indexOf("</dialog>", discardEventDraftStart);
  assert.ok(
    discardEventDraftStart > eventModalEnd && discardEventDraftEnd > discardEventDraftStart,
    "The discard confirmation must be a sibling dialog after the event composer"
  );
  const discardEventDraftMarkup = home.text.slice(discardEventDraftStart, discardEventDraftEnd);
  assert.match(
    discardEventDraftMarkup,
    /id="discardEventDraftDialog"[\s\S]*?role="alertdialog"[\s\S]*?aria-labelledby="discardEventDraftTitle"[\s\S]*?aria-describedby="discardEventDraftDescription"/,
    "The discard confirmation must expose alert-dialog semantics"
  );
  assert.match(discardEventDraftMarkup, /<h2 id="discardEventDraftTitle">Discard unsaved changes\?<\/h2>/);
  assert.match(
    discardEventDraftMarkup,
    /id="cancelDiscardEventDraftButton" type="button">Cancel<\/button>[\s\S]*?id="confirmDiscardEventDraftButton" type="button">Discard<\/button>/,
    "The safe action must precede the explicit discard action"
  );
  const eventDetailStart = home.text.indexOf('<div class="detail-body hidden" id="eventDetail">');
  const eventDetailEnd = home.text.indexOf('<div class="detail-body hidden" id="busyDetail">', eventDetailStart);
  assert.ok(eventDetailStart >= 0 && eventDetailEnd > eventDetailStart, "Group-event detail markup is incomplete");
  const eventDetailMarkup = home.text.slice(eventDetailStart, eventDetailEnd);
  assert.equal(
    (home.text.match(/id="detailTitleInput"/g) || []).length,
    1,
    "Group-event details must expose exactly one editable title"
  );
  assert.match(
    home.text,
    /<label class="detail-title-field hidden" id="detailTitleField">[\s\S]*?<input id="detailTitleInput" form="eventPanelForm" type="text" placeholder="\(No title\)"/,
    "The sole editable group-event title must live in the panel header"
  );
  assert.doesNotMatch(
    eventDetailMarkup,
    /event-panel-title-field|id="detailTitleInput"/,
    "The group-event form must not repeat the header title"
  );
  assert.match(eventDetailMarkup, /id="detailStartInput" type="hidden"/);
  assert.match(eventDetailMarkup, /id="detailEndInput" type="hidden"/);
  assert.match(
    eventDetailMarkup,
    /id="detailStartTimeInput"[\s\S]*?role="combobox"[\s\S]*?aria-controls="detailStartTimeListbox"/,
    "Group-event start time must use the shared accessible combobox"
  );
  assert.match(
    eventDetailMarkup,
    /id="detailEndTimeInput"[\s\S]*?role="combobox"[\s\S]*?aria-controls="detailEndTimeListbox"/,
    "Group-event end time must use the shared accessible combobox"
  );
  assert.doesNotMatch(home.text, /type="time"/, "Static CommonGround forms must not fall back to native time widgets");
  assert.match(
    eventDetailMarkup,
    /<section class="rsvp-control" aria-labelledby="rsvpPrompt">[\s\S]*?<span class="rsvp-prompt" id="rsvpPrompt">Going\?<\/span>/,
    "Group events must use the compact Going control"
  );
  const yesResponseIndex = eventDetailMarkup.indexOf('data-response="yes"');
  const noResponseIndex = eventDetailMarkup.indexOf('data-response="no"');
  const maybeResponseIndex = eventDetailMarkup.indexOf('data-response="maybe"');
  assert.equal(
    (eventDetailMarkup.match(/class="vote-button"/g) || []).length,
    3,
    "Group events must expose exactly three RSVP choices"
  );
  assert.equal(
    (eventDetailMarkup.match(/class="vote-button"[^>]*aria-pressed="false"/g) || []).length,
    3,
    "Every RSVP choice must expose its pressed state"
  );
  assert.ok(
    yesResponseIndex >= 0 && yesResponseIndex < noResponseIndex && noResponseIndex < maybeResponseIndex,
    "RSVP choices must be ordered Yes, No, Maybe"
  );
  assert.match(
    eventDetailMarkup,
    /id="responseSummary" role="status" aria-live="polite" aria-atomic="true"/,
    "RSVP totals must remain available to assistive technology"
  );
  assert.doesNotMatch(
    eventDetailMarkup,
    /id="responseGroups"|class="response-group"/,
    "The old stacked response cards must be removed"
  );
  assert.match(
    eventModalMarkup,
    /id="eventLocationInput"[\s\S]*?maxlength="200"[\s\S]*?role="combobox"[\s\S]*?aria-autocomplete="list"[\s\S]*?aria-expanded="false"[\s\S]*?aria-controls="eventLocationListbox"[\s\S]*?aria-describedby="eventLocationStatus"/,
    "The event location must expose an editable address-suggestion combobox"
  );
  assert.match(eventModalMarkup, /id="eventLocationListbox" role="listbox" aria-label="Address suggestions"/);
  assert.match(eventModalMarkup, /id="eventLocationStatus" role="status" aria-live="polite"/);
  assert.match(eventModalMarkup, /class="location-autocomplete-attribution" translate="no">Google Maps<\/div>/);
  assert.match(eventModalMarkup, /<label class="composer-field-row composer-input-row composer-description-row" for="eventDescriptionInput">/);
  assert.match(eventModalMarkup, /id="eventDescriptionInput"[^>]*rows="1"/);
  assert.doesNotMatch(eventModalMarkup, /class="composer-body"/);
  assertInOrder(eventModalMarkup, [
    'class="composer-heading-section"',
    'id="eventTitleInput"',
    'class="composer-section composer-schedule-section"',
    'id="eventDateInput"',
    'id="eventStartInput"',
    'id="eventEndInput"',
    'id="eventAllDayInput"',
    'class="composer-section composer-meta-section"',
    'class="composer-field-row composer-invite-row"',
    'id="inviteePicker"',
    'class="composer-field-row composer-sync-row"',
    'id="eventGoogleSyncRow"',
    'id="eventGoogleSyncInput"',
    'id="eventLocationInput"',
    'id="eventDescriptionInput"',
    'id="eventFormFeedback"',
    'id="saveEventButton"'
  ], "Event composer sections must retain their accessible visual order");
  assert.match(
    home.text,
    /id="detailLocationInput"[\s\S]*?maxlength="200"[\s\S]*?role="combobox"[\s\S]*?aria-controls="detailLocationListbox"[\s\S]*?aria-describedby="detailLocationStatus"/,
    "The event detail editor must use the same accessible address combobox"
  );
  assert.match(home.text, /id="detailLocationListbox" role="listbox" aria-label="Address suggestions"/);
  assert.match(home.text, /class="ui-icon ui-icon-maximize" id="fullscreenIcon"/);
  assert.match(home.text, /composer-row-icon ui-icon ui-icon-clock/);
  assert.match(home.text, /button-with-icon[^>]*id="addEventButton"/);
  assert.doesNotMatch(
    home.text,
    /sidebar-create-chevron/,
    "The Create button must not include a dropdown chevron"
  );
  assert.match(
    home.text,
    /<section class="room-page calendar-app-shell hidden" id="roomPage" data-google-connected="false" data-google-ready="false">[\s\S]*?<button class="calendar-google-button needs-connection button-with-icon" id="calendarGoogleButton" type="button" title="Connect Google Calendar" aria-label="Connect Google Calendar" aria-busy="true" disabled>[\s\S]*?<span>Connect Google Calendar<\/span>/,
    "The calendar top bar must start with a safe, explicit Google Calendar connection state"
  );
  assert.match(
    home.text,
    /id="googleConnectionIndicator" role="status" aria-label="Google Calendar connected">[\s\S]*?Google connected/,
    "The connected state must expose a compact sync-status indicator"
  );
  assert.match(
    home.text,
    /id="calendarConnectionNotice" role="note">[\s\S]*?Connect your Google Calendar to see overlapping availability\./,
    "Disconnected rooms must explain why the availability grid is empty"
  );
  assert.match(
    home.text,
    /id="calendarStatus" role="status" aria-live="polite">/,
    "Calendar updates must retain a non-visual live status region"
  );
  assert.match(
    home.text,
    /<button class="command-centre-trigger" id="commandCentreButton"[^>]*aria-label="Ask CommonGround"[^>]*aria-haspopup="dialog"[^>]*aria-controls="commandCentreDialog"[^>]*aria-expanded="false">[\s\S]*?Ask CommonGround[\s\S]*?<kbd id="commandCentreShortcutHint">Ctrl K<\/kbd>/,
    "The calendar toolbar must expose an accessible Ask CommonGround trigger and shortcut hint"
  );
  assertInOrder(
    home.text,
    ['id="commandCentreButton"', 'id="calendarGoogleButton"', 'id="googleConnectionIndicator"', 'id="calendarViewMenu"', 'id="refreshButton"', 'id="fullscreenButton"', 'id="settingsButton"', 'id="topbarIdentity"'],
    "Top-bar actions must follow the Ask, primary CTA, sync status, view, utilities, and profile hierarchy"
  );
  assert.doesNotMatch(
    home.text,
    /calendar-app-toggle/,
    "The refactored top bar must not retain the disconnected legacy calendar/tasks toggle"
  );
  assert.match(
    home.text,
    /<dialog class="command-centre-dialog time-picker-surface" id="commandCentreDialog" aria-labelledby="commandCentreTitle" aria-describedby="commandCentreDescription">[\s\S]*?<form class="command-centre-panel" id="commandCentreForm" novalidate>[\s\S]*?id="commandCentreInput" type="search"[^>]*maxlength="500"[^>]*placeholder="Create an event or find a time[\s\S]*?id="commandCentreStatus" role="status" aria-live="polite" aria-atomic="true"[\s\S]*?id="commandCentreBody" aria-live="off"/,
    "The Command Centre must use a labelled semantic dialog, bounded search input, and live status region"
  );
  assert.doesNotMatch(
    home.text,
    /Lunch with Sam tomorrow at 1|class="command-centre-footer"/,
    "The initial Command Centre must not show the canned Sam example or the visual keyboard legend"
  );
  assert.match(
    home.text,
    /data-command-example="Create an event tomorrow at 1">Create an event<\/button>/,
    "The create example must stay generic so its title hint can be derived from active room members"
  );
  assert.match(
    home.text,
    /class="command-centre-input-shell"[\s\S]*?id="commandCentreCompletion" aria-hidden="true"[\s\S]*?id="commandCentreCompletionPrefix"[\s\S]*?id="commandCentreCompletionSuffix"[\s\S]*?id="commandCentreInput"[^>]*aria-autocomplete="inline"[^>]*aria-controls="commandCentreBody"[^>]*aria-describedby="[^"]*\bcommandCentreCompletionHelp\b[^"]*"/,
    "Predictive text must be a screen-reader-hidden visual layer behind an inline-autocomplete input"
  );
  assert.match(
    home.text,
    /id="commandCentreCompletionHelp"[^>]*>[\s\S]*?Tab or Right Arrow[\s\S]*?Press Enter to run/,
    "Assistive technology users must receive completion and execution instructions"
  );
  assert.match(
    home.text,
    /<div class="calendar-utility-actions" role="group" aria-label="Calendar utilities">[\s\S]*?id="refreshButton"[\s\S]*?id="fullscreenButton"[\s\S]*?id="settingsButton"[\s\S]*?<\/div>/,
    "Calendar utilities must remain one accessible control group"
  );
  assert.match(
    home.text,
    /<section class="room-page calendar-app-shell hidden" id="roomPage" data-google-connected="false" data-google-ready="false">\s*<header class="room-topbar calendar-app-nav">/,
    "The room page must expose the persistent calendar application shell with its top navigation as a direct child"
  );
  assert.match(
    home.text,
    /<\/header>\s*<aside class="participants-sidebar" id="participantsSidebar"[^>]*data-open="true">[\s\S]*?<div class="mini-calendar-grid" id="miniCalendarGrid"><\/div>[\s\S]*?<input id="memberSearchInput" type="search" placeholder="Search for people"[\s\S]*?<span>Members<\/span>[\s\S]*?<div class="participant-strip" id="participantStrip"><\/div>/,
    "The persistent left sidebar must contain the mini calendar, member search, and Members selection list"
  );
  assert.doesNotMatch(
    home.text,
    /calendar-legal-links|Privacy Policy|Terms &amp; Conditions/,
    "The calendar view must not duplicate the sidebar legal links"
  );
  for (const removedShellControl of [
    /id="calendarSearchButton"/,
    /class="[^"]*\bnav-help-button\b/,
    /class="calendar-upgrade-button"/,
    /class="[^"]*\bnav-app-grid-button\b/,
    /<span>Booking pages<\/span>/,
    /class="other-calendars"/,
    /Holidays in United Kingdom/,
    /class="calendar-icon-rail"/,
    /id="calendarRailAddButton"/
  ]) {
    assert.doesNotMatch(home.text, removedShellControl, "Removed calendar-shell controls must not remain in the DOM");
  }
  assert.match(
    home.text,
    /<div class="topbar-identity" id="topbarIdentity" role="group" aria-label="Your room identity"><\/div>/,
    "The name and colour controls must share one labelled visual group"
  );
  const emojiDictionaryResponse = await publicSession.request("/assets/emojilib/3.0.11/emoji-en-US.json", {
    accept: "application/json"
  });
  assert.match(emojiDictionaryResponse.response.headers.get("content-type") || "", /^application\/json/);
  assert.equal(Object.keys(emojiDictionaryResponse.payload).length, 1870);
  assert.ok(emojiDictionaryResponse.payload["😀"].includes("smile"));
  assert.ok(emojiDictionaryResponse.payload["👍"].includes("thumbs_up"));
  assert.equal(
    emojiDictionaryResponse.response.headers.get("cache-control"),
    "public, max-age=31536000, immutable"
  );
  const emojiDictionaryEtag = emojiDictionaryResponse.response.headers.get("etag");
  assert.ok(emojiDictionaryEtag);
  await publicSession.request("/assets/emojilib/3.0.11/emoji-en-US.json", {
    accept: "application/json",
    headers: { "If-None-Match": emojiDictionaryEtag },
    expected: 304
  });
  const emojiDictionaryHead = await publicSession.request("/assets/emojilib/3.0.11/emoji-en-US.json", {
    method: "HEAD",
    accept: "application/json"
  });
  assert.equal(emojiDictionaryHead.text, "");
  assert.equal(Number(emojiDictionaryHead.response.headers.get("content-length")), Buffer.byteLength(emojiDictionaryResponse.text));
  const datePickerScript = await publicSession.request("/date-picker.js", { accept: "text/javascript" });
  assert.match(
    datePickerScript.response.headers.get("content-type") || "",
    /javascript/,
    "The shared date-picker asset must be served as JavaScript"
  );
  const eventComposerScript = await publicSession.request("/app.js", { accept: "text/javascript" });
  const commandActionsScript = await publicSession.request("/command-centre-actions.js", { accept: "text/javascript" });
  const commandCentreScript = await publicSession.request("/command-centre.js", { accept: "text/javascript" });
  const commandPredictorScript = await publicSession.request("/command-centre-predictor.js", {
    accept: "text/javascript"
  });
  const dynamicDateInputIds = [
    "commandEventDate",
    "commandEventEndDate",
    "commandRangeStartDate",
    "commandRangeEndDate",
    "commandMoveDate"
  ];
  for (const inputId of dynamicDateInputIds) {
    assert.match(
      commandCentreScript.text,
      new RegExp(`id="${inputId}"\\s+type="date"`),
      `${inputId} must retain native date-input semantics beneath the shared picker`
    );
  }
  assert.equal(
    (commandCentreScript.text.match(/type="date"/g) || []).length,
    dynamicDateInputIds.length,
    "The Command Centre must expose exactly five dynamically rendered date inputs"
  );
  assert.equal(
    staticDateInputIds.length + dynamicDateInputIds.length,
    8,
    "CommonGround must route all eight static and dynamic date inputs through one picker"
  );
  assert.match(
    commandCentreScript.text,
    /id="commandEventEndDate" type="date" min="\$\{commandAttribute\(dateValue\)\}"/,
    "The all-day Command Centre end date must retain its start-date minimum"
  );
  assert.match(
    datePickerScript.text,
    /const DATE_INPUT_SELECTOR = 'input\[type="date"\]:not\(\[data-native-date-picker\]\)'/,
    "The shared controller must delegate from canonical date inputs"
  );
  assert.match(
    datePickerScript.text,
    /document\.addEventListener\("pointerdown",[\s\S]*?dateInputFromTarget\(event\.target\)[\s\S]*?openDatePicker\(input\)/,
    "Pointer delegation must cover date inputs rendered after initial page load"
  );
  assert.match(
    datePickerScript.text,
    /const dateInputObserver = new MutationObserver\([\s\S]*?record\.addedNodes\.forEach\([\s\S]*?prepareDateInputs\(node\)[\s\S]*?record\.type === "attributes"[\s\S]*?prepareDateInput\(record\.target\)[\s\S]*?dateInputObserver\.observe\(document\.documentElement,[\s\S]*?childList: true,[\s\S]*?subtree: true/,
    "The observer must enhance inserted date fields and inputs whose type changes dynamically"
  );
  assert.match(
    datePickerScript.text,
    /function pickerHostForInput\(input\)[\s\S]*?input\.closest\("dialog\[open\]"\)[\s\S]*?input\.closest\("\.detail-panel:not\(\.hidden\)"\)[\s\S]*?document\.body[\s\S]*?const host = pickerHostForInput\(input\);[\s\S]*?host\.appendChild\(picker\)/,
    "The picker must be hosted inside an open dialog or detail panel so modal inertness cannot block it"
  );
  assert.match(
    datePickerScript.text,
    /function inputMinimum\(input\)[\s\S]*?input\?\.min[\s\S]*?function inputMaximum\(input\)[\s\S]*?input\?\.max[\s\S]*?function clampToInputRange\(input, date\)[\s\S]*?function dateIsDisabled\(input, date\)[\s\S]*?previousMonthButton\.disabled[\s\S]*?nextMonthButton\.disabled/,
    "Date selection and month navigation must honor each input's min and max constraints"
  );
  assert.match(
    datePickerScript.text,
    /picker\.setAttribute\("aria-describedby", `\$\{PICKER_ID\}Help`\)[\s\S]*?for \(let index = 0; index < 42; index \+= 1\)[\s\S]*?row\.setAttribute\("role", "row"\)[\s\S]*?cell\.setAttribute\("role", "gridcell"\)[\s\S]*?cell\.appendChild\(button\)/,
    "Every picker must render a labelled six-week ARIA grid without replacing native button semantics"
  );
  assert.match(
    datePickerScript.text,
    /function selectDate\(key\)[\s\S]*?input\.value = key;[\s\S]*?dispatchEvent\(new Event\("input", \{ bubbles: true \}\)\)[\s\S]*?dispatchEvent\(new Event\("change", \{ bubbles: true \}\)\)/,
    "A picker selection must drive both input and change listeners used by existing forms"
  );
  const datePickerKeyboardStart = datePickerScript.text.indexOf("function handleDatePickerKeydown");
  const datePickerKeyboardEnd = datePickerScript.text.indexOf("createWeekdayLabels();", datePickerKeyboardStart);
  assert.ok(
    datePickerKeyboardStart >= 0 && datePickerKeyboardEnd > datePickerKeyboardStart,
    "The date picker keyboard controller must be present"
  );
  const datePickerKeyboardSource = datePickerScript.text.slice(
    datePickerKeyboardStart,
    datePickerKeyboardEnd
  );
  for (const key of [
    "Enter",
    " ",
    "Escape",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
    "Home",
    "End",
    "PageUp",
    "PageDown"
  ]) {
    assert.ok(
      datePickerKeyboardSource.includes(`"${key}"`),
      `The shared date picker must handle the ${key === " " ? "Space" : key} key`
    );
  }
  assert.match(
    datePickerKeyboardSource,
    /event\.target\.closest\("\[data-date-picker-previous\], \[data-date-picker-next\]"\)[\s\S]*?return;/,
    "Month-navigation buttons must retain their own keyboard focus behavior"
  );
  assert.match(
    datePickerKeyboardSource,
    /event\.shiftKey \? 12 : 1/,
    "Shift plus Page Up or Page Down must support year navigation"
  );
  assert.match(
    eventComposerScript.text,
    /function dismissOutsideFloatingSurfaces\(target\)[\s\S]*?const datePickerTarget = window\.commonGroundDatePicker\?\.containsTarget\(target\) === true;[\s\S]*?panelIsVisible\(detailPanel\)[\s\S]*?!datePickerTarget[\s\S]*?return datePickerTarget \? false : dismissed;/,
    "The app-wide outside-surface guard must exempt picker clicks and preserve the detail editor"
  );
  assert.match(
    serverSource,
    /const googleMapsApiKey = String\(process\.env\.GOOGLE_MAPS_API_KEY \|\| ""\)\.trim\(\);[\s\S]*?https:\/\/places\.googleapis\.com\/v1\/places:autocomplete/,
    "Places must use a server-only environment key and a fixed Google endpoint"
  );
  assert.match(
    serverSource,
    /roomPlacesAutocompleteMatch[\s\S]*?req\.method !== "POST"[\s\S]*?enforceRateLimit[\s\S]*?requireExistingRoomParticipant[\s\S]*?readJsonBody\(req, \{ maxBytes: 8_192 \}\)[\s\S]*?fetchGooglePlaceSuggestions/,
    "Address suggestions must be room-scoped, rate-limited, authenticated, and body-bounded"
  );
  assert.match(
    serverSource,
    /X-Goog-Api-Key": googleMapsApiKey[\s\S]*?"X-Goog-FieldMask"[\s\S]*?sanitizeGooglePlaceSuggestions/,
    "The proxy must authenticate by header, request only required fields, and sanitize results"
  );
  assert.match(
    serverSource,
    /googleWeatherDailyForecastUrl = "https:\/\/weather\.googleapis\.com\/v1\/forecast\/days:lookup"[\s\S]*?requestUrl\.searchParams\.set\("key", googleMapsApiKey\)[\s\S]*?"days", "10"[\s\S]*?"unitsSystem", "METRIC"[\s\S]*?sanitizeGoogleDailyForecast/,
    "Weather must use the fixed Google daily endpoint, protected server key, metric units, and sanitized output"
  );
  assert.match(
    serverSource,
    /googleWeatherHourlyForecastUrl = "https:\/\/weather\.googleapis\.com\/v1\/forecast\/hours:lookup"[\s\S]*?googleWeatherHourlyHistoryUrl = "https:\/\/weather\.googleapis\.com\/v1\/history\/hours:lookup"[\s\S]*?fetchGoogleHourlyWeatherPage[\s\S]*?"pageSize", "24"[\s\S]*?sanitizeGoogleHourlyWeather/,
    "Hourly forecast and recent history must use fixed Google endpoints, paginated sanitized results, and the server key"
  );
  assert.match(
    serverSource,
    /roomWeatherForecastMatch[\s\S]*?req\.method !== "POST"[\s\S]*?requireExistingRoomParticipant[\s\S]*?enforceRateLimit\([\s\S]*?"weather-forecast"[\s\S]*?12[\s\S]*?auth\.participant\.id[\s\S]*?readJsonBody\(req, \{ maxBytes: 4_096 \}\)[\s\S]*?normalizedWeatherCoordinate[\s\S]*?fetchGoogleDailyWeatherWithRecentHistory/,
    "Weather must be room-scoped, rate-limited, authenticated, body-bounded, and coordinate-validated"
  );
  assert.match(
    serverSource,
    /roomWeatherHourlyMatch[\s\S]*?req\.method !== "POST"[\s\S]*?requireExistingRoomParticipant[\s\S]*?"weather-hourly"[\s\S]*?24[\s\S]*?auth\.participant\.id[\s\S]*?readJsonBody\(req, \{ maxBytes: 4_096 \}\)[\s\S]*?normalizedWeatherCoordinate[\s\S]*?valid YYYY-MM-DD[\s\S]*?fetchGoogleHourlyWeatherForDate/,
    "Hourly weather must be room-scoped, rate-limited, authenticated, body-bounded, and date/coordinate validated"
  );
  assert.match(
    serverSource,
    /async function fetchGoogleHourlyForecastForDate[\s\S]*?while \(true\)[\s\S]*?matchingHours[\s\S]*?entry\.complete[\s\S]*?if \(!entry\.loadPromise\)[\s\S]*?await entry\.loadPromise/,
    "Concurrent hourly requests must re-check coverage and continue pagination for each requested date"
  );
  assert.match(
    serverSource,
    /weatherForecastCache\.set\(cacheKey, entry\)[\s\S]*?setTimeout\(\(\) => \{[\s\S]*?weatherForecastCache\.get\(cacheKey\) === entry[\s\S]*?weatherForecastCache\.delete\(cacheKey\)[\s\S]*?weatherForecastCacheTtlMs[\s\S]*?cleanupTimer\.unref\?\.\(\)/,
    "Rounded location cache entries must be actively deleted after the disclosed TTL"
  );
  assert.match(
    serverSource,
    /Permissions-Policy", "camera=\(\), microphone=\(\), geolocation=\(self\), payment=\(\)"/,
    "Only same-origin browser geolocation may be requested"
  );
  assert.doesNotMatch(
    [home.text, eventComposerScript.text, commandCentreScript.text].join("\n"),
    /AIza[0-9A-Za-z_-]{20,}/,
    "Client assets must never contain a Google Maps API key"
  );
  assert.match(
    eventComposerScript.text,
    /function requestWeatherLocation\(\)[\s\S]*?navigator\.geolocation\.getCurrentPosition[\s\S]*?enableHighAccuracy: false[\s\S]*?maximumAge: 30 \* 60 \* 1000/,
    "Local weather must use the browser permission flow without high-accuracy tracking"
  );
  assert.match(
    eventComposerScript.text,
    /function roundedWeatherCoordinate\(value\) \{[\s\S]*?Math\.round\(Number\(value\) \* 100\) \/ 100/,
    "Coordinates must be rounded in the browser before leaving the device"
  );
  assert.match(
    eventComposerScript.text,
    /weatherLocationPromise = new Promise[\s\S]*?\.finally\(\(\) => \{[\s\S]*?weatherLocationPromise = null/,
    "Location may only be cached while a lookup is in flight"
  );
  assert.match(
    eventComposerScript.text,
    /navigator\.permissions\.query\(\{ name: "geolocation" \}\)[\s\S]*?permissionStatus\.state === "denied"[\s\S]*?markWeatherLocationUnavailable/,
    "Revoking geolocation permission must clear weather and stop later transmissions"
  );
  assert.match(
    eventComposerScript.text,
    /async function ensureWeatherForecast\(\)[\s\S]*?currentView === "year"[\s\S]*?appConfig\?\.weatherReady !== true[\s\S]*?fetchJson\(`\/api\/rooms\/\$\{requestRoomCode\}\/weather\/forecast`[\s\S]*?method: "POST"[\s\S]*?currentRoom\?\.code !== requestRoomCode[\s\S]*?weatherForecastFetchedAt = Date\.now\(\)/,
    "Weather loading must skip year view, require server readiness, post privately, and discard stale-room responses"
  );
  assert.match(
    eventComposerScript.text,
    /const weatherSymbol = createWeatherSymbol\(day\.date, "planner"\);[\s\S]*?const weatherSymbol = createWeatherSymbol\(date, "month"\);/,
    "Day, week, and month renderers must share the weather symbol component"
  );
  assert.match(
    eventComposerScript.text,
    /function createWeatherSymbol\(date, placement\)[\s\S]*?document\.createElement\("button"\)[\s\S]*?aria-haspopup[\s\S]*?pointerenter[\s\S]*?openWeatherHourlyForecast/,
    "Weather icons must be accessible interactive triggers with hover details and hourly click-through"
  );
  assert.match(
    eventComposerScript.text,
    /async function openWeatherHourlyForecast\(trigger, date, forecast\)[\s\S]*?requestWeatherLocation\(\)[\s\S]*?\/weather\/hourly[\s\S]*?generation !== weatherHourlyRequestGeneration[\s\S]*?weatherHourlyByDate\.set/,
    "Hourly loading must reuse consented rounded location, call the private endpoint, cache locally, and discard stale responses"
  );
  assert.doesNotMatch(
    eventComposerScript.text.slice(
      eventComposerScript.text.indexOf("function renderYear()"),
      eventComposerScript.text.indexOf("function renderCalendar()")
    ),
    /createWeatherSymbol|weather-symbol/,
    "Year view must not render weather symbols"
  );
  assert.match(
    eventComposerScript.text,
    /function initializeLocationAutocomplete\(input\)[\s\S]*?dataset\.locationAutocompleteReady[\s\S]*?addEventListener\("focus"[\s\S]*?addEventListener\("input"[\s\S]*?queueLocationAutocomplete[\s\S]*?addEventListener\("keydown"[\s\S]*?handleLocationAutocompleteKeydown[\s\S]*?addEventListener\("blur"/,
    "Static and dynamic address fields must share one autocomplete controller"
  );
  assert.match(
    eventComposerScript.text,
    /function queueLocationAutocomplete\(state,[\s\S]*?query\.length < 3[\s\S]*?\}, immediate \? 0 : 260\);/,
    "Address lookups must require three characters and debounce user input"
  );
  assert.match(
    eventComposerScript.text,
    /async function requestLocationAutocomplete\(state, query\)[\s\S]*?new AbortController\(\)[\s\S]*?generation !== state\.requestGeneration[\s\S]*?state\.input\.value\.trim\(\) !== query/,
    "Address lookups must abort and reject stale results"
  );
  assert.match(
    eventComposerScript.text,
    /function handleLocationAutocompleteKeydown\(event, state\)[\s\S]*?ArrowDown[\s\S]*?ArrowUp[\s\S]*?Enter[\s\S]*?Escape[\s\S]*?Tab/,
    "Address suggestions must support complete keyboard navigation"
  );
  assert.match(
    commandCentreScript.text,
    /id="commandEventLocation"[\s\S]*?role="combobox"[\s\S]*?aria-controls="commandEventLocationListbox"[\s\S]*?Google Maps[\s\S]*?window\.initializeLocationAutocomplete\?\.\(commandCentreBody\.querySelector\("#commandEventLocation"\)\)/,
    "The dynamic Command Centre location editor must register the shared address combobox"
  );
  assert.match(
    commandPredictorScript.text,
    /export function predictCommand\([\s\S]*?acceptedCommand[\s\S]*?inlineSuffix[\s\S]*?parseTyped/,
    "The static predictor module must expose structured completion metadata"
  );
  assert.match(
    commandPredictorScript.text,
    /keyword:\s*"settings"/,
    "The predictor must include the settings command keyword"
  );
  assert.match(
    commandPredictorScript.text,
    /export function matchCommandViewKeyword\([\s\S]*?damerauLevenshtein\(phrase,\s*"settings"\)\s*<=\s*1/,
    "The predictor must share a typo-tolerant settings keyword matcher"
  );
  assert.match(
    commandPredictorScript.text,
    /const inlineSuffix[\s\S]*?raw === raw\.trim\(\)/,
    "Inline completion must not render a misleading suffix after trailing whitespace"
  );
  assert.match(
    commandPredictorScript.text,
    /predictionWordCorrections[\s\S]*?setings:\s*"settings"[\s\S]*?tommorow:\s*"tomorrow"[\s\S]*?wth:\s*"with"/,
    "Predictive completion must normalize common settings, date, and preposition typos"
  );
  assert.match(
    commandPredictorScript.text,
    /predictionContractions[\s\S]*?don\[[^\n]*t[\s\S]*?"do not"[\s\S]*?won\[[^\n]*t[\s\S]*?"will not"/,
    "Predictive matching must understand common contractions without dropping negation"
  );
  assert.match(
    commandPredictorScript.text,
    /candidate\.rank === match\.rank[\s\S]*?normalizeCommandPrediction\(candidate\.command\)[\s\S]*?return null/,
    "Ambiguous member or event prefixes must not guess one equal-ranked completion"
  );
  assert.match(
    commandCentreScript.text,
    /import\("\/command-centre-predictor\.js\?v=20260726-assistant-upgrade"\)[\s\S]*?commandCentrePredictor = module/,
    "The Command Centre must load the cache-versioned predictor module"
  );
  assert.match(
    commandCentreScript.text,
    /commandCentreInput\?\.addEventListener\("input", commandCentreHandleInput\)[\s\S]*?addEventListener\("compositionstart"[\s\S]*?commandCentreState\.composing = true[\s\S]*?addEventListener\("compositionend"[\s\S]*?commandCentreState\.composing = false[\s\S]*?commandCentreHandleInput\(\)/,
    "Predictive parsing must react to input while deferring work during IME composition"
  );
  assert.match(
    commandCentreScript.text,
    /event\.target === commandCentreInput[\s\S]*?event\.key === "Tab" \|\| event\.key === "ArrowRight"[\s\S]*?selectionStart === commandCentreInput\.value\.length[\s\S]*?selectionEnd === commandCentreInput\.value\.length[\s\S]*?commandCentreAcceptPrediction\(\)/,
    "Tab and Right Arrow may accept a completion only when the caret is at the end of the input"
  );
  assert.match(
    commandCentreScript.text,
    /commandCentreState\.prediction\?\.inlineSuffix \|\|[\s\S]*?commandCentreState\.prediction\?\.corrected/,
    "Exact commands without a visible or corrective completion must not trap Tab"
  );
  assert.match(
    commandCentreScript.text,
    /event\.isComposing \|\| commandCentreState\.composing \|\| event\.keyCode === 229/,
    "IME composition keystrokes must not activate a predicted command"
  );
  assert.match(
    commandCentreScript.text,
    /function commandCentreHandleInput\(\)[\s\S]*?commandCentreAbortRequest\(\);[\s\S]*?commandCentreState\.generation \+= 1;[\s\S]*?commandCentreScheduleParse\(\);/,
    "Every genuine input change must invalidate an older parse before showing a new prediction"
  );
  assert.match(
    commandCentreScript.text,
    /function commandCentreHandleInput\(\)[\s\S]*?commandCentreState\.phase === "results"[\s\S]*?commandCentreSelectableOptions\(\)\.length[\s\S]*?!commandCentreBody\.querySelector\("\[data-command-prediction-command\]"\)[\s\S]*?commandCentreSetPhase\("idle", "Reading updated command\."\)[\s\S]*?commandCentreScheduleParse\(\)/,
    "Editing a command must immediately retire stale selectable results"
  );
  assert.match(
    commandCentreScript.text,
    /commandCentreForm\?\.addEventListener\("submit",[\s\S]*?hasPredictionOption[\s\S]*?inputMatchesRenderedCommand[\s\S]*?\(hasPredictionOption \|\| inputMatchesRenderedCommand\)[\s\S]*?commandCentreActivateSelected\(\)[\s\S]*?requestCommandParse\(\{ submitted: true \}\)/,
    "Enter must never activate a stale result after the user changes the command"
  );
  assert.match(
    commandCentreScript.text,
    /closest\("\[data-command-prediction-command\]"\)[\s\S]*?commandCentreInput\.value = predictionButton\.dataset\.commandPredictionCommand[\s\S]*?requestCommandParse\(\{ submitted: true \}\)/,
    "Clicking a predicted action must explicitly submit its canonical command"
  );
  assert.match(
    commandCentreScript.text,
    /result\.intent === "navigate_view"[\s\S]*?submitted && result\.targetView[\s\S]*?commandExecuteView\(result\.targetView\)[\s\S]*?commandRenderViewAction\(result\)/,
    "Submitted view predictions must execute while passive parsing remains a preview"
  );
  assert.match(
    commandCentreScript.text,
    /const commandCentrePhases = new Set\(\[[\s\S]*?"closed"[\s\S]*?"idle"[\s\S]*?"parsing"[\s\S]*?"needs_clarification"[\s\S]*?"preview"[\s\S]*?"searching_availability"[\s\S]*?"results"[\s\S]*?"confirming"[\s\S]*?"saving"[\s\S]*?"success"[\s\S]*?"error"/,
    "The Command Centre must expose the complete interaction state machine"
  );
  assert.match(
    commandCentreScript.text,
    /window\.setTimeout\(\(\) => \{[\s\S]*?requestCommandParse\(\{ submitted: false \}\);[\s\S]*?\}, 420\);/,
    "Lightweight command parsing must be debounced"
  );
  for (const endpoint of ["parse", "move-event"]) {
    assert.match(
      commandCentreScript.text,
      new RegExp(`fetchJson\\(\\x60/api/rooms/\\$\\{roomCodeSnapshot\\}/command-centre/${endpoint}\\x60`),
      `The Command Centre must use the room-scoped ${endpoint} endpoint`
    );
  }
  for (const endpoint of ["availability", "create-event", "update-event", "delete-event"]) {
    assert.match(
      commandActionsScript.text,
      new RegExp(`fetchJson\\(\\x60/api/rooms/\\$\\{roomCodeSnapshot\\}/command-centre/${endpoint}\\x60`),
      `The Command Centre action layer must use the room-scoped ${endpoint} endpoint`
    );
  }
  for (const handler of [
    "navigateToDate",
    "navigateToView",
    "findOverlapAvailability",
    "createCalendarEvent",
    "updateCalendarEvent",
    "deleteCalendarEvent",
    "duplicateCalendarEvent",
    "connectGoogleCalendar",
    "updateCustomRoomCode"
  ]) {
    assert.match(
      commandActionsScript.text,
      new RegExp(`(?:async\\s+)?function ${handler}\\(`),
      `The Command Centre action layer must expose ${handler}`
    );
  }
  assert.match(
    commandCentreScript.text,
    /async function processUserIntent\(inputText,[\s\S]*?commandContinueParsedResult\(data\.result,[\s\S]*?window\.CommonGroundCommandRouter = Object\.freeze/,
    "One structured processUserIntent router must parse and dispatch Command Centre submissions"
  );
  assert.match(
    commandCentreScript.text,
    /predictCommand\(value,\s*\{[\s\S]*?members:\s*currentRoom\?\.participants[\s\S]*?events:\s*currentRoom\?\.events/,
    "Live predictions must use current-room members and CommonGround event titles"
  );
  assert.match(
    commandCentreScript.text,
    /contextEventId:\s*commandSafeContextEventId\(\)/,
    "Contextual follow-ups may send only a validated CommonGround event ID to parsing"
  );
  assert.doesNotMatch(
    commandCentreScript.text,
    /contextEvent(?:Title|Description|Location|Provider)|googleCalendarSync\s*:/,
    "Command parse requests must not forward event details or provider metadata as context"
  );
  assert.match(
    commandCentreScript.text,
    /function commandContinueEventAction\(result, candidate\)[\s\S]*?commandRenderDeletePreview\(result, candidate\)[\s\S]*?commandRenderDuplicatePreview\(result, candidate\)[\s\S]*?commandRenderUpdatePreview\(result, candidate\)/,
    "Rename, delete, duplicate, and participant changes must route to explicit previews"
  );
  assert.doesNotMatch(
    commandCentreScript.text,
    /function commandContinueEventAction\(result, candidate\)[\s\S]{0,900}?commandContinueEventAction\(result, candidate\)/,
    "Event-action dispatch must not recursively call itself"
  );
  assert.match(
    commandCentreScript.text,
    /function commandRenderDeletePreview[\s\S]*?deleteRequestId[\s\S]*?data-command-confirm-delete>Delete event[\s\S]*?function commandConfirmEventDelete[\s\S]*?requestId:\s*commandCentreState\.deleteRequestId/,
    "Destructive requests must require a preview and reuse one stable delete request ID"
  );
  assert.match(
    commandCentreScript.text,
    /function commandParticipantEditorMarkup\(selectedIds = \[\],[\s\S]*?creatorParticipantId[\s\S]*?required \? "disabled"[\s\S]*?commandSelectedParticipantIds\(\{ includeCurrent: false \}\)/,
    "Existing-event participant edits must lock the creator without silently adding a host"
  );
  assert.match(
    commandActionsScript.text,
    /slots: intent === "find_time"[\s\S]*?\.slice\(0, 3\)/,
    "Find-time results must be capped to the top three options"
  );
  assert.match(
    commandParserSource,
    /export function resolveParticipants\([\s\S]*?const allRequested =[\s\S]*?everyone[\s\S]*?everybody[\s\S]*?whole room[\s\S]*?all(?:\\s\+room)?[\s\S]*?members[\s\S]*?if \(allRequested\) members\.forEach/,
    "Collective availability language must resolve to every member in the active room"
  );
  assert.match(
    commandParserSource,
    /function currentWeekAvailabilityKeys\([\s\S]*?rangeStartKey: referenceDateKey,[\s\S]*?rangeEndKey: addDateKeyDays\(startOfIsoWeekDateKey\(referenceDateKey\), 7\)[\s\S]*?if \(availability && !dateKey && !rangeStartKey && !invalidDate\)[\s\S]*?currentWeekAvailabilityKeys\(referenceDateKey\)[\s\S]*?rangeKind = "default_current_week"/,
    "Availability requests without a date scope must default to the remainder of the current week"
  );
  assert.match(
    commandParserSource,
    /else if \(\s*availability &&[\s\S]{0,180}this\|current[\s\S]{0,100}month[\s\S]{0,500}?rangeStartKey = referenceDateKey;[\s\S]{0,240}?rangeEndKey = firstOfRelativeMonthDateKey\(referenceDateKey, 1\);[\s\S]{0,240}?rangeKind = "current_month"/,
    "Current-month availability requests must span from now through the end of the calendar month"
  );
  assert.match(
    commandParserSource,
    /function requestedAvailabilityWeekdays\([\s\S]*?weekdayAliasGroups[\s\S]*?return \[\.\.\.requested\]\.sort\([\s\S]*?if \(intent === "find_time" \|\| intent === "show_availability"\)[\s\S]*?allowedWeekdays: date\.allowedWeekdays/,
    "Availability parsing must expose normalized weekday filters for find-time and show-availability commands"
  );
  assert.match(
    commandCentreScript.text,
    /async function commandLoadAvailability\(result\)[\s\S]*?findOverlapAvailability\([\s\S]*?allowedWeekdays: result\.allowedWeekdays/,
    "The Command Centre must forward parsed weekday filters to the availability action"
  );
  assert.match(
    commandActionsScript.text,
    /\.\.\.\(Array\.isArray\(options\.allowedWeekdays\) && options\.allowedWeekdays\.length[\s\S]*?\? \{ allowedWeekdays: options\.allowedWeekdays \}[\s\S]*?: \{\}\)/,
    "The availability action must serialize weekday filters only when at least one is selected"
  );
  assert.match(
    serverSource,
    /function validateCommandAvailabilityInput\([\s\S]*?let allowedWeekdays = \[\];[\s\S]*?Object\.prototype\.hasOwnProperty\.call\(body, "allowedWeekdays"\)[\s\S]*?!Array\.isArray\(body\.allowedWeekdays\)[\s\S]*?!body\.allowedWeekdays\.length[\s\S]*?body\.allowedWeekdays\.some\(\(weekday\) => !Number\.isInteger\(weekday\) \|\| weekday < 0 \|\| weekday > 6\)[\s\S]*?allowedWeekdays = \[\.\.\.new Set\(body\.allowedWeekdays\)\]\.sort/,
    "The server must treat weekday filters as optional, but reject present filters unless they are nonempty integers from 0 through 6"
  );
  assert.match(
    serverSource,
    /function commandAvailabilityCalendarDayCount\([\s\S]*?dateKeyInZone\(start, timezone\)[\s\S]*?dateKeyInZone\(new Date\(end\.getTime\(\) - 1\), timezone\)[\s\S]*?addDateKeyDays\(dateKey, 1\)[\s\S]*?validateCommandAvailabilityInput\([\s\S]*?commandAvailabilityCalendarDayCount\(start, end, timezone\) > 31/,
    "The server must enforce its availability limit by calendar days in the requested timezone"
  );
  assert.match(
    commandSchedulingSource,
    /export function calculateAvailableSlots\([\s\S]*?const allowedWeekdaySet = new Set\(normalizedAllowedWeekdays\)[\s\S]*?if \(!allowedWeekdaySet\.size \|\| allowedWeekdaySet\.has\(weekdayForDateKey\(dateKey\)\)\) \{[\s\S]*?slots\.push\(\{[\s\S]*?slots: slots\.slice\(0, Math\.max\(1, Math\.min\(20, Number\(limit \|\| 5\)\)\)\)/,
    "The scheduler must filter calendar days with weekdayForDateKey before limiting the candidate slots"
  );
  assert.match(
    commandCentreScript.text,
    /function commandAvailabilityScopeLabel\(result\)[\s\S]*?default_current_week: "Current week"[\s\S]*?current_month: "This month"[\s\S]*?result\.allowedWeekdays\?\.length[\s\S]*?result\.earliestMinute[\s\S]*?return parts\.join\([\s\S]*?function commandRenderAvailabilityReady\(result\)[\s\S]*?const scope = commandAvailabilityScopeLabel\(result\)[\s\S]*?commandEscape\(scope\)/,
    "The availability preview must display its date, weekday, and daily-time scope"
  );
  assert.match(
    commandCentreScript.text,
    /outcome\.code === "availability_conflict"[\s\S]*?commandSuggestConflictTimes/,
    "A confirmed create conflict must offer server-checked alternatives"
  );
  assert.match(
    commandCentreScript.text,
    /data-command-undo-create>Undo[\s\S]*?undoLastEventCreation\(\)/,
    "Created events must expose the existing authorized Undo action"
  );
  assert.match(
    commandCentreScript.text,
    /const commandShortcut = \(event\.metaKey \|\| event\.ctrlKey\)[\s\S]*?event\.key\.toLowerCase\(\) === "k"[\s\S]*?openCommandCentre\(event\.target\)/,
    "Cmd/Ctrl+K must open the Command Centre through the global capture handler"
  );
  assert.match(
    commandCentreScript.text,
    /window\.addEventListener\("keydown",[\s\S]*?event\.key === "Escape"[\s\S]*?event\.key === "ArrowDown" \|\| event\.key === "ArrowUp"[\s\S]*?event\.key === "Enter"[\s\S]*?action\.click\(\)[\s\S]*?commandCentreActivateSelected\(\)/,
    "Escape, arrow navigation, and Enter actions must remain available without a visible keyboard legend"
  );
  assert.doesNotMatch(
    commandCentreScript.text,
    /data-command-example="Lunch with Sam tomorrow at 1"|Review every detail before anything is created|No matching room member was added/,
    "Runtime preview markup must omit the canned Sam example and the removed explanatory notices"
  );
  assert.match(
    commandCentreScript.text,
    /data-command-example="Create an event tomorrow at 1">Create an event<\/button>/,
    "The runtime intro fallback must retain the generic create action"
  );
  assert.match(
    commandCentreScript.text,
    /function commandEventTitleSuggestion\(participantIds = \[\]\)[\s\S]*?currentRoom\?\.participants[\s\S]*?if \(members\.length <= 1\) return "";[\s\S]*?const current = members\.find\([\s\S]*?const otherMembers = members\.filter\([\s\S]*?cursor % candidates\.length[\s\S]*?commandCentreState\.createSuggestionCursor \+= 1;[\s\S]*?return `\$\{commandEventSuggestionName\(current, members\)\}\/\$\{commandEventSuggestionName\(other, members\)\} \$\{commandEventIdeaLabels\[ideaIndex\]\}`;/,
    "Blank event titles must rotate through room-member-aware suggestions and stay empty in a solo room"
  );
  assert.match(
    commandCentreScript.text,
    /function commandRenderCreatePreview\([\s\S]*?const titlePlaceholder = commandCentreState\.createTitleSuggestion \|\| "Add title";[\s\S]*?class="command-preview-card command-create-preview"[\s\S]*?id="commandEventTitle"[^>]*placeholder="\$\{commandAttribute\(titlePlaceholder\)\}"[\s\S]*?class="command-schedule-row[\s\S]*?data-command-all-day-end-field[\s\S]*?id="commandEventEndDate"[\s\S]*?commandTimePickerMarkup\(\{[\s\S]*?id: "commandEventStart"[\s\S]*?fieldAttributes: "data-command-time-field"[\s\S]*?commandTimePickerMarkup\(\{[\s\S]*?id: "commandEventEnd"[\s\S]*?fieldAttributes: "data-command-time-field"[\s\S]*?data-command-confirm-create>Create event<\/button>/,
    "Create previews must use a dynamic title hint, unified schedule row, all-day end date, and explicit confirmation"
  );
  assert.doesNotMatch(
    commandCentreScript.text,
    /type="time"/,
    "Command Centre create and move previews must use the universal picker instead of native time widgets"
  );
  assert.match(
    commandCentreScript.text,
    /function commandTimePickerMarkup\(\{[\s\S]*?class="command-field command-time-picker-field time-picker-field" data-time-picker="\$\{kind\}"[\s\S]*?role="combobox"[\s\S]*?aria-controls="\$\{listboxId\}"[\s\S]*?class="time-picker-list" id="\$\{listboxId\}" role="listbox"/,
    "Dynamic Command Centre time controls must retain editable combobox and listbox semantics"
  );
  assert.match(
    commandCentreScript.text,
    /function commandRenderMovePreview\([\s\S]*?commandTimePickerMarkup\(\{[\s\S]*?id: "commandMoveStart"[\s\S]*?kind: "start"[\s\S]*?commandTimePickerMarkup\(\{[\s\S]*?id: "commandMoveEnd"[\s\S]*?kind: "end"/,
    "Move-event previews must use the same start and duration-aware end pickers"
  );
  assert.match(
    commandCentreScript.text,
    /async function commandOpenCreateComposer\([\s\S]*?closeCommandCentre\(\{ restoreFocus: false, immediate: true \}\);[\s\S]*?window\.openCalendarEventComposerAt\?\.\(\{[\s\S]*?start: result\.start,[\s\S]*?end: result\.end,[\s\S]*?date: result\.dateKey,[\s\S]*?startMinute: result\.startMinute,[\s\S]*?durationMinutes: result\.durationMinutes,[\s\S]*?inviteeParticipantIds: result\.participantIds \|\| \[\]/,
    "Create commands must close the chatbar and hand parsed scheduling data to the standard calendar composer"
  );
  assert.match(
    commandCentreScript.text,
    /if \(result\.intent === "create_event"\) \{[\s\S]*?if \(submitted\) \{[\s\S]*?commandOpenCreateComposer\(result\)[\s\S]*?\} else \{[\s\S]*?commandRenderCreateLauncher\(result\)/,
    "Submitting a create command must navigate directly into the standard composer instead of the duplicate preview form"
  );
  assert.match(
    eventComposerScript.text,
    /async function openCalendarEventComposerAt\(draft = \{\}\)[\s\S]*?goToDateInWeek\(targetDate\)[\s\S]*?pendingEventPrefill = \{[\s\S]*?date: dateKey\(targetDate\),[\s\S]*?startTime: formatInputTime\(startHour\),[\s\S]*?endTime: formatInputTime\(endTimeHour\)[\s\S]*?revealCalendarComposerSelection\(targetDate, startHour, anchorEndHour\)[\s\S]*?openEventModal\("create", \{ anchorRect \}\)/,
    "The command handoff must navigate to the requested week and open the same anchored composer used by calendar selection"
  );
  assert.match(
    eventComposerScript.text,
    /const endDate = eventEndDateInput\?\.value \|\| date;[\s\S]*?new Date\(`\$\{endDate\}T\$\{eventEndInput\.value\}`\)/,
    "The shared event composer must preserve a routed next-day end date for overnight events"
  );
  assert.doesNotMatch(
    commandCentreScript.text,
    /function commandRenderCreatePreview\([\s\S]*?(?:<span>Room<\/span>|data-command-edit-preview>Edit<\/button>)[\s\S]*?function commandRenderAvailabilityClarification/,
    "Create previews must not render the room-name field or the redundant Edit button"
  );
  assert.match(
    commandCentreScript.text,
    /id="commandEventAllDay" type="checkbox"[\s\S]*?function commandReadCreateDraft\(\)[\s\S]*?commandEventEndDate[\s\S]*?const allDay = commandCentreBody\.querySelector\("#commandEventAllDay"\)\?\.checked === true;[\s\S]*?allDay,/,
    "All-day commands must retain an explicit end date and produce authoritative all-day event payloads"
  );
  assert.match(
    commandCentreScript.text,
    /event\.target\.matches\("#commandEventAllDay, #commandEventDate"\)[\s\S]*?querySelector\("\[data-command-all-day-end-field\]"\)[\s\S]*?querySelectorAll\("\[data-command-time-field\]"\)[\s\S]*?allDayEndField\?\.toggleAttribute\("hidden", !checked\)[\s\S]*?timeFields\.forEach\(\(field\) => field\.toggleAttribute\("hidden", checked\)\)/,
    "Selecting All day must hide both time controls and reveal the all-day end-date control"
  );
  assert.match(
    commandCentreScript.text,
    /async function commandOpenRoomEvent\(eventId\)[\s\S]*?roomEventById\(eventId\)[\s\S]*?goToDateInWeek\(new Date\(event\.start\)\)[\s\S]*?openEventDetail\(event\.id\)/,
    "Opening a command result must navigate to its calendar week before showing event details"
  );
  assert.match(
    commandCentreScript.text,
    /window\.commandCentreRenderAvailabilityHighlights[\s\S]*?command-availability-block[\s\S]*?window\.commandCentreReset/,
    "Show-availability results must re-render inside the existing calendar lifecycle and reset on room changes"
  );
  assert.doesNotMatch(
    commandCentreScript.text,
    /openai|anthropic|gemini|chatgpt|api\.openai|localStorage|sessionStorage|https?:\/\//i,
    "The Command Centre must not call an AI service or persist raw command history in browser storage"
  );
  assert.doesNotMatch(
    serverSource,
    /api\.openai|api\.anthropic|generativelanguage\.googleapis|OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY/i,
    "The server must not require or call an external AI provider"
  );
  assert.match(
    serverSource,
    /async function collectCommandBusyIntervals\([\s\S]*?if \(result\.calendarListError\) \{[\s\S]*?unavailableParticipantIds\.push\(participantId\)[\s\S]*?complete: unavailableParticipantIds\.length === 0/,
    "Connected-calendar failures must make Command Centre availability incomplete rather than falsely free"
  );
  assert.match(
    serverSource,
    /async function revalidateCommandEventTime\([\s\S]*?if \(!collection\.complete\) \{[\s\S]*?httpError\(503,[\s\S]*?error\.code = "availability_unavailable"[\s\S]*?findConflicts/,
    "Confirmed mutations must fail closed before conflict checking when provider availability is unavailable"
  );
  assert.match(
    serverSource,
    /async function withCommandMutation\(roomCode, task\)[\s\S]*?commandMutationQueues\.get\(key\)[\s\S]*?previous\.catch\(\(\) => \{\}\)\.then\(task\)/,
    "Confirmed Command Centre mutations must serialize per room"
  );
  assert.match(
    serverSource,
    /function requireLiveCommandParticipant\(auth\)[\s\S]*?findParticipantById\(auth\.room, auth\.participant\?\.id\)[\s\S]*?requireLiveCommandParticipant\(auth\);[\s\S]*?normalizedCommandRequestId\(body\.requestId, \{ required: true \}\)/,
    "Queued mutations must re-check live membership and require idempotency keys"
  );
  assert.match(
    serverSource,
    /commandRequestFingerprint[\s\S]*?const recoveredEvent = auth\.room\.events\.find[\s\S]*?item\.commandRequestId === requestId[\s\S]*?verifyCommandReceipt\(\{ fingerprint: recoveredFingerprint \}, fingerprint\)/,
    "Create retries must recover a persisted event even if its receipt save was interrupted"
  );
  assert.match(
    serverSource,
    /function nextVersionIso\(previousValue\)[\s\S]*?previous \+ 1[\s\S]*?event\.updatedAt = nextVersionIso/,
    "Every event update must advance its stale-write token even within one millisecond"
  );
  assert.match(
    serverSource,
    /const allowedFields = new Set\(\[[\s\S]*?"inviteeParticipantIds"[\s\S]*?Unsupported event update field[\s\S]*?\["allDay", "syncToGoogle", "syncToOutlook"\]/,
    "Command updates must reject unknown fields and non-boolean switches"
  );
  assert.doesNotMatch(eventComposerScript.text, /\broomStatus\b/);
  assert.match(eventComposerScript.text, /const emojiKeywordDictionaryUrl = "https:\/\/unpkg\.com\/emojilib@3\.0\.11\/dist\/emoji-en-US\.json";/);
  assert.match(eventComposerScript.text, /const emojiKeywordDictionaryFallbackUrl = "\/assets\/emojilib\/3\.0\.11\/emoji-en-US\.json";/);
  assert.match(eventComposerScript.text, /const frequentRoomEmojis = Object\.freeze\(\[[\s\S]*?"🙏"[\s\S]*?\]\);/);
  assert.match(eventComposerScript.text, /if \(results\.length === maxEmojiPickerResults\) break;/);
  assert.match(eventComposerScript.text, /message\.textContent = "No emojis found";/);
  assert.match(eventComposerScript.text, /emojiPickerGrid\.replaceChildren\(fragment\);/);
  assert.match(eventComposerScript.text, /new Intl\.Segmenter\(undefined, \{ granularity: "grapheme" \}\)/);
  assert.match(
    eventComposerScript.text,
    /function setEmojiCellScale\(cell, targetScale\)[\s\S]*?stiffness: 400,[\s\S]*?damping: 30,[\s\S]*?mass: 1/,
    "Emoji-cell hover motion must use the requested micro spring"
  );
  assert.match(
    eventComposerScript.text,
    /function openEmojiPicker\(trigger\)[\s\S]*?trigger\.closest\("dialog\[open\]"\)[\s\S]*?stiffness: 300,[\s\S]*?damping: 25,[\s\S]*?mass: 1/,
    "The picker must remain modal-safe and use the requested macro spring"
  );
  assert.match(
    eventComposerScript.text,
    /function selectEmoji\(emoji\)[\s\S]*?input\.dispatchEvent\(new Event\("input", \{ bubbles: true \}\)\);[\s\S]*?input\.dispatchEvent\(new Event\("change", \{ bubbles: true \}\)\);[\s\S]*?closeEmojiPicker\(\{ restoreFocus: true \}\);/,
    "Selection must preserve the existing input/change persistence contract and return focus"
  );
  assert.doesNotMatch(
    eventComposerScript.text,
    /emojiPickerGrid\.innerHTML|emojiPickerPopover\.innerHTML/,
    "Emoji data must be rendered with safe DOM APIs"
  );
  assert.match(eventComposerScript.text, /function setEventFormSaving\(saving\)/);
  assert.match(eventComposerScript.text, /setEventFormFeedback\(error\.message/);
  assert.match(
    serverSource,
    /function publicUser\(user\) \{[\s\S]*?googleConnected: userGoogleConnected\(user\),[\s\S]*?googleNeedsReconnect: Boolean\(user\.auth\?\.google\?\.needsReconnect\),/,
    "The public session payload must distinguish a Google connection from other calendar providers"
  );
  assert.match(
    serverSource,
    /const providerNeedsReconnect = \(entry\)[\s\S]*?\[401, 403\]\.includes\(entry\.status\)[\s\S]*?entry\.status === 400 && entry\.code === "invalid_grant"[\s\S]*?const googleNeedsReconnect = providerErrors\.some[\s\S]*?needsReconnect: googleNeedsReconnect/,
    "Google health must remain provider-specific when another connected provider still succeeds"
  );
  assert.match(
    serverSource,
    /async function refreshAccessToken\(tokens\)[\s\S]*?error\.status = response\.status;[\s\S]*?error\.code = payload\.error \|\| null;[\s\S]*?throw error;/,
    "Revoked Google refresh credentials must preserve invalid_grant details for reconnect handling"
  );
  assert.match(
    eventComposerScript.text,
    /function currentGoogleNeedsReconnect\(\)[\s\S]*?sessionInfo\?\.user\?\.googleNeedsReconnect === true[\s\S]*?function isGoogleConnected\(\) \{[\s\S]*?appConfig\?\.googleReady === true[\s\S]*?sessionInfo\?\.user\?\.googleConnected === true[\s\S]*?currentParticipantConnected\(\)[\s\S]*?!currentGoogleNeedsReconnect\(\)/,
    "The UI state must require configured Google services, a live Google identity, and a room participant connection"
  );
  const googleConnectionStateSource = eventComposerScript.text.slice(
    eventComposerScript.text.indexOf("function isGoogleConnected()"),
    eventComposerScript.text.indexOf("function calendarWriteReady()")
  );
  assert.doesNotMatch(
    googleConnectionStateSource,
    /calendarWriteReady/,
    "Read-only Google availability must still count as connected UI state"
  );
  assert.match(
    eventComposerScript.text,
    /function renderCalendarGoogleControl\(\)[\s\S]*?const googleAvailable = appConfig\?\.googleReady === true;[\s\S]*?let label = "Connect Google Calendar";[\s\S]*?label = "Google Calendar unavailable";[\s\S]*?label = "Reconnect Google Calendar";[\s\S]*?"Link copied" : "Copy invite link"[\s\S]*?dataset\.googleAction = connected \? "invite" : \(googleAvailable \? "authorize" : "unavailable"\);/,
    "The persistent primary CTA must switch cleanly between connect, reconnect, and invite states"
  );
  assert.match(
    eventComposerScript.text,
    /function renderCalendarGoogleControl\(\)[\s\S]*?roomPage\.dataset\.googleReady = String\(ready\);[\s\S]*?roomPage\.dataset\.googleConnected = String\(connected\);[\s\S]*?googleConnectionIndicator\?\.classList\.toggle\("hidden", !connected\);[\s\S]*?calendarConnectionNotice\?\.classList\.toggle\("hidden", connected \|\| !ready\);[\s\S]*?setPanelVisibility\(emptyRoomState, false\);/,
    "Connection state must drive the shell, indicator, contextual notice, and removal of the legacy invite strip"
  );
  assert.match(
    eventComposerScript.text,
    /connectionNoticeText\.textContent = googleAvailable[\s\S]*?Connect your Google Calendar to see overlapping availability\.[\s\S]*?Google Calendar connection is currently unavailable\./,
    "An unavailable OAuth backend must not present an impossible connection instruction"
  );
  assert.match(
    eventComposerScript.text,
    /async function loadFreeBusy\(\)[\s\S]*?typeof data\.googleNeedsReconnect === "boolean"[\s\S]*?sessionInfo\.user\.googleNeedsReconnect = data\.googleNeedsReconnect;/,
    "A provider-specific reconnect result must update the CTA in the same refresh cycle"
  );
  assert.match(
    eventComposerScript.text,
    /function renderRoomMeta\(\)[\s\S]*?renderCalendarEventSyncControls\(\);\s*renderCalendarGoogleControl\(\);/,
    "Room refreshes must keep the persistent Google Calendar control in sync with server state"
  );
  assert.match(
    eventComposerScript.text,
    /async function copyRoomInviteLinkFromTopbar\(\) \{[\s\S]*?await copyTextToClipboard\(roomInviteLink\(\)\);[\s\S]*?copiedTopbarInviteRoomCode = roomCodeSnapshot;[\s\S]*?renderCalendarGoogleControl\(\);/,
    "The connected CTA must copy the exact room link and expose immediate feedback"
  );
  assert.match(
    eventComposerScript.text,
    /calendarGoogleButton\?\.addEventListener\("click", \(\) => \{[\s\S]*?dataset\.googleAction === "invite" && isGoogleConnected\(\)[\s\S]*?copyRoomInviteLinkFromTopbar\(\);[\s\S]*?dataset\.googleAction !== "authorize"[\s\S]*?window\.location\.href = googleAuthUrl\(currentRoom\.code, \{ calendarWrite: true \}\);/,
    "The top-bar CTA must copy an invite when connected and start secure OAuth otherwise"
  );
  assert.match(
    eventComposerScript.text,
    /function dragSelectionRect\(\)[\s\S]*?const width = Math\.max\(dayWidth - 16, 24\);/,
    "The tentative event anchor must track the real calendar column instead of imposing a wide false rectangle"
  );
  assert.match(
    eventComposerScript.text,
    /function stopDragCreate\(\{ preservePreview = false \} = \{\}\)[\s\S]*?if \(!preservePreview\) clearDragPreview\(\);/,
    "Drag cleanup must optionally preserve the tentative event while its adjacent composer is open"
  );
  assert.match(
    eventComposerScript.text,
    /function handleDragCreateEnd\([\s\S]*?stopDragCreate\(\{ preservePreview: true \}\);[\s\S]*?openDraggedEventComposer\(anchorRect\);/,
    "Finishing a drag must keep its provisional event visible behind the adjacent composer"
  );
  assert.match(
    eventComposerScript.text,
    /function hasMultipleEventParticipants\(participantIds = \[\]\) \{[\s\S]*?new Set\(\(participantIds \|\| \[\]\)\.filter\(Boolean\)\)\.size > 1;/,
    "Group-event styling must be based on more than one unique event participant"
  );
  assert.match(
    eventComposerScript.text,
    /isGroupEvent: hasMultipleEventParticipants\(eventInviteeIds\(event\)\)[\s\S]*?item\.isGroupEvent \? "is-group-event" : ""/,
    "Persisted planner events must expose the same group state to every viewer"
  );
  assert.match(
    eventComposerScript.text,
    /chip\.className = `event-chip \$\{eventBlock\.isGroupEvent \? "is-group-event" : ""\}`\.trim\(\);/,
    "Month event chips must retain the group-event treatment"
  );
  assert.match(
    eventComposerScript.text,
    /function upsertCalendarEventPreview\(\{[\s\S]*?composer \? "event-composer-preview" : ""[\s\S]*?hasMultipleEventParticipants\(inviteeParticipantIds\) \? "is-group-event" : ""[\s\S]*?setAttribute\("aria-hidden", "true"\)[\s\S]*?eventsLayer\.appendChild\(dragPreviewNode\);/,
    "The draft preview must be one non-interactive event card shared by drag and composer flows"
  );
  assert.match(
    eventComposerScript.text,
    /function eventComposerPreviewDraft\(\)[\s\S]*?eventAllDayInput\?\.checked[\s\S]*?eventStartInput\.value[\s\S]*?eventEndInput\.value[\s\S]*?eventTitleInput\.value[\s\S]*?querySelectorAll\("input\[type='checkbox'\]:checked"\)/,
    "The live preview must derive its range, title, and participant state from the composer"
  );
  assert.match(
    eventComposerScript.text,
    /function syncEventComposerPreview\([\s\S]*?upsertCalendarEventPreview\([\s\S]*?preview\.getBoundingClientRect\(\)[\s\S]*?eventModal\.classList\.add\("anchored-composer"\);[\s\S]*?positionEventModal\(\);/,
    "Every live preview update must remeasure the block and place the composer beside it"
  );
  assert.match(
    eventComposerScript.text,
    /eventForm\.addEventListener\("input",[\s\S]*?scheduleEventComposerPreviewUpdate\(\);[\s\S]*?eventForm\.addEventListener\("change",[\s\S]*?reveal: changesRange,[\s\S]*?navigate: event\.target === eventDateInput/,
    "Title, picker, date, all-day, and delegated invitee changes must update the draft preview"
  );
  assert.match(
    eventComposerScript.text,
    /if \(dragCreateState && dragCreateState\.active\) \{\s*ensureDragPreview\(\);\s*\} else if \(eventComposerPreviewActive\) \{\s*scheduleEventComposerPreviewUpdate\(\);/,
    "Calendar refreshes must restore an open composer preview"
  );
  assert.match(
    eventComposerScript.text,
    /addEventButton\.addEventListener\("click", \(\) => \{\s*void openCalendarEventComposerAt\(\{ date: dateKey\(currentFocusDate\) \}\);/,
    "The main create action must enter through the calendar-anchored composer flow"
  );
  assert.match(
    eventComposerScript.text,
    /function closeEventModal\(\) \{[\s\S]*?deactivateEventComposerPreview\(\);[\s\S]*?stopDragCreate\(\);/,
    "Closing or successfully saving must remove only the temporary composer block"
  );
  assert.match(
    eventComposerScript.text,
    /function positionEventModal\(\)[\s\S]*?const edge = viewportWidth <= 820 \? 8 : 12;[\s\S]*?card\.offsetWidth \|\| 440[\s\S]*?const rightCandidate = anchorRight \+ gap;[\s\S]*?const leftCandidate = anchorLeft - width - gap;[\s\S]*?const rightFits = rightCandidate \+ width <= viewportWidth - edge;[\s\S]*?const leftFits = leftCandidate >= edge;[\s\S]*?eventModal\.dataset\.anchorSide = side;[\s\S]*?--composer-transform-origin/,
    "The composer must use its measured size to choose an adjacent side and remain inside the viewport"
  );
  assert.match(
    eventComposerScript.text,
    /function closeEventModal\(\)[\s\S]*?delete eventModal\.dataset\.anchorSide;[\s\S]*?removeProperty\("--composer-left"\)[\s\S]*?removeProperty\("--composer-top"\)[\s\S]*?removeProperty\("--composer-transform-origin"\)/,
    "Closing the composer must remove its transient anchor geometry"
  );
  const eventFormSnapshotStart = eventComposerScript.text.indexOf("function eventFormStateSnapshot()");
  const eventFormSnapshotEnd = eventComposerScript.text.indexOf(
    "function eventFormHasUnsavedChanges()",
    eventFormSnapshotStart
  );
  assert.ok(
    eventFormSnapshotStart >= 0 && eventFormSnapshotEnd > eventFormSnapshotStart,
    "The event draft snapshot function is incomplete"
  );
  const eventFormSnapshotSource = eventComposerScript.text.slice(
    eventFormSnapshotStart,
    eventFormSnapshotEnd
  );
  assert.match(
    eventFormSnapshotSource,
    /title: eventTitleInput\.value\.trim\(\)[\s\S]*?startDisplay: eventStartTimeInput\?\.value\.trim\(\)[\s\S]*?endDisplay: eventEndTimeInput\?\.value\.trim\(\)[\s\S]*?location: eventLocationInput\.value\.trim\(\)[\s\S]*?description: eventDescriptionInput\.value\.trim\(\)[\s\S]*?querySelectorAll\("input\[type='checkbox'\]:checked"\)[\s\S]*?\.map\(\(input\) => input\.value\)[\s\S]*?\.sort\(\)/,
    "Dirty-state comparison must cover meaningful text, visible time entry, and stable selected invitees"
  );
  assert.doesNotMatch(
    eventFormSnapshotSource,
    /disabled/,
    "Transient disabled controls must not make an untouched draft appear dirty"
  );
  assert.doesNotMatch(
    eventComposerScript.text,
    /window\.confirm\("Discard this event draft\?"\)/,
    "Event drafts must use the accessible in-app confirmation instead of a blocking browser prompt"
  );
  assert.match(
    eventComposerScript.text,
    /function openDiscardEventDraftDialog\(source\)[\s\S]*?discardEventDraftDialog\.showModal\(\);[\s\S]*?cancelDiscardEventDraftButton\?\.focus\(\{ preventScroll: true \}\)/,
    "Opening the discard confirmation must focus the safe action"
  );
  assert.match(
    eventComposerScript.text,
    /function attemptCloseEventModal\(source\)[\s\S]*?eventForm\.dataset\.saving === "true"[\s\S]*?eventFormHasUnsavedChanges\(\)[\s\S]*?openDiscardEventDraftDialog\(source\)[\s\S]*?closeEventModal\(\)/,
    "Only dirty, idle event drafts should open the discard confirmation"
  );
  assert.match(
    eventComposerScript.text,
    /confirmDiscardEventDraftButton\?\.addEventListener\("click",[\s\S]*?closeDiscardEventDraftDialog\(\{ restoreFocus: false, discardDraft: true \}\)[\s\S]*?enableDialogBackdropClose\(discardEventDraftDialog, closeDiscardEventDraftDialog\)[\s\S]*?discardEventDraftDialog\?\.addEventListener\("cancel",[\s\S]*?event\.preventDefault\(\);[\s\S]*?closeDiscardEventDraftDialog\(\)/,
    "Discard, backdrop, and Escape must resolve through the custom confirmation lifecycle"
  );
  assert.match(
    eventComposerScript.text,
    /function googleAuthUrl\([^)]*\)[\s\S]*?params\.set\("popup", "1"\);[\s\S]*?params\.set\("popupToken", popupToken\);[\s\S]*?return `\$\{popup \? "\/api\/auth\/google" : "\/auth\/google"\}\?\$\{params\.toString\(\)\}`;/,
    "Only the event-composer flow should use the popup OAuth endpoint"
  );
  assert.match(
    eventComposerScript.text,
    /function createGoogleAuthPopupToken\(\)[\s\S]*?crypto\.randomUUID\(\)[\s\S]*?crypto\.getRandomValues\(new Uint8Array\(24\)\)/,
    "Popup request IDs must come from a cryptographically secure browser source"
  );
  assert.match(
    eventComposerScript.text,
    /function openGoogleAuthPopup\(\)[\s\S]*?window\.open\(\s*googleAuthUrl\(currentRoom\.code, \{ calendarWrite: true, popup: true, popupToken \}\),\s*"GoogleAuthPopup",[\s\S]*?width=\$\{width\},height=\$\{height\}/,
    "Event sync authorization must open a bounded popup without navigating away from the draft"
  );
  assert.match(
    eventComposerScript.text,
    /async function handleGoogleAuthPopupMessage\(event\) \{[\s\S]*?event\.origin !== window\.location\.origin[\s\S]*?event\.source !== googleAuthPopup[\s\S]*?message\.type !== "commonground:google-oauth"[\s\S]*?message\.provider !== "google"[\s\S]*?message\.requestId !== googleAuthPopupToken[\s\S]*?!\["success", "error"\]\.includes\(message\.status\)/,
    "Popup results must be bound to the expected origin, window, provider, type, request, and status"
  );
  assert.match(
    eventComposerScript.text,
    /if \(message\.status === "error"\) \{[\s\S]*?const safeErrors = \{[\s\S]*?access_denied:[\s\S]*?provider_error:[\s\S]*?calendar_connection_failed:[\s\S]*?safeErrors\[message\.errorCode\] \|\| safeErrors\.calendar_connection_failed/,
    "Popup error codes must be mapped through trusted user-facing copy"
  );
  assert.match(
    eventComposerScript.text,
    /const refreshed = await refreshRoomData\(\);[\s\S]*?!calendarWriteReady\(\)[\s\S]*?eventGoogleSyncInput\.checked = true/,
    "A successful popup must refresh server state before enabling event sync"
  );
  assert.match(
    eventComposerScript.text,
    /function activateEventGoogleSyncRow\(event\) \{[\s\S]*?event\.preventDefault\(\);[\s\S]*?openGoogleAuthPopup\(\);[\s\S]*?eventGoogleSyncRow\?\.addEventListener\("click", activateEventGoogleSyncRow\);[\s\S]*?event\.key !== "Enter" && event\.key !== " "[\s\S]*?activateEventGoogleSyncRow\(event\);/,
    "The disconnected sync row must support pointer and keyboard popup activation"
  );
  assert.match(eventComposerScript.text, /window\.addEventListener\("message", handleGoogleAuthPopupMessage\);/);
  const oauthPopupPage = await publicSession.request("/oauth-popup.html", { accept: "text/html" });
  assert.match(oauthPopupPage.text, /<script src="\/oauth-popup\.js\?v=20260718-modal" defer><\/script>/);
  assert.match(oauthPopupPage.text, /<script src="\/site-guard\.js\?v=20260724-contextmenu" defer><\/script>/);
  assert.match(oauthPopupPage.text, /<img class="mark" src="\/icons\/icon-192\.png\?v=20260724-appicon-new" alt="" width="46" height="46" \/>/);
  assert.doesNotMatch(
    oauthPopupPage.text,
    /<script(?![^>]*\bsrc=)[^>]*>/i,
    "The OAuth relay must not require an inline-script CSP exception"
  );
  assert.match(oauthPopupPage.text, /id="oauthPopupStatus" role="status" aria-live="polite"/);
  assert.match(oauthPopupPage.text, /id="oauthPopupClose" type="button" hidden/);
  const oauthPopupScript = await publicSession.request("/oauth-popup.js", { accept: "text/javascript" });
  assert.match(
    oauthPopupScript.text,
    /new URLSearchParams\(window\.location\.hash\.slice\(1\)\)[\s\S]*?window\.history\.replaceState\(null, "", window\.location\.pathname\)/,
    "The relay must read its result from the fragment and promptly remove it from browser history"
  );
  assert.match(
    oauthPopupScript.text,
    /provider !== "google"[\s\S]*?!validStatus[\s\S]*?!validRequestId[\s\S]*?!validError/,
    "The relay must reject malformed or unrecognised OAuth results"
  );
  assert.match(
    oauthPopupScript.text,
    /const payload = \{\s*type: "commonground:google-oauth",\s*provider: "google",\s*status,\s*requestId\s*\};[\s\S]*?payload\.errorCode = error/,
    "The relay payload must use the exact typed, request-bound opener contract"
  );
  assert.match(oauthPopupScript.text, /window\.opener\.postMessage\(payload, window\.location\.origin\)/);
  assert.doesNotMatch(oauthPopupScript.text, /postMessage\([^,]+,\s*["']\*["']\s*\)/);
  assert.match(
    oauthPopupScript.text,
    /if \(!window\.opener \|\| window\.opener\.closed\)[\s\S]*?showCloseButton\(\)[\s\S]*?window\.setTimeout\(\(\) => \{\s*window\.close\(\);/,
    "The relay must remain understandable and closable when its opener is unavailable"
  );
  assert.match(eventComposerScript.text, /function updateFullscreenControl\(\)/);
  assert.match(eventComposerScript.text, /function setButtonLabelWithIcon\(button, label, iconClass\)/);
  assert.match(eventComposerScript.text, /function setPanelVisibility\(panel, visible/);
  assert.match(eventComposerScript.text, /function closeDialogWithMotion\(dialog, afterClose\)/);
  assert.match(
    eventComposerScript.text,
    /function formatDayHeader\(day\) \{[\s\S]*?class="day-header-date"[^>]*data-date="\$\{escapeAttribute\(dateKey\(day\.date\)\)\}"[^>]*aria-label="View \$\{escapeAttribute\(fullDate\)\} in week view"/,
    "Planner headers must render each date number as an accessible button"
  );
  assert.match(
    eventComposerScript.text,
    /const dateButton = header\.querySelector\("\.day-header-date"\);[\s\S]*?dateButton\?\.addEventListener\("click", async \(\) => \{\s*await goToDateInWeek\(day\.date\);/,
    "Planner date buttons must select the clicked date without leaving week view"
  );
  assert.match(
    eventComposerScript.text,
    /const dateButton = document\.createElement\("button"\);[\s\S]*?dateButton\.className = "month-date-number";[\s\S]*?dateButton\.setAttribute\("aria-label", `View \$\{formatFullDate\(date\)\} in week view`\);[\s\S]*?await openWeek\(\);/,
    "Month date numbers must open their selected date in week view"
  );
  assert.doesNotMatch(eventComposerScript.text, /cell\.setAttribute\("role", "button"\)/);
  assert.doesNotMatch(eventComposerScript.text, /cell\.tabIndex = 0/);
  assert.match(
    eventComposerScript.text,
    /node\.setAttribute\("aria-label", `View \$\{formatFullDate\(date\)\} in week view`\);[\s\S]*?await goToDateInWeek\(date\);/,
    "Year date buttons must open their selected date in week view"
  );
  assert.match(
    eventComposerScript.text,
    /async function goToDateInWeek\(date\) \{\s*const wasWeekView = currentView === "week";\s*currentFocusDate = startOfDay\(date\);\s*currentView = "week";\s*syncMiniCalendarToFocus\(\);\s*if \(wasWeekView\) \{\s*animateCalendarTransition\(render\);\s*return;\s*\}\s*await refreshCalendarAfterImmediateRender\(\);/,
    "Date navigation must retain the clicked date as the selection anchor and use week view"
  );
  assert.match(eventComposerScript.text, /input\.style\.setProperty\("--inline-name-width", `\$\{targetWidth\}px`\)/);
  assert.match(
    eventComposerScript.text,
    /<button class="identity-name-button"[^>]*>[\s\S]*?<\/button>\s*<details class="color-picker-menu topbar-identity-menu">\s*<summary class="color-picker-trigger topbar-color-trigger" aria-label="Choose your color, current \$\{escapeAttribute\(currentColorOption\.name\)\}">/,
    "The segmented identity must retain separate name and colour controls"
  );
  assert.match(eventComposerScript.text, /let roomSwitcherRenderSignature = "";/);
  assert.match(
    eventComposerScript.text,
    /const renderSignature = JSON\.stringify\(\{[\s\S]*?rooms: rooms\.map[\s\S]*?const expectedChildCount = rooms\.length \+ 1;[\s\S]*?renderSignature === roomSwitcherRenderSignature[\s\S]*?roomSwitcher\.childElementCount === expectedChildCount/,
    "Unchanged room tiles must keep their DOM and in-progress hover state"
  );
  assert.match(
    eventComposerScript.text,
    /<span class="room-switch-mark" aria-hidden="true">\s*<span class="ui-icon ui-icon-plus"><\/span>\s*<\/span>/,
    "The add-room icon must use the same 22px mark container as room icons"
  );
  assert.match(
    eventComposerScript.text,
    /function animateCalendarTransition\(renderAction\) \{\s*renderAction\(\);[\s\S]*?replayMotionClass\(calendarGrid, "is-view-entering", motionFastMs\);\s*\}/,
    "Calendar view motion must happen after an immediate render"
  );
  assert.doesNotMatch(
    eventComposerScript.text,
    /calendarGrid\.classList\.add\("is-view-exiting"\)[\s\S]*?setTimeout/,
    "Calendar view changes must not wait on a pre-render timeout"
  );
  assert.match(
    eventComposerScript.text,
    /async function refreshCalendarAfterImmediateRender\(\) \{\s*const refreshPromise = loadCalendarRangeWithMotion\(\);\s*animateCalendarTransition\(render\);\s*if \(await refreshPromise\) render\(\);\s*\}/,
    "The target timetable must render before free\/busy refresh completes"
  );
  assert.equal(
    (eventComposerScript.text.match(/await refreshCalendarAfterImmediateRender\(\);/g) || []).length,
    4,
    "View, period, Today, and drill-down changes must share the immediate-render path"
  );
  assert.match(
    eventComposerScript.text,
    /const generation = \+\+calendarLoadGeneration;[\s\S]*?if \(generation === calendarLoadGeneration\) \{\s*calendarStatus\?\.classList\.remove\("is-loading"\);/,
    "An older request must not clear the latest calendar loading state"
  );
  assert.match(
    eventComposerScript.text,
    /if \(currentView === "year"\) \{\s*freeBusyGeneration \+= 1;\s*const pendingController = freeBusyController;\s*freeBusyController = null;\s*pendingController\?\.abort\(\);/,
    "Year view must invalidate and release any older free\/busy request"
  );
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
  assert.match(
    eventComposerScript.text,
    /function setParticipantsPanelExpanded\(expanded\) \{[\s\S]*?roomPage\?\.classList\.toggle\("sidebar-collapsed", !isExpanded\)[\s\S]*?calendarSidebarButton\?\.setAttribute\("aria-expanded", String\(isExpanded\)\)/,
    "The application navigation must control the persistent Members sidebar"
  );
  assert.match(
    eventComposerScript.text,
    /const checkbox = document\.createElement\("input"\);[\s\S]*?checkbox\.className = "member-calendar-checkbox";[\s\S]*?checkbox\.type = "checkbox";[\s\S]*?checkbox\.checked = !isHidden;[\s\S]*?checkbox\.addEventListener\("change", \(\) => \{[\s\S]*?hiddenParticipantIds\.(?:delete|add)\(participant\.id\)[\s\S]*?renderCalendar\(\);/,
    "Members must render as accessible calendar visibility checkboxes backed by the existing participant state"
  );
  assert.match(
    eventComposerScript.text,
    /memberSearchInput\?\.addEventListener\("input", filterParticipantRows\)/,
    "The member search field must filter the persistent Members list"
  );
  for (const option of expectedParticipantPalette) {
    assert.ok(
      eventComposerScript.text.includes(`{ value: "${option.value}", name: "${option.name}" }`),
      `${option.name} is missing from the participant colour picker`
    );
  }
  assert.match(
    eventComposerScript.text,
    /\/\*\s*TODO: Commonground Free Block Rendering - Hidden for current demo[\s\S]*?for \(const segment of freeSegmentsForDate\(day\.date, occupiedSegments\)\) \{[\s\S]*?eventsLayer\.appendChild\(createFreeGlowBlock\(\{ \.\.\.segment, occupiedSegments \}, dayIndex\)\);[\s\S]*?\}\s*\*\//,
    "The complete Free-block injection loop must remain available but explicitly commented out for the current demo"
  );
  assert.match(
    eventComposerScript.text,
    /\/\* TODO: Commonground Free Block Rendering - Hidden for current demo \*\/\s*const showFreeBlocks = false;/,
    "Free-block rendering must be disabled behind an explicit demo flag"
  );
  assert.match(
    eventComposerScript.text,
    /function dragTargetIsBlocked\(target\) \{[\s\S]*?target\.closest\("\.event-card"\)\) return true;/,
    "Dragging an existing event must never arm the create-event gesture"
  );
  assert.match(
    eventComposerScript.text,
    /const canMove = Boolean\([\s\S]*?isOwnedByViewer[\s\S]*?!item\.continuesBefore[\s\S]*?!item\.continuesAfter[\s\S]*?!item\.allDay[\s\S]*?block\.addEventListener\("pointerdown", startEventMove\);/,
    "Only the viewer's complete, timed event blocks may start a move gesture"
  );
  assert.match(
    eventComposerScript.text,
    /function startEventMove\(event\)[\s\S]*?event\.target\.closest\("\.event-resize-handle"\)[\s\S]*?calendarEvent\.createdByParticipantId !== currentParticipant\?\.id[\s\S]*?setPointerCapture[\s\S]*?handleEventMoveMove[\s\S]*?handleEventMoveEnd/,
    "Moving an event must preserve edge resizing, ownership, pointer capture, and document-level drag tracking"
  );
  assert.match(
    eventComposerScript.text,
    /function resolveEventMovePreview\(state\)[\s\S]*?applyEventMovePreview\([\s\S]*?dayIndexFromPointer\(state\.moveX\)[\s\S]*?updateEventMoveFeedback\([\s\S]*?function scheduleEventMoveUpdate\(\)[\s\S]*?Math\.hypot\(deltaX, deltaY\) < eventMoveThresholdPixels[\s\S]*?resolveEventMovePreview\(state\)/,
    "Event moving must wait for a drag threshold and preview snapped time/day changes"
  );
  assert.match(
    eventComposerScript.text,
    /function updateCalendarBlockTimeText\(block, startMinute, durationMinute\)[\s\S]*?\[data-event-time-line="true"\][\s\S]*?formatEventRange\(startHour, endHour\)[\s\S]*?line\.textContent = parts\.join\(" \\u00b7 "\)/,
    "The existing time line inside each event block must render its snapped live range"
  );
  assert.match(
    eventComposerScript.text,
    /function updateEventMoveFeedback\(state, dayIndex, startMinute\)[\s\S]*?updateCalendarBlockTimeText\(state\.block, startMinute, state\.baseDurationMinute\)[\s\S]*?lastSnapStartMinute !== startMinute[\s\S]*?triggerEventMoveSnapFeedback\(state\)/,
    "A moving event must update its in-card time and tick once per 15-minute boundary"
  );
  assert.match(
    eventComposerScript.text,
    /function createSingleBusyCard\(segment, dayIndex\)[\s\S]*?configureCalendarBlockTimeLine\([\s\S]*?busy-line-compact[\s\S]*?configureCalendarBlockTimeLine\(appendLine\("busy-line-time"[\s\S]*?function createBusyStack/,
    "Google event blocks must tag their existing compact and full time lines for live updates"
  );
  assert.match(
    eventComposerScript.text,
    /configureCalendarBlockTimeLine\([\s\S]*?event-line-compact[\s\S]*?configureCalendarBlockTimeLine\([\s\S]*?event-line-meta[\s\S]*?function configureFreeGlowBlock/,
    "CommonGround event blocks must tag their existing compact and full time lines for live updates"
  );
  assert.match(
    eventComposerScript.text,
    /function applyEventResizePreview\(block, startMinute, durationMinute\)[\s\S]*?updateCalendarBlockTimeText\(block, snappedStart, snappedDuration\)/,
    "Top and bottom resizing must update the same in-card time range"
  );
  assert.match(
    eventComposerScript.text,
    /function resetEventMoveVisual\(block\)[\s\S]*?restoreCalendarBlockTimeText\(block\)/,
    "Cancelled or no-op event movement must restore the card's original time text"
  );
  assert.doesNotMatch(
    eventComposerScript.text,
    /event-move-time/,
    "Event dragging must not create a separate floating time popup"
  );
  assert.match(
    eventComposerScript.text,
    /function triggerEventMoveSnapFeedback\(state\)[\s\S]*?duration: eventMoveSnapFeedbackMs[\s\S]*?cubic-bezier\(0\.32, 0\.72, 0, 1\)[\s\S]*?scale\(0\.985\)[\s\S]*?scale\(1\.015\)/,
    "Each snapped interval must receive a fast transform/opacity click-like pulse"
  );
  assert.match(
    eventComposerScript.text,
    /async function handleEventMoveEnd\(event\)[\s\S]*?const releaseIsMove =[\s\S]*?markCalendarClickSuppressed\(\);[\s\S]*?cancelAnimationFrame\(eventMoveFrame\)[\s\S]*?resolveEventMovePreview\(state\)[\s\S]*?settleEventMoveVisual\(block\);[\s\S]*?stopEventMove\(\);[\s\S]*?render\(\);[\s\S]*?await fetchJson/,
    "Pointer release must suppress clicks, resolve the final snap, settle visually, and detach drag tracking before persistence"
  );
  assert.match(
    eventComposerScript.text,
    /const participantKey = participants[\s\S]*?item\.sourceId \|\| busyItemStableKey\(item\)[\s\S]*?return `\$\{participant\.participantId\}:\$\{itemKey\}`;/,
    "Adjacent Google events must retain distinct busy blocks so each event remains draggable"
  );
  assert.match(
    eventComposerScript.text,
    /async function handleEventMoveEnd\(event\)[\s\S]*?buildEventResizePayload\([\s\S]*?payload\.syncToGoogle = dayEvent\.syncToGoogle === true \|\| calendarEventSyncEnabled\(\);[\s\S]*?method: "PATCH"[\s\S]*?currentRoom\.events = currentRoom\.events\.map[\s\S]*?loadFreeBusy\(\)/,
    "Dropping an event must immediately persist the full payload, enable configured Google sync, and refresh busy data"
  );
  assert.match(
    eventComposerScript.text,
    /function createSingleBusyCard\(segment, dayIndex\)[\s\S]*?participant\.items\[0\]\?\.editable === true[\s\S]*?googleItem\?\.googleCalendarId[\s\S]*?googleItem\?\.googleEventId[\s\S]*?block\.addEventListener\("pointerdown", startGoogleBusyMove\);/,
    "A single native Google event must become movable only when its owner receives editable provider identity"
  );
  assert.match(
    eventComposerScript.text,
    /function startGoogleBusyMove\(event\)[\s\S]*?source: "google"[\s\S]*?calendarId,[\s\S]*?providerEventId,[\s\S]*?handleEventMoveEnd/,
    "Native Google busy blocks must use the shared thresholded move gesture"
  );
  assert.match(
    eventComposerScript.text,
    /const pendingEventMoveKeys = new Set\(\);[\s\S]*?pendingEventMoveKeys\.add\(moveKey\)[\s\S]*?pendingEventMoveKeys\.delete\(moveKey\)/,
    "An event must reject a second move while its optimistic background save is pending"
  );
  assert.match(
    eventComposerScript.text,
    /if \(isGoogleBusy\) \{[\s\S]*?\/google-calendar-events`[\s\S]*?calendarId: state\.calendarId[\s\S]*?eventId: state\.providerEventId[\s\S]*?await loadFreeBusy\(\);[\s\S]*?render\(\);/,
    "Dropping a native Google event must update Google immediately and refresh availability"
  );
  assert.match(
    eventComposerScript.text,
    /function dragTargetIsBlocked\(target\) \{\s*if \(target\.closest\("\.day-header, \.calendar-corner"\)\) return true;/,
    "The sticky calendar header must remain outside the drag-create surface"
  );
  assert.match(
    eventComposerScript.text,
    /function refreshLiveFreeBlocksForResize\([\s\S]*?if \(!showFreeBlocks\) \{[\s\S]*?calendarGrid\.querySelectorAll\("\.free-block"\)\.forEach\(\(block\) => block\.remove\(\)\);[\s\S]*?return;[\s\S]*?\}[\s\S]*?occupiedSegmentsForDate\([\s\S]*?freeSegmentsForDate\([\s\S]*?configureFreeGlowBlock\(/,
    "Live Free-block reflow must preserve its future implementation while returning immediately in the hidden demo"
  );
  assert.match(
    serverSource,
    /function syncedGoogleCalendarMirrorIntervals\([\s\S]*?roomEvent\.syncToGoogle !== true[\s\S]*?ownEntry\?\.googleEventId[\s\S]*?isInviteeMirror[\s\S]*?intervals\.push\(\{ start, end \}\)/,
    "Google mirror ranges must be identified for creators and invited participants"
  );
  assert.match(
    serverSource,
    /function subtractGoogleMirrorIntervals\([\s\S]*?mirror\.end <= fragment\.start[\s\S]*?mirror\.start > fragment\.start[\s\S]*?mirror\.end < fragment\.end[\s\S]*?return fragments\.filter/,
    "Google mirror ranges must be subtracted without discarding unrelated busy fragments"
  );
  assert.match(
    serverSource,
    /const mirroredIntervals = syncedGoogleCalendarMirrorIntervals\(room, participant, user\.id\);[\s\S]*?const hiddenIntervals = \[[\s\S]*?\.\.\.mirroredIntervals,[\s\S]*?\.\.\.editableEvents\.map[\s\S]*?subtractGoogleMirrorIntervals\(startDate, endDate, hiddenIntervals\)/,
    "Google free/busy must exclude CommonGround mirrors and owner-enriched events already rendered by the room"
  );
  assert.match(
    serverSource,
    /participant\.id === viewerParticipantId[\s\S]*?userHasGoogleCalendarWriteAccess\(user\)[\s\S]*?fetchGoogleCalendarEventsForRange[\s\S]*?editable: true,[\s\S]*?googleCalendarId:[\s\S]*?googleEventId:/,
    "Only the signed-in viewer with write scope may receive movable native Google event identity"
  );
  assert.match(
    serverSource,
    /function googleCalendarCanWriteEvents\(calendar = \{\}\)[\s\S]*?writerWithoutPrivateAccess[\s\S]*?function googleEventCanMove\(event = \{\}\)[\s\S]*?event\.locked !== true[\s\S]*?event\.guestsCanModify === true/,
    "Google move eligibility must include writable Workspace calendars and reject locked events"
  );
  assert.match(
    serverSource,
    /roomGoogleCalendarEventsMatch && req\.method === "PATCH"[\s\S]*?requireRoomParticipant[\s\S]*?userHasGoogleCalendarWriteAccess[\s\S]*?validateGoogleTimedEventMove[\s\S]*?fetchCalendarList[\s\S]*?googleCalendarCanWriteEvents[\s\S]*?!googleEventCanMove\(googleEvent\)[\s\S]*?isSyncedGoogleMirrorEvent[\s\S]*?method: "PATCH"[\s\S]*?sendUpdates: "all"/,
    "The native Google move endpoint must authorize ownership, reject mirrors, and patch timing directly"
  );
  assert.match(
    serverSource,
    /function deterministicGoogleCalendarEventId\([\s\S]*?createHash\("sha256"\)[\s\S]*?return `cg\$\{digest\}`;/,
    "Google event creation must use a deterministic provider ID"
  );
  assert.match(
    serverSource,
    /findGoogleCalendarMirrorEvent\(user\.id, "primary", room, event\)[\s\S]*?body: \{ id: deterministicEventId, \.\.\.payload \}[\s\S]*?error\.status !== 409[\s\S]*?method: "PATCH"/,
    "Google upserts must recover an existing mirror or PATCH the deterministic ID after a conflict"
  );
  assert.match(
    eventComposerScript.text,
    /function scheduleEventResizeUpdate\(\)[\s\S]*?applyEventResizePreview\([\s\S]*?refreshLiveFreeBlocksForResize\(/,
    "The event and Free-block previews must update in the same animation frame"
  );
  assert.match(
    eventComposerScript.text,
    /function resetEventResizeVisual\(\s*block,\s*startMinute = Number\(block\?\.dataset\.startMinute\),\s*durationMinute = Number\(block\?\.dataset\.durationMinute\)/,
    "Resize cancellation must be able to restore the original start and duration"
  );
  const eventComposerStyles = await publicSession.request("/styles.css", { accept: "text/css" });
  assert.match(
    eventComposerStyles.text,
    /\.event-card\.is-group-event,\s*\.event-card\.is-group-event\.invitee\s*\{(?=[^}]*rgba\(218, 165, 32, 0\.05\))(?=[^}]*rgba\(218, 165, 32, 0\.02\))(?=[^}]*border:\s*1px solid rgba\(218, 165, 32, 0\.3\))(?=[^}]*border-radius:\s*8px)(?=[^}]*0 0 16px rgba\(218, 165, 32, 0\.12\))(?=[^}]*inset 0 0 24px rgba\(218, 165, 32, 0\.08\))(?=[^}]*mix-blend-mode:\s*normal)[^}]*\}/s,
    "Group event cards must reuse the isolated former free-block gold glow"
  );
  assert.match(
    eventComposerStyles.text,
    /\.drag-create-preview\.event-card\.is-group-event\s*\{(?=[^}]*rgba\(218, 165, 32, 0\.05\))(?=[^}]*border:\s*1px solid rgba\(218, 165, 32, 0\.3\))(?=[^}]*0 0 16px rgba\(218, 165, 32, 0\.12\))[^}]*\}/s,
    "A multi-person draft preview must remain translucent while using the group glow"
  );
  assert.match(
    eventComposerStyles.text,
    /\.event-chip\.is-group-event\s*\{(?=[^}]*rgba\(218, 165, 32, 0\.05\))(?=[^}]*border:\s*1px solid rgba\(218, 165, 32, 0\.3\))[^}]*\}/s,
    "Month-view group events must preserve the same semantic gold treatment"
  );
  assert.match(
    eventComposerStyles.text,
    /\.common-ground-date-picker\[popover\]\s*\{[^}]*--date-picker-accent:\s*#b39458;[^}]*--date-picker-accent-strong:\s*#d1ad69;[^}]*width:\s*min\(296px, calc\(100vw - 16px\)\);[^}]*max-height:\s*calc\(100dvh - 16px\);[^}]*overflow-y:\s*auto;[^}]*background:\s*rgba\(24, 23, 22, 0\.98\);/s,
    "The shared picker must use CommonGround's compact dark-and-gold visual system and remain reachable on short screens"
  );
  assert.match(
    eventComposerStyles.text,
    /\.common-ground-date-picker-row\s*\{[^}]*grid-template-columns:\s*repeat\(7, minmax\(0, 1fr\)\);[^}]*\}[\s\S]*?\.common-ground-date-picker-day\.is-today:not\(\.is-selected\)\s*\{[^}]*color:\s*var\(--date-picker-accent-strong\);[^}]*box-shadow:\s*inset 0 0 0 1px rgba\(179, 148, 88, 0\.78\);[^}]*\}[\s\S]*?\.common-ground-date-picker-day\.is-selected\s*\{[^}]*background:\s*var\(--date-picker-accent\);[^}]*color:\s*#17140f;/s,
    "The six-week grid must keep today and the selected date distinct in the universal gold palette"
  );
  assert.match(
    eventComposerStyles.text,
    /@media \(max-height: 420px\)\s*\{[\s\S]*?\.common-ground-date-picker\[popover\]\s*\{[^}]*width:\s*min\(264px, calc\(100vw - 16px\)\);[^}]*padding:\s*8px;/,
    "Short landscape screens must receive a compact calendar layout"
  );
  assert.match(
    eventComposerStyles.text,
    /\.rsvp-control\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*center;[^}]*justify-content:\s*space-between;[^}]*min-height:\s*46px;[^}]*border-radius:\s*12px;/s,
    "The group-event RSVP control must be one compact horizontal surface"
  );
  assert.match(
    eventComposerStyles.text,
    /\.vote-button\s*\{[^}]*min-width:\s*62px;[^}]*min-height:\s*30px;[^}]*border-radius:\s*999px;[^}]*will-change:\s*transform, opacity;/s,
    "RSVP choices must use compact, compositor-ready pill buttons"
  );
  assert.match(
    eventComposerStyles.text,
    /\.vote-button:not\(:disabled\):active\s*\{[^}]*transition-duration:\s*var\(--motion-press\);[^}]*scale\(0\.96\);/s,
    "RSVP choices must retain the app's tactile press response"
  );
  assert.match(
    eventComposerStyles.text,
    /\.vote-button\.active\s*\{[^}]*background:\s*var\(--brand\);[^}]*border-color:\s*var\(--brand\);[^}]*color:\s*#fff;/s,
    "The selected RSVP choice must use CommonGround gold"
  );
  assert.doesNotMatch(
    eventComposerStyles.text,
    /\.response-groups?\s*\{|\.response-group\s*\{/,
    "The legacy stacked response-card styling must be removed"
  );
  assert.match(
    eventComposerScript.text,
    /function setVoteButtons\(responseValue\)[\s\S]*?const active = button\.dataset\.response === responseValue;[\s\S]*?button\.setAttribute\("aria-pressed", String\(active\)\);/,
    "RSVP selection must keep visual and pressed states synchronized"
  );
  assert.doesNotMatch(
    eventComposerScript.text,
    /renderResponseGroups|responseGroups/,
    "The client must not rebuild the removed response cards"
  );
  assert.match(
    eventComposerStyles.text,
    /\.location-autocomplete-menu\s*\{[^}]*position:\s*absolute;[^}]*opacity:\s*0;[^}]*transform:\s*translate3d\(0, -5px, 0\) scale\(0\.98\);[^}]*transition:[^}]*opacity var\(--motion-standard\) var\(--ease-standard\),[^}]*transform var\(--motion-standard\) var\(--ease-standard\);[^}]*will-change:\s*transform, opacity;/s,
    "Address suggestions must use a contained, compositor-safe popover"
  );
  assert.match(
    eventComposerStyles.text,
    /\.location-autocomplete-attribution\s*\{[^}]*font-family:\s*Roboto, Arial, sans-serif;[^}]*font-size:\s*12px;[^}]*font-weight:\s*400;[^}]*white-space:\s*nowrap;/s,
    "Displayed Places content must keep legible Google Maps attribution"
  );
  assert.match(
    eventComposerStyles.text,
    /#eventModal \.location-autocomplete-menu\s*\{[^}]*left:\s*40px;[^}]*right:\s*0;/s,
    "Composer suggestions must align with the location text rather than its icon"
  );
  assert.match(
    eventComposerStyles.text,
    /\.free-glow-block\s*\{\s*padding:\s*6px 7px;\s*\}\s*\}\s*\/\* CommonGround Command Centre \*\//,
    "The Command Centre styles must sit outside the legacy mobile calendar media block"
  );
  assert.match(
    eventComposerStyles.text,
    /\.command-centre-dialog\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;[^}]*background:\s*transparent;[^}]*overflow:\s*hidden;/s,
    "The Command Centre must own the full modal layer without native-dialog chrome"
  );
  assert.match(
    eventComposerStyles.text,
    /\.command-centre-panel\s*\{[^}]*width:\s*min\(680px, calc\(100vw - 32px\)\);[^}]*max-height:\s*min\(calc\(100dvh - 48px\), 700px\);[^}]*grid-template-rows:\s*auto minmax\(0, 1fr\);[^}]*border-radius:\s*16px;[^}]*will-change:\s*transform, opacity;/s,
    "The bounded Command Centre panel must use two rows after removing its visual shortcut footer"
  );
  assert.match(
    eventComposerStyles.text,
    /\.command-create-preview\s*\{[^}]*padding:\s*2px 4px 4px;[^}]*border:\s*0;[^}]*border-radius:\s*0;[^}]*background:\s*transparent;/s,
    "The create-event details must not add a second outer card around the editable content"
  );
  assert.match(
    eventComposerStyles.text,
    /\.command-schedule-row\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:[^}]*minmax\(140px, 1\.2fr\)[^}]*minmax\(84px, 0\.8fr\)[^}]*minmax\(84px, 0\.8fr\);[^}]*gap:\s*8px;/s,
    "Date and time controls must remain grouped in one responsive schedule row"
  );
  assert.match(
    eventComposerStyles.text,
    /\.command-create-preview \.command-preview-grid\s*\{[^}]*gap:\s*9px;[^}]*margin-top:\s*0;[^}]*\}[\s\S]*?\.command-create-preview \.command-field input,[\s\S]*?\.command-create-preview \.command-field textarea\s*\{[^}]*padding:\s*8px 10px;[^}]*font-size:\s*12px;[^}]*\}[\s\S]*?\.command-create-preview \.command-field textarea\s*\{[^}]*min-height:\s*48px;/s,
    "Create previews must use compact typography and spacing so their full form fits common laptop and tablet heights"
  );
  assert.match(
    eventComposerStyles.text,
    /@media \(max-width:\s*599px\)\s*\{[\s\S]*?\.command-schedule-row:not\(\.is-all-day\)\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto minmax\(0, 1fr\);[^}]*\}[\s\S]*?\.command-schedule-row:not\(\.is-all-day\) > \.command-date-field\s*\{[^}]*grid-column:\s*1 \/ -1;/s,
    "Small screens may stack the schedule row while retaining the scrollable Command Centre body"
  );
  assert.match(
    eventComposerStyles.text,
    /\.command-centre-completion\s*\{[^}]*position:\s*absolute[^}]*pointer-events:\s*none[^}]*opacity:\s*0[^}]*color:\s*rgba\(255,\s*255,\s*255,\s*0\.34\)[^}]*will-change:\s*transform,\s*opacity/s,
    "The grey completion layer must be visual-only and compositor-friendly"
  );
  assert.match(
    eventComposerStyles.text,
    /\.command-centre-completion-prefix\s*\{[^}]*visibility:\s*hidden[^}]*\}[\s\S]*?\.command-centre-completion-suffix\s*\{[^}]*color:\s*rgba\(255,\s*255,\s*255,\s*0\.34\)/s,
    "Only the untyped completion suffix may be visible"
  );
  assert.match(
    eventComposerStyles.text,
    /@media \(forced-colors:\s*active\)\s*\{[\s\S]*?\.command-centre-completion\s*\{[^}]*display:\s*none/s,
    "The purely visual completion layer must not interfere with forced-colors mode"
  );
  assert.match(
    eventComposerStyles.text,
    /@media \(max-width: 760px\)\s*\{[\s\S]*?#roomPage \.calendar-nav-actions > #commandCentreButton\s*\{[^}]*position:\s*fixed;[^}]*bottom:\s*max\(16px, env\(safe-area-inset-bottom\)\);[^}]*width:\s*50px;[\s\S]*?\.command-centre-panel\s*\{[^}]*width:\s*100%;[^}]*max-height:\s*calc\(100dvh - 54px\);/s,
    "Mobile must retain an accessible floating trigger and bottom-sheet layout"
  );
  assert.match(
    eventComposerStyles.text,
    /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.command-centre-dialog\[open\] \.command-centre-panel[\s\S]*?animation-duration:\s*1ms !important;/s,
    "Command Centre motion must respect reduced-motion preferences"
  );
  assert.match(eventComposerStyles.text, /#syncSettingsCard\s*\{[^}]*display:\s*none/s);
  assert.match(
    eventComposerStyles.text,
    /\.event-panel-time-grid\s*\{(?=[^}]*grid-template-columns:\s*minmax\(0, 1\.18fr\) minmax\(0, 0\.91fr\) minmax\(0, 0\.91fr\))(?=[^}]*gap:\s*12px)(?=[^}]*min-width:\s*0)[^}]*\}/s,
    "Group-event date, start, and end controls must keep a real gap without intrinsic-width collisions"
  );
  assert.match(
    eventComposerStyles.text,
    /\.detail-title-field\.hidden\s*\{[^}]*display:\s*none/s,
    "The editable detail title must replace rather than duplicate the static panel title"
  );
  assert.match(
    eventComposerStyles.text,
    /\.time-picker-surface \.time-picker-dropdown\s*\{(?=[^}]*position:\s*absolute)(?=[^}]*background:\s*var\(--time-picker-popover\))(?=[^}]*box-shadow:\s*0 8px 24px rgba\(0, 0, 0, 0\.5\))[^}]*\}/s,
    "All CommonGround editing surfaces must share the same elevated time menu"
  );
  assert.match(
    eventComposerStyles.text,
    /\.time-picker-surface \.time-picker-option\.is-selected \.time-picker-clock\s*\{[^}]*color:\s*var\(--time-picker-accent\)/s,
    "The universal picker must use the CommonGround accent rather than browser blue"
  );
  assert.match(eventComposerStyles.text, /#eventModal \.event-composer\s*\{[^}]*font-family:\s*"Avenir Next", "Segoe UI Variable", Inter/s);
  assert.match(eventComposerStyles.text, /#eventModal \.composer-time-grid input\s*\{[^}]*font-size:\s*15px[^}]*font-weight:\s*650[^}]*font-variant-numeric:\s*tabular-nums/s);
  assert.match(
    eventComposerStyles.text,
    /#eventModal \.composer-time-grid \.time-picker-input\s*\{(?=[^}]*background:\s*transparent)(?=[^}]*color:\s*var\(--composer-ink\))(?=[^}]*border:\s*0)(?=[^}]*border-radius:\s*6px)[^}]*\}/s,
    "Hybrid time fields must read as clean clickable text instead of enclosed controls"
  );
  assert.match(
    eventComposerStyles.text,
    /#eventModal \.composer-time-grid \.time-picker-input:hover\s*\{[^}]*background:\s*rgba\(255, 255, 255, 0\.05\)/s,
    "Time fields must reveal only a restrained hover wash"
  );
  assert.doesNotMatch(
    eventComposerStyles.text,
    /#eventModal \.composer-time-grid \.time-picker-input[^{]*\{[^}]*(?:#8ab4f8|#3c4043|#355c91)/s,
    "The event time fields must not retain the legacy Google-blue treatment"
  );
  assert.match(
    eventComposerStyles.text,
    /#eventModal \.time-picker-dropdown\s*\{(?=[^}]*position:\s*absolute)(?=[^}]*background:\s*var\(--composer-popover\))(?=[^}]*box-shadow:\s*0 8px 24px rgba\(0, 0, 0, 0\.5\))(?=[^}]*animation:\s*event-time-picker-in var\(--motion-slow\) var\(--ease-modal\))(?=[^}]*will-change:\s*transform, opacity)[^}]*\}/s,
    "Time menus must float on a detached elevated surface with compositor-safe motion"
  );
  assert.match(eventComposerStyles.text, /#eventModal \.time-picker-list\s*\{[^}]*max-height:\s*240px[^}]*overflow-y:\s*auto[^}]*scrollbar-color:\s*rgba\(255, 255, 255, 0\.24\) transparent[^}]*scrollbar-width:\s*thin/s);
  assert.match(eventComposerStyles.text, /#eventModal \.time-picker-list::-webkit-scrollbar-button\s*\{[^}]*display:\s*none[^}]*width:\s*0[^}]*height:\s*0/s);
  assert.match(
    eventComposerStyles.text,
    /#eventModal \.time-picker-option:hover,\s*#eventModal \.time-picker-option\.is-active\s*\{[^}]*background:\s*rgba\(255, 255, 255, 0\.06\)/s,
    "Pointer and keyboard-highlighted time options must share the same visual state"
  );
  assert.match(
    eventComposerScript.text,
    /function generateTimePickerSlots\(stepMinutes = 15\)[\s\S]*?minutes < 24 \* 60[\s\S]*?minutes \+= normalizedStep/,
    "The picker must generate a full day in configurable 15-minute increments"
  );
  assert.match(
    eventComposerScript.text,
    /function parseFuzzyTimeInput\(value\)[\s\S]*?\^\\d\{1,2\}:\\d\{1,2\}\$[\s\S]*?\^\\d\{1,4\}\$[\s\S]*?hours \+= 12/,
    "Manual time entry must accept compact and colon-delimited fuzzy values and default ambiguous hours to PM"
  );
  assert.match(
    eventComposerScript.text,
    /function formatTimePickerDuration\(durationMinutes\)[\s\S]*?durationMinutes < 60[\s\S]*?durationMinutes === 60[\s\S]*?durationMinutes \/ 60/,
    "End-time options must expose minute, singular-hour, and decimal-hour durations"
  );
  assert.match(
    eventComposerScript.text,
    /function eventTimePickerOptions\(picker\)[\s\S]*?minutes > startMinutes[\s\S]*?timelineMinutes:\s*1440[\s\S]*?durationMinutes:\s*1440 - startMinutes/,
    "End-time options must begin after the selected start and retain next-day midnight"
  );
  assert.match(
    eventComposerScript.text,
    /function handleEventTimePickerKeydown\(event, picker\)[\s\S]*?ArrowDown[\s\S]*?ArrowUp[\s\S]*?Enter[\s\S]*?Escape[\s\S]*?Tab/,
    "Time inputs must support full keyboard selection and dismissal"
  );
  assert.match(
    eventComposerScript.text,
    /function dismissOutsideFloatingSurfaces\(target\)[\s\S]*?activeEventTimePicker[\s\S]*?closeEventTimePicker\(\{ commit: true \}\)/,
    "Time menus must participate in the app-wide outside-click dismissal guard"
  );
  assert.match(
    eventComposerScript.text,
    /function setAllDayMode\(enabled\)[\s\S]*?eventStartTimeInput\.disabled[\s\S]*?eventEndTimeInput\.disabled[\s\S]*?closeEventTimePicker\(\)/,
    "All-day mode must disable and close both visible time controls"
  );
  assert.match(
    eventComposerScript.text,
    /function openEventModal\(mode = "create", options = \{\}\)[\s\S]*?syncEventTimePickerDisplays\(\);[\s\S]*?eventModal\.showModal\(\)/,
    "Programmatic edit, drag, and default values must be synchronized before the composer opens"
  );
  assert.match(
    eventComposerScript.text,
    /function setDetailTitleEditing\(editing\)[\s\S]*?detailTitle\?\.classList\.toggle\("hidden", Boolean\(editing\)\)[\s\S]*?detailTitleField\?\.classList\.toggle\("hidden", !editing\)/,
    "Group-event mode must expose the editable title as the only visible title"
  );
  assert.match(
    eventComposerScript.text,
    /function registerEventTimePickerField\(field\)[\s\S]*?const context = field\.closest\("#commandCentreDialog"\)[\s\S]*?startCanonicalInput:[\s\S]*?eventTimePickers\.push\(picker\)/,
    "The picker initializer must support static and dynamically rendered CommonGround surfaces"
  );
  assert.match(
    eventComposerScript.text,
    /window\.CommonGroundTimePicker = \{[\s\S]*?initialize: initializeEventTimePickers,[\s\S]*?commit: commitTimePickersWithin,[\s\S]*?setDisabled\(root, disabled\)/,
    "Dynamic editors must use the shared initialization, validation, and disabled-state API"
  );
  assert.match(
    eventComposerScript.text,
    /function formatRange\(\{ includeYear = false \} = \{\}\)[\s\S]*?typeof rangeFormatter\.formatRange === "function"[\s\S]*?rangeFormatter\.formatRange\(start, end\)[\s\S]*?sameMonth[\s\S]*?sameYear/,
    "Week labels must use compact, locale-aware ranges with a compatibility fallback"
  );
  assert.match(
    eventComposerScript.text,
    /function updateCalendarPeriodControls\(\)[\s\S]*?const periodText = calendarPeriodText\(\);[\s\S]*?const accessiblePeriodText = calendarPeriodText\(\{ includeYear: true \}\);[\s\S]*?calendarPeriodLabel\.textContent = periodText;[\s\S]*?calendarPeriodLabel\.title = accessiblePeriodText;[\s\S]*?setAttribute\("aria-label", `Calendar period: \$\{accessiblePeriodText\}`\)/,
    "The full period must remain available to pointer and assistive-technology users"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.calendar-nav-primary\s*\{[^}]*flex:\s*1 1 0;[^}]*overflow:\s*visible;/s,
    "The primary navigation must preserve complete button and focus-ring edges"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.calendar-nav-actions\s*\{[^}]*flex:\s*0 0 auto;/s,
    "Calendar actions must retain their usable width"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.calendar-utility-actions\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*center;[^}]*gap:\s*4px;/s,
    "Reload, fullscreen, and Settings must render as one compact utility group"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.calendar-google-button,\s*#roomPage \.calendar-google-button\.needs-connection,[\s\S]*?#roomPage \.calendar-google-button\.is-connected\s*\{[^}]*min-height:\s*40px;[^}]*border-radius:\s*10px;[^}]*background:\s*linear-gradient\(135deg, #c4a05a, #9a7538\);[^}]*color:\s*#17140f;/s,
    "The state-driven primary CTA must use CommonGround's premium gold hierarchy"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.command-centre-trigger\s*\{[^}]*border-color:\s*rgba\(255, 255, 255, 0\.14\);[^}]*background:\s*transparent;[^}]*color:\s*rgba\(232, 234, 237, 0\.78\);/s,
    "Ask CommonGround must remain a clear but secondary outlined action"
  );
  assert.match(
    eventComposerStyles.text,
    /@media \(max-width: 980px\)\s*\{[\s\S]*?#roomPage \.calendar-google-button > span:last-child\s*\{[^}]*display:\s*inline;/s,
    "Laptop layouts must retain the primary CTA label while space remains available"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.google-connection-indicator > span:last-child\s*\{[^}]*position:\s*absolute;[^}]*clip-path:\s*inset\(50%\);/s,
    "Connected state must expose only the anchored status dot while retaining an accessible label"
  );
  assert.match(
    eventComposerStyles.text,
    /@media \(max-width: 1180px\)\s*\{[\s\S]*?#roomPage \.topbar-identity > \.identity-name-button\s*\{[^}]*display:\s*grid;[^}]*width:\s*30px;[^}]*border-radius:\s*50%;/s,
    "Compact layouts must keep a real interactive profile control instead of a decorative pseudo-avatar"
  );
  assert.match(
    eventComposerStyles.text,
    /@media \(max-width: 860px\)\s*\{[\s\S]*?#roomPage \.calendar-nav-actions > #commandCentreButton,[\s\S]*?width:\s*34px;[\s\S]*?#roomPage \.calendar-google-button > span:last-child,[\s\S]*?display:\s*none;/s,
    "Tablet layouts must collapse the two long actions before the header becomes crowded"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.calendar-nav-actions > :not\(\.calendar-view-menu\):not\(\.calendar-utility-actions\):not\(#calendarGoogleButton\):not\(#commandCentreButton\)\s*\{\s*display:\s*none;/,
    "Mobile navigation cleanup must explicitly preserve the Google Calendar and Command Centre actions"
  );
  const phoneShellMediaStart = eventComposerStyles.text.lastIndexOf("@media (max-width: 480px)");
  const phoneShellMediaEnd = eventComposerStyles.text.indexOf("@media", phoneShellMediaStart + 1);
  assert.ok(phoneShellMediaStart >= 0, "The phone app-shell breakpoint is missing");
  const phoneShellStyles = eventComposerStyles.text.slice(
    phoneShellMediaStart,
    phoneShellMediaEnd >= 0 ? phoneShellMediaEnd : undefined
  );
  assert.doesNotMatch(
    phoneShellStyles,
    /#calendarGoogleButton/,
    "The Google Calendar action must remain reachable on phone-sized screens"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.calendar-period-label\s*\{[^}]*flex:\s*0 1 auto;[^}]*max-width:\s*clamp\(132px, 20vw, 280px\);/s,
    "The period label must remain bounded so right-side actions never overflow"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage\.calendar-app-shell\s*\{[^}]*--shell-grid-line:\s*#2d2d2d;/s,
    "The room shell must use one consistent subtle calendar grid-line color"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.participants-card\s*\{[^}]*gap:\s*16px;[^}]*\}[\s\S]*?#roomPage \.sidebar-room-card\s*\{[^}]*padding:\s*12px;[^}]*border:\s*0;[^}]*background:\s*transparent;/s,
    "The sidebar must use spacing and flat surfaces instead of nested card borders"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.sidebar-room-code-row\s*\{[^}]*gap:\s*0;[^}]*overflow:\s*hidden;[^}]*border-radius:\s*8px;[\s\S]*?#roomPage \.sidebar-room-code-row \.room-copy-inline\s*\{[^}]*border-left:\s*1px solid var\(--shell-line\);/s,
    "Room code and copy actions must read as one cohesive control"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.empty-room\s*\{[^}]*display:\s*none !important;[^}]*\}[\s\S]*?#roomPage \.calendar-connection-notice\s*\{[^}]*position:\s*absolute;[^}]*pointer-events:\s*none;/s,
    "The legacy invite strip must be removed while the disconnected notice overlays without stealing clicks"
  );
  assert.match(
    eventComposerStyles.text,
    /@media \(max-width: 760px\)\s*\{[\s\S]*?#roomPage \.calendar-nav-actions > #commandCentreButton\s*\{[^}]*position:\s*static;[\s\S]*?#roomPage \.calendar-google-button[^}]*width:\s*34px;[\s\S]*?#roomPage\[data-google-connected="true"\] \.calendar-google-button::after/s,
    "Phone layouts must keep both key actions anchored in the top bar and preserve a visible connected cue"
  );
  assert.match(
    eventComposerStyles.text,
    /:root\[data-theme="dark"\]\s*\{[^}]*--calendar-bg:\s*#121212;[^}]*--calendar-line:\s*rgba\(255, 255, 255, 0\.05\);/s,
    "Dark calendar canvases must use the flat #121212 surface and crisp grid line token"
  );
  assert.match(
    eventComposerStyles.text,
    /\.calendar-wrap\s*\{[^}]*background-color:\s*var\(--calendar-bg\);[^}]*background-image:\s*none;[^}]*box-shadow:\s*none;[^}]*filter:\s*none;[^}]*backdrop-filter:\s*none;/s,
    "The calendar wrapper must not retain gradient, shadow, filter, or blur effects"
  );
  assert.match(
    eventComposerStyles.text,
    /\.calendar-grid\s*\{[^}]*background-color:\s*var\(--calendar-bg\);[^}]*background-image:\s*none;[^}]*box-shadow:\s*none;[^}]*filter:\s*none;[^}]*backdrop-filter:\s*none;/s,
    "The calendar grid must be an opaque flat surface"
  );
  assert.match(
    eventComposerStyles.text,
    /\/\* TODO: Commonground Free Block Rendering - Hidden for current demo[\s\S]*?\.free-block\s*\{[\s\S]*?border:\s*1px solid rgba\(218, 165, 32, 0\.3\);[\s\S]*?background:\s*linear-gradient\(180deg, rgba\(218, 165, 32, 0\.05\) 0%, rgba\(218, 165, 32, 0\.02\) 100%\);[\s\S]*?box-shadow:\s*0 0 16px rgba\(218, 165, 32, 0\.12\), inset 0 0 24px rgba\(218, 165, 32, 0\.08\);[\s\S]*?\}\s*\*\//,
    "The future Free-block presentation must remain documented inside the explicit disabled-demo CSS comment"
  );
  assert.match(
    eventComposerStyles.text,
    /\.busy-card,\s*\.busy-stack,\s*\.event-card\s*\{[^}]*filter:\s*none;[^}]*backdrop-filter:\s*none;[^}]*mix-blend-mode:\s*normal;/s,
    "Scheduled and imported calendar blocks must use normal alpha compositing"
  );
  assert.match(
    eventComposerStyles.text,
    /\.event-card,\s*\.busy-card\s*\{[^}]*container-type:\s*inline-size/s,
    "Event labels must react to the width of their own calendar card"
  );
  assert.match(
    eventComposerStyles.text,
    /\.event-card \.event-line,\s*\.busy-card \.busy-line\s*\{[^}]*text-overflow:\s*ellipsis/s,
    "Long event and busy labels must truncate cleanly inside their boxes"
  );
  assert.match(
    eventComposerStyles.text,
    /\.event-card\.event-15 \.event-line-compact,\s*\.busy-card\.event-15 \.busy-line-compact\s*\{[^}]*padding-right:\s*0/s,
    "Single-line 15-minute cards must not reserve a duplicate time column"
  );
  assert.match(
    eventComposerStyles.text,
    /@container \(max-width: 190px\)\s*\{[\s\S]*?\.event-card \.event-line:not\(\.event-line-meta\),\s*\.busy-card \.busy-line:not\(\.busy-line-time\)\s*\{[^}]*padding-right:\s*0;[^}]*\}[\s\S]*?\.event-card:not\(\.event-15\):not\(\.event-30\) \.event-line-meta,\s*\.busy-card:not\(\.event-15\):not\(\.event-30\) \.busy-line-time\s*\{[^}]*position:\s*static;[^}]*width:\s*100%;[^}]*max-width:\s*100%;[^}]*text-align:\s*left;[^}]*\}[\s\S]*?\.event-card\.event-30 \.event-line-meta,\s*\.busy-card\.event-30 \.busy-line-title,\s*\.busy-card\.event-30 \.busy-line-time\s*\{[^}]*display:\s*none;/s,
    "Narrow cards must stack longer ranges and simplify short events without collisions"
  );
  assert.match(
    eventComposerStyles.text,
    /\.event-resize-handle\s*\{[^}]*left:\s*8px[^}]*right:\s*8px[^}]*height:\s*10px[^}]*background:\s*transparent[^}]*cursor:\s*ns-resize[^}]*pointer-events:\s*auto/s,
    "Only the narrow top and bottom resize strips may capture resize gestures"
  );
  assert.match(
    eventComposerStyles.text,
    /\.event-resize-handle::after\s*\{[^}]*opacity:\s*0[^}]*will-change:\s*transform, opacity[^}]*mask:\s*url\("\/icons\/move-vertical\.svg"\)/s,
    "Resize affordances must use the supplied move-vertical icon"
  );
  assert.match(
    eventComposerStyles.text,
    /\.event-resize-handle:hover::after[\s\S]*?\{[^}]*opacity:\s*1[^}]*scale\(1\)/,
    "A resize icon must appear only when its own edge strip is hovered"
  );
  assert.match(
    eventComposerStyles.text,
    /\.event-card\.is-moving,\s*\.busy-card\.is-moving\s*\{[^}]*cursor:\s*grabbing[^}]*opacity:\s*0\.92[^}]*transform:\s*translate3d\([^}]*transition:\s*none[^}]*will-change:\s*transform, opacity/s,
    "Live event movement must use a hardware-accelerated transform without layout animation"
  );
  assert.match(
    eventComposerStyles.text,
    /\.event-card\.is-move-committing,\s*\.busy-card\.is-move-committing\s*\{[^}]*cursor:\s*default[^}]*pointer-events:\s*none[^}]*opacity:\s*1[^}]*transform:\s*translate3d\([^}]*transition:\s*none[^}]*will-change:\s*transform/s,
    "A released event must immediately leave the grabbing state while preserving its dropped position"
  );
  assert.doesNotMatch(
    eventComposerStyles.text,
    /\.event-move-time/,
    "The stylesheet must not reintroduce a separate floating drag-time popup"
  );
  assert.match(
    eventComposerStyles.text,
    /\.event-card\.is-moving \[data-event-time-line="true"\],\s*\.busy-card\.is-moving \[data-event-time-line="true"\],\s*\.event-card\.is-resizing \[data-event-time-line="true"\]\s*\{[^}]*transform-origin:\s*left center[^}]*will-change:\s*transform, opacity/s,
    "The in-card live time line must receive hardware-accelerated snap feedback"
  );
  assert.match(
    eventComposerStyles.text,
    /\.event-move-snap-feedback\s*\{[^}]*inset:\s*-2px[^}]*opacity:\s*0[^}]*transform:\s*scale\(0\.985\)[^}]*will-change:\s*transform, opacity/s,
    "The snap tick must use an isolated transform/opacity feedback layer"
  );
  assert.doesNotMatch(
    eventComposerStyles.text,
    /\.event-card\.can-resize:hover \.event-resize-handle/,
    "Hovering an event's sides or body must not reveal both resize affordances"
  );
  assert.doesNotMatch(
    eventComposerStyles.text,
    /@media \(max-width: 480px\)\s*\{[\s\S]*?#roomPage #settingsButton\s*\{[\s\S]*?display:\s*none;/,
    "Mobile users must retain Settings access after the connected Google badge is hidden"
  );
  assert.match(
    eventComposerStyles.text,
    /\.emoji-picker-popover\[popover\]\s*\{[^}]*width: 320px[^}]*height: 400px[^}]*border: 1px solid rgba\(255, 255, 255, 0\.08\)[^}]*border-radius: 12px[^}]*background: rgba\(22, 22, 23, 0\.8\)[^}]*backdrop-filter: blur\(20px\)[^}]*box-shadow: 0 12px 40px rgba\(0, 0, 0, 0\.5\)[^}]*will-change: transform, opacity/s,
    "The emoji popover must retain the requested frosted-glass geometry"
  );
  assert.match(
    eventComposerStyles.text,
    /\.emoji-picker-grid\s*\{[^}]*grid-template-columns: repeat\(6, 1fr\)[^}]*gap: 8px[^}]*padding: 16px[^}]*overflow-y: auto/s,
    "The picker must render a six-column, 8px-grid result surface"
  );
  assert.match(eventComposerStyles.text, /#emojiPickerSearch::placeholder\s*\{[^}]*color: rgba\(255, 255, 255, 0\.35\)/s);
  assert.match(
    eventComposerStyles.text,
    /\.emoji-picker-cell\s*\{[^}]*font-size: 24px[^}]*transform: translate3d\(0, 0, 0\) scale\(1\)[^}]*will-change: transform, opacity/s
  );
  assert.match(
    eventComposerStyles.text,
    /\.emoji-picker-cell::before\s*\{[^}]*border-radius: 8px[^}]*background: rgba\(255, 255, 255, 0\.06\)[^}]*opacity: 0[^}]*transition: opacity var\(--motion-fast\) var\(--ease-standard\)/s
  );
  assert.match(eventComposerStyles.text, /\.emoji-picker-empty\s*\{[^}]*font-size: 12px[^}]*text-align: center/s);
  assert.match(
    eventComposerStyles.text,
    /\.home-grid\s*\{[^}]*grid-auto-rows:\s*1fr[^}]*align-items:\s*stretch/s,
    "Home cards must share equal-height grid tracks"
  );
  assert.match(
    eventComposerStyles.text,
    /\.action-card\s*\{[^}]*grid-template-rows:\s*auto minmax\(0, 1fr\) auto[^}]*align-content:\s*stretch/s,
    "Home card controls must share a consistent three-row layout"
  );
  assert.match(
    eventComposerStyles.text,
    /\.day-header\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)[^}]*justify-items:\s*center[^}]*text-align:\s*center/s,
    "Planner weekday labels and date buttons must share one centered axis"
  );
  assert.match(
    eventComposerStyles.text,
    /\.calendar-corner,\s*\.day-header\s*\{[^}]*position:\s*sticky[^}]*top:\s*0[^}]*z-index:\s*30[^}]*background-color:\s*var\(--calendar-bg\)/s,
    "The calendar header must remain an opaque sticky layer above scrolled event blocks"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.day-header\.selected \.day-header-date\s*\{[^}]*background:\s*transparent[^}]*color:\s*var\(--brand-strong\)/s,
    "Only the selected date number must use the universal CommonGround gold"
  );
  assert.doesNotMatch(
    eventComposerStyles.text,
    /#roomPage \.day-header\.today \.day-header-date\s*\{[^}]*#0b57d0/s,
    "The real-world current date must not retain a separate blue marker"
  );
  assert.match(
    eventComposerScript.text,
    /const isSelected = sameDate\(day\.date, currentFocusDate\);\s*header\.className = `day-header \$\{isSelected \? "selected" : ""\}`\.trim\(\);[\s\S]*?if \(isSelected\) dateButton\?\.setAttribute\("aria-current", "date"\);/s,
    "The planner must derive exactly one selected date from the current focus date"
  );
  assert.match(
    eventComposerStyles.text,
    /\.day-header-date\s*\{[^}]*display:\s*grid[^}]*place-items:\s*center[^}]*width:\s*34px[^}]*height:\s*34px[^}]*border-radius:\s*999px/s,
    "Planner date buttons must keep a uniform circular hit target"
  );
  assert.match(
    eventComposerStyles.text,
    /\.day-header-date:focus-visible\s*\{[^}]*outline:\s*2px solid[^}]*outline-offset:\s*2px/s,
    "Planner date buttons must retain a visible focus indicator in every date state"
  );
  assert.match(
    eventComposerStyles.text,
    /\.month-date-number\s*\{[^}]*appearance:\s*none[^}]*width:\s*24px[^}]*min-width:\s*24px[^}]*height:\s*24px[^}]*min-height:\s*24px[^}]*cursor:\s*pointer/s,
    "Month date buttons must retain a compact, uniform native-button footprint"
  );
  assert.match(
    eventComposerStyles.text,
    /\.topbar-identity\s*\{[^}]*--identity-control-height:\s*36px[^}]*display:\s*inline-flex[^}]*gap:\s*0[^}]*border:\s*1px solid var\(--line\)[^}]*border-radius:\s*999px/s,
    "The identity controls must render inside one outer pill"
  );
  assert.match(
    eventComposerStyles.text,
    /\.topbar-identity > \.topbar-identity-menu > \.topbar-color-trigger\s*\{[^}]*width:\s*36px[^}]*border:\s*0[^}]*border-left:\s*1px solid var\(--line\)[^}]*border-radius:\s*0 999px 999px 0/s,
    "The colour control must remain an independent right-hand segment"
  );
  assert.match(
    eventComposerStyles.text,
    /\.topbar-identity > input\.inline-name-input\s*\{[^}]*width:\s*clamp\([^}]*--inline-name-width/s,
    "Inline name editing must retain the name segment width"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.topbar-identity\s*\{[^}]*--identity-control-height:\s*34px[^}]*--identity-avatar-size:\s*30px[^}]*--identity-color-control-size:\s*30px[^}]*--identity-swatch-size:\s*12px[^}]*flex-wrap:\s*nowrap[^}]*align-items:\s*center[^}]*gap:\s*2px[^}]*min-width:\s*0[^}]*height:\s*var\(--identity-control-height\)/s,
    "The desktop identity control must use one compact, aligned geometry contract"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.topbar-identity::before\s*\{[^}]*width:\s*var\(--identity-avatar-size\)[^}]*height:\s*var\(--identity-avatar-size\)[^}]*transform:\s*translateY\(-50%\)/s,
    "The topbar avatar must stay centered on the shared identity axis"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.topbar-identity > \.topbar-identity-menu\s*\{[^}]*display:\s*grid[^}]*place-items:\s*center[^}]*flex:\s*0 0 var\(--identity-color-control-size\)[^}]*width:\s*var\(--identity-color-control-size\)[^}]*height:\s*var\(--identity-color-control-size\)/s,
    "The colour disclosure wrapper must match and center its visible trigger"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.topbar-identity > \.topbar-identity-menu > \.topbar-color-trigger > \.current-color-dot\s*\{[^}]*width:\s*var\(--identity-swatch-size\)[^}]*height:\s*var\(--identity-swatch-size\)[^}]*0 0 0 2px color-mix/s,
    "Only the topbar colour swatch must use the reduced visual footprint"
  );
  assert.match(
    eventComposerStyles.text,
    /@media \(max-width:\s*1180px\)[\s\S]*?#roomPage \.topbar-identity > \.topbar-identity-menu\s*\{[^}]*display:\s*none/s,
    "The compact laptop identity must not retain the desktop colour disclosure"
  );
  assert.match(
    eventComposerStyles.text,
    /#eventModal \.composer-field-row > input,\s*#eventModal \.composer-field-row > textarea\s*\{[^}]*min-height: 36px[^}]*padding: 6px 0[^}]*background: transparent[^}]*resize: none/s,
    "The sectioned composer fields must remain flat, compact, and non-resizing"
  );
  assert.match(eventComposerStyles.text, /\.color-option-list\s*\{[^}]*max-height: calc\(100dvh - 96px\)/s);
  assert.match(eventComposerStyles.text, /\.ui-icon\s*\{[^}]*width: 18px[^}]*height: 18px/s);
  assert.match(eventComposerStyles.text, /--motion-press:\s*100ms;/);
  assert.match(eventComposerStyles.text, /--motion-fast:\s*150ms;/);
  assert.match(eventComposerStyles.text, /--motion-standard:\s*250ms;/);
  assert.match(eventComposerStyles.text, /--motion-slow:\s*350ms;/);
  assert.match(eventComposerStyles.text, /--motion-page:\s*400ms;/);
  assert.match(eventComposerStyles.text, /--ease-standard:\s*cubic-bezier\(0\.32, 0\.72, 0, 1\);/);
  assert.match(eventComposerStyles.text, /--ease-modal:\s*cubic-bezier\(0\.16, 1, 0\.3, 1\);/);
  const approvedCurves = [
    "cubic-bezier(0.16,1,0.3,1)",
    "cubic-bezier(0.32,0.72,0,1)"
  ];
  const usedCurves = [...new Set(
    stripCssComments(eventComposerStyles.text)
      .match(/cubic-bezier\([^)]*\)/g)
      ?.map((curve) => curve.replace(/\s+/g, "")) || []
  )].sort();
  assert.deepEqual(usedCurves, approvedCurves, "Only the two approved motion curves may be used");
  const motionShorthands = [...stripCssComments(eventComposerStyles.text).matchAll(/(?:^|[;{])\s*(?:transition|animation)\s*:\s*([^;{}]+)/gim)];
  for (const [, shorthand] of motionShorthands) {
    assert.doesNotMatch(
      shorthand,
      /(?:^|[\s,])(?:linear|ease|ease-in|ease-out|ease-in-out)(?=$|[\s,])/i,
      `Motion shorthand must not use a generic timing keyword: ${shorthand.trim()}`
    );
  }
  assert.match(
    eventComposerStyles.text,
    /button:not\(:disabled\):active\s*\{[^}]*transition-duration:\s*var\(--motion-press\)[^}]*transition-timing-function:\s*var\(--ease-standard\)[^}]*transform:\s*translate3d\(0, 0, 0\) scale\(0\.96\)/s,
    "Buttons must compress to scale(.96) on press"
  );
  assert.match(
    eventComposerStyles.text,
    /\.modal\[open\] \.modal-card\s*\{[^}]*animation:\s*modal-in var\(--motion-slow\) var\(--ease-modal\) both[^}]*will-change:\s*transform, opacity[\s\S]*?@keyframes modal-in\s*\{[\s\S]*?from\s*\{[^}]*opacity:\s*0[^}]*transform:\s*translate3d\(0, 8px, 0\) scale\(0\.95\)/,
    "Shared modal entrances must use the restrained 350ms scale(.95) macro motion"
  );
  assert.match(
    eventComposerStyles.text,
    /#eventModal\[open\] \.event-composer\s*\{[^}]*animation:\s*event-composer-premium-in var\(--motion-slow\) var\(--ease-modal\) both[^}]*will-change:\s*transform, opacity/s,
    "The event composer must use its restrained 350ms entrance"
  );
  assert.match(
    eventComposerStyles.text,
    /@keyframes event-composer-premium-in\s*\{[\s\S]*?from\s*\{[^}]*opacity:\s*0[^}]*transform:\s*translate3d\(0, 8px, 0\) scale\(0\.95\)/,
    "The event composer entrance must start close to its final size"
  );
  assert.match(
    eventComposerStyles.text,
    /\.drag-create-preview\.event-card\s*\{[^}]*height:\s*var\(--preview-height, 0px\)[^}]*opacity:\s*0\.66[^}]*background:\s*color-mix\(in srgb, var\(--event-owner-color\)/s,
    "Drag previews must reuse event-card styling with only a translucent opacity"
  );
  assert.match(
    eventComposerStyles.text,
    /\.drag-create-preview\.event-card \.drag-create-preview-copy\s*\{[^}]*display:\s*contents/s,
    "Drag preview content must participate in the same event-card layout"
  );
  assert.match(
    eventComposerStyles.text,
    /\.drag-create-preview\.event-card::before,[\s\S]*?\.drag-create-preview\.event-card \.drag-create-preview-cap\s*\{[^}]*display:\s*none/s,
    "Drag previews must not carry the old golden-only cap treatment"
  );
  assert.match(eventComposerStyles.text, /\.drag-create-preview\s*\{[^}]*container-type:\s*inline-size/s);
  assert.match(eventComposerStyles.text, /\.drag-create-preview strong\s*\{[^}]*font-size:\s*clamp\(9px, 7\.2cqw, 12px\)[^}]*text-overflow:\s*clip/s);
  assert.match(
    eventComposerScript.text,
    /const titleText = String\(title \|\| ""\)\.trim\(\) \|\| "\(No title\)";/,
    "The translucent draft must show the live title with a no-title fallback"
  );
  assert.match(
    eventComposerScript.text,
    /function dismissOutsideFloatingSurfaces\(target\)[\s\S]*?function handleOutsideFloatingSurfacePointer\(event\)[\s\S]*?event\.stopImmediatePropagation\(\)/,
    "Outside clicks must dismiss an open surface before they can activate an underlying non-editable control"
  );
  assert.match(
    eventComposerScript.text,
    /function dismissOutsideFloatingSurfaces\(target\)[\s\S]*?weatherHourlyPopoverIsOpen\(\) \|\| weatherHourlyTrigger[\s\S]*?!weatherHourlyPopover\?\.contains\(target\)[\s\S]*?closeWeatherHourlyPopover\(\);[\s\S]*?dismissed = true;/,
    "Clicking away from hourly weather must close it through the shared consumed-click guard"
  );
  assert.match(
    eventComposerScript.text,
    /function targetAcceptsTextEntry\(target\)[\s\S]*?textarea:not\(:disabled\), input:not\(:disabled\), \[contenteditable="true"\][\s\S]*?\["text", "search", "email", "url", "tel", "password", "number"\]\.includes\(editable\.type\)[\s\S]*?function handleOutsideFloatingSurfacePointer\(event\)[\s\S]*?if \(targetAcceptsTextEntry\(event\.target\)\) return;/,
    "Dismissing a floating surface must preserve the first click and focus on writing fields"
  );
  assert.match(
    eventComposerScript.text,
    /document\.addEventListener\("pointerdown", handleOutsideFloatingSurfacePointer, true\);[\s\S]*?document\.addEventListener\("click", handleOutsideFloatingSurfaceClick, true\);/,
    "Outside surface dismissal must consume the follow-up click as well as the initial pointer press"
  );
  assert.doesNotMatch(
    eventComposerStyles.text,
    /scale\(0\.9\)/,
    "Macro entrances must not use the older, exaggerated scale(.90) start"
  );
  assert.match(
    eventComposerStyles.text,
    /\.color-option-list\s*\{[^}]*translate3d\(0, 8px, 0\) scale\(0\.95\)[^}]*animation:\s*color-menu-in var\(--motion-slow\) var\(--ease-modal\)/s,
    "Colour popovers must use the shared macro entrance"
  );
  assert.match(
    eventComposerStyles.text,
    /\.busy-stack-popover\s*\{[^}]*translate3d\(0, 8px, 0\) scale\(0\.95\)[^}]*transform var\(--motion-slow\) var\(--ease-modal\)/s,
    "Busy-stack popovers must use the shared macro entrance"
  );
  assert.match(
    eventComposerStyles.text,
    /\.invite-dropdown-panel\s*\{[^}]*translate3d\(0, 8px, 0\) scale\(0\.95\)[^}]*transform var\(--motion-slow\) var\(--ease-modal\)/s,
    "Invite popovers must use the shared macro entrance"
  );
  assert.match(
    eventComposerStyles.text,
    /\.month-cell:active:not\(:has\(button:active\)\)\s*\{[^}]*transition-duration:\s*var\(--motion-press\)[^}]*transform:\s*translate3d\(0, 0, 0\) scale\(0\.96\)/s,
    "Clickable month cells must provide tactile press feedback without compounding a child button press"
  );
  assert.match(
    eventComposerStyles.text,
    /\.detail-invitee-row:not\(\.is-readonly\):active\s*\{[^}]*transition-duration:\s*var\(--motion-press\)[^}]*scale\(0\.96\)/s,
    "Interactive invitee rows must use the shared press response"
  );
  assert.match(
    eventComposerStyles.text,
    /\.topbar-identity:has\(> \.identity-name-button:active\),\s*\.topbar-identity:has\(> \.topbar-identity-menu > \.topbar-color-trigger:active\)\s*\{[^}]*transition-duration:\s*var\(--motion-press\)[^}]*scale\(0\.96\)/s,
    "The segmented identity control must press as one visual surface"
  );
  assertCompositorOnlyMotion(eventComposerStyles.text);
  assertTransformOpacityKeyframes(eventComposerStyles.text);
  assert.match(eventComposerStyles.text, /\.ui-icon\s*\{[^}]*will-change:\s*transform, opacity/s);
  assert.match(eventComposerStyles.text, /\.icon\s*\{[^}]*will-change:\s*transform, opacity/s);
  assert.match(eventComposerStyles.text, /\.modal\.is-closing \.modal-card/);
  assert.match(
    eventComposerStyles.text,
    /\.calendar-grid\.is-view-entering\s*\{[^}]*animation:\s*calendar-view-enter var\(--motion-fast\) var\(--ease-standard\) both/s,
    "The new timetable should settle in quickly after it is already rendered"
  );
  assert.doesNotMatch(eventComposerStyles.text, /\.calendar-grid\.is-view-exiting\s*\{/);
  assert.match(
    eventComposerStyles.text,
    /@keyframes calendar-view-enter\s*\{[\s\S]*?from\s*\{[^}]*opacity:\s*0\.82[^}]*translateY\(2px\) scale\(0\.998\)/,
    "Calendar entrance must remain readable from its first painted frame"
  );
  assert.match(
    eventComposerStyles.text,
    /\.room-switch-tab\s*\{[^}]*width:\s*36px[^}]*max-width:\s*36px[^}]*transform var\(--motion-fast\) var\(--ease-standard\)[^}]*opacity var\(--motion-fast\) var\(--ease-standard\)/s,
    "Room tiles must keep a fixed footprint and use the shared fast hover motion"
  );
  assert.match(
    eventComposerStyles.text,
    /@media \(hover: hover\) and \(pointer: fine\)\s*\{[\s\S]*?button\.room-switch-tab:not\(:disabled\):hover\s*\{[^}]*opacity:\s*0\.98[^}]*translate3d\(0, -1px, 0\) scale\(1\.01\)/,
    "Room hover feedback must be compositor-only and limited to hover-capable pointers"
  );
  assert.match(
    eventComposerStyles.text,
    /button\.room-switch-tab:not\(:disabled\):active\s*\{[^}]*transition-duration:\s*var\(--motion-press\)[^}]*scale\(0\.96\)/s,
    "Room tiles must retain the shared tactile press response"
  );
  assert.match(
    eventComposerStyles.text,
    /\.room-switch-label,\s*\.room-switch-meta\s*\{[^}]*position:\s*absolute[^}]*clip-path:\s*inset\(50%\)[^}]*pointer-events:\s*none/s,
    "Room labels must stay accessible without changing the flex-row geometry"
  );
  assert.doesNotMatch(eventComposerStyles.text, /\.room-switch-tab\.is-expanded/);
  assert.doesNotMatch(
    eventComposerStyles.text,
    /\.room-switch-tab(?::hover|:focus(?:-visible)?)[^{]*\{[^}]*(?:max-width|padding-right)\s*:/s,
    "Hover and focus must not resize room tiles"
  );
  assert.match(
    eventComposerStyles.text,
    /#eventModal \.event-composer,\s*#eventModal\.anchored-composer \.modal-card,\s*#eventModal\.anchored-composer \.event-composer\s*\{[^}]*width: min\(440px, calc\(100vw - 24px\)\)[^}]*max-height: calc\(100dvh - 24px\)[^}]*overflow: visible/s,
    "The composer must stay within the viewport without introducing an inner scroll region"
  );
  assert.match(
    eventComposerStyles.text,
    /#eventModal \.event-composer\s*\{[^}]*grid-template-rows: auto auto auto auto auto[^}]*gap: 16px[^}]*padding: 16px[^}]*border-radius: 14px/s,
    "The desktop composer must keep its compact five-row hierarchy and 8px rhythm"
  );
  assert.match(eventComposerStyles.text, /#eventModal\s*\{[^}]*width: 100vw[^}]*height: 100dvh[^}]*max-width: none[^}]*overflow: visible/s);
  assert.match(
    eventComposerStyles.text,
    /:root\[data-theme="dark"\] #eventModal\s*\{[^}]*--composer-muted: #9aa0a6[^}]*--composer-accent: #d09e72[^}]*--composer-surface: #1e1e1e[^}]*--composer-popover: #292827/s,
    "The dark composer must use the neutral hierarchy and one warm tan accent"
  );
  assert.match(
    eventComposerStyles.text,
    /#eventModal ::selection\s*\{[^}]*background: color-mix\(in srgb, var\(--composer-accent\) 42%, transparent\)[^}]*color: var\(--composer-ink\)/s,
    "Composer text selection must use the warm accent instead of browser blue"
  );
  assert.match(
    eventComposerStyles.text,
    /#eventModal \.event-composer\s*\{[^}]*background: var\(--composer-surface\)/s,
    "The composer must use a solid surface instead of a decorative gradient"
  );
  assert.match(
    eventComposerStyles.text,
    /#eventModal \.composer-title\s*\{[^}]*border: 0[^}]*background: transparent[^}]*font-size: 26px[^}]*font-weight: 600/s,
    "The title must remain a large, seamless input"
  );
  assert.match(
    eventComposerStyles.text,
    /#eventModal \.composer-heading-section\s*\{[^}]*position: relative[^}]*display: grid[^}]*min-height: 36px[^}]*gap: 0[^}]*min-width: 0/s,
    "The title row must begin at the top of the composer"
  );
  assert.match(
    eventComposerStyles.text,
    /#eventModal \.composer-close\s*\{[^}]*position: absolute[^}]*top: 0[^}]*right: 0[^}]*z-index: 2/s,
    "The close button must not reserve vertical space above the title"
  );
  assert.match(
    eventComposerStyles.text,
    /input:placeholder-shown:not\(:focus\),\s*textarea:placeholder-shown:not\(:focus\)\s*\{[^}]*caret-color: transparent/s,
    "Only unfocused empty placeholder fields may hide their passive insertion caret"
  );
  assert.match(
    eventComposerStyles.text,
    /:is\([\s\S]*?input\[type="text"\][\s\S]*?textarea[\s\S]*?\):not\(:disabled\):focus\s*\{[^}]*caret-color: var\(--brand-strong\)/,
    "Focused writing fields must restore the CommonGround caret"
  );
  assert.match(
    eventComposerStyles.text,
    /#eventModal \.composer-title\s*\{[^}]*caret-color: var\(--composer-accent\)[^}]*cursor: text/s,
    "The event title must expose a visible caret and text cursor when clicked"
  );
  assert.match(
    eventComposerStyles.text,
    /#eventModal \.composer-field-row > input,\s*#eventModal \.composer-field-row > textarea\s*\{[^}]*caret-color: var\(--composer-accent\)[^}]*cursor: text/s,
    "Location and description fields must expose a visible caret and text cursor when clicked"
  );
  assert.match(
    eventComposerStyles.text,
    /#eventModal \.composer-schedule-section,\s*#eventModal \.composer-field-row\s*\{[^}]*grid-template-columns: 40px minmax\(0, 1fr\)[^}]*gap: 0[^}]*align-items: center/s,
    "Schedule and option rows must share one strict 40px icon gutter"
  );
  assert.match(eventComposerStyles.text, /#eventModal \.composer-row-icon,[\s\S]*?justify-self: center/s);
  assert.match(eventComposerStyles.text, /#eventModal \.composer-meta-section\s*\{[^}]*display: grid[^}]*gap: 10px/s);
  assert.match(
    eventComposerStyles.text,
    /#eventModal \.composer-time-grid\s*\{[^}]*padding: 0[^}]*border: 0[^}]*border-radius: 0[^}]*background: transparent[^}]*box-shadow: none/s,
    "Date and time controls must be separated by layout rather than an internal box"
  );
  assert.match(
    eventComposerStyles.text,
    /#eventModal \.composer-field-row\s*\{[^}]*min-height: 36px[^}]*padding: 0[^}]*border: 0[^}]*border-radius: 6px[^}]*background: transparent/s,
    "Composer option rows must retain flat, consistent geometry"
  );
  assert.match(
    eventComposerStyles.text,
    /#eventModal \.invite-dropdown-panel\s*\{[^}]*position: static[^}]*max-height: clamp\(88px, 22dvh, 160px\)[^}]*border: 0[^}]*border-radius: 0[^}]*background: transparent[^}]*box-shadow: none/s,
    "The invitee selector must stay in flow without a nested panel box"
  );
  assert.match(eventComposerStyles.text, /#eventModal \.composer-sync-toggle\s*\{[^}]*min-height: 44px[^}]*border: 0[^}]*border-radius: 6px/s);
  assert.match(
    eventComposerStyles.text,
    /#eventModal \.all-day-toggle input\s*\{[^}]*appearance: none[^}]*width: 18px[^}]*height: 18px[^}]*border: 0/s,
    "All-day must use a custom borderless checkbox"
  );
  assert.match(eventComposerStyles.text, /#eventModal \.all-day-toggle input:checked\s*\{[^}]*background: var\(--composer-accent\)/s);
  assert.match(eventComposerStyles.text, /#eventModal \.mini-toggle-ui\s*\{[^}]*width: 40px[^}]*height: 24px[^}]*border: 0/s);
  assert.match(eventComposerStyles.text, /#eventModal \.mini-toggle:has\(input:checked\) \.mini-toggle-ui\s*\{[^}]*background: var\(--composer-accent\)/s);
  assert.match(eventComposerStyles.text, /#eventModal \.oauth-spinner\s*\{[^}]*display: none[^}]*width: 18px[^}]*height: 18px/s);
  assert.match(
    eventComposerStyles.text,
    /#eventModal \.composer-sync-toggle\.is-authorizing \.oauth-spinner\s*\{[^}]*display: block[^}]*animation: composer-oauth-spin var\(--motion-page\) var\(--ease-standard\) infinite/s,
    "Popup authorization must expose a visible in-row progress state"
  );
  assert.match(eventComposerStyles.text, /#eventModal \.composer-sync-toggle\.is-connected\s*\{[^}]*animation: composer-sync-settle var\(--motion-slow\) var\(--ease-modal\) both[^}]*will-change: transform, opacity/s);
  assert.match(eventComposerStyles.text, /#eventModal \.composer-sync-toggle\.is-error small\s*\{[^}]*color: var\(--danger\)/s);
  assert.match(eventComposerStyles.text, /#eventModal #cancelEventSecondary\s*\{[^}]*border: 0[^}]*background: transparent/s);
  assert.match(
    eventComposerStyles.text,
    /#eventModal #saveEventButton\s*\{[^}]*border: 0[^}]*border-radius: 8px[^}]*background: var\(--composer-accent\)[^}]*color: #241b15/s,
    "Create event must be the single warm, high-contrast primary action"
  );
  assert.match(
    eventComposerStyles.text,
    /#discardEventDraftDialog\s*\{[^}]*width: min\(360px, calc\(100vw - 24px\)\)[^}]*overflow: visible/s,
    "The discard confirmation must stay compact on every viewport"
  );
  assert.match(
    eventComposerStyles.text,
    /#discardEventDraftDialog \.discard-event-draft-cancel\s*\{[^}]*border: 0[^}]*background: transparent/s,
    "Cancel must remain the quiet, non-destructive action"
  );
  assert.match(
    eventComposerStyles.text,
    /#discardEventDraftDialog \.discard-event-draft-confirm\s*\{[^}]*border: 0[^}]*background: #d09e72[^}]*color: #241b15/s,
    "Discard must use the CommonGround gold primary treatment"
  );
  assert.match(
    eventComposerStyles.text,
    /#discardEventDraftDialog \.discard-event-draft-actions button\s*\{[^}]*will-change: transform, opacity;[^}]*transition:[^}]*transform 150ms cubic-bezier\(0\.32, 0\.72, 0, 1\),[^}]*opacity 150ms cubic-bezier\(0\.32, 0\.72, 0, 1\)/s,
    "Discard actions must use compositor-only CommonGround motion"
  );
  assert.match(
    eventComposerScript.text,
    /const eventInviteDropdown = eventModal\?\.querySelector\("\.invite-dropdown"\);[\s\S]*?eventInviteDropdown\?\.addEventListener\("toggle", \(\) => \{\s*requestAnimationFrame\(positionEventModal\);/,
    "Opening the in-flow invitee selector must remeasure the anchored composer"
  );
  assert.doesNotMatch(
    eventComposerScript.text,
    /eventTitleInput\.(?:focus|select)\(/,
    "Opening the event composer must not place a text caret in the title"
  );
  assert.doesNotMatch(
    eventComposerScript.text,
    /function openCreateRoomModal\(\)[\s\S]*?quickRoomNameInput\?\.focus\(\)/,
    "Opening the room composer must not place a text caret in the room name"
  );
  assert.doesNotMatch(
    commandCentreScript.text,
    /memberSearchInput\.focus\(/,
    "Member navigation must not leave a text caret in the sidebar search field"
  );
  assert.match(
    commandCentreScript.text,
    /participantStrip\.querySelectorAll\("\.member-calendar-checkbox\[data-participant-id\]"\)[\s\S]*?checkbox\.dataset\.participantId === id[\s\S]*?memberCheckbox\?\.focus\(\{ preventScroll: true \}\)/,
    "Member navigation must move focus to the matched non-text control"
  );
  assert.match(eventComposerStyles.text, /@media \(max-width: 820px\)[\s\S]*?#eventModal \.event-composer[\s\S]*?width: min\(100vw - 16px, 360px\)/);
  assert.match(eventComposerStyles.text, /@media \(max-height: 720px\)[\s\S]*?#eventModal \.event-composer\s*\{[^}]*gap: 10px[^}]*padding: 14px 16px/s);
  assert.match(eventComposerStyles.text, /@media \(max-height: 560px\)[\s\S]*?#eventModal \.composer-sync-toggle small\s*\{[^}]*display: block[^}]*font-size: 11px/s);
  assert.match(
    eventComposerStyles.text,
    /@media \(max-height: 560px\)\s*\{[\s\S]*?#eventModal\s*\{[^}]*overflow-x: hidden[^}]*overflow-y: auto[^}]*overscroll-behavior: contain/s,
    "Only the outer dialog may scroll on genuinely short screens"
  );
  assert.match(
    eventComposerStyles.text,
    /@media \(max-height: 560px\)[\s\S]*?#eventModal \.event-composer\s*\{[^}]*max-height: none[^}]*overflow: visible/s,
    "The composer body must not clip detached time menus"
  );
  assert.match(eventComposerStyles.text, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?#eventModal\[open\] \.event-composer,[\s\S]*?animation-duration: 1ms !important/s);
  assert.doesNotMatch(eventComposerStyles.text, /\.composer-body\s*\{[^}]*overflow-y:\s*auto/s);
  assert.doesNotMatch(eventComposerStyles.text, /#eventModal \.event-composer\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(eventComposerStyles.text, /#roomPage\.calendar-app-shell\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*var\(--shell-sidebar-width\) minmax\(0, 1fr\)[^}]*grid-template-areas:\s*"nav nav"\s*"sidebar content"/s);
  assert.match(eventComposerStyles.text, /#roomPage\.calendar-app-shell\s*\{[^}]*--shell-nav-height:\s*56px/s);
  assert.match(eventComposerStyles.text, /@media \(max-width: 760px\)[\s\S]*?#roomPage\.calendar-app-shell,[\s\S]*?--shell-nav-height:\s*54px/s);
  assert.doesNotMatch(eventComposerStyles.text, /--shell-rail-width|grid-area:\s*rail|calendar-icon-rail/);
  assert.match(eventComposerStyles.text, /#roomPage \.calendar-app-nav\s*\{[^}]*grid-area:\s*nav[^}]*height:\s*var\(--shell-nav-height\)[^}]*background:\s*var\(--shell-panel\)/s);
  assert.match(eventComposerStyles.text, /#roomPage \.calendar-app-nav\s*\{[^}]*border-bottom:\s*0/s);
  assert.match(eventComposerStyles.text, /#roomPage \.calendar-nav-primary\s*\{[^}]*overflow:\s*visible/s);
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.calendar-today-button\s*\{[^}]*flex:\s*0 0 auto[^}]*height:\s*38px[^}]*margin-block:\s*2px[^}]*overflow:\s*visible[^}]*line-height:\s*1/s,
    "The Today control must remain fully visible inside the compact navigation bar"
  );
  assert.doesNotMatch(eventComposerStyles.text, /calendar-legal-links/);
  assert.match(eventComposerStyles.text, /#roomPage \.calendar-grid\s*\{[^}]*min-height:\s*calc\(100% \+ 1px\)/s);
  assert.match(eventComposerStyles.text, /#roomPage \.calendar-stage\s*\{[^}]*min-height:\s*0[^}]*overflow:\s*hidden/s);
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.room-content\s*\{[^}]*padding:\s*8px 10px 10px 8px[^}]*background:\s*var\(--shell-panel\)/s,
    "The calendar canvas must be inset from the application shell"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.calendar-wrap\s*\{[^}]*grid-row:\s*1[^}]*height:\s*100%[^}]*overflow:\s*auto[^}]*border:\s*1px solid var\(--shell-line\)[^}]*border-radius:\s*18px/s,
    "The calendar canvas must expose rounded popout edges on every side"
  );
  assert.doesNotMatch(eventComposerStyles.text, /#roomPage \.calendar-wrap\s*\{[^}]*border-radius:\s*\d+px\s+0/s);
  assert.match(
    eventComposerStyles.text,
    /@media \(max-width: 760px\)[\s\S]*?#roomPage \.calendar-today-button\s*\{[^}]*height:\s*34px[^}]*min-height:\s*34px/s,
    "The Today control must remain fully visible in the compact mobile navigation"
  );
  assert.match(
    eventComposerStyles.text,
    /\.calendar-grid\.year-view\s*\{[^}]*grid-template-columns:\s*repeat\(4, minmax\(150px, 1fr\)\)[^}]*grid-template-rows:\s*none[^}]*grid-auto-rows:\s*minmax\(214px, auto\)/s,
    "Year view must clear the planner's explicit hourly rows before laying out months"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.participants-sidebar\s*\{[^}]*grid-area:\s*sidebar[^}]*position:\s*relative[^}]*border-right:\s*0[^}]*background:\s*var\(--shell-panel\)[^}]*opacity:\s*1/s,
    "The Members sidebar must remain a seamless application-shell column without a divider"
  );
  assert.match(
    eventComposerStyles.text,
    /@media \(max-width: 760px\)[\s\S]*?#roomPage \.participants-sidebar\s*\{[^}]*position:\s*fixed[^}]*border-right:\s*0/s,
    "The compact Members drawer must not reintroduce the vertical divider"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.mini-calendar-grid\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*repeat\(7, minmax\(0, 1fr\)\)/s,
    "The sidebar mini calendar must retain its seven-column layout"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.member-calendar-checkbox:checked \+ \.member-checkbox-visual\s*\{[^}]*border-color:\s*var\(--member-color\)[^}]*background:\s*var\(--member-color\)/s,
    "Member checkboxes must expose a distinct per-member checked state"
  );
  assert.match(
    eventComposerStyles.text,
    /@media \(min-width: 900px\)[\s\S]*?\.calendar-grid\.week-view\s*\{[^}]*min-width:\s*0[^}]*minmax\(0, 1fr\)/
  );
  assert.match(eventComposerStyles.text, /@media \(prefers-reduced-motion: reduce\)[\s\S]*transition-duration: 1ms !important/);
  assert.doesNotMatch(eventComposerStyles.text, /transition:\s*all\b/);
  assert.match(
    eventComposerStyles.text,
    /\.weather-symbol\s*\{[^}]*width: 16px[^}]*height: 16px[^}]*background-color: currentColor[^}]*pointer-events: none[^}]*mask-image: var\(--weather-icon\)/s,
    "Inner weather glyphs must use the supplied vector masks while the wrapping button handles interaction"
  );
  assert.match(eventComposerStyles.text, /\.weather-trigger\s*\{[^}]*width: 28px[^}]*height: 28px[^}]*cursor: pointer[^}]*will-change: transform, opacity/s);
  assert.match(eventComposerStyles.text, /\.weather-symbol--planner\s*\{[^}]*position: absolute[^}]*top: 37px[^}]*left: calc\(50% \+ 16px\)/s);
  assert.match(eventComposerStyles.text, /\.weather-symbol--month\s*\{[^}]*position: absolute[^}]*top: 4px[^}]*right: 3px/s);
  assert.match(
    eventComposerStyles.text,
    /\.weather-high-low-tooltip\s*\{[^}]*position: fixed[^}]*opacity: 0[^}]*transform: translate3d\(0, 4px, 0\) scale\(0\.96\)[\s\S]*?\.weather-high-low-tooltip\[aria-hidden="false"\][^{]*\{[^}]*opacity: 1[^}]*scale\(1\)/s,
    "Daily high/low details must animate as a non-blocking viewport tooltip"
  );
  assert.match(
    eventComposerStyles.text,
    /\.weather-hourly-popover\[popover\]\s*\{[^}]*position: fixed[^}]*width: min\(352px[^}]*max-height: min\(520px[^}]*transform: translate3d\(0, 8px, 0\) scale\(0\.95\)[\s\S]*?\.weather-hour-row\s*\{[^}]*grid-template-columns: 48px 22px minmax\(0, 1fr\) 44px/s,
    "Hourly weather must use a compact top-layer popover and readable four-column rows"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.weather-attribution\s*\{[^}]*color: rgba\(232, 234, 237, 0\.52\)[^}]*font-size: 12px/s,
    "Google Weather attribution must remain legible in the calendar toolbar"
  );
  for (const iconAsset of expectedIconAssets) {
    const icon = await publicSession.request(`/icons/${iconAsset}`, { accept: "image/svg+xml" });
    assert.match(icon.text, /<svg[^>]*viewBox="0 0 24 24"/);
  }
  for (const iconAsset of expectedWeatherIconAssets) {
    const icon = await publicSession.request(`/icons/weather/${iconAsset}`, { accept: "image/svg+xml" });
    assert.match(icon.response.headers.get("content-type") || "", /^image\/svg\+xml/);
    assert.match(icon.text, /<svg[^>]*viewBox="0 0 24 24"/);
  }
  const commonGroundIcon = await publicSession.request("/icons/CommonGroundAppIcon.png", { accept: "image/png" });
  assert.match(commonGroundIcon.response.headers.get("content-type") || "", /^image\/png/);
  assert.ok(commonGroundIcon.text.length > 100_000, "The 512px CommonGround app icon asset is unexpectedly small");
  for (const [iconPath, minimumLength] of [
    ["/icons/icon-192.png", 20_000],
    ["/icons/apple-touch-icon.png", 20_000],
    ["/icons/favicon-32.png", 1_000],
    ["/icons/favicon-16.png", 500]
  ]) {
    const icon = await publicSession.request(iconPath, { accept: "image/png" });
    assert.match(icon.response.headers.get("content-type") || "", /^image\/png/);
    assert.ok(icon.text.length > minimumLength, `${iconPath} is unexpectedly small`);
  }
  const faviconIco = await publicSession.request("/icons/favicon.ico", { accept: "image/x-icon" });
  assert.match(faviconIco.response.headers.get("content-type") || "", /^image\/(vnd\.microsoft\.icon|x-icon)/);
  assert.ok(faviconIco.text.length > 4_000, "The multi-size favicon asset is unexpectedly small");
  const manifestResponse = await publicSession.request("/site.webmanifest", { accept: "application/manifest+json" });
  const manifest = JSON.parse(manifestResponse.text);
  assert.equal(manifest.name, "CommonGround");
  assert.deepEqual(
    manifest.icons.map((icon) => icon.sizes),
    ["192x192", "512x512"],
    "The install manifest must expose both CommonGround app-icon sizes"
  );
  const siteGuard = await publicSession.request("/site-guard.js", { accept: "text/javascript" });
  assert.match(siteGuard.text, /document\.addEventListener\(\s*"contextmenu"[\s\S]*?event\.preventDefault\(\)[\s\S]*?\{ capture: true \}/);
  const contentSecurityPolicy = home.response.headers.get("content-security-policy");
  assert.ok(contentSecurityPolicy, "CSP header is missing");
  assert.doesNotMatch(contentSecurityPolicy, /script-src[^;]*'unsafe-inline'/);
  assert.equal(home.response.headers.get("x-content-type-options"), "nosniff");
  assert.ok(home.response.headers.get("referrer-policy"), "Referrer-Policy header is missing");
  assert.equal(
    home.response.headers.get("permissions-policy"),
    "camera=(), microphone=(), geolocation=(self), payment=()",
    "Location permission must be limited to CommonGround itself"
  );
  const privacyPage = await publicSession.request("/privacy", { accept: "text/html" });
  const termsPage = await publicSession.request("/terms", { accept: "text/html" });
  for (const legalPage of [privacyPage, termsPage]) {
    assert.match(legalPage.text, /<link rel="icon" href="\/icons\/favicon\.ico\?v=20260724-appicon-new" sizes="any" \/>/);
    assert.match(legalPage.text, /<link rel="apple-touch-icon" sizes="180x180" href="\/icons\/apple-touch-icon\.png\?v=20260724-appicon-new" \/>/);
    assert.match(legalPage.text, /<img class="mark app-brand-icon" src="\/icons\/icon-192\.png\?v=20260724-appicon-new" alt="" width="46" height="46" \/>/);
    assert.match(legalPage.text, /<script src="\/site-guard\.js\?v=20260724-contextmenu" defer><\/script>/);
  }
  assert.match(privacyPage.text, /rounds your device latitude and longitude to roughly one kilometre/);
  assert.match(privacyPage.text, /not added to your room, shown to room members, or written to CommonGround's persistent database/);
  assert.match(privacyPage.text, /hourly history for only the previous 24 hours/);
  assert.match(privacyPage.text, /deny or revoke browser location permission; the calendar will continue working without weather symbols/);
  assert.match(termsPage.text, /Optional daily symbols, hourly forecasts, and recent hourly history include weather data from Google/);
  await publicSession.request("/api/auth/google", { method: "POST", expected: 405 });
  await publicSession.request("/api/auth/google?popup=1", { expected: 400 });
  const popupRequestId = "a1B2_c3D4-e5F6_g7H8-i9J0_k1L2-m3N4";
  await publicSession.request(
    `/api/auth/google?popup=1&popupToken=${popupRequestId}&calendarWrite=maybe`,
    { expected: 400 }
  );

  const popupAuthSession = new BrowserSession();
  const popupAuthorization = await popupAuthSession.request(
    `/api/auth/google?popup=1&popupToken=${popupRequestId}&calendarWrite=1`,
    { expected: 302 }
  );
  const popupAuthorizationLocation = popupAuthorization.response.headers.get("location");
  assert.ok(popupAuthorizationLocation, "Popup authorization redirect is missing");
  const popupAuthorizationUrl = new URL(popupAuthorizationLocation);
  assert.equal(popupAuthorizationUrl.origin, "https://accounts.google.com");
  assert.equal(popupAuthorizationUrl.searchParams.get("client_id"), "commonground-smoke-client");
  assert.equal(popupAuthorizationUrl.searchParams.get("redirect_uri"), `${baseUrl}/auth/google/callback`);
  assert.equal(popupAuthorizationUrl.searchParams.get("include_granted_scopes"), "true");
  assert.ok(
    popupAuthorizationUrl.searchParams.get("scope")?.split(" ").includes("https://www.googleapis.com/auth/calendar.events"),
    "The event-sync popup must request Google event-write permission"
  );
  const popupOauthState = popupAuthorizationUrl.searchParams.get("state");
  assert.match(popupOauthState || "", /^[a-f0-9]{32}$/);

  const popupDenied = await popupAuthSession.request(
    `/auth/google/callback?state=${encodeURIComponent(popupOauthState)}&error=access_denied`,
    { expected: 302 }
  );
  const popupRelayLocation = popupDenied.response.headers.get("location");
  assert.ok(popupRelayLocation, "Popup callback relay redirect is missing");
  const popupRelayUrl = new URL(popupRelayLocation, baseUrl);
  assert.equal(popupRelayUrl.pathname, "/oauth-popup.html");
  assert.equal(popupRelayUrl.search, "", "Popup result values must not be placed in the query string");
  const popupRelayResult = new URLSearchParams(popupRelayUrl.hash.slice(1));
  assert.deepEqual(Object.fromEntries(popupRelayResult), {
    provider: "google",
    status: "error",
    requestId: popupRequestId,
    errorCode: "access_denied"
  });

  const replayedPopupCallback = await popupAuthSession.request(
    `/auth/google/callback?state=${encodeURIComponent(popupOauthState)}&error=access_denied`,
    { expected: 302 }
  );
  assert.equal(
    replayedPopupCallback.response.headers.get("location"),
    "/?error=invalid_oauth_state",
    "OAuth state must be single-use"
  );

  const fullPageAuthSession = new BrowserSession();
  const fullPageAuthorization = await fullPageAuthSession.request(
    "/auth/google?calendarWrite=0",
    { expected: 302 }
  );
  const fullPageAuthorizationUrl = new URL(fullPageAuthorization.response.headers.get("location"));
  assert.ok(
    !fullPageAuthorizationUrl.searchParams.get("scope")?.split(" ").includes("https://www.googleapis.com/auth/calendar.events"),
    "The base full-page OAuth flow must retain least-privilege calendar scopes"
  );
  const fullPageOauthState = fullPageAuthorizationUrl.searchParams.get("state");
  const fullPageDenied = await fullPageAuthSession.request(
    `/auth/google/callback?state=${encodeURIComponent(fullPageOauthState)}&error=access_denied`,
    { expected: 302 }
  );
  assert.equal(
    fullPageDenied.response.headers.get("location"),
    "/?error=access_denied",
    "Non-popup Google OAuth must retain its full-page return contract"
  );
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

  const placesPath = `/api/rooms/${firstCode}/places/autocomplete`;
  await host.request(placesPath, { expected: 405 });
  await host.request(placesPath, { method: "POST", expected: 415 });
  await publicSession.request(placesPath, {
    method: "POST",
    expected: 403,
    body: { input: "10 Downing Street", sessionToken: "public-session" }
  });
  const shortPlacesQuery = await host.request(placesPath, {
    method: "POST",
    body: { input: "St", sessionToken: "short-query" }
  });
  assert.deepEqual(shortPlacesQuery.payload, { suggestions: [] });
  await host.request(placesPath, {
    method: "POST",
    expected: 400,
    body: { input: "Downing Street", sessionToken: "spaces are invalid" }
  });
  const missingPlacesConfiguration = await host.request(placesPath, {
    method: "POST",
    expected: 503,
    body: { input: "10 Downing Street", sessionToken: "smoke-session" }
  });
  assert.equal(missingPlacesConfiguration.payload.error, "Address suggestions are not configured.");
  assert.ok(!("key" in missingPlacesConfiguration.payload));

  const weatherPath = `/api/rooms/${firstCode}/weather/forecast`;
  await host.request(weatherPath, { expected: 405 });
  await host.request(weatherPath, { method: "POST", expected: 415 });
  await publicSession.request(weatherPath, {
    method: "POST",
    expected: 403,
    body: { latitude: 51.5, longitude: -0.12 }
  });
  await host.request(weatherPath, {
    method: "POST",
    expected: 400,
    body: { latitude: 91, longitude: -0.12 }
  });
  const missingWeatherConfiguration = await host.request(weatherPath, {
    method: "POST",
    expected: 503,
    body: { latitude: 51.5, longitude: -0.12 }
  });
  assert.equal(missingWeatherConfiguration.payload.error, "Weather forecasts are not configured.");
  assert.deepEqual(Object.keys(missingWeatherConfiguration.payload), ["error"]);

  const hourlyWeatherPath = `/api/rooms/${firstCode}/weather/hourly`;
  await host.request(hourlyWeatherPath, { expected: 405 });
  await host.request(hourlyWeatherPath, { method: "POST", expected: 415 });
  await publicSession.request(hourlyWeatherPath, {
    method: "POST",
    expected: 403,
    body: { latitude: 51.5, longitude: -0.12, date: "2026-08-04" }
  });
  await host.request(hourlyWeatherPath, {
    method: "POST",
    expected: 400,
    body: { latitude: 51.5, longitude: -0.12, date: "2026-02-30" }
  });
  const missingHourlyWeatherConfiguration = await host.request(hourlyWeatherPath, {
    method: "POST",
    expected: 503,
    body: { latitude: 51.5, longitude: -0.12, date: "2026-08-04" }
  });
  assert.equal(missingHourlyWeatherConfiguration.payload.error, "Weather forecasts are not configured.");
  assert.deepEqual(Object.keys(missingHourlyWeatherConfiguration.payload), ["error"]);

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

  const movedStart = "2026-07-21T11:15:00.000Z";
  const movedEnd = "2026-07-21T11:45:00.000Z";
  const movedEvent = await host.request(`/api/rooms/${firstCode}/events/${eventId}`, {
    method: "PATCH",
    body: {
      title: unchangedEvent.title,
      start: movedStart,
      end: movedEnd,
      timezone: unchangedEvent.timezone,
      allDay: false,
      location: unchangedEvent.location,
      description: unchangedEvent.description,
      syncToGoogle: unchangedEvent.syncToGoogle,
      syncToOutlook: unchangedEvent.syncToOutlook,
      inviteeParticipantIds: unchangedEvent.invitees.map((invitee) => invitee.participantId)
    }
  });
  assert.equal(movedEvent.payload.event.start, movedStart);
  assert.equal(movedEvent.payload.event.end, movedEnd);
  assert.equal(movedEvent.payload.event.location, "Cafe");
  assert.equal(movedEvent.payload.event.description, "Room-visible proposal");
  assert.equal(
    new Date(movedEvent.payload.event.end).getTime() - new Date(movedEvent.payload.event.start).getTime(),
    30 * 60 * 1000
  );
  await guest.request(`/api/rooms/${firstCode}/events/${eventId}`, {
    method: "PATCH",
    expected: 403,
    body: {
      title: movedEvent.payload.event.title,
      start: "2026-07-21T12:00:00.000Z",
      end: "2026-07-21T12:30:00.000Z",
      timezone: movedEvent.payload.event.timezone,
      inviteeParticipantIds: [hostId, guestId]
    }
  });

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
