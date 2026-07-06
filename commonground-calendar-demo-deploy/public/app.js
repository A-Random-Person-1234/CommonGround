const dayNames = [
  { key: "sun", short: "SUN", day: 0 },
  { key: "mon", short: "MON", day: 1 },
  { key: "tue", short: "TUE", day: 2 },
  { key: "wed", short: "WED", day: 3 },
  { key: "thu", short: "THU", day: 4 },
  { key: "fri", short: "FRI", day: 5 },
  { key: "sat", short: "SAT", day: 6 }
];

const calendarStartHour = 6;
const calendarEndHour = 23;
const hours = Array.from({ length: calendarEndHour - calendarStartHour }, (_, index) => index + calendarStartHour);
const participantPalette = [
  "#1a73e8",
  "#d93025",
  "#188038",
  "#a142f4",
  "#f29900",
  "#12a4af",
  "#e8710a",
  "#b80672",
  "#0b8043",
  "#1967d2",
  "#5f6368",
  "#00897b"
];

const homePage = document.querySelector("#homePage");
const roomPage = document.querySelector("#roomPage");
const homeStatus = document.querySelector("#homeStatus");
const roomName = document.querySelector("#roomName");
const roomCode = document.querySelector("#roomCode");
const roomStatus = document.querySelector("#roomStatus");
const calendarStatus = document.querySelector("#calendarStatus");
const participantStrip = document.querySelector("#participantStrip");
const calendarGrid = document.querySelector("#calendarGrid");
const themeToggle = document.querySelector("#themeToggle");
const viewSwitcher = document.querySelector("#viewSwitcher");
const hostPanel = document.querySelector("#hostPanel");
const detailPanel = document.querySelector("#detailPanel");
const detailEmpty = document.querySelector("#detailEmpty");
const eventDetail = document.querySelector("#eventDetail");
const busyDetail = document.querySelector("#busyDetail");
const detailLabel = document.querySelector("#detailLabel");
const detailTitle = document.querySelector("#detailTitle");
const detailTime = document.querySelector("#detailTime");
const detailLocation = document.querySelector("#detailLocation");
const detailDescription = document.querySelector("#detailDescription");
const responseSummary = document.querySelector("#responseSummary");
const responseGroups = document.querySelector("#responseGroups");
const commentList = document.querySelector("#commentList");
const commentForm = document.querySelector("#commentForm");
const commentInput = document.querySelector("#commentInput");
const downloadIcsButton = document.querySelector("#downloadIcsButton");
const deleteEventButton = document.querySelector("#deleteEventButton");
const editEventButton = document.querySelector("#editEventButton");
const closeDetailButton = document.querySelector("#closeDetailButton");
const busyDetailList = document.querySelector("#busyDetailList");
const eventModal = document.querySelector("#eventModal");
const eventForm = document.querySelector("#eventForm");
const eventModalLabel = document.querySelector("#eventModalLabel");
const eventModalTitle = document.querySelector("#eventModalTitle");
const eventTitleInput = document.querySelector("#eventTitleInput");
const eventDateInput = document.querySelector("#eventDateInput");
const eventStartInput = document.querySelector("#eventStartInput");
const eventEndInput = document.querySelector("#eventEndInput");
const eventLocationInput = document.querySelector("#eventLocationInput");
const eventDescriptionInput = document.querySelector("#eventDescriptionInput");
const saveEventButton = document.querySelector("#saveEventButton");
const cancelEventButton = document.querySelector("#cancelEventButton");
const cancelEventSecondary = document.querySelector("#cancelEventSecondary");
const createRoomForm = document.querySelector("#createRoomForm");
const createRoomName = document.querySelector("#createRoomName");
const createDisplayName = document.querySelector("#createDisplayName");
const joinRoomForm = document.querySelector("#joinRoomForm");
const joinRoomCode = document.querySelector("#joinRoomCode");
const joinDisplayName = document.querySelector("#joinDisplayName");
const displayNameForm = document.querySelector("#displayNameForm");
const displayNameInput = document.querySelector("#displayNameInput");
const renameRoomForm = document.querySelector("#renameRoomForm");
const renameRoomInput = document.querySelector("#renameRoomInput");
const deleteRoomButton = document.querySelector("#deleteRoomButton");
const connectGoogleButton = document.querySelector("#connectGoogleButton");
const refreshButton = document.querySelector("#refreshButton");
const addEventButton = document.querySelector("#addEventButton");
const copyInviteButton = document.querySelector("#copyInviteButton");
const copyInviteButtonEmpty = document.querySelector("#copyInviteButtonEmpty");
const emptyRoomState = document.querySelector("#emptyRoomState");
const emptyRoomCode = document.querySelector("#emptyRoomCode");

let appConfig = null;
let sessionInfo = null;
let currentRoom = null;
let currentParticipant = null;
let currentIsHost = false;
let googleBusy = [];
let currentView = localStorage.getItem("cg-view") || "week";
let refreshTimer = null;
let selectedEventId = null;
let selectedBusyGroup = null;
let editingEventId = null;

function routeRoomCode() {
  const match = window.location.pathname.match(/^\/room\/([^/]+)$/);
  return match ? match[1].toUpperCase() : null;
}

function showHome() {
  homePage.classList.remove("hidden");
  roomPage.classList.add("hidden");
}

function showRoom() {
  homePage.classList.add("hidden");
  roomPage.classList.remove("hidden");
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

function currentWeekDays() {
  const weekStart = startOfWeek(new Date());
  return dayNames.map((day, index) => ({
    ...day,
    date: addDays(weekStart, index)
  }));
}

function formatRange() {
  const displayDays = currentWeekDays();
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

function formatDateTimeRange(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const sameDay = dateKey(startDate) === dateKey(endDate);
  const dayLabel = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(startDate);
  const startTime = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(startDate);
  const endTime = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(endDate);
  if (sameDay) return `${dayLabel} · ${startTime} - ${endTime}`;
  const endLabel = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(endDate);
  return `${dayLabel} ${startTime} - ${endLabel}`;
}

function visibleRange() {
  const today = new Date();
  const displayDays = currentWeekDays();

  if (currentView === "day") {
    const day = displayDays[today.getDay()].date;
    return { start: day, end: addDays(day, 1) };
  }

  if (currentView === "month") {
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const start = startOfWeek(monthStart);
    return { start, end: addDays(start, 42) };
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

function setStatus(target, text, kind = "") {
  target.innerHTML = kind ? `<span class="${kind}">${text}</span>` : text;
}

function normalizeRoomCodeInput(value) {
  return String(value || "").trim().toUpperCase();
}

function currentUserConnected() {
  return Boolean(sessionInfo?.connected);
}

function currentParticipantConnected() {
  return Boolean(currentParticipant?.connected);
}

function currentParticipantNeedsReconnect() {
  return Boolean(currentParticipant?.needsReconnect);
}

function activeEvent() {
  return currentRoom?.events?.find((event) => event.id === selectedEventId) || null;
}

function participantById(participantId) {
  return currentRoom?.participants?.find((participant) => participant.id === participantId) || null;
}

function updateViewButtons() {
  for (const button of viewSwitcher.querySelectorAll("[data-view]")) {
    button.classList.toggle("active", button.dataset.view === currentView);
  }
}

function roomInviteLink() {
  return `${window.location.origin}/room/${currentRoom?.code || ""}`;
}

async function copyInviteLink() {
  if (!currentRoom?.code) return;
  try {
    await navigator.clipboard.writeText(roomInviteLink());
    calendarStatus.textContent = "Invite link copied.";
  } catch {
    calendarStatus.textContent = roomInviteLink();
  }
}

function participantStatusText(participant) {
  if (participant.needsReconnect) return "reconnect needed";
  return participant.connected ? "connected" : "not connected yet";
}

function renderParticipants() {
  participantStrip.innerHTML = "";
  for (const participant of currentRoom?.participants || []) {
    const chip = document.createElement("div");
    chip.className = `participant-chip ${participant.connected ? "" : "faded"}`.trim();
    chip.style.setProperty("--chip-color", participant.color);
    if (participant.id === currentParticipant?.id) {
      chip.classList.add("is-self");
    }

    chip.innerHTML = `
      <span class="participant-dot"></span>
      <div class="participant-copy">
        <strong>${participant.displayName}</strong>
        <span>${participantStatusText(participant)}</span>
      </div>
    `;

    if (participant.id === currentParticipant?.id) {
      const palette = document.createElement("div");
      palette.className = "color-palette";
      for (const color of participantPalette) {
        const swatch = document.createElement("button");
        swatch.type = "button";
        swatch.className = `color-swatch ${participant.color === color ? "active" : ""}`.trim();
        swatch.style.setProperty("--swatch-color", color);
        swatch.ariaLabel = `Choose ${color}`;
        swatch.addEventListener("click", async () => {
          await saveParticipantColor(color);
        });
        palette.appendChild(swatch);
      }
      chip.appendChild(palette);
    }

    if (currentIsHost && !participant.isCurrent) {
      const removeButton = document.createElement("button");
      removeButton.className = "chip-action";
      removeButton.type = "button";
      removeButton.textContent = "x";
      removeButton.addEventListener("click", async () => {
        await removeParticipant(participant.id);
      });
      chip.appendChild(removeButton);
    }

    participantStrip.appendChild(chip);
  }
}

function renderRoomMeta() {
  roomName.textContent = currentRoom?.name || "Room";
  roomCode.textContent = currentRoom?.code || "------";
  emptyRoomCode.textContent = currentRoom?.code || "------";
  renameRoomInput.value = currentRoom?.name || "";
  displayNameInput.value = currentParticipant?.displayName || sessionInfo?.displayName || "";
  hostPanel.classList.toggle("hidden", !currentIsHost);

  const connectedCount = (currentRoom?.participants || []).filter((participant) => participant.connected).length;
  roomStatus.textContent = `${currentRoom?.participants?.length || 0} people · ${connectedCount} connected`;

  const onlyOneParticipant = (currentRoom?.participants?.length || 0) <= 1;
  emptyRoomState.classList.toggle("hidden", !onlyOneParticipant);

  if (currentParticipantNeedsReconnect()) {
    connectGoogleButton.textContent = "Reconnect Google Calendar";
  } else if (currentParticipantConnected()) {
    connectGoogleButton.textContent = "Reconnect Google Calendar";
  } else {
    connectGoogleButton.textContent = "Connect Google Calendar";
  }
}

function refreshStatusLine() {
  const connectedCount = (currentRoom?.participants || []).filter((participant) => participant.connected).length;
  const lastRefreshed = currentRoom ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date()) : "";
  calendarStatus.textContent = currentRoom
    ? `${connectedCount} connected · refreshed ${lastRefreshed}`
    : "Loading room…";
}

function openBusyDetail(group) {
  selectedBusyGroup = group;
  selectedEventId = null;
  detailEmpty.classList.add("hidden");
  eventDetail.classList.add("hidden");
  busyDetail.classList.remove("hidden");
  detailLabel.textContent = "Busy overlap";
  detailTitle.textContent = `${group.participants.length} busy`;
  busyDetailList.innerHTML = "";

  for (const entry of group.participants) {
    const item = document.createElement("div");
    item.className = "busy-detail-item";
    item.style.setProperty("--item-color", entry.color);
    item.innerHTML = `
      <strong>${entry.ownerName}</strong>
      <p>${formatDateTimeRange(entry.start, entry.end)}</p>
    `;
    busyDetailList.appendChild(item);
  }
}

function renderResponseGroups(event) {
  responseGroups.innerHTML = "";
  const labels = [
    ["yes", "Yes"],
    ["maybe", "Maybe"],
    ["no", "No"]
  ];

  for (const [key, label] of labels) {
    const wrap = document.createElement("div");
    wrap.className = "response-group";
    const voters = event.voters?.[key] || [];
    wrap.innerHTML = `<h4>${label}</h4>`;
    if (!voters.length) {
      const text = document.createElement("p");
      text.className = "muted";
      text.textContent = "No responses yet.";
      wrap.appendChild(text);
    } else {
      const list = document.createElement("ul");
      for (const voter of voters) {
        const item = document.createElement("li");
        item.textContent = voter.displayName;
        list.appendChild(item);
      }
      wrap.appendChild(list);
    }
    responseGroups.appendChild(wrap);
  }
}

function renderComments(event) {
  commentList.innerHTML = "";
  if (!event.comments?.length) {
    commentList.innerHTML = `<p class="muted">No comments yet.</p>`;
    return;
  }

  for (const comment of event.comments) {
    const node = document.createElement("article");
    node.className = "comment";
    const stamp = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(comment.createdAt));
    node.innerHTML = `
      <header><strong>${comment.displayName}</strong><span>${stamp}</span></header>
      <p>${comment.text}</p>
    `;
    commentList.appendChild(node);
  }
}

function setVoteButtons(responseValue) {
  for (const button of document.querySelectorAll(".vote-button")) {
    button.classList.toggle("active", button.dataset.response === responseValue);
  }
}

function openEventDetail(eventId) {
  selectedEventId = eventId;
  selectedBusyGroup = null;
  const event = activeEvent();
  if (!event) return;

  detailEmpty.classList.add("hidden");
  busyDetail.classList.add("hidden");
  eventDetail.classList.remove("hidden");
  detailLabel.textContent = "Group event";
  detailTitle.textContent = event.title;
  detailTime.textContent = formatDateTimeRange(event.start, event.end);
  detailLocation.textContent = event.location || "No location";
  detailDescription.textContent = event.description || "No description";
  responseSummary.textContent = `${event.responseSummary?.yes || 0} yes · ${event.responseSummary?.maybe || 0} maybe · ${event.responseSummary?.no || 0} no`;
  renderResponseGroups(event);
  renderComments(event);
  const currentResponse = event.responses?.[currentParticipant?.id] || "";
  setVoteButtons(currentResponse);

  const canManage = currentIsHost || event.createdByParticipantId === currentParticipant?.id;
  editEventButton.classList.toggle("hidden", !canManage);
  deleteEventButton.classList.toggle("hidden", !canManage);
}

function clearDetailPanel() {
  selectedEventId = null;
  selectedBusyGroup = null;
  detailEmpty.classList.remove("hidden");
  eventDetail.classList.add("hidden");
  busyDetail.classList.add("hidden");
  detailLabel.textContent = "Event details";
  detailTitle.textContent = "Select an event";
}

function buildBusyDayBlocks() {
  const byDay = new Map();
  for (const block of googleBusy) {
    const start = new Date(block.start);
    const end = new Date(block.end);
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);

    while (cursor < end) {
      const dayStart = new Date(cursor);
      const dayEnd = addDays(dayStart, 1);
      const segmentStart = start > dayStart ? start : dayStart;
      const segmentEnd = end < dayEnd ? end : dayEnd;
      const rawStartHour = sameDate(segmentStart, dayStart) ? segmentStart.getHours() + segmentStart.getMinutes() / 60 : 0;
      const rawEndHour = sameDate(segmentEnd, dayStart) ? segmentEnd.getHours() + segmentEnd.getMinutes() / 60 : 24;
      const clampedStart = Math.max(calendarStartHour, rawStartHour);
      const clampedEnd = Math.min(calendarEndHour, rawEndHour);

      if (clampedEnd > clampedStart) {
        const key = dateKey(dayStart);
        const entry = {
          participantId: block.participantId,
          ownerId: block.ownerId,
          ownerName: block.ownerName,
          color: block.color,
          startHour: clampedStart,
          endHour: clampedEnd,
          start: new Date(segmentStart).toISOString(),
          end: new Date(segmentEnd).toISOString()
        };
        byDay.set(key, [...(byDay.get(key) || []), entry]);
      }

      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return byDay;
}

function participantSetKey(items) {
  return items.map((item) => item.participantId).sort().join("|");
}

function busySegmentsForDate(date) {
  const blocks = buildBusyDayBlocks().get(dateKey(date)) || [];
  if (!blocks.length) return [];

  const boundaries = new Set();
  for (const block of blocks) {
    boundaries.add(block.startHour);
    boundaries.add(block.endHour);
  }

  const sorted = [...boundaries].sort((a, b) => a - b);
  const segments = [];
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const startHour = sorted[index];
    const endHour = sorted[index + 1];
    const active = blocks.filter((block) => block.startHour < endHour && block.endHour > startHour);
    if (!active.length) continue;

    const key = participantSetKey(active);
    const previous = segments[segments.length - 1];
    if (previous && previous.key === key && previous.endHour === startHour) {
      previous.endHour = endHour;
      previous.participants = active;
    } else {
      segments.push({
        id: `${dateKey(date)}-${index}-${key}`,
        key,
        date,
        startHour,
        endHour,
        participants: active
      });
    }
  }
  return segments;
}

function eventBlocksForDate(date) {
  const items = [];
  for (const event of currentRoom?.events || []) {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const sameDay = dateKey(start) === dateKey(date);
    if (!sameDay) continue;

    const startHour = Math.max(calendarStartHour, start.getHours() + start.getMinutes() / 60);
    const endHour = Math.min(calendarEndHour, end.getHours() + end.getMinutes() / 60);
    if (endHour <= startHour) continue;
    items.push({
      id: event.id,
      title: event.title,
      startHour,
      endHour,
      summary: `${event.responseSummary?.yes || 0} yes · ${event.responseSummary?.maybe || 0} maybe · ${event.responseSummary?.no || 0} no`
    });
  }
  return items;
}

function createSingleBusyCard(segment, dayIndex) {
  const participant = segment.participants[0];
  const block = document.createElement("button");
  block.type = "button";
  const duration = segment.endHour - segment.startHour;
  const isTiny = duration < 0.75;
  const isCompact = duration < 1;
  block.className = `busy-card ${isCompact ? "compact" : ""} ${isTiny ? "tiny" : ""}`.trim();
  block.style.setProperty("--day-index", dayIndex);
  block.style.setProperty("--start", segment.startHour - calendarStartHour);
  block.style.setProperty("--duration", duration);
  block.style.setProperty("--event-color", participant.color);
  const tooltip = `${participant.ownerName} · ${formatTime(segment.startHour)} - ${formatTime(segment.endHour)} busy`;
  block.dataset.tooltip = tooltip;
  block.title = tooltip;
  block.innerHTML = isTiny
    ? `<strong>${participant.ownerName.slice(0, 1)}</strong>`
    : isCompact
      ? `<strong>${participant.ownerName}</strong>`
      : `<strong>${participant.ownerName}</strong><span>${formatTime(segment.startHour)} - ${formatTime(segment.endHour)} busy</span>`;
  block.addEventListener("click", () => openBusyDetail(segment));
  return block;
}

function createBusyStack(segment, dayIndex) {
  const stack = document.createElement("button");
  stack.type = "button";
  stack.className = "busy-stack";
  stack.style.setProperty("--day-index", dayIndex);
  stack.style.setProperty("--start", segment.startHour - calendarStartHour);
  stack.style.setProperty("--duration", segment.endHour - segment.startHour);
  stack.style.setProperty("--summary-color", segment.participants[0].color);

  const shell = document.createElement("div");
  shell.className = "busy-stack-shell";
  shell.tabIndex = 0;

  const summary = document.createElement("div");
  summary.className = "busy-stack-summary";
  const visibleNames = segment.participants.slice(0, 3).map((participant) => participant.ownerName).join(", ");
  const extra = segment.participants.length > 3 ? ` +${segment.participants.length - 3} more` : "";
  const duration = segment.endHour - segment.startHour;
  const compactSummary = duration < 1;
  const tooltip = `${visibleNames}${extra} · ${formatTime(segment.startHour)} - ${formatTime(segment.endHour)} busy`;
  stack.dataset.tooltip = tooltip;
  stack.title = tooltip;
  stack.classList.toggle("compact", compactSummary);
  summary.innerHTML = `
    <strong>${segment.participants.length} busy</strong>
    <span>${compactSummary ? "" : `${formatTime(segment.startHour)} - ${formatTime(segment.endHour)}`}</span>
    <div class="names">${compactSummary ? visibleNames : `${visibleNames}${extra}`}</div>
    <div class="stack-tabs"></div>
  `;

  const tabWrap = summary.querySelector(".stack-tabs");
  for (const participant of segment.participants.slice(0, 4)) {
    const tab = document.createElement("span");
    tab.style.setProperty("--tab-color", participant.color);
    tabWrap.appendChild(tab);
  }

  shell.appendChild(summary);

  for (const [index, participant] of segment.participants.entries()) {
    const card = document.createElement("div");
    card.className = `busy-stack-card ${index === 0 ? "" : "stacked"}`.trim();
    card.style.setProperty("--event-color", participant.color);
    card.style.setProperty("--stack-index", index);
    card.innerHTML = `<strong>${participant.ownerName}</strong><span>${formatTime(segment.startHour)} - ${formatTime(segment.endHour)} busy</span>`;
    shell.appendChild(card);
  }

  let expanded = false;
  const toggleExpanded = () => {
    expanded = !expanded;
    stack.classList.toggle("expanded", expanded);
  };

  stack.addEventListener("click", () => {
    toggleExpanded();
    openBusyDetail(segment);
  });
  shell.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleExpanded();
      openBusyDetail(segment);
    }
  });

  stack.appendChild(shell);
  return stack;
}

function createEventBlock(item, dayIndex) {
  const block = document.createElement("button");
  block.type = "button";
  const duration = item.endHour - item.startHour;
  const isCompact = duration < 1;
  block.className = `event-card ${isCompact ? "compact" : ""}`.trim();
  block.style.setProperty("--day-index", dayIndex);
  block.style.setProperty("--start", item.startHour - calendarStartHour);
  block.style.setProperty("--duration", duration);
  const tooltip = `${item.title} · ${formatTime(item.startHour)} - ${formatTime(item.endHour)} · ${item.summary}`;
  block.dataset.tooltip = tooltip;
  block.title = tooltip;
  block.innerHTML = isCompact
    ? `<strong>${item.title}</strong>`
    : `<strong>${item.title}</strong><span>${formatTime(item.startHour)} - ${formatTime(item.endHour)} · ${item.summary}</span>`;
  block.addEventListener("click", () => openEventDetail(item.id));
  return block;
}

function renderPlanner(days) {
  calendarGrid.innerHTML = "";
  calendarGrid.className = `calendar-grid ${currentView}-view`;
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
      calendarGrid.appendChild(cell);
    }
  }

  const eventsLayer = document.createElement("div");
  eventsLayer.className = "events-layer";
  calendarGrid.appendChild(eventsLayer);

  days.forEach((day, dayIndex) => {
    for (const segment of busySegmentsForDate(day.date)) {
      const node = segment.participants.length === 1
        ? createSingleBusyCard(segment, dayIndex)
        : createBusyStack(segment, dayIndex);
      eventsLayer.appendChild(node);
    }

    for (const eventBlock of eventBlocksForDate(day.date)) {
      eventsLayer.appendChild(createEventBlock(eventBlock, dayIndex));
    }
  });
}

function renderMonth() {
  calendarGrid.innerHTML = "";
  calendarGrid.className = "calendar-grid month-view";

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const gridStart = startOfWeek(monthStart);
  const busyByDate = new Map();

  for (let offset = 0; offset < 42; offset += 1) {
    const date = addDays(gridStart, offset);
    const segments = busySegmentsForDate(date);
    const eventBlocks = eventBlocksForDate(date);
    busyByDate.set(dateKey(date), { segments, eventBlocks });
  }

  for (const day of dayNames) {
    const header = document.createElement("div");
    header.className = "month-weekday";
    header.textContent = day.short;
    calendarGrid.appendChild(header);
  }

  for (let index = 0; index < 42; index += 1) {
    const date = addDays(gridStart, index);
    const key = dateKey(date);
    const data = busyByDate.get(key);
    const cell = document.createElement("div");
    cell.className = ["month-cell", date.getMonth() !== today.getMonth() ? "muted-month" : "", sameDate(date, today) ? "today" : ""].filter(Boolean).join(" ");
    cell.innerHTML = `<strong>${date.getDate()}</strong>`;

    const busySegments = data.segments.slice(0, 2);
    for (const segment of busySegments) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "busy-chip";
      chip.style.setProperty("--event-color", segment.participants[0].color);
      chip.textContent = segment.participants.length === 1 ? `${segment.participants[0].ownerName} busy` : `${segment.participants.length} busy`;
      chip.addEventListener("click", () => openBusyDetail(segment));
      cell.appendChild(chip);
    }

    for (const eventBlock of data.eventBlocks.slice(0, 2)) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "event-chip";
      chip.textContent = eventBlock.title;
      chip.addEventListener("click", () => openEventDetail(eventBlock.id));
      cell.appendChild(chip);
    }

    calendarGrid.appendChild(cell);
  }
}

function renderYear() {
  calendarGrid.innerHTML = "";
  calendarGrid.className = "calendar-grid year-view";
  const today = new Date();
  const busyDates = new Set();
  const eventDates = new Set();

  for (let month = 0; month < 12; month += 1) {
    for (let day = 1; day <= 31; day += 1) {
      const date = new Date(today.getFullYear(), month, day);
      if (date.getMonth() !== month) break;
      if (busySegmentsForDate(date).length) busyDates.add(dateKey(date));
      if (eventBlocksForDate(date).length) eventDates.add(dateKey(date));
    }
  }

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
      const node = document.createElement("span");
      node.className = [
        "mini-day",
        date.getMonth() !== month ? "muted-month" : "",
        sameDate(date, today) ? "today" : "",
        busyDates.has(key) ? "has-busy" : "",
        eventDates.has(key) ? "has-event" : ""
      ].filter(Boolean).join(" ");
      node.textContent = date.getDate();
      mini.appendChild(node);
    }

    tile.appendChild(mini);
    calendarGrid.appendChild(tile);
  }
}

function renderCalendar() {
  const days = currentWeekDays();
  if (currentView === "month") {
    renderMonth();
    return;
  }
  if (currentView === "year") {
    renderYear();
    return;
  }
  if (currentView === "day") {
    renderPlanner([days[new Date().getDay()]]);
    return;
  }
  renderPlanner(days);
}

function render() {
  updateViewButtons();
  renderRoomMeta();
  renderParticipants();
  refreshStatusLine();
  renderCalendar();
  if (selectedEventId) {
    openEventDetail(selectedEventId);
  } else if (selectedBusyGroup) {
    openBusyDetail(selectedBusyGroup);
  } else {
    clearDetailPanel();
  }
}

function roomRouteFor(code) {
  return `/room/${normalizeRoomCodeInput(code)}`;
}

function pushRoomRoute(code) {
  window.history.pushState({}, "", roomRouteFor(code));
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    cache: "no-store",
    ...options
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed.");
  }
  return data;
}

async function loadConfigAndSession() {
  const [config, me] = await Promise.all([
    fetchJson("/api/config"),
    fetchJson("/api/me")
  ]);
  appConfig = config;
  sessionInfo = me;
}

async function loadRoom(code) {
  const data = await fetchJson(`/api/rooms/${normalizeRoomCodeInput(code)}`);
  currentRoom = data.room;
  currentParticipant = data.participant;
  currentIsHost = Boolean(data.isHost);
  sessionInfo.roomCode = currentRoom.code;
}

async function loadFreeBusy() {
  if (!currentRoom) return;
  const range = visibleRange();
  const params = new URLSearchParams({
    timeMin: range.start.toISOString(),
    timeMax: range.end.toISOString()
  });
  const data = await fetchJson(`/api/rooms/${currentRoom.code}/freebusy?${params.toString()}`);
  googleBusy = data.busy || [];

  for (const incoming of data.participants || []) {
    const participant = participantById(incoming.id);
    if (participant) {
      participant.connected = incoming.connected;
      participant.needsReconnect = incoming.needsReconnect;
    }
  }
  currentParticipant = participantById(currentParticipant?.id) || currentParticipant;
}

async function refreshRoomData() {
  const code = routeRoomCode();
  if (!code) return;
  await loadConfigAndSession();
  await loadRoom(code);
  await loadFreeBusy();
  render();
}

function startAutoRefresh() {
  window.clearInterval(refreshTimer);
  if (!routeRoomCode()) return;
  refreshTimer = window.setInterval(async () => {
    try {
      await refreshRoomData();
    } catch {
      calendarStatus.textContent = "Refresh failed. Try again.";
    }
  }, 25000);
}

async function createRoom(event) {
  event.preventDefault();
  const payload = {
    name: createRoomName.value.trim(),
    displayName: createDisplayName.value.trim()
  };
  try {
    const data = await fetchJson("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    pushRoomRoute(data.room.code);
    currentRoom = data.room;
    currentParticipant = data.participant;
    currentIsHost = true;
    await loadConfigAndSession();
    googleBusy = [];
    showRoom();
    await loadFreeBusy();
    render();
    startAutoRefresh();
  } catch (error) {
    setStatus(homeStatus, error.message, "warn");
  }
}

async function joinRoom(event) {
  event.preventDefault();
  const code = normalizeRoomCodeInput(joinRoomCode.value);
  if (!code) {
    setStatus(homeStatus, "Enter a room code.", "warn");
    return;
  }

  try {
    const data = await fetchJson(`/api/rooms/${code}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: joinDisplayName.value.trim() })
    });
    pushRoomRoute(code);
    currentRoom = data.room;
    currentParticipant = data.participant;
    currentIsHost = Boolean(data.isHost);
    await loadConfigAndSession();
    googleBusy = [];
    showRoom();
    await loadFreeBusy();
    render();
    startAutoRefresh();
  } catch (error) {
    setStatus(homeStatus, error.message, "warn");
  }
}

async function saveDisplayName(event) {
  event.preventDefault();
  if (!currentRoom || !currentParticipant) return;
  const displayName = displayNameInput.value.trim();
  if (!displayName) return;

  try {
    const data = await fetchJson(`/api/rooms/${currentRoom.code}/participants/${currentParticipant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName })
    });
    currentRoom = data.room;
    currentParticipant = data.participant;
    currentIsHost = Boolean(data.isHost);
    render();
  } catch (error) {
    calendarStatus.textContent = error.message;
  }
}

async function saveParticipantColor(color) {
  if (!currentRoom || !currentParticipant) return;

  try {
    const data = await fetchJson(`/api/rooms/${currentRoom.code}/participants/${currentParticipant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color })
    });
    currentRoom = data.room;
    currentParticipant = data.participant;
    currentIsHost = Boolean(data.isHost);
    render();
  } catch (error) {
    calendarStatus.textContent = error.message;
  }
}

async function renameRoom(event) {
  event.preventDefault();
  if (!currentRoom) return;

  try {
    const data = await fetchJson(`/api/rooms/${currentRoom.code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameRoomInput.value.trim() })
    });
    currentRoom = data.room;
    currentParticipant = data.participant;
    currentIsHost = Boolean(data.isHost);
    render();
  } catch (error) {
    calendarStatus.textContent = error.message;
  }
}

async function deleteRoom() {
  if (!currentRoom) return;
  const confirmed = window.confirm(`Delete room ${currentRoom.name}?`);
  if (!confirmed) return;

  try {
    await fetchJson(`/api/rooms/${currentRoom.code}`, { method: "DELETE" });
    currentRoom = null;
    currentParticipant = null;
    currentIsHost = false;
    googleBusy = [];
    window.history.pushState({}, "", "/");
    showHome();
    setStatus(homeStatus, "Room deleted.");
  } catch (error) {
    calendarStatus.textContent = error.message;
  }
}

async function removeParticipant(participantId) {
  if (!currentRoom) return;
  try {
    const data = await fetchJson(`/api/rooms/${currentRoom.code}/participants/${participantId}`, {
      method: "DELETE"
    });
    currentRoom = data.room;
    currentParticipant = data.participant;
    currentIsHost = Boolean(data.isHost);
    render();
  } catch (error) {
    calendarStatus.textContent = error.message;
  }
}

function openEventModal(mode = "create") {
  editingEventId = mode === "edit" ? selectedEventId : null;
  eventModalLabel.textContent = mode === "edit" ? "Edit group event" : "Add group event";
  eventModalTitle.textContent = mode === "edit" ? "Update proposal" : "Create proposal";
  saveEventButton.textContent = mode === "edit" ? "Save changes" : "Save event";

  if (mode === "edit" && activeEvent()) {
    const event = activeEvent();
    const start = new Date(event.start);
    const end = new Date(event.end);
    eventTitleInput.value = event.title;
    eventDateInput.value = event.date;
    eventStartInput.value = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
    eventEndInput.value = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
    eventLocationInput.value = event.location || "";
    eventDescriptionInput.value = event.description || "";
  } else {
    eventForm.reset();
    const nextHour = new Date();
    nextHour.setMinutes(0, 0, 0);
    nextHour.setHours(Math.max(calendarStartHour + 2, nextHour.getHours() + 1));
    const endHour = new Date(nextHour);
    endHour.setHours(nextHour.getHours() + 2);
    eventDateInput.value = dateKey(nextHour);
    eventStartInput.value = `${String(nextHour.getHours()).padStart(2, "0")}:${String(nextHour.getMinutes()).padStart(2, "0")}`;
    eventEndInput.value = `${String(endHour.getHours()).padStart(2, "0")}:${String(endHour.getMinutes()).padStart(2, "0")}`;
  }

  eventModal.showModal();
}

function closeEventModal() {
  eventModal.close();
  editingEventId = null;
}

async function saveEvent(event) {
  event.preventDefault();
  if (!currentRoom) return;

  const date = eventDateInput.value;
  const start = new Date(`${date}T${eventStartInput.value}`);
  const end = new Date(`${date}T${eventEndInput.value}`);
  const payload = {
    title: eventTitleInput.value.trim(),
    start: start.toISOString(),
    end: end.toISOString(),
    location: eventLocationInput.value.trim(),
    description: eventDescriptionInput.value.trim()
  };

  try {
    let data;
    if (editingEventId) {
      data = await fetchJson(`/api/rooms/${currentRoom.code}/events/${editingEventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      currentRoom.events = currentRoom.events.map((item) => item.id === editingEventId ? data.event : item);
      selectedEventId = editingEventId;
    } else {
      data = await fetchJson(`/api/rooms/${currentRoom.code}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      currentRoom.events.push(data.event);
      selectedEventId = data.event.id;
    }

    closeEventModal();
    render();
  } catch (error) {
    calendarStatus.textContent = error.message;
  }
}

async function deleteEvent() {
  if (!currentRoom || !selectedEventId) return;

  try {
    await fetchJson(`/api/rooms/${currentRoom.code}/events/${selectedEventId}`, { method: "DELETE" });
    currentRoom.events = currentRoom.events.filter((event) => event.id !== selectedEventId);
    clearDetailPanel();
    render();
  } catch (error) {
    calendarStatus.textContent = error.message;
  }
}

async function respondToEvent(responseValue) {
  if (!currentRoom || !selectedEventId) return;

  try {
    const data = await fetchJson(`/api/rooms/${currentRoom.code}/events/${selectedEventId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: responseValue })
    });
    currentRoom.events = currentRoom.events.map((event) => event.id === selectedEventId ? data.event : event);
    openEventDetail(selectedEventId);
    renderCalendar();
  } catch (error) {
    calendarStatus.textContent = error.message;
  }
}

async function addComment(event) {
  event.preventDefault();
  if (!currentRoom || !selectedEventId) return;
  const text = commentInput.value.trim();
  if (!text) return;

  try {
    const data = await fetchJson(`/api/rooms/${currentRoom.code}/events/${selectedEventId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    currentRoom.events = currentRoom.events.map((event) => event.id === selectedEventId ? data.event : event);
    commentInput.value = "";
    openEventDetail(selectedEventId);
  } catch (error) {
    calendarStatus.textContent = error.message;
  }
}

function downloadIcs() {
  if (!currentRoom || !selectedEventId) return;
  window.location.href = `/api/rooms/${currentRoom.code}/events/${selectedEventId}/ics`;
}

function maybeRestoreTheme() {
  const storedTheme = localStorage.getItem("cg-theme") || "light";
  document.documentElement.dataset.theme = storedTheme;
  themeToggle.checked = storedTheme === "dark";
}

async function bootHome() {
  showHome();
  await loadConfigAndSession();
  if (sessionInfo?.connected) {
    setStatus(homeStatus, `Google Calendar connected as ${sessionInfo.user?.name || "you"}.`, "connected");
  } else if (appConfig?.googleReady) {
    homeStatus.textContent = "Create a room or join one with a code.";
  } else {
    setStatus(homeStatus, "Google credentials are not configured yet.", "warn");
  }
}

async function bootRoom() {
  showRoom();
  await refreshRoomData();
  startAutoRefresh();
}

async function boot() {
  maybeRestoreTheme();
  const code = routeRoomCode();
  if (code) {
    try {
      await bootRoom();
    } catch (error) {
      window.history.replaceState({}, "", "/");
      showHome();
      setStatus(homeStatus, error.message, "warn");
      await loadConfigAndSession();
    }
    return;
  }

  await bootHome();
}

createRoomForm.addEventListener("submit", createRoom);
joinRoomForm.addEventListener("submit", joinRoom);
displayNameForm.addEventListener("submit", saveDisplayName);
renameRoomForm.addEventListener("submit", renameRoom);
deleteRoomButton.addEventListener("click", deleteRoom);
connectGoogleButton.addEventListener("click", () => {
  if (!currentRoom?.code) return;
  window.location.href = `/auth/google?room=${currentRoom.code}`;
});
refreshButton.addEventListener("click", refreshRoomData);
addEventButton.addEventListener("click", () => openEventModal("create"));
copyInviteButton.addEventListener("click", copyInviteLink);
copyInviteButtonEmpty.addEventListener("click", copyInviteLink);
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
  await loadFreeBusy();
  render();
});
closeDetailButton.addEventListener("click", clearDetailPanel);
eventForm.addEventListener("submit", saveEvent);
cancelEventButton.addEventListener("click", closeEventModal);
cancelEventSecondary.addEventListener("click", closeEventModal);
editEventButton.addEventListener("click", () => openEventModal("edit"));
deleteEventButton.addEventListener("click", deleteEvent);
downloadIcsButton.addEventListener("click", downloadIcs);
commentForm.addEventListener("submit", addComment);
for (const button of document.querySelectorAll(".vote-button")) {
  button.addEventListener("click", () => respondToEvent(button.dataset.response));
}

window.addEventListener("popstate", async () => {
  window.clearInterval(refreshTimer);
  await boot();
});

boot();
