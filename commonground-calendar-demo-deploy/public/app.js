const dayNames = [
  { key: "sun", short: "SUN", day: 0 },
  { key: "mon", short: "MON", day: 1 },
  { key: "tue", short: "TUE", day: 2 },
  { key: "wed", short: "WED", day: 3 },
  { key: "thu", short: "THU", day: 4 },
  { key: "fri", short: "FRI", day: 5 },
  { key: "sat", short: "SAT", day: 6 }
];

const calendarStartHour = 0;
const calendarEndHour = 24;
const hours = Array.from({ length: calendarEndHour - calendarStartHour }, (_, index) => index + calendarStartHour);
const participantPalette = [
  { value: "#1a73e8", name: "Ocean" },
  { value: "#d93025", name: "Cherry" },
  { value: "#188038", name: "Forest" },
  { value: "#a142f4", name: "Grape" },
  { value: "#f29900", name: "Banana" },
  { value: "#12a4af", name: "Lagoon" },
  { value: "#e8710a", name: "Apricot" },
  { value: "#b80672", name: "Dragonfruit" },
  { value: "#0b8043", name: "Clover" },
  { value: "#1967d2", name: "Sapphire" },
  { value: "#5f6368", name: "Pebble" },
  { value: "#00897b", name: "Teal" }
];

const homePage = document.querySelector("#homePage");
const entryChoicePage = document.querySelector("#entryChoicePage");
const roomPage = document.querySelector("#roomPage");
const homeStatus = document.querySelector("#homeStatus");
const entryChoiceLead = document.querySelector("#entryChoiceLead");
const roomName = document.querySelector("#roomName");
const roomCode = document.querySelector("#roomCode");
const hostPill = document.querySelector("#hostPill");
const roomStatus = document.querySelector("#roomStatus");
const calendarStatus = document.querySelector("#calendarStatus");
const participantStrip = document.querySelector("#participantStrip");
const calendarGrid = document.querySelector("#calendarGrid");
const connectWidgetText = document.querySelector("#connectWidgetText");
const topbarIdentity = document.querySelector("#topbarIdentity");
const viewSwitcher = document.querySelector("#viewSwitcher");
const hostPanel = document.querySelector("#hostPanel");
const hostSettings = document.querySelector("#hostSettings");
const hostPopover = document.querySelector("#hostPopover");
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
const inviteeSummary = document.querySelector("#inviteeSummary");
const responseGroups = document.querySelector("#responseGroups");
const commentList = document.querySelector("#commentList");
const commentForm = document.querySelector("#commentForm");
const commentInput = document.querySelector("#commentInput");
const downloadIcsButton = document.querySelector("#downloadIcsButton");
const proposeTimeButton = document.querySelector("#proposeTimeButton");
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
const inviteePicker = document.querySelector("#inviteePicker");
const saveEventButton = document.querySelector("#saveEventButton");
const cancelEventButton = document.querySelector("#cancelEventButton");
const cancelEventSecondary = document.querySelector("#cancelEventSecondary");
const busyModal = document.querySelector("#busyModal");
const busyForm = document.querySelector("#busyForm");
const busyTitleInput = document.querySelector("#busyTitleInput");
const busyStartInput = document.querySelector("#busyStartInput");
const busyEndInput = document.querySelector("#busyEndInput");
const cancelBusyButton = document.querySelector("#cancelBusyButton");
const cancelBusySecondary = document.querySelector("#cancelBusySecondary");
const proposeModal = document.querySelector("#proposeModal");
const proposeForm = document.querySelector("#proposeForm");
const proposeDateInput = document.querySelector("#proposeDateInput");
const proposeStartInput = document.querySelector("#proposeStartInput");
const proposeEndInput = document.querySelector("#proposeEndInput");
const cancelProposeButton = document.querySelector("#cancelProposeButton");
const cancelProposeSecondary = document.querySelector("#cancelProposeSecondary");
const createRoomForm = document.querySelector("#createRoomForm");
const joinRoomForm = document.querySelector("#joinRoomForm");
const joinRoomCode = document.querySelector("#joinRoomCode");
const choiceConnectButton = document.querySelector("#choiceConnectButton");
const choiceGuestButton = document.querySelector("#choiceGuestButton");
const entryChoiceBackButton = document.querySelector("#entryChoiceBackButton");
const displayNameInput = document.querySelector("#displayNameInput");
const renameRoomInput = document.querySelector("#renameRoomInput");
const deleteRoomButton = document.querySelector("#deleteRoomButton");
const refreshCodeButton = document.querySelector("#refreshCodeButton");
const connectGoogleButton = document.querySelector("#connectGoogleButton");
const settingsReconnectButton = document.querySelector("#settingsReconnectButton");
const refreshButton = document.querySelector("#refreshButton");
const fullscreenButton = document.querySelector("#fullscreenButton");
const settingsButton = document.querySelector("#settingsButton");
const themeToggle = document.querySelector("#themeToggle");
const addEventButton = document.querySelector("#addEventButton");
const copyInviteButton = document.querySelector("#copyInviteButton");
const copyInviteButtonEmpty = document.querySelector("#copyInviteButtonEmpty");
const addManualBusyButton = document.querySelector("#addManualBusyButton");
const emptyRoomState = document.querySelector("#emptyRoomState");
const emptyRoomCode = document.querySelector("#emptyRoomCode");

let appConfig = null;
let sessionInfo = null;
let currentRoom = null;
let currentParticipant = null;
let currentIsHost = false;
let googleBusy = [];
let currentView = localStorage.getItem("cg-view") || "week";
let currentFocusDate = new Date();
let refreshTimer = null;
let selectedEventId = null;
let selectedBusyGroup = null;
let editingEventId = null;
let pendingEventPrefill = null;
let displayNameSaveTimer = null;
let roomNameSaveTimer = null;
let inlineRoomRenameActive = false;
let selectedParticipantIds = new Set();
let pendingEntryRoomCode = null;
let pendingEntryMode = null;
let pendingHostRoomState = null;
const viewShortcutMap = {
  d: "day",
  w: "week",
  m: "month",
  y: "year"
};

function routeRoomCode() {
  const match = window.location.pathname.match(/^\/room\/([^/]+)$/);
  return match ? match[1].toUpperCase() : null;
}

function showHome() {
  homePage.classList.remove("hidden");
  entryChoicePage.classList.add("hidden");
  roomPage.classList.add("hidden");
}

function showEntryChoice() {
  homePage.classList.add("hidden");
  entryChoicePage.classList.remove("hidden");
  roomPage.classList.add("hidden");
}

function showRoom() {
  homePage.classList.add("hidden");
  entryChoicePage.classList.add("hidden");
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
  const weekStart = startOfWeek(currentFocusDate);
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
  return `${String(hour).padStart(2, "0")}:00`;
}

function formatTime(hour) {
  const wholeHour = Math.floor(hour);
  const minutes = Math.round((hour - wholeHour) * 60);
  return `${String(wholeHour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatDateTimeRange(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const sameDay = dateKey(startDate) === dateKey(endDate);
  const dayLabel = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(startDate);
  const startTime = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", hour12: false }).format(startDate);
  const endTime = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", hour12: false }).format(endDate);
  if (sameDay) return `${dayLabel} · ${startTime} - ${endTime}`;
  const endLabel = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(endDate);
  return `${dayLabel} ${startTime} - ${endLabel}`;
}

function visibleRange() {
  const displayDays = currentWeekDays();

  if (currentView === "day") {
    const day = startOfDay(currentFocusDate);
    return { start: day, end: addDays(day, 1) };
  }

  if (currentView === "month") {
    const monthStart = new Date(currentFocusDate.getFullYear(), currentFocusDate.getMonth(), 1);
    const start = startOfWeek(monthStart);
    return { start, end: addDays(start, 42) };
  }

  if (currentView === "year") {
    return {
      start: new Date(currentFocusDate.getFullYear(), 0, 1),
      end: new Date(currentFocusDate.getFullYear() + 1, 0, 1)
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

function connectedParticipants() {
  return (currentRoom?.participants || []).filter((participant) => participant.connected);
}

function visibleParticipantIds() {
  const connectedIds = connectedParticipants().map((participant) => participant.id);
  if (!selectedParticipantIds.size) return new Set(connectedIds);
  const filtered = connectedIds.filter((id) => selectedParticipantIds.has(id));
  return new Set(filtered.length ? filtered : connectedIds);
}

function syncInputValue(input, nextValue) {
  if (!input) return;
  if (document.activeElement === input) return;
  if (input.value !== nextValue) {
    input.value = nextValue;
  }
}

function applyParticipantPatchLocally(participantId, patch) {
  if (!currentRoom?.participants?.length) return;
  const participant = currentRoom.participants.find((entry) => entry.id === participantId);
  if (!participant) return;

  Object.assign(participant, patch);

  if (currentParticipant?.id === participantId) {
    currentParticipant = { ...currentParticipant, ...patch };
    if (patch.displayName) {
      sessionInfo = {
        ...sessionInfo,
        displayName: patch.displayName
      };
    }
  }

  googleBusy = googleBusy.map((block) => (
    block.participantId === participantId
      ? {
          ...block,
          ownerName: patch.displayName || block.ownerName,
          color: patch.color || block.color
        }
      : block
  ));

  if (selectedBusyGroup?.participants?.length) {
    selectedBusyGroup = {
      ...selectedBusyGroup,
      participants: selectedBusyGroup.participants.map((entry) => (
        entry.participantId === participantId
          ? {
              ...entry,
              ownerName: patch.displayName || entry.ownerName,
              color: patch.color || entry.color
            }
          : entry
      ))
    };
  }
}

async function setCurrentView(view) {
  if (!view || currentView === view) return;
  currentView = view;
  localStorage.setItem("cg-view", currentView);
  await loadFreeBusy();
  render();
}

async function goToDay(date) {
  currentFocusDate = startOfDay(date);
  if (currentView !== "day") {
    currentView = "day";
    localStorage.setItem("cg-view", currentView);
  }
  await loadFreeBusy();
  render();
}

function shouldIgnoreViewShortcut(target) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, select, button, [contenteditable='true']"));
}

function updateViewButtons() {
  for (const button of viewSwitcher.querySelectorAll("[data-view]")) {
    button.classList.toggle("active", button.dataset.view === currentView);
  }
}

function roomInviteLink() {
  return `${window.location.origin}/room/${currentRoom?.code || ""}`;
}

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function fullyFreeParticipantsForDate(date, blocksByDate = buildBusyDayBlocks()) {
  const busyParticipants = new Set((blocksByDate.get(dateKey(date)) || []).map((block) => block.participantId));
  const visibleIds = visibleParticipantIds();
  return (currentRoom?.participants || []).filter((participant) => participant.connected && visibleIds.has(participant.id) && !busyParticipants.has(participant.id));
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

function participantColorOption(color) {
  return participantPalette.find((option) => option.value === color) || participantPalette[0];
}

function ownBusyLabel(participant) {
  const titles = [...new Set(
    (participant.items || [])
      .map((item) => String(item.title || "").trim())
      .filter(Boolean)
  )];

  if (!titles.length) return participant.ownerName;
  if (titles.length === 1) return titles[0];
  return `${titles[0]} +${titles.length - 1}`;
}

function formatDateTimeLocalValue(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function wireInlineNameEditor(target, getCurrentName, onSave, triggerEventName = "dblclick") {
  if (!target) return;
  target.addEventListener(triggerEventName, () => {
    const currentName = getCurrentName();
    const targetTag = target.tagName.toLowerCase();
    const targetId = target.id;
    const targetClassName = target.className;
    const input = document.createElement("input");
    input.type = "text";
    input.className = "inline-name-input";
    input.value = currentName;
    target.replaceWith(input);
    input.focus();
    input.select();

    const restore = async (shouldSave) => {
      const nextName = input.value.trim() || currentName;
      const replacement = document.createElement(targetTag);
      replacement.className = targetClassName;
      if (targetId) replacement.id = targetId;
      if (targetTag === "button") replacement.type = "button";
      replacement.textContent = shouldSave ? nextName : currentName;
      input.replaceWith(replacement);
      wireInlineNameEditor(replacement, getCurrentName, onSave, triggerEventName);
      if (shouldSave && nextName !== currentName) {
        await onSave(nextName);
      }
    };

    input.addEventListener("keydown", async (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        await restore(true);
      }
      if (event.key === "Escape") {
        event.preventDefault();
        await restore(false);
      }
    });
    input.addEventListener("blur", async () => {
      await restore(true);
    });
  });
}

function defaultInviteeIds() {
  const visibleIds = visibleParticipantIds();
  return (currentRoom?.participants || [])
    .filter((participant) => participant.connected && participant.id !== currentParticipant?.id && visibleIds.has(participant.id))
    .map((participant) => participant.id);
}

function renderInviteePicker(selectedIds = defaultInviteeIds()) {
  if (!inviteePicker) return;
  const selected = new Set(selectedIds);
  const invitees = (currentRoom?.participants || []).filter((participant) => participant.connected && participant.id !== currentParticipant?.id);
  inviteePicker.innerHTML = `
    <div class="invitee-picker-head">
      <p class="panel-label">Invite people</p>
      <p class="muted">${invitees.length ? "Pick who should get this invite." : "No one else is connected yet."}</p>
    </div>
  `;

  if (!invitees.length) return;

  const options = document.createElement("div");
  options.className = "invitee-options";
  for (const participant of invitees) {
    const label = document.createElement("label");
    label.className = "invitee-option";
    label.style.setProperty("--invitee-color", participant.color);
    label.innerHTML = `
      <input type="checkbox" value="${participant.id}" ${selected.has(participant.id) ? "checked" : ""} />
      <span class="invitee-color-dot"></span>
      <strong>${participant.displayName}</strong>
    `;
    options.appendChild(label);
  }
  inviteePicker.appendChild(options);
}

function renderTopbarIdentity() {
  if (!topbarIdentity || !currentParticipant) return;
  const currentColorOption = participantColorOption(currentParticipant.color);
  topbarIdentity.innerHTML = `
    <button class="identity-name-button" id="topbarIdentityName" type="button">${currentParticipant.displayName}</button>
    <details class="color-picker-menu topbar-identity-menu">
      <summary class="color-picker-trigger topbar-color-trigger" aria-label="Choose your color">
        <span class="current-color-dot" style="--swatch-color: ${currentColorOption.value}"></span>
      </summary>
      <div class="color-option-list">
        ${participantPalette.map((option) => `
          <button class="color-option-button ${option.value === currentParticipant.color ? "is-active" : ""}" type="button" data-topbar-color="${option.value}">
            <span class="current-color-dot" style="--swatch-color: ${option.value}"></span>
            <span>${option.name}</span>
          </button>
        `).join("")}
      </div>
    </details>
  `;

  wireInlineNameEditor(
    topbarIdentity.querySelector("#topbarIdentityName"),
    () => currentParticipant.displayName,
    saveDisplayName,
    "click"
  );

  const colorMenu = topbarIdentity.querySelector(".color-picker-menu");
  for (const button of topbarIdentity.querySelectorAll("[data-topbar-color]")) {
    button.addEventListener("click", async () => {
      await saveParticipantColor(button.dataset.topbarColor);
      if (colorMenu) colorMenu.open = false;
    });
  }
}

function renderParticipants() {
  participantStrip.innerHTML = "";
  const visibleIds = visibleParticipantIds();
  for (const participant of currentRoom?.participants || []) {
    const chip = document.createElement("div");
    chip.className = `participant-chip ${participant.connected ? "" : "faded"} ${visibleIds.has(participant.id) ? "is-selected" : ""}`.trim();
    chip.style.setProperty("--chip-color", participant.color);
    if (participant.connected) {
      chip.tabIndex = 0;
      chip.setAttribute("role", "button");
      const toggleSelection = () => {
        if (selectedParticipantIds.has(participant.id)) {
          selectedParticipantIds.delete(participant.id);
        } else {
          selectedParticipantIds.add(participant.id);
        }
        render();
      };
      chip.addEventListener("click", toggleSelection);
      chip.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleSelection();
        }
      });
    }

    chip.innerHTML = `
      <span class="participant-dot"></span>
      <div class="participant-copy">
        <strong>${participant.displayName}</strong>
        <span>${participantStatusText(participant)}</span>
      </div>
    `;

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
  roomName.contentEditable = "false";
  roomCode.textContent = currentRoom?.code || "------";
  emptyRoomCode.textContent = currentRoom?.code || "------";
  hostPill.classList.toggle("hidden", !currentIsHost);
  syncInputValue(renameRoomInput, currentRoom?.name || "");
  hostPanel.classList.remove("hidden");
  hostSettings.classList.toggle("hidden", !currentIsHost);

  const connectedCount = (currentRoom?.participants || []).filter((participant) => participant.connected).length;
  roomStatus.textContent = `${currentRoom?.participants?.length || 0} people · ${connectedCount} connected`;

  const onlyOneParticipant = (currentRoom?.participants?.length || 0) <= 1;
  emptyRoomState.classList.toggle("hidden", !onlyOneParticipant);

  if (currentParticipantNeedsReconnect()) {
    connectGoogleButton.textContent = "Reconnect calendar";
    settingsReconnectButton.classList.remove("hidden");
    connectWidgetText.textContent = "Your calendar needs reconnecting so CommonGround can keep your live availability and Google name in sync.";
  } else if (currentParticipantConnected()) {
    connectGoogleButton.textContent = "Reconnect calendar";
    settingsReconnectButton.classList.remove("hidden");
    connectWidgetText.textContent = "Your Google Calendar is connected. CommonGround is pulling your live availability and using your Google profile as the default identity.";
  } else {
    connectGoogleButton.textContent = "Connect calendar";
    settingsReconnectButton.classList.add("hidden");
    connectWidgetText.textContent = "Connect your Google Calendar to pull your real busy times automatically and fill in your name from Google.";
  }

  renderTopbarIdentity();
}

function refreshStatusLine() {
  const connectedCount = (currentRoom?.participants || []).filter((participant) => participant.connected).length;
  const lastRefreshed = currentRoom ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date()) : "";
  calendarStatus.textContent = currentRoom
    ? `${connectedCount} connected · refreshed ${lastRefreshed}`
    : "Loading room…";
}

function buildSelfEditPanel() {
  if (!currentParticipant) return null;
  const currentColorOption = participantColorOption(currentParticipant.color);
  const wrap = document.createElement("section");
  wrap.className = "self-edit-panel";
  wrap.innerHTML = `
    <div class="self-edit-head">
      <div>
        <p class="panel-label">Your calendar identity</p>
        <p class="muted">Double-click your name to rename it for the room.</p>
      </div>
    </div>
    <div class="identity-editor" id="identityEditor">
      <span class="participant-dot" style="--chip-color: ${currentParticipant.color}"></span>
      <strong class="editable-identity-name" id="editableIdentityName">${currentParticipant.displayName}</strong>
    </div>
    <details class="color-picker-menu">
      <summary class="color-picker-trigger">
        <span class="current-color-dot" style="--swatch-color: ${currentColorOption.value}"></span>
        <span>${currentColorOption.name}</span>
      </summary>
      <div class="color-option-list">
        ${participantPalette.map((option) => `
          <button class="color-option-button ${option.value === currentParticipant.color ? "is-active" : ""}" type="button" data-color="${option.value}">
            <span class="current-color-dot" style="--swatch-color: ${option.value}"></span>
            <span>${option.name}</span>
          </button>
        `).join("")}
      </div>
    </details>
  `;

  wireInlineNameEditor(
    wrap.querySelector("#editableIdentityName"),
    () => currentParticipant.displayName,
    saveDisplayName
  );
  const colorMenu = wrap.querySelector(".color-picker-menu");
  for (const button of wrap.querySelectorAll("[data-color]")) {
    button.addEventListener("click", async () => {
      await saveParticipantColor(button.dataset.color);
      if (colorMenu) colorMenu.open = false;
    });
  }

  return wrap;
}

async function updateAvailabilityItem(itemId, patch) {
  if (!currentRoom) return;
  await fetchJson(`/api/rooms/${currentRoom.code}/availability-items/${encodeURIComponent(itemId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch)
  });
  await refreshRoomData();
}

async function deleteAvailabilityItem(itemId) {
  if (!currentRoom) return;
  await fetchJson(`/api/rooms/${currentRoom.code}/availability-items/${encodeURIComponent(itemId)}`, {
    method: "DELETE"
  });
  await refreshRoomData();
}

async function addManualBusyBlock() {
  if (!currentRoom || !busyModal) return;
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(Math.max(now.getHours() + 1, 8));
  const later = new Date(now);
  later.setHours(now.getHours() + 1);
  busyTitleInput.value = "";
  busyStartInput.value = formatDateTimeLocalValue(now);
  busyEndInput.value = formatDateTimeLocalValue(later);
  busyModal.showModal();
}

function selectedSharedParticipantIds(container) {
  return [...container.querySelectorAll("[data-share-id]:checked")].map((input) => input.value);
}

function participantShareCandidates() {
  return (currentRoom?.participants || []).filter((participant) => participant.id !== currentParticipant?.id);
}

function openBusyDetail(group) {
  detailPanel.classList.remove("hidden");
  selectedBusyGroup = group;
  selectedEventId = null;
  detailEmpty.classList.add("hidden");
  eventDetail.classList.add("hidden");
  busyDetail.classList.remove("hidden");
  detailLabel.textContent = "Busy overlap";
  detailTitle.textContent = `${group.participants.length} busy`;
  busyDetailList.innerHTML = "";

  if (group.participants.some((entry) => entry.participantId === currentParticipant?.id)) {
    const selfEditPanel = buildSelfEditPanel();
    if (selfEditPanel) {
      busyDetailList.appendChild(selfEditPanel);
    }
  }

  for (const entry of group.participants) {
    const section = document.createElement("section");
    section.className = "busy-detail-section";

    const item = document.createElement("div");
    item.className = "busy-detail-item";
    item.style.setProperty("--item-color", entry.color);
    item.innerHTML = `
      <strong>${entry.ownerName}</strong>
      <p>${formatDateTimeRange(entry.start, entry.end)}</p>
    `;
    section.appendChild(item);

    for (const busyItem of (entry.items || []).sort((a, b) => new Date(a.start) - new Date(b.start))) {
      const sub = document.createElement("article");
      sub.className = "busy-subitem";
      const title = busyItem.title || "Busy";
      const location = busyItem.location ? `<span>${busyItem.location}</span>` : "";
      const description = busyItem.description ? `<p>${busyItem.description}</p>` : "";
      sub.innerHTML = `
        <header>
          <strong>${title}</strong>
          <span>${formatDateTimeRange(busyItem.start, busyItem.end)}</span>
        </header>
        ${location}
        ${description}
      `;

      if (busyItem.editable) {
        const actions = document.createElement("div");
        actions.className = "busy-subitem-actions";

        const manageButton = document.createElement("button");
        manageButton.type = "button";
        manageButton.className = "secondary";
        manageButton.textContent = "Manage";
        actions.appendChild(manageButton);

        const managePanel = document.createElement("div");
        managePanel.className = "busy-manage-panel hidden";
        const shareCandidates = participantShareCandidates();
        const currentColor = participantColorOption(entry.color);
        managePanel.innerHTML = `
          <div class="manage-head">
            <div class="identity-editor compact" data-self-identity>
              <span class="participant-dot" style="--chip-color: ${entry.color}"></span>
              <strong class="editable-identity-name" data-manage-name>${entry.ownerName}</strong>
              <span class="color-chip">
                <span class="current-color-dot" style="--swatch-color: ${currentColor.value}"></span>
                <span>${currentColor.name}</span>
              </span>
            </div>
            <p class="muted">Double-click your name to rename it for this room.</p>
          </div>
          <div class="manage-grid">
            <label>
              <span class="panel-label">Title</span>
              <input type="text" data-manage-title value="${busyItem.title || ""}" />
            </label>
            <label>
              <span class="panel-label">Location</span>
              <input type="text" data-manage-location value="${busyItem.location || ""}" />
            </label>
            <label class="manage-span">
              <span class="panel-label">Notes</span>
              <textarea rows="3" data-manage-description>${busyItem.description || ""}</textarea>
            </label>
            <label>
              <span class="panel-label">Starts</span>
              <input type="datetime-local" data-manage-start value="${formatDateTimeLocalValue(busyItem.start)}" />
            </label>
            <label>
              <span class="panel-label">Ends</span>
              <input type="datetime-local" data-manage-end value="${formatDateTimeLocalValue(busyItem.end)}" />
            </label>
          </div>
          <div class="manage-privacy-row">
            <div class="privacy-toggle" data-privacy-toggle>
              <button type="button" class="${busyItem.visibility !== "shared" ? "active" : ""}" data-privacy-option="busy">Private</button>
              <button type="button" class="${busyItem.visibility === "shared" ? "active" : ""}" data-privacy-option="shared">Public</button>
            </div>
            <details class="share-menu">
              <summary>Share with specific people</summary>
              <div class="share-menu-list">
                ${shareCandidates.length ? shareCandidates.map((participant) => `
                  <label class="share-option">
                    <input type="checkbox" data-share-id value="${participant.id}" ${(busyItem.sharedWithParticipantIds || []).includes(participant.id) ? "checked" : ""} />
                    <span class="participant-dot" style="--chip-color: ${participant.color}"></span>
                    <span>${participant.displayName}</span>
                  </label>
                `).join("") : `<p class="muted">No one else is in this room yet.</p>`}
              </div>
            </details>
          </div>
          <div class="busy-subitem-actions">
            <button type="button" class="secondary strong" data-manage-save>Save changes</button>
            <button type="button" class="danger" data-manage-remove>Remove</button>
          </div>
        `;

        manageButton.addEventListener("click", () => {
          managePanel.classList.toggle("hidden");
        });

        wireInlineNameEditor(
          managePanel.querySelector("[data-manage-name]"),
          () => currentParticipant?.displayName || entry.ownerName,
          saveDisplayName
        );

        for (const button of managePanel.querySelectorAll("[data-privacy-option]")) {
          button.addEventListener("click", async () => {
            const nextVisibility = button.dataset.privacyOption;
            if (nextVisibility === busyItem.visibility) return;
            await updateAvailabilityItem(busyItem.sourceId, { visibility: nextVisibility });
          });
        }

        for (const checkbox of managePanel.querySelectorAll("[data-share-id]")) {
          checkbox.addEventListener("change", async () => {
            await updateAvailabilityItem(busyItem.sourceId, {
              sharedWithParticipantIds: selectedSharedParticipantIds(managePanel)
            });
          });
        }

        managePanel.querySelector("[data-manage-save]").addEventListener("click", async () => {
          const startValue = managePanel.querySelector("[data-manage-start]").value;
          const endValue = managePanel.querySelector("[data-manage-end]").value;
          if (!startValue || !endValue) {
            calendarStatus.textContent = "Start and end times are required.";
            return;
          }
          await updateAvailabilityItem(busyItem.sourceId, {
            title: managePanel.querySelector("[data-manage-title]").value,
            location: managePanel.querySelector("[data-manage-location]").value,
            description: managePanel.querySelector("[data-manage-description]").value,
            start: new Date(startValue).toISOString(),
            end: new Date(endValue).toISOString(),
            sharedWithParticipantIds: selectedSharedParticipantIds(managePanel)
          });
        });

        managePanel.querySelector("[data-manage-remove]").addEventListener("click", async () => {
          await deleteAvailabilityItem(busyItem.sourceId);
        });

        sub.appendChild(actions);
        sub.appendChild(managePanel);
      }

      section.appendChild(sub);
    }

    busyDetailList.appendChild(section);
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
  detailPanel.classList.remove("hidden");
  selectedEventId = eventId;
  selectedBusyGroup = null;
  const event = activeEvent();
  if (!event) return;

  detailEmpty.classList.add("hidden");
  busyDetail.classList.add("hidden");
  eventDetail.classList.remove("hidden");
  detailLabel.textContent = "Group event";
  detailTitle.textContent = event.title || "Busy";
  detailTime.textContent = formatDateTimeRange(event.start, event.end);
  detailLocation.textContent = event.location || "Busy hold";
  detailDescription.textContent = event.description || (event.viewerCanSeeDetails ? "No description" : "Event details are only visible to the creator and invitees.");
  responseSummary.textContent = `${event.responseSummary?.yes || 0} yes · ${event.responseSummary?.maybe || 0} maybe · ${event.responseSummary?.no || 0} no`;
  inviteeSummary.textContent = event.invitees?.length ? `Invited: ${event.invitees.map((invitee) => invitee.displayName).join(", ")}` : "No invitees selected.";
  renderResponseGroups(event);
  renderComments(event);
  const currentResponse = event.responses?.[currentParticipant?.id] || "";
  setVoteButtons(currentResponse);

  const canManage = currentIsHost || event.createdByParticipantId === currentParticipant?.id;
  const canRespond = Boolean(event.isInvited || canManage);
  editEventButton.classList.toggle("hidden", !canManage);
  deleteEventButton.classList.toggle("hidden", !canManage);
  proposeTimeButton.classList.toggle("hidden", !event.isInvited);
  for (const button of document.querySelectorAll(".vote-button")) {
    button.disabled = !canRespond;
  }
}

function clearDetailPanel() {
  selectedEventId = null;
  selectedBusyGroup = null;
  detailPanel.classList.add("hidden");
  detailEmpty.classList.remove("hidden");
  eventDetail.classList.add("hidden");
  busyDetail.classList.add("hidden");
  detailLabel.textContent = "Event details";
  detailTitle.textContent = "Select an event";
  inviteeSummary.textContent = "";
  proposeTimeButton.classList.add("hidden");
  for (const button of document.querySelectorAll(".vote-button")) {
    button.disabled = false;
  }
}

function buildBusyDayBlocks() {
  const byDay = new Map();
  const visibleIds = visibleParticipantIds();
  for (const block of googleBusy) {
    if (!visibleIds.has(block.participantId)) continue;
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
          items: (block.items || []).map((item) => ({ ...item })),
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

function mergeParticipantEntries(blocks) {
  const merged = new Map();
  for (const block of blocks) {
    const existing = merged.get(block.participantId);
    if (!existing) {
      merged.set(block.participantId, {
        participantId: block.participantId,
        ownerId: block.ownerId,
        ownerName: block.ownerName,
        color: block.color,
        start: block.start,
        end: block.end,
        items: [...(block.items || [])]
      });
      continue;
    }
    existing.start = existing.start < block.start ? existing.start : block.start;
    existing.end = existing.end > block.end ? existing.end : block.end;
    for (const item of block.items || []) {
      if (!existing.items.some((entry) => entry.sourceId === item.sourceId)) {
        existing.items.push({ ...item });
      }
    }
  }
  return [...merged.values()];
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

    const participants = mergeParticipantEntries(active);
    const key = participantSetKey(participants);
    const previous = segments[segments.length - 1];
    if (previous && previous.key === key && previous.endHour === startHour) {
      previous.endHour = endHour;
      previous.participants = mergeParticipantEntries([...previous.participants, ...participants]);
    } else {
      segments.push({
        id: `${dateKey(date)}-${index}-${key}`,
        key,
        date,
        startHour,
        endHour,
        participants
      });
    }
  }
  return segments;
}

function freeSegmentsForDate(date) {
  const blocks = busySegmentsForDate(date);
  const segments = [];
  let cursor = calendarStartHour;

  for (const block of blocks) {
    if (block.startHour > cursor) {
      segments.push({
        date,
        startHour: cursor,
        endHour: block.startHour
      });
    }
    cursor = Math.max(cursor, block.endHour);
  }

  if (cursor < calendarEndHour) {
    segments.push({
      date,
      startHour: cursor,
      endHour: calendarEndHour
    });
  }

  return segments.filter((segment) => segment.endHour - segment.startHour >= 0.5);
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
    const isCreator = event.createdByParticipantId === currentParticipant?.id;
    const isInvitee = Boolean(event.isInvited);
    const showDetails = Boolean(event.viewerCanSeeDetails);
    items.push({
      id: event.id,
      title: showDetails ? event.title : "Busy",
      startHour,
      endHour,
      summary: `${event.responseSummary?.yes || 0} yes · ${event.responseSummary?.maybe || 0} maybe · ${event.responseSummary?.no || 0} no`,
      isInvitee: isInvitee && !isCreator,
      showDetails
    });
  }
  return items;
}

function createSingleBusyCard(segment, dayIndex) {
  const participant = segment.participants[0];
  const isOwnBlock = participant.participantId === currentParticipant?.id;
  const titleLabel = isOwnBlock ? ownBusyLabel(participant) : participant.ownerName;
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
  const tooltip = `${titleLabel} · ${formatTime(segment.startHour)} - ${formatTime(segment.endHour)}${isOwnBlock ? "" : " busy"}`;
  block.dataset.tooltip = tooltip;
  block.title = tooltip;
  block.innerHTML = isTiny
    ? `<strong>${titleLabel.slice(0, 1)}</strong>`
    : isCompact
      ? `<strong>${titleLabel}</strong>`
      : `<strong>${titleLabel}</strong><span>${formatTime(segment.startHour)} - ${formatTime(segment.endHour)}${isOwnBlock ? "" : " busy"}</span>`;
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
    const isOwnBlock = participant.participantId === currentParticipant?.id;
    const titleLabel = isOwnBlock ? ownBusyLabel(participant) : participant.ownerName;
    const card = document.createElement("div");
    card.className = `busy-stack-card ${index === 0 ? "" : "stacked"}`.trim();
    card.style.setProperty("--event-color", participant.color);
    card.style.setProperty("--stack-index", index);
    card.innerHTML = `<strong>${titleLabel}</strong><span>${formatTime(segment.startHour)} - ${formatTime(segment.endHour)}${isOwnBlock ? "" : " busy"}</span>`;
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
  block.className = `event-card ${isCompact ? "compact" : ""} ${item.isInvitee ? "invitee" : ""}`.trim();
  block.style.setProperty("--day-index", dayIndex);
  block.style.setProperty("--start", item.startHour - calendarStartHour);
  block.style.setProperty("--duration", duration);
  const tooltip = `${item.title} · ${formatTime(item.startHour)} - ${formatTime(item.endHour)} · ${item.summary}`;
  block.dataset.tooltip = tooltip;
  block.title = tooltip;
  block.innerHTML = isCompact
    ? `<strong>${item.showDetails ? item.title : "Busy"}</strong>`
    : `<strong>${item.showDetails ? item.title : "Busy"}</strong><span>${formatTime(item.startHour)} - ${formatTime(item.endHour)} · ${item.summary}</span>`;
  block.addEventListener("click", () => openEventDetail(item.id));
  return block;
}

function createFreeGlowBlock(segment, dayIndex) {
  const block = document.createElement("button");
  block.type = "button";
  block.className = "free-glow-block";
  block.style.setProperty("--day-index", dayIndex);
  block.style.setProperty("--start", segment.startHour - calendarStartHour);
  block.style.setProperty("--duration", segment.endHour - segment.startHour);
  block.dataset.tooltip = `${formatTime(segment.startHour)} - ${formatTime(segment.endHour)} free`;
  block.title = block.dataset.tooltip;
  if (segment.endHour - segment.startHour >= 1) {
    block.innerHTML = `<strong>Free</strong><span>${formatTime(segment.startHour)} - ${formatTime(segment.endHour)}</span>`;
  }
  block.addEventListener("click", () => {
    pendingEventPrefill = {
      date: dateKey(segment.date),
      startTime: formatTime(segment.startHour),
      endTime: formatTime(segment.endHour),
      inviteeParticipantIds: defaultInviteeIds()
    };
    openEventModal("create");
  });
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
    for (const segment of freeSegmentsForDate(day.date)) {
      eventsLayer.appendChild(createFreeGlowBlock(segment, dayIndex));
    }

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
  const monthStart = new Date(currentFocusDate.getFullYear(), currentFocusDate.getMonth(), 1);
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
    const freeParticipants = fullyFreeParticipantsForDate(date, busyByDate);
    const cell = document.createElement("div");
    cell.className = ["month-cell", date.getMonth() !== monthStart.getMonth() ? "muted-month" : "", sameDate(date, today) ? "today" : ""].filter(Boolean).join(" ");
    cell.tabIndex = 0;
    cell.setAttribute("role", "button");
    if (freeParticipants.length) {
      cell.classList.add("has-free-day");
      cell.dataset.tooltip = freeParticipants.map((participant) => participant.displayName).join("\n");
      cell.title = freeParticipants.map((participant) => participant.displayName).join(", ");
    }
    cell.innerHTML = `<strong>${date.getDate()}</strong>`;
    const openDay = async () => {
      await goToDay(date);
    };
    cell.addEventListener("click", openDay);
    cell.addEventListener("keydown", async (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        await openDay();
      }
    });

    const busySegments = data.segments.slice(0, 2);
    for (const segment of busySegments) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "busy-chip";
      chip.style.setProperty("--event-color", segment.participants[0].color);
      chip.textContent = segment.participants.length === 1 ? `${segment.participants[0].ownerName} busy` : `${segment.participants.length} busy`;
      chip.addEventListener("click", (event) => {
        event.stopPropagation();
        openBusyDetail(segment);
      });
      cell.appendChild(chip);
    }

    for (const eventBlock of data.eventBlocks.slice(0, 2)) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "event-chip";
      chip.textContent = eventBlock.title;
      chip.addEventListener("click", (event) => {
        event.stopPropagation();
        openEventDetail(eventBlock.id);
      });
      cell.appendChild(chip);
    }

    calendarGrid.appendChild(cell);
  }
}

function renderYear() {
  calendarGrid.innerHTML = "";
  calendarGrid.className = "calendar-grid year-view";
  const today = new Date();

  for (let month = 0; month < 12; month += 1) {
    const tile = document.createElement("section");
    tile.className = "year-month";
    const title = document.createElement("h3");
    title.textContent = new Intl.DateTimeFormat(undefined, { month: "long" }).format(new Date(currentFocusDate.getFullYear(), month, 1));
    tile.appendChild(title);

    const mini = document.createElement("div");
    mini.className = "mini-month";
    for (const day of dayNames) {
      const label = document.createElement("span");
      label.className = "mini-weekday";
      label.textContent = day.short.slice(0, 1);
      mini.appendChild(label);
    }

    const first = new Date(currentFocusDate.getFullYear(), month, 1);
    const start = startOfWeek(first);
    for (let index = 0; index < 42; index += 1) {
      const date = addDays(start, index);
      const node = document.createElement("span");
      node.className = [
        "mini-day",
        date.getMonth() !== month ? "muted-month" : "",
        sameDate(date, today) ? "today" : ""
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
    renderPlanner([{
      key: dayNames[currentFocusDate.getDay()].key,
      short: dayNames[currentFocusDate.getDay()].short,
      day: currentFocusDate.getDay(),
      date: startOfDay(currentFocusDate)
    }]);
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
  try {
    const data = await fetchJson("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    pendingEntryMode = "host";
    pendingEntryRoomCode = data.room.code;
    pendingHostRoomState = {
      room: data.room,
      participant: data.participant,
      isHost: true
    };
    entryChoiceLead.textContent = `Your room ${data.room.code} is ready. Sync Google Calendar to pull in your live availability and Google name, or host as a guest for now.`;
    showEntryChoice();
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

  pendingEntryRoomCode = code;
  pendingEntryMode = "join";
  pendingHostRoomState = null;
  entryChoiceLead.textContent = `Room ${code} is ready. Sync Google Calendar to pull your live availability, or continue as a guest for now.`;
  showEntryChoice();
}

async function joinRoomAsGuest(code = pendingEntryRoomCode) {
  const roomCode = normalizeRoomCodeInput(code);
  if (!roomCode) return;
  try {
    if (pendingEntryMode === "host" && pendingHostRoomState?.room?.code === roomCode) {
      pushRoomRoute(roomCode);
      currentRoom = pendingHostRoomState.room;
      currentParticipant = pendingHostRoomState.participant;
      currentIsHost = true;
      await loadConfigAndSession();
      googleBusy = [];
      showRoom();
      await loadFreeBusy();
      render();
      startAutoRefresh();
      pendingEntryRoomCode = null;
      pendingEntryMode = null;
      pendingHostRoomState = null;
      return;
    }

    const data = await fetchJson(`/api/rooms/${roomCode}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    pushRoomRoute(roomCode);
    currentRoom = data.room;
    currentParticipant = data.participant;
    currentIsHost = Boolean(data.isHost);
    await loadConfigAndSession();
    googleBusy = [];
    showRoom();
    await loadFreeBusy();
    render();
    startAutoRefresh();
    pendingEntryRoomCode = null;
    pendingEntryMode = null;
    pendingHostRoomState = null;
  } catch (error) {
    showHome();
    setStatus(homeStatus, error.message, "warn");
  }
}

async function saveDisplayName(nextDisplayName = "") {
  if (!currentRoom || !currentParticipant) return;
  const displayName = String(nextDisplayName || displayNameInput?.value || "").trim();
  if (!displayName || displayName === currentParticipant.displayName) return;

  const previousName = currentParticipant.displayName;
  applyParticipantPatchLocally(currentParticipant.id, { displayName });
  render();

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
    applyParticipantPatchLocally(currentParticipant.id, { displayName: previousName });
    render();
    calendarStatus.textContent = error.message;
  }
}

async function saveParticipantColor(color) {
  if (!currentRoom || !currentParticipant) return;
  if (!color || color === currentParticipant.color) return;

  const previousColor = currentParticipant.color;
  applyParticipantPatchLocally(currentParticipant.id, { color });
  render();

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
    applyParticipantPatchLocally(currentParticipant.id, { color: previousColor });
    render();
    calendarStatus.textContent = error.message;
  }
}

async function renameRoom() {
  if (!currentRoom) return;
  const name = renameRoomInput.value.trim();
  await renameRoomByValue(name);
}

async function refreshRoomCode() {
  if (!currentRoom) return;

  try {
    const data = await fetchJson(`/api/rooms/${currentRoom.code}/refresh-code`, {
      method: "POST"
    });
    currentRoom = data.room;
    currentParticipant = data.participant;
    currentIsHost = Boolean(data.isHost);
    pushRoomRoute(currentRoom.code);
    sessionInfo.roomCode = currentRoom.code;
    calendarStatus.textContent = "Room code refreshed.";
    render();
  } catch (error) {
    calendarStatus.textContent = error.message;
  }
}

function scheduleDisplayNameSave() {
  window.clearTimeout(displayNameSaveTimer);
  displayNameSaveTimer = window.setTimeout(() => {
    saveDisplayName();
  }, 280);
}

function scheduleRoomNameSave() {
  window.clearTimeout(roomNameSaveTimer);
  roomNameSaveTimer = window.setTimeout(() => {
    renameRoom();
  }, 280);
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
  eventModalTitle.textContent = mode === "edit" ? "Update proposal" : pendingEventPrefill ? "Book this free slot" : "Create proposal";
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
    renderInviteePicker(event.invitees?.map((invitee) => invitee.participantId) || []);
  } else {
    eventForm.reset();
    if (pendingEventPrefill) {
      eventDateInput.value = pendingEventPrefill.date;
      eventStartInput.value = pendingEventPrefill.startTime;
      eventEndInput.value = pendingEventPrefill.endTime;
      renderInviteePicker(pendingEventPrefill.inviteeParticipantIds || defaultInviteeIds());
    } else {
      const nextHour = new Date();
      nextHour.setMinutes(0, 0, 0);
      nextHour.setHours(Math.max(calendarStartHour + 2, nextHour.getHours() + 1));
      const endHour = new Date(nextHour);
      endHour.setHours(nextHour.getHours() + 2);
      eventDateInput.value = dateKey(nextHour);
      eventStartInput.value = `${String(nextHour.getHours()).padStart(2, "0")}:${String(nextHour.getMinutes()).padStart(2, "0")}`;
      eventEndInput.value = `${String(endHour.getHours()).padStart(2, "0")}:${String(endHour.getMinutes()).padStart(2, "0")}`;
      renderInviteePicker(defaultInviteeIds());
    }
  }

  eventModal.showModal();
  pendingEventPrefill = null;
}

function closeEventModal() {
  eventModal.close();
  editingEventId = null;
  pendingEventPrefill = null;
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
    description: eventDescriptionInput.value.trim(),
    inviteeParticipantIds: [...inviteePicker.querySelectorAll("input:checked")].map((input) => input.value)
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

async function proposeNewTime() {
  const event = activeEvent();
  if (!currentRoom || !selectedEventId || !event || !proposeModal) return;

  const currentStart = new Date(event.start);
  const currentEnd = new Date(event.end);
  proposeDateInput.value = event.date;
  proposeStartInput.value = `${String(currentStart.getHours()).padStart(2, "0")}:${String(currentStart.getMinutes()).padStart(2, "0")}`;
  proposeEndInput.value = `${String(currentEnd.getHours()).padStart(2, "0")}:${String(currentEnd.getMinutes()).padStart(2, "0")}`;
  proposeModal.showModal();
}

function closeBusyModal() {
  busyModal?.close();
}

function closeProposeModal() {
  proposeModal?.close();
}

async function saveBusyBlock(event) {
  event.preventDefault();
  if (!currentRoom) return;

  const start = new Date(busyStartInput.value);
  const end = new Date(busyEndInput.value);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    calendarStatus.textContent = "Pick a valid time range for the busy block.";
    return;
  }

  try {
    await fetchJson(`/api/rooms/${currentRoom.code}/availability-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: busyTitleInput.value.trim() || "Busy",
        start: start.toISOString(),
        end: end.toISOString(),
        visibility: "busy"
      })
    });
    closeBusyModal();
    await refreshRoomData();
  } catch (error) {
    calendarStatus.textContent = error.message;
  }
}

async function saveProposedTime(event) {
  event.preventDefault();
  const eventEntry = activeEvent();
  if (!currentRoom || !selectedEventId || !eventEntry) return;

  const proposedStart = new Date(`${proposeDateInput.value}T${proposeStartInput.value}`);
  const proposedEnd = new Date(`${proposeDateInput.value}T${proposeEndInput.value}`);
  if (Number.isNaN(proposedStart.getTime()) || Number.isNaN(proposedEnd.getTime()) || proposedEnd <= proposedStart) {
    calendarStatus.textContent = "Pick a valid alternative time.";
    return;
  }

  try {
    const data = await fetchJson(`/api/rooms/${currentRoom.code}/events/${selectedEventId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        response: "maybe",
        proposedStart: proposedStart.toISOString(),
        proposedEnd: proposedEnd.toISOString()
      })
    });
    currentRoom.events = currentRoom.events.map((entry) => entry.id === selectedEventId ? data.event : entry);
    closeProposeModal();
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

async function renameRoomByValue(name) {
  if (!currentRoom) return;
  const nextName = String(name || "").trim();
  if (!nextName || nextName === currentRoom.name) return;

  try {
    const data = await fetchJson(`/api/rooms/${currentRoom.code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nextName })
    });
    currentRoom = data.room;
    currentParticipant = data.participant;
    currentIsHost = Boolean(data.isHost);
    render();
  } catch (error) {
    calendarStatus.textContent = error.message;
  }
}

function startInlineRoomRename() {
  if (!currentIsHost || inlineRoomRenameActive) return;
  inlineRoomRenameActive = true;
  roomName.contentEditable = "true";
  roomName.focus();
  document.getSelection()?.selectAllChildren(roomName);
}

async function finishInlineRoomRename(commit = true) {
  if (!inlineRoomRenameActive) return;
  inlineRoomRenameActive = false;
  const nextName = roomName.textContent.trim();
  roomName.contentEditable = "false";
  if (!commit) {
    roomName.textContent = currentRoom?.name || "Room";
    return;
  }
  renameRoomInput.value = nextName;
  await renameRoomByValue(nextName);
}

async function bootHome() {
  showHome();
  await loadConfigAndSession();
  if (sessionInfo?.connected) {
    setStatus(homeStatus, `Google Calendar connected as ${sessionInfo.user?.name || "you"}. Join a room code or host a new room.`, "connected");
  } else if (appConfig?.googleReady) {
    homeStatus.textContent = "Enter a room code to jump in, or host a new room.";
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
choiceConnectButton.addEventListener("click", () => {
  if (!pendingEntryRoomCode) return;
  window.location.href = `/auth/google?room=${pendingEntryRoomCode}`;
});
choiceGuestButton.addEventListener("click", async () => {
  await joinRoomAsGuest();
});
entryChoiceBackButton.addEventListener("click", () => {
  pendingEntryRoomCode = null;
  pendingEntryMode = null;
  pendingHostRoomState = null;
  showHome();
});
deleteRoomButton.addEventListener("click", deleteRoom);
refreshCodeButton.addEventListener("click", refreshRoomCode);
connectGoogleButton.addEventListener("click", () => {
  if (!currentRoom?.code) return;
  window.location.href = `/auth/google?room=${currentRoom.code}`;
});
settingsReconnectButton.addEventListener("click", () => {
  if (!currentRoom?.code) return;
  window.location.href = `/auth/google?room=${currentRoom.code}`;
});
addManualBusyButton.addEventListener("click", addManualBusyBlock);
refreshButton.addEventListener("click", refreshRoomData);
addEventButton.addEventListener("click", () => openEventModal("create"));
copyInviteButton.addEventListener("click", copyInviteLink);
copyInviteButtonEmpty.addEventListener("click", copyInviteLink);
displayNameInput?.addEventListener("input", scheduleDisplayNameSave);
renameRoomInput?.addEventListener("input", scheduleRoomNameSave);
themeToggle.addEventListener("change", () => {
  const theme = themeToggle.checked ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("cg-theme", theme);
});
settingsButton.addEventListener("click", () => {
  hostPopover.classList.toggle("hidden");
});
fullscreenButton.addEventListener("click", async () => {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen?.();
    fullscreenButton.classList.add("is-active");
    return;
  }
  await document.exitFullscreen?.();
  fullscreenButton.classList.remove("is-active");
});
viewSwitcher.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-view]");
  if (!button) return;
  await setCurrentView(button.dataset.view);
});
window.addEventListener("keydown", async (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (shouldIgnoreViewShortcut(event.target)) return;
  if (event.key.toLowerCase() === "f") {
    event.preventDefault();
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
    }
    return;
  }
  const nextView = viewShortcutMap[event.key.toLowerCase()];
  if (!nextView) return;
  event.preventDefault();
  await setCurrentView(nextView);
});
roomName.addEventListener("dblclick", () => {
  startInlineRoomRename();
});
roomName.addEventListener("keydown", async (event) => {
  if (!inlineRoomRenameActive) return;
  if (event.key === "Enter") {
    event.preventDefault();
    await finishInlineRoomRename(true);
  } else if (event.key === "Escape") {
    event.preventDefault();
    await finishInlineRoomRename(false);
  }
});
roomName.addEventListener("blur", async () => {
  await finishInlineRoomRename(true);
});
closeDetailButton.addEventListener("click", clearDetailPanel);
eventForm.addEventListener("submit", saveEvent);
cancelEventButton.addEventListener("click", closeEventModal);
cancelEventSecondary.addEventListener("click", closeEventModal);
busyForm?.addEventListener("submit", saveBusyBlock);
cancelBusyButton?.addEventListener("click", closeBusyModal);
cancelBusySecondary?.addEventListener("click", closeBusyModal);
proposeForm?.addEventListener("submit", saveProposedTime);
cancelProposeButton?.addEventListener("click", closeProposeModal);
cancelProposeSecondary?.addEventListener("click", closeProposeModal);
editEventButton.addEventListener("click", () => openEventModal("edit"));
deleteEventButton.addEventListener("click", deleteEvent);
downloadIcsButton.addEventListener("click", downloadIcs);
proposeTimeButton.addEventListener("click", proposeNewTime);
commentForm.addEventListener("submit", addComment);
for (const button of document.querySelectorAll(".vote-button")) {
  button.addEventListener("click", () => respondToEvent(button.dataset.response));
}

window.addEventListener("popstate", async () => {
  window.clearInterval(refreshTimer);
  await boot();
});

document.addEventListener("click", (event) => {
  if (!hostPopover || hostPopover.classList.contains("hidden")) return;
  if (hostPopover.contains(event.target) || settingsButton.contains(event.target)) return;
  hostPopover.classList.add("hidden");
});

document.addEventListener("fullscreenchange", () => {
  document.documentElement.classList.toggle("fullscreen-mode", Boolean(document.fullscreenElement));
  fullscreenButton.classList.toggle("is-active", Boolean(document.fullscreenElement));
});

boot();
