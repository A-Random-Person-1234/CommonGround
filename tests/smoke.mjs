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
  assert.match(home.text, /CommonGround/);
  assert.match(home.text, /href="\/styles\.css\?v=20260724-app-icon"/);
  assert.match(home.text, /src="\/app\.js\?v=20260723-date-header"/);
  assert.match(home.text, /<meta name="theme-color" content="#101c31" \/>/);
  assert.match(home.text, /<link rel="icon" type="image\/png" href="\/icons\/CommonGroundAppIcon\.png\?v=20260724" \/>/);
  assert.match(home.text, /<link rel="apple-touch-icon" href="\/icons\/CommonGroundAppIcon\.png\?v=20260724" \/>/);
  assert.equal(
    (home.text.match(/src="\/icons\/CommonGroundAppIcon\.png"/g) || []).length,
    3,
    "The home, room-entry, and calendar product lockups must use the CommonGround icon"
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
  assert.match(home.text, /<dialog class="modal" id="eventModal" aria-labelledby="eventComposerTitle">/);
  const eventModalStart = home.text.indexOf('<dialog class="modal" id="eventModal"');
  const eventModalEnd = home.text.indexOf("</dialog>", eventModalStart);
  assert.ok(eventModalStart >= 0 && eventModalEnd > eventModalStart, "Event composer dialog markup is incomplete");
  const eventModalMarkup = home.text.slice(eventModalStart, eventModalEnd);
  assert.match(eventModalMarkup, /<form class="modal-card event-composer" id="eventForm">/);
  assert.doesNotMatch(eventModalMarkup, /<form[^>]*id="eventForm"[^>]*method="dialog"/);
  assert.match(eventModalMarkup, /<h2 class="sr-only" id="eventComposerTitle">Create a group event<\/h2>/);
  assert.match(eventModalMarkup, /<section class="composer-section composer-schedule-section" aria-label="Date and time">/);
  assert.match(eventModalMarkup, /<section class="composer-section composer-meta-section" aria-label="Event options">/);
  assert.match(eventModalMarkup, /<label class="mini-toggle" for="eventGoogleSyncInput" aria-label="Sync this event to Google Calendar">/);
  assert.match(eventModalMarkup, /<span class="oauth-spinner" aria-hidden="true"><\/span>/);
  assert.match(eventModalMarkup, /id="eventFormFeedback" role="status" aria-live="polite"/);
  assert.match(eventModalMarkup, /<label class="composer-field-row composer-input-row" for="eventLocationInput">/);
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
  assert.match(home.text, /class="ui-icon ui-icon-maximize" id="fullscreenIcon"/);
  assert.match(home.text, /composer-row-icon ui-icon ui-icon-clock/);
  assert.match(home.text, /button-with-icon[^>]*id="addEventButton"/);
  assert.match(
    home.text,
    /<button class="calendar-google-button needs-connection button-with-icon" id="calendarGoogleButton" type="button" title="Connect Google Calendar" aria-label="Connect Google Calendar">/,
    "The calendar top bar must expose an explicit Google Calendar connection entry point"
  );
  assertInOrder(
    home.text,
    ['id="calendarGoogleButton"', 'id="settingsButton"', 'id="calendarViewMenu"'],
    "The Google Calendar control must remain a first-class top-bar action"
  );
  assert.match(
    home.text,
    /<section class="room-page calendar-app-shell hidden" id="roomPage">\s*<header class="room-topbar calendar-app-nav">/,
    "The room page must expose the persistent calendar application shell with its top navigation as a direct child"
  );
  assert.match(
    home.text,
    /<\/header>\s*<aside class="participants-sidebar" id="participantsSidebar"[^>]*data-open="true">[\s\S]*?<div class="mini-calendar-grid" id="miniCalendarGrid"><\/div>[\s\S]*?<input id="memberSearchInput" type="search" placeholder="Search for people"[\s\S]*?<span>Members<\/span>[\s\S]*?<div class="participant-strip" id="participantStrip"><\/div>/,
    "The persistent left sidebar must contain the mini calendar, member search, and Members selection list"
  );
  assert.match(
    home.text,
    /<div class="calendar-grid" id="calendarGrid"><\/div>\s*<footer class="legal-links calendar-legal-links" aria-label="Legal links">/,
    "Legal links must remain below the calendar grid in the scroll flow"
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
  const eventComposerScript = await publicSession.request("/app.js", { accept: "text/javascript" });
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
    eventComposerScript.text,
    /function renderCalendarGoogleControl\(\)[\s\S]*?let label = "Connect Google";[\s\S]*?label = "Reconnect Google";[\s\S]*?label = "Enable Google sync";[\s\S]*?label = "Google synced";[\s\S]*?dataset\.googleAction = state === "is-connected" \? "manage" : "authorize";/,
    "The persistent Google control must clearly reflect connection, permission, reconnect, and ready states"
  );
  assert.match(
    eventComposerScript.text,
    /function renderCalendarGoogleControl\(\)[\s\S]*?classList\.toggle\("hidden", state === "is-connected"\);/,
    "The Google action control must disappear once fully connected while remaining available for action states"
  );
  assert.match(
    eventComposerScript.text,
    /function renderRoomMeta\(\)[\s\S]*?renderCalendarEventSyncControls\(\);\s*renderCalendarGoogleControl\(\);/,
    "Room refreshes must keep the persistent Google Calendar control in sync with server state"
  );
  assert.match(
    eventComposerScript.text,
    /calendarGoogleButton\?\.addEventListener\("click", \(\) => \{[\s\S]*?const shouldAuthorize =[\s\S]*?!calendarWriteReady\(\);[\s\S]*?window\.location\.href = googleAuthUrl\(currentRoom\.code, \{ calendarWrite: true \}\);[\s\S]*?setPanelVisibility\(hostPopover, true\);[\s\S]*?syncSettingsCard\?\.scrollIntoView/,
    "The top-bar control must request full calendar sync when needed and open sync settings once connected"
  );
  assert.match(
    eventComposerScript.text,
    /!settingsButton\.contains\(event\.target\) &&\s*!calendarGoogleButton\?\.contains\(event\.target\) &&/,
    "Opening connected Google settings from the top bar must not be cancelled by the document click handler"
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
    /function positionEventModal\(\)[\s\S]*?const edge = viewportWidth <= 820 \? 8 : 12;[\s\S]*?card\.offsetWidth \|\| 440[\s\S]*?const rightCandidate = anchorRight \+ gap;[\s\S]*?const leftCandidate = anchorLeft - width - gap;[\s\S]*?const rightFits = rightCandidate \+ width <= viewportWidth - edge;[\s\S]*?const leftFits = leftCandidate >= edge;[\s\S]*?eventModal\.dataset\.anchorSide = side;[\s\S]*?--composer-transform-origin/,
    "The composer must use its measured size to choose an adjacent side and remain inside the viewport"
  );
  assert.match(
    eventComposerScript.text,
    /function closeEventModal\(\)[\s\S]*?delete eventModal\.dataset\.anchorSide;[\s\S]*?removeProperty\("--composer-left"\)[\s\S]*?removeProperty\("--composer-top"\)[\s\S]*?removeProperty\("--composer-transform-origin"\)/,
    "Closing the composer must remove its transient anchor geometry"
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
  assert.match(oauthPopupPage.text, /<img class="mark" src="\/icons\/CommonGroundAppIcon\.png" alt="" width="46" height="46" \/>/);
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
    /function scheduleEventMoveUpdate\(\)[\s\S]*?Math\.hypot\(deltaX, deltaY\) < eventMoveThresholdPixels[\s\S]*?applyEventMovePreview\([\s\S]*?dayIndexFromPointer\(state\.moveX\)/,
    "Event moving must wait for a drag threshold and preview snapped time/day changes"
  );
  assert.match(
    eventComposerScript.text,
    /async function handleEventMoveEnd\(event\)[\s\S]*?const releaseIsMove =[\s\S]*?markCalendarClickSuppressed\(\);[\s\S]*?scheduleEventMoveUpdate\(\);[\s\S]*?await new Promise/,
    "A completed drag must suppress its synthetic click before yielding to an animation frame"
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
    /#roomPage \.calendar-nav-primary\s*\{[^}]*flex:\s*1 1 0;[^}]*overflow:\s*hidden;/s,
    "The primary navigation must yield only the space needed by fixed actions"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.calendar-nav-actions\s*\{[^}]*flex:\s*0 0 auto;/s,
    "Calendar actions must retain their usable width"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.calendar-google-button\s*\{[^}]*min-height:\s*38px;[^}]*border-radius:\s*999px;[^}]*will-change:\s*transform, opacity;/s,
    "The Google Calendar action must be a compact, tactile top-bar control"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.calendar-google-button\.needs-connection,\s*#roomPage \.calendar-google-button\.needs-permission\s*\{[^}]*background:\s*linear-gradient\(135deg, #b98454, #8a5a35\);[^}]*color:\s*#fff9f1;/s,
    "Disconnected and missing-permission states must use CommonGround's established gold primary treatment"
  );
  assert.match(
    eventComposerStyles.text,
    /@media \(max-width: 980px\)\s*\{[\s\S]*?#roomPage \.calendar-google-button\s*\{[^}]*width:\s*34px;[^}]*height:\s*34px;[^}]*border-radius:\s*50%;[^}]*\}[\s\S]*?#roomPage \.calendar-google-button > span:last-child\s*\{[^}]*display:\s*none;/s,
    "Narrow layouts must retain Google connection as a labelled icon button"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.calendar-nav-actions > :not\(\.calendar-view-menu\):not\(#settingsButton\):not\(#calendarGoogleButton\)\s*\{\s*display:\s*none;/,
    "Mobile navigation cleanup must explicitly preserve the Google Calendar action"
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
    /#roomPage \.calendar-period-label\s*\{[^}]*flex:\s*1 1 0;[^}]*max-width:\s*none;[^}]*font-size:\s*clamp\(16px, 1\.25vw, 20px\);/s,
    "The period label must size itself from the actual available navigation space"
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
  assert.match(eventComposerStyles.text, /\.drag-create-preview::before\s*\{[^}]*height:\s*var\(--preview-base-height[^}]*transform:\s*scaleY\(var\(--preview-scale/s);
  assert.match(eventComposerStyles.text, /\.drag-create-preview-cap\s*\{[^}]*transform:\s*translate3d\(0, var\(--preview-bottom-y, 0px\), 0\)/s);
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
  assert.match(eventComposerStyles.text, /#eventModal \.composer-heading-section\s*\{[^}]*display: grid[^}]*gap: 4px[^}]*min-width: 0/s);
  assert.match(
    eventComposerStyles.text,
    /#eventModal \.composer-schedule-section,\s*#eventModal \.composer-field-row\s*\{[^}]*grid-template-columns: 16px minmax\(0, 1fr\)[^}]*gap: 16px[^}]*align-items: center/s,
    "Schedule and option rows must share one aligned icon/content grid"
  );
  assert.match(eventComposerStyles.text, /#eventModal \.composer-meta-section\s*\{[^}]*display: grid[^}]*gap: 8px/s);
  assert.match(
    eventComposerStyles.text,
    /#eventModal \.composer-time-grid\s*\{[^}]*padding: 8px[^}]*border: 1px solid rgba\(255, 255, 255, 0\.08\)[^}]*border-radius: 8px[^}]*background: rgba\(255, 255, 255, 0\.03\)/s,
    "Date and time controls must read as one restrained scheduling section"
  );
  assert.match(
    eventComposerStyles.text,
    /#eventModal \.composer-field-row\s*\{[^}]*min-height: 36px[^}]*padding: 0 8px[^}]*border-radius: 8px/s,
    "Composer option rows must retain compact, consistent geometry"
  );
  assert.match(eventComposerStyles.text, /#eventModal \.composer-sync-toggle\s*\{[^}]*min-height: 44px[^}]*border-radius: 8px/s);
  assert.match(eventComposerStyles.text, /#eventModal \.mini-toggle-ui\s*\{[^}]*width: 40px[^}]*height: 24px/s);
  assert.match(eventComposerStyles.text, /#eventModal \.oauth-spinner\s*\{[^}]*display: none[^}]*width: 18px[^}]*height: 18px/s);
  assert.match(
    eventComposerStyles.text,
    /#eventModal \.composer-sync-toggle\.is-authorizing \.oauth-spinner\s*\{[^}]*display: block[^}]*animation: composer-oauth-spin var\(--motion-page\) var\(--ease-standard\) infinite/s,
    "Popup authorization must expose a visible in-row progress state"
  );
  assert.match(eventComposerStyles.text, /#eventModal \.composer-sync-toggle\.is-connected\s*\{[^}]*animation: composer-sync-settle var\(--motion-slow\) var\(--ease-modal\) both[^}]*will-change: transform, opacity/s);
  assert.match(eventComposerStyles.text, /#eventModal \.composer-sync-toggle\.is-error small\s*\{[^}]*color: var\(--danger\)/s);
  assert.match(eventComposerStyles.text, /\.invite-dropdown-panel\s*\{[^}]*position: absolute[^}]*max-height: min\(220px, calc\(100dvh - 160px\)\)[^}]*overflow-y: auto/s);
  assert.match(eventComposerStyles.text, /@media \(max-width: 820px\)[\s\S]*?#eventModal \.event-composer[\s\S]*?width: min\(100vw - 16px, 360px\)/);
  assert.match(eventComposerStyles.text, /@media \(max-height: 720px\)[\s\S]*?#eventModal \.event-composer\s*\{[^}]*gap: 10px[^}]*padding: 14px 16px/s);
  assert.match(eventComposerStyles.text, /@media \(max-height: 560px\)[\s\S]*?#eventModal \.composer-sync-toggle small\s*\{[^}]*display: block[^}]*font-size: 11px/s);
  assert.match(eventComposerStyles.text, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?#eventModal\[open\] \.event-composer,[\s\S]*?animation-duration: 1ms !important/s);
  assert.doesNotMatch(eventComposerStyles.text, /\.composer-body\s*\{[^}]*overflow-y:\s*auto/s);
  assert.doesNotMatch(eventComposerStyles.text, /#eventModal \.event-composer\s*\{[^}]*overflow-y:\s*auto/s);
  assert.match(eventComposerStyles.text, /#roomPage\.calendar-app-shell\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*var\(--shell-sidebar-width\) minmax\(0, 1fr\)[^}]*grid-template-areas:\s*"nav nav"\s*"sidebar content"/s);
  assert.doesNotMatch(eventComposerStyles.text, /--shell-rail-width|grid-area:\s*rail|calendar-icon-rail/);
  assert.match(eventComposerStyles.text, /#roomPage \.calendar-app-nav\s*\{[^}]*grid-area:\s*nav[^}]*height:\s*var\(--shell-nav-height\)[^}]*background:\s*var\(--shell-panel\)/s);
  assert.match(eventComposerStyles.text, /#roomPage \.calendar-legal-links\s*\{[^}]*position:\s*static[^}]*margin:\s*14px 14px 16px auto/s);
  assert.match(eventComposerStyles.text, /#roomPage \.calendar-grid\s*\{[^}]*min-height:\s*calc\(100% \+ 1px\)/s);
  assert.match(eventComposerStyles.text, /#roomPage \.calendar-stage\s*\{[^}]*min-height:\s*0[^}]*overflow:\s*hidden/s);
  assert.match(eventComposerStyles.text, /#roomPage \.calendar-wrap\s*\{[^}]*grid-row:\s*1[^}]*height:\s*100%[^}]*overflow:\s*auto/s);
  assert.match(
    eventComposerStyles.text,
    /\.calendar-grid\.year-view\s*\{[^}]*grid-template-columns:\s*repeat\(4, minmax\(150px, 1fr\)\)[^}]*grid-template-rows:\s*none[^}]*grid-auto-rows:\s*minmax\(214px, auto\)/s,
    "Year view must clear the planner's explicit hourly rows before laying out months"
  );
  assert.match(
    eventComposerStyles.text,
    /#roomPage \.participants-sidebar\s*\{[^}]*grid-area:\s*sidebar[^}]*position:\s*relative[^}]*border-right:\s*1px solid var\(--shell-line\)[^}]*background:\s*var\(--shell-panel\)[^}]*opacity:\s*1/s,
    "The Members sidebar must be a persistent application-shell column"
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
  for (const iconAsset of expectedIconAssets) {
    const icon = await publicSession.request(`/icons/${iconAsset}`, { accept: "image/svg+xml" });
    assert.match(icon.text, /<svg[^>]*viewBox="0 0 24 24"/);
  }
  const commonGroundIcon = await publicSession.request("/icons/CommonGroundAppIcon.png", { accept: "image/png" });
  assert.match(commonGroundIcon.response.headers.get("content-type") || "", /^image\/png/);
  assert.ok(commonGroundIcon.text.length > 100_000, "The CommonGround app icon asset is unexpectedly small");
  const contentSecurityPolicy = home.response.headers.get("content-security-policy");
  assert.ok(contentSecurityPolicy, "CSP header is missing");
  assert.doesNotMatch(contentSecurityPolicy, /script-src[^;]*'unsafe-inline'/);
  assert.equal(home.response.headers.get("x-content-type-options"), "nosniff");
  assert.ok(home.response.headers.get("referrer-policy"), "Referrer-Policy header is missing");
  const privacyPage = await publicSession.request("/privacy", { accept: "text/html" });
  const termsPage = await publicSession.request("/terms", { accept: "text/html" });
  for (const legalPage of [privacyPage, termsPage]) {
    assert.match(legalPage.text, /<link rel="icon" type="image\/png" href="\/icons\/CommonGroundAppIcon\.png\?v=20260724" \/>/);
    assert.match(legalPage.text, /<img class="mark app-brand-icon" src="\/icons\/CommonGroundAppIcon\.png" alt="" width="46" height="46" \/>/);
  }
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
