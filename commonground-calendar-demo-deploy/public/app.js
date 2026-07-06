const groupStorageKey = "cg-groups-v2";

const fixedMemberColors = {
  You: "#1a73e8",
  Maya: "#d93025",
  Sam: "#188038",
  Leah: "#a142f4",
  Omar: "#f29900",
  Priya: "#12a4af",
  Jordan: "#e8710a",
  Nia: "#b80672",
  Callum: "#0b8043",
  Zara: "#8e24aa",
  Ben: "#c5221f",
  Iqra: "#1967d2",
  Tariq: "#f9ab00"
};

const colorPalette = [
  "#1a73e8",
  "#d93025",
  "#188038",
  "#a142f4",
  "#f29900",
  "#12a4af",
  "#e8710a",
  "#b80672",
  "#0b8043",
  "#1967d2"
];

const dayNames = [
  { key: "sun", short: "SUN", day: 0 },
  { key: "mon", short: "MON", day: 1 },
  { key: "tue", short: "TUE", day: 2 },
  { key: "wed", short: "WED", day: 3 },
  { key: "thu", short: "THU", day: 4 },
  { key: "fri", short: "FRI", day: 5 },
  { key: "sat", short: "SAT", day: 6 }
];

const defaultGroups = [
  {
    id: "uni",
    name: "Uni friends",
    type: "Weekend crew",
    members: ["You", "Maya", "Sam", "Leah", "Omar"],
    sampleBusy: {
      You: ["mon-09", "wed-18"],
      Maya: ["tue-11", "fri-18"],
      Sam: ["mon-14", "thu-20"],
      Leah: ["wed-10", "sat-14"],
      Omar: ["sun-15", "fri-20"]
    }
  },
  {
    id: "work",
    name: "Work mates",
    type: "After work",
    members: ["You", "Priya", "Jordan", "Nia"],
    sampleBusy: {
      You: ["mon-09", "tue-16"],
      Priya: ["mon-14", "wed-10", "fri-18"],
      Jordan: ["thu-13", "fri-12"],
      Nia: ["tue-11", "sat-10"]
    }
  },
  {
    id: "football",
    name: "Football group",
    type: "Activity group",
    members: ["You", "Callum", "Zara", "Ben", "Iqra", "Tariq"],
    sampleBusy: {
      You: ["sat-18"],
      Callum: ["sat-14", "wed-18"],
      Zara: ["fri-19", "sun-16"],
      Ben: ["sat-18", "thu-20"],
      Iqra: ["sun-14", "tue-16"],
      Tariq: ["fri-18", "mon-19"]
    }
  }
];

const calendarStartHour = 6;
const calendarEndHour = 23;
const hours = Array.from({ length: calendarEndHour - calendarStartHour }, (_, index) => index + calendarStartHour);
const weekStart = startOfWeek(new Date());
const displayDays = dayNames.map((day, index) => ({
  ...day,
  date: addDays(weekStart, index)
}));

const candidateSlots = [
  { id: "sun-10", day: 0, hour: 10, duration: 2 },
  { id: "sun-14", day: 0, hour: 14, duration: 2 },
  { id: "sun-16", day: 0, hour: 16, duration: 2 },
  { id: "mon-09", day: 1, hour: 9, duration: 2 },
  { id: "mon-14", day: 1, hour: 14, duration: 2 },
  { id: "mon-19", day: 1, hour: 19, duration: 2 },
  { id: "tue-11", day: 2, hour: 11, duration: 2 },
  { id: "tue-16", day: 2, hour: 16, duration: 2 },
  { id: "tue-20", day: 2, hour: 20, duration: 2 },
  { id: "wed-10", day: 3, hour: 10, duration: 2 },
  { id: "wed-18", day: 3, hour: 18, duration: 2 },
  { id: "thu-13", day: 4, hour: 13, duration: 2 },
  { id: "thu-20", day: 4, hour: 20, duration: 2 },
  { id: "fri-12", day: 5, hour: 12, duration: 2 },
  { id: "fri-18", day: 5, hour: 18, duration: 2 },
  { id: "fri-19", day: 5, hour: 19, duration: 2 },
  { id: "fri-20", day: 5, hour: 20, duration: 2 },
  { id: "sat-10", day: 6, hour: 10, duration: 2 },
  { id: "sat-14", day: 6, hour: 14, duration: 2 },
  { id: "sat-18", day: 6, hour: 18, duration: 2 }
];

let groups = loadGroups();
let selectedGroupId = groups[0].id;
const savedView = localStorage.getItem("cg-view");
let currentView = ["day", "week", "month", "year"].includes(savedView) ? savedView : "week";
let googleBusy = [];
let liveMeta = null;
let freebusySource = "none";
let googleConnected = false;
let googleUser = null;
let demoBypass = false;
let refreshTimer = null;

const authGate = document.querySelector("#authGate");
const appShell = document.querySelector("#appShell");
const groupList = document.querySelector("#groups");
const groupName = document.querySelector("#groupName");
const groupType = document.querySelector("#groupType");
const calendarGrid = document.querySelector("#calendarGrid");
const sourcePill = document.querySelector("#sourcePill");
const connectionStatus = document.querySelector("#connectionStatus");
const themeToggle = document.querySelector("#themeToggle");
const addPersonForm = document.querySelector("#addPersonForm");
const personNameInput = document.querySelector("#personName");
const viewSwitcher = document.querySelector("#viewSwitcher");

document.querySelector("#connectButton").addEventListener("click", () => {
  window.location.href = "/auth/google";
});

document.querySelector("#demoButton").addEventListener("click", async () => {
  demoBypass = true;
  await loadAvailability();
  showApp();
});

document.querySelector("#refreshButton").addEventListener("click", async () => {
  await loadAvailability();
  render();
});

document.querySelector("#reconnectButton").addEventListener("click", () => {
  window.location.href = "/auth/google";
});

themeToggle.addEventListener("change", () => {
  const theme = themeToggle.checked ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("cg-theme", theme);
});

viewSwitcher.addEventListener("click", (event) => {
  const button = event.target.closest("[data-view]");
  if (!button) return;
  currentView = button.dataset.view;
  localStorage.setItem("cg-view", currentView);
  loadAvailability().then(render);
});

addPersonForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = personNameInput.value.trim();
  if (!name) return;

  const group = activeGroup();
  const exists = group.members.some((member) => member.toLowerCase() === name.toLowerCase());
  if (!exists) {
    group.members.push(name);
    group.sampleBusy[name] = [];
    saveGroups();
    render();
  }
  personNameInput.value = "";
});

function loadGroups() {
  const stored = localStorage.getItem(groupStorageKey);
  if (!stored) return cloneDefaultGroups();

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length ? parsed : cloneDefaultGroups();
  } catch {
    return cloneDefaultGroups();
  }
}

function saveGroups() {
  localStorage.setItem(groupStorageKey, JSON.stringify(groups));
}

function cloneDefaultGroups() {
  return JSON.parse(JSON.stringify(defaultGroups));
}

function colorFor(member) {
  if (fixedMemberColors[member]) return fixedMemberColors[member];
  const hash = [...member].reduce((total, char) => total + char.charCodeAt(0), 0);
  return colorPalette[hash % colorPalette.length];
}

function activeGroup() {
  return groups.find((group) => group.id === selectedGroupId) || groups[0];
}

function startOfWeek(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function sameDate(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateForSlot(slot) {
  const day = displayDays.find((item) => item.day === slot.day);
  const date = new Date(day.date);
  date.setHours(slot.hour, 0, 0, 0);
  return date;
}

function formatRange() {
  const start = displayDays[0].date;
  const end = displayDays[6].date;
  const startLabel = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(start);
  const endLabel = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(end);
  return `${startLabel} - ${endLabel}`;
}

function formatMonthYear(date) {
  return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(date);
}

function formatDayHeader(day) {
  const dayNumber = new Intl.DateTimeFormat(undefined, { day: "numeric" }).format(day.date);
  return `<span>${day.short}</span><strong>${dayNumber}</strong>`;
}

function formatHour(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const face = hour % 12 || 12;
  return `${face} ${suffix}`;
}

function formatTime(hour) {
  const wholeHour = Math.floor(hour);
  const minutes = Math.round((hour - wholeHour) * 60);
  const suffix = wholeHour >= 12 ? "PM" : "AM";
  const face = wholeHour % 12 || 12;
  return `${face}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function googleBlocksSlot(slot) {
  const start = dateForSlot(slot);
  const end = new Date(start);
  end.setHours(end.getHours() + slot.duration);

  return googleBusy.some((busy) => {
    const busyStart = new Date(busy.start);
    const busyEnd = new Date(busy.end);
    return busyStart < end && busyEnd > start;
  });
}

function usesDemoData() {
  return demoBypass && freebusySource !== "google";
}

function scoreSlot(group, slot) {
  const busyPeople = [];
  for (const member of group.members) {
    const isYou = member === "You";
    const isBusy =
      isYou && freebusySource === "google"
        ? googleBlocksSlot(slot)
        : usesDemoData() && group.sampleBusy[member]?.includes(slot.id);
    if (isBusy) busyPeople.push(member);
  }

  return {
    slot,
    date: dateForSlot(slot),
    busyPeople
  };
}

function sampleBusyEvents(group) {
  if (!usesDemoData()) return [];

  const events = [];
  for (const member of group.members) {
    const slots = group.sampleBusy[member] || [];
    for (const slotId of slots) {
      const slot = candidateSlots.find((candidate) => candidate.id === slotId);
      if (!slot) continue;
      const date = dateForSlot(slot);
      events.push({
        member,
        date,
        dateKey: dateKey(date),
        day: slot.day,
        startHour: slot.hour,
        duration: slot.duration
      });
    }
  }
  return events;
}

function googleBusyEvents() {
  if (freebusySource !== "google") return [];

  return googleBusy.flatMap((busy) => splitGoogleBusyBlock(new Date(busy.start), new Date(busy.end), busy));
}

function splitGoogleBusyBlock(start, end, sourceBlock) {
  const events = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);

  while (cursor < end) {
    const dayStart = new Date(cursor);
    const dayEnd = addDays(dayStart, 1);
    const segmentStart = start > dayStart ? start : dayStart;
    const segmentEnd = end < dayEnd ? end : dayEnd;

    const rawStartHour = sameDate(segmentStart, dayStart)
      ? segmentStart.getHours() + segmentStart.getMinutes() / 60
      : 0;
    const rawEndHour = sameDate(segmentEnd, dayStart)
      ? segmentEnd.getHours() + segmentEnd.getMinutes() / 60
      : 24;
    const clampedStart = Math.max(calendarStartHour, rawStartHour);
    const clampedEnd = Math.min(calendarEndHour, rawEndHour);

    if (clampedEnd > clampedStart) {
      events.push({
        member: sourceBlock.ownerName || sourceBlock.calendarSummary || googleUser?.name || "You",
        date: new Date(dayStart),
        dateKey: dateKey(dayStart),
        day: dayStart.getDay(),
        startHour: clampedStart,
        duration: clampedEnd - clampedStart,
        calendarId: sourceBlock.calendarId,
        calendarColor: sourceBlock.calendarColor
      });
    }

    cursor.setDate(cursor.getDate() + 1);
  }

  return events;
}

function busyEvents(group) {
  return [...sampleBusyEvents(group), ...googleBusyEvents()];
}

function freeSlots(group) {
  if (googleConnected && freebusySource !== "google" && !usesDemoData()) return [];

  return candidateSlots
    .map((slot) => scoreSlot(group, slot))
    .filter((entry) => entry.busyPeople.length === 0);
}

function renderGroups() {
  groupList.innerHTML = "";
  for (const group of groups) {
    const button = document.createElement("button");
    button.className = `group-button ${group.id === selectedGroupId ? "active" : ""}`;
    button.innerHTML = `<strong>${group.name}</strong><span>${group.members.length} people</span>`;
    button.addEventListener("click", () => {
      selectedGroupId = group.id;
      render();
    });
    groupList.appendChild(button);
  }
}

function renderCalendar(group) {
  calendarGrid.innerHTML = "";
  calendarGrid.className = `calendar-grid ${currentView}-view`;

  if (currentView === "day") {
    renderPlanner(group, [displayDays[new Date().getDay()]]);
    return;
  }

  if (currentView === "month") {
    renderMonth(group);
    return;
  }

  if (currentView === "year") {
    renderYear(group);
    return;
  }

  renderPlanner(group, displayDays);
}

function renderPlanner(group, days) {
  calendarGrid.style.setProperty("--day-count", days.length);
  calendarGrid.style.setProperty("--hour-count", hours.length);

  const corner = document.createElement("div");
  corner.className = "calendar-corner";
  calendarGrid.appendChild(corner);

  for (const day of days) {
    const header = document.createElement("div");
    header.className = `day-header ${sameDate(day.date, new Date()) ? "today" : ""}`;
    header.innerHTML = formatDayHeader(day);
    calendarGrid.appendChild(header);
  }

  for (const hour of hours) {
    const timeCell = document.createElement("div");
    timeCell.className = "time-cell";
    timeCell.textContent = formatHour(hour);
    calendarGrid.appendChild(timeCell);

    for (const day of days) {
      const cell = document.createElement("div");
      cell.className = "calendar-cell";
      cell.dataset.day = day.day;
      cell.dataset.hour = hour;
      calendarGrid.appendChild(cell);
    }
  }

  const eventsLayer = document.createElement("div");
  eventsLayer.className = "events-layer";
  calendarGrid.appendChild(eventsLayer);

  const visibleDays = new Set(days.map((day) => day.day));

  const laneCounts = new Map();
  for (const event of busyEvents(group).filter((entry) => visibleDays.has(entry.day))) {
    const lane = laneCounts.get(event.day) || 0;
    laneCounts.set(event.day, lane + 1);
    eventsLayer.appendChild(createBusyBlock(event, lane, days));
  }
}

function createBusyBlock(event, lane, days) {
  const dayIndex = days.findIndex((day) => day.day === event.day);
  const block = document.createElement("div");
  block.className = "busy-block";
  block.style.setProperty("--day-index", dayIndex);
  block.style.setProperty("--start", event.startHour - calendarStartHour);
  block.style.setProperty("--duration", event.duration);
  block.style.setProperty("--lane", lane % 3);
  block.style.setProperty("--event-color", event.calendarColor || colorFor(event.member));
  block.innerHTML = `<strong>${event.member}</strong><span>${formatTime(event.startHour)} busy</span>`;
  return block;
}

function renderMonth(group) {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const gridStart = startOfWeek(monthStart);
  const busyByDate = groupByDate(busyEvents(group));

  for (const day of dayNames) {
    const header = document.createElement("div");
    header.className = "month-weekday";
    header.textContent = day.short;
    calendarGrid.appendChild(header);
  }

  for (let index = 0; index < 42; index += 1) {
    const date = addDays(gridStart, index);
    const key = dateKey(date);
    const cell = document.createElement("div");
    cell.className = [
      "month-cell",
      date.getMonth() !== today.getMonth() ? "muted-month" : "",
      sameDate(date, today) ? "today" : ""
    ].filter(Boolean).join(" ");
    cell.innerHTML = `<strong>${date.getDate()}</strong>`;

    const entries = [
      ...(busyByDate.get(key) || []).slice(0, 3).map((event) => ({ label: `${event.member} busy`, className: "busy-chip", member: event.member }))
    ];

    for (const entry of entries) {
      const chip = document.createElement("span");
      chip.className = entry.className;
      if (entry.member) chip.style.setProperty("--event-color", colorFor(entry.member));
      chip.textContent = entry.label;
      cell.appendChild(chip);
    }

    calendarGrid.appendChild(cell);
  }
}

function renderYear(group) {
  const today = new Date();
  const busyDates = new Set(busyEvents(group).map((event) => event.dateKey));

  for (let month = 0; month < 12; month += 1) {
    const tile = document.createElement("section");
    tile.className = "year-month";
    const title = document.createElement("h3");
    title.textContent = new Intl.DateTimeFormat(undefined, { month: "long" }).format(new Date(today.getFullYear(), month, 1));
    tile.appendChild(title);

    const mini = document.createElement("div");
    mini.className = "mini-month";
    for (const day of dayNames) {
      const label = document.createElement("span");
      label.className = "mini-weekday";
      label.textContent = day.short.slice(0, 1);
      mini.appendChild(label);
    }

    const first = new Date(today.getFullYear(), month, 1);
    const start = startOfWeek(first);
    for (let index = 0; index < 42; index += 1) {
      const date = addDays(start, index);
      const key = dateKey(date);
      const day = document.createElement("span");
      day.className = [
        "mini-day",
        date.getMonth() !== month ? "muted-month" : "",
        sameDate(date, today) ? "today" : "",
        busyDates.has(key) ? "has-busy" : ""
      ].filter(Boolean).join(" ");
      day.textContent = date.getDate();
      mini.appendChild(day);
    }
    tile.appendChild(mini);
    calendarGrid.appendChild(tile);
  }
}

function groupByDate(items) {
  const grouped = new Map();
  for (const item of items) {
    const key = item.dateKey || dateKey(item.date);
    grouped.set(key, [...(grouped.get(key) || []), item]);
  }
  return grouped;
}

function renderViewButtons() {
  for (const button of viewSwitcher.querySelectorAll("[data-view]")) {
    button.classList.toggle("active", button.dataset.view === currentView);
  }
}

function render() {
  const group = activeGroup();
  groupName.textContent = group.name;
  const viewNames = { day: "Day", week: "Week", month: "Month", year: "Year" };
  groupType.textContent = `${viewNames[currentView]} planner - ${currentView === "year" ? new Date().getFullYear() : currentView === "month" ? formatMonthYear(new Date()) : formatRange()}`;
  sourcePill.textContent = liveStatusText();
  sourcePill.classList.toggle("error", freebusySource === "error");
  renderGroups();
  renderViewButtons();
  renderCalendar(group);
}

function liveStatusText() {
  if (freebusySource === "error") {
    return liveMeta?.error?.includes("disabled") ? "Google Calendar API disabled" : "Google fetch error";
  }
  if (freebusySource === "google") {
    const calendarCount = liveMeta?.calendarCount || 1;
    const suffix = liveMeta?.needsReconnect ? " · reconnect for all calendars" : "";
    const name = googleUser?.name || "Google";
    return `${name} live · ${calendarCount} cal · ${googleBusy.length} busy${suffix}`;
  }
  return demoBypass ? "Demo sample data" : "Not connected";
}

function showGate() {
  authGate.classList.remove("hidden");
  appShell.classList.add("hidden");
}

function showApp() {
  authGate.classList.add("hidden");
  appShell.classList.remove("hidden");
  render();
  startLiveRefresh();
}

function startLiveRefresh() {
  window.clearInterval(refreshTimer);
  if (!googleConnected) return;
  refreshTimer = window.setInterval(async () => {
    await loadAvailability();
    render();
  }, 20_000);
}

async function loadConfig() {
  const [configResponse, meResponse] = await Promise.all([
    fetch("/api/config"),
    fetch("/api/me")
  ]);
  const config = await configResponse.json();
  const me = await meResponse.json();

  googleConnected = Boolean(me.connected);
  googleUser = me.user || null;

  if (!config.googleReady) {
    connectionStatus.innerHTML = `<span class="warn">Google credentials not found. Use the demo bypass.</span>`;
  } else if (googleConnected) {
    const name = googleUser?.name ? ` as ${googleUser.name}` : "";
    const reconnect = me.needsProfileReconnect ? " Reconnect to add your name." : "";
    connectionStatus.innerHTML = `<span class="connected">Google Calendar connected${name}.${reconnect}</span>`;
  } else {
    connectionStatus.textContent = "Connect Google Calendar to enter the planner.";
  }
}

function visibleRange() {
  const today = new Date();

  if (currentView === "day") {
    const day = displayDays[today.getDay()].date;
    return {
      start: day,
      end: addDays(day, 1)
    };
  }

  if (currentView === "month") {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const start = startOfWeek(monthStart);
    return {
      start,
      end: addDays(start, 42)
    };
  }

  if (currentView === "year") {
    return {
      start: new Date(today.getFullYear(), 0, 1),
      end: new Date(today.getFullYear() + 1, 0, 1)
    };
  }

  return {
    start: displayDays[0].date,
    end: addDays(displayDays[6].date, 1)
  };
}

async function loadAvailability() {
  const range = visibleRange();
  const params = new URLSearchParams({
    timeMin: range.start.toISOString(),
    timeMax: range.end.toISOString()
  });
  let response = await fetch(`/api/freebusy?${params.toString()}`, { cache: "no-store" });
  let data = await response.json();
  if (data.source === "none" && googleConnected) {
    const meResponse = await fetch("/api/me", { cache: "no-store" });
    const me = await meResponse.json();
    googleConnected = Boolean(me.connected);
    if (googleConnected) {
      response = await fetch(`/api/freebusy?${params.toString()}`, { cache: "no-store" });
      data = await response.json();
    }
  }
  googleBusy = data.busy || [];
  liveMeta = {
    calendarCount: data.calendarCount,
    calendars: data.calendars || [],
    fetchedAt: data.fetchedAt,
    needsReconnect: Boolean(data.needsReconnect),
    calendarListError: data.calendarListError,
    error: data.error
  };
  freebusySource = data.error ? "error" : googleConnected && data.source === "google" ? "google" : demoBypass ? "demo" : "none";
  sourcePill.textContent = liveStatusText();
  sourcePill.classList.toggle("error", freebusySource === "error");
}

async function boot() {
  const storedTheme = localStorage.getItem("cg-theme") || "light";
  document.documentElement.dataset.theme = storedTheme;
  themeToggle.checked = storedTheme === "dark";

  const params = new URLSearchParams(window.location.search);
  const oauthError = params.get("error");

  await loadConfig();

  if (oauthError) {
    connectionStatus.innerHTML = `<span class="warn">Google sign-in error: ${oauthError}</span>`;
  }

  if (googleConnected) {
    await loadAvailability();
    showApp();
    return;
  }

  if (demoBypass) {
    await loadAvailability();
    showApp();
    return;
  }

  showGate();
}

boot();
