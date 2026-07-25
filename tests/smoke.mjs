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
  assert.match(home.text, /href="\/styles\.css\?v=20260725-invite-members"/);
  assert.match(home.text, /src="\/app\.js\?v=20260725-invite-members"/);
  assert.match(home.text, /src="\/command-centre-actions\.js\?v=20260725-flexible-availability"/);
  assert.match(home.text, /src="\/command-centre\.js\?v=20260725-flexible-availability"/);
  assert.doesNotMatch(home.text, /id="roomStatus"|sidebar-room-status/);
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
  assert.match(
    home.text,
    /<button class="command-centre-trigger" id="commandCentreButton"[^>]*aria-label="Ask CommonGround"[^>]*aria-haspopup="dialog"[^>]*aria-controls="commandCentreDialog"[^>]*aria-expanded="false">[\s\S]*?Ask CommonGround[\s\S]*?<kbd id="commandCentreShortcutHint">Ctrl K<\/kbd>/,
    "The calendar toolbar must expose an accessible Ask CommonGround trigger and shortcut hint"
  );
  assertInOrder(
    home.text,
    ['id="commandCentreButton"', 'id="calendarGoogleButton"', 'id="refreshButton"', 'id="fullscreenButton"', 'id="settingsButton"', 'id="calendarViewMenu"'],
    "Ask CommonGround, Google, reload, fullscreen, Settings, and the view menu must retain their toolbar order"
  );
  assert.match(
    home.text,
    /<dialog class="command-centre-dialog" id="commandCentreDialog" aria-labelledby="commandCentreTitle" aria-describedby="commandCentreDescription">[\s\S]*?<form class="command-centre-panel" id="commandCentreForm" novalidate>[\s\S]*?id="commandCentreInput" type="search"[^>]*maxlength="500"[^>]*placeholder="Create an event or find a time[\s\S]*?id="commandCentreStatus" role="status" aria-live="polite" aria-atomic="true"[\s\S]*?id="commandCentreBody" aria-live="off"/,
    "The Command Centre must use a labelled semantic dialog, bounded search input, and live status region"
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
    /<section class="room-page calendar-app-shell hidden" id="roomPage">\s*<header class="room-topbar calendar-app-nav">/,
    "The room page must expose the persistent calendar application shell with its top navigation as a direct child"
  );
  assert.match(
    home.text,
    …20808 tokens truncated…splay:\s*grid[^}]*grid-template-columns:\s*var\(--shell-sidebar-width\) minmax\(0, 1fr\)[^}]*grid-template-areas:\s*"nav nav"\s*"sidebar content"/s);
  assert.match(eventComposerStyles.text, /#roomPage\.calendar-app-shell\s*\{[^}]*--shell-nav-height:\s*56px/s);
  assert.match(eventComposerStyles.text, /@media \(max-width: 760px\)[\s\S]*?#roomPage\.calendar-app-shell,[\s\S]*?--shell-nav-height:\s*54px/s);
  assert.doesNotMatch(eventComposerStyles.text, /--shell-rail-width|grid-area:\s*rail|calendar-icon-rail/);
  assert.match(eventComposerStyles.text, /#roomPage \.calendar-app-nav\s*\{[^}]*grid-area:\s*nav[^}]*height:\s*var\(--shell-nav-height\)[^}]*background:\s*var\(--shell-panel\)/s);
  assert.doesNotMatch(eventComposerStyles.text, /calendar-legal-links/);
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
  const privacyPage = await publicSession.request("/privacy", { accept: "text/html" });
  const termsPage = await publicSession.request("/terms", { accept: "text/html" });
  for (const legalPage of [privacyPage, termsPage]) {
    assert.match(legalPage.text, /<link rel="icon" href="\/icons\/favicon\.ico\?v=20260724-appicon-new" sizes="any" \/>/);
    assert.match(legalPage.text, /<link rel="apple-touch-icon" sizes="180x180" href="\/icons\/apple-touch-icon\.png\?v=20260724-appicon-new" \/>/);
    assert.match(legalPage.text, /<img class="mark app-brand-icon" src="\/icons\/icon-192\.png\?v=20260724-appicon-new" alt="" width="46" height="46" \/>/);
    assert.match(legalPage.text, /<script src="\/site-guard\.js\?v=20260724-contextmenu" defer><\/script>/);
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
