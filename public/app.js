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
const todayButton = document.querySelector("#todayButton");
const calendarViewMenu = document.querySelector("#calendarViewMenu");
const calendarViewLabel = document.querySelector("#calendarViewLabel");
const calendarSidebarButton = document.querySelector("#calendarSidebarButton");
const memberSearchInput = document.querySelector("#memberSearchInput");
const membersSectionToggle = document.querySelector("#membersSectionToggle");
const miniCalendarTitle = document.querySelector("#miniCalendarTitle");
const miniCalendarGrid = document.querySelector("#miniCalendarGrid");
const miniCalendarPrevious = document.querySelector("#miniCalendarPrevious");
const miniCalendarNext = document.querySelector("#miniCalendarNext");
const roomSwitcher = document.querySelector("#roomSwitcher");
const participantStrip = document.querySelector("#participantStrip");
const calendarGrid = document.querySelector("#calendarGrid");
const connectWidgetText = document.querySelector("#connectWidgetText");
const topbarIdentity = document.querySelector("#topbarIdentity");
const viewSwitcher = document.querySelector("#viewSwitcher");
const hostPanel = document.querySelector("#hostPanel");
const hostSettings = document.querySelector("#hostSettings");
const hostPopover = document.querySelector("#hostPopover");
const syncSettingsCard = document.querySelector("#syncSettingsCard");
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
const eventModalTitle = document.querySelector("#eventComposerTitle");
const eventTitleInput = document.querySelector("#eventTitleInput");
const eventDateInput = document.querySelector("#eventDateInput");
const eventEndDateInput = document.querySelector("#eventEndDateInput");
const eventStartInput = document.querySelector("#eventStartInput");
const eventEndInput = document.querySelector("#eventEndInput");
const eventAllDayInput = document.querySelector("#eventAllDayInput");
const eventLocationInput = document.querySelector("#eventLocationInput");
const eventDescriptionInput = document.querySelector("#eventDescriptionInput");
const eventGoogleSyncRow = document.querySelector("#eventGoogleSyncRow");
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
const calendarGoogleButton = document.querySelector("#calendarGoogleButton");
const themeToggle = document.querySelector("#themeToggle");
const addEventButton = document.querySelector("#addEventButton");
const copyInviteButton = document.querySelector("#copyInviteButton");
const copyInviteButtonEmpty = document.querySelector("#copyInviteButtonEmpty");
const dismissInviteButton = document.querySelector("#dismissInviteButton");
const emptyRoomState = document.querySelector("#emptyRoomState");
const emptyRoomCode = document.querySelector("#emptyRoomCode");
const quickRoomEmojiInput = document.querySelector("#quickRoomEmojiInput");
const participantsSidebar = document.querySelector("#participantsSidebar");
const roomLockIcon = document.querySelector("#roomLockIcon");
const emojiPickerPopover = document.querySelector("#emojiPickerPopover");
const emojiPickerSearch = document.querySelector("#emojiPickerSearch");
const emojiPickerGrid = document.querySelector("#emojiPickerGrid");
const emojiPickerStatus = document.querySelector("#emojiPickerStatus");
const emojiPickerTriggers = Array.from(document.querySelectorAll(".emoji-trigger[data-emoji-target]"));

let appConfig = null;
let sessionInfo = null;
let currentRoom = null;
let myRooms = [];
let roomSwitcherRenderSignature = "";
let currentParticipant = null;
let currentIsHost = false;
let googleBusy = [];
let currentView = "week";
let currentFocusDate = new Date();
let miniCalendarCursor = new Date(currentFocusDate.getFullYear(), currentFocusDate.getMonth(), 1);
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
let googleAuthPopup = null;
let googleAuthPopupToken = "";
let googleAuthPopupPollTimer = null;
let googleAuthPopupPending = false;
let dragCreateState = null;
let eventResizeState = null;
let dragPreviewNode = null;
let dragPreviewFrame = 0;
let eventResizeFrame = 0;
let suppressCalendarClickUntil = 0;
let participantsDrawerGesture = null;

/* TODO: Commonground Free Block Rendering - Hidden for current demo */
const showFreeBlocks = false;

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
  const previousState = fullscreenButton.dataset.fullscreenState;
  fullscreenButton.classList.toggle("is-active", active);
  fullscreenButton.title = active ? "Exit fullscreen" : "Fullscreen";
  fullscreenButton.setAttribute("aria-label", active ? "Exit fullscreen" : "Enter fullscreen");
  fullscreenIcon?.classList.toggle("ui-icon-maximize", !active);
  fullscreenIcon?.classList.toggle("ui-icon-minimize", active);
  fullscreenButton.dataset.fullscreenState = active ? "active" : "inactive";
  if (previousState && previousState !== fullscreenButton.dataset.fullscreenState) {
    replayMotionClass(fullscreenButton, "motion-state-change");
  }
}

function updateRoomLockIcon(locked) {
  roomLockIcon?.classList.toggle("ui-icon-lock", Boolean(locked));
  roomLockIcon?.classList.toggle("ui-icon-lock-open", !locked);
}

const motionPressMs = 100;
const motionFastMs = 150;
const motionStandardMs = 250;
const motionSlowMs = 350;
const motionPageMs = 400;
const eventResizeSnapMinutes = 15;
const eventResizeMinMinutes = 15;
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const panelMotionTimers = new WeakMap();
const dialogMotionTimers = new WeakMap();
const replayMotionStates = new WeakMap();
const keyboardPressTimers = new WeakMap();
const emojiSpringStates = new WeakMap();
const freeBlockReflowAnimations = new WeakMap();
const emojiKeywordDictionaryUrl = "https://unpkg.com/emojilib@3.0.11/dist/emoji-en-US.json";
const emojiKeywordDictionaryFallbackUrl = "/assets/emojilib/3.0.11/emoji-en-US.json";
const maxEmojiPickerResults = 60;
const maxFrequentlyUsedEmojis = 40;
const frequentRoomEmojis = Object.freeze([
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🙂",
  "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩", "😘",
  "😋", "😛", "😜", "🤪", "🤗", "🤭", "🤔", "🤐",
  "😐", "😑", "😶", "🙄", "😏", "😴", "👍", "👎",
  "👌", "✌️", "🤞", "🤟", "🤘", "👏", "🙌", "🙏"
]);
const emojiPickerState = {
  open: false,
  trigger: null,
  input: null,
  x: 8,
  y: 8,
  progress: 0,
  placement: "bottom",
  loadError: false
};
let emojiKeywordEntries = null;
let emojiKeywordEntryMap = new Map();
let emojiKeywordLoadPromise = null;
let emojiSearchRenderFrame = null;
let emojiPositionFrame = null;
let calendarLoadGeneration = 0;

function prefersReducedMotion() {
  return reducedMotionQuery.matches;
}

function motionDelay(duration) {
  return prefersReducedMotion() ? 1 : duration;
}

function keyboardMotionTarget(target) {
  if (!(target instanceof Element)) return null;
  const motionTarget = target.closest("summary, [role='button']");
  if (!motionTarget || motionTarget.matches(":disabled, [aria-disabled='true']")) return null;
  return motionTarget;
}

function releaseKeyboardMotion(target) {
  const motionTarget = keyboardMotionTarget(target);
  if (!motionTarget) return;
  const pendingTimer = keyboardPressTimers.get(motionTarget);
  if (pendingTimer) window.clearTimeout(pendingTimer);
  keyboardPressTimers.delete(motionTarget);
  motionTarget.classList.remove("is-pressed");
}

function pressKeyboardMotion(target) {
  const motionTarget = keyboardMotionTarget(target);
  if (!motionTarget) return;
  releaseKeyboardMotion(motionTarget);
  motionTarget.classList.add("is-pressed");
  const timer = window.setTimeout(() => {
    if (keyboardPressTimers.get(motionTarget) !== timer) return;
    keyboardPressTimers.delete(motionTarget);
    motionTarget.classList.remove("is-pressed");
  }, motionPressMs + 40);
  keyboardPressTimers.set(motionTarget, timer);
}

function replayMotionClass(node, className, duration = motionStandardMs) {
  if (!node) return;
  let nodeStates = replayMotionStates.get(node);
  if (!nodeStates) {
    nodeStates = new Map();
    replayMotionStates.set(node, nodeStates);
  }
  const previousState = nodeStates.get(className);
  if (previousState?.timer) window.clearTimeout(previousState.timer);
  const token = Symbol(className);
  const nextState = { token, timer: null };
  nodeStates.set(className, nextState);
  node.classList.remove(className);
  if (prefersReducedMotion()) {
    nodeStates.delete(className);
    return;
  }
  requestAnimationFrame(() => {
    if (nodeStates.get(className)?.token !== token) return;
    node.classList.add(className);
    nextState.timer = window.setTimeout(() => {
      if (nodeStates.get(className)?.token !== token) return;
      node.classList.remove(className);
      nodeStates.delete(className);
    }, duration + 40);
  });
}

function showAppPage(targetPage) {
  if (emojiPickerState.open && !targetPage?.contains(emojiPickerState.trigger)) {
    closeEmojiPicker({ restoreFocus: false, immediate: true });
  }
  const pages = [homePage, entryChoicePage, roomPage];
  const wasHidden = targetPage?.classList.contains("hidden");
  for (const page of pages) {
    page.classList.toggle("hidden", page !== targetPage);
  }
  if (wasHidden) replayMotionClass(targetPage, "motion-page-enter", motionPageMs);
}

function setPanelVisibility(panel, visible, { afterHide } = {}) {
  if (!panel) return;
  if (visible && panel.classList.contains("is-entering") && !panel.classList.contains("is-closing")) return;
  const existingTimer = panelMotionTimers.get(panel);
  if (existingTimer) window.clearTimeout(existingTimer);
  panelMotionTimers.delete(panel);

  if (visible) {
    const shouldAnimate = panel.classList.contains("hidden") || panel.classList.contains("is-closing");
    panel.classList.remove("hidden", "is-closing");
    if (shouldAnimate && !prefersReducedMotion()) {
      panel.classList.add("is-entering");
      const timer = window.setTimeout(() => {
        panel.classList.remove("is-entering");
        panelMotionTimers.delete(panel);
      }, motionSlowMs + 40);
      panelMotionTimers.set(panel, timer);
    }
    return;
  }

  if (panel.classList.contains("hidden")) {
    afterHide?.();
    return;
  }
  panel.classList.remove("is-entering");
  if (prefersReducedMotion()) {
    panel.classList.add("hidden");
    afterHide?.();
    return;
  }
  panel.classList.add("is-closing");
  const timer = window.setTimeout(() => {
    if (!panel.classList.contains("is-closing")) return;
    panel.classList.add("hidden");
    panel.classList.remove("is-closing");
    panelMotionTimers.delete(panel);
    afterHide?.();
  }, motionFastMs + 40);
  panelMotionTimers.set(panel, timer);
}

function prepareDialogForOpen(dialog) {
  if (!dialog) return;
  const pendingTimer = dialogMotionTimers.get(dialog);
  if (pendingTimer) window.clearTimeout(pendingTimer);
  dialogMotionTimers.delete(dialog);
  dialog.classList.remove("is-closing");
}

function closeDialogWithMotion(dialog, afterClose) {
  if (!dialog?.open) {
    afterClose?.();
    return;
  }
  if (dialog.classList.contains("is-closing")) return;
  if (prefersReducedMotion()) {
    prepareDialogForOpen(dialog);
    dialog.close();
    afterClose?.();
    return;
  }
  dialog.classList.add("is-closing");
  const timer = window.setTimeout(() => {
    if (dialogMotionTimers.get(dialog) !== timer || !dialog.classList.contains("is-closing")) return;
    dialogMotionTimers.delete(dialog);
    if (dialog.open) dialog.close();
    dialog.classList.remove("is-closing");
    afterClose?.();
  }, motionFastMs + 40);
  dialogMotionTimers.set(dialog, timer);
}

function animateCalendarTransition(renderAction) {
  renderAction();
  if (!calendarGrid || prefersReducedMotion()) return;
  calendarGrid.classList.remove("is-view-exiting");
  replayMotionClass(calendarGrid, "is-view-entering", motionFastMs);
}

async function loadCalendarRangeWithMotion() {
  const generation = ++calendarLoadGeneration;
  calendarStatus?.classList.add("is-loading");
  try {
    return await loadFreeBusy();
  } finally {
    if (generation === calendarLoadGeneration) {
      calendarStatus?.classList.remove("is-loading");
    }
  }
}

async function refreshCalendarAfterImmediateRender() {
  const refreshPromise = loadCalendarRangeWithMo…50708 tokens truncated…  if (saveEventChangesButton) saveEventChangesButton.disabled = true;
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
todayButton?.addEventListener("click", async () => {
  currentFocusDate = startOfDay(new Date());
  syncMiniCalendarToFocus();
  await refreshCalendarAfterImmediateRender();
});
calendarSidebarButton?.addEventListener("click", () => {
  setParticipantsPanelExpanded(participantsSidebar?.dataset.open !== "true");
});
memberSearchInput?.addEventListener("input", filterParticipantRows);
membersSectionToggle?.addEventListener("click", () => {
  const expanded = membersSectionToggle.getAttribute("aria-expanded") !== "false";
  membersSectionToggle.setAttribute("aria-expanded", String(!expanded));
  membersSectionToggle.closest(".members-section")?.classList.toggle("is-collapsed", expanded);
});
miniCalendarPrevious?.addEventListener("click", () => {
  miniCalendarCursor = addMonths(miniCalendarCursor, -1);
  renderMiniCalendar();
});
miniCalendarNext?.addEventListener("click", () => {
  miniCalendarCursor = addMonths(miniCalendarCursor, 1);
  renderMiniCalendar();
});
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
  document.documentElement.classList.add("is-theme-switching");
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("cg-theme", theme);
  window.setTimeout(() => {
    document.documentElement.classList.remove("is-theme-switching");
  }, motionDelay(motionStandardMs + 40));
});
settingsButton.addEventListener("click", () => {
  const shouldOpen = hostPopover.classList.contains("hidden") || hostPopover.classList.contains("is-closing");
  setPanelVisibility(hostPopover, shouldOpen);
});
calendarGoogleButton?.addEventListener("click", () => {
  if (!currentRoom?.code) return;

  const shouldAuthorize =
    currentParticipantNeedsReconnect() ||
    !currentUserConnected() ||
    !currentParticipantConnected() ||
    !calendarWriteReady();

  if (shouldAuthorize) {
    window.location.href = googleAuthUrl(currentRoom.code, { calendarWrite: true });
    return;
  }

  setPanelVisibility(hostPopover, true);
  window.requestAnimationFrame(() => {
    syncSettingsCard?.scrollIntoView({ block: "nearest" });
    googleEventSyncToggle?.focus({ preventScroll: true });
  });
});
participantsSidebar?.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse") return;
  participantsDrawerGesture = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
  };
});
participantsSidebar?.addEventListener("pointerup", (event) => {
  if (!participantsDrawerGesture || participantsDrawerGesture.pointerId !== event.pointerId) return;
  const deltaX = event.clientX - participantsDrawerGesture.startX;
  const deltaY = event.clientY - participantsDrawerGesture.startY;
  if (Math.abs(deltaX) >= 32 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
    setParticipantsPanelExpanded(deltaX > 0);
  }
  participantsDrawerGesture = null;
});
participantsSidebar?.addEventListener("pointercancel", (event) => {
  if (participantsDrawerGesture?.pointerId === event.pointerId) {
    participantsDrawerGesture = null;
  }
});
fullscreenButton.addEventListener("click", async () => {
  await toggleFullscreenMode();
});
viewSwitcher.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-view]");
  if (!button) return;
  await setCurrentView(button.dataset.view);
});
document.addEventListener("keydown", (event) => {
  if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
  pressKeyboardMotion(event.target);
});
document.addEventListener("keyup", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  releaseKeyboardMotion(event.target);
});
document.addEventListener("focusout", (event) => {
  releaseKeyboardMotion(event.target);
});
window.addEventListener("keydown", async (event) => {
  if (event.key === "Escape") {
    closeExpandedBusyStacks();
    setParticipantsPanelExpanded(false);
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
setParticipantsPanelExpanded(!window.matchMedia("(max-width: 760px)").matches);
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
eventGoogleSyncRow?.addEventListener("click", activateEventGoogleSyncRow);
eventGoogleSyncRow?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  activateEventGoogleSyncRow(event);
});
eventAllDayInput?.addEventListener("change", () => {
  setAllDayMode(eventAllDayInput.checked);
  requestAnimationFrame(positionEventModal);
});
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

window.addEventListener("message", handleGoogleAuthPopupMessage);

document.addEventListener("click", (event) => {
  if (hostPopover && !hostPopover.classList.contains("hidden")) {
    if (
      !hostPopover.contains(event.target) &&
      !settingsButton.contains(event.target) &&
      !calendarGoogleButton?.contains(event.target) &&
      !emojiPickerPopover?.contains(event.target)
    ) {
      setPanelVisibility(hostPopover, false);
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
      event.target.closest(".event-card, .busy-card, .busy-stack, .busy-chip, .event-chip, .free-block, .free-glow-block")
    ) {
      return;
    }
    clearDetailPanel();
  }
});

document.addEventListener("fullscreenchange", () => {
  document.documentElement.classList.toggle("fullscreen-mode", Boolean(document.fullscreenElement));
  updateFullscreenControl();
  replayMotionClass(calendarGrid, "is-view-entering");
});

enableDialogBackdropClose(eventModal, attemptCloseEventModal);
enableDialogBackdropClose(createRoomModal, closeCreateRoomModal);

createRoomModal?.addEventListener("close", () => {
  if (emojiPickerState.trigger?.closest("#createRoomModal")) {
    closeEmojiPicker({ restoreFocus: false, immediate: true });
  }
});

eventModal.addEventListener("cancel", (event) => {
  event.preventDefault();
  attemptCloseEventModal();
});

updateFullscreenControl();
initializeEmojiPickers();
boot();
