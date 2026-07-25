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
  assert.match(home.text, /src="\/command-centre\.js\?v=20260725-compact-event-preview"/);
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
  assert.match(eventModalMarkup, /<label class="composer-field-row composer-input-row" for="eventLocationInput">/);
  assert.match(eventModalMarkup, /<label class="composer-field-row composer-input-row composer-description-row" for="eventDescriptionInput">/);
  assert.match(eventModalMarkup, /id="eventDescriptionInput"[^>]*rows="1"/);
  assert.doesNotMatch(eventModalMarkup, /class="composer-body"/);
  assertInOrder(eventModalMarkup, [
ß];òÚ$z{-®éÜj×gEÂæ–6öçÇ‚Ö–6öâ’ò“°¢76W'Bæö²†ff–6öä–6òçFW‡BæÆVæwF‚âEóÂ%F†R×VÇF’×6—¦Rff–6öâ76WB—2VæW‡V7FVFÇ’6ÖÆÂ"“°¢6öç7BÖæ–fW7E&W7öç6RÒv—BV&Æ–56W76–öâç&WVW7B‚"÷6—FRçvV&Öæ–fW7B"Â²66WC¢&Æ–6F–öâöÖæ–fW7B¶§6öâ"Ò“°¢6öç7BÖæ–fW7BÒ¥4ôâç'6R†Öæ–fW7E&W7öç6RçFW‡B“°¢76W'BæWVÂ†Öæ–fW7BææÖRÂ$6öÖÖöäw&÷VæB"“°¢76W'BæFVWWVÂ€¢Öæ–fW7Bæ–6öç2æÖ‚†–6öâ’Óâ–6öâç6—¦W2’À¢²#“'ƒ“""Â#S'ƒS"%ÒÀ¢%F†R–ç7FÆÂÖæ–fW7B×W7BW‡÷6R&÷F‚6öÖÖöäw&÷VæBÖ–6öâ6—¦W2 ¢“°¢6öç7B6—FTwV&BÒv—BV&Æ–56W76–öâç&WVW7B‚"÷6—FRÖwV&Bæ§2"Â²66WC¢'FW‡Bö¦f67&—B"Ò“°¢76W'BæÖF6‚‡6—FTwV&BçFW‡BÂöFö7VÖVçEÂæFDWfVçDÆ—7FVæW%Â…Ç2¢&6öçFW‡FÖVçR%µÇ5Å5Ò£öWfVçEÂç&WfVçDFVfVÇEÂ…Â•µÇ5Å5Ò£õÇ²6GW&S¢G'VRÇÒò“°¢6öç7B6öçFVçE6V7W&—G•öÆ–7’Ò†öÖRç&W7öç6Ræ†VFW'2ævWB‚&6öçFVçB×6V7W&—G’×öÆ–7’"“°¢76W'Bæö²†6öçFVçE6V7W&—G•öÆ–7’Â$55†VFW"—2Ö—76–ær"“°¢76W'BæFöW4æ÷DÖF6‚†6öçFVçE6V7W&—G•öÆ–7’Â÷67&—B×7&5µãµÒ¢wVç6fRÖ–æÆ–æRrò“°¢76W'BæWVÂ††öÖRç&W7öç6Ræ†VFW'2ævWB‚'‚Ö6öçFVçB×G—RÖ÷F–öç2"’Â&æ÷6æ–fb"“°¢76W'Bæö²††öÖRç&W7öç6Ræ†VFW'2ævWB‚'&VfW'&W"×öÆ–7’"’Â%&VfW'&W"ÕöÆ–7’†VFW"—2Ö—76–ær"“°¢6öç7B&—f7•vRÒv—BV&Æ–56W76–öâç&WVW7B‚"÷&—f7’"Â²66WC¢'FW‡Bö‡FÖÂ"Ò“°¢6öç7BFW&×5vRÒv—BV&Æ–56W76–öâç&WVW7B‚"÷FW&×2"Â²66WC¢'FW‡Bö‡FÖÂ"Ò“°¢f÷"†6öç7BÆVvÅvRöb·&—f7•vRÂFW&×5vUÒ’°¢76W'BæÖF6‚†ÆVvÅvRçFW‡BÂóÆÆ–æ²&VÃÒ&–6öâ"‡&VcÒ%Âö–6öç5Âöff–6öåÂæ–6õÃ÷cÓ##cs#BÖ–6öâÖæWr"6—¦W3Ò&ç’"Âóâò“°¢76W'BæÖF6‚†ÆVvÅvRçFW‡BÂóÆÆ–æ²&VÃÒ&ÆR×F÷V6‚Ö–6öâ"6—¦W3Ò#ƒƒƒ"‡&VcÒ%Âö–6öç5ÂöÆR×F÷V6‚Ö–6öåÂçæuÃ÷cÓ##cs#BÖ–6öâÖæWr"Âóâò“°¢76W'BæÖF6‚†ÆVvÅvRçFW‡BÂóÆ–Ör6Æ73Ò&Ö&²Ö'&æBÖ–6öâ"7&3Ò%Âö–6öç5Âö–6öâÓ“%ÂçæuÃ÷cÓ##cs#BÖ–6öâÖæWr"ÇCÒ""v–GFƒÒ#Cb"†V–v‡CÒ#Cb"Âóâò“°¢76W'BæÖF6‚†ÆVvÅvRçFW‡BÂóÇ67&—B7&3Ò%Â÷6—FRÖwV&EÂæ§5Ã÷cÓ##cs#BÖ6öçFW‡FÖVçR"FVfW#ãÅÂ÷67&—Câò“°¢Ğ¢v—BV&Æ–56W76–öâç&WVW7B‚"ö’öWF‚övöövÆR"Â²ÖWF†öC¢%õ5B"ÂW‡V7FVC¢CRÒ“°¢v—BV&Æ–56W76–öâç&WVW7B‚"ö’öWF‚övöövÆS÷÷WÓ"Â²W‡V7FVC¢CÒ“°¢6öç7B÷W&WVW7D–BÒ&#%ö34CBÖSTceöstƒ‚Ö“”£ö³Ã"ÖÓ4ãB#°¢v—BV&Æ–56W76–öâç&WVW7B€¢ö’öWF‚övöövÆS÷÷WÓg÷WFö¶VãÒG·÷W&WVW7D–GÒf6ÆVæF%w&—FSÖÖ–&VÀ¢²W‡V7FVC¢CĞ¢“° ¢6öç7B÷WWF…6W76–öâÒæWr'&÷w6W%6W76–öâ‚“°¢6öç7B÷WWF†÷&—¦F–öâÒv—B÷WWF…6W76–öâç&WVW7B€¢ö’öWF‚övöövÆS÷÷WÓg÷WFö¶VãÒG·÷W&WVW7D–GÒf6ÆVæF%w&—FSÓÀ¢²W‡V7FVC¢3"Ğ¢“°¢6öç7B÷WWF†÷&—¦F–öäÆö6F–öâÒ÷WWF†÷&—¦F–öâç&W7öç6Ræ†VFW'2ævWB‚&Æö6F–öâ"“°¢76W'Bæö²‡÷WWF†÷&—¦F–öäÆö6F–öâÂ%÷WWF†÷&—¦F–öâ&VF—&V7B—2Ö—76–ær"“°¢6öç7B÷WWF†÷&—¦F–öåW&ÂÒæWrU$Â‡÷WWF†÷&—¦F–öäÆö6F–öâ“°¢76W'BæWVÂ‡÷WWF†÷&—¦F–öåW&Âæ÷&–v–âÂ&‡GG3¢òö66÷VçG2ævöövÆRæ6öÒ"“°¢76W'BæWVÂ‡÷WWF†÷&—¦F–öåW&Âç6V&6…&×2ævWB‚&6Æ–VçEö–B"’Â&6öÖÖöæw&÷VæB×6Öö¶RÖ6Æ–VçB"“°¢76W'BæWVÂ‡÷WWF†÷&—¦F–öåW&Âç6V&6…&×2ævWB‚'&VF—&V7E÷W&’"’ÂG¶&6UW&ÇÒöWF‚övöövÆRö6ÆÆ&6¶“°¢76W'BæWVÂ‡÷WWF†÷&—¦F–öåW&Âç6V&6…&×2ævWB‚&–æ6ÇVFUöw&çFVE÷66÷W2"’Â'G'VR"“°¢76W'Bæö²€¢÷WWF†÷&—¦F–öåW&Âç6V&6…&×2ævWB‚'66÷R"“òç7Æ—B‚""’æ–æ6ÇVFW2‚&‡GG3¢ò÷wwrævöövÆV—2æ6öÒöWF‚ö6ÆVæF"æWfVçG2"’À¢%F†RWfVçB×7–æ2÷W×W7B&WVW7BvöövÆRWfVçB×w&—FRW&Ö—76–öâ ¢“°¢6öç7B÷WöWF…7FFRÒ÷WWF†÷&—¦F–öåW&Âç6V&6…&×2ævWB‚'7FFR"“°¢76W'BæÖF6‚‡÷WöWF…7FFRÇÂ""Âõå¶ÖcÓ•×³3'ÒBò“° ¢6öç7B÷WFVæ–VBÒv—B÷WWF…6W76–öâç&WVW7B€¢öWF‚övöövÆRö6ÆÆ&6³÷7FFSÒG¶Væ6öFUU$”6ö×öæVçB‡÷WöWF…7FFR—ÒfW'&÷#Ö66W75öFVæ–VFÀ¢²W‡V7FVC¢3"Ğ¢“°¢6öç7B÷W&VÆ”Æö6F–öâÒ÷WFVæ–VBç&W7öç6Ræ†VFW'2ævWB‚&Æö6F–öâ"“°¢76W'Bæö²‡÷W&VÆ”Æö6F–öâÂ%÷W6ÆÆ&6²&VÆ’&VF—&V7B—2Ö—76–ær"“°¢6öç7B÷W&VÆ•W&ÂÒæWrU$Â‡÷W&VÆ”Æö6F–öâÂ&6UW&Â“°¢76W'BæWVÂ‡÷W&VÆ•W&ÂçF†æÖRÂ"ööWF‚×÷Wæ‡FÖÂ"“°¢76W'BæWVÂ‡÷W&VÆ•W&Âç6V&6‚Â""Â%÷W&W7VÇBfÇVW2×W7Bæ÷B&RÆ6VB–âF†RVW'’7G&–ær"“°¢6öç7B÷W&VÆ•&W7VÇBÒæWrU$Å6V&6…&×2‡÷W&VÆ•W&Âæ†6‚ç6Æ–6Rƒ’“°¢76W'BæFVWWVÂ„ö&¦V7Bæg&öÔVçG&–W2‡÷W&VÆ•&W7VÇB’Â°¢&÷f–FW#¢&vöövÆR"À¢7FGW3¢&W'&÷""À¢&WVW7D–C¢÷W&WVW7D–BÀ¢W'&÷$6öFS¢&66W75öFVæ–VB ¢Ò“° ¢6öç7B&WÆ–VE÷W6ÆÆ&6²Òv—B÷WWF…6W76–öâç&WVW7B€¢öWF‚övöövÆRö6ÆÆ&6³÷7FFSÒG¶Væ6öFUU$”6ö×öæVçB‡÷WöWF…7FFR—ÒfW'&÷#Ö66W75öFVæ–VFÀ¢²W‡V7FVC¢3"Ğ¢“°¢76W'BæWVÂ€¢&WÆ–VE÷W6ÆÆ&6²ç&W7öç6Ræ†VFW'2ævWB‚&Æö6F–öâ"’À¢"óöW'&÷#Ö–çfÆ–EööWF…÷7FFR"À¢$ôWF‚7FFR×W7B&R6–ævÆR×W6R ¢“° ¢6öç7BgVÆÅvTWF…6W76–öâÒæWr'&÷w6W%6W76–öâ‚“°¢6öç7BgVÆÅvTWF†÷&—¦F–öâÒv—BgVÆÅvTWF…6W76–öâç&WVW7B€¢"öWF‚övöövÆSö6ÆVæF%w&—FSÓ"À¢²W‡V7FVC¢3"Ğ¢“°¢6öç7BgVÆÅvTWF†÷&—¦F–öåW&ÂÒæWrU$Â†gVÆÅvTWF†÷&—¦F–öâç&W7öç6Ræ†VFW'2ævWB‚&Æö6F–öâ"’“°¢76W'Bæö²€¢gVÆÅvTWF†÷&—¦F–öåW&Âç6V&6…&×2ævWB‚'66÷R"“òç7Æ—B‚""’æ–æ6ÇVFW2‚&‡GG3¢ò÷wwrævöövÆV—2æ6öÒöWF‚ö6ÆVæF"æWfVçG2"’À¢%F†R&6RgVÆÂ×vRôWF‚fÆ÷r×W7B&WF–âÆV7B×&—f–ÆVvR6ÆVæF"66÷W2 ¢“°¢6öç7BgVÆÅvTöWF…7FFRÒgVÆÅvTWF†÷&—¦F–öåW&Âç6V&6…&×2ævWB‚'7FFR"“°¢6öç7BgVÆÅvTFVæ–VBÒv—BgVÆÅvTWF…6W76–öâç&WVW7B€¢öWF‚övöövÆRö6ÆÆ&6³÷7FFSÒG¶Væ6öFUU$”6ö×öæVçB†gVÆÅvTöWF…7FFR—ÒfW'&÷#Ö66W75öFVæ–VFÀ¢²W‡V7FVC¢3"Ğ¢“°¢76W'BæWVÂ€¢gVÆÅvTFVæ–VBç&W7öç6Ræ†VFW'2ævWB‚&Æö6F–öâ"’À¢"óöW'&÷#Ö66W75öFVæ–VB"À¢$æöâ×÷WvöövÆRôWF‚×W7B&WF–â—G2gVÆÂ×vR&WGW&â6öçG&7B ¢“°¢v—BV&Æ–56W76–öâç&WVW7B‚"ö’öÖR"Â²ÖWF†öC¢%õ5B"ÂW‡V7FVC¢CRÒ“° ¢6öç7B†÷7BÒæWr'&÷w6W%6W76–öâ‚“°¢6öç7BwVW7BÒæWr'&÷w6W%6W76–öâ‚“°¢6öç7B7V7FF÷"ÒæWr'&÷w6W%6W76–öâ‚“°¢v—B†÷7Bç&WVW7B‚"ö’öÖR"“°¢v—BwVW7Bç&WVW7B‚"ö’öÖR"“°¢v—B7V7FF÷"ç&WVW7B‚"ö’öÖR"“° ¢6öç7B7&VFVBÒv—B†÷7Bç&WVW7B‚"ö’÷&öö×2"Â°¢ÖWF†öC¢%õ5B"À¢W‡V7FVC¢#À¢&öG“¢²æÖS¢$FV6vöâ"ÂVÖö¦“¢/	úzÒ"ÂF—7Æ”æÖS¢$†÷7B"Ğ¢Ò“°¢6öç7Bf—'7D6öFRÒ7&VFVBç–ÆöBç&ööÒæ6öFS°¢76W'BæÖF6‚†f—'7D6öFRÂõå´Ô„¢ÔåÕ£"Ó•×³gÒBò“°¢76W'BæWVÂ†7&VFVBç–ÆöBç&ööÒæVÖö¦’Â/	úzÒ"“°¢76W'BæWVÂ†7&VFVBç–ÆöBæ—4†÷7BÂG'VR“° ¢6öç7B6V6öæE&ööÒÒv—B†÷7Bç&WVW7B‚"ö’÷&öö×2"Â°¢ÖWF†öC¢%õ5B"À¢W‡V7FVC¢#À¢&öG“¢²æÖS¢%6V6öæB&ööÒ"ÂVÖö¦“¢/	øé""ÂF—7Æ”æÖS¢$†÷7B"Ğ¢Ò“°¢76W'Bææ÷DWVÂ‡6V6öæE&ööÒç–ÆöBç&ööÒæ6öFRÂf—'7D6öFR“°¢6öç7BÖVÖ&W'6†—2Òv—B†÷7Bç&WVW7B‚"ö’ö×’×&öö×2"“°¢76W'BæWVÂ†ÖVÖ&W'6†—2ç–ÆöBç&öö×2æÆVæwF‚Â"“°¢76W'Bæö²†ÖVÖ&W'6†—2ç–ÆöBç&öö×2ç6öÖR‚‡&ööÒ’Óâ&ööÒæ6öFRÓÓÒf—'7D6öFRbb&ööÒæVÖö¦’ÓÓÒ/	úzÒ"’“° ¢6öç7B¦ö–æVBÒv—BwVW7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFRçFôÆ÷vW$66R‚—Òö¦ö–æÂ°¢ÖWF†öC¢%õ5B"À¢&öG“¢²F—7Æ”æÖS¢$wVW7BÆ–Ör7&3×‚öæW'&÷#ÖÆW'Bƒ“â"Ğ¢Ò“°¢76W'BæWVÂ†¦ö–æVBç–ÆöBç&ööÒæ6öFRÂf—'7D6öFR“°¢6öç7BwVW7D–BÒ¦ö–æVBç–ÆöBç'F–6—çBæ–C° ¢6öç7B7V7FF÷$¦ö–âÒv—B7V7FF÷"ç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÒö¦ö–æÂ°¢ÖWF†öC¢%õ5B"À¢&öG“¢²F—7Æ”æÖS¢%7V7FF÷""Ğ¢Ò“°¢6öç7B7V7FF÷$–BÒ7V7FF÷$¦ö–âç–ÆöBç'F–6—çBæ–C° ¢6öç7B†÷7E&ööÒÒv—B†÷7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÖ“°¢6öç7B†÷7D–BÒ†÷7E&ööÒç–ÆöBç'F–6—çBæ–C°¢76W'BæWVÂ††÷7E&ööÒç–ÆöBç&ööÒç'F–6—çG2æÆVæwF‚Â2“°¢76W'Dæô¶W—2††÷7E&ööÒç–ÆöBÂæWr6WB…²'W6W$–B"Â&÷væW$VÖ–Â"Â'Fö¶Vç2"Â&vöövÆUFö¶Vç2"Â&Ö–7&÷6ögEFö¶Vç2%Ò’“° ¢f÷"†6öç7B²fÇVS¢6öÆ÷"ÒöbW‡V7FVE'F–6—çEÆWGFR’°¢6öç7B&V6öÆ÷&VBÒv—B†÷7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÒ÷'F–6—çG2òG¶†÷7D–GÖÂ°¢ÖWF†öC¢%D4‚"À¢&öG“¢²6öÆ÷"Ğ¢Ò“°¢76W'BæWVÂ‡&V6öÆ÷&VBç–ÆöBç'F–6—çBæ6öÆ÷"Â6öÆ÷"“°¢Ğ¢6öç7BÖ–w&FVDÆVv7”6öÆ÷"Òv—B†÷7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÒ÷'F–6—çG2òG¶†÷7D–GÖÂ°¢ÖWF†öC¢%D4‚"À¢&öG“¢²6öÆ÷#¢"3$cdc”b"Ğ¢Ò“°¢76W'BæWVÂ†Ö–w&FVDÆVv7”6öÆ÷"ç–ÆöBç'F–6—çBæ6öÆ÷"Â"3cSsS„"“° ¢v—BwVW7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÖÂ°¢ÖWF†öC¢%D4‚"À¢W‡V7FVC¢C2À¢&öG“¢²æÖS¢$æ÷BÆÆ÷vVB"Ğ¢Ò“° ¢6öç7B7F'BÒ###bÓrÓ#C££ã¢#°¢6öç7BVæBÒ###bÓrÓ#C£3£ã¢#°¢6öç7B7&VFVDWfVçBÒv—B†÷7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÒöWfVçG6Â°¢ÖWF†öC¢%õ5B"À¢W‡V7FVC¢#À¢&öG“¢°¢F—FÆS¢""À¢7F'BÀ¢VæBÀ¢F–ÖW¦öæS¢$6–ô¶öÆ¶F"À¢Æö6F–öã¢$6fR"À¢FW67&—F–öã¢%&ööÒ×f—6–&ÆR&÷÷6Â"À¢–çf—FVU'F–6—çD–G3¢¶†÷7D–BÂwVW7D–EÒÀ¢7–æ5FôvöövÆS¢fÇ6P¢Ğ¢Ò“°¢6öç7BWfVçD–BÒ7&VFVDWfVçBç–ÆöBæWfVçBæ–C°¢76W'BæWVÂ†7&VFVDWfVçBç–ÆöBæWfVçBçF—FÆRÂ"„æòF—FÆR’"“°¢76W'BæWVÂ†7&VFVDWfVçBç–ÆöBæWfVçBçF–ÖW¦öæRÂ$6–ô¶öÆ¶F"“°¢76W'Dæô¶W—2†7&VFVDWfVçBç–ÆöBÂæWr6WB…²&vöövÆT6ÆVæF%7–æ2"Â&÷WFÆöö´6ÆVæF%7–æ2"Â&÷væW$VÖ–Â"Â'W6W$–B%Ò’“° ¢6öç7BÆÄF•7F'BÒ###bÓrÓ•Cƒ£3£ã¢#°¢6öç7BÆÄF”VæBÒ###bÓrÓ#Cƒ£3£ã¢#°¢6öç7BÆÄF”WfVçBÒv—B†÷7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÒöWfVçG6Â°¢ÖWF†öC¢%õ5B"À¢W‡V7FVC¢#À¢&öG“¢°¢F—FÆS¢$Æö6ÂÆÂÖF’Æâ"À¢7F'C¢ÆÄF•7F'BÀ¢VæC¢ÆÄF”VæBÀ¢F–ÖW¦öæS¢$6–ô¶öÆ¶F"À¢ÆÄF“¢G'VRÀ¢–çf—FVU'F–6—çD–G3¢¶†÷7D–EĞ¢Ğ¢Ò“°¢76W'BæWVÂ†ÆÄF”WfVçBç–ÆöBæWfVçBæFFRÂ###bÓrÓ#"“°¢76W'BæWVÂ†ÆÄF”WfVçBç–ÆöBæWfVçBæÆÄF’ÂG'VR“° ¢6öç7B&W6W'fVDÆÄF”WfVçBÒv—B†÷7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÒöWfVçG2òG¶ÆÄF”WfVçBç–ÆöBæWfVçBæ–GÖÂ°¢ÖWF†öC¢%D4‚"À¢&öG“¢°¢F—FÆS¢%&VæÖVBÆÂÖF’Æâ"À¢7F'C¢ÆÄF•7F'BÀ¢VæC¢ÆÄF”VæBÀ¢–çf—FVU'F–6—çD–G3¢¶†÷7D–EĞ¢Ğ¢Ò“°¢76W'BæWVÂ‡&W6W'fVDÆÄF”WfVçBç–ÆöBæWfVçBçF–ÖW¦öæRÂ$6–ô¶öÆ¶F"“°¢76W'BæWVÂ‡&W6W'fVDÆÄF”WfVçBç–ÆöBæWfVçBæFFRÂ###bÓrÓ#"“°¢76W'BæWVÂ‡&W6W'fVDÆÄF”WfVçBç–ÆöBæWfVçBæÆÄF’ÂG'VR“°¢6öç7BÆÄF”–72Òv—B†÷7Bç&WVW7B€¢ö’÷&öö×2òG¶f—'7D6öFWÒöWfVçG2òG¶ÆÄF”WfVçBç–ÆöBæWfVçBæ–GÒö–76À¢²66WC¢'FW‡Bö6ÆVæF""Ğ¢“°¢76W'BæÖF6‚†ÆÄF”–72çFW‡BÂôEE5D%CµdÅTSÔDDS£##cs#ò“°¢76W'BæÖF6‚†ÆÄF”–72çFW‡BÂôEDTäCµdÅTSÔDDS£##cs#ò“° ¢6öç7BwVW7D–çf—FTæ÷F–f–6F–öç2Òv—BwVW7Bç&WVW7B‚"ö’öæ÷F–f–6F–öç2"“°¢76W'Bæö²†wVW7D–çf—FTæ÷F–f–6F–öç2ç–ÆöBææ÷F–f–6F–öç2ç6öÖR‚†—FVÒ’Óâ—FVÒçG—RÓÓÒ&WfVçEö–çf—FR"’“° ¢6öç7B7V7FF÷%&ööÒÒv—B7V7FF÷"ç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÖ“°¢6öç7B7V7FF÷$WfVçBÒ7V7FF÷%&ööÒç–ÆöBç&ööÒæWfVçG2æf–æB‚†WfVçB’ÓâWfVçBæ–BÓÓÒWfVçD–B“°¢76W'BæWVÂ‡7V7FF÷$WfVçBçF—FÆRÂ"„æòF—FÆR’"“°¢76W'BæWVÂ‡7V7FF÷$WfVçBæ—4–çf—FVBÂfÇ6R“°¢v—B7V7FF÷"ç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÒöWfVçG2òG¶WfVçD–GÒ÷&W7öæFÂ°¢ÖWF†öC¢%õ5B"À¢W‡V7FVC¢C2À¢&öG“¢²&W7öç6S¢'–W2"Ğ¢Ò“° ¢6öç7Bf÷FRÒv—BwVW7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÒöWfVçG2òG¶WfVçD–GÒ÷&W7öæFÂ°¢ÖWF†öC¢%õ5B"À¢&öG“¢²&W7öç6S¢'–W2"Ğ¢Ò“°¢76W'BæWVÂ‡f÷FRç–ÆöBæWfVçBç&W7öç6U7VÖÖ'’ç–W2Â“° ¢v—BwVW7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÒöWfVçG2òG¶WfVçD–GÒö6öÖÖVçG6Â°¢ÖWF†öC¢%õ5B"À¢W‡V7FVC¢#À¢&öG“¢²FW‡C¢#Æ–Ör–C×‡727&3×‚öæW'&÷#ÖÆW'Bƒ“âÆöö·2vööB"Ğ¢Ò“° ¢v—BwVW7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÒöWfVçG2òG¶WfVçD–GÒ÷&W7öæFÂ°¢ÖWF†öC¢%õ5B"À¢W‡V7FVC¢³#ÂCÂC#%ÒÀ¢&öG“¢°¢&W7öç6S¢'–W2"À¢&÷÷6VE7F'C¢###bÓrÓ#C#££ã¢"À¢&÷÷6VDVæC¢###bÓrÓ#C3££ã¢ ¢Ğ¢Ò“°¢6öç7BVæ6†ævVE&ööÒÒv—B†÷7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÖ“°¢6öç7BVæ6†ævVDWfVçBÒVæ6†ævVE&ööÒç–ÆöBç&ööÒæWfVçG2æf–æB‚†WfVçB’ÓâWfVçBæ–BÓÓÒWfVçD–B“°¢76W'BæWVÂ‡Væ6†ævVDWfVçBç7F'BÂ7F'B“°¢76W'BæWVÂ‡Væ6†ævVDWfVçBæVæBÂVæB“° ¢6öç7BÖ÷fVE7F'BÒ###bÓrÓ#C£S£ã¢#°¢6öç7BÖ÷fVDVæBÒ###bÓrÓ#C£CS£ã¢#°¢6öç7BÖ÷fVDWfVçBÒv—B†÷7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÒöWfVçG2òG¶WfVçD–GÖÂ°¢ÖWF†öC¢%D4‚"À¢&öG“¢°¢F—FÆS¢Væ6†ævVDWfVçBçF—FÆRÀ¢7F'C¢Ö÷fVE7F'BÀ¢VæC¢Ö÷fVDVæBÀ¢F–ÖW¦öæS¢Væ6†ævVDWfVçBçF–ÖW¦öæRÀ¢ÆÄF“¢fÇ6RÀ¢Æö6F–öã¢Væ6†ævVDWfVçBæÆö6F–öâÀ¢FW67&—F–öã¢Væ6†ævVDWfVçBæFW67&—F–öâÀ¢7–æ5FôvöövÆS¢Væ6†ævVDWfVçBç7–æ5FôvöövÆRÀ¢7–æ5Fô÷WFÆöö³¢Væ6†ævVDWfVçBç7–æ5Fô÷WFÆöö²À¢–çf—FVU'F–6—çD–G3¢Væ6†ævVDWfVçBæ–çf—FVW2æÖ‚†–çf—FVR’Óâ–çf—FVRç'F–6—çD–B¢Ğ¢Ò“°¢76W'BæWVÂ†Ö÷fVDWfVçBç–ÆöBæWfVçBç7F'BÂÖ÷fVE7F'B“°¢76W'BæWVÂ†Ö÷fVDWfVçBç–ÆöBæWfVçBæVæBÂÖ÷fVDVæB“°¢76W'BæWVÂ†Ö÷fVDWfVçBç–ÆöBæWfVçBæÆö6F–öâÂ$6fR"“°¢76W'BæWVÂ†Ö÷fVDWfVçBç–ÆöBæWfVçBæFW67&—F–öâÂ%&ööÒ×f—6–&ÆR&÷÷6Â"“°¢76W'BæWVÂ€¢æWrFFR†Ö÷fVDWfVçBç–ÆöBæWfVçBæVæB’ævWEF–ÖR‚’ÒæWrFFR†Ö÷fVDWfVçBç–ÆöBæWfVçBç7F'B’ævWEF–ÖR‚’À¢3¢c¢ ¢“°¢v—BwVW7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÒöWfVçG2òG¶WfVçD–GÖÂ°¢ÖWF†öC¢%D4‚"À¢W‡V7FVC¢C2À¢&öG“¢°¢F—FÆS¢Ö÷fVDWfVçBç–ÆöBæWfVçBçF—FÆRÀ¢7F'C¢###bÓrÓ#C#££ã¢"À¢VæC¢###bÓrÓ#C#£3£ã¢"À¢F–ÖW¦öæS¢Ö÷fVDWfVçBç–ÆöBæWfVçBçF–ÖW¦öæRÀ¢–çf—FVU'F–6—çD–G3¢¶†÷7D–BÂwVW7D–EĞ¢Ğ¢Ò“° ¢6öç7Bg&VT'W7’Òv—B†÷7Bç&WVW7B€¢ö’÷&öö×2òG¶f—'7D6öFWÒög&VV'W7“÷F–ÖTÖ–ãÓ##bÓrÓ#C££ã¢gF–ÖTÖƒÓ##bÓrÓ#C££ã¦ ¢“°¢76W'Dæô¶W—2†g&VT'W7’ç–ÆöBÂæWr6WB…°¢'W6W$–B"À¢&÷væW$VÖ–Â"À¢'F—FÆR"À¢&Æö6F–öâ"À¢&FW67&—F–öâ"À¢&vöövÆT6ÆVæF%7–æ2"À¢&÷WFÆöö´6ÆVæF%7–æ2 ¢Ò’“° ¢v—B7F÷6W'fW"‡6W'fW"“°¢6W'fW"Òv—B7F'E6W'fW"‚“°¢6öç7BW'6—7FVE&ööÒÒv—B†÷7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÖ“°¢76W'Bæö²‡W'6—7FVE&ööÒç–ÆöBç&ööÒæWfVçG2ç6öÖR‚†WfVçB’ÓâWfVçBæ–BÓÓÒWfVçD–B’“° ¢6öç7B&Vg&W6†VBÒv—B†÷7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÒ÷&Vg&W6‚Ö6öFVÂ°¢ÖWF†öC¢%õ5B ¢Ò“°¢6öç7B&Vg&W6†VD6öFRÒ&Vg&W6†VBç–ÆöBç&ööÒæ6öFS°¢76W'BæÖF6‚‡&Vg&W6†VD6öFRÂõå´Ô„¢ÔåÕ£"Ó•×³gÒBò“°¢76W'Bææ÷DWVÂ‡&Vg&W6†VD6öFRÂf—'7D6öFR“°¢v—BV&Æ–56W76–öâç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÖÂ²W‡V7FVC¢CBÒ“° ¢6öç7BÖ–w&FVDæ÷F–f–6F–öç2Òv—BwVW7Bç&WVW7B‚"ö’öæ÷F–f–6F–öç2"“°¢76W'Bæö²€¢Ö–w&FVDæ÷F–f–6F–öç2ç–ÆöBææ÷F–f–6F–öç0¢æf–ÇFW"‚†—FVÒ’Óâ—FVÒæWfVçD–BÓÓÒWfVçD–B¢æWfW'’‚†—FVÒ’Óâ—FVÒç&ööÔ6öFRÓÓÒ&Vg&W6†VD6öFR’À¢$WfVçBæ÷F–f–6F–öç2vW&Ræ÷BÖ–w&FVBFòF†R&Vg&W6†VB&ööÒ6öFR ¢“° ¢v—B†÷7Bç&WVW7B†ö’÷&öö×2òG·&Vg&W6†VD6öFWÖÂ²ÖWF†öC¢$DTÄUDR"Ò“°¢6öç7BgFW$FVÆWFU&öö×2Òv—BwVW7Bç&WVW7B‚"ö’ö×’×&öö×2"“°¢76W'Bæö²‚gFW$FVÆWFU&öö×2ç–ÆöBç&öö×2ç6öÖR‚‡&ööÒ’Óâ&ööÒæ6öFRÓÓÒ&Vg&W6†VD6öFR’“°¢6öç7BgFW$FVÆWFTæ÷F–f–6F–öç2Òv—BwVW7Bç&WVW7B‚"ö’öæ÷F–f–6F–öç2"“°¢76W'Bæö²‚gFW$FVÆWFTæ÷F–f–6F–öç2ç–ÆöBææ÷F–f–6F–öç2ç6öÖR‚†—FVÒ’Óâ—FVÒç&ööÔ6öFRÓÓÒ&Vg&W6†VD6öFR’“° ¢6öç6öÆRæÆör‚$6öÖÖöäw&÷VæB6Öö¶R6†V6·276VBâ"“°§Ò6F6‚†W'&÷"’°¢6öç6öÆRæW'&÷"†W'&÷"ç7F6²ÇÂW'&÷"æÖW76vRÇÂW'&÷"“°¢–b‡6W'fW"’6öç6öÆRæW'&÷"‡6W'fW"æÆöw2‚’“°¢&ö6W72æW†—D6öFRÒ°§Òf–æÆÇ’°¢v—B7F÷6W'fW"‡6W'fW"“°¢&Õ7–æ2‡'VçF–ÖTF—"Â²&V7W'6—fS¢G'VRÂf÷&6S¢G'VRÒ“°§Ğ 