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
    members: [{ id: "you", name: "You" }, { id: "maya", name: "Maya" }, { id: "sam", name: "Sam" }, { id: "leah", name: "Leah" }, { id: "omar", name: "Omar" }],
    pendingMembers: [],
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
    members: [{ id: "you", name: "You" }, { id: "priya", name: "Priya" }, { id: "jordan", name: "Jordan" }, { id: "nia", name: "Nia" }],
    pendingMembers: [],
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
    members: [{ id: "you", name: "You" }, { id: "callum", name: "Callum" }, { id: "zara", name: "Zara" }, { id: "ben", name: "Ben" }, { id: "iqra", name: "Iqra" }, { id: "tariq", name: "Tariq" }],
    pendingMembers: [],
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

let groups = cloneDefaultGroups();
let selectedGroupId = groups[0]?.id || null;
const savedView = localStorage.getItem("cg-view");
let currentView = ["day", "week", "month", "year"].includes(savedView) ? savedView : "week";
let googleBusy = [];
let liveMeta = null;
let freebusySource = "none";
let googleConnected = false;
let googleUser = null;
let demoBypass = false;
let refreshTimer = null;
let usingServerGroups = false;

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
const createGroupForm = document.querySelector("#createGroupForm");
const newGroupNameInput = document.querySelector("#newGroupName");
const newGroupTypeInput = document.querySelector("#newGroupType");

document.querySelector("#connectButton").addEventListener("click", () => {
  window.location.href = "/auth/google";
});

document.querySelector("#demoButton").addEventListener("click", async () => {
  demoBypass = true;
  usingServerGroups = false;
  groups = cloneDefaultGroups();
  selectedGroupId = groups[0]?.id || null;
  await loadAvailability();
  showApp();
});

document.querySelector("#refreshButton").addEventListener("click", async () => {
  await refreshAll();
});

document.querySelector("#reconnectButton").addEventListener("click", () => {
  window.location.href = "/auth/google";
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

createGroupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = newGroupNameInput.value.trim();
  const type = newGroupTypeInput.value.trim();
  if (!name) return;

  if (usesDemoData()) {
    const id = `demo-${Math.random().toString(16).slice(2, 10)}`;
    groups.unshift({
      id,
      name,
      type: type || "Friend group",
      members: [{ id: "you", name: "You" }],
      pendingMembers: [],
      sampleBusy: { You: [] }
    });
    selectedGroupId = id;
    newGroupNameInput.value = "";
    newGroupTypeInput.value = "";
    render();
    return;
  }

  const response = await fetch("/api/groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, type })
  });
  const data = await response.json();
  if (!response.ok) {
    connectionStatus.innerHTML = `<span class="warn">${data.error || "Could not create group."}</span>`;
    return;
  }

  groups.unshift(data.group);
  selectedGroupId = data.group.id;
  usingServerGroups = true;
  newGroupNameInput.value = "";
  newGroupTypeInput.value = "";
  await loadAvailability();
  render();
});

addPersonForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const identifier = personNameInput.value.trim();
  if (!identifier) return;

  const group = activeGroup();
  if (!group) return;

  if (usesDemoData()) {
    const exists = group.members.some((member) => member.name.toLowerCase() === identifier.toLowerCase());
    if (!exists) {
      group.members.push({ id: identifier.toLowerCase(), name: identifier });
      group.sampleBusy[identifier] = [];
      render();
    }
    personNameInput.value = "";
    return;
  }

  const response = await fetch(`/api/groups/${group.id}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier })
  });
  const data = await response.json();
  if (!response.ok) {
    connectionStatus.innerHTML = `<span class="warn">${data.error || "Could not add that person."}</span>`;
    return;
  }

  replaceGroup(data.group);
  personNameInput.value = "";
  render();
});

function cloneDefaultGroups() {
  return JSON.parse(JSON.stringify(defaultGroups));
}

function colorFor(member) {
  const name = typeof member === "string" ? member : member?.name || "Member";
  if (fixedMemberColors[name]) return fixedMemberColors[name];
  const hash = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
  return colorPalette[hash % colorPalette.length];
}

function activeGroup() {
  return groups.find((group) => group.id === selectedGroupId) || null;
}

function replaceGroup(nextGroup) {
  groups = groups.map((group) => group.id === nextGroup.id ? nextGroup : group);
}

function ensureSelectedGroup() {
  if (selectedGroupId && groups.some((group) => group.id === selectedGroupId)) return;
  selectedGroupId = groups[0]?.id || null;
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

function usesDemoData() {
  return demoBypass || !googleConnected;
}

function sampleBusyEvents(group) {
  if (!usesDemoData() || !group?.sampleBusy) return [];

  const events = [];
  for (const member of group.members || []) {
    const name = member.name || member;
    const slots = group.sampleBusy[name] || [];
    for (const slotId of slots) {
      const slot = candidateSlots.find((candidate) => candidate.id === slotId);
      if (!slot) continue;
      const date = dateForSlot(slot);
      events.push({
        member: name,
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

function busyEvents(group) {
  return [...sampleBusyEvents(group), ...googleBusyEvents()];
}

function renderGroups() {
  groupList.innerHTML = "";

  if (!groups.length) {
    const empty = document.createElement("div");
    empty.className = "groups-empty";
    empty.textContent = googleConnected
      ? "Create your first group, then add people by email so they can join the same shared calendar."
      : "Use the demo bypass to explore the layout.";
    groupList.appendChild(empty);
    return;
  }

  for (const group of groups) {
    const button = document.createElement("button");
    button.className = `group-button ${group.id === selectedGroupId ? "active" : ""}`;
    const pendingCount = (group.pendingMembers || []).length;
    const liveCount = group.connectedCount ?? group.members.length;
    const totalCount = group.memberCount ?? (group.members.length + pendingCount);
    const subtitle = pendingCount
      ? `${liveCount} live · ${pendingCount} pending`
      : `${totalCount} people`;
    button.innerHTML = `<strong>${group.name}</strong><span>${subtitle}</span>`;
    button.addEventListener("click", async () => {
      selectedGroupId = group.id;
      await loadAvailability();
      render();
    });
    groupList.appendChild(button);
  }
}

function renderCalendar(group) {
  if (!group) {
    calendarGrid.className = "calendar-grid empty-state";
    calendarGrid.innerHTML = `<div class="groups-empty">Create a group, then add people by email. Once they connect their own calendar, everyone in the group will appear together here.</div>`;
    return;
  }

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

function liveStatusText() {
  if (freebusySource === "error") {
    return liveMeta?.error?.includes("disabled") ? "Google Calendar API disabled" : "Google fetch error";
  }
  if (freebusySource === "google") {
    const connectedCount = liveMeta?.connectedCount || 0;
    return `${connectedCount} people live · ${googleBusy.length} busy`;
  }
  if (googleConnected) {
    return "Connected";
  }
  return demoBypass ? "Demo sample data" : "Not connected";
}

function render() {
  ensureSelectedGroup();
  const group = activeGroup();
  const viewNames = { day: "Day", week: "Week", month: "Month", year: "Year" };

  if (group) {
    groupName.textContent = group.name;
    groupType.textContent = `${group.type} · ${viewNames[currentView]} planner${currentView === "year" ? ` - ${new Date().getFullYear()}` : currentView === "month" ? ` - ${formatMonthYear(new Date())}` : ` - ${formatRange()}`}`;
  } else {
    groupName.textContent = "Create your first group";
    groupType.textContent = googleConnected ? "Shared backend live" : "Demo mode";
  }

  sourcePill.textContent = liveStatusText();
  sourcePill.classList.toggle("error", freebusySource === "error");
  renderGroups();
  renderViewButtons();
  renderCalendar(group);
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
  if (!googleConnected || !selectedGroupId || usesDemoData()) return;
  refreshTimer = window.setInterval(async () => {
    await refreshAll();
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
    connectionStatus.innerHTML = `<span class="connected">Google Calendar connected${name}.</span>`;
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

async function loadServerGroups() {
  const response = await fetch("/api/groups", { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) {
    groups = [];
    usingServerGroups = true;
    return;
  }

  groups = data.groups || [];
  googleUser = data.user || googleUser;
  usingServerGroups = true;
  ensureSelectedGroup();
}

async function loadAvailability() {
  if (usesDemoData()) {
    googleBusy = [];
    liveMeta = null;
    freebusySource = demoBypass ? "demo" : "none";
    return;
  }

  const group = activeGroup();
  if (!group) {
    googleBusy = [];
    liveMeta = { connectedCount: 0 };
    freebusySource = "none";
    return;
  }

  const range = visibleRange();
  const params = new URLSearchParams({
    timeMin: range.start.toISOString(),
    timeMax: range.end.toISOString()
  });

  const response = await fetch(`/api/groups/${group.id}/freebusy?${params.toString()}`, { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) {
    googleBusy = [];
    liveMeta = { error: data.error || "Could not load group calendars." };
    freebusySource = "error";
    return;
  }

  googleBusy = data.busy || [];
  liveMeta = {
    connectedCount: data.connectedCount || 0,
    members: data.members || [],
    fetchedAt: data.fetchedAt,
    error: data.error || null
  };
  if (data.group) replaceGroup(data.group);
  freebusySource = "google";
}

async function refreshAll() {
  if (googleConnected && !demoBypass) {
    await loadServerGroups();
  }
  await loadAvailability();
  render();
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
    await loadServerGroups();
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
