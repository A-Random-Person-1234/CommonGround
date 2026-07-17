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
const defaultRoomEmoji = "📅";
const hours = Array.from({ length: calendarEndHour - calendarStartHour }, (_, index) => index + calendarStartHour);
const participantPalette = [
  { value: "#2F6F9F", name: "Marine" },
  { value: "#9B3F35", name: "Redwood" },
  { value: "#5F7A45", name: "Olive" },
  { value: "#6D4A8E", name: "Aubergine" },
  { value: "#B9822E", name: "Ochre" },
  { value: "#2F7C78", name: "Teal" },
  { value: "#B7653F", name: "Terracotta" },
  { value: "#9A4D63", name: "Rosewood" },
  { value: "#3F6F54", name: "Moss" },
  { value: "#5C6773", name: "Slate" },
  { value: "#76543E", name: "Cocoa" },
  { value: "#465A96", name: "Indigo" }
];

const homePage = document.querySelector("#homePage");
const entryChoicePage = document.querySelector("#entryChoicePage");
const roomPage = document.querySelector("#roomPage");
const notificationStack = document.querySelector("#notificationStack");
const homeStatus = document.querySelector("#homeStatus");
const entryChoiceLead = document.querySelector("#entryChoiceLead");
const roomName = document.querySelector("#roomName");
const roomCode = document.querySelector("#roomCode");
const hostPill = document.querySelector("#hostPill");
const roomStatus = document.querySelector("#roomStatus");
const calendarStatus = document.querySelector("#calendarStatus");
const calendarPeriodLabel = document.querySelector("#calendarPeriodLabel");
const prevPeriodButton = document.querySelector("#prevPeriodButton");
const nextPeriodButton = document.querySelector("#nextPeriodButton");
const roomSwitcher = document.querySelector("#roomSwitcher");
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
const eventPanelForm = document.querySelector("#eventPanelForm");
const detailTitleInput = document.querySelector("#detailTitleInput");
const detailDateInput = document.querySelector("#detailDateInput");
const detailStartInput = document.querySelector("#detailStartInput");
const detailEndInput = document.querySelector("#detailEndInput");
const detailLocationInput = document.querySelector("#detailLocationInput");
const detailDescriptionInput = document.querySelector("#detailDescriptionInput");
const detailInviteeList = document.querySelector("#detailInviteeList");
const detailInviteeFeedback = document.querySelector("#detailInviteeFeedback");
const detailGoogleSyncInput = document.querySelector("#detailGoogleSyncInput");
const detailGoogleSyncStatus = document.querySelector("#detailGoogleSyncStatus");
const saveEventChangesButton = document.querySelector("#saveEventChangesButton");
const responseSummary = document.querySelector("#responseSummary");
const inviteeSummary = document.querySelector("#inviteeSummary");
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
const eventEndDateInput = document.querySelector("#eventEndDateInput");
const eventStartInput = document.querySelector("#eventStartInput");
const eventEndInput = document.querySelector("#eventEndInput");
const eventAllDayInput = document.querySelector("#eventAllDayInput");
const eventLocationInput = document.querySelector("#eventLocationInput");
const eventDescriptionInput = document.querySelector("#eventDescriptionInput");
const eventGoogleSyncInput = document.querySelector("#eventGoogleSyncInput");
const eventGoogleSyncStatus = document.querySelector("#eventGoogleSyncStatus");
const eventFormFeedback = document.querySelector("#eventFormFeedback");
const inviteePicker = document.querySelector("#inviteePicker");
const inviteeCountText = document.querySelector("#inviteeCountText");
const saveEventButton = document.querySelector("#saveEventButton");
const cancelEventButton = document.querySelector("#cancelEventButton");
const cancelEventSecondary = document.querySelector("#cancelEventSecondary");
const createRoomModal = document.querySelector("#createRoomModal");
const createRoomModalForm = document.querySelector("#createRoomModalForm");
const quickRoomNameInput = document.querySelector("#quickRoomNameInput");
const cancelCreateRoomModalButton = document.querySelector("#cancelCreateRoomModalButton");
const cancelCreateRoomModalSecondary = document.querySelector("#cancelCreateRoomModalSecondary");
const createRoomForm = document.querySelector("#createRoomForm");
const createRoomName = document.querySelector("#createRoomName");
const createRoomEmoji = document.querySelector("#createRoomEmoji");
const joinRoomForm = document.querySelector("#joinRoomForm");
const joinRoomCode = document.querySelector("#joinRoomCode");
const choiceConnectButton = document.querySelector("#choiceConnectButton");
const choiceGuestButton = document.querySelector("#choiceGuestButton");
const entryChoiceBackButton = document.querySelector("#entryChoiceBackButton");
const displayNameInput = document.querySelector("#displayNameInput");
const renameRoomInput = document.querySelector("#renameRoomInput");
const renameRoomEmojiInput = document.querySelector("#renameRoomEmojiInput");
const customRoomCodeInput = document.querySelector("#customRoomCodeInput");
const roomLockToggle = document.querySelector("#roomLockToggle");
const joinRequestQueue = document.querySelector("#joinRequestQueue");
const joinRequestList = document.querySelector("#joinRequestList");
const joinRequestCount = document.querySelector("#joinRequestCount");
const deleteRoomButton = document.querySelector("#deleteRoomButton");
const refreshCodeButton = document.querySelector("#refreshCodeButton");
const connectGoogleButton = document.querySelector("#connectGoogleButton");
const settingsReconnectButton = document.querySelector("#settingsReconnectButton");
const googleEventSyncToggle = document.querySelector("#googleEventSyncToggle");
const googleEventSyncStatus = document.querySelector("#googleEventSyncStatus");
const refreshButton = document.querySelector("#refreshButton");
const fullscreenButton = document.querySelector("#fullscreenButton");
const settingsButton = document.querySelector("#settingsButton");
const themeToggle = document.querySelector("#themeToggle");
const addEventButton = document.querySelector("#addEventButton");
const copyInviteButton = document.querySelector("#copyInviteButton");
const copyInviteButtonEmpty = document.querySelector("#copyInviteButtonEmpty");
const dismissInviteButton = document.querySelector("#dismissInviteButton");
const emptyRoomState = document.querySelector("#emptyRoomState");
const emptyRoomCode = document.querySelector("#emptyRoomCode");
const quickRoomEmojiInput = document.querySelector("#quickRoomEmojiInput");
const participantsSidebar = document.querySelector("#participantsSidebar");
const participantsRail = document.querySelector("#participantsRail") || document.querySelector(".participants-rail");

let appConfig = null;
let sessionInfo = null;
let currentRoom = null;
let myRooms = [];
let currentParticipant = null;
let currentIsHost = false;
let googleBusy = [];
let currentView = "week";
let currentFocusDate = new Date();
let refreshTimer = null;
let notificationPollTimer = null;
let selectedEventId = null;
let selectedBusyGroup = null;
let expandedBusyStackId = null;
let undoStack = [];
let editingEventId = null;
let pendingEventPrefill = null;
let eventModalInitialState = "";
let eventPanelInitialState = "";
let eventModalAnchorRect = null;
let dragCreateState = null;
let dragPreviewNode = null;
let dragPreviewFrame = 0;
let suppressCalendarClickUntil = 0;
let displayNameSaveTimer = null;
let roomNameSaveTimer = null;
let inlineRoomRenameActive = false;
let hiddenParticipantIds = new Set();
let pendingEntryRoomCode = null;
let pendingEntryMode = null;
let pendingHostRoomState = null;
let roomCodeCopyTimer = null;
let copiedRoomCodeValue = "";
let roomDataGeneration = 0;
let roomDataController = null;
let freeBusyGeneration = 0;
let freeBusyController = null;
const displayedNotificationIds = new Set();
const notificationDismissTimers = new Map();
const dismissedInviteRoomCodes = new Set();
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

function roomEntryRequested() {
  return new URL(window.location.href).searchParams.has("newRoom");
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

function addMonths(date, amount) {
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(next.getMonth() + amount);
  return next;
}

function addYears(date, amount) {
  const next = new Date(date);
  next.setDate(1);
  next.setMonth(0);
  next.setFullYear(next.getFullYear() + amount);
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
  const normalizedHour = ((hour % 24) + 24) % 24;
  const period = normalizedHour >= 12 ? "PM" : "AM";
  const hour12 = normalizedHour % 12 || 12;
  return `${hour12} ${period}`;
}

function formatTime(hour) {
  const wholeHour = Math.floor(hour);
  const minutes = Math.round((hour - wholeHour) * 60);
  const normalizedHour = ((wholeHour % 24) + 24) % 24;
  const period = normalizedHour >= 12 ? "PM" : "AM";
  const hour12 = normalizedHour % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${period}`;
}

function formatEventClock(hour) {
  const totalMinutes = ((Math.round(hour * 60) % 1440) + 1440) % 1440;
  const wholeHour = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = wholeHour >= 12 ? "pm" : "am";
  const hour12 = wholeHour % 12 || 12;
  return minutes === 0 ? `${hour12}${period}` : `${hour12}:${String(minutes).padStart(2, "0")}${period}`;
}

function formatEventRange(startHour, endHour) {
  const start = formatEventClock(startHour);
  const end = formatEventClock(endHour);
  const startPeriod = start.endsWith("am") ? "am" : "pm";
  const endPeriod = end.endsWith("am") ? "am" : "pm";
  if (startPeriod === endPeriod) {
    return `${start.replace(startPeriod, "")} - ${end}`;
  }
  return `${start} - ${end}`;
}

function formatInputTime(hour) {
  const normalized = ((hour % 24) + 24) % 24;
  const wholeHour = Math.floor(normalized);
  const minutes = Math.round((normalized - wholeHour) * 60);
  return `${String(wholeHour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function snapQuarterHour(hour) {
  return Math.round(hour * 4) / 4;
}

function floorQuarterHour(hour) {
  return Math.floor((hour + 0.0001) * 4) / 4;
}

function ceilQuarterHour(hour) {
  return Math.ceil((hour - 0.0001) * 4) / 4;
}

function clampVisibleHour(hour) {
  return Math.min(calendarEndHour, Math.max(calendarStartHour, hour));
}

function normalizedDragRange(startHour, endHour, fallbackDuration = 0.5) {
  const start = clampVisibleHour(startHour);
  const end = clampVisibleHour(endHour);
  if (Math.abs(end - start) < 0.001) {
    return {
      startHour: start,
      endHour: clampVisibleHour(start + fallbackDuration)
    };
  }

  const lower = Math.min(start, end);
  const upper = Math.max(start, end);
  const duration = Math.max(0.25, upper - lower);
  return {
    startHour: lower,
    endHour: clampVisibleHour(lower + duration)
  };
}

function selectionDurationHours(selection) {
  if (!selection) return 0;
  return Math.max(0, selection.endHour - selection.startHour);
}

function eventFormStateSnapshot() {
  return JSON.stringify({
    title: eventTitleInput.value,
    date: eventDateInput.value,
    endDate: eventEndDateInput?.value,
    start: eventStartInput.value,
    end: eventEndInput.value,
    allDay: Boolean(eventAllDayInput?.checked),
    location: eventLocationInput.value,
    description: eventDescriptionInput.value,
    syncToGoogle: Boolean(eventGoogleSyncInput?.checked),
    invitees: [...inviteePicker.querySelectorAll("input[type='checkbox']")]
      .map((input) => ({
        value: input.value,
        checked: input.checked,
        disabled: input.disabled
      }))
  });
}

function eventFormHasUnsavedChanges() {
  return eventFormStateSnapshot() !== eventModalInitialState;
}

function setEventFormFeedback(message = "", tone = "") {
  if (!eventFormFeedback) return;
  eventFormFeedback.textContent = message;
  eventFormFeedback.classList.toggle("is-error", tone === "error");
}

function setEventFormSaving(saving) {
  const isSaving = Boolean(saving);
  eventForm.dataset.saving = isSaving ? "true" : "false";
  eventForm.toggleAttribute("aria-busy", isSaving);
  saveEventButton.disabled = isSaving;
  cancelEventButton.disabled = isSaving;
  cancelEventSecondary.disabled = isSaving;
  saveEventButton.textContent = isSaving
    ? editingEventId ? "Saving..." : "Creating..."
    : editingEventId ? "Save changes" : "Create event";
}

function updateInviteeCountText() {
  if (!inviteeCountText || !inviteePicker) return;
  const checked = [...inviteePicker.querySelectorAll("input[type='checkbox']:checked")];
  const total = checked.length;
  if (total <= 1) {
    inviteeCountText.textContent = "Only you";
    return;
  }
  inviteeCountText.textContent = `${total} invited`;
}

function eventResponseLabel(event, participantId) {
  if (!event?.invitees?.some((invitee) => invitee.participantId === participantId)) {
    return "Not invited";
  }
  const response = event.responses?.[participantId];
  if (response === "yes") return "Yes";
  if (response === "maybe") return "Maybe";
  if (response === "no") return "No";
  return "No response";
}

function eventPanelSelectedInviteeIds() {
  if (!detailInviteeList) return [];
  return [...detailInviteeList.querySelectorAll("input[type='checkbox']:checked")]
    .map((input) => input.value);
}

function eventPanelStateSnapshot() {
  if (!eventPanelForm) return "";
  return JSON.stringify({
    title: detailTitleInput?.value || "",
    date: detailDateInput?.value || "",
    start: detailStartInput?.value || "",
    end: detailEndInput?.value || "",
    location: detailLocationInput?.value || "",
    description: detailDescriptionInput?.value || "",
    syncToGoogle: Boolean(detailGoogleSyncInput?.checked),
    inviteeParticipantIds: eventPanelSelectedInviteeIds()
  });
}

function eventPanelHasUnsavedChanges() {
  return eventPanelStateSnapshot() !== eventPanelInitialState;
}

function updateEventPanelSaveState() {
  if (!saveEventChangesButton || !eventPanelForm) return;
  const canManage = eventPanelForm.dataset.canManage === "true";
  saveEventChangesButton.classList.toggle("hidden", !canManage);
  saveEventChangesButton.disabled = !canManage || !eventPanelHasUnsavedChanges();
  if (detailInviteeFeedback && !eventPanelHasUnsavedChanges()) {
    detailInviteeFeedback.textContent = detailInviteeFeedback.dataset.persistedMessage || "";
  }
}

function updateDetailGoogleSyncControl(canManage) {
  if (!detailGoogleSyncInput || !detailGoogleSyncStatus) return;
  const connected = currentUserConnected() && currentParticipantConnected();
  const googleWriteReady = calendarWriteReady();
  detailGoogleSyncInput.disabled = !canManage || !connected || !googleWriteReady;

  if (!canManage) {
    detailGoogleSyncStatus.textContent = "Only the creator or host can change sync settings.";
  } else if (!connected) {
    detailGoogleSyncStatus.textContent = "Connect Google Calendar first.";
  } else if (!googleWriteReady) {
    detailGoogleSyncStatus.textContent = "Enable Google event sync in Settings to grant event-only access.";
  } else if (detailGoogleSyncInput.checked) {
    detailGoogleSyncStatus.textContent = "Creates this event on the organiser's Google Calendar and sends attendee invitations.";
  } else {
    detailGoogleSyncStatus.textContent = "Keeps this event in CommonGround only.";
  }
}

function setAllDayMode(enabled) {
  if (!eventAllDayInput) return;
  eventAllDayInput.checked = Boolean(enabled);
  eventStartInput.closest(".composer-time-grid")?.classList.toggle("is-all-day", Boolean(enabled));
  eventStartInput.disabled = Boolean(enabled);
  eventEndInput.disabled = Boolean(enabled);
  if (eventEndDateInput) eventEndDateInput.disabled = !enabled;
  if (enabled && eventEndDateInput && !eventEndDateInput.value) {
    eventEndDateInput.value = eventDateInput.value;
  }
  eventStartInput.closest("label")?.classList.toggle("is-disabled", Boolean(enabled));
  eventEndInput.closest("label")?.classList.toggle("is-disabled", Boolean(enabled));
}

function isWholeDayRange(start, end) {
  return start.getHours() === 0 &&
    start.getMinutes() === 0 &&
    end.getHours() === 0 &&
    end.getMinutes() === 0 &&
    end > start;
}

function formatDateTimeRange(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const sameDay = dateKey(startDate) === dateKey(endDate);
  const dayLabel = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(startDate);
  const startTime = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", hour12: true }).format(startDate);
  const endTime = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", hour12: true }).format(endDate);
  if (sameDay) return `${dayLabel} · ${startTime} - ${endTime}`;
  const endLabel = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true }).format(endDate);
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
  if (!target) return;
  target.replaceChildren();
  if (!kind) {
    target.textContent = String(text || "");
    return;
  }
  const message = document.createElement("span");
  message.className = kind;
  message.textContent = String(text || "");
  target.appendChild(message);
}

function normalizeRoomCodeInput(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

function normalizeCustomRoomCodeInput(value) {
  return normalizeRoomCodeInput(value);
}

function normalizeRoomEmoji(value) {
  const emoji = String(value || "").trim();
  return emoji ? Array.from(emoji).slice(0, 8).join("") : defaultRoomEmoji;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function isAbortError(error) {
  return error?.name === "AbortError";
}

function abortRoomDataRequests() {
  roomDataGeneration += 1;
  roomDataController?.abort();
  roomDataController = null;
  freeBusyGeneration += 1;
  freeBusyController?.abort();
  freeBusyController = null;
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

function calendarWriteReady() {
  return Boolean(sessionInfo?.user?.calendarWriteReady);
}

function calendarEventSyncPreferenceEnabled() {
  const preference = sessionInfo?.user?.calendarEventSync?.enabled;
  return typeof preference === "boolean" ? preference : true;
}

function calendarEventSyncEnabled() {
  return Boolean(calendarWriteReady() && calendarEventSyncPreferenceEnabled());
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

function hiddenParticipantsStorageKey(roomCode = currentRoom?.code) {
  const normalizedCode = normalizeRoomCodeInput(roomCode || "");
  return normalizedCode ? `cg-hidden-participants-${normalizedCode}` : "";
}

function pruneHiddenParticipantIds({ persist = false } = {}) {
  const validIds = new Set((currentRoom?.participants || []).map((participant) => participant.id));
  let changed = false;
  hiddenParticipantIds = new Set([...hiddenParticipantIds].filter((participantId) => {
    const keep = validIds.has(participantId);
    if (!keep) changed = true;
    return keep;
  }));
  if (changed && persist) {
    saveHiddenParticipantIds();
  }
}

function loadHiddenParticipantIds(roomCode = currentRoom?.code) {
  hiddenParticipantIds = new Set();
  const storageKey = hiddenParticipantsStorageKey(roomCode);
  if (!storageKey) return;

  try {
    const savedIds = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
    if (Array.isArray(savedIds)) {
      hiddenParticipantIds = new Set(savedIds.map((id) => String(id || "").trim()).filter(Boolean));
    }
  } catch {
    hiddenParticipantIds = new Set();
  }

  pruneHiddenParticipantIds({ persist: true });
}

function saveHiddenParticipantIds(roomCode = currentRoom?.code) {
  const storageKey = hiddenParticipantsStorageKey(roomCode);
  if (!storageKey) return;

  try {
    window.localStorage.setItem(storageKey, JSON.stringify([...hiddenParticipantIds]));
  } catch {
    // Local view preferences are optional; rendering still works if storage is unavailable.
  }
}

function participantCalendarVisible(participantId) {
  return !hiddenParticipantIds.has(participantId);
}

function visibleParticipantIds() {
  const connectedIds = connectedParticipants().map((participant) => participant.id);
  return new Set(connectedIds.filter((id) => participantCalendarVisible(id)));
}

function roomInitials(room = {}) {
  const source = String(room.name || room.code || "Room").trim();
  const words = source.split(/\s+/).filter(Boolean);
  const letters = words.length > 1
    ? words.slice(0, 2).map((word) => word[0])
    : source.slice(0, 2).split("");
  return letters.join("").toUpperCase() || "R";
}

function currentRoomSwitcherSummary() {
  if (!currentRoom?.code) return null;
  return {
    code: currentRoom.code,
    name: currentRoom.name || "Room",
    emoji: currentRoom.emoji || defaultRoomEmoji,
    isHost: currentIsHost,
    participantCount: currentRoom.participants?.length || 0,
    connectedCount: (currentRoom.participants || []).filter((participant) => participant.connected).length
  };
}

function switcherRooms() {
  const roomsByCode = new Map(
    myRooms.map((room) => [normalizeRoomCodeInput(room.code), room])
  );
  const currentSummary = currentRoomSwitcherSummary();
  if (currentSummary) {
    roomsByCode.set(currentSummary.code, {
      ...roomsByCode.get(currentSummary.code),
      ...currentSummary
    });
  }
  return [...roomsByCode.values()];
}

function renderRoomSwitcher() {
  if (!roomSwitcher) return;
  const rooms = switcherRooms();
  roomSwitcher.innerHTML = "";
  roomSwitcher.classList.toggle("hidden", rooms.length === 0);
  if (!rooms.length) return;

  const selectedCode = currentRoom?.code || normalizeRoomCodeInput(sessionInfo?.roomCode || "");
  for (const room of rooms) {
    const code = normalizeRoomCodeInput(room.code);
    const item = document.createElement("div");
    const isActive = code === selectedCode;
    item.className = `room-switch-item ${isActive ? "active" : ""}`.trim();

    const button = document.createElement("button");
    button.type = "button";
    button.className = `room-switch-tab ${isActive ? "active" : ""}`.trim();
    button.dataset.roomCode = code;
    button.title = `${room.name || "Room"} · ${code}`;
    button.setAttribute("aria-current", isActive ? "page" : "false");

    const mark = document.createElement("span");
    mark.className = "room-switch-mark";
    mark.textContent = room.emoji || roomInitials(room);

    const label = document.createElement("span");
    label.className = "room-switch-label";
    label.textContent = room.name || "Room";

    const meta = document.createElement("span");
    meta.className = "room-switch-meta";
    meta.textContent = room.isHost
      ? "Host"
      : `${room.connectedCount || 0}/${room.participantCount || 0} live`;

    button.append(mark, label, meta);
    button.addEventListener("click", async () => {
      await switchRoom(code);
    });
    item.appendChild(button);

    roomSwitcher.appendChild(item);
  }

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "room-switch-tab room-switch-add";
  addButton.title = "Create or join another room";
  addButton.setAttribute("aria-label", "Create or join another room");
  addButton.innerHTML = `
    <span class="room-switch-mark" aria-hidden="true">+</span>
    <span class="room-switch-label">New room</span>
    <span class="room-switch-meta">Join</span>
  `;
  addButton.addEventListener("click", openRoomEntryPage);
  roomSwitcher.appendChild(addButton);
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
    sessionInfo = {
      ...sessionInfo,
      displayName: patch.displayName || sessionInfo?.displayName,
      user: sessionInfo?.user ? {
        ...sessionInfo.user,
        displayName: patch.displayName || sessionInfo.user.displayName,
        preferredColor: patch.color || sessionInfo.user.preferredColor
      } : sessionInfo?.user
    };
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
  await loadFreeBusy();
  render();
}

function calendarPeriodText() {
  if (currentView === "day") {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(currentFocusDate);
  }

  if (currentView === "month") {
    return formatMonthYear(currentFocusDate);
  }

  if (currentView === "year") {
    return String(currentFocusDate.getFullYear());
  }

  return formatRange();
}

function updateCalendarPeriodControls() {
  if (!calendarPeriodLabel) return;
  calendarPeriodLabel.textContent = calendarPeriodText();
  const unit = currentView === "day" ? "day" : currentView;
  prevPeriodButton?.setAttribute("aria-label", `Previous ${unit}`);
  prevPeriodButton?.setAttribute("title", `Previous ${unit}`);
  nextPeriodButton?.setAttribute("aria-label", `Next ${unit}`);
  nextPeriodButton?.setAttribute("title", `Next ${unit}`);
}

async function shiftCalendarPeriod(direction) {
  if (!currentRoom) return;
  const step = direction < 0 ? -1 : 1;

  if (currentView === "day") {
    currentFocusDate = startOfDay(addDays(currentFocusDate, step));
  } else if (currentView === "month") {
    currentFocusDate = addMonths(currentFocusDate, step);
  } else if (currentView === "year") {
    currentFocusDate = addYears(currentFocusDate, step);
  } else {
    currentFocusDate = startOfDay(addDays(currentFocusDate, step * 7));
  }

  await loadFreeBusy();
  render();
}

async function toggleFullscreenMode() {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen?.();
    fullscreenButton.classList.add("is-active");
    return;
  }

  await document.exitFullscreen?.();
  fullscreenButton.classList.remove("is-active");
}

async function goToDay(date) {
  currentFocusDate = startOfDay(date);
  if (currentView !== "day") {
    currentView = "day";
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

function googleAuthUrl(roomCodeValue, { calendarWrite = true } = {}) {
  const params = new URLSearchParams({ room: normalizeRoomCodeInput(roomCodeValue) });
  params.set("calendarWrite", calendarWrite ? "1" : "0");
  return `/auth/google?${params.toString()}`;
}

function roomInviteMessage() {
  const roomLabel = `${currentRoom?.emoji || defaultRoomEmoji} ${currentRoom?.name || "CommonGround room"}`.trim();
  return [
    `Join my CommonGround room ${roomLabel}: ${roomInviteLink()}`,
    `Room code: ${currentRoom?.code || ""}`,
    currentRoom?.accessLocked ? "The host will approve your join request." : "Open the link to join as a guest or connect your calendar.",
    "CommonGround only shares busy/free availability, not private event details."
  ].join("\n");
}

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function fullyFreeParticipantsForDate(date, blocksByDate = buildBusyDayBlocks()) {
  const dayData = blocksByDate.get(dateKey(date)) || [];
  const busyEntries = Array.isArray(dayData) ? dayData : (dayData.segments || []);
  const eventEntries = Array.isArray(dayData) ? [] : (dayData.eventBlocks || []);
  const busyParticipants = new Set();
  for (const block of busyEntries) {
    if (block.participants?.length) {
      for (const participant of block.participants) {
        if (participant.participantId) busyParticipants.add(participant.participantId);
      }
    } else if (block.participantId) {
      busyParticipants.add(block.participantId);
    }
  }
  for (const eventBlock of eventEntries) {
    for (const participantId of eventBlock.inviteeParticipantIds || []) {
      busyParticipants.add(participantId);
    }
  }
  const visibleIds = visibleParticipantIds();
  return (currentRoom?.participants || []).filter((participant) => participant.connected && visibleIds.has(participant.id) && !busyParticipants.has(participant.id));
}

async function copyInviteLink() {
  if (!currentRoom?.code) return;
  try {
    await copyTextToClipboard(roomInviteMessage());
    calendarStatus.textContent = "Invite message copied.";
  } catch {
    calendarStatus.textContent = roomInviteMessage();
  }
}

function dismissInviteStrip() {
  if (currentRoom?.code) {
    dismissedInviteRoomCodes.add(currentRoom.code);
  }
  emptyRoomState?.classList.add("hidden");
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "fixed";
  helper.style.top = "-9999px";
  helper.style.opacity = "0";
  document.body.appendChild(helper);
  helper.select();
  helper.setSelectionRange(0, helper.value.length);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } finally {
    document.body.removeChild(helper);
  }

  if (!copied) {
    throw new Error("Copy failed");
  }
}

function renderRoomCodePill() {
  if (!roomCode) return;
  const code = currentRoom?.code || "------";
  const copied = Boolean(code && copiedRoomCodeValue === code);
  roomCode.textContent = copied ? "Copied" : code;
  roomCode.classList.toggle("is-copied", copied);
  roomCode.disabled = !currentRoom?.code;
  roomCode.setAttribute("aria-label", copied ? "Room code copied" : "Copy room code");
  roomCode.title = copied ? "Room code copied" : "Copy room code";
}

async function copyRoomCode() {
  const code = currentRoom?.code;
  if (!code) return;

  try {
    await copyTextToClipboard(code);
    copiedRoomCodeValue = code;
    if (roomCodeCopyTimer) window.clearTimeout(roomCodeCopyTimer);
    renderRoomCodePill();
    calendarStatus.textContent = "Room code copied.";
    roomCodeCopyTimer = window.setTimeout(() => {
      if (copiedRoomCodeValue === code) {
        copiedRoomCodeValue = "";
        renderRoomCodePill();
      }
      roomCodeCopyTimer = null;
    }, 1800);
  } catch {
    calendarStatus.textContent = code;
  }
}

function participantStatusText(participant) {
  if (!participant) return "guest";
  if (participant.syncStatus === "needs_reconnect" || participant.needsReconnect) return "reconnect needed";
  if (participant.syncStatus === "error") return "sync issue";
  return participant.connected ? "live" : "guest";
}

function participantColorOption(color) {
  return participantPalette.find((option) => option.value === color) || participantPalette[0];
}

function formatSyncStamp(value) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
  } catch {
    return "";
  }
}

function normalizedTextKey(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function ownBusyLabel(participant) {
  const ownerKey = normalizedTextKey(participant.ownerName);
  const titles = [...new Set(
    (participant.items || [])
      .map((item) => String(item.title || "").trim())
      .filter((title) => normalizedTextKey(title) !== ownerKey)
      .filter(Boolean)
  )];

  if (!titles.length) return "";
  if (titles.length === 1) return titles[0];
  return `${titles[0]} +${titles.length - 1}`;
}

function busyVisibilityLabel(participant, isOwnBlock) {
  if (!isOwnBlock) return "Busy";
  return ownBusyLabel(participant);
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
  return currentParticipant?.id ? [currentParticipant.id] : [];
}

function renderInviteePicker(selectedIds = defaultInviteeIds(), options = {}) {
  if (!inviteePicker) return;
  const selected = new Set(selectedIds);
  const lockedIds = new Set(options.lockedParticipantIds || []);
  for (const participantId of lockedIds) selected.add(participantId);
  const invitees = currentRoom?.participants || [];
  inviteePicker.innerHTML = "";

  if (!invitees.length) {
    inviteePicker.innerHTML = `<p class="muted">No participants are in this room yet.</p>`;
    updateInviteeCountText();
    return;
  }

  const optionList = document.createElement("div");
  optionList.className = "invitee-options";
  for (const participant of invitees) {
    const label = document.createElement("label");
    label.className = "invitee-option";
    label.style.setProperty("--invitee-color", participant.color);
    const isSelf = participant.id === currentParticipant?.id;
    const isCreator = participant.id === options.creatorParticipantId;
    const isLocked = lockedIds.has(participant.id);
    const suffix = isCreator ? " (Creator)" : (isSelf ? " (You)" : "");
    label.innerHTML = `
      <input type="checkbox" value="${escapeAttribute(participant.id)}" ${selected.has(participant.id) || isLocked ? "checked" : ""} ${isLocked ? "disabled" : ""} />
      <span class="invitee-color-dot"></span>
      <strong>${escapeHtml(participant.displayName)}${escapeHtml(suffix)}</strong>
    `;
    label.querySelector("input")?.addEventListener("change", updateInviteeCountText);
    optionList.appendChild(label);
  }
  inviteePicker.appendChild(optionList);
  updateInviteeCountText();
}

function renderTopbarIdentity() {
  if (!topbarIdentity || !currentParticipant) return;
  const currentColorOption = participantColorOption(currentParticipant.color);
  topbarIdentity.innerHTML = `
    <button class="identity-name-button" id="topbarIdentityName" type="button">${escapeHtml(currentParticipant.displayName)}</button>
    <details class="color-picker-menu topbar-identity-menu">
      <summary class="color-picker-trigger topbar-color-trigger" aria-label="Choose your color">
        <span class="current-color-dot" style="--swatch-color: ${escapeAttribute(currentColorOption.value)}"></span>
      </summary>
      <div class="color-option-list">
        ${participantPalette.map((option) => `
          <button class="color-option-button ${option.value === currentParticipant.color ? "is-active" : ""}" type="button" data-topbar-color="${escapeAttribute(option.value)}">
            <span class="current-color-dot" style="--swatch-color: ${escapeAttribute(option.value)}"></span>
            <span>${escapeHtml(option.name)}</span>
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
  pruneHiddenParticipantIds({ persist: true });
  for (const participant of currentRoom?.participants || []) {
    const isHidden = hiddenParticipantIds.has(participant.id);
    const visibilityAction = isHidden ? "Show" : "Hide";
    const chip = document.createElement("div");
    chip.className = [
      "participant-chip",
      participant.connected ? "" : "faded",
      isHidden ? "is-hidden" : ""
    ].filter(Boolean).join(" ");
    chip.style.setProperty("--chip-color", participant.color);
    chip.tabIndex = 0;
    chip.setAttribute("role", "button");
    chip.setAttribute("aria-pressed", String(!isHidden));
    chip.setAttribute("aria-label", `${visibilityAction} ${participant.displayName}'s calendar`);
    chip.title = `${visibilityAction} ${participant.displayName}'s calendar`;

    const toggleVisibility = () => {
      if (hiddenParticipantIds.has(participant.id)) {
        hiddenParticipantIds.delete(participant.id);
      } else {
        hiddenParticipantIds.add(participant.id);
      }
      saveHiddenParticipantIds();
      render();
    };

    chip.addEventListener("click", toggleVisibility);
    chip.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleVisibility();
      }
    });

    chip.innerHTML = `
      <span class="participant-dot"></span>
      <div class="participant-copy">
        <strong>${escapeHtml(participant.displayName)}</strong>
      </div>
      ${isHidden ? `<span class="participant-visibility-state">Hidden</span>` : ""}
    `;

    if (currentIsHost && !participant.isCurrent) {
      const removeButton = document.createElement("button");
      removeButton.className = "chip-action";
      removeButton.type = "button";
      removeButton.setAttribute("aria-label", `Remove ${participant.displayName}`);
      removeButton.innerHTML = "&times;";
      removeButton.addEventListener("click", async (event) => {
        event.stopPropagation();
        await removeParticipant(participant.id);
      });
      removeButton.addEventListener("keydown", (event) => {
        event.stopPropagation();
      });
      chip.appendChild(removeButton);
    }

    participantStrip.appendChild(chip);
  }
}

function setParticipantsPanelExpanded(expanded) {
  if (!participantsSidebar || !participantsRail) return;
  participantsSidebar.classList.toggle("is-open", Boolean(expanded));
  participantsRail.setAttribute("aria-expanded", String(Boolean(expanded)));
  participantsRail.setAttribute("aria-label", expanded ? "Close members panel" : "Open members panel");
  participantsRail.title = expanded ? "Close members panel" : "Open members panel";
}

function renderJoinRequests() {
  if (!joinRequestQueue || !joinRequestList || !joinRequestCount) return;
  const requests = currentIsHost ? (currentRoom?.pendingJoinRequests || []) : [];
  joinRequestQueue.classList.toggle("hidden", !currentIsHost);
  joinRequestCount.textContent = `${requests.length} pending`;
  joinRequestList.innerHTML = "";

  if (!requests.length) {
    joinRequestList.innerHTML = `<p class="muted">No pending requests.</p>`;
    return;
  }

  for (const request of requests) {
    const row = document.createElement("div");
    row.className = "request-item";
    const requestedAt = formatSyncStamp(request.requestedAt);
    const sourceLabel = "Google";
    row.innerHTML = `
      <div class="request-copy">
        <strong>${escapeHtml(request.displayName)}</strong>
        <span>${request.source === "guest" ? "Guest" : sourceLabel}${requestedAt ? ` · ${requestedAt}` : ""}</span>
      </div>
      <div class="request-actions">
        <button class="secondary strong" type="button" data-request-action="approved">Approve</button>
        <button class="ghost" type="button" data-request-action="denied">Deny</button>
      </div>
    `;

    for (const button of row.querySelectorAll("[data-request-action]")) {
      button.addEventListener("click", async () => {
        await updateJoinRequest(request.id, button.dataset.requestAction);
      });
    }

    joinRequestList.appendChild(row);
  }
}

function renderCalendarEventSyncControls() {
  if (!googleEventSyncToggle || !googleEventSyncStatus) return;

  const connected = currentUserConnected() && currentParticipantConnected();
  const writeReady = calendarWriteReady();
  const enabled = calendarEventSyncEnabled();

  googleEventSyncToggle.checked = calendarEventSyncPreferenceEnabled();
  googleEventSyncToggle.disabled = !connected || !writeReady;

  if (!connected) {
    googleEventSyncStatus.textContent = "Connect calendar to activate event sync.";
  } else if (!writeReady) {
    googleEventSyncStatus.textContent = "Reconnect Google Calendar to activate event sync.";
  } else if (enabled) {
    googleEventSyncStatus.textContent = "Adds created and invited events to Google Calendar.";
  } else {
    googleEventSyncStatus.textContent = "Events stay in this room only.";
  }
}

function renderRoomMeta() {
  roomName.textContent = currentRoom?.name || "Room";
  roomName.contentEditable = "false";
  if (copiedRoomCodeValue && copiedRoomCodeValue !== currentRoom?.code) {
    copiedRoomCodeValue = "";
    if (roomCodeCopyTimer) {
      window.clearTimeout(roomCodeCopyTimer);
      roomCodeCopyTimer = null;
    }
  }
  renderRoomCodePill();
  emptyRoomCode.textContent = currentRoom?.code || "------";
  hostPill.classList.toggle("hidden", !currentIsHost);
  syncInputValue(renameRoomInput, currentRoom?.name || "");
  syncInputValue(renameRoomEmojiInput, currentRoom?.emoji || defaultRoomEmoji);
  syncInputValue(customRoomCodeInput, currentRoom?.code || "");
  if (roomLockToggle) roomLockToggle.checked = Boolean(currentRoom?.accessLocked);
  hostPanel.classList.remove("hidden");
  hostSettings.classList.toggle("hidden", !currentIsHost);

  const connectedCount = (currentRoom?.participants || []).filter((participant) => participant.connected).length;
  roomStatus.textContent = `${currentRoom?.participants?.length || 0} people · ${connectedCount} connected`;

  const onlyOneParticipant = (currentRoom?.participants?.length || 0) <= 1;
  const inviteDismissed = Boolean(currentRoom?.code && dismissedInviteRoomCodes.has(currentRoom.code));
  emptyRoomState.classList.toggle("hidden", !onlyOneParticipant || inviteDismissed);

  if (currentParticipantNeedsReconnect()) {
    connectGoogleButton.textContent = "Reconnect calendar";
    settingsReconnectButton.classList.remove("hidden");
    settingsReconnectButton.dataset.calendarWrite = "true";
    settingsReconnectButton.textContent = "Reconnect calendar";
    connectWidgetText.textContent = currentParticipant?.lastSyncError
      ? `Last sync issue: ${currentParticipant.lastSyncError}`
      : "Reconnect calendar to keep availability updated.";
  } else if (currentParticipantConnected()) {
    connectGoogleButton.textContent = "Calendar connected";
    const needsWriteAccess = !calendarWriteReady();
    settingsReconnectButton.classList.toggle("hidden", !needsWriteAccess);
    settingsReconnectButton.dataset.calendarWrite = needsWriteAccess ? "true" : "false";
    settingsReconnectButton.textContent = needsWriteAccess ? "Enable Google event sync" : "Reconnect calendar";
    const syncStamp = formatSyncStamp(currentParticipant?.lastSyncedAt || sessionInfo?.user?.sync?.lastSuccessAt);
    connectWidgetText.textContent = `Last synced at ${syncStamp || "--"}`;
  } else {
    connectGoogleButton.textContent = "Connect calendar";
    settingsReconnectButton.classList.add("hidden");
    settingsReconnectButton.dataset.calendarWrite = "false";
    connectWidgetText.textContent = "Connect calendar to sync availability.";
  }

  renderCalendarEventSyncControls();
  renderTopbarIdentity();
  renderJoinRequests();
}

function refreshStatusLine() {
  const connectedCount = (currentRoom?.participants || []).filter((participant) => participant.connected).length;
  const lastRefreshed = currentRoom ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date()) : "";
  const syncedAt = formatSyncStamp(currentParticipant?.lastSyncedAt || sessionInfo?.user?.sync?.lastSuccessAt);
  calendarStatus.textContent = currentRoom
    ? `${connectedCount} connected${syncedAt ? ` · synced ${syncedAt}` : ""} · refreshed ${lastRefreshed}`
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
      <span class="participant-dot" style="--chip-color: ${escapeAttribute(currentParticipant.color)}"></span>
      <strong class="editable-identity-name" id="editableIdentityName">${escapeHtml(currentParticipant.displayName)}</strong>
    </div>
    <details class="color-picker-menu">
      <summary class="color-picker-trigger">
        <span class="current-color-dot" style="--swatch-color: ${escapeAttribute(currentColorOption.value)}"></span>
        <span>${escapeHtml(currentColorOption.name)}</span>
      </summary>
      <div class="color-option-list">
        ${participantPalette.map((option) => `
          <button class="color-option-button ${option.value === currentParticipant.color ? "is-active" : ""}" type="button" data-color="${escapeAttribute(option.value)}">
            <span class="current-color-dot" style="--swatch-color: ${escapeAttribute(option.value)}"></span>
            <span>${escapeHtml(option.name)}</span>
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

function openBusyDetail(group) {
  detailPanel.classList.remove("hidden");
  selectedBusyGroup = group;
  selectedEventId = null;
  detailEmpty.classList.add("hidden");
  eventDetail.classList.add("hidden");
  busyDetail.classList.remove("hidden");
  detailLabel.textContent = "Busy overlap";
  detailTitle.textContent = `${group.participants.length} busy`;
  busyDetailList.replaceChildren();

  if (group.participants.some((entry) => entry.participantId === currentParticipant?.id)) {
    const selfEditPanel = buildSelfEditPanel();
    if (selfEditPanel) busyDetailList.appendChild(selfEditPanel);
  }

  for (const entry of group.participants) {
    const section = document.createElement("section");
    section.className = "busy-detail-section";
    const item = document.createElement("div");
    item.className = "busy-detail-item";
    item.style.setProperty("--item-color", participantColorOption(entry.color).value);
    const owner = document.createElement("strong");
    owner.textContent = entry.ownerName || "Participant";
    const range = document.createElement("p");
    range.textContent = formatDateTimeRange(entry.start, entry.end);
    item.append(owner, range);
    section.appendChild(item);

    if (entry.participantId === currentParticipant?.id) {
      for (const busyItem of dedupeBusyItems(entry.items || []).sort((a, b) => new Date(a.start) - new Date(b.start))) {
        const sub = document.createElement("article");
        sub.className = "busy-subitem";
        const header = document.createElement("header");
        const title = document.createElement("strong");
        title.textContent = busyItem.title || "Busy";
        const time = document.createElement("span");
        time.textContent = formatDateTimeRange(busyItem.start, busyItem.end);
        header.append(title, time);
        sub.appendChild(header);
        if (busyItem.location) {
          const location = document.createElement("span");
          location.textContent = busyItem.location;
          sub.appendChild(location);
        }
        if (busyItem.description) {
          const description = document.createElement("p");
          description.textContent = busyItem.description;
          sub.appendChild(description);
        }
        section.appendChild(sub);
      }
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

function renderDetailInviteeList(event, canManage) {
  if (!detailInviteeList) return;
  const participants = currentRoom?.participants || [];
  const invitedIds = new Set((event.invitees || []).map((invitee) => invitee.participantId));
  const creatorId = event.createdByParticipantId;
  detailInviteeList.innerHTML = "";

  if (!participants.length) {
    detailInviteeList.innerHTML = `<p class="muted">No participants are in this room yet.</p>`;
    return;
  }

  for (const participant of participants) {
    const invited = invitedIds.has(participant.id) || participant.id === creatorId;
    const isCreator = participant.id === creatorId;
    const responseLabel = eventResponseLabel(event, participant.id);
    const inviteStatusLabel = isCreator ? "Creator" : (invited ? "Invited" : "Not invited");
    const row = document.createElement("label");
    row.className = `detail-invitee-row ${invited ? "is-invited" : "is-not-invited"} ${!canManage ? "is-readonly" : ""}`.trim();
    row.style.setProperty("--invitee-color", participant.color);

    row.innerHTML = `
      <input type="checkbox" value="${escapeAttribute(participant.id)}" ${invited ? "checked" : ""} ${!canManage || isCreator ? "disabled" : ""} />
      <span class="invitee-color-dot"></span>
      <span class="detail-invitee-copy">
        <strong>${escapeHtml(participant.displayName)}${participant.id === currentParticipant?.id ? " (You)" : ""}</strong>
        <small>${escapeHtml(inviteStatusLabel)}</small>
      </span>
      <span class="detail-invitee-status">${escapeHtml(invited ? responseLabel : "Not invited")}</span>
    `;

    row.querySelector("input")?.addEventListener("change", () => {
      if (detailInviteeFeedback) {
        detailInviteeFeedback.dataset.persistedMessage = "";
        detailInviteeFeedback.textContent = "Unsaved changes";
      }
      updateEventPanelSaveState();
    });
    detailInviteeList.appendChild(row);
  }
}

function setEventPanelReadOnly(readOnly, lockRange = false) {
  const rangeInputs = new Set([detailDateInput, detailStartInput, detailEndInput]);
  for (const input of [
    detailTitleInput,
    detailDateInput,
    detailStartInput,
    detailEndInput,
    detailLocationInput,
    detailDescriptionInput
  ]) {
    if (!input) continue;
    input.disabled = Boolean(readOnly || (lockRange && rangeInputs.has(input)));
  }
}

function renderEventPanelForm(event, canManage) {
  if (!eventPanelForm || !event) return;
  const start = new Date(event.start);
  const end = new Date(event.end);
  const preserveOriginalRange = dateKey(start) !== dateKey(end);
  const originalAllDay = typeof event.allDay === "boolean" ? event.allDay : isWholeDayRange(start, end);

  eventPanelForm.dataset.canManage = canManage ? "true" : "false";
  eventPanelForm.dataset.preserveOriginalRange = preserveOriginalRange ? "true" : "false";
  eventPanelForm.dataset.originalStart = event.start;
  eventPanelForm.dataset.originalEnd = event.end;
  eventPanelForm.dataset.originalTimezone = event.timezone || "UTC";
  eventPanelForm.dataset.originalAllDay = originalAllDay ? "true" : "false";
  if (detailTitleInput) detailTitleInput.value = event.viewerCanSeeDetails ? (event.title || "(No title)") : "Busy";
  if (detailDateInput) detailDateInput.value = dateKey(start);
  if (detailStartInput) detailStartInput.value = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
  if (detailEndInput) detailEndInput.value = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
  if (detailLocationInput) detailLocationInput.value = event.viewerCanSeeDetails ? (event.location || "") : "";
  if (detailDescriptionInput) detailDescriptionInput.value = event.viewerCanSeeDetails ? (event.description || "") : "";
  if (detailGoogleSyncInput) detailGoogleSyncInput.checked = event.syncToGoogle !== false;
  if (detailInviteeFeedback) {
    detailInviteeFeedback.dataset.persistedMessage = canManage ? "" : "Read only";
    detailInviteeFeedback.textContent = detailInviteeFeedback.dataset.persistedMessage;
  }

  setEventPanelReadOnly(!canManage, preserveOriginalRange);
  for (const input of [detailDateInput, detailStartInput, detailEndInput]) {
    if (!input) continue;
    input.title = preserveOriginalRange
      ? "This all-day or multi-day event keeps its original date and time range here."
      : "";
  }
  renderDetailInviteeList(event, canManage);
  updateDetailGoogleSyncControl(canManage);
  eventPanelInitialState = eventPanelStateSnapshot();
  updateEventPanelSaveState();
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
      <header><strong>${escapeHtml(comment.displayName)}</strong><span>${escapeHtml(stamp)}</span></header>
      <p>${escapeHtml(comment.text)}</p>
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
  if (!event) {
    clearDetailPanel();
    return;
  }
  detailPanel.classList.remove("hidden");

  detailEmpty.classList.add("hidden");
  busyDetail.classList.add("hidden");
  eventDetail.classList.remove("hidden");
  detailLabel.textContent = "Group event";
  detailTitle.textContent = event.title || "Busy";
  detailTime.textContent = formatDateTimeRange(event.start, event.end);
  responseSummary.textContent = `${event.responseSummary?.yes || 0} yes · ${event.responseSummary?.maybe || 0} maybe · ${event.responseSummary?.no || 0} no`;
  renderResponseGroups(event);
  renderComments(event);
  const currentResponse = event.responses?.[currentParticipant?.id] || "";
  setVoteButtons(currentResponse);

  const canManage = currentIsHost || event.createdByParticipantId === currentParticipant?.id;
  renderEventPanelForm(event, canManage);
  inviteeSummary.textContent = event.invitees?.length ? `${event.invitees.length} invited` : "No invitees selected.";
  const canRespond = Boolean(event.isInvited);
  editEventButton.classList.add("hidden");
  deleteEventButton.classList.toggle("hidden", !canManage);
  // Time changes are made by the event creator in the editor. Guests can vote
  // without mutating the event's canonical start and end times.
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
  eventPanelInitialState = "";
  for (const button of document.querySelectorAll(".vote-button")) {
    button.disabled = false;
  }
}

function busyItemStableKey(item = {}) {
  return [
    item.sourceId || "",
    item.provider || "",
    item.start || "",
    item.end || "",
    item.title || ""
  ].join("::");
}

function dedupeBusyItems(items = []) {
  const seen = new Set();
  const deduped = [];
  for (const item of items || []) {
    const key = busyItemStableKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push({ ...item });
  }
  return deduped;
}

function busyBlockSourceKey(block = {}) {
  const itemKeys = dedupeBusyItems(block.items || [])
    .map((item) => item.sourceId || busyItemStableKey(item))
    .sort()
    .join("|");
  return itemKeys || [block.calendarId || "", block.ownerId || "", block.ownerName || ""].join("::");
}

function busyBlockStableKey(block = {}) {
  return [
    block.participantId || "",
    block.start || "",
    block.end || "",
    busyBlockSourceKey(block)
  ].join("::");
}

function normalizeBusyBlocks(blocks = []) {
  const merged = new Map();

  for (const rawBlock of blocks || []) {
    if (!rawBlock?.participantId || !rawBlock?.start || !rawBlock?.end) continue;
    const start = new Date(rawBlock.start);
    const end = new Date(rawBlock.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) continue;

    const normalizedBlock = {
      ...rawBlock,
      start: start.toISOString(),
      end: end.toISOString(),
      items: dedupeBusyItems(rawBlock.items || [])
    };
    const key = busyBlockStableKey(normalizedBlock);
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, normalizedBlock);
      continue;
    }

    existing.items = dedupeBusyItems([...(existing.items || []), ...(normalizedBlock.items || [])]);
  }

  return [...merged.values()].sort((a, b) => {
    const startDiff = new Date(a.start) - new Date(b.start);
    if (startDiff !== 0) return startDiff;
    const endDiff = new Date(a.end) - new Date(b.end);
    if (endDiff !== 0) return endDiff;
    return String(a.participantId).localeCompare(String(b.participantId));
  });
}

function buildBusyDayBlocks() {
  const byDay = new Map();
  const visibleIds = visibleParticipantIds();
  const seenDayKeys = new Set();

  for (const block of normalizeBusyBlocks(googleBusy)) {
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
        const dayDedupKey = [
          key,
          block.participantId,
          new Date(segmentStart).toISOString(),
          new Date(segmentEnd).toISOString(),
          busyBlockSourceKey(block)
        ].join("::");
        if (seenDayKeys.has(dayDedupKey)) {
          cursor.setDate(cursor.getDate() + 1);
          continue;
        }
        seenDayKeys.add(dayDedupKey);
        const entry = {
          participantId: block.participantId,
          ownerId: block.ownerId,
          ownerName: block.ownerName,
          color: block.color,
          items: dedupeBusyItems(block.items || []),
          startHour: clampedStart,
          endHour: clampedEnd,
          start: new Date(segmentStart).toISOString(),
          end: new Date(segmentEnd).toISOString(),
          sourceKey: busyBlockSourceKey(block)
        };
        byDay.set(key, [...(byDay.get(key) || []), entry]);
      }

      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return byDay;
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
        items: dedupeBusyItems(block.items || [])
      });
      continue;
    }
    existing.start = existing.start < block.start ? existing.start : block.start;
    existing.end = existing.end > block.end ? existing.end : block.end;
    existing.items = dedupeBusyItems([...(existing.items || []), ...(block.items || [])]);
  }
  return [...merged.values()];
}

function busySegmentsForDate(date) {
  const blocks = (buildBusyDayBlocks().get(dateKey(date)) || [])
    .slice()
    .sort((a, b) => {
      if (a.startHour !== b.startHour) return a.startHour - b.startHour;
      if (a.endHour !== b.endHour) return a.endHour - b.endHour;
      return String(a.participantId).localeCompare(String(b.participantId));
    });
  if (!blocks.length) return [];

  const dayStart = startOfDay(date);
  const dateAtHour = (hour) => {
    const value = new Date(dayStart);
    value.setMinutes(Math.round(hour * 60), 0, 0);
    return value;
  };
  const boundaries = [...new Set(
    blocks.flatMap((block) => [block.startHour, block.endHour])
  )].sort((a, b) => a - b);
  const segments = [];
  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const startHour = boundaries[index];
    const endHour = boundaries[index + 1];
    if (endHour <= startHour) continue;
    const activeBlocks = blocks.filter((block) => block.startHour < endHour && block.endHour > startHour);
    if (!activeBlocks.length) continue;

    const start = dateAtHour(startHour).toISOString();
    const end = dateAtHour(endHour).toISOString();
    const participants = mergeParticipantEntries(activeBlocks.map((block) => ({ ...block, start, end })));
    const participantKey = participants.map((participant) => participant.participantId).sort().join("|");
    const previous = segments[segments.length - 1];
    if (previous && previous.participantKey === participantKey && Math.abs(previous.endHour - startHour) < 0.001) {
      previous.endHour = endHour;
      for (const participant of previous.participants) {
        const nextParticipant = participants.find((entry) => entry.participantId === participant.participantId);
        participant.end = end;
        participant.items = dedupeBusyItems([...(participant.items || []), ...(nextParticipant?.items || [])]);
      }
      continue;
    }

    segments.push({ date, startHour, endHour, participants, participantKey });
  }

  return segments.map((segment, index) => ({
    ...segment,
    id: `${dateKey(date)}-${index}-${segment.startHour}-${segment.endHour}-${segment.participantKey}`
  }));
}

function mergeTimeSegments(segments = []) {
  const sorted = segments
    .map((segment) => ({
      ...segment,
      startHour: Math.max(calendarStartHour, Number(segment.startHour)),
      endHour: Math.min(calendarEndHour, Number(segment.endHour))
    }))
    .filter((segment) => (
      Number.isFinite(segment.startHour) &&
      Number.isFinite(segment.endHour) &&
      segment.endHour > segment.startHour
    ))
    .sort((a, b) => {
      if (a.startHour !== b.startHour) return a.startHour - b.startHour;
      return a.endHour - b.endHour;
    });

  const merged = [];
  for (const segment of sorted) {
    const previous = merged[merged.length - 1];
    if (!previous || segment.startHour > previous.endHour) {
      merged.push({ startHour: segment.startHour, endHour: segment.endHour });
      continue;
    }
    previous.endHour = Math.max(previous.endHour, segment.endHour);
  }
  return merged;
}

function occupiedSegmentsForDate(date, busySegments = busySegmentsForDate(date), eventBlocks = eventBlocksForDate(date)) {
  return mergeTimeSegments([
    ...busySegments.map((segment) => ({
      startHour: segment.startHour,
      endHour: segment.endHour,
      type: "busy"
    })),
    ...eventBlocks.map((eventBlock) => ({
      startHour: eventBlock.startHour,
      endHour: eventBlock.endHour,
      type: "event"
    }))
  ]);
}

function freeSegmentsForDate(date, occupiedSegments = occupiedSegmentsForDate(date)) {
  const blocks = mergeTimeSegments(occupiedSegments);
  const segments = [];
  let cursor = calendarStartHour;

  for (const block of blocks) {
    if (block.startHour > cursor) {
      const startHour = clampVisibleHour(ceilQuarterHour(cursor));
      const endHour = clampVisibleHour(floorQuarterHour(block.startHour));
      if (endHour - startHour >= 0.25) {
        segments.push({
          date,
          startHour,
          endHour
        });
      }
    }
    cursor = Math.max(cursor, block.endHour);
  }

  if (cursor < calendarEndHour) {
    const startHour = clampVisibleHour(ceilQuarterHour(cursor));
    const endHour = clampVisibleHour(floorQuarterHour(calendarEndHour));
    if (endHour - startHour >= 0.25) {
      segments.push({
        date,
        startHour,
        endHour
      });
    }
  }

  return segments.filter((segment) => segment.endHour - segment.startHour >= 0.25);
}

function layoutEventLanes(events = []) {
  const sorted = events
    .slice()
    .sort((a, b) => {
      if (a.startHour !== b.startHour) return a.startHour - b.startHour;
      if (a.endHour !== b.endHour) return b.endHour - a.endHour;
      return String(a.id).localeCompare(String(b.id));
    });
  const laidOut = [];
  let cluster = [];
  let clusterEnd = null;

  const flushCluster = () => {
    if (!cluster.length) return;
    const lanes = [];
    const clusterItems = [];

    for (const eventBlock of cluster) {
      let laneIndex = lanes.findIndex((laneEnd) => eventBlock.startHour >= laneEnd);
      if (laneIndex === -1) {
        laneIndex = lanes.length;
        lanes.push(eventBlock.endHour);
      } else {
        lanes[laneIndex] = eventBlock.endHour;
      }
      clusterItems.push({ ...eventBlock, laneIndex });
    }

    const laneCount = Math.max(1, lanes.length);
    for (const item of clusterItems) {
      laidOut.push({ ...item, laneCount });
    }

    cluster = [];
    clusterEnd = null;
  };

  for (const eventBlock of sorted) {
    if (clusterEnd === null || eventBlock.startHour >= clusterEnd) {
      flushCluster();
      cluster = [eventBlock];
      clusterEnd = eventBlock.endHour;
      continue;
    }

    cluster.push(eventBlock);
    clusterEnd = Math.max(clusterEnd, eventBlock.endHour);
  }

  flushCluster();
  return laidOut;
}

function applyCalendarLanePosition(block, dayIndex, laneCount = 1, laneIndex = 0) {
  const dayCount = Number(calendarGrid.style.getPropertyValue("--day-count")) || (currentView === "day" ? 1 : 7);
  const safeLaneCount = Math.max(1, Number(laneCount || 1));
  const safeLaneIndex = Math.max(0, Math.min(safeLaneCount - 1, Number(laneIndex || 0)));
  const columnWidthPercent = 100 / dayCount;
  const laneWidthPercent = columnWidthPercent / safeLaneCount;
  const laneLeftPercent = columnWidthPercent * dayIndex + laneWidthPercent * safeLaneIndex;
  block.style.left = `calc(${laneLeftPercent}% + var(--calendar-block-gap))`;
  block.style.width = safeLaneCount > 1
    ? `calc(${laneWidthPercent}% - var(--calendar-block-lane-gap))`
    : `calc(${laneWidthPercent}% - var(--calendar-block-double-gap))`;
}

function eventBlocksForDate(date) {
  const items = [];
  const dayStart = startOfDay(date);
  const dayEnd = addDays(dayStart, 1);
  for (const event of currentRoom?.events || []) {
    const start = new Date(event.start);
    const end = new Date(event.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= dayEnd || end <= dayStart) continue;
    const segmentStart = start > dayStart ? start : dayStart;
    const segmentEnd = end < dayEnd ? end : dayEnd;
    const startHour = segmentStart <= dayStart
      ? calendarStartHour
      : segmentStart.getHours() + segmentStart.getMinutes() / 60;
    const endHour = segmentEnd >= dayEnd
      ? calendarEndHour
      : segmentEnd.getHours() + segmentEnd.getMinutes() / 60;
    if (endHour <= startHour) continue;
    const isCreator = event.createdByParticipantId === currentParticipant?.id;
    const isInvitee = Boolean(event.isInvited);
    const showDetails = Boolean(event.viewerCanSeeDetails);
    items.push({
      id: event.id,
      title: showDetails ? event.title : "Busy",
      location: showDetails ? event.location || "" : "",
      participantName: event.createdByDisplayName || "Someone",
      participantColor: event.createdByColor || participantPalette[0].value,
      inviteeParticipantIds: (event.invitees || []).map((invitee) => invitee.participantId),
      startHour,
      endHour,
      summary: `${event.responseSummary?.yes || 0} yes · ${event.responseSummary?.maybe || 0} maybe · ${event.responseSummary?.no || 0} no`,
      isInvitee: isInvitee && !isCreator,
      isInvitedViewer: Boolean(event.isInvited),
      continuesBefore: start < dayStart,
      continuesAfter: end > dayEnd,
      showDetails
    });
  }
  return items;
}

function eventCardMetrics(duration) {
  const rowHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--row-height")) || 58;
  const blockGap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--calendar-block-gap")) || 6;
  const renderedHeight = Math.max(10, duration * rowHeight - blockGap);
  const minutes = Math.round(duration * 60);
  let durationClass = "event-60plus";

  if (minutes <= 20 || renderedHeight < 22) {
    durationClass = "event-15";
  } else if (minutes <= 35 || renderedHeight < 32) {
    durationClass = "event-30";
  } else if (minutes <= 50 || renderedHeight < 46) {
    durationClass = "event-45";
  }

  if (renderedHeight >= 88) {
    return { sizeClass: "event-large", durationClass, pixelHeight: renderedHeight };
  }
  if (renderedHeight >= 52) {
    return { sizeClass: "event-medium", durationClass, pixelHeight: renderedHeight };
  }
  if (renderedHeight >= 30) {
    return { sizeClass: "event-small", durationClass, pixelHeight: renderedHeight };
  }
  return { sizeClass: "event-tiny", durationClass, pixelHeight: renderedHeight };
}

function eventOverlapsRange(event, rangeStart, rangeEnd) {
  const start = new Date(event.start);
  const end = new Date(event.end);
  return start < rangeEnd && end > rangeStart;
}

function invitedEventOverlapForRange(participantId, startValue, endValue) {
  if (!participantId || !currentRoom?.events?.length) return false;
  const rangeStart = new Date(startValue);
  const rangeEnd = new Date(endValue);
  if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime()) || rangeEnd <= rangeStart) {
    return false;
  }
  return currentRoom.events.some((event) => {
    const invitees = (event.invitees || []).map((invitee) => invitee.participantId);
    return invitees.includes(participantId) && eventOverlapsRange(event, rangeStart, rangeEnd);
  });
}

function invitedEventOverlap(participantId, date, startHour, endHour) {
  const rangeStart = startOfDay(date);
  rangeStart.setMinutes(Math.round(startHour * 60), 0, 0);
  const rangeEnd = startOfDay(date);
  rangeEnd.setMinutes(Math.round(endHour * 60), 0, 0);
  return invitedEventOverlapForRange(participantId, rangeStart, rangeEnd);
}

function busyStackNameSummary(participants = [], limit = 3) {
  const names = participants.slice(0, limit).map((participant) => participant.ownerName).filter(Boolean);
  const extraCount = Math.max(participants.length - names.length, 0);
  return {
    namesLabel: names.join(", "),
    extraLabel: extraCount ? ` +${extraCount} more` : ""
  };
}

function busyStackOpensUpward(segment) {
  const totalHours = calendarEndHour - calendarStartHour;
  const midpoint = (segment.startHour + segment.endHour) / 2;
  return midpoint >= calendarStartHour + totalHours * 0.62;
}

function setBusyStackExpanded(stack, expanded) {
  if (!stack) return;
  stack.classList.toggle("expanded", expanded);
  const trigger = stack.querySelector(".busy-stack-trigger");
  const popover = stack.querySelector(".busy-stack-popover");
  if (trigger) {
    trigger.setAttribute("aria-expanded", String(expanded));
  }
  if (popover) {
    popover.setAttribute("aria-hidden", String(!expanded));
  }
  if (expanded) {
    expandedBusyStackId = stack.dataset.stackId || null;
  } else if (expandedBusyStackId === stack.dataset.stackId) {
    expandedBusyStackId = null;
  }
}

function closeExpandedBusyStacks(exception = null) {
  for (const stack of document.querySelectorAll(".busy-stack.expanded")) {
    if (exception && stack === exception) continue;
    setBusyStackExpanded(stack, false);
  }
}

function createSingleBusyCard(segment, dayIndex) {
  const participant = segment.participants[0];
  const isOwnBlock = participant.participantId === currentParticipant?.id;
  const ownerLabel = participant.ownerName;
  const visibilityLabel = busyVisibilityLabel(participant, isOwnBlock);
  const block = document.createElement("button");
  block.type = "button";
  const duration = segment.endHour - segment.startHour;
  const { durationClass } = eventCardMetrics(duration);
  const isTiny = duration < 0.75;
  const isCompact = duration < 1;
  const hasInvitedOverlap = invitedEventOverlap(participant.participantId, segment.date, segment.startHour, segment.endHour);
  const hasLaneOverlap = Number(segment.laneCount || 1) > 1;
  const laneSizeClass = hasLaneOverlap ? `event-lanes-${Math.min(Number(segment.laneCount || 1), 4)}` : "";
  block.className = [
    "busy-card",
    durationClass,
    isCompact ? "compact" : "",
    isTiny ? "tiny" : "",
    hasInvitedOverlap ? "invited-overlap" : "",
    hasLaneOverlap ? "busy-overlap-lane" : "",
    laneSizeClass
  ].filter(Boolean).join(" ");
  block.style.setProperty("--day-index", dayIndex);
  block.style.setProperty("--start", segment.startHour - calendarStartHour);
  block.style.setProperty("--duration", duration);
  block.style.setProperty("--event-color", participant.color);
  applyCalendarLanePosition(block, dayIndex, segment.laneCount, segment.laneIndex);
  const coversVisibleDay = duration >= (calendarEndHour - calendarStartHour) - 0.001;
  const timeRange = coversVisibleDay ? "All day" : formatEventRange(segment.startHour, segment.endHour);
  const titleLabel = normalizedTextKey(visibilityLabel) === normalizedTextKey(ownerLabel) ? "" : visibilityLabel;
  const compactLine = [ownerLabel, titleLabel].filter(Boolean).join(" · ");
  const compactLineWithTime = [compactLine || ownerLabel, timeRange].filter(Boolean).join(" · ");
  const tooltip = [ownerLabel, titleLabel || (isOwnBlock ? "No title" : "Busy"), timeRange].filter(Boolean).join(" · ");
  block.dataset.tooltip = tooltip;
  block.title = tooltip;

  const appendLine = (className, text) => {
    if (!text) return;
    const line = document.createElement("div");
    line.className = `busy-line ${className}`;
    line.textContent = text;
    block.appendChild(line);
  };

  if (durationClass === "event-15") {
    appendLine("busy-line-compact", compactLineWithTime);
  } else if (durationClass === "event-30") {
    appendLine("busy-line-owner", ownerLabel);
    appendLine("busy-line-title", titleLabel);
    appendLine("busy-line-time", timeRange);
  } else {
    appendLine("busy-line-owner", ownerLabel);
    appendLine("busy-line-title", titleLabel);
    appendLine("busy-line-time", timeRange);
  }

  block.addEventListener("click", (event) => {
    if (shouldSuppressCalendarClick(event)) return;
    openBusyDetail(segment);
  });
  return block;
}

function createBusyStack(segment, dayIndex) {
  const duration = segment.endHour - segment.startHour;
  const { sizeClass, durationClass } = eventCardMetrics(duration);
  const hasLaneOverlap = Number(segment.laneCount || 1) > 1;
  const isFifteen = durationClass === "event-15";
  const hasInvitedOverlap = segment.participants.some((participant) => (
    invitedEventOverlap(participant.participantId, segment.date, segment.startHour, segment.endHour)
  ));
  const stack = document.createElement("div");
  stack.className = `busy-stack ${hasLaneOverlap ? "busy-overlap-lane" : ""} ${hasInvitedOverlap ? "invited-overlap" : ""}`.trim();
  stack.style.setProperty("--day-index", dayIndex);
  stack.style.setProperty("--start", segment.startHour - calendarStartHour);
  stack.style.setProperty("--duration", duration);
  applyCalendarLanePosition(stack, dayIndex, segment.laneCount, segment.laneIndex);
  stack.dataset.stackId = segment.id;
  stack.classList.add(sizeClass, durationClass);
  stack.classList.toggle("opens-upward", busyStackOpensUpward(segment));

  const summary = document.createElement("button");
  summary.type = "button";
  summary.className = "busy-stack-summary busy-stack-trigger";
  summary.setAttribute("aria-haspopup", "dialog");
  summary.setAttribute("aria-expanded", "false");
  summary.setAttribute("aria-controls", `busy-stack-popover-${segment.id}`);

  const { namesLabel, extraLabel } = busyStackNameSummary(segment.participants);
  const countLabel = `${segment.participants.length} busy`;
  const compactSummary = duration < 1;
  stack.classList.toggle("compact", compactSummary);
  summary.innerHTML = isFifteen
    ? `
      <div class="busy-stack-summary-body busy-stack-summary-body--single">
        <strong class="busy-stack-summary-inline">${escapeHtml(countLabel)} · ${escapeHtml(formatTime(segment.startHour))} - ${escapeHtml(formatTime(segment.endHour))}</strong>
      </div>
      <div class="busy-stack-tabs"></div>
    `
    : `
      <div class="busy-stack-summary-body">
        <div class="busy-stack-summary-top">
          <strong>${escapeHtml(countLabel)}</strong>
          <span class="busy-time">${formatTime(segment.startHour)} - ${formatTime(segment.endHour)}</span>
        </div>
        <span class="busy-stack-names">${escapeHtml(namesLabel)}${escapeHtml(extraLabel)}</span>
      </div>
      <div class="busy-stack-tabs"></div>
    `;

  const tabWrap = summary.querySelector(".busy-stack-tabs");
  for (const participant of segment.participants.slice(0, 5)) {
    const tab = document.createElement("span");
    tab.className = "busy-stack-tab";
    tab.style.setProperty("--tab-color", participant.color);
    tab.setAttribute("aria-hidden", "true");
    tabWrap.appendChild(tab);
  }

  const popover = document.createElement("div");
  popover.className = "busy-stack-popover";
  popover.id = `busy-stack-popover-${segment.id}`;
  popover.setAttribute("role", "dialog");
  popover.setAttribute("aria-hidden", "true");
  popover.setAttribute("aria-label", `${countLabel} from ${formatTime(segment.startHour)} to ${formatTime(segment.endHour)}`);

  for (const [index, participant] of segment.participants.entries()) {
    const isOwnBlock = participant.participantId === currentParticipant?.id;
    const ownerLabel = participant.ownerName;
    const visibilityLabel = busyVisibilityLabel(participant, isOwnBlock);
    const participantStart = new Date(participant.start);
    const participantEnd = new Date(participant.end);
    const participantStartHour = participantStart.getHours() + participantStart.getMinutes() / 60;
    const participantEndHour = participantEnd.getHours() + participantEnd.getMinutes() / 60;
    const participantInvitedOverlap = invitedEventOverlapForRange(participant.participantId, participantStart, participantEnd);
    const participantTimeLabel = `${formatTime(participantStartHour)} - ${formatTime(participantEndHour)}`;
    const card = document.createElement("button");
    card.type = "button";
    card.className = `busy-stack-item ${participantInvitedOverlap ? "invited-overlap" : ""}`.trim();
    card.style.setProperty("--event-color", participant.color);
    card.style.setProperty("--stack-order", index);
    const itemTooltip = `${ownerLabel}\n${visibilityLabel}\n${participantTimeLabel}`;
    card.dataset.tooltip = itemTooltip;
    card.title = itemTooltip.replace(/\n/g, " · ");
    card.innerHTML = `
      <span class="busy-stack-item-accent" aria-hidden="true"></span>
      <div class="busy-stack-item-copy">
        <strong>${escapeHtml(ownerLabel)}</strong>
        <span class="busy-visibility">${escapeHtml(visibilityLabel)}</span>
        <span class="busy-time">${escapeHtml(participantTimeLabel)}</span>
      </div>
    `;
    card.addEventListener("click", (event) => {
      if (shouldSuppressCalendarClick(event)) return;
      event.stopPropagation();
      setBusyStackExpanded(stack, true);
      openBusyDetail(segment);
    });
    popover.appendChild(card);
  }

  summary.addEventListener("click", (event) => {
    if (shouldSuppressCalendarClick(event)) return;
    event.stopPropagation();
    const nextExpanded = !stack.classList.contains("expanded");
    closeExpandedBusyStacks(stack);
    setBusyStackExpanded(stack, nextExpanded);
    openBusyDetail(segment);
  });
  stack.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setBusyStackExpanded(stack, false);
      summary.focus();
      return;
    }
    if ((event.key === "Enter" || event.key === " ") && event.target === summary) {
      event.preventDefault();
      const nextExpanded = !stack.classList.contains("expanded");
      closeExpandedBusyStacks(stack);
      setBusyStackExpanded(stack, nextExpanded);
      openBusyDetail(segment);
    }
  });
  popover.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  stack.appendChild(summary);
  stack.appendChild(popover);
  if (expandedBusyStackId === segment.id) {
    setBusyStackExpanded(stack, true);
  }
  return stack;
}

function createEventBlock(item, dayIndex) {
  const block = document.createElement("button");
  block.type = "button";
  const duration = item.endHour - item.startHour;
  const { sizeClass, durationClass } = eventCardMetrics(duration);
  const laneCount = Math.max(1, Number(item.laneCount || 1));
  const laneIndex = Math.max(0, Number(item.laneIndex || 0));
  const laneSizeClass = laneCount > 1 ? `event-lanes-${Math.min(laneCount, 4)}` : "";
  block.className = [
    "event-card",
    sizeClass,
    durationClass,
    laneCount > 1 ? "event-overlap-lane" : "",
    laneSizeClass,
    item.isInvitee ? "invitee" : "",
    item.isInvitedViewer ? "is-invited-viewer" : ""
  ].filter(Boolean).join(" ");
  block.style.setProperty("--day-index", dayIndex);
  block.style.setProperty("--start", item.startHour - calendarStartHour);
  block.style.setProperty("--duration", duration);
  block.style.setProperty("--event-owner-color", item.participantColor);
  block.style.setProperty("--event-lane-count", laneCount);
  block.style.setProperty("--event-lane-index", laneIndex);
  applyCalendarLanePosition(block, dayIndex, laneCount, laneIndex);
  const timeRange = formatEventRange(item.startHour, item.endHour);
  const ownerLabel = item.participantName || "Someone";
  const tooltip = [ownerLabel, item.title, timeRange, item.location, item.summary].filter(Boolean).join("\n");
  block.dataset.tooltip = tooltip;
  block.title = tooltip;
  const titleText = item.title === "No title" ? "(No title)" : (item.title || "(No title)");
  const fifteenLine = [titleText, formatEventClock(item.startHour), item.location].filter(Boolean).join(", ");
  const compactMeta = [timeRange, item.location].filter(Boolean).join(" · ");

  const appendLine = (className, text) => {
    if (!text) return;
    const line = document.createElement("div");
    line.className = `event-line ${className}`;
    line.textContent = text;
    block.appendChild(line);
  };

  if (durationClass === "event-15") {
    appendLine("event-line-compact", fifteenLine);
  } else if (durationClass === "event-30") {
    appendLine("event-line-title", titleText);
    appendLine("event-line-meta", compactMeta);
  } else if (durationClass === "event-45") {
    appendLine("event-line-title", titleText);
    appendLine("event-line-meta", timeRange);
    appendLine("event-line-location", item.location || "");
  } else {
    appendLine("event-line-title", titleText);
    appendLine("event-line-meta", timeRange);
    appendLine("event-line-location", item.location || "");
  }

  block.addEventListener("click", (event) => {
    if (shouldSuppressCalendarClick(event)) return;
    openEventDetail(item.id);
  });
  return block;
}

function createFreeGlowBlock(segment, dayIndex) {
  const occupiedSegments = segment.occupiedSegments || [];
  const duration = segment.endHour - segment.startHour;
  const freeSizeClass = duration <= 0.25 ? "free-15" : duration <= 0.5 ? "free-30" : duration < 1 ? "free-45" : "free-long";
  const labelHeightHours = duration >= 2 ? 1.35 : duration >= 1 ? 0.82 : 0.42;
  const labelOverlap = occupiedSegments.some((item) => (
    item.endHour > segment.startHour && item.startHour < Math.min(segment.endHour, segment.startHour + labelHeightHours)
  ));
  const block = document.createElement("button");
  block.type = "button";
  block.className = ["free-glow-block", freeSizeClass, labelOverlap ? "free-glow-block--label-hidden" : ""].filter(Boolean).join(" ");
  block.style.setProperty("--day-index", dayIndex);
  block.style.setProperty("--start", segment.startHour - calendarStartHour);
  block.style.setProperty("--duration", duration);
  const coversVisibleDay = duration >= (calendarEndHour - calendarStartHour) - 0.001;
  const timeRange = coversVisibleDay ? "All day" : formatEventRange(segment.startHour, segment.endHour);
  block.dataset.tooltip = `${timeRange} free`;
  block.title = block.dataset.tooltip;
  if (duration >= 1 && !labelOverlap) {
    block.innerHTML = `<strong>Free</strong><span>${timeRange}</span>`;
  } else if (duration >= 0.5 && !labelOverlap) {
    block.innerHTML = `<span>${timeRange} free</span>`;
  }
  block.addEventListener("click", (event) => {
    if (shouldSuppressCalendarClick(event)) return;
    pendingEventPrefill = {
      date: dateKey(segment.date),
      startTime: formatInputTime(segment.startHour),
      endTime: formatInputTime(segment.endHour),
      inviteeParticipantIds: defaultInviteeIds()
    };
    openEventModal("create");
  });
  return block;
}

function plannerSupportsDragCreate() {
  return currentView === "day" || currentView === "week";
}

function isTouchPointer(event) {
  return event.pointerType === "touch" || window.matchMedia("(pointer: coarse)").matches;
}

function dragTargetIsBlocked(target) {
  if (target.closest(".event-card, .busy-card, .busy-stack-summary")) return false;
  return Boolean(target.closest(
    ".busy-stack-popover, .busy-stack-item, .color-picker-menu, .host-popover, .detail-panel, .modal-card, .vote-button, .chip-action, .icon-button, .add-event-button, input, textarea, select, summary, label"
  ));
}

function markCalendarClickSuppressed() {
  suppressCalendarClickUntil = Date.now() + 220;
}

function shouldSuppressCalendarClick(event) {
  if (Date.now() <= suppressCalendarClickUntil) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    return true;
  }
  return false;
}

function hourFromPointer(clientY) {
  const eventsLayer = calendarGrid.querySelector(".events-layer");
  if (!eventsLayer) return calendarStartHour;
  const rect = eventsLayer.getBoundingClientRect();
  const rowHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--row-height")) || 58;
  const offset = Math.min(Math.max(clientY - rect.top, 0), rect.height);
  return clampVisibleHour(snapQuarterHour(calendarStartHour + offset / rowHeight));
}

function dayIndexFromPointer(clientX) {
  const eventsLayer = calendarGrid.querySelector(".events-layer");
  if (!eventsLayer) return 0;
  const rect = eventsLayer.getBoundingClientRect();
  const dayCount = currentView === "day" ? 1 : 7;
  const relativeX = Math.min(Math.max(clientX - rect.left, 0), rect.width - 1);
  return Math.min(dayCount - 1, Math.max(0, Math.floor((relativeX / rect.width) * dayCount)));
}

function dateFromDayIndex(dayIndex) {
  if (currentView === "day") return startOfDay(currentFocusDate);
  const days = currentWeekDays();
  return days[Math.max(0, Math.min(days.length - 1, dayIndex))]?.date || startOfDay(currentFocusDate);
}

function dragSelection() {
  if (!dragCreateState) return null;
  return normalizedDragRange(dragCreateState.originHour, dragCreateState.currentHour, dragCreateState.defaultDurationHours || 1);
}

function dragSelectionRect() {
  if (!dragCreateState) return null;
  const selection = dragSelection();
  if (!selection) return null;
  const eventsLayer = calendarGrid.querySelector(".events-layer");
  if (!eventsLayer) return null;
  const rect = eventsLayer.getBoundingClientRect();
  const dayCount = currentView === "day" ? 1 : 7;
  const dayWidth = rect.width / dayCount;
  const rowHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--row-height")) || 58;
  const left = rect.left + dayWidth * dragCreateState.dayIndex + 8;
  const top = rect.top + (selection.startHour - calendarStartHour) * rowHeight + 8;
  const width = Math.max(dayWidth - 16, 120);
  const height = Math.max((selection.endHour - selection.startHour) * rowHeight - 12, 24);
  return { left, top, width, height };
}

function ensureDragPreview() {
  const eventsLayer = calendarGrid.querySelector(".events-layer");
  if (!eventsLayer || !dragCreateState) return;
  const selection = dragSelection();
  if (!selection) return;
  if (!dragPreviewNode) {
    dragPreviewNode = document.createElement("div");
    dragPreviewNode.className = "drag-create-preview";
  }
  dragPreviewNode.style.setProperty("--day-index", dragCreateState.dayIndex);
  dragPreviewNode.style.setProperty("--start", selection.startHour - calendarStartHour);
  dragPreviewNode.style.setProperty("--duration", selection.endHour - selection.startHour);
  dragPreviewNode.innerHTML = `
    <strong>${formatTime(selection.startHour)} - ${formatTime(selection.endHour)}</strong>
    <span>Create group event</span>
  `;
  if (!dragPreviewNode.isConnected) {
    eventsLayer.appendChild(dragPreviewNode);
  }
}

function scheduleDragPreviewUpdate() {
  if (dragPreviewFrame) return;
  dragPreviewFrame = window.requestAnimationFrame(() => {
    dragPreviewFrame = 0;
    ensureDragPreview();
  });
}

function clearDragPreview() {
  if (dragPreviewFrame) {
    window.cancelAnimationFrame(dragPreviewFrame);
    dragPreviewFrame = 0;
  }
  dragPreviewNode?.remove();
  dragPreviewNode = null;
}

function openDraggedEventComposer(anchorRect) {
  if (!dragCreateState) return;
  let selection = dragSelection();
  if (!selection) return;
  if (!dragCreateState.hasMoved || selectionDurationHours(selection) < 0.24) {
    selection = normalizedDragRange(dragCreateState.originHour, dragCreateState.originHour + 1, 1);
  }
  pendingEventPrefill = {
    date: dateKey(dragCreateState.date),
    startTime: formatInputTime(selection.startHour),
    endTime: formatInputTime(selection.endHour),
    inviteeParticipantIds: defaultInviteeIds(),
    title: "(No title)",
    location: "",
    description: ""
  };
  openEventModal("create", { anchorRect });
}

function stopDragCreate() {
  if (dragCreateState?.captureTarget?.hasPointerCapture?.(dragCreateState.pointerId)) {
    dragCreateState.captureTarget.releasePointerCapture(dragCreateState.pointerId);
  }
  window.removeEventListener("pointermove", handleDragCreateMove);
  window.removeEventListener("pointerup", handleDragCreateEnd);
  window.removeEventListener("pointercancel", handleDragCreateCancel);
  dragCreateState = null;
  clearDragPreview();
}

function suppressCalendarClickCapture(event) {
  if (!shouldSuppressCalendarClick(event)) return;
  event.stopImmediatePropagation?.();
}

function handleDragCreateMove(event) {
  if (!dragCreateState?.active || event.pointerId !== dragCreateState.pointerId) return;
  event.preventDefault();
  dragCreateState.currentHour = hourFromPointer(event.clientY);
  dragCreateState.dayIndex = dragCreateState.originDayIndex;
  dragCreateState.hasMoved = dragCreateState.hasMoved || Math.abs(dragCreateState.currentHour - dragCreateState.originHour) >= 0.24;
  scheduleDragPreviewUpdate();
}

function handleDragCreateCancel(event) {
  if (event && dragCreateState && event.pointerId !== dragCreateState.pointerId) return;
  markCalendarClickSuppressed();
  stopDragCreate();
}

function handleDragCreateEnd(event) {
  if (!dragCreateState?.active || event.pointerId !== dragCreateState.pointerId) return;
  event.preventDefault();
  dragCreateState.currentHour = hourFromPointer(event.clientY);
  dragCreateState.dayIndex = dragCreateState.originDayIndex;
  dragCreateState.hasMoved = dragCreateState.hasMoved || Math.abs(dragCreateState.currentHour - dragCreateState.originHour) >= 0.24;
  if (dragCreateState.originInteractiveTarget && !dragCreateState.hasMoved) {
    stopDragCreate();
    return;
  }
  const anchorRect = dragSelectionRect();
  const snapshot = { ...dragCreateState };
  markCalendarClickSuppressed();
  stopDragCreate();
  dragCreateState = snapshot;
  openDraggedEventComposer(anchorRect);
  dragCreateState = null;
}

function startDragCreate(event) {
  if (!plannerSupportsDragCreate()) return;
  if (event.button !== undefined && event.button !== 0) return;
  if (dragTargetIsBlocked(event.target)) return;
  if (dragCreateState?.active) return;
  closeExpandedBusyStacks();
  const eventsLayer = calendarGrid.querySelector(".events-layer");
  if (!eventsLayer) return;
  const rect = eventsLayer.getBoundingClientRect();
  if (event.clientY < rect.top || event.clientY > rect.bottom || event.clientX < rect.left || event.clientX > rect.right) return;

  const originHour = hourFromPointer(event.clientY);
  const originDayIndex = dayIndexFromPointer(event.clientX);
  const date = dateFromDayIndex(originDayIndex);
  const captureTarget = calendarGrid;
  const originInteractiveTarget = event.target.closest(".event-card, .busy-card, .busy-stack-summary");
  dragCreateState = {
    active: true,
    pointerId: event.pointerId,
    date,
    dayIndex: originDayIndex,
    originDayIndex,
    originHour,
    currentHour: clampVisibleHour(originHour + 1),
    defaultDurationHours: isTouchPointer(event) ? 1 : 1,
    hasMoved: false,
    originInteractiveTarget,
    captureTarget
  };
  captureTarget.setPointerCapture?.(event.pointerId);
  event.preventDefault();
  if (!originInteractiveTarget) ensureDragPreview();
  window.addEventListener("pointermove", handleDragCreateMove);
  window.addEventListener("pointerup", handleDragCreateEnd);
  window.addEventListener("pointercancel", handleDragCreateCancel);
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
    const isSelected = sameDate(day.date, currentFocusDate);
    header.className = `day-header ${sameDate(day.date, new Date()) ? "today" : ""} ${isSelected ? "selected" : ""}`.trim();
    if (isSelected) header.setAttribute("aria-current", "date");
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
      cell.dataset.dayIndex = String(days.indexOf(day));
      cell.dataset.dayKey = dateKey(day.date);
      cell.dataset.hour = String(hour);
      calendarGrid.appendChild(cell);
    }
  }

  const eventsLayer = document.createElement("div");
  eventsLayer.className = "events-layer";
  calendarGrid.appendChild(eventsLayer);

  days.forEach((day, dayIndex) => {
    const rawBusySegments = busySegmentsForDate(day.date);
    const rawEventBlocks = eventBlocksForDate(day.date);
    const laneItems = layoutEventLanes([
      ...rawBusySegments.map((segment) => ({ ...segment, laneKind: "busy" })),
      ...rawEventBlocks.map((eventBlock) => ({ ...eventBlock, laneKind: "event" }))
    ]);
    const dayBusySegments = laneItems.filter((item) => item.laneKind === "busy");
    const dayEventBlocks = laneItems.filter((item) => item.laneKind === "event");
    const occupiedSegments = occupiedSegmentsForDate(day.date, rawBusySegments, rawEventBlocks);

    for (const segment of freeSegmentsForDate(day.date, occupiedSegments)) {
      eventsLayer.appendChild(createFreeGlowBlock({ ...segment, occupiedSegments }, dayIndex));
    }

    for (const segment of dayBusySegments) {
      const node = segment.participants.length === 1
        ? createSingleBusyCard(segment, dayIndex)
        : createBusyStack(segment, dayIndex);
      eventsLayer.appendChild(node);
    }

    for (const eventBlock of dayEventBlocks) {
      eventsLayer.appendChild(createEventBlock(eventBlock, dayIndex));
    }
  });

  if (dragCreateState && dragCreateState.active) {
    ensureDragPreview();
  }
}

function renderMonth() {
  calendarGrid.innerHTML = "";
  calendarGrid.className = "calendar-grid month-view";

  const today = new Date();
  const monthStart = new Date(currentFocusDate.getFullYear(), currentFocusDate.getMonth(), 1);
  const gridStart = startOfWeek(monthStart);
  const busyByDate = new Map();
  const maxRows = monthEventRowLimit();

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
    const events = [...(data?.eventBlocks || [])]
      .sort((a, b) => a.startHour - b.startHour || a.endHour - b.endHour);
    const isFreeDay = !(data?.segments?.length) && !events.length;
    const cell = document.createElement("div");
    cell.className = ["month-cell", date.getMonth() !== monthStart.getMonth() ? "muted-month" : "", sameDate(date, today) ? "today" : "", sameDate(date, currentFocusDate) ? "selected" : ""].filter(Boolean).join(" ");
    cell.tabIndex = 0;
    cell.setAttribute("role", "button");
    if (isFreeDay) {
      cell.classList.add("free-day");
      cell.title = "Free day";
    }
    cell.innerHTML = `<span class="month-date-number">${date.getDate()}</span>`;
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

    const visibleLimit = Math.max(1, events.length > maxRows ? maxRows - 1 : maxRows);
    for (const eventBlock of events.slice(0, visibleLimit)) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "event-chip";
      chip.style.setProperty("--event-color", eventBlock.participantColor || participantPalette[0].value);
      chip.textContent = monthEventChipLabel(eventBlock);
      chip.title = `${formatTime(eventBlock.startHour)} - ${formatTime(eventBlock.endHour)} ${eventBlock.title}`;
      chip.addEventListener("click", (event) => {
        event.stopPropagation();
        openEventDetail(eventBlock.id);
      });
      cell.appendChild(chip);
    }

    const hiddenCount = Math.max(0, events.length - visibleLimit);
    if (hiddenCount) {
      const moreButton = document.createElement("button");
      moreButton.type = "button";
      moreButton.className = "month-more-button";
      moreButton.textContent = `+${hiddenCount} more`;
      moreButton.addEventListener("click", async (event) => {
        event.stopPropagation();
        await openDay();
      });
      cell.appendChild(moreButton);
    }

    calendarGrid.appendChild(cell);
  }
}

function monthEventRowLimit() {
  if (window.matchMedia?.("(max-width: 760px)").matches) return 2;
  if (window.matchMedia?.("(max-width: 1120px)").matches) return 3;
  return 4;
}

function monthEventChipLabel(eventBlock) {
  const title = String(eventBlock.title || "Busy").trim() || "Busy";
  const isAllDayLike = eventBlock.startHour <= calendarStartHour && eventBlock.endHour >= calendarEndHour;
  return isAllDayLike ? title : `${formatTime(eventBlock.startHour)} ${title}`;
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
      const node = document.createElement("button");
      node.type = "button";
      node.className = [
        "mini-day",
        date.getMonth() !== month ? "muted-month" : "",
        sameDate(date, today) ? "today" : "",
        sameDate(date, currentFocusDate) ? "selected" : ""
      ].filter(Boolean).join(" ");
      node.textContent = date.getDate();
      node.title = new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
      }).format(date);
      node.addEventListener("click", async () => {
        await goToDay(date);
      });
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
  const preserveEventDraft = Boolean(
    selectedEventId &&
    eventPanelForm &&
    !eventDetail.classList.contains("hidden") &&
    eventPanelHasUnsavedChanges()
  );
  updateViewButtons();
  updateCalendarPeriodControls();
  renderRoomMeta();
  renderRoomSwitcher();
  renderParticipants();
  refreshStatusLine();
  renderCalendar();
  if (selectedEventId) {
    if (!activeEvent()) {
      clearDetailPanel();
    } else if (preserveEventDraft) {
      updateEventPanelSaveState();
    } else {
      openEventDetail(selectedEventId);
    }
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

function replaceRoomRoute(code) {
  window.history.replaceState({}, "", roomRouteFor(code));
}

function resetRoomScopedState({ clearRoom = false } = {}) {
  selectedEventId = null;
  selectedBusyGroup = null;
  expandedBusyStackId = null;
  editingEventId = null;
  pendingEventPrefill = null;
  hiddenParticipantIds.clear();
  stopDragCreate();
  closeExpandedBusyStacks();

  if (eventModal?.open) {
    closeEventModal();
  }
  if (createRoomModal?.open) {
    closeCreateRoomModal();
  }
  clearDetailPanel();

  if (clearRoom) {
    currentRoom = null;
    currentParticipant = null;
    currentIsHost = false;
    googleBusy = [];
    topbarIdentity.innerHTML = "";
    participantStrip.innerHTML = "";
    calendarGrid.innerHTML = "";
  }
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

function notificationTone(type = "") {
  if (type === "room_join_request") return "join";
  if (type === "event_cancelled") return "cancelled";
  if (type === "event_comment") return "comment";
  return "event";
}

function notificationIcon(type = "") {
  if (type === "room_join_request") return "+";
  if (type === "event_cancelled") return "!";
  if (type === "event_comment") return "\"";
  if (type === "event_updated") return "~";
  return "•";
}

function notificationTimeLabel(notification = {}) {
  const start = notification.meta?.start;
  const end = notification.meta?.end;
  if (start && end) return formatDateTimeRange(start, end);
  if (notification.meta?.roomCode) return `Room code: ${notification.meta.roomCode}`;
  if (notification.createdAt) return formatSyncStamp(notification.createdAt);
  return "";
}

function stopNotificationDismissTimer(notificationId) {
  const timer = notificationDismissTimers.get(notificationId);
  if (!timer) return;
  window.clearTimeout(timer);
  notificationDismissTimers.delete(notificationId);
}

function scheduleNotificationDismiss(notificationId, delay = 7600) {
  stopNotificationDismissTimer(notificationId);
  const timer = window.setTimeout(() => {
    // Auto-hide is visual only. Unread notifications return after a reload until
    // the user explicitly dismisses or acts on them.
    removeNotificationCard(notificationId);
  }, delay);
  notificationDismissTimers.set(notificationId, timer);
}

function removeNotificationCard(notificationId) {
  stopNotificationDismissTimer(notificationId);
  const card = notificationStack?.querySelector(`[data-notification-id="${CSS.escape(notificationId)}"]`);
  if (!card) return;
  card.classList.add("is-leaving");
  window.setTimeout(() => {
    card.remove();
  }, 180);
}

async function patchNotification(notificationId, action) {
  if (!notificationId) return null;
  try {
    return await fetchJson(`/api/notifications/${notificationId}/${action}`, {
      method: "PATCH"
    });
  } catch {
    return null;
  }
}

async function dismissNotification(notificationId) {
  await patchNotification(notificationId, "dismiss");
  removeNotificationCard(notificationId);
}

async function markNotificationRead(notificationId) {
  await patchNotification(notificationId, "read");
}

function setNotificationSuccess(notificationId, text) {
  const card = notificationStack?.querySelector(`[data-notification-id="${CSS.escape(notificationId)}"]`);
  if (!card) return;
  const message = card.querySelector(".notification-message");
  if (message) message.textContent = text;
  card.classList.add("is-success");
}

function finishNotificationAction(notificationId, successText) {
  setNotificationSuccess(notificationId, successText);
  window.setTimeout(() => {
    dismissNotification(notificationId);
  }, 720);
}

async function openNotificationEvent(notification) {
  if (!notification?.roomCode || !notification.eventId) return;
  if (currentRoom?.code !== notification.roomCode) {
    await switchRoom(notification.roomCode);
  }
  const event = currentRoom?.events?.find((item) => item.id === notification.eventId);
  if (event) {
    openEventDetail(notification.eventId);
    await markNotificationRead(notification.id);
    return;
  }
  await dismissNotification(notification.id);
}

async function respondFromNotification(notification, response) {
  if (!notification?.roomCode || !notification.eventId) return;
  const data = await fetchJson(`/api/rooms/${notification.roomCode}/events/${notification.eventId}/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ response })
  });
  if (currentRoom?.code === notification.roomCode) {
    currentRoom.events = currentRoom.events.map((event) => event.id === notification.eventId ? data.event : event);
    if (selectedEventId === notification.eventId) {
      openEventDetail(notification.eventId);
    }
    render();
  }
  finishNotificationAction(notification.id, "Response saved");
}

async function actOnJoinNotification(notification, status) {
  if (!notification?.roomCode || !notification.requestId) return;
  const action = status === "approved" ? "approve" : "decline";
  const data = await fetchJson(`/api/rooms/${notification.roomCode}/join-requests/${notification.requestId}/${action}`, {
    method: "POST"
  });
  if (currentRoom?.code === notification.roomCode) {
    currentRoom = data.room;
    currentParticipant = data.participant;
    currentIsHost = Boolean(data.isHost);
    await refreshMyRooms();
    render();
  }
  finishNotificationAction(notification.id, status === "approved" ? "Request approved" : "Request declined");
}

async function viewJoinNotification(notification) {
  if (!notification?.roomCode) return;
  if (currentRoom?.code !== notification.roomCode) {
    await switchRoom(notification.roomCode);
  }
  hostPopover?.classList.remove("hidden");
  joinRequestQueue?.scrollIntoView({ block: "nearest" });
  await markNotificationRead(notification.id);
}

function addNotificationAction(actions, label, onClick, className = "secondary") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `notification-action ${className}`.trim();
  button.textContent = label;
  button.addEventListener("click", async (event) => {
    event.stopPropagation();
    button.disabled = true;
    try {
      await onClick();
    } catch (error) {
      button.disabled = false;
      calendarStatus.textContent = error.message;
    }
  });
  actions.appendChild(button);
}

function createNotificationCard(notification) {
  const card = document.createElement("article");
  card.className = `notification-card notification-${notificationTone(notification.type)}`;
  card.dataset.notificationId = notification.id;
  card.tabIndex = 0;
  card.setAttribute("aria-label", `${notification.title}. ${notification.message}`);

  const icon = document.createElement("div");
  icon.className = "notification-icon";
  icon.textContent = notificationIcon(notification.type);

  const body = document.createElement("div");
  body.className = "notification-body";

  const title = document.createElement("strong");
  title.className = "notification-title";
  title.textContent = notification.title || "Notification";

  const message = document.createElement("p");
  message.className = "notification-message";
  message.textContent = notification.message || "";

  const meta = document.createElement("span");
  meta.className = "notification-meta";
  meta.textContent = notificationTimeLabel(notification);

  const actions = document.createElement("div");
  actions.className = "notification-actions";

  if (notification.type === "event_invite" || notification.type === "event_updated") {
    addNotificationAction(actions, "Yes", () => respondFromNotification(notification, "yes"), "primary");
    addNotificationAction(actions, "Maybe", () => respondFromNotification(notification, "maybe"));
    addNotificationAction(actions, "No", () => respondFromNotification(notification, "no"));
    addNotificationAction(actions, "View", () => openNotificationEvent(notification));
  } else if (notification.type === "event_comment") {
    addNotificationAction(actions, "View", () => openNotificationEvent(notification), "primary");
  } else if (notification.type === "room_join_request") {
    addNotificationAction(actions, "Approve", () => actOnJoinNotification(notification, "approved"), "primary");
    addNotificationAction(actions, "Decline", () => actOnJoinNotification(notification, "denied"));
    addNotificationAction(actions, "View", () => viewJoinNotification(notification));
  }

  body.append(title, message);
  if (meta.textContent) body.appendChild(meta);
  if (actions.children.length) body.appendChild(actions);

  const dismissButton = document.createElement("button");
  dismissButton.className = "notification-dismiss";
  dismissButton.type = "button";
  dismissButton.setAttribute("aria-label", "Dismiss notification");
  dismissButton.textContent = "×";
  dismissButton.addEventListener("click", (event) => {
    event.stopPropagation();
    dismissNotification(notification.id);
  });

  card.addEventListener("mouseenter", () => stopNotificationDismissTimer(notification.id));
  card.addEventListener("mouseleave", () => scheduleNotificationDismiss(notification.id));
  card.addEventListener("focusin", () => stopNotificationDismissTimer(notification.id));
  card.addEventListener("focusout", (event) => {
    if (card.contains(event.relatedTarget)) return;
    scheduleNotificationDismiss(notification.id);
  });
  card.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      dismissNotification(notification.id);
    }
  });

  card.append(icon, body, dismissButton);
  return card;
}

function showNotification(notification) {
  if (!notificationStack || !notification?.id || displayedNotificationIds.has(notification.id)) return;
  displayedNotificationIds.add(notification.id);
  const card = createNotificationCard(notification);
  notificationStack.prepend(card);
  scheduleNotificationDismiss(notification.id);

  while (notificationStack.children.length > 4) {
    const last = notificationStack.lastElementChild;
    if (!last) break;
    stopNotificationDismissTimer(last.dataset.notificationId);
    last.remove();
  }
}

async function fetchNotifications() {
  if (!notificationStack) return;
  try {
    const data = await fetchJson("/api/notifications");
    const notifications = Array.isArray(data.notifications) ? data.notifications : [];
    for (const notification of notifications.slice().reverse()) {
      if (notification.read || notification.dismissed) continue;
      showNotification(notification);
    }
  } catch {
    // Notifications should never block the main calendar experience.
  }
}

function startNotificationPolling() {
  if (notificationPollTimer) return;
  fetchNotifications();
  notificationPollTimer = window.setInterval(fetchNotifications, 20000);
}

async function refreshMyRooms({ signal } = {}) {
  try {
    const data = await fetchJson("/api/my-rooms", { signal });
    myRooms = Array.isArray(data.rooms) ? data.rooms : [];
    sessionInfo = {
      ...sessionInfo,
      roomCode: data.activeRoomCode || currentRoom?.code || sessionInfo?.roomCode || null
    };
  } catch (error) {
    if (isAbortError(error)) throw error;
    myRooms = currentRoom ? [currentRoomSwitcherSummary()].filter(Boolean) : [];
  }
  renderRoomSwitcher();
}

async function switchRoom(code) {
  const nextCode = normalizeRoomCodeInput(code);
  if (!nextCode || nextCode === currentRoom?.code) return;

  window.clearInterval(refreshTimer);
  abortRoomDataRequests();
  resetRoomScopedState({ clearRoom: true });
  sessionInfo = { ...sessionInfo, roomCode: nextCode };
  pushRoomRoute(nextCode);
  showRoom();
  calendarStatus.textContent = "Switching room...";

  try {
    await refreshRoomData();
    startAutoRefresh();
  } catch (error) {
    if (isAbortError(error)) return;
    calendarStatus.textContent = error.message;
  }
}

async function enterRoomFromResponse(data, { replaceRoute = false } = {}) {
  if (!data?.room?.code) return;

  window.clearInterval(refreshTimer);
  abortRoomDataRequests();
  resetRoomScopedState({ clearRoom: true });
  if (replaceRoute) {
    replaceRoomRoute(data.room.code);
  } else {
    pushRoomRoute(data.room.code);
  }
  currentRoom = data.room;
  currentParticipant = data.participant;
  currentIsHost = Boolean(data.isHost);
  sessionInfo = {
    ...sessionInfo,
    roomCode: data.room.code
  };
  loadHiddenParticipantIds(data.room.code);
  googleBusy = [];
  showRoom();
  await loadConfigAndSession();
  await loadFreeBusy();
  await refreshMyRooms();
  render();
  startAutoRefresh();
}

function shouldIgnoreUndoShortcut(target) {
  return shouldIgnoreViewShortcut(target) ||
    Boolean(eventModal?.open || createRoomModal?.open);
}

function pushUndoCreateEvent(eventId) {
  if (!eventId || !currentRoom?.code) return;
  undoStack.push({
    type: "create-event",
    roomCode: currentRoom.code,
    eventId,
    participantId: currentParticipant?.id || null
  });
  undoStack = undoStack.slice(-30);
}

function removeEventFromUndoStack(eventId, roomCode = currentRoom?.code) {
  undoStack = undoStack.filter((item) => !(
    item.type === "create-event" &&
    item.eventId === eventId &&
    item.roomCode === roomCode
  ));
}

async function undoLastEventCreation() {
  if (!currentRoom?.code) return;
  let undoIndex = -1;
  for (let index = undoStack.length - 1; index >= 0; index -= 1) {
    const item = undoStack[index];
    if (
      item.type === "create-event" &&
      item.roomCode === currentRoom.code &&
      (!item.participantId || item.participantId === currentParticipant?.id)
    ) {
      undoIndex = index;
      break;
    }
  }
  if (undoIndex === -1) {
    calendarStatus.textContent = "Nothing to undo.";
    return;
  }

  const [undoItem] = undoStack.splice(undoIndex, 1);
  const stillExists = currentRoom.events?.some((event) => event.id === undoItem.eventId);
  if (!stillExists) {
    calendarStatus.textContent = "Event already gone.";
    render();
    return;
  }

  try {
    await fetchJson(`/api/rooms/${currentRoom.code}/events/${undoItem.eventId}`, { method: "DELETE" });
    if (selectedEventId === undoItem.eventId) {
      clearDetailPanel();
    }
    await refreshRoomData();
    calendarStatus.textContent = "Event undone.";
  } catch (error) {
    if (/not found/i.test(error.message)) {
      await refreshRoomData();
      calendarStatus.textContent = "Event already gone.";
      return;
    }
    undoStack.splice(Math.min(undoIndex, undoStack.length), 0, undoItem);
    calendarStatus.textContent = error.message;
  }
}

async function loadConfigAndSession({ signal } = {}) {
  const [config, me] = await Promise.all([
    fetchJson("/api/config", { signal }),
    fetchJson("/api/me", { signal })
  ]);
  appConfig = config;
  sessionInfo = me;
}

async function loadRoom(code, { signal, generation } = {}) {
  const normalizedCode = normalizeRoomCodeInput(code);
  const data = await fetchJson(`/api/rooms/${normalizedCode}`, { signal });
  if (signal?.aborted || (generation !== undefined && generation !== roomDataGeneration) || routeRoomCode() !== normalizedCode) return false;
  currentRoom = data.room;
  currentParticipant = data.participant;
  currentIsHost = Boolean(data.isHost);
  sessionInfo.roomCode = currentRoom.code;
  loadHiddenParticipantIds(currentRoom.code);
  return true;
}

async function loadFreeBusy() {
  if (!currentRoom) return;
  if (currentView === "year") {
    freeBusyController?.abort();
    googleBusy = [];
    return true;
  }
  const generation = ++freeBusyGeneration;
  freeBusyController?.abort();
  const controller = new AbortController();
  freeBusyController = controller;
  const roomCodeSnapshot = currentRoom.code;
  const range = visibleRange();
  const rangeKey = `${range.start.toISOString()}::${range.end.toISOString()}`;
  const params = new URLSearchParams({
    timeMin: range.start.toISOString(),
    timeMax: range.end.toISOString()
  });
  let data;
  try {
    data = await fetchJson(`/api/rooms/${roomCodeSnapshot}/freebusy?${params.toString()}`, { signal: controller.signal });
  } catch (error) {
    if (isAbortError(error)) return false;
    throw error;
  } finally {
    if (freeBusyController === controller) freeBusyController = null;
  }
  const latestRange = visibleRange();
  const latestRangeKey = `${latestRange.start.toISOString()}::${latestRange.end.toISOString()}`;
  if (generation !== freeBusyGeneration || currentRoom?.code !== roomCodeSnapshot || latestRangeKey !== rangeKey) return false;
  googleBusy = normalizeBusyBlocks(data.busy || []);

  for (const incoming of data.participants || []) {
    const participant = participantById(incoming.id);
    if (participant) {
      participant.connected = incoming.connected;
      participant.needsReconnect = incoming.needsReconnect;
      participant.syncStatus = incoming.syncStatus;
      participant.lastSyncedAt = incoming.lastSyncedAt;
      participant.lastSyncError = incoming.lastSyncError;
      participant.lastCalendarName = incoming.lastCalendarName;
    }
  }
  currentParticipant = participantById(currentParticipant?.id) || currentParticipant;
  return true;
}

async function refreshRoomData() {
  const code = routeRoomCode();
  if (!code) return;
  const generation = ++roomDataGeneration;
  roomDataController?.abort();
  const controller = new AbortController();
  roomDataController = controller;
  try {
    await loadConfigAndSession({ signal: controller.signal });
    if (generation !== roomDataGeneration || routeRoomCode() !== code) return false;
    const loaded = await loadRoom(code, { signal: controller.signal, generation });
    if (!loaded) return false;
    await loadFreeBusy();
    if (generation !== roomDataGeneration || routeRoomCode() !== code) return false;
    await refreshMyRooms({ signal: controller.signal });
    if (generation !== roomDataGeneration || routeRoomCode() !== code) return false;
    render();
    fetchNotifications();
    return true;
  } catch (error) {
    if (isAbortError(error)) return false;
    throw error;
  } finally {
    if (roomDataController === controller) roomDataController = null;
  }
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
    const roomNameValue = String(createRoomName?.value || "").trim();
    const data = await fetchJson("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: roomNameValue,
        emoji: normalizeRoomEmoji(createRoomEmoji?.value)
      })
    });

    if (currentUserConnected()) {
      await enterRoomFromResponse(data);
      createRoomForm?.reset();
      return;
    }

    pendingEntryMode = "host";
    pendingEntryRoomCode = data.room.code;
    pendingHostRoomState = {
      room: data.room,
      participant: data.participant,
      isHost: true
    };
    entryChoiceLead.textContent = `Room ${data.room.code} is ready. Sync Google Calendar to add your live availability automatically, or continue as a guest for now.`;
    showEntryChoice();
  } catch (error) {
    setStatus(homeStatus, error.message, "warn");
  }
}

async function openRoomEntryPage() {
  window.clearInterval(refreshTimer);
  abortRoomDataRequests();
  resetRoomScopedState({ clearRoom: true });
  sessionInfo = { ...sessionInfo, roomCode: null };
  window.history.pushState({}, "", "/?newRoom=1");
  showHome();
  try {
    await loadConfigAndSession();
    await refreshMyRooms();
    if (sessionInfo?.connected) {
      setStatus(homeStatus, "Create a new room or enter a code to join another one.", "connected");
    } else {
      homeStatus.textContent = "Create a room or enter a code to get started.";
    }
  } catch {
    homeStatus.textContent = "Create a room or enter a code to get started.";
  }
}

function openCreateRoomModal() {
  if (!createRoomModal) return;
  createRoomModalForm?.reset();
  createRoomModal.showModal();
  quickRoomNameInput?.focus();
}

function closeCreateRoomModal() {
  if (createRoomModal?.open) createRoomModal.close();
}

async function createRoomFromSwitcher(event) {
  event.preventDefault();
  try {
    const roomNameValue = String(quickRoomNameInput?.value || "").trim();
    const data = await fetchJson("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: roomNameValue || "Untitled room",
        emoji: normalizeRoomEmoji(quickRoomEmojiInput?.value)
      })
    });

    closeCreateRoomModal();
    await enterRoomFromResponse(data);
  } catch (error) {
    calendarStatus.textContent = error.message;
  }
}

async function joinRoom(event) {
  event.preventDefault();
  const code = normalizeRoomCodeInput(joinRoomCode.value);
  if (code.length !== 6) {
    setStatus(homeStatus, "Enter the six-character room code.", "warn");
    return;
  }

  pendingEntryRoomCode = code;
  pendingEntryMode = "join";
  pendingHostRoomState = null;

  if (currentUserConnected()) {
    await joinRoomAsGuest(code);
    return;
  }

  entryChoiceLead.textContent = `Room ${code} is ready. Join now as a guest, or sync Google Calendar to add your live availability automatically.`;
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
      await refreshMyRooms();
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

    if (data.requested) {
      pendingEntryRoomCode = null;
      pendingEntryMode = null;
      pendingHostRoomState = null;
      showHome();
      setStatus(homeStatus, data.message || "Join request sent to the host.", "connected");
      return;
    }

    await enterRoomFromResponse(data);
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

async function saveRoomEmoji() {
  if (!currentRoom || !renameRoomEmojiInput || !currentIsHost) return;
  const emoji = normalizeRoomEmoji(renameRoomEmojiInput.value);
  if (emoji === (currentRoom.emoji || defaultRoomEmoji)) return;
  try {
    const data = await fetchJson(`/api/rooms/${currentRoom.code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji })
    });
    currentRoom = data.room;
    currentParticipant = data.participant;
    currentIsHost = Boolean(data.isHost);
    await refreshMyRooms();
    render();
  } catch (error) {
    renameRoomEmojiInput.value = currentRoom.emoji || defaultRoomEmoji;
    calendarStatus.textContent = error.message;
  }
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
    await refreshMyRooms();
    render();
  } catch (error) {
    calendarStatus.textContent = error.message;
  }
}

async function saveRoomCode() {
  if (!currentRoom) return;
  const code = normalizeCustomRoomCodeInput(customRoomCodeInput?.value || "");
  if (code === currentRoom.code) return;
  if (code.length !== 6) {
    calendarStatus.textContent = "Room codes must use exactly six letters or numbers.";
    return;
  }

  try {
    const data = await fetchJson(`/api/rooms/${currentRoom.code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });
    currentRoom = data.room;
    currentParticipant = data.participant;
    currentIsHost = Boolean(data.isHost);
    pushRoomRoute(currentRoom.code);
    sessionInfo.roomCode = currentRoom.code;
    calendarStatus.textContent = "Room code updated.";
    await refreshMyRooms();
    render();
  } catch (error) {
    calendarStatus.textContent = error.message;
  }
}

async function saveRoomLockState() {
  if (!currentRoom || !roomLockToggle) return;
  const locked = Boolean(roomLockToggle.checked);
  if (locked === Boolean(currentRoom.accessLocked)) return;

  try {
    const data = await fetchJson(`/api/rooms/${currentRoom.code}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locked })
    });
    currentRoom = data.room;
    currentParticipant = data.participant;
    currentIsHost = Boolean(data.isHost);
    calendarStatus.textContent = locked ? "Room locked." : "Room unlocked.";
    render();
  } catch (error) {
    if (roomLockToggle) roomLockToggle.checked = Boolean(currentRoom?.accessLocked);
    calendarStatus.textContent = error.message;
  }
}

async function updateJoinRequest(requestId, status) {
  if (!currentRoom) return;
  try {
    const data = await fetchJson(`/api/rooms/${currentRoom.code}/join-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    currentRoom = data.room;
    currentParticipant = data.participant;
    currentIsHost = Boolean(data.isHost);
    calendarStatus.textContent = status === "approved" ? "Join request approved." : "Join request denied.";
    render();
    fetchNotifications();
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
    await refreshMyRooms();
    window.history.pushState({}, "", "/");
    showHome();
    setStatus(homeStatus, "Room deleted.");
  } catch (error) {
    calendarStatus.textContent = error.message;
  }
}

async function removeParticipant(participantId) {
  if (!currentRoom) return;
  const participant = participantById(participantId);
  const confirmed = window.confirm(`Remove ${participant?.displayName || "this participant"} from ${currentRoom.name || "this room"}?`);
  if (!confirmed) return;
  try {
    const data = await fetchJson(`/api/rooms/${currentRoom.code}/participants/${participantId}`, {
      method: "DELETE"
    });
    currentRoom = data.room;
    currentParticipant = data.participant;
    currentIsHost = Boolean(data.isHost);
    await refreshMyRooms();
    render();
  } catch (error) {
    calendarStatus.textContent = error.message;
  }
}

function positionEventModal() {
  if (!eventModal?.classList.contains("anchored-composer") || !eventModalAnchorRect) return;
  const card = eventModal.querySelector(".modal-card");
  if (!card) return;

  const width = Math.min(440, window.innerWidth - 20);
  const height = Math.min(card.offsetHeight || 520, window.innerHeight - 24);
  let left = eventModalAnchorRect.left;
  let top = eventModalAnchorRect.top;

  if (left + width > window.innerWidth - 12) {
    left = window.innerWidth - width - 12;
  }
  if (top + height > window.innerHeight - 12) {
    top = Math.max(12, eventModalAnchorRect.top + eventModalAnchorRect.height - height);
  }

  eventModal.style.setProperty("--composer-left", `${Math.max(12, left)}px`);
  eventModal.style.setProperty("--composer-top", `${Math.max(12, top)}px`);
}

function updateEventGoogleSyncControl() {
  if (!eventGoogleSyncInput || !eventGoogleSyncStatus) return;
  const connected = currentUserConnected() && currentParticipantConnected();
  const googleWriteReady = calendarWriteReady();
  eventGoogleSyncInput.disabled = !connected || !googleWriteReady;

  if (!connected) {
    eventGoogleSyncStatus.textContent = "Connect Google Calendar first.";
  } else if (!googleWriteReady) {
    eventGoogleSyncStatus.textContent = "Enable Google event sync in Settings to grant event-only access.";
  } else if (eventGoogleSyncInput.checked) {
    eventGoogleSyncStatus.textContent = "Adds this event to your Google Calendar.";
  } else {
    eventGoogleSyncStatus.textContent = "Keeps this event in CommonGround only.";
  }
}

function attemptCloseEventModal() {
  if (eventFormHasUnsavedChanges()) {
    const discard = window.confirm("Discard this event draft?");
    if (!discard) return false;
  }
  closeEventModal();
  return true;
}

function openEventModal(mode = "create", options = {}) {
  editingEventId = mode === "edit" ? selectedEventId : null;
  if (eventModalLabel) eventModalLabel.textContent = mode === "edit" ? "Edit group event" : "Add group event";
  if (eventModalTitle) eventModalTitle.textContent = mode === "edit" ? "Update proposal" : pendingEventPrefill ? "Create group event" : "Create proposal";
  saveEventButton.textContent = mode === "edit" ? "Save changes" : "Create event";
  setEventFormFeedback();
  setEventFormSaving(false);
  eventModalAnchorRect = options.anchorRect || null;
  eventModal.classList.toggle("anchored-composer", Boolean(eventModalAnchorRect));

  if (mode === "edit" && activeEvent()) {
    const event = activeEvent();
    const start = new Date(event.start);
    const end = new Date(event.end);
    const allDayRange = typeof event.allDay === "boolean" ? event.allDay : isWholeDayRange(start, end);
    eventTitleInput.value = event.title;
    eventDateInput.value = dateKey(start);
    eventEndDateInput.value = dateKey(allDayRange ? addDays(end, -1) : end);
    eventStartInput.value = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
    eventEndInput.value = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
    setAllDayMode(allDayRange);
    eventLocationInput.value = event.location || "";
    eventDescriptionInput.value = event.description || "";
    if (eventGoogleSyncInput) eventGoogleSyncInput.checked = event.syncToGoogle !== false;
    renderInviteePicker(event.invitees?.map((invitee) => invitee.participantId) || [], {
      lockedParticipantIds: [event.createdByParticipantId].filter(Boolean),
      creatorParticipantId: event.createdByParticipantId
    });
  } else {
    eventForm.reset();
    setAllDayMode(false);
    if (eventGoogleSyncInput) eventGoogleSyncInput.checked = calendarEventSyncEnabled();
    if (pendingEventPrefill) {
      eventTitleInput.value = pendingEventPrefill.title || "(No title)";
      eventDateInput.value = pendingEventPrefill.date;
      eventEndDateInput.value = pendingEventPrefill.date;
      eventStartInput.value = pendingEventPrefill.startTime;
      eventEndInput.value = pendingEventPrefill.endTime;
      eventLocationInput.value = pendingEventPrefill.location || "";
      eventDescriptionInput.value = pendingEventPrefill.description || "";
      renderInviteePicker(pendingEventPrefill.inviteeParticipantIds || defaultInviteeIds(), {
        lockedParticipantIds: defaultInviteeIds()
      });
    } else {
      const nextHour = new Date();
      nextHour.setMinutes(0, 0, 0);
      nextHour.setHours(Math.max(calendarStartHour + 2, nextHour.getHours() + 1));
      const endHour = new Date(nextHour);
      endHour.setHours(nextHour.getHours() + 1);
      eventTitleInput.value = "(No title)";
      eventDateInput.value = dateKey(nextHour);
      eventEndDateInput.value = dateKey(nextHour);
      eventStartInput.value = formatInputTime(nextHour.getHours() + nextHour.getMinutes() / 60);
      eventEndInput.value = formatInputTime(endHour.getHours() + endHour.getMinutes() / 60);
      renderInviteePicker(defaultInviteeIds(), {
        lockedParticipantIds: defaultInviteeIds()
      });
    }
  }

  updateEventGoogleSyncControl();
  eventModal.showModal();
  eventModalInitialState = eventFormStateSnapshot();
  requestAnimationFrame(positionEventModal);
  pendingEventPrefill = null;
}

function closeEventModal() {
  stopDragCreate();
  eventModal.close();
  editingEventId = null;
  pendingEventPrefill = null;
  eventModalInitialState = "";
  eventModalAnchorRect = null;
  eventModal.classList.remove("anchored-composer");
  setEventFormFeedback();
}

async function saveEvent(event) {
  event.preventDefault();
  if (!currentRoom || eventForm.dataset.saving === "true") return;
  setEventFormFeedback();

  const date = eventDateInput.value;
  const allDay = Boolean(eventAllDayInput?.checked);
  const start = allDay ? new Date(`${date}T00:00`) : new Date(`${date}T${eventStartInput.value}`);
  const endDate = allDay ? (eventEndDateInput?.value || date) : date;
  const end = allDay ? new Date(`${endDate}T00:00`) : new Date(`${date}T${eventEndInput.value}`);
  if (allDay && !Number.isNaN(end.getTime())) {
    end.setDate(end.getDate() + 1);
  }
  if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start && eventEndInput.value === "00:00") {
    end.setDate(end.getDate() + 1);
  }
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    calendarStatus.textContent = "Pick a valid event time.";
    setEventFormFeedback("Pick a valid event time.", "error");
    return;
  }
  const payload = {
    title: eventTitleInput.value.trim() || "(No title)",
    start: start.toISOString(),
    end: end.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    allDay,
    location: eventLocationInput.value.trim(),
    description: eventDescriptionInput.value.trim(),
    syncToGoogle: Boolean(eventGoogleSyncInput?.checked),
    inviteeParticipantIds: [...inviteePicker.querySelectorAll("input:checked")].map((input) => input.value)
  };

  setEventFormSaving(true);
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
      selectedEventId = null;
      selectedBusyGroup = null;
      pushUndoCreateEvent(data.event.id);
    }

    closeEventModal();
    render();
    fetchNotifications();
  } catch (error) {
    calendarStatus.textContent = error.message;
    setEventFormFeedback(error.message || "The event could not be created. Try again.", "error");
  } finally {
    setEventFormSaving(false);
  }
}

async function saveEventPanelChanges(event) {
  event.preventDefault();
  if (!currentRoom || !selectedEventId || !eventPanelForm) return;
  if (eventPanelForm.dataset.canManage !== "true") return;

  const preserveOriginalRange = eventPanelForm.dataset.preserveOriginalRange === "true";
  const date = detailDateInput.value;
  const start = preserveOriginalRange
    ? new Date(eventPanelForm.dataset.originalStart)
    : new Date(`${date}T${detailStartInput.value}`);
  const end = preserveOriginalRange
    ? new Date(eventPanelForm.dataset.originalEnd)
    : new Date(`${date}T${detailEndInput.value}`);
  if (!preserveOriginalRange && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start && detailEndInput.value === "00:00") {
    end.setDate(end.getDate() + 1);
  }
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    calendarStatus.textContent = "Pick a valid event time.";
    return;
  }

  const eventEntry = activeEvent();
  const payload = {
    title: detailTitleInput.value.trim() || "(No title)",
    start: start.toISOString(),
    end: end.toISOString(),
    timezone: eventEntry?.timezone || eventPanelForm.dataset.originalTimezone || "UTC",
    allDay: typeof eventEntry?.allDay === "boolean"
      ? eventEntry.allDay
      : eventPanelForm.dataset.originalAllDay === "true",
    location: detailLocationInput.value.trim(),
    description: detailDescriptionInput.value.trim(),
    syncToGoogle: Boolean(detailGoogleSyncInput?.checked),
    inviteeParticipantIds: eventPanelSelectedInviteeIds()
  };

  try {
    if (saveEventChangesButton) saveEventChangesButton.disabled = true;
    const data = await fetchJson(`/api/rooms/${currentRoom.code}/events/${selectedEventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    currentRoom.events = currentRoom.events.map((item) => item.id === selectedEventId ? data.event : item);
    eventPanelInitialState = eventPanelStateSnapshot();
    render();
    if (detailInviteeFeedback) {
      detailInviteeFeedback.dataset.persistedMessage = "Changes saved";
      detailInviteeFeedback.textContent = "Changes saved";
      window.setTimeout(() => {
        if (detailInviteeFeedback?.dataset.persistedMessage === "Changes saved") {
          detailInviteeFeedback.dataset.persistedMessage = "";
          detailInviteeFeedback.textContent = "";
        }
      }, 1800);
    }
    fetchNotifications();
  } catch (error) {
    calendarStatus.textContent = error.message;
    updateEventPanelSaveState();
  }
}

async function deleteEvent() {
  if (!currentRoom || !selectedEventId) return;

  try {
    await fetchJson(`/api/rooms/${currentRoom.code}/events/${selectedEventId}`, { method: "DELETE" });
    removeEventFromUndoStack(selectedEventId);
    currentRoom.events = currentRoom.events.filter((event) => event.id !== selectedEventId);
    clearDetailPanel();
    render();
    fetchNotifications();
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
    fetchNotifications();
  } catch (error) {
    calendarStatus.textContent = error.message;
  }
}

function enableDialogBackdropClose(dialog, closeHandler) {
  if (!dialog) return;
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    closeHandler();
  });
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
    fetchNotifications();
  } catch (error) {
    calendarStatus.textContent = error.message;
  }
}

function downloadIcs() {
  if (!currentRoom || !selectedEventId) return;
  window.location.href = `/api/rooms/${currentRoom.code}/events/${selectedEventId}/ics`;
}

function maybeRestoreTheme() {
  const storedTheme = localStorage.getItem("cg-theme") || "dark";
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
    await refreshMyRooms();
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
  window.clearInterval(refreshTimer);
  abortRoomDataRequests();
  resetRoomScopedState({ clearRoom: true });
  await loadConfigAndSession();
  await refreshMyRooms();
  const requestFlag = new URL(window.location.href).searchParams.get("request");
  if (requestFlag === "sent") {
    showHome();
    setStatus(homeStatus, "Join request sent to the host. You can come back once they approve you.", "connected");
    window.history.replaceState({}, "", "/?newRoom=1");
    return;
  }

  if (!roomEntryRequested() && myRooms.length) {
    const preferredRoomCode = normalizeRoomCodeInput(sessionInfo?.roomCode || "");
    const nextRoomCode = myRooms.some((room) => room.code === preferredRoomCode) ? preferredRoomCode : myRooms[0]?.code;
    if (nextRoomCode) {
      replaceRoomRoute(nextRoomCode);
      await bootRoom();
      return;
    }
  }

  showHome();
  if (sessionInfo?.connected) {
    setStatus(homeStatus, `Calendar connected as ${sessionInfo.user?.displayName || sessionInfo.user?.name || "you"}. Create a new room or enter a code to join another one.`, "connected");
  } else if (appConfig?.googleReady) {
    homeStatus.textContent = "Create a room or enter a code to get started.";
  } else {
    setStatus(homeStatus, "Calendar credentials are not configured yet.", "warn");
  }
}

async function bootRoom() {
  showRoom();
  await refreshRoomData();
  startAutoRefresh();
}

async function boot() {
  maybeRestoreTheme();
  startNotificationPolling();
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
joinRoomCode?.addEventListener("input", () => {
  joinRoomCode.value = normalizeRoomCodeInput(joinRoomCode.value);
});
choiceConnectButton.addEventListener("click", () => {
  if (!pendingEntryRoomCode) return;
  window.location.href = googleAuthUrl(pendingEntryRoomCode);
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
  window.location.href = googleAuthUrl(currentRoom.code);
});
settingsReconnectButton.addEventListener("click", () => {
  if (!currentRoom?.code) return;
  window.location.href = googleAuthUrl(currentRoom.code, {
    calendarWrite: settingsReconnectButton.dataset.calendarWrite === "true"
  });
});
googleEventSyncToggle?.addEventListener("change", async () => {
  const nextEnabled = Boolean(googleEventSyncToggle.checked);
  if (nextEnabled && !calendarWriteReady()) {
    googleEventSyncToggle.checked = calendarEventSyncPreferenceEnabled();
    googleEventSyncStatus.textContent = "Use Enable Google event sync in Settings to grant event-only access.";
    return;
  }

  googleEventSyncToggle.disabled = true;
  googleEventSyncStatus.textContent = nextEnabled ? "Turning Google event sync on..." : "Turning Google event sync off...";
  try {
    const data = await fetchJson("/api/me/calendar-event-sync", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "google", enabled: nextEnabled })
    });
    sessionInfo.user = data.user;
    sessionInfo.connected = Boolean(data.user?.connected);
    renderCalendarEventSyncControls();
  } catch (error) {
    googleEventSyncToggle.checked = calendarEventSyncEnabled();
    googleEventSyncStatus.textContent = error.message;
  } finally {
    renderCalendarEventSyncControls();
  }
});
refreshButton.addEventListener("click", refreshRoomData);
addEventButton.addEventListener("click", () => openEventModal("create"));
copyInviteButton.addEventListener("click", copyInviteLink);
copyInviteButtonEmpty.addEventListener("click", async () => {
  await copyInviteLink();
  dismissInviteStrip();
});
dismissInviteButton?.addEventListener("click", dismissInviteStrip);
roomCode?.addEventListener("click", copyRoomCode);
prevPeriodButton?.addEventListener("click", () => shiftCalendarPeriod(-1));
nextPeriodButton?.addEventListener("click", () => shiftCalendarPeriod(1));
displayNameInput?.addEventListener("input", scheduleDisplayNameSave);
renameRoomInput?.addEventListener("input", scheduleRoomNameSave);
renameRoomEmojiInput?.addEventListener("change", saveRoomEmoji);
renameRoomEmojiInput?.addEventListener("keydown", async (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  await saveRoomEmoji();
});
customRoomCodeInput?.addEventListener("input", () => {
  customRoomCodeInput.value = normalizeCustomRoomCodeInput(customRoomCodeInput.value);
});
customRoomCodeInput?.addEventListener("keydown", async (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  await saveRoomCode();
});
customRoomCodeInput?.addEventListener("blur", async () => {
  await saveRoomCode();
});
roomLockToggle?.addEventListener("change", saveRoomLockState);
themeToggle.addEventListener("change", () => {
  const theme = themeToggle.checked ? "dark" : "light";
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("cg-theme", theme);
});
settingsButton.addEventListener("click", () => {
  hostPopover.classList.toggle("hidden");
});
participantsRail?.addEventListener("click", () => {
  setParticipantsPanelExpanded(participantsRail.getAttribute("aria-expanded") !== "true");
});
fullscreenButton.addEventListener("click", async () => {
  await toggleFullscreenMode();
});
viewSwitcher.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-view]");
  if (!button) return;
  await setCurrentView(button.dataset.view);
});
window.addEventListener("keydown", async (event) => {
  if (event.key === "Escape") {
    closeExpandedBusyStacks();
  }
  if ((event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === "z") {
    if (shouldIgnoreUndoShortcut(event.target)) return;
    event.preventDefault();
    await undoLastEventCreation();
    return;
  }
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (shouldIgnoreViewShortcut(event.target)) return;
  if (event.key === "<" || event.key === ">") {
    event.preventDefault();
    await shiftCalendarPeriod(event.key === "<" ? -1 : 1);
    return;
  }
  if (event.key.toLowerCase() === "f") {
    event.preventDefault();
    await toggleFullscreenMode();
    return;
  }
  const nextView = viewShortcutMap[event.key.toLowerCase()];
  if (!nextView) return;
  event.preventDefault();
  await setCurrentView(nextView);
});
window.addEventListener("resize", () => {
  positionEventModal();
});
calendarGrid.addEventListener("pointerdown", startDragCreate, true);
calendarGrid.addEventListener("click", suppressCalendarClickCapture, true);
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
eventPanelForm?.addEventListener("submit", saveEventPanelChanges);
for (const input of [
  detailTitleInput,
  detailDateInput,
  detailStartInput,
  detailEndInput,
  detailLocationInput,
  detailDescriptionInput
]) {
  input?.addEventListener("input", () => {
    if (detailInviteeFeedback) {
      detailInviteeFeedback.dataset.persistedMessage = "";
      detailInviteeFeedback.textContent = eventPanelHasUnsavedChanges() ? "Unsaved changes" : "";
    }
    updateEventPanelSaveState();
  });
  input?.addEventListener("change", () => {
    if (detailInviteeFeedback) {
      detailInviteeFeedback.dataset.persistedMessage = "";
      detailInviteeFeedback.textContent = eventPanelHasUnsavedChanges() ? "Unsaved changes" : "";
    }
    updateEventPanelSaveState();
  });
}
detailGoogleSyncInput?.addEventListener("change", () => {
  if (detailInviteeFeedback) {
    detailInviteeFeedback.dataset.persistedMessage = "";
    detailInviteeFeedback.textContent = eventPanelHasUnsavedChanges() ? "Unsaved changes" : "";
  }
  updateDetailGoogleSyncControl(eventPanelForm?.dataset.canManage === "true");
  updateEventPanelSaveState();
});
eventGoogleSyncInput?.addEventListener("change", updateEventGoogleSyncControl);
eventAllDayInput?.addEventListener("change", () => setAllDayMode(eventAllDayInput.checked));
eventDateInput?.addEventListener("change", () => {
  if (!eventAllDayInput?.checked || !eventEndDateInput) return;
  if (!eventEndDateInput.value || eventEndDateInput.value < eventDateInput.value) {
    eventEndDateInput.value = eventDateInput.value;
  }
});
cancelEventButton.addEventListener("click", attemptCloseEventModal);
cancelEventSecondary.addEventListener("click", attemptCloseEventModal);
createRoomModalForm?.addEventListener("submit", createRoomFromSwitcher);
cancelCreateRoomModalButton?.addEventListener("click", closeCreateRoomModal);
cancelCreateRoomModalSecondary?.addEventListener("click", closeCreateRoomModal);
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

document.addEventListener("click", (event) => {
  if (hostPopover && !hostPopover.classList.contains("hidden")) {
    if (!hostPopover.contains(event.target) && !settingsButton.contains(event.target)) {
      hostPopover.classList.add("hidden");
    }
  }

  if (!event.target.closest(".busy-stack")) {
    closeExpandedBusyStacks();
  }

  for (const menu of document.querySelectorAll(".color-picker-menu[open]")) {
    if (menu.contains(event.target)) continue;
    menu.open = false;
  }

  if (detailPanel && !detailPanel.classList.contains("hidden")) {
    if (
      detailPanel.contains(event.target) ||
      event.target.closest(".event-card, .busy-card, .busy-stack, .busy-chip, .event-chip, .free-glow-block")
    ) {
      return;
    }
    clearDetailPanel();
  }
});

document.addEventListener("fullscreenchange", () => {
  document.documentElement.classList.toggle("fullscreen-mode", Boolean(document.fullscreenElement));
  fullscreenButton.classList.toggle("is-active", Boolean(document.fullscreenElement));
});

enableDialogBackdropClose(eventModal, attemptCloseEventModal);
enableDialogBackdropClose(createRoomModal, closeCreateRoomModal);

eventModal.addEventListener("cancel", (event) => {
  event.preventDefault();
  attemptCloseEventModal();
});

boot();
