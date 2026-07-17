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
const defaultRoomEmoji = "ðŸ“…";
const hours = Array.from({ length: calendarEndHour - calendarStartHour }, (_, index) => index + calendarStartHour);
const participantPalette = [
  { value: "#743F45", name: "Bordeaux" },
  { value: "#6C4652", name: "Merlot" },
  { value: "#A36F52", name: "Sienna" },
  { value: "#A97952", name: "Cognac" },
  { value: "#B39458", name: "Gilded" },
  { value: "#777653", name: "Verdant" },
  { value: "#83907B", name: "Cashmere" },
  { value: "#536B5E", name: "Sylvan" },
  { value: "#496B70", name: "Aegean" },
  { value: "#65758A", name: "Sterling" },
  { value: "#435267", name: "Nocturne" },
  { value: "#80768E", name: "Amethyst" },
  { value: "#665267", name: "Aubergine" },
  { value: "#9A7275", name: "Roselle" },
  { value: "#8D8174", name: "Truffle" },
  { value: "#66635F", name: "Graphite" }
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
const fullscreenIcon = document.querySelector("#fullscreenIcon");
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
const roomLockIcon = document.querySelector("#roomLockIcon");

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

function setButtonLabelWithIcon(button, label, iconClass) {
  if (!button) return;
  const icon = document.createElement("span");
  icon.className = `ui-icon ${iconClass}`;
  icon.setAttribute("aria-hidden", "true");
  const text = document.createElement("span");
  text.textContent = label;
  button.classList.add("button-with-icon");
  button.replaceChildren(icon, text);
}

function updateFullscreenControl() {
  const active = Boolean(document.fullscreenElement);
  fullscreenButton.classList.toggle("is-active", active);
  fullscreenButton.title = active ? "Exit fullscreen" : "Fullscreen";
  fullscreenButton.setAttribute("aria-label", active ? "Exit fullscreen" : "Enter fullscreen");
  fullscreenIcon?.classList.toggle("ui-icon-maximize", !active);
  fullscreenIcon?.classList.toggle("ui-icon-minimize", active);
}

function updateRoomLockIcon(locked) {
  roomLockIcon?.classList.toggle("ui-icon-lock", Boolean(locked));
  roomLockIcon?.classList.toggle("ui-icon-lock-open", !locked);
}
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
  if (!detailGoogleSyn…32770 tokens truncated…tart = allDay ? new Date(`${date}T00:00`) : new Date(`${date}T${eventStartInput.value}`);
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
  updateFullscreenControl();
});

enableDialogBackdropClose(eventModal, attemptCloseEventModal);
enableDialogBackdropClose(createRoomModal, closeCreateRoomModal);

eventModal.addEventListener("cancel", (event) => {
  event.preventDefault();
  attemptCloseEventModal();
});

updateFullscreenControl();
boot();

