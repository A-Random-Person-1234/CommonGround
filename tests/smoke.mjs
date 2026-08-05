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
  const initialPreferences = await publicSession.request("/api/me");
  assert.equal(initialPreferences.payload.theme, "dark", "Fresh sessions must default to dark mode");
  const isolatedThemeSession = new BrowserSession();
  const isolatedInitialPreferences = await isolatedThemeSession.request("/api/me");
  assert.equal(isolatedInitialPreferences.payload.theme, "dark");
  await publicSession.request("/api/me/preferences", { expected: 405 });
  await publicSession.request("/api/me/preferences", { method: "PATCH", expected: 415 });
  await publicSession.request("/api/me/preferences", { method: "PATCH", body: null, expected: 400 });
  await publicSession.request("/api/me/preferences", { method: "PATCH", body: [], expected: 400 });
  await publicSession.request("/api/me/preferences", { method: "PATCH", body: "light", expected: 400 });
  await publicSession.request("/api/me/preferences", {
    method: "PATCH",
    body: { theme: "sepia" },
    expected: 400
  });
  await publicSession.request("/api/me/preferences", {
    method: "PATCH",
    body: { theme: "light", extra: true },
    expected: 400
  });
  const savedPreferences = await publicSession.request("/api/me/preferences", {
    method: "PATCH",
    body: { theme: "light" }
  });
  assert.equal(savedPreferences.payload.theme, "light");
  assert.equal((await publicSession.request("/api/me")).payload.theme, "light");
  assert.equal(
    (await isolatedThemeSession.request("/api/me")).payload.theme,
    "dark",
    "Theme preferences must remain isolated between browser sessions"
  );
  assert.match(
    serverSource,
    /function effectiveThemePreference\(user, session\) \{\s*return userThemePreference\(user\) \|\| sessionThemePreference\(session\) \|\| "dark";\s*\}/,
    "Saved user preferences must win over session preferences, with dark as the final default"
  );
  assert.match(
    serverSource,
    /function updateUserRecord\(userId, updates = \{\}\)[\s\S]*?preferences: \{\s*\.\.\.existing\.preferences,\s*\.\.\.\(updates\.preferences \|\| \{\}\)\s*\}/,
    "User preference updates must preserve other profile and preference fields"
  );
  assert.match(
    serverSource,
    /function migrateSessionThemePreferenceToUser\(userId, session\)[\s\S]*?if \(!user \|\| userThemePreference\(user\)\) return user \|\| null;[\s\S]*?sessionThemePreference\(session\)[\s\S]*?preferences: \{ theme \}/,
    "OAuth migration must never overwrite an existing user's saved theme"
  );
  assert.equal(
    (serverSource.match(/userRecord = migrateSessionThemePreferenceToUser\(userId, session\) \|\| userRecord;/g) || []).length,
    2,
    "Both Google and Microsoft sign-in must migrate a guest preference safely"
  );
  assert.match(
    serverSource,
    /url\.pathname === "\/api\/me\/preferences"[\s\S]*?enforceRateLimit\(req, res, "theme-preference", 60, 10 \* 60 \* 1000\)[\s\S]*?!body \|\| typeof body !== "object" \|\| Array\.isArray\(body\)[\s\S]*?Object\.keys\(body\)\.some\(\(key\) => key !== "theme"\)/,
    "The preference endpoint must be bounded, rate-limited, and strict about its JSON shape"
  );
  assert.equal(publicConfig.payload.placesReady, false);
  assert.equal(publicConfig.payload.weatherReady, false);
  assert.ok(!("googleMapsApiKey" in publicConfig.payload));
  assert.doesNotMatch(home.text, /AIza[0-9A-Za-z_-]{20,}/, "Public HTML must never contain a Google Maps API key");
  assert.match(home.text, /CommonGround/);
  assert.match(home.text, /href="\/styles\.css\?v=20260805-whole-product-3"/);
  assert.match(home.text, /src="\/theme-bootstrap\.js\?v=20260804-persisted-theme"/);
  assert.match(home.text, /src="\/date-picker\.js\?v=20260726-shared-date-picker"/);
  assert.match(home.text, /src="\/app\.js\?v=20260805-whole-product-2"/);
  assert.match(home.text, /src="\/command-centre-actions\.js\?v=20260726-assistant-upgrade"/);
  assert.match(home.text, /src="\/command-centre\.js\?v=20260805-whole-product"/);
  assertInOrder(
    home.text,
    [
      'src="/theme-bootstrap.js?v=20260804-persisted-theme"',
      'href="/styles.css?v=20260805-whole-product-3"',
      'src="/date-picker.js?v=20260726-shared-date-picker"',
      'src="/app.js?v=20260805-whole-product-2"'
    ],
    "The CSP-safe theme bootstrap must precede CSS, and the date picker must precede the app controller"
  );
  assert.doesNotMatch(home.text, /id="roomStatus"|sidebar-room-status/);
  assert.match(home.text, /id="copyInviteButton"[^>]*title="Copy link to join room"[^>]*aria-label="Copy link to join room"/);
  assert.match(home.text, /id="copyInviteButtonEmpty"[\s\S]*?<span>Copy link<\/span>/);
  assert.doesNotMatch(home.text, /Copy invite message|Copy invite link/);
  assert.doesNotMatch(
    home.text,
    /id="weatherAttribution"|class="weather-attribution"/,
    "The collapsed calendar must not render a separate weather attribution label"
  );
  assert.equal(
    (home.text.match(/Source: Includes weather data from Google/g) || []).length,
    1,
    "Google Weather attribution must appear exactly once, inside the expanded panel"
  );
  assert.match(home.text, /id="weatherHighLowTooltip"[^>]*role="tooltip"[^>]*aria-hidden="true"/);
  assert.match(
    home.text,
    /id="weatherHourlyPopover"[^>]*popover="auto"[^>]*role="dialog"[\s\S]*?id="weatherHourlyList"[\s\S]*?Source: Includes weather data from Google/,
    "The hourly weather popover needs a ëÝ½æÚ$z{-®éÜj×öFS¢&66W75öFVæ–VB Ð¢Ò“°Ð Ð¢6öç7B&WÆ–VE÷W6ÆÆ&6²Òv—B÷WWF…6W76–öâç&WVW7B€Ð¢öWF‚övöövÆRö6ÆÆ&6³÷7FFSÒG¶Væ6öFUU$”6ö×öæVçB‡÷WöWF…7FFR—ÒfW'&÷#Ö66W75öFVæ–VFÀÐ¢²W‡V7FVC¢3"ÐÐ¢“°Ð¢76W'BæWVÂ€Ð¢&WÆ–VE÷W6ÆÆ&6²ç&W7öç6Ræ†VFW'2ævWB‚&Æö6F–öâ"’ÀÐ¢"óöW'&÷#Ö–çfÆ–EööWF…÷7FFR"ÀÐ¢$ôWF‚7FFR×W7B&R6–ævÆR×W6R Ð¢“°Ð Ð¢6öç7BgVÆÅvTWF…6W76–öâÒæWr'&÷w6W%6W76–öâ‚“°Ð¢6öç7BgVÆÅvTWF†÷&—¦F–öâÒv—BgVÆÅvTWF…6W76–öâç&WVW7B€Ð¢"öWF‚övöövÆSö6ÆVæF%w&—FSÓ"ÀÐ¢²W‡V7FVC¢3"ÐÐ¢“°Ð¢6öç7BgVÆÅvTWF†÷&—¦F–öåW&ÂÒæWrU$Â†gVÆÅvTWF†÷&—¦F–öâç&W7öç6Ræ†VFW'2ævWB‚&Æö6F–öâ"’“°Ð¢76W'Bæö²€Ð¢gVÆÅvTWF†÷&—¦F–öåW&Âç6V&6…&×2ævWB‚'66÷R"“òç7Æ—B‚""’æ–æ6ÇVFW2‚&‡GG3¢ò÷wwrævöövÆV—2æ6öÒöWF‚ö6ÆVæF"æWfVçG2"’ÀÐ¢%F†R&6RgVÆÂ×vRôWF‚fÆ÷r×W7B&WF–âÆV7B×&—f–ÆVvR6ÆVæF"66÷W2 Ð¢“°Ð¢6öç7BgVÆÅvTöWF…7FFRÒgVÆÅvTWF†÷&—¦F–öåW&Âç6V&6…&×2ævWB‚'7FFR"“°Ð¢6öç7BgVÆÅvTFVæ–VBÒv—BgVÆÅvTWF…6W76–öâç&WVW7B€Ð¢öWF‚övöövÆRö6ÆÆ&6³÷7FFSÒG¶Væ6öFUU$”6ö×öæVçB†gVÆÅvTöWF…7FFR—ÒfW'&÷#Ö66W75öFVæ–VFÀÐ¢²W‡V7FVC¢3"ÐÐ¢“°Ð¢76W'BæWVÂ€Ð¢gVÆÅvTFVæ–VBç&W7öç6Ræ†VFW'2ævWB‚&Æö6F–öâ"’ÀÐ¢"óöW'&÷#Ö66W75öFVæ–VB"ÀÐ¢$æöâ×÷WvöövÆRôWF‚×W7B&WF–â—G2gVÆÂ×vR&WGW&â6öçG&7B Ð¢“°Ð¢v—BV&Æ–56W76–öâç&WVW7B‚"ö’öÖR"Â²ÖWF†öC¢%õ5B"ÂW‡V7FVC¢CRÒ“°Ð Ð¢6öç7B†÷7BÒæWr'&÷w6W%6W76–öâ‚“°Ð¢6öç7BwVW7BÒæWr'&÷w6W%6W76–öâ‚“°Ð¢6öç7B7V7FF÷"ÒæWr'&÷w6W%6W76–öâ‚“°Ð¢v—B†÷7Bç&WVW7B‚"ö’öÖR"“°¢v—BwVW7Bç&WVW7B‚"ö’öÖR"“°¢v—B7V7FF÷"ç&WVW7B‚"ö’öÖR"“° ¢6öç7B&Wf–Wuf—6—F÷"ÒæWr'&÷w6W%6W76–öâ‚“°¢v—B&Wf–Wuf—6—F÷"ç&WVW7B‚"ö’÷&öö×2õ¥¥¥¥¥¢÷&Wf–Wr"Â²W‡V7FVC¢CBÒ“° ¢6öç7B7&VFVBÒv—B†÷7Bç&WVW7B‚"ö’÷&öö×2"Â°¢ÖWF†öC¢%õ5B"ÀÐ¢W‡V7FVC¢#ÀÐ¢&öG“¢²æÖS¢$FV6vöâ"ÂVÖö¦“¢/	úzÒ"ÂF—7Æ”æÖS¢$†÷7B"ÐÐ¢Ò“°Ð¢6öç7Bf—'7D6öFRÒ7&VFVBç–ÆöBç&ööÒæ6öFS°¢76W'BæÖF6‚†f—'7D6öFRÂõå´Ô„¢ÔåÕ£"Ó•×³gÒBò“°¢76W'BæWVÂ†7&VFVBç–ÆöBç&ööÒæVÖö¦’Â/	úzÒ"“°Ð¢76W'BæWVÂ†7&VFVBç–ÆöBæ—4†÷7BÂG'VR“° ¢6öç7B&ööÕ&Wf–WrÒv—B&Wf–Wuf—6—F÷"ç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFRçFôÆ÷vW$66R‚—Ò÷&Wf–Wv“°¢76W'BæWVÂ‡&ööÕ&Wf–Wrç–ÆöBç&ööÒæ6öFRÂf—'7D6öFR“°¢76W'BæWVÂ‡&ööÕ&Wf–Wrç–ÆöBç&ööÒææÖRÂ$FV6vöâ"“°¢76W'BæWVÂ‡&ööÕ&Wf–Wrç–ÆöBç&ööÒæÆö6¶VBÂfÇ6R“°¢76W'BæWVÂ‡&ööÕ&Wf–Wrç–ÆöBæ6ä¦ö–âÂG'VR“°¢76W'Dæô¶W—2‡&ööÕ&Wf–Wrç–ÆöBÂæWr6WB…²''F–6—çG2"Â&WfVçG2"Â''F–6—çB"Â'6W76–öä–B"Â'Fö¶Vç2%Ò’“°¢6öç7B&ööÔgFW%&Wf–WrÒv—B†÷7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÖ“°¢76W'BæWVÂ€¢&ööÔgFW%&Wf–Wrç–ÆöBç&ööÒç'F–6—çG2æÆVæwF‚À¢À¢%&VF–ærF†R&ööÒÖVçG'’&Wf–Wr×W7Bæ÷B¦ö–âF†R&Wf–Wv–ær'&÷w6W"÷"7&VFR'F–6—çB ¢“° ¢6öç7B6V6öæE&ööÒÒv—B†÷7Bç&WVW7B‚"ö’÷&öö×2"Â°¢ÖWF†öC¢%õ5B"ÀÐ¢W‡V7FVC¢#ÀÐ¢&öG“¢²æÖS¢%6V6öæB&ööÒ"ÂVÖö¦“¢/	øé""ÂF—7Æ”æÖS¢$†÷7B"ÐÐ¢Ò“°Ð¢76W'Bææ÷DWVÂ‡6V6öæE&ööÒç–ÆöBç&ööÒæ6öFRÂf—'7D6öFR“°Ð¢6öç7BÖVÖ&W'6†—2Òv—B†÷7Bç&WVW7B‚"ö’ö×’×&öö×2"“°Ð¢76W'BæWVÂ†ÖVÖ&W'6†—2ç–ÆöBç&öö×2æÆVæwF‚Â"“°Ð¢76W'Bæö²†ÖVÖ&W'6†—2ç–ÆöBç&öö×2ç6öÖR‚‡&ööÒ’Óâ&ööÒæ6öFRÓÓÒf—'7D6öFRbb&ööÒæVÖö¦’ÓÓÒ/	úzÒ"’“°Ð Ð¢6öç7B¦ö–æVBÒv—BwVW7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFRçFôÆ÷vW$66R‚—Òö¦ö–æÂ°Ð¢ÖWF†öC¢%õ5B"ÀÐ¢&öG“¢²F—7Æ”æÖS¢$wVW7BÆ–Ör7&3×‚öæW'&÷#ÖÆW'Bƒ“â"ÐÐ¢Ò“°Ð¢76W'BæWVÂ†¦ö–æVBç–ÆöBç&ööÒæ6öFRÂf—'7D6öFR“°Ð¢6öç7BwVW7D–BÒ¦ö–æVBç–ÆöBç'F–6—çBæ–C°Ð Ð¢6öç7B7V7FF÷$¦ö–âÒv—B7V7FF÷"ç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÒö¦ö–æÂ°Ð¢ÖWF†öC¢%õ5B"ÀÐ¢&öG“¢²F—7Æ”æÖS¢%7V7FF÷""ÐÐ¢Ò“°Ð¢6öç7B7V7FF÷$–BÒ7V7FF÷$¦ö–âç–ÆöBç'F–6—çBæ–C°Ð Ð¢6öç7B†÷7E&ööÒÒv—B†÷7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÖ“°Ð¢6öç7B†÷7D–BÒ†÷7E&ööÒç–ÆöBç'F–6—çBæ–C°Ð¢76W'BæWVÂ††÷7E&ööÒç–ÆöBç&ööÒç'F–6—çG2æÆVæwF‚Â2“°Ð¢76W'Dæô¶W—2††÷7E&ööÒç–ÆöBÂæWr6WB…²'W6W$–B"Â&÷væW$VÖ–Â"Â'Fö¶Vç2"Â&vöövÆUFö¶Vç2"Â&Ö–7&÷6ögEFö¶Vç2%Ò’“°Ð Ð¢6öç7BÆ6W5F‚Òö’÷&öö×2òG¶f—'7D6öFWÒ÷Æ6W2öWFö6ö×ÆWFV°Ð¢v—B†÷7Bç&WVW7B‡Æ6W5F‚Â²W‡V7FVC¢CRÒ“°Ð¢v—B†÷7Bç&WVW7B‡Æ6W5F‚Â²ÖWF†öC¢%õ5B"ÂW‡V7FVC¢CRÒ“°Ð¢v—BV&Æ–56W76–öâç&WVW7B‡Æ6W5F‚Â°Ð¢ÖWF†öC¢%õ5B"ÀÐ¢W‡V7FVC¢C2ÀÐ¢&öG“¢²–çWC¢#F÷væ–ær7G&VWB"Â6W76–öåFö¶Vã¢'V&Æ–2×6W76–öâ"ÐÐ¢Ò“°Ð¢6öç7B6†÷'EÆ6W5VW'’Òv—B†÷7Bç&WVW7B‡Æ6W5F‚Â°Ð¢ÖWF†öC¢%õ5B"ÀÐ¢&öG“¢²–çWC¢%7B"Â6W76–öåFö¶Vã¢'6†÷'B×VW'’"ÐÐ¢Ò“°Ð¢76W'BæFVWWVÂ‡6†÷'EÆ6W5VW'’ç–ÆöBÂ²7VvvW7F–öç3¢µÒÒ“°Ð¢v—B†÷7Bç&WVW7B‡Æ6W5F‚Â°Ð¢ÖWF†öC¢%õ5B"ÀÐ¢W‡V7FVC¢CÀÐ¢&öG“¢²–çWC¢$F÷væ–ær7G&VWB"Â6W76–öåFö¶Vã¢'76W2&R–çfÆ–B"ÐÐ¢Ò“°Ð¢6öç7BÖ—76–æuÆ6W46öæf–wW&F–öâÒv—B†÷7Bç&WVW7B‡Æ6W5F‚Â°Ð¢ÖWF†öC¢%õ5B"ÀÐ¢W‡V7FVC¢S2ÀÐ¢&öG“¢²–çWC¢#F÷væ–ær7G&VWB"Â6W76–öåFö¶Vã¢'6Öö¶R×6W76–öâ"ÐÐ¢Ò“°Ð¢76W'BæWVÂ†Ö—76–æuÆ6W46öæf–wW&F–öâç–ÆöBæW'&÷"Â$FG&W727VvvW7F–öç2&Ræ÷B6öæf–wW&VBâ"“°Ð¢76W'Bæö²‚‚&¶W’"–âÖ—76–æuÆ6W46öæf–wW&F–öâç–ÆöB’“°Ð Ð¢6öç7BvVF†W%F‚Òö’÷&öö×2òG¶f—'7D6öFWÒ÷vVF†W"öf÷&V67F°Ð¢v—B†÷7Bç&WVW7B‡vVF†W%F‚Â²W‡V7FVC¢CRÒ“°Ð¢v—B†÷7Bç&WVW7B‡vVF†W%F‚Â²ÖWF†öC¢%õ5B"ÂW‡V7FVC¢CRÒ“°Ð¢v—BV&Æ–56W76–öâç&WVW7B‡vVF†W%F‚Â°Ð¢ÖWF†öC¢%õ5B"ÀÐ¢W‡V7FVC¢C2ÀÐ¢&öG“¢²ÆF—GVFS¢SãRÂÆöæv—GVFS¢Óã"ÐÐ¢Ò“°Ð¢v—B†÷7Bç&WVW7B‡vVF†W%F‚Â°Ð¢ÖWF†öC¢%õ5B"ÀÐ¢W‡V7FVC¢CÀÐ¢&öG“¢²ÆF—GVFS¢“ÂÆöæv—GVFS¢Óã"ÐÐ¢Ò“°Ð¢6öç7BÖ—76–æuvVF†W$6öæf–wW&F–öâÒv—B†÷7Bç&WVW7B‡vVF†W%F‚Â°Ð¢ÖWF†öC¢%õ5B"ÀÐ¢W‡V7FVC¢S2ÀÐ¢&öG“¢²ÆF—GVFS¢SãRÂÆöæv—GVFS¢Óã"ÐÐ¢Ò“°Ð¢76W'BæWVÂ†Ö—76–æuvVF†W$6öæf–wW&F–öâç–ÆöBæW'&÷"Â%vVF†W"f÷&V67G2&Ræ÷B6öæf–wW&VBâ"“°Ð¢76W'BæFVWWVÂ„ö&¦V7Bæ¶W—2†Ö—76–æuvVF†W$6öæf–wW&F–öâç–ÆöB’Â²&W'&÷"%Ò“°Ð Ð¢6öç7B†÷W&Ç•vVF†W%F‚Òö’÷&öö×2òG¶f—'7D6öFWÒ÷vVF†W"ö†÷W&Ç–°Ð¢v—B†÷7Bç&WVW7B††÷W&Ç•vVF†W%F‚Â²W‡V7FVC¢CRÒ“°Ð¢v—B†÷7Bç&WVW7B††÷W&Ç•vVF†W%F‚Â²ÖWF†öC¢%õ5B"ÂW‡V7FVC¢CRÒ“°Ð¢v—BV&Æ–56W76–öâç&WVW7B††÷W&Ç•vVF†W%F‚Â°Ð¢ÖWF†öC¢%õ5B"ÀÐ¢W‡V7FVC¢C2ÀÐ¢&öG“¢²ÆF—GVFS¢SãRÂÆöæv—GVFS¢Óã"ÂFFS¢###bÓ‚ÓB"ÐÐ¢Ò“°Ð¢v—B†÷7Bç&WVW7B††÷W&Ç•vVF†W%F‚Â°Ð¢ÖWF†öC¢%õ5B"ÀÐ¢W‡V7FVC¢CÀÐ¢&öG“¢²ÆF—GVFS¢SãRÂÆöæv—GVFS¢Óã"ÂFFS¢###bÓ"Ó3"ÐÐ¢Ò“°Ð¢6öç7BÖ—76–æt†÷W&Ç•vVF†W$6öæf–wW&F–öâÒv—B†÷7Bç&WVW7B††÷W&Ç•vVF†W%F‚Â°Ð¢ÖWF†öC¢%õ5B"ÀÐ¢W‡V7FVC¢S2ÀÐ¢&öG“¢²ÆF—GVFS¢SãRÂÆöæv—GVFS¢Óã"ÂFFS¢###bÓ‚ÓB"ÐÐ¢Ò“°Ð¢76W'BæWVÂ†Ö—76–æt†÷W&Ç•vVF†W$6öæf–wW&F–öâç–ÆöBæW'&÷"Â%vVF†W"f÷&V67G2&Ræ÷B6öæf–wW&VBâ"“°Ð¢76W'BæFVWWVÂ„ö&¦V7Bæ¶W—2†Ö—76–æt†÷W&Ç•vVF†W$6öæf–wW&F–öâç–ÆöB’Â²&W'&÷"%Ò“°Ð Ð¢f÷"†6öç7B²fÇVS¢6öÆ÷"ÒöbW‡V7FVE'F–6—çEÆWGFR’°Ð¢6öç7B&V6öÆ÷&VBÒv—B†÷7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÒ÷'F–6—çG2òG¶†÷7D–GÖÂ°Ð¢ÖWF†öC¢%D4‚"ÀÐ¢&öG“¢²6öÆ÷"ÐÐ¢Ò“°Ð¢76W'BæWVÂ‡&V6öÆ÷&VBç–ÆöBç'F–6—çBæ6öÆ÷"Â6öÆ÷"“°Ð¢ÐÐ¢6öç7BÖ–w&FVDÆVv7”6öÆ÷"Òv—B†÷7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÒ÷'F–6—çG2òG¶†÷7D–GÖÂ°Ð¢ÖWF†öC¢%D4‚"ÀÐ¢&öG“¢²6öÆ÷#¢"3$cdc”b"ÐÐ¢Ò“°Ð¢76W'BæWVÂ†Ö–w&FVDÆVv7”6öÆ÷"ç–ÆöBç'F–6—çBæ6öÆ÷"Â"3cSsS„"“°Ð Ð¢v—BwVW7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÖÂ°Ð¢ÖWF†öC¢%D4‚"ÀÐ¢W‡V7FVC¢C2ÀÐ¢&öG“¢²æÖS¢$æ÷BÆÆ÷vVB"ÐÐ¢Ò“°Ð Ð¢6öç7B7F'BÒ###bÓrÓ#C££ã¢#°Ð¢6öç7BVæBÒ###bÓrÓ#C£3£ã¢#°Ð¢6öç7B7&VFVDWfVçBÒv—B†÷7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÒöWfVçG6Â°Ð¢ÖWF†öC¢%õ5B"ÀÐ¢W‡V7FVC¢#ÀÐ¢&öG“¢°Ð¢F—FÆS¢""ÀÐ¢7F'BÀÐ¢VæBÀÐ¢F–ÖW¦öæS¢$6–ô¶öÆ¶F"ÀÐ¢Æö6F–öã¢$6fR"ÀÐ¢FW67&—F–öã¢%&ööÒ×f—6–&ÆR&÷÷6Â"ÀÐ¢–çf—FVU'F–6—çD–G3¢¶†÷7D–BÂwVW7D–EÒÀÐ¢7–æ5FôvöövÆS¢fÇ6PÐ¢ÐÐ¢Ò“°Ð¢6öç7BWfVçD–BÒ7&VFVDWfVçBç–ÆöBæWfVçBæ–C°Ð¢76W'BæWVÂ†7&VFVDWfVçBç–ÆöBæWfVçBçF—FÆRÂ"„æòF—FÆR’"“°Ð¢76W'BæWVÂ†7&VFVDWfVçBç–ÆöBæWfVçBçF–ÖW¦öæRÂ$6–ô¶öÆ¶F"“°Ð¢76W'BæWVÂ†7&VFVDWfVçBç–ÆöBæWfVçBæ7&VFVD'”F—7Æ”æÖRÂ$†÷7B"“°Ð¢76W'Dæô¶W—2†7&VFVDWfVçBç–ÆöBÂæWr6WB…²&vöövÆT6ÆVæF%7–æ2"Â&÷WFÆöö´6ÆVæF%7–æ2"Â&÷væW$VÖ–Â"Â'W6W$–B%Ò’“°Ð Ð¢6öç7BÆÄF•7F'BÒ###bÓrÓ•Cƒ£3£ã¢#°Ð¢6öç7BÆÄF”VæBÒ###bÓrÓ#Cƒ£3£ã¢#°Ð¢6öç7BÆÄF”WfVçBÒv—B†÷7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÒöWfVçG6Â°Ð¢ÖWF†öC¢%õ5B"ÀÐ¢W‡V7FVC¢#ÀÐ¢&öG“¢°Ð¢F—FÆS¢$Æö6ÂÆÂÖF’Æâ"ÀÐ¢7F'C¢ÆÄF•7F'BÀÐ¢VæC¢ÆÄF”VæBÀÐ¢F–ÖW¦öæS¢$6–ô¶öÆ¶F"ÀÐ¢ÆÄF“¢G'VRÀÐ¢–çf—FVU'F–6—çD–G3¢¶†÷7D–EÐÐ¢ÐÐ¢Ò“°Ð¢76W'BæWVÂ†ÆÄF”WfVçBç–ÆöBæWfVçBæFFRÂ###bÓrÓ#"“°Ð¢76W'BæWVÂ†ÆÄF”WfVçBç–ÆöBæWfVçBæÆÄF’ÂG'VR“°Ð Ð¢6öç7B&W6W'fVDÆÄF”WfVçBÒv—B†÷7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÒöWfVçG2òG¶ÆÄF”WfVçBç–ÆöBæWfVçBæ–GÖÂ°Ð¢ÖWF†öC¢%D4‚"ÀÐ¢&öG“¢°Ð¢F—FÆS¢%&VæÖVBÆÂÖF’Æâ"ÀÐ¢7F'C¢ÆÄF•7F'BÀÐ¢VæC¢ÆÄF”VæBÀÐ¢–çf—FVU'F–6—çD–G3¢¶†÷7D–EÐÐ¢ÐÐ¢Ò“°Ð¢76W'BæWVÂ‡&W6W'fVDÆÄF”WfVçBç–ÆöBæWfVçBçF–ÖW¦öæRÂ$6–ô¶öÆ¶F"“°Ð¢76W'BæWVÂ‡&W6W'fVDÆÄF”WfVçBç–ÆöBæWfVçBæFFRÂ###bÓrÓ#"“°Ð¢76W'BæWVÂ‡&W6W'fVDÆÄF”WfVçBç–ÆöBæWfVçBæÆÄF’ÂG'VR“°Ð¢6öç7BÆÄF”–72Òv—B†÷7Bç&WVW7B€Ð¢ö’÷&öö×2òG¶f—'7D6öFWÒöWfVçG2òG¶ÆÄF”WfVçBç–ÆöBæWfVçBæ–GÒö–76ÀÐ¢²66WC¢'FW‡Bö6ÆVæF""ÐÐ¢“°Ð¢76W'BæÖF6‚†ÆÄF”–72çFW‡BÂôEE5D%CµdÅTSÔDDS£##cs#ò“°Ð¢76W'BæÖF6‚†ÆÄF”–72çFW‡BÂôEDTäCµdÅTSÔDDS£##cs#ò“°Ð Ð¢6öç7BwVW7D–çf—FTæ÷F–f–6F–öç2Òv—BwVW7Bç&WVW7B‚"ö’öæ÷F–f–6F–öç2"“°Ð¢76W'Bæö²†wVW7D–çf—FTæ÷F–f–6F–öç2ç–ÆöBææ÷F–f–6F–öç2ç6öÖR‚†—FVÒ’Óâ—FVÒçG—RÓÓÒ&WfVçEö–çf—FR"’“°Ð Ð¢6öç7B7V7FF÷%&ööÒÒv—B7V7FF÷"ç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÖ“°Ð¢6öç7B7V7FF÷$WfVçBÒ7V7FF÷%&ööÒç–ÆöBç&ööÒæWfVçG2æf–æB‚†WfVçB’ÓâWfVçBæ–BÓÓÒWfVçD–B“°Ð¢76W'BæWVÂ‡7V7FF÷$WfVçBçF—FÆRÂ"„æòF—FÆR’"“°Ð¢76W'BæWVÂ‡7V7FF÷$WfVçBæ7&VFVD'”F—7Æ”æÖRÂ$†÷7B"“°Ð¢76W'BæWVÂ‡7V7FF÷$WfVçBæ—4–çf—FVBÂfÇ6R“°Ð¢v—B7V7FF÷"ç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÒöWfVçG2òG¶WfVçD–GÒ÷&W7öæFÂ°Ð¢ÖWF†öC¢%õ5B"ÀÐ¢W‡V7FVC¢C2ÀÐ¢&öG“¢²&W7öç6S¢'–W2"ÐÐ¢Ò“°Ð Ð¢6öç7Bf÷FRÒv—BwVW7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÒöWfVçG2òG¶WfVçD–GÒ÷&W7öæFÂ°Ð¢ÖWF†öC¢%õ5B"ÀÐ¢&öG“¢²&W7öç6S¢'–W2"ÐÐ¢Ò“°Ð¢76W'BæWVÂ‡f÷FRç–ÆöBæWfVçBç&W7öç6U7VÖÖ'’ç–W2Â“°Ð Ð¢v—BwVW7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÒöWfVçG2òG¶WfVçD–GÒö6öÖÖVçG6Â°Ð¢ÖWF†öC¢%õ5B"ÀÐ¢W‡V7FVC¢#ÀÐ¢&öG“¢²FW‡C¢#Æ–Ör–C×‡727&3×‚öæW'&÷#ÖÆW'Bƒ“âÆöö·2vööB"ÐÐ¢Ò“°Ð Ð¢v—BwVW7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÒöWfVçG2òG¶WfVçD–GÒ÷&W7öæFÂ°Ð¢ÖWF†öC¢%õ5B"ÀÐ¢W‡V7FVC¢³#ÂCÂC#%ÒÀÐ¢&öG“¢°Ð¢&W7öç6S¢'–W2"ÀÐ¢&÷÷6VE7F'C¢###bÓrÓ#C#££ã¢"ÀÐ¢&÷÷6VDVæC¢###bÓrÓ#C3££ã¢ Ð¢ÐÐ¢Ò“°Ð¢6öç7BVæ6†ævVE&ööÒÒv—B†÷7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÖ“°Ð¢6öç7BVæ6†ævVDWfVçBÒVæ6†ævVE&ööÒç–ÆöBç&ööÒæWfVçG2æf–æB‚†WfVçB’ÓâWfVçBæ–BÓÓÒWfVçD–B“°Ð¢76W'BæWVÂ‡Væ6†ævVDWfVçBç7F'BÂ7F'B“°Ð¢76W'BæWVÂ‡Væ6†ævVDWfVçBæVæBÂVæB“°Ð Ð¢6öç7BÖ÷fVE7F'BÒ###bÓrÓ#C£S£ã¢#°Ð¢6öç7BÖ÷fVDVæBÒ###bÓrÓ#C£CS£ã¢#°Ð¢6öç7BÖ÷fVDWfVçBÒv—B†÷7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÒöWfVçG2òG¶WfVçD–GÖÂ°Ð¢ÖWF†öC¢%D4‚"ÀÐ¢&öG“¢°Ð¢F—FÆS¢Væ6†ævVDWfVçBçF—FÆRÀÐ¢7F'C¢Ö÷fVE7F'BÀÐ¢VæC¢Ö÷fVDVæBÀÐ¢F–ÖW¦öæS¢Væ6†ævVDWfVçBçF–ÖW¦öæRÀÐ¢ÆÄF“¢fÇ6RÀÐ¢Æö6F–öã¢Væ6†ævVDWfVçBæÆö6F–öâÀÐ¢FW67&—F–öã¢Væ6†ævVDWfVçBæFW67&—F–öâÀÐ¢7–æ5FôvöövÆS¢Væ6†ævVDWfVçBç7–æ5FôvöövÆRÀÐ¢7–æ5Fô÷WFÆöö³¢Væ6†ævVDWfVçBç7–æ5Fô÷WFÆöö²ÀÐ¢–çf—FVU'F–6—çD–G3¢Væ6†ævVDWfVçBæ–çf—FVW2æÖ‚†–çf—FVR’Óâ–çf—FVRç'F–6—çD–BÐ¢ÐÐ¢Ò“°Ð¢76W'BæWVÂ†Ö÷fVDWfVçBç–ÆöBæWfVçBç7F'BÂÖ÷fVE7F'B“°Ð¢76W'BæWVÂ†Ö÷fVDWfVçBç–ÆöBæWfVçBæVæBÂÖ÷fVDVæB“°Ð¢76W'BæWVÂ†Ö÷fVDWfVçBç–ÆöBæWfVçBæÆö6F–öâÂ$6fR"“°Ð¢76W'BæWVÂ†Ö÷fVDWfVçBç–ÆöBæWfVçBæFW67&—F–öâÂ%&ööÒ×f—6–&ÆR&÷÷6Â"“°Ð¢76W'BæWVÂ€Ð¢æWrFFR†Ö÷fVDWfVçBç–ÆöBæWfVçBæVæB’ævWEF–ÖR‚’ÒæWrFFR†Ö÷fVDWfVçBç–ÆöBæWfVçBç7F'B’ævWEF–ÖR‚’ÀÐ¢3¢c¢ Ð¢“°Ð¢v—BwVW7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÒöWfVçG2òG¶WfVçD–GÖÂ°Ð¢ÖWF†öC¢%D4‚"ÀÐ¢W‡V7FVC¢C2ÀÐ¢&öG“¢°Ð¢F—FÆS¢Ö÷fVDWfVçBç–ÆöBæWfVçBçF—FÆRÀÐ¢7F'C¢###bÓrÓ#C#££ã¢"ÀÐ¢VæC¢###bÓrÓ#C#£3£ã¢"ÀÐ¢F–ÖW¦öæS¢Ö÷fVDWfVçBç–ÆöBæWfVçBçF–ÖW¦öæRÀÐ¢–çf—FVU'F–6—çD–G3¢¶†÷7D–BÂwVW7D–EÐÐ¢ÐÐ¢Ò“°Ð Ð¢6öç7Bg&VT'W7’Òv—B†÷7Bç&WVW7B€Ð¢ö’÷&öö×2òG¶f—'7D6öFWÒög&VV'W7“÷F–ÖTÖ–ãÓ##bÓrÓ#C££ã¢gF–ÖTÖƒÓ##bÓrÓ#C££ã¦ Ð¢“°Ð¢76W'Dæô¶W—2†g&VT'W7’ç–ÆöBÂæWr6WB…°Ð¢'W6W$–B"ÀÐ¢&÷væW$VÖ–Â"ÀÐ¢'F—FÆR"ÀÐ¢&Æö6F–öâ"ÀÐ¢&FW67&—F–öâ"ÀÐ¢&vöövÆT6ÆVæF%7–æ2"ÀÐ¢&÷WFÆöö´6ÆVæF%7–æ2 Ð¢Ò’“°Ð Ð¢v—B7F÷6W'fW"‡6W'fW"“°Ð¢6W'fW"Òv—B7F'E6W'fW"‚“°Ð¢76W'BæWVÂ€Ð¢†v—BV&Æ–56W76–öâç&WVW7B‚"ö’öÖR"’’ç–ÆöBçF†VÖRÀÐ¢&Æ–v‡B"ÀÐ¢$wVW7BF†VÖR&VfW&Væ6W2×W7B7W'f—fRâÆ–6F–öâ&W7F'B Ð¢“°Ð¢6öç7BW'6—7FVE&ööÒÒv—B†÷7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÖ“°Ð¢76W'Bæö²‡W'6—7FVE&ööÒç–ÆöBç&ööÒæWfVçG2ç6öÖR‚†WfVçB’ÓâWfVçBæ–BÓÓÒWfVçD–B’“°Ð Ð¢6öç7B&Vg&W6†VBÒv—B†÷7Bç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÒ÷&Vg&W6‚Ö6öFVÂ°Ð¢ÖWF†öC¢%õ5B Ð¢Ò“°Ð¢6öç7B&Vg&W6†VD6öFRÒ&Vg&W6†VBç–ÆöBç&ööÒæ6öFS°Ð¢76W'BæÖF6‚‡&Vg&W6†VD6öFRÂõå´Ô„¢ÔåÕ£"Ó•×³gÒBò“°Ð¢76W'Bææ÷DWVÂ‡&Vg&W6†VD6öFRÂf—'7D6öFR“°Ð¢v—BV&Æ–56W76–öâç&WVW7B†ö’÷&öö×2òG¶f—'7D6öFWÖÂ²W‡V7FVC¢CBÒ“°Ð Ð¢6öç7BÖ–w&FVDæ÷F–f–6F–öç2Òv—BwVW7Bç&WVW7B‚"ö’öæ÷F–f–6F–öç2"“°Ð¢76W'Bæö²€Ð¢Ö–w&FVDæ÷F–f–6F–öç2ç–ÆöBææ÷F–f–6F–öç0Ð¢æf–ÇFW"‚†—FVÒ’Óâ—FVÒæWfVçD–BÓÓÒWfVçD–BÐ¢æWfW'’‚†—FVÒ’Óâ—FVÒç&ööÔ6öFRÓÓÒ&Vg&W6†VD6öFR’ÀÐ¢$WfVçBæ÷F–f–6F–öç2vW&Ræ÷BÖ–w&FVBFòF†R&Vg&W6†VB&ööÒ6öFR Ð¢“°Ð Ð¢v—B†÷7Bç&WVW7B†ö’÷&öö×2òG·&Vg&W6†VD6öFWÖÂ²ÖWF†öC¢$DTÄUDR"Ò“°Ð¢6öç7BgFW$FVÆWFU&öö×2Òv—BwVW7Bç&WVW7B‚"ö’ö×’×&öö×2"“°Ð¢76W'Bæö²‚gFW$FVÆWFU&öö×2ç–ÆöBç&öö×2ç6öÖR‚‡&ööÒ’Óâ&ööÒæ6öFRÓÓÒ&Vg&W6†VD6öFR’“°Ð¢6öç7BgFW$FVÆWFTæ÷F–f–6F–öç2Òv—BwVW7Bç&WVW7B‚"ö’öæ÷F–f–6F–öç2"“°Ð¢76W'Bæö²‚gFW$FVÆWFTæ÷F–f–6F–öç2ç–ÆöBææ÷F–f–6F–öç2ç6öÖR‚†—FVÒ’Óâ—FVÒç&ööÔ6öFRÓÓÒ&Vg&W6†VD6öFR’“°Ð Ð¢6öç6öÆRæÆör‚$6öÖÖöäw&÷VæB6Öö¶R6†V6·276VBâ"“°Ð§Ò6F6‚†W'&÷"’°Ð¢6öç6öÆRæW'&÷"†W'&÷"ç7F6²ÇÂW'&÷"æÖW76vRÇÂW'&÷"“°Ð¢–b‡6W'fW"’6öç6öÆRæW'&÷"‡6W'fW"æÆöw2‚’“°Ð¢&ö6W72æW†—D6öFRÒ°Ð§Òf–æÆÇ’°Ð¢v—B7F÷6W'fW"‡6W'fW"“°Ð¢&Õ7–æ2‡'VçF–ÖTF—"Â²&V7W'6—fS¢G'VRÂf÷&6S¢G'VRÒ“°Ð§ÐÐ