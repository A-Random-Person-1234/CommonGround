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

const demoBusy = [
  { ownerName: "Maya", start: nextDate(1, 9), end: nextDate(1, 11) },
  { ownerName: "Sam", start: nextDate(1, 14), end: nextDate(1, 16) },
  { ownerName: "Leah", start: nextDate(2, 11), end: nextDate(2, 13) },
  { ownerName: "Omar", start: nextDate(3, 18), end: nextDate(3, 20) },
  { ownerName: "Priya", start: nextDate(5, 12), end: nextDate(5, 14) }
];

const calendarStartHour = 6;
const calendarEndHour = 23;
const hours = Array.from({ length: calendarEndHour - calendarStartHour }, (_, index) => index + calendarStartHour);

let displayWeekStart = startOfWeek(new Date());
let displayDays = makeDisplayDays(displayWeekStart);
const savedView = localStorage.getItem("cg-view");
let currentView = ["day", "week", "month", "year"].includes(savedView) ? savedView : "week";
let googleBusy = [];
let participants = [];
let liveMeta = null;
let freebusySource = "none";
let googleConnected = false;
let googleReady = false;
let googleUser = null;
let refreshTimer = null;

const calendarGrid = document.querySelector("#calendarGrid");
const sourcePill = document.querySelector("#sourcePill");
const themeToggle = document.querySelector("#themeToggle");
const viewSwitcher = document.querySelector("#viewSwitcher");
const connectButton = document.querySelector("#connectButton");
const heroConnectButton = document.querySelector("#heroConnectButton");
const refreshButton = document.querySelector("#refreshButton");
const introCard = document.querySelector("#introCard");
const peopleList = document.querySelector("#peopleList");
const peopleCount = document.querySelector("#peopleCount");
const pageTitle = document.querySelector("#pageTitle");

connectButton.addEventListener("click", () => {
  window.location.href = "/auth/google";
});

heroConnectButton.addEventListener("click", () => {
  window.location.href = "/auth/google";
});

refreshButton.addEventListener("click", async () => {
  await refreshAll();
});

themeToggle.addEventListener("change", () => {
  const theme = themeToggle.checked ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("cg-theme", theme);
});

viewSwitcher.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-view]");
  if (!button) return;
  currentView = button.dataset.view;
  localStorage.setItem("cg-view", currentView);
  await loadAvailability();
  render();
});

function nextDate(day, hour) {
  const week = startOfWeek(new Date());
  const date = addDays(week, day);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

function startOfWeek(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function makeDisplayDays(start) {
  return dayNames.map((day, index) => ({ ...day, date: addDays(start, index) }));
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

function colorFor(member) {
  const name = typeof member === "string" ? member : member?.name || "Member";
  const hash = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
  return colorPalette[hash % colorPalette.length];
}

function visibleRange() {
  const today = new Date();

  if (currentView === "day") {
    const day = displayDays[today.getDay()].date;
    return { start: day, end: addDays(day, 1) };
  }

  if (currentView === "month") {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return { start: startOfWeek(monthStart), end: addDays(startOfWeek(monthEnd), 7) };
  }

  if (currentView === "year") {
    return {
      start: new Date(today.getFullYear(), 0, 1),
      end: new Date(today.getFullYear() + 1, 0, 1)
    };
  }

  return { start: displayDays[0].date, end: addDays(displayDays[6].date, 1) };
}

async function loadConfig() {
  const [configResponse, meResponse, participantsResponse] = await Promise.all([
    fetch("/api/config"),
    fetch("/api/me"),
    fetch("/api/participants")
  ]);

  const config = await configResponse.json();
  const me = await meResponse.json();
  const people = await participantsResponse.json();

  googleReady = Boolean(config.googleReady);
  googleConnected = Boolean(me.connected);
  googleUser = me.user || null;
  participants = people.participants || [];
}

async function loadAvailability() {
  if (!googleConnected) {
    googleBusy = demoBusy;
    freebusySource = "demo";
    liveMeta = null;
    return;
  }

  const range = visibleRange();
  try {
    const params = new URLSearchParams({
      timeMin: range.start.toISOString(),
      timeMax: range.end.toISOString()
    });
    const response = await fetch(`/api/shared/freebusy?${params}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Could not load shared availability.");
    }

    googleBusy = data.busy || [];
    participants = data.members || participants;
    freebusySource = "google";
    liveMeta = data;
  } catch (error) {
    googleBusy = [];
    freebusySource = "error";
    liveMeta = { error: error.message };
  }
}

async function refreshAll() {
  await loadConfig();
  await loadAvailability();
  render();
  startLiveRefresh();
}

function busyEvents() {
  return googleBusy.flatMap((busy) => splitBusyBlock(new Date(busy.start), new Date(busy.end), busy));
}

function splitBusyBlock(start, end, sourceBlock) {
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
        member: sourceBlock.ownerName || "Member",
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

function liveStatusText() {
  if (!googleReady) return "Google not configured";
  if (freebusySource === "error") return "Google fetch error";
  if (freebusySource === "google") {
    const connectedCount = liveMeta?.connectedCount || participants.length || 0;
    return `${connectedCount} live · ${googleBusy.length} busy`;
  }
  return googleConnected ? "Connected" : "Preview mode";
}

function renderParticipants() {
  peopleList.innerHTML = "";
  const people = googleConnected ? participants : [
    { name: "Maya", connected: true },
    { name: "Sam", connected: true },
    { name: "Leah", connected: true }
  ];

  peopleCount.textContent = `${people.length} ${people.length === 1 ? "person" : "people"}`;

  if (!people.length) {
    peopleList.innerHTML = `<div class="empty-state">No one has connected yet. Connect Google Calendar to become the first person on this board.</div>`;
    return;
  }

  for (const person of people) {
    const item = document.createElement("div");
    item.className = "person-card";
    const color = colorFor(person.name);
    item.innerHTML = `
      <span class="avatar" style="--avatar-color: ${color}">${initials(person.name)}</span>
      <div>
        <strong>${escapeHtml(person.isYou ? `${person.name} (you)` : person.name)}</strong>
        <span>${person.connected ? "Calendar connected" : "Not connected"}</span>
      </div>
    `;
    peopleList.appendChild(item);
  }
}

function initials(name) {
  return String(name || "M")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "M";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[char]));
}

function renderViewButtons() {
  for (const button of viewSwitcher.querySelectorAll("[data-view]")) {
    button.classList.toggle("active", button.dataset.view === currentView);
  }
}

function render() {
  const viewNames = { day: "Day", week: "Week", month: "Month", year: "Year" };
  pageTitle.textContent = currentView === "year"
    ? `Shared calendar · ${new Date().getFullYear()}`
    : currentView === "month"
      ? `Shared calendar · ${formatMonthYear(new Date())}`
      : `Shared calendar · ${formatRange()}`;

  introCard.classList.toggle("hidden", googleConnected);
  connectButton.textContent = googleConnected ? "Reconnect" : "Connect Google";
  sourcePill.textContent = liveStatusText();
  sourcePill.classList.toggle("error", freebusySource === "error" || !googleReady);
  renderParticipants();
  renderViewButtons();
  renderCalendar();
}

function renderCalendar() {
  calendarGrid.innerHTML = "";
  calendarGrid.className = `calendar-grid ${currentView}-view`;

  if (currentView === "day") {
    renderPlanner([displayDays[new Date().getDay()]]);
    return;
  }

  if (currentView === "month") {
    renderMonth();
    return;
  }

  if (currentView === "year") {
    renderYear();
    return;
  }

  renderPlanner(displayDays);
}

function renderPlanner(days) {
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
  for (const event of busyEvents().filter((entry) => visibleDays.has(entry.day))) {
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
  block.innerHTML = `<strong>${escapeHtml(event.member)}</strong><span>${formatTime(event.startHour)} busy</span>`;
  return block;
}

function renderMonth() {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const gridStart = startOfWeek(monthStart);
  const busyByDate = groupByDate(busyEvents());

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

    for (const event of (busyByDate.get(key) || []).slice(0, 3)) {
      const chip = document.createElement("span");
      chip.className = "busy-chip";
      chip.style.setProperty("--event-color", event.calendarColor || colorFor(event.member));
      chip.textContent = `${event.member} busy`;
      cell.appendChild(chip);
    }

    calendarGrid.appendChild(cell);
  }
}

function renderYear() {
  const today = new Date();
  const busyDates = new Set(busyEvents().map((event) => event.dateKey));

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

function startLiveRefresh() {
  window.clearInterval(refreshTimer);
  if (!googleConnected) return;
  refreshTimer = window.setInterval(async () => {
    await refreshAll();
  }, 20_000);
}

function applyInitialTheme() {
  const savedTheme = localStorage.getItem("cg-theme") || "light";
  document.documentElement.dataset.theme = savedTheme;
  themeToggle.checked = savedTheme === "dark";
}

async function init() {
  applyInitialTheme();
  await refreshAll();
}

init();
