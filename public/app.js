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
const topbarRoomName = document.querySelector("#topbarRoomName");
const roomCode = document.querySelector("#roomCode");
const hostPill = document.querySelector("#hostPill");
const calendarStatus = document.querySelector("#calendarStatus");
const googleConnectionIndicator = document.querySelector("#googleConnectionIndicator");
const calendarConnectionNotice = document.querySelector("#calendarConnectionNotice");
const weatherHighLowTooltip = document.querySelector("#weatherHighLowTooltip");
const weatherHighLowTooltipText = document.querySelector("#weatherHighLowTooltipText");
const weatherHourlyPopover = document.querySelector("#weatherHourlyPopover");
const weatherHourlyTitle = document.querySelector("#weatherHourlyTitle");
const weatherHourlySummary = document.querySelector("#weatherHourlySummary");
const weatherHourlyList = document.querySelector("#weatherHourlyList");
const weatherHourlyStatus = document.querySelector("#weatherHourlyStatus");
const closeWeatherHourlyButton = document.querySelector("#closeWeatherHourlyButton");
const calendarPeriodLabel = document.querySelector("#calendarPeriodLabel");
const prevPeriodButton = document.querySelector("#prevPeriodButton");
const nextPeriodButton = document.querySelector("#nextPeriodButton");
const todayButton = document.querySelector("#todayButton");
const calendarViewMenu = document.querySelector("#calendarViewMenu");
const calendarViewLabel = document.querySelector("#calendarViewLabel");
const calendarSidebarButton = document.querySelector("#calendarSidebarButton");
const sidebarBackdrop = document.querySelector("#sidebarBackdrop");
const memberSearchInput = document.querySelector("#memberSearchInput");
const membersSectionToggle = document.querySelector("#membersSectionToggle");
const miniCalendarTitle = document.querySelector("#miniCalendarTitle");
const miniCalendarGrid = document.querySelector("#miniCalendarGrid");
const miniCalendarPrevious = document.querySelector("#miniCalendarPrevious");
const miniCalendarNext = document.querySelector("#miniCalendarNext");
const roomSwitcher = document.querySelector("#roomSwitcher");
const participantStrip = document.querySelector("#participantStrip");
const calendarGrid = document.querySelector("#calendarGrid");
const calendarScrollport = calendarGrid?.closest(".calendar-wrap");
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
const detailTitleField = document.querySelector("#detailTitleField");
const detailTime = document.querySelector("#detailTime");
const eventPanelForm = document.querySelector("#eventPanelForm");
const detailTitleInput = document.querySelector("#detailTitleInput");
const detailDateInput = document.querySelector("#detailDateInput");
const detailStartInput = document.querySelector("#detailStartInput");
const detailEndInput = document.querySelector("#detailEndInput");
const detailStartTimeInput = document.querySelector("#detailStartTimeInput");
const detailEndTimeInput = document.querySelector("#detailEndTimeInput");
const detailLocationInput = document.querySelector("#detailLocationInput");
const detailDescriptionInput = document.querySelector("#detailDescriptionInput");
const detailInviteeList = document.querySelector("#detailInviteeList");
const detailInviteeFeedback = document.querySelector("#detailInviteeFeedback");
const detailGoogleSyncInput = document.querySelector("#detailGoogleSyncInput");
const detailGoogleSyncStatus = document.querySelector("#detailGoogleSyncStatus");
const saveEventChangesButton = document.querySelector("#saveEventChangesButton");
const responseSummary = document.querySelector("#responseSummary");
const inviteeSummary = document.querySelector("#inviteeSummary");
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
const eventDateField = document.querySelector(".composer-date-field");
const eventEndDateField = document.querySelector(".composer-end-date-field");
const eventStartInput = document.querySelector("#eventStartInput");
const eventEndInput = document.querySelector("#eventEndInput");
const eventStartTimeInput = document.querySelector("#eventStartTimeInput");
const eventEndTimeInput = document.querySelector("#eventEndTimeInput");
const eventStartTimeField = document.querySelector("#eventStartTimeField");
const eventEndTimeField = document.querySelector("#eventEndTimeField");
const eventStartTimeDropdown = document.querySelector("#eventStartTimeDropdown");
const eventEndTimeDropdown = document.querySelector("#eventEndTimeDropdown");
const eventStartTimeListbox = document.querySelector("#eventStartTimeListbox");
const eventEndTimeListbox = document.querySelector("#eventEndTimeListbox");
const eventAllDayInput = document.querySelector("#eventAllDayInput");
const eventLocationInput = document.querySelector("#eventLocationInput");
const eventDescriptionInput = document.querySelector("#eventDescriptionInput");
const eventGoogleSyncRow = document.querySelector("#eventGoogleSyncRow");
const eventGoogleSyncInput = document.querySelector("#eventGoogleSyncInput");
const eventGoogleSyncStatus = document.querySelector("#eventGoogleSyncStatus");
const eventFormFeedback = document.querySelector("#eventFormFeedback");
const inviteePicker = document.querySelector("#inviteePicker");
const eventInviteDropdown = eventModal?.querySelector(".invite-dropdown");
const inviteeCountText = document.querySelector("#inviteeCountText");
const saveEventButton = document.querySelector("#saveEventButton");
const cancelEventButton = document.querySelector("#cancelEventButton");
const cancelEventSecondary = document.querySelector("#cancelEventSecondary");
const discardEventDraftDialog = document.querySelector("#discardEventDraftDialog");
const cancelDiscardEventDraftButton = document.querySelector("#cancelDiscardEventDraftButton");
const confirmDiscardEventDraftButton = document.querySelector("#confirmDiscardEventDraftButton");
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
const settingsCloseButton = document.querySelector("#settingsCloseButton");
const calendarUtilityOverflowButton = document.querySelector("#calendarUtilityOverflowButton");
const calendarUtilityOverflowMenu = document.querySelector("#calendarUtilityOverflowMenu");
const calendarGoogleButton = document.querySelector("#calendarGoogleButton");
const themeToggle = document.querySelector("#themeToggle");
const addEventButton = document.querySelector("#addEventButton");
const sidebarCreateMenu = document.querySelector("#sidebarCreateMenu");
const sidebarCreatePopover = document.querySelector("#sidebarCreatePopover");
const sidebarCreateEventButton = document.querySelector("#sidebarCreateEventButton");
const sidebarBlockDayButton = document.querySelector("#sidebarBlockDayButton");
const sidebarBlockDayLabel = document.querySelector("#sidebarBlockDayLabel");
const sidebarCreateRoomButton = document.querySelector("#sidebarCreateRoomButton");
const sidebarJoinRoomButton = document.querySelector("#sidebarJoinRoomButton");
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
const emojiPickerCloseButton = document.querySelector("#emojiPickerCloseButton");
const emojiPickerTriggers = Array.from(document.querySelectorAll(".emoji-trigger[data-emoji-target]"));
const deleteEventConfirmDialog = document.querySelector("#deleteEventConfirmDialog");
const cancelDeleteEventButton = document.querySelector("#cancelDeleteEventButton");
const confirmDeleteEventButton = document.querySelector("#confirmDeleteEventButton");

let appConfig = null;
let sessionInfo = null;
let themePreferenceSaveVersion = 0;
let pendingThemePreference = null;
let currentRoom = null;
let myRooms = [];
let roomSwitcherRenderSignature = "";
let currentParticipant = null;
let currentIsHost = false;
let googleBusy = [];
let weatherForecastByDate = new Map();
let weatherHourlyByDate = new Map();
let weatherLocationPromise = null;
let weatherLoadPromise = null;
let weatherForecastFetchedAt = 0;
let weatherRetryAfter = 0;
let weatherLocationUnavailable = false;
let weatherGeolocationPermissionStatus = null;
let weatherLocationKey = "";
let weatherHourlyRequestGeneration = 0;
let weatherHourlyTrigger = null;
let weatherTooltipHideTimer = null;
const calendarViewStorageKey = "cg-calendar-view-v1";
const calendarScrollStorageKey = "cg-calendar-scroll-v1";
const sidebarOpenStorageKey = "cg-sidebar-open-v1";
const supportedCalendarViews = new Set(["day", "week", "month", "year"]);
let currentView = readStoredCalendarView();
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
let discardEventDraftReturnFocus = null;
let eventPanelInitialState = "";
let eventModalAnchorRect = null;
let googleAuthPopup = null;
let googleAuthPopupToken = "";
let googleAuthPopupPollTimer = null;
let googleAuthPopupPending = false;
let googleConnectionRefreshPromise = null;
let dragCreateState = null;
let eventResizeState = null;
let eventMoveState = null;
let dragPreviewNode = null;
let dragPreviewFrame = 0;
let eventComposerPreviewActive = false;
let eventComposerPreviewFrame = 0;
let eventComposerPreviewShouldReveal = false;
let eventComposerPreviewShouldNavigate = false;
let eventResizeFrame = 0;
let eventMoveFrame = 0;
let suppressCalendarClickUntil = 0;
let suppressOutsideSurfaceClick = false;
let suppressOutsideSurfaceTimer = null;
let activeEventTimePicker = null;
let participantsDrawerGesture = null;
let settingsReturnFocus = null;
let calendarScrollSaveTimer = null;
let calendarScrollRestoreFrame = null;
let pendingRoomPreview = null;
let deleteEventReturnFocus = null;
const pendingEventMoveKeys = new Set();
const weatherForecastFreshnessMs = 25 * 60 * 1000;
const weatherForecastRetryMs = 5 * 60 * 1000;
const weatherIconNames = new Set([
  "sun",
  "cloud-sun",
  "cloudy",
  "cloud-drizzle",
  "cloud-lightning",
  "snowflake",
  "wind",
  "thermometer-sun",
  "thermometer-snowflake"
]);

const showFreeBlocks = false;

function readStoredCalendarView() {
  try {
    const storedView = window.localStorage.getItem(calendarViewStorageKey);
    return supportedCalendarViews.has(storedView) ? storedView : "week";
  } catch {
    return "week";
  }
}

function persistCalendarView(view = currentView) {
  if (!supportedCalendarViews.has(view)) return;
  try {
    window.localStorage.setItem(calendarViewStorageKey, view);
  } catch {
    // Calendar view persistence is an enhancement; the active view still works.
  }
}

function readStoredSidebarOpen() {
  const mobileLayout = window.matchMedia("(max-width: 900px)").matches;
  try {
    const storedValue = window.localStorage.getItem(sidebarOpenStorageKey);
    if (storedValue === "true") return true;
    if (storedValue === "false") return false;
  } catch {
    // Fall through to the responsive default.
  }
  return !mobileLayout;
}

function persistSidebarOpen(open) {
  try {
    window.localStorage.setItem(sidebarOpenStorageKey, String(Boolean(open)));
  } catch {
    // Sidebar persistence is optional.
  }
}

function readStoredCalendarScrollPositions() {
  const fallback = { day: null, week: null, month: 0, year: 0 };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(calendarScrollStorageKey) || "null");
    if (!parsed || typeof parsed !== "object") return fallback;
    for (const view of supportedCalendarViews) {
      const value = Number(parsed[view]);
      fallback[view] = Number.isFinite(value) && value >= 0 ? value : fallback[view];
    }
  } catch {
    // Keep the safe defaults when local storage is unavailable or malformed.
  }
  return fallback;
}

const calendarScrollPositions = readStoredCalendarScrollPositions();

function persistCalendarScrollPositions() {
  try {
    window.localStorage.setItem(calendarScrollStorageKey, JSON.stringify(calendarScrollPositions));
  } catch {
    // Scroll restoration is optional.
  }
}

function saveCalendarScrollPosition(view = currentView) {
  if (!calendarScrollport || !supportedCalendarViews.has(view)) return;
  calendarScrollPositions[view] = Math.max(0, calendarScrollport.scrollTop);
  persistCalendarScrollPositions();
}

function defaultTimedCalendarScrollTop() {
  if (!calendarGrid || !calendarScrollport) return 0;
  const now = new Date();
  const includesToday = currentView === "day"
    ? sameDate(currentFocusDate, now)
    : currentWeekDays().some((day) => sameDate(day.date, now));
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const targetMinutes = includesToday && currentMinutes >= 6 * 60 && currentMinutes <= 22 * 60
    ? Math.max(0, currentMinutes - 2 * 60)
    : 8 * 60;
  const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--calendar-header-height")) || 72;
  const gridOffset = calendarGrid.offsetTop || 0;
  return Math.max(0, gridOffset + headerHeight + (targetMinutes / 60) * resolvedCalendarRowHeight() - 16);
}

function restoreCalendarScrollPosition(view = currentView) {
  if (!calendarScrollport || !supportedCalendarViews.has(view)) return;
  if (calendarScrollRestoreFrame) window.cancelAnimationFrame(calendarScrollRestoreFrame);
  calendarScrollRestoreFrame = window.requestAnimationFrame(() => {
    calendarScrollRestoreFrame = null;
    if (view !== currentView) return;
    const storedPosition = calendarScrollPositions[view];
    const nextPosition = (view === "day" || view === "week") && storedPosition === null
      ? defaultTimedCalendarScrollTop()
      : Math.max(0, Number(storedPosition) || 0);
    calendarScrollport.scrollTop = nextPosition;
    if (view === "month" || view === "year") calendarScrollport.scrollLeft = 0;
  });
}

function eventInkForColor(color) {
  const match = String(color || "").trim().match(/^#([0-9a-f]{6})$/i);
  if (!match) return { mode: "light", value: "#ffffff" };
  const channels = [0, 2, 4].map((offset) => parseInt(match[1].slice(offset, offset + 2), 16) / 255);
  const [red, green, blue] = channels.map((channel) => (
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));
  const luminance = 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  const whiteContrast = 1.05 / (luminance + 0.05);
  const darkContrast = (luminance + 0.05) / 0.05;
  return darkContrast >= whiteContrast
    ? { mode: "dark", value: "#111111" }
    : { mode: "light", value: "#ffffff" };
}

function applyEventInk(node, color) {
  if (!node) return;
  const ink = eventInkForColor(color);
  node.dataset.eventInk = ink.mode;
  node.style.setProperty("--event-ink", ink.value);
}

function setCalendarStatus(message, {
  notify = false,
  title = "CommonGround",
  type = "status",
  action = null
} = {}) {
  const text = String(message || "").trim();
  if (calendarStatus) calendarStatus.textContent = text;
  if (!notify || !text) return;
  showNotification({
    id: `local-status-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    title,
    message: text,
    createdAt: new Date().toISOString(),
    action
  });
}

function freeBlocksEnabled() {
  return Boolean(showFreeBlocks && visibleParticipantIds().size > 0);
}

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
const eventMoveThresholdPixels = 6;
const eventMoveSnapFeedbackMs = 100;
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
  const refreshPromise = loadCalendarRangeWithMotion();
  animateCalendarTransition(render);
  if (await refreshPromise) render();
}
let displayNameSaveTimer = null;
let roomNameSaveTimer = null;
let inlineRoomRenameActive = false;
let inlineRoomRenameTarget = null;
let hiddenParticipantIds = new Set();
let pendingEntryRoomCode = null;
let pendingEntryMode = null;
let pendingHostRoomState = null;
let roomCodeCopyTimer = null;
let copiedRoomCodeValue = "";
let topbarRoomLinkCopyTimer = null;
let copiedTopbarRoomCode = "";
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
  showAppPage(homePage);
}

function showEntryChoice() {
  if (choiceConnectButton) choiceConnectButton.disabled = false;
  if (choiceGuestButton) choiceGuestButton.disabled = false;
  showAppPage(entryChoicePage);
}

function showRoom() {
  showAppPage(roomPage);
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

function parseDateKey(value = "") {
  const parts = String(value).split("-").map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return startOfDay(new Date());
  }
  const [year, month, day] = parts;
  const parsed = new Date(year, month - 1, day);
  return Number.isFinite(parsed.getTime()) ? parsed : startOfDay(new Date());
}

function dayStartFromDateKey(value = "") {
  return startOfDay(parseDateKey(value));
}

function dateTimeFromDateKeyAndMinutes(value = "", minutes = 0) {
  const date = dayStartFromDateKey(value);
  const dateTime = new Date(date);
  dateTime.setMinutes(minutes);
  dateTime.setSeconds(0, 0);
  return dateTime;
}

function eventInviteeIds(event = {}) {
  const ids = Array.isArray(event.invitees)
    ? event.invitees.map((invitee) => invitee?.participantId || invitee?.id || "")
    : [];
  return [...new Set(ids.filter(Boolean))];
}

function hasMultipleEventParticipants(participantIds = []) {
  return new Set((participantIds || []).filter(Boolean)).size > 1;
}

function canManageEvent(event = {}) {
  return Boolean(currentIsHost || (currentParticipant?.id && event.createdByParticipantId === currentParticipant.id));
}

function clampEventMinutes(value = 0, min = 0, max = 24 * 60) {
  return Math.min(max, Math.max(min, value));
}

function snapEventMinutes(value = 0, step = eventResizeSnapMinutes) {
  return Math.round(value / step) * step;
}

function currentWeekDays() {
  const weekStart = startOfWeek(currentFocusDate);
  return dayNames.map((day, index) => ({
    ...day,
    date: addDays(weekStart, index)
  }));
}

function formatRange({ includeYear = false } = {}) {
  const displayDays = currentWeekDays();
  const start = displayDays[0].date;
  const end = displayDays[6].date;
  const rangeFormatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {})
  });

  if (typeof rangeFormatter.formatRange === "function") {
    return rangeFormatter.formatRange(start, end);
  }

  const monthFormatter = new Intl.DateTimeFormat(undefined, { month: "short" });
  const dayFormatter = new Intl.DateTimeFormat(undefined, { day: "numeric" });
  const yearFormatter = new Intl.DateTimeFormat(undefined, { year: "numeric" });
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    const yearLabel = includeYear ? `, ${yearFormatter.format(end)}` : "";
    return `${monthFormatter.format(start)} ${dayFormatter.format(start)}–${dayFormatter.format(end)}${yearLabel}`;
  }

  if (sameYear) {
    const yearLabel = includeYear ? `, ${yearFormatter.format(end)}` : "";
    return `${monthFormatter.format(start)} ${dayFormatter.format(start)}–${monthFormatter.format(end)} ${dayFormatter.format(end)}${yearLabel}`;
  }

  const startYear = includeYear ? `, ${yearFormatter.format(start)}` : "";
  const endYear = includeYear ? `, ${yearFormatter.format(end)}` : "";
  return `${monthFormatter.format(start)} ${dayFormatter.format(start)}${startYear}–${monthFormatter.format(end)} ${dayFormatter.format(end)}${endYear}`;
}

function formatMonthYear(date) {
  return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(date);
}

function currentTimezoneLabel(date = new Date()) {
  const totalMinutes = -date.getTimezoneOffset();
  const sign = totalMinutes >= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(totalMinutes);
  const hoursPart = String(Math.floor(absoluteMinutes / 60)).padStart(2, "0");
  const minutesPart = absoluteMinutes % 60;
  return `GMT${sign}${hoursPart}${minutesPart ? `:${String(minutesPart).padStart(2, "0")}` : ""}`;
}

function syncMiniCalendarToFocus() {
  miniCalendarCursor = new Date(currentFocusDate.getFullYear(), currentFocusDate.getMonth(), 1);
}

function renderMiniCalendar() {
  if (!miniCalendarGrid || !miniCalendarTitle) return;
  miniCalendarTitle.textContent = formatMonthYear(miniCalendarCursor);
  miniCalendarGrid.innerHTML = "";

  for (const day of dayNames) {
    const weekday = document.createElement("span");
    weekday.className = "mini-calendar-weekday";
    weekday.textContent = day.short.slice(0, 1);
    weekday.setAttribute("aria-hidden", "true");
    miniCalendarGrid.appendChild(weekday);
  }

  const monthStart = new Date(miniCalendarCursor.getFullYear(), miniCalendarCursor.getMonth(), 1);
  const gridStart = startOfWeek(monthStart);
  const today = new Date();

  for (let index = 0; index < 42; index += 1) {
    const date = addDays(gridStart, index);
    const button = document.createElement("button");
    button.type = "button";
    button.className = [
      "mini-calendar-day",
      date.getMonth() !== monthStart.getMonth() ? "is-outside-month" : "",
      sameDate(date, today) ? "is-today" : "",
      sameDate(date, currentFocusDate) ? "is-selected" : "",
      currentParticipantDayBlock(date) ? "is-blocked-by-you" : ""
    ].filter(Boolean).join(" ");
    button.textContent = String(date.getDate());
    button.setAttribute(
      "aria-label",
      `${currentParticipantDayBlock(date) ? "Busy all day. " : ""}Open week of ${formatFullDate(date)}`
    );
    if (sameDate(date, currentFocusDate)) button.setAttribute("aria-current", "date");
    button.addEventListener("click", async () => {
      miniCalendarCursor = new Date(date.getFullYear(), date.getMonth(), 1);
      await goToDateInWeek(date);
    });
    miniCalendarGrid.appendChild(button);
  }
}

function formatFullDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function dayBlocksForDate(date, { visibleOnly = true } = {}) {
  const key = typeof date === "string" ? date : dateKey(date);
  const visibleIds = visibleOnly ? visibleParticipantIds() : null;
  return (currentRoom?.dayBlocks || []).filter((block) => (
    block.date === key && (!visibleIds || visibleIds.has(block.participantId))
  ));
}

function currentParticipantDayBlock(date = currentFocusDate) {
  if (!currentParticipant?.id) return null;
  return dayBlocksForDate(date, { visibleOnly: false })
    .find((block) => block.participantId === currentParticipant.id) || null;
}

function renderDayBlockControls() {
  if (!sidebarBlockDayButton || !sidebarBlockDayLabel) return;
  const blocked = Boolean(currentParticipantDayBlock());
  const fullDate = formatFullDate(currentFocusDate);
  sidebarBlockDayButton.setAttribute("aria-pressed", String(blocked));
  sidebarBlockDayButton.classList.toggle("is-active", blocked);
  sidebarBlockDayLabel.textContent = blocked ? "Make day available" : "Block day";
  sidebarBlockDayButton.setAttribute(
    "aria-label",
    blocked ? `Make ${fullDate} available` : `Mark ${fullDate} busy all day`
  );
  sidebarBlockDayButton.title = blocked
    ? `Remove your all-day busy block for ${fullDate}`
    : `Show that you are busy all day on ${fullDate}`;
}

function formatDayHeader(day) {
  const dayNumber = new Intl.DateTimeFormat(undefined, { day: "numeric" }).format(day.date);
  const fullDate = formatFullDate(day.date);
  return `
    <span class="day-header-weekday">${escapeHtml(day.short)}</span>
    <button class="day-header-date" type="button" data-date="${escapeAttribute(dateKey(day.date))}" aria-label="View ${escapeAttribute(fullDate)} in week view" title="View ${escapeAttribute(fullDate)} in week view">${escapeHtml(dayNumber)}</button>
  `;
}

function normalizedWeatherForecast(entry) {
  const date = String(entry?.date || "");
  const icon = String(entry?.icon || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !weatherIconNames.has(icon)) return null;
  const normalizedTemperature = (value) => {
    if (value === null || value === undefined) return null;
    const number = Number(value);
    return Number.isFinite(number) ? Math.round(number * 10) / 10 : null;
  };
  return {
    date,
    icon,
    description: String(entry?.description || "Weather forecast").trim().slice(0, 120) || "Weather forecast",
    highC: normalizedTemperature(entry?.highC),
    lowC: normalizedTemperature(entry?.lowC),
    source: entry?.source === "history" ? "history" : "forecast"
  };
}

function normalizedHourlyWeather(entry, expectedDate) {
  const date = String(entry?.date || "");
  const hour = Number(entry?.hour);
  const icon = String(entry?.icon || "");
  if (
    date !== expectedDate ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isInteger(hour) ||
    hour < 0 ||
    hour > 23 ||
    !weatherIconNames.has(icon)
  ) {
    return null;
  }
  const temperature = entry?.temperatureC === null || entry?.temperatureC === undefined
    ? null
    : Number(entry.temperatureC);
  return {
    date,
    hour,
    icon,
    description: String(entry?.description || "Weather").trim().slice(0, 120) || "Weather",
    temperatureC: Number.isFinite(temperature) ? Math.round(temperature * 10) / 10 : null,
    isDaytime: entry?.isDaytime === true
  };
}

function formatWeatherTemperature(value) {
  return Number.isFinite(value) ? `${Math.round(value)}\u00b0` : "\u2014";
}

function formatWeatherHour(hour) {
  const normalized = ((Number(hour) % 24) + 24) % 24;
  const period = normalized >= 12 ? "pm" : "am";
  return `${normalized % 12 || 12}${period}`;
}

function weatherForecastLabel(forecast) {
  const details = [];
  if (Number.isFinite(forecast?.highC)) details.push(`high ${forecast.highC}\u00b0C`);
  if (Number.isFinite(forecast?.lowC)) details.push(`low ${forecast.lowC}\u00b0C`);
  const prefix = forecast?.source === "history" ? "Observed" : "Forecast";
  return [`${prefix}: ${forecast?.description || "weather"}`, ...details].join(", ");
}

function weatherHighLowLabel(forecast) {
  const high = Number.isFinite(forecast?.highC) ? `${Math.round(forecast.highC)}\u00b0` : "\u2014";
  const low = Number.isFinite(forecast?.lowC) ? `${Math.round(forecast.lowC)}\u00b0` : "\u2014";
  return forecast?.source === "history"
    ? `Recent high ${high}  \u00b7  Low ${low}`
    : `High ${high}  \u00b7  Low ${low}`;
}

function hideWeatherHighLowTooltip({ immediate = false } = {}) {
  if (!weatherHighLowTooltip) return;
  window.clearTimeout(weatherTooltipHideTimer);
  const hide = () => {
    weatherHighLowTooltip.setAttribute("aria-hidden", "true");
  };
  if (immediate) {
    hide();
    return;
  }
  weatherTooltipHideTimer = window.setTimeout(hide, 45);
}

function showWeatherHighLowTooltip(trigger, forecast) {
  if (!weatherHighLowTooltip || !weatherHighLowTooltipText || !trigger?.isConnected) return;
  window.clearTimeout(weatherTooltipHideTimer);
  weatherHighLowTooltipText.textContent = weatherHighLowLabel(forecast);
  weatherHighLowTooltip.setAttribute("aria-hidden", "false");
  const rect = trigger.getBoundingClientRect();
  const tooltipRect = weatherHighLowTooltip.getBoundingClientRect();
  const viewportPadding = 8;
  const left = Math.min(
    window.innerWidth - tooltipRect.width - viewportPadding,
    Math.max(viewportPadding, rect.left + (rect.width - tooltipRect.width) / 2)
  );
  const preferredTop = rect.bottom + 8;
  const top = preferredTop + tooltipRect.height <= window.innerHeight - viewportPadding
    ? preferredTop
    : Math.max(viewportPadding, rect.top - tooltipRect.height - 8);
  weatherHighLowTooltip.style.left = `${Math.round(left)}px`;
  weatherHighLowTooltip.style.top = `${Math.round(top)}px`;
}

function weatherHourlyPopoverIsOpen() {
  if (!weatherHourlyPopover) return false;
  try {
    return weatherHourlyPopover.matches(":popover-open");
  } catch {
    return weatherHourlyPopover.dataset.fallbackOpen === "true";
  }
}

function showWeatherHourlyPopover() {
  if (!weatherHourlyPopover || weatherHourlyPopoverIsOpen()) return;
  if (typeof weatherHourlyPopover.showPopover === "function") {
    weatherHourlyPopover.showPopover();
  } else {
    weatherHourlyPopover.dataset.fallbackOpen = "true";
    weatherHourlyPopover.hidden = false;
  }
}

function positionWeatherHourlyPopover(trigger) {
  if (!weatherHourlyPopover || !trigger?.isConnected) return;
  const rect = trigger.getBoundingClientRect();
  const popoverWidth = weatherHourlyPopover.offsetWidth || Math.min(352, window.innerWidth - 16);
  const popoverHeight = weatherHourlyPopover.offsetHeight || Math.min(480, window.innerHeight - 16);
  const gap = 10;
  const viewportPadding = 8;
  let left = rect.right + gap;
  if (left + popoverWidth > window.innerWidth - viewportPadding) {
    left = rect.left - popoverWidth - gap;
  }
  if (left < viewportPadding) {
    left = Math.max(viewportPadding, Math.min(rect.left, window.innerWidth - popoverWidth - viewportPadding));
  }
  const top = Math.max(
    viewportPadding,
    Math.min(rect.top - 12, window.innerHeight - popoverHeight - viewportPadding)
  );
  weatherHourlyPopover.style.left = `${Math.round(left)}px`;
  weatherHourlyPopover.style.top = `${Math.round(top)}px`;
}

function closeWeatherHourlyPopover({ restoreFocus = false } = {}) {
  weatherHourlyRequestGeneration += 1;
  const trigger = weatherHourlyTrigger;
  weatherHourlyTrigger = null;
  trigger?.setAttribute("aria-expanded", "false");
  if (weatherHourlyPopover && weatherHourlyPopoverIsOpen()) {
    if (typeof weatherHourlyPopover.hidePopover === "function") {
      weatherHourlyPopover.hidePopover();
    } else {
      delete weatherHourlyPopover.dataset.fallbackOpen;
      weatherHourlyPopover.hidden = true;
    }
  }
  if (restoreFocus && trigger?.isConnected) trigger.focus({ preventScroll: true });
}

function renderWeatherHourlyForecast(date, data) {
  if (!weatherHourlyList || !weatherHourlyStatus || !weatherHourlySummary) return;
  const forecast = weatherForecastByDate.get(date);
  const hours = Array.isArray(data?.hours) ? data.hours : [];
  weatherHourlySummary.textContent = weatherHighLowLabel(forecast);
  weatherHourlyList.replaceChildren();

  if (!hours.length) {
    const selectedDate = parseDateKey(date);
    const isPast = selectedDate < startOfDay(new Date());
    weatherHourlyStatus.textContent = isPast
      ? "Hourly history is available for only the previous 24 hours."
      : "An hourly forecast is not available for this date yet.";
    weatherHourlyStatus.hidden = false;
    return;
  }

  weatherHourlyStatus.hidden = true;
  const fragment = document.createDocumentFragment();
  for (const hour of hours) {
    const row = document.createElement("div");
    row.className = "weather-hour-row";

    const time = document.createElement("time");
    time.className = "weather-hour-time";
    time.dateTime = `${hour.date}T${String(hour.hour).padStart(2, "0")}:00`;
    time.textContent = formatWeatherHour(hour.hour);

    const glyph = document.createElement("span");
    glyph.className = `weather-symbol weather-icon-${hour.icon}`;
    glyph.setAttribute("aria-hidden", "true");

    const description = document.createElement("span");
    description.className = "weather-hour-description";
    description.textContent = hour.description;

    const temperature = document.createElement("strong");
    temperature.className = "weather-hour-temperature";
    temperature.textContent = formatWeatherTemperature(hour.temperatureC);
    temperature.setAttribute("aria-label", Number.isFinite(hour.temperatureC)
      ? `${hour.temperatureC} degrees Celsius`
      : "Temperature unavailable");

    row.append(time, glyph, description, temperature);
    fragment.appendChild(row);
  }
  weatherHourlyList.appendChild(fragment);
}

async function openWeatherHourlyForecast(trigger, date, forecast) {
  if (!weatherHourlyPopover || !currentRoom?.code) return;
  hideWeatherHighLowTooltip({ immediate: true });
  if (weatherHourlyTrigger && weatherHourlyTrigger !== trigger) {
    weatherHourlyTrigger.setAttribute("aria-expanded", "false");
  }
  weatherHourlyTrigger = trigger;
  trigger.setAttribute("aria-expanded", "true");
  weatherHourlyTitle.textContent = formatFullDate(parseDateKey(date));
  weatherHourlySummary.textContent = weatherHighLowLabel(forecast);
  weatherHourlyList.replaceChildren();
  weatherHourlyStatus.hidden = false;
  weatherHourlyStatus.textContent = "Loading hourly forecast\u2026";
  showWeatherHourlyPopover();
  positionWeatherHourlyPopover(trigger);

  const cached = weatherHourlyByDate.get(date);
  if (cached) {
    renderWeatherHourlyForecast(date, cached);
    positionWeatherHourlyPopover(trigger);
    return;
  }

  const generation = ++weatherHourlyRequestGeneration;
  const requestRoomCode = currentRoom.code;
  try {
    const coordinates = await requestWeatherLocation();
    const nextLocationKey = `${coordinates.latitude},${coordinates.longitude}`;
    if (weatherLocationKey && weatherLocationKey !== nextLocationKey) weatherHourlyByDate = new Map();
    weatherLocationKey = nextLocationKey;
    const data = await fetchJson(`/api/rooms/${requestRoomCode}/weather/hourly`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...coordinates, date })
    });
    if (
      generation !== weatherHourlyRequestGeneration ||
      currentRoom?.code !== requestRoomCode ||
      weatherHourlyTrigger !== trigger
    ) return;
    const hours = [];
    for (const rawHour of Array.isArray(data.hours) ? data.hours : []) {
      const hour = normalizedHourlyWeather(rawHour, date);
      if (hour) hours.push(hour);
    }
    const normalized = {
      source: ["history", "mixed"].includes(data.source) ? data.source : "forecast",
      hours: hours.sort((left, right) => left.hour - right.hour)
    };
    weatherHourlyByDate.set(date, normalized);
    renderWeatherHourlyForecast(date, normalized);
    positionWeatherHourlyPopover(trigger);
  } catch {
    if (generation !== weatherHourlyRequestGeneration || weatherHourlyTrigger !== trigger) return;
    weatherHourlyList.replaceChildren();
    weatherHourlyStatus.hidden = false;
    weatherHourlyStatus.textContent = "Hourly weather is unavailable right now. Try again shortly.";
  }
}

function createWeatherSymbol(date, placement) {
  const forecast = weatherForecastByDate.get(dateKey(date));
  if (!forecast) return null;
  const key = dateKey(date);
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = [
    "weather-trigger",
    `weather-symbol--${placement}`,
    forecast.icon === "thermometer-sun" ? "is-hot" : "",
    forecast.icon === "thermometer-snowflake" ? "is-freezing" : ""
  ].filter(Boolean).join(" ");
  const label = weatherForecastLabel(forecast);
  trigger.dataset.weatherDate = key;
  trigger.setAttribute("aria-label", `${label}. Open hourly weather.`);
  trigger.setAttribute("aria-describedby", "weatherHighLowTooltip");
  trigger.setAttribute("aria-haspopup", "dialog");
  trigger.setAttribute("aria-controls", "weatherHourlyPopover");
  trigger.setAttribute("aria-expanded", "false");
  const symbol = document.createElement("span");
  symbol.className = `weather-symbol weather-icon-${forecast.icon}`;
  symbol.setAttribute("aria-hidden", "true");
  trigger.appendChild(symbol);
  trigger.addEventListener("pointerenter", () => showWeatherHighLowTooltip(trigger, forecast));
  trigger.addEventListener("pointerleave", () => hideWeatherHighLowTooltip());
  trigger.addEventListener("focus", () => showWeatherHighLowTooltip(trigger, forecast));
  trigger.addEventListener("blur", () => hideWeatherHighLowTooltip());
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    void openWeatherHourlyForecast(trigger, key, forecast);
  });
  return trigger;
}

closeWeatherHourlyButton?.addEventListener("click", () => {
  closeWeatherHourlyPopover({ restoreFocus: true });
});

weatherHourlyPopover?.addEventListener("toggle", (event) => {
  if (event.newState === "open") return;
  weatherHourlyRequestGeneration += 1;
  weatherHourlyTrigger?.setAttribute("aria-expanded", "false");
  weatherHourlyTrigger = null;
});

window.addEventListener("resize", () => {
  hideWeatherHighLowTooltip({ immediate: true });
  if (weatherHourlyPopoverIsOpen() && weatherHourlyTrigger?.isConnected) {
    positionWeatherHourlyPopover(weatherHourlyTrigger);
  }
});

function roundedWeatherCoordinate(value) {
  const rounded = Math.round(Number(value) * 100) / 100;
  return Object.is(rounded, -0) ? 0 : rounded;
}

function clearWeatherForecast({ rerender = false } = {}) {
  const hadWeather = weatherForecastByDate.size > 0 || weatherHourlyByDate.size > 0 || weatherForecastFetchedAt > 0;
  closeWeatherHourlyPopover();
  hideWeatherHighLowTooltip({ immediate: true });
  weatherForecastByDate = new Map();
  weatherHourlyByDate = new Map();
  weatherForecastFetchedAt = 0;
  weatherRetryAfter = 0;
  weatherLocationKey = "";
  if (rerender && hadWeather && currentView !== "year") {
    renderCalendar();
    return;
  }
}

function markWeatherLocationUnavailable() {
  weatherLocationUnavailable = true;
  clearWeatherForecast({ rerender: true });
}

function requestWeatherLocation() {
  if (weatherLocationPromise) return weatherLocationPromise;
  if (!navigator.geolocation) {
    markWeatherLocationUnavailable();
    return Promise.reject(new Error("Location is unavailable in this browser."));
  }
  weatherLocationPromise = new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition((position) => {
      const latitude = roundedWeatherCoordinate(position.coords?.latitude);
      const longitude = roundedWeatherCoordinate(position.coords?.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        markWeatherLocationUnavailable();
        reject(new Error("The browser did not provide a valid location."));
        return;
      }
      weatherLocationUnavailable = false;
      resolve({ latitude, longitude });
    }, (error) => {
      markWeatherLocationUnavailable();
      reject(error);
    }, {
      enableHighAccuracy: false,
      maximumAge: 30 * 60 * 1000,
      timeout: 10_000
    });
  }).finally(() => {
    // Keep only an in-flight lookup. Every stale forecast re-checks permission/location.
    weatherLocationPromise = null;
  });
  return weatherLocationPromise;
}

async function observeWeatherLocationPermission() {
  if (!navigator.permissions?.query) return;
  try {
    const permissionStatus = await navigator.permissions.query({ name: "geolocation" });
    weatherGeolocationPermissionStatus = permissionStatus;
    const handlePermissionChange = () => {
      if (weatherGeolocationPermissionStatus !== permissionStatus) return;
      if (permissionStatus.state === "denied") {
        markWeatherLocationUnavailable();
        return;
      }
      weatherLocationUnavailable = false;
      weatherRetryAfter = 0;
      if (currentView !== "year") void ensureWeatherForecast();
    };
    permissionStatus.addEventListener?.("change", handlePermissionChange);
    if (permissionStatus.state === "denied") markWeatherLocationUnavailable();
  } catch {
    // The Permissions API is optional; geolocation still handles consent itself.
  }
}

async function ensureWeatherForecast() {
  if (
    currentView === "year" ||
    !currentRoom?.code ||
    appConfig?.weatherReady !== true ||
    weatherLocationUnavailable
  ) {
    return false;
  }
  const now = Date.now();
  if (weatherForecastFetchedAt && now - weatherForecastFetchedAt < weatherForecastFreshnessMs) return true;
  if (weatherRetryAfter > now) return false;
  if (weatherLoadPromise) return weatherLoadPromise;

  const requestRoomCode = currentRoom.code;
  weatherLoadPromise = (async () => {
    try {
      const coordinates = await requestWeatherLocation();
      const nextLocationKey = `${coordinates.latitude},${coordinates.longitude}`;
      if (weatherLocationKey && weatherLocationKey !== nextLocationKey) weatherHourlyByDate = new Map();
      weatherLocationKey = nextLocationKey;
      const data = await fetchJson(`/api/rooms/${requestRoomCode}/weather/forecast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coordinates)
      });
      if (currentRoom?.code !== requestRoomCode) return false;
      const nextForecast = new Map();
      for (const rawEntry of Array.isArray(data.forecast) ? data.forecast : []) {
        const entry = normalizedWeatherForecast(rawEntry);
        if (entry) nextForecast.set(entry.date, entry);
      }
      weatherForecastByDate = nextForecast;
      weatherForecastFetchedAt = Date.now();
      weatherRetryAfter = 0;
      if (currentView !== "year") renderCalendar();
      return true;
    } catch {
      weatherRetryAfter = Date.now() + weatherForecastRetryMs;
      return false;
    } finally {
      weatherLoadPromise = null;
      if (currentRoom?.code && currentRoom.code !== requestRoomCode && currentView !== "year") {
        window.setTimeout(() => { void ensureWeatherForecast(); }, 0);
      }
    }
  })();
  return weatherLoadPromise;
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

const timePickerStepMinutes = 15;
const eventTimePickerSlots = Object.freeze(generateTimePickerSlots(timePickerStepMinutes));
const eventTimePickers = [
  {
    context: "composer",
    kind: "start",
    canonicalInput: eventStartInput,
    displayInput: eventStartTimeInput,
    field: eventStartTimeField,
    dropdown: eventStartTimeDropdown,
    listbox: eventStartTimeListbox,
    startCanonicalInput: eventStartInput,
    form: eventForm,
    options: [],
    activeIndex: -1,
    manualDirty: false
  },
  {
    context: "composer",
    kind: "end",
    canonicalInput: eventEndInput,
    displayInput: eventEndTimeInput,
    field: eventEndTimeField,
    dropdown: eventEndTimeDropdown,
    listbox: eventEndTimeListbox,
    startCanonicalInput: eventStartInput,
    form: eventForm,
    options: [],
    activeIndex: -1,
    manualDirty: false
  },
  {
    context: "detail",
    kind: "start",
    canonicalInput: detailStartInput,
    displayInput: detailStartTimeInput,
    field: document.querySelector("#detailStartTimeField"),
    dropdown: document.querySelector("#detailStartTimeDropdown"),
    listbox: document.querySelector("#detailStartTimeListbox"),
    startCanonicalInput: detailStartInput,
    form: eventPanelForm,
    options: [],
    activeIndex: -1,
    manualDirty: false
  },
  {
    context: "detail",
    kind: "end",
    canonicalInput: detailEndInput,
    displayInput: detailEndTimeInput,
    field: document.querySelector("#detailEndTimeField"),
    dropdown: document.querySelector("#detailEndTimeDropdown"),
    listbox: document.querySelector("#detailEndTimeListbox"),
    startCanonicalInput: detailStartInput,
    form: eventPanelForm,
    options: [],
    activeIndex: -1,
    manualDirty: false
  }
].filter((picker) => (
  picker.canonicalInput &&
  picker.displayInput &&
  picker.field &&
  picker.dropdown &&
  picker.listbox
));

function generateTimePickerSlots(stepMinutes = 15) {
  const normalizedStep = Number.isFinite(stepMinutes) && stepMinutes > 0 ? Math.round(stepMinutes) : 15;
  const slots = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += normalizedStep) {
    slots.push(minutes);
  }
  return slots;
}

function timeInputValueToMinutes(value) {
  const match = String(value || "").match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return (hours * 60) + minutes;
}

function minutesToTimeInputValue(minutes) {
  const normalized = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

function formatTimePickerLabel(minutes) {
  const normalized = ((Math.round(minutes) % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minuteValue = normalized % 60;
  const period = hours >= 12 ? "pm" : "am";
  return `${hours % 12 || 12}:${String(minuteValue).padStart(2, "0")}${period}`;
}

function formatTimePickerDuration(durationMinutes) {
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return "";
  if (durationMinutes < 60) return `(${durationMinutes} mins)`;
  if (durationMinutes === 60) return "(1 hr)";
  const hours = Number((durationMinutes / 60).toFixed(2));
  return `(${hours} hrs)`;
}

function parseFuzzyTimeInput(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/\s+/g, "");
  if (!normalized) return null;

  const meridiemMatch = normalized.match(/(am|pm)$/);
  const meridiem = meridiemMatch?.[1] || "";
  const clockText = meridiem ? normalized.slice(0, -meridiem.length) : normalized;
  let hours;
  let minutes = 0;

  if (/^\d{1,2}:\d{1,2}$/.test(clockText)) {
    const [hourText, minuteText] = clockText.split(":");
    hours = Number(hourText);
    minutes = Number(minuteText);
  } else if (/^\d{1,4}$/.test(clockText)) {
    if (clockText.length <= 2) {
      hours = Number(clockText);
    } else {
      const hourDigits = clockText.length === 3 ? 1 : 2;
      hours = Number(clockText.slice(0, hourDigits));
      minutes = Number(clockText.slice(hourDigits));
    }
  } else {
    return null;
  }

  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || minutes < 0 || minutes > 59) {
    return null;
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) return null;
    hours = (hours % 12) + (meridiem === "pm" ? 12 : 0);
  } else {
    if (hours < 0 || hours > 23) return null;
    if (hours > 0 && hours < 12) hours += 12;
  }

  return (hours * 60) + minutes;
}

function eventTimePickerOptions(picker) {
  const startMinutes = timeInputValueToMinutes(picker.startCanonicalInput?.value);
  if (picker.kind !== "end" || startMinutes === null) {
    return eventTimePickerSlots.map((minutes) => ({
      minutes,
      timelineMinutes: minutes,
      durationMinutes: null
    }));
  }

  const options = eventTimePickerSlots
    .filter((minutes) => minutes > startMinutes)
    .map((minutes) => ({
      minutes,
      timelineMinutes: minutes,
      durationMinutes: minutes - startMinutes
    }));

  options.push({
    minutes: 0,
    timelineMinutes: 1440,
    durationMinutes: 1440 - startMinutes
  });
  return options;
}

function eventTimePickerTargetMinutes(picker) {
  const canonicalMinutes = timeInputValueToMinutes(picker.canonicalInput.value);
  const startMinutes = timeInputValueToMinutes(picker.startCanonicalInput?.value);
  if (canonicalMinutes !== null) {
    return picker.kind === "end" && canonicalMinutes === 0 && startMinutes !== null
      ? 1440
      : canonicalMinutes;
  }

  if (picker.kind === "end" && startMinutes !== null) {
    return Math.min(1440, startMinutes + 60);
  }

  const now = new Date();
  return Math.min(1425, Math.round(((now.getHours() * 60) + now.getMinutes()) / timePickerStepMinutes) * timePickerStepMinutes);
}

function closestEventTimePickerOptionIndex(options, targetMinutes) {
  if (!options.length) return -1;
  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;
  options.forEach((option, index) => {
    const distance = Math.abs(option.timelineMinutes - targetMinutes);
    if (distance < closestDistance) {
      closestIndex = index;
      closestDistance = distance;
    }
  });
  return closestIndex;
}

function setEventTimePickerActiveIndex(picker, index, { scroll = false } = {}) {
  if (!picker.options.length) return;
  picker.activeIndex = Math.max(0, Math.min(picker.options.length - 1, index));
  const optionNodes = [...picker.listbox.querySelectorAll(".time-picker-option")];
  optionNodes.forEach((optionNode, optionIndex) => {
    const active = optionIndex === picker.activeIndex;
    optionNode.classList.toggle("is-active", active);
    optionNode.setAttribute("aria-selected", String(active));
  });

  const activeNode = optionNodes[picker.activeIndex];
  if (activeNode) {
    picker.displayInput.setAttribute("aria-activedescendant", activeNode.id);
    if (scroll) {
      const targetTop = activeNode.offsetTop - ((picker.listbox.clientHeight - activeNode.offsetHeight) / 2);
      picker.listbox.scrollTop = Math.max(0, targetTop);
    }
  }
}

function renderEventTimePicker(picker) {
  picker.options = eventTimePickerOptions(picker);
  const canonicalMinutes = timeInputValueToMinutes(picker.canonicalInput.value);
  const startMinutes = timeInputValueToMinutes(picker.startCanonicalInput?.value);
  const fragment = document.createDocumentFragment();

  picker.options.forEach((option, index) => {
    const optionNode = document.createElement("button");
    optionNode.type = "button";
    optionNode.className = "time-picker-option";
    optionNode.id = `${picker.listbox.id}-option-${option.timelineMinutes}`;
    optionNode.dataset.optionIndex = String(index);
    optionNode.tabIndex = -1;
    optionNode.setAttribute("role", "option");
    optionNode.setAttribute("aria-selected", "false");

    const timeLabel = document.createElement("span");
    timeLabel.className = "time-picker-clock";
    timeLabel.textContent = formatTimePickerLabel(option.minutes);
    optionNode.appendChild(timeLabel);

    if (picker.kind === "end" && option.durationMinutes !== null) {
      const durationLabel = document.createElement("span");
      durationLabel.className = "time-picker-duration";
      durationLabel.textContent = formatTimePickerDuration(option.durationMinutes);
      optionNode.appendChild(durationLabel);
    }

    const selected = canonicalMinutes !== null && (
      option.minutes === canonicalMinutes &&
      (picker.kind !== "end" || canonicalMinutes !== 0 || option.timelineMinutes === 1440 || startMinutes === null)
    );
    optionNode.classList.toggle("is-selected", selected);
    optionNode.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      selectEventTimePickerOption(picker, option);
    });
    optionNode.addEventListener("mouseenter", () => {
      picker.manualDirty = false;
      setEventTimePickerActiveIndex(picker, index);
    });
    fragment.appendChild(optionNode);
  });

  picker.listbox.replaceChildren(fragment);
  picker.activeIndex = closestEventTimePickerOptionIndex(picker.options, eventTimePickerTargetMinutes(picker));
  setEventTimePickerActiveIndex(picker, picker.activeIndex);
}

function positionEventTimePicker(picker) {
  if (picker.dropdown.hidden) return;
  picker.dropdown.classList.remove("opens-above");
  const fieldRect = picker.field.getBoundingClientRect();
  const dropdownHeight = Math.min(picker.dropdown.scrollHeight || 240, 240);
  const spaceBelow = window.innerHeight - fieldRect.bottom - 8;
  const spaceAbove = fieldRect.top - 8;
  if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
    picker.dropdown.classList.add("opens-above");
  }
}

function syncEventTimePickerDisplay(picker) {
  const minutes = timeInputValueToMinutes(picker.canonicalInput.value);
  picker.displayInput.value = minutes === null ? "" : formatTimePickerLabel(minutes);
  picker.displayInput.setCustomValidity("");
  picker.displayInput.removeAttribute("aria-invalid");
  picker.manualDirty = false;
}

function syncEventTimePickerDisplays() {
  eventTimePickers
    .filter((picker) => picker.field.isConnected)
    .forEach(syncEventTimePickerDisplay);
}

function setEventTimePickerCanonicalValue(picker, minutes) {
  picker.canonicalInput.value = minutesToTimeInputValue(minutes);
  syncEventTimePickerDisplay(picker);
  picker.canonicalInput.dispatchEvent(new Event("input", { bubbles: true }));
  picker.canonicalInput.dispatchEvent(new Event("change", { bubbles: true }));
}

function commitEventTimePickerInput(picker, { showFeedback = true } = {}) {
  const minutes = parseFuzzyTimeInput(picker.displayInput.value);
  if (minutes === null) {
    const message = "Enter a valid time, such as 4, 415, or 4:15pm.";
    picker.displayInput.setCustomValidity(message);
    picker.displayInput.setAttribute("aria-invalid", "true");
    if (showFeedback && picker.context === "composer") {
      setEventFormFeedback(message, "error");
    } else if (showFeedback && picker.context === "detail" && detailInviteeFeedback) {
      detailInviteeFeedback.dataset.persistedMessage = "";
      detailInviteeFeedback.textContent = message;
    }
    return false;
  }

  setEventTimePickerCanonicalValue(picker, minutes);
  if (showFeedback && picker.context === "composer" && eventFormFeedback?.classList.contains("is-error")) {
    setEventFormFeedback();
  }
  if (
    picker.kind === "start" &&
    activeEventTimePicker?.kind === "end" &&
    activeEventTimePicker.startCanonicalInput === picker.canonicalInput
  ) {
    renderEventTimePicker(activeEventTimePicker);
  }
  return true;
}

function closeEventTimePicker({ commit = false, restoreFocus = false } = {}) {
  const picker = activeEventTimePicker;
  if (!picker) return true;
  const committed = !commit || commitEventTimePickerInput(picker);
  if (!commit) syncEventTimePickerDisplay(picker);
  picker.dropdown.hidden = true;
  picker.dropdown.classList.remove("is-open", "opens-above");
  picker.displayInput.setAttribute("aria-expanded", "false");
  picker.displayInput.removeAttribute("aria-activedescendant");
  picker.field.classList.remove("is-open");
  activeEventTimePicker = null;
  if (restoreFocus) picker.displayInput.focus({ preventScroll: true });
  return committed;
}

function openEventTimePicker(picker) {
  if (picker.displayInput.disabled) return;
  if (activeEventTimePicker && activeEventTimePicker !== picker) {
    closeEventTimePicker({ commit: true });
  }

  activeEventTimePicker = picker;
  picker.manualDirty = false;
  renderEventTimePicker(picker);
  picker.dropdown.hidden = false;
  picker.dropdown.classList.add("is-open");
  picker.displayInput.setAttribute("aria-expanded", "true");
  picker.field.classList.add("is-open");
  positionEventTimePicker(picker);
  requestAnimationFrame(() => {
    setEventTimePickerActiveIndex(picker, picker.activeIndex, { scroll: true });
    picker.displayInput.select();
  });
}

function selectEventTimePickerOption(picker, option) {
  setEventTimePickerCanonicalValue(picker, option.minutes);
  if (picker.context === "composer" && eventFormFeedback?.classList.contains("is-error")) {
    setEventFormFeedback();
  }
  if (picker.context === "detail" && detailInviteeFeedback?.textContent?.startsWith("Enter a valid time")) {
    detailInviteeFeedback.textContent = "";
  }
  closeEventTimePicker();
  picker.displayInput.focus({ preventScroll: true });
  picker.displayInput.setSelectionRange(
    picker.displayInput.value.length,
    picker.displayInput.value.length
  );
}

function moveEventTimePickerSelection(picker, direction) {
  if (activeEventTimePicker !== picker) openEventTimePicker(picker);
  if (activeEventTimePicker !== picker || !picker.options.length) return;
  picker.manualDirty = false;
  const fallbackIndex = closestEventTimePickerOptionIndex(picker.options, eventTimePickerTargetMinutes(picker));
  const currentIndex = picker.activeIndex < 0 ? fallbackIndex : picker.activeIndex;
  setEventTimePickerActiveIndex(picker, currentIndex + direction, { scroll: true });
}

function handleEventTimePickerKeydown(event, picker) {
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    moveEventTimePickerSelection(picker, event.key === "ArrowDown" ? 1 : -1);
    return;
  }

  if (event.key === "Home" && activeEventTimePicker === picker) {
    event.preventDefault();
    picker.manualDirty = false;
    setEventTimePickerActiveIndex(picker, 0, { scroll: true });
    return;
  }

  if (event.key === "End" && activeEventTimePicker === picker) {
    event.preventDefault();
    picker.manualDirty = false;
    setEventTimePickerActiveIndex(picker, picker.options.length - 1, { scroll: true });
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    event.stopPropagation();
    if (picker.manualDirty || activeEventTimePicker !== picker) {
      if (commitEventTimePickerInput(picker)) closeEventTimePicker();
      return;
    }
    const option = picker.options[picker.activeIndex];
    if (option) selectEventTimePickerOption(picker, option);
    return;
  }

  if (event.key === "Escape" && activeEventTimePicker === picker) {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeEventTimePicker({ restoreFocus: true });
    return;
  }

  if (event.key === "Tab" && activeEventTimePicker === picker) {
    if (!commitEventTimePickerInput(picker)) {
      event.preventDefault();
      return;
    }
    closeEventTimePicker();
  }
}

function registerEventTimePickerField(field) {
  const existing = eventTimePickers.find((picker) => picker.field === field);
  if (existing) return existing;

  const canonicalInput = field.querySelector("input[type='hidden']");
  const displayInput = field.querySelector(".time-picker-input");
  const dropdown = field.querySelector(".time-picker-dropdown");
  const listbox = field.querySelector(".time-picker-list");
  if (!canonicalInput || !displayInput || !dropdown || !listbox) return null;

  const form = field.closest("form");
  const context = field.closest("#commandCentreDialog")
    ? "command"
    : field.closest("#detailPanel")
      ? "detail"
      : "composer";
  const startField = field.dataset.timePicker === "start"
    ? field
    : form?.querySelector(".time-picker-field[data-time-picker='start']");
  const picker = {
    context,
    kind: field.dataset.timePicker === "end" ? "end" : "start",
    canonicalInput,
    displayInput,
    field,
    dropdown,
    listbox,
    startCanonicalInput: startField?.querySelector("input[type='hidden']") || canonicalInput,
    form,
    options: [],
    activeIndex: -1,
    manualDirty: false
  };
  eventTimePickers.push(picker);
  return picker;
}

function initializeEventTimePickers(root = document) {
  for (let index = eventTimePickers.length - 1; index >= 0; index -= 1) {
    if (!eventTimePickers[index].field.isConnected) eventTimePickers.splice(index, 1);
  }

  const fields = [
    ...(root.matches?.(".time-picker-field[data-time-picker]") ? [root] : []),
    ...root.querySelectorAll(".time-picker-field[data-time-picker]")
  ];
  fields.forEach(registerEventTimePickerField);

  eventTimePickers
    .filter((picker) => picker.field.isConnected && (root === document || root.contains(picker.field)))
    .forEach((picker) => {
    if (picker.field.dataset.timePickerReady === "true") return;
    picker.field.dataset.timePickerReady = "true";

    picker.displayInput.addEventListener("focus", () => {
      openEventTimePicker(picker);
    });
    picker.displayInput.addEventListener("click", () => {
      if (activeEventTimePicker !== picker) openEventTimePicker(picker);
    });
    picker.displayInput.addEventListener("input", () => {
      picker.manualDirty = true;
      picker.displayInput.setCustomValidity("");
      picker.displayInput.removeAttribute("aria-invalid");
      const parsedMinutes = parseFuzzyTimeInput(picker.displayInput.value);
      if (parsedMinutes !== null && activeEventTimePicker === picker) {
        const targetMinutes = picker.kind === "end" && parsedMinutes === 0 && timeInputValueToMinutes(picker.startCanonicalInput?.value) !== null
          ? 1440
          : parsedMinutes;
        const nextIndex = closestEventTimePickerOptionIndex(picker.options, targetMinutes);
        setEventTimePickerActiveIndex(picker, nextIndex, { scroll: true });
      }
    });
    picker.displayInput.addEventListener("keydown", (event) => {
      handleEventTimePickerKeydown(event, picker);
    });
    picker.displayInput.addEventListener("blur", () => {
      window.setTimeout(() => {
        if (activeEventTimePicker !== picker || picker.field.contains(document.activeElement)) return;
        closeEventTimePicker({ commit: true });
      }, 0);
    });
  });

  eventTimePickers
    .filter((picker) => picker.field.isConnected && (root === document || root.contains(picker.field)))
    .forEach(syncEventTimePickerDisplay);
}

const locationAutocompleteStates = new Set();
let locationAutocompleteOutsideListenerReady = false;

function createLocationAutocompleteSessionToken() {
  const uuid = window.crypto?.randomUUID?.();
  if (uuid) return uuid;
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 36);
}

function locationAutocompleteStateFor(input) {
  for (const state of locationAutocompleteStates) {
    if (state.input === input) return state;
  }
  return null;
}

function setLocationAutocompleteOpen(state, open) {
  if (!state) return;
  if (state.hideTimer) {
    window.clearTimeout(state.hideTimer);
    state.hideTimer = null;
  }
  state.open = Boolean(open);
  state.input.setAttribute("aria-expanded", String(state.open));
  state.host.classList.toggle("is-autocomplete-open", state.open);
  if (state.open) {
    state.menu.hidden = false;
    requestAnimationFrame(() => state.menu.classList.add("is-open"));
    return;
  }
  state.menu.classList.remove("is-open");
  state.input.removeAttribute("aria-activedescendant");
  state.hideTimer = window.setTimeout(() => {
    if (!state.open) state.menu.hidden = true;
    state.hideTimer = null;
  }, 260);
}

function closeLocationAutocomplete(state, {
  immediate = false,
  resetSession = false
} = {}) {
  if (!state) return;
  if (state.debounceTimer) {
    window.clearTimeout(state.debounceTimer);
    state.debounceTimer = null;
  }
  state.controller?.abort();
  state.controller = null;
  state.requestGeneration += 1;
  state.activeIndex = -1;
  state.optionElements = [];
  if (resetSession) state.sessionToken = "";
  setLocationAutocompleteOpen(state, false);
  if (immediate) {
    if (state.hideTimer) window.clearTimeout(state.hideTimer);
    state.hideTimer = null;
    state.menu.hidden = true;
  }
}

function closeAllLocationAutocompletes({
  exceptHost = null,
  immediate = false,
  resetSession = false
} = {}) {
  for (const state of [...locationAutocompleteStates]) {
    if (!state.input.isConnected) {
      closeLocationAutocomplete(state, { immediate: true, resetSession: true });
      locationAutocompleteStates.delete(state);
      continue;
    }
    if (exceptHost && state.host === exceptHost) continue;
    closeLocationAutocomplete(state, { immediate, resetSession });
  }
}

function setLocationAutocompleteActiveIndex(state, index, { scroll = false } = {}) {
  if (!state.options.length) {
    state.activeIndex = -1;
    state.input.removeAttribute("aria-activedescendant");
    return;
  }
  state.activeIndex = Math.max(0, Math.min(state.options.length - 1, index));
  state.optionElements.forEach((option, optionIndex) => {
    const active = optionIndex === state.activeIndex;
    option.classList.toggle("is-active", active);
    option.setAttribute("aria-selected", String(active));
  });
  const activeOption = state.optionElements[state.activeIndex];
  if (!activeOption) return;
  state.input.setAttribute("aria-activedescendant", activeOption.id);
  if (scroll) activeOption.scrollIntoView({ block: "nearest" });
}

function renderLocationAutocomplete(state, {
  suggestions = [],
  message = ""
} = {}) {
  state.options = Array.isArray(suggestions) ? suggestions.slice(0, 6) : [];
  state.activeIndex = -1;
  state.optionElements = [];
  state.listbox.innerHTML = "";
  state.input.removeAttribute("aria-activedescendant");

  if (state.options.length) {
    state.options.forEach((suggestion, index) => {
      const option = document.createElement("div");
      option.className = "location-autocomplete-option";
      option.id = `${state.input.id}AddressOption${index}`;
      option.dataset.locationOption = String(index);
      option.setAttribute("role", "option");
      option.setAttribute("aria-selected", "false");

      const primary = document.createElement("span");
      primary.className = "location-autocomplete-primary";
      primary.textContent = suggestion.primary || suggestion.label;
      option.appendChild(primary);

      if (suggestion.secondary) {
        const secondary = document.createElement("span");
        secondary.className = "location-autocomplete-secondary";
        secondary.textContent = suggestion.secondary;
        option.appendChild(secondary);
      }

      option.addEventListener("pointerenter", () => {
        setLocationAutocompleteActiveIndex(state, index);
      });
      state.optionElements.push(option);
      state.listbox.appendChild(option);
    });
    state.attribution.hidden = false;
    state.status.textContent = `${state.options.length} address suggestions available.`;
  } else {
    const empty = document.createElement("div");
    empty.className = "location-autocomplete-message";
    empty.textContent = message || "No addresses found. You can keep typing the location manually.";
    state.listbox.appendChild(empty);
    state.attribution.hidden = true;
    state.status.textContent = empty.textContent;
  }
  setLocationAutocompleteOpen(state, true);
}

function selectLocationAutocompleteOption(state, index) {
  const suggestion = state.options[index];
  if (!suggestion?.label) return;
  state.suppressInput = true;
  state.input.value = suggestion.label;
  state.input.dispatchEvent(new Event("input", { bubbles: true }));
  state.input.dispatchEvent(new Event("change", { bubbles: true }));
  closeLocationAutocomplete(state, { immediate: true, resetSession: true });
  state.input.focus({ preventScroll: true });
}

async function requestLocationAutocomplete(state, query) {
  if (!currentRoom?.code || appConfig?.placesReady === false) {
    closeLocationAutocomplete(state, { immediate: true });
    return;
  }
  state.controller?.abort();
  const controller = new AbortController();
  state.controller = controller;
  const generation = ++state.requestGeneration;
  const roomCode = currentRoom.code;
  if (!state.sessionToken) state.sessionToken = createLocationAutocompleteSessionToken();

  try {
    const data = await fetchJson(`/api/rooms/${encodeURIComponent(roomCode)}/places/autocomplete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: query,
        sessionToken: state.sessionToken
      }),
      signal: controller.signal
    });
    if (
      controller.signal.aborted ||
      generation !== state.requestGeneration ||
      state.input.value.trim() !== query
    ) {
      return;
    }
    const suggestions = (Array.isArray(data.suggestions) ? data.suggestions : [])
      .filter((suggestion) => typeof suggestion?.label === "string" && suggestion.label.trim())
      .map((suggestion) => ({
        placeId: String(suggestion.placeId || ""),
        label: suggestion.label.trim(),
        primary: String(suggestion.primary || suggestion.label).trim(),
        secondary: String(suggestion.secondary || "").trim()
      }));
    renderLocationAutocomplete(state, {
      suggestions,
      message: "No addresses found. You can keep typing the location manually."
    });
  } catch (error) {
    if (error?.name === "AbortError" || generation !== state.requestGeneration) return;
    renderLocationAutocomplete(state, {
      message: "Address suggestions are unavailable. You can keep typing the location manually."
    });
  } finally {
    if (state.controller === controller) state.controller = null;
  }
}

function queueLocationAutocomplete(state, { immediate = false } = {}) {
  if (state.suppressInput) {
    state.suppressInput = false;
    return;
  }
  if (state.debounceTimer) window.clearTimeout(state.debounceTimer);
  state.controller?.abort();
  state.controller = null;
  const query = state.input.value.trim();
  if (query.length < 3 || !currentRoom?.code || appConfig?.placesReady === false) {
    closeLocationAutocomplete(state, { immediate: true });
    return;
  }
  renderLocationAutocomplete(state, { message: "Searching addresses..." });
  state.debounceTimer = window.setTimeout(() => {
    state.debounceTimer = null;
    requestLocationAutocomplete(state, query);
  }, immediate ? 0 : 260);
}

function handleLocationAutocompleteKeydown(event, state) {
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    if (!state.open) {
      queueLocationAutocomplete(state, { immediate: true });
      return;
    }
    if (!state.options.length) return;
    event.preventDefault();
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const fallback = direction > 0 ? 0 : state.options.length - 1;
    setLocationAutocompleteActiveIndex(
      state,
      state.activeIndex < 0 ? fallback : state.activeIndex + direction,
      { scroll: true }
    );
    return;
  }
  if (event.key === "Enter" && state.open && state.activeIndex >= 0) {
    event.preventDefault();
    event.stopPropagation();
    selectLocationAutocompleteOption(state, state.activeIndex);
    return;
  }
  if (event.key === "Escape" && state.open) {
    event.preventDefault();
    event.stopPropagation();
    closeLocationAutocomplete(state, { immediate: true, resetSession: true });
    return;
  }
  if (event.key === "Tab" && state.open) {
    closeLocationAutocomplete(state, { immediate: true, resetSession: true });
  }
}

function initializeLocationAutocomplete(input) {
  if (!input || input.dataset.locationAutocompleteReady === "true") {
    return input ? locationAutocompleteStateFor(input) : null;
  }
  const host = input.closest(".location-autocomplete-host");
  const listbox = document.getElementById(input.getAttribute("aria-controls"));
  const menu = host?.querySelector(".location-autocomplete-menu");
  const status = document.getElementById(input.getAttribute("aria-describedby"));
  const attribution = menu?.querySelector(".location-autocomplete-attribution");
  if (!host || !menu || !listbox || !status || !attribution) return null;

  const state = {
    input,
    host,
    menu,
    listbox,
    status,
    attribution,
    open: false,
    options: [],
    optionElements: [],
    activeIndex: -1,
    sessionToken: "",
    debounceTimer: null,
    hideTimer: null,
    controller: null,
    requestGeneration: 0,
    suppressInput: false
  };
  input.dataset.locationAutocompleteReady = "true";
  attribution.hidden = true;
  locationAutocompleteStates.add(state);

  input.addEventListener("focus", () => {
    if (!state.sessionToken) state.sessionToken = createLocationAutocompleteSessionToken();
    if (input.value.trim().length >= 3) queueLocationAutocomplete(state);
  });
  input.addEventListener("input", () => queueLocationAutocomplete(state));
  input.addEventListener("keydown", (event) => handleLocationAutocompleteKeydown(event, state));
  input.addEventListener("blur", () => {
    window.setTimeout(() => {
      if (state.host.contains(document.activeElement)) return;
      closeLocationAutocomplete(state, { resetSession: true });
    }, 0);
  });
  listbox.addEventListener("pointerdown", (event) => {
    const option = event.target.closest("[data-location-option]");
    if (!option) return;
    event.preventDefault();
    selectLocationAutocompleteOption(state, Number(option.dataset.locationOption));
  });

  if (!locationAutocompleteOutsideListenerReady) {
    locationAutocompleteOutsideListenerReady = true;
    document.addEventListener("pointerdown", (event) => {
      const hostTarget = event.target.closest(".location-autocomplete-host");
      closeAllLocationAutocompletes({
        exceptHost: hostTarget,
        resetSession: !hostTarget
      });
    }, true);
  }
  return state;
}

window.initializeLocationAutocomplete = initializeLocationAutocomplete;
window.closeLocationAutocompletes = closeAllLocationAutocompletes;

function commitEventTimePickersBeforeSubmit(event) {
  const form = event.currentTarget;
  initializeEventTimePickers(form);
  for (const picker of eventTimePickers.filter((entry) => entry.form === form && entry.field.isConnected)) {
    if (picker.displayInput.disabled) continue;
    if (commitEventTimePickerInput(picker, { showFeedback: false })) continue;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (picker.context === "composer") {
      setEventFormFeedback("Pick a valid event time.", "error");
    } else if (picker.context === "detail" && detailInviteeFeedback) {
      detailInviteeFeedback.dataset.persistedMessage = "";
      detailInviteeFeedback.textContent = "Pick a valid event time.";
    }
    picker.displayInput.focus({ preventScroll: true });
    picker.displayInput.select();
    return false;
  }
  if (activeEventTimePicker?.form === form) closeEventTimePicker();
  return true;
}

function commitTimePickersWithin(root) {
  if (!root) return true;
  initializeEventTimePickers(root);
  for (const picker of eventTimePickers.filter((entry) => entry.field.isConnected && root.contains(entry.field))) {
    if (picker.displayInput.disabled) continue;
    if (commitEventTimePickerInput(picker, { showFeedback: false })) continue;
    picker.displayInput.focus({ preventScroll: true });
    picker.displayInput.select();
    return false;
  }
  if (activeEventTimePicker && root.contains(activeEventTimePicker.field)) closeEventTimePicker();
  return true;
}

window.CommonGroundTimePicker = {
  initialize: initializeEventTimePickers,
  commit: commitTimePickersWithin,
  close({ commit = false } = {}) {
    if (!activeEventTimePicker) return true;
    return closeEventTimePicker({ commit });
  },
  setDisabled(root, disabled) {
    if (!root) return;
    initializeEventTimePickers(root);
    for (const picker of eventTimePickers.filter((entry) => entry.field.isConnected && root.contains(entry.field))) {
      picker.displayInput.disabled = Boolean(disabled);
      picker.field.classList.toggle("is-disabled", Boolean(disabled));
      if (disabled && activeEventTimePicker === picker) closeEventTimePicker();
    }
  }
};

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
    title: eventTitleInput.value.trim(),
    date: eventDateInput.value,
    endDate: eventEndDateInput?.value,
    start: eventStartInput.value,
    end: eventEndInput.value,
    startDisplay: eventStartTimeInput?.value.trim() || "",
    endDisplay: eventEndTimeInput?.value.trim() || "",
    allDay: Boolean(eventAllDayInput?.checked),
    location: eventLocationInput.value.trim(),
    description: eventDescriptionInput.value.trim(),
    syncToGoogle: Boolean(eventGoogleSyncInput?.checked),
    invitees: [...inviteePicker.querySelectorAll("input[type='checkbox']:checked")]
      .map((input) => input.value)
      .sort()
  });
}

function eventFormHasUnsavedChanges() {
  return eventFormStateSnapshot() !== eventModalInitialState;
}

function setEventFormFeedback(message = "", tone = "") {
  if (!eventFormFeedback) return;
  eventFormFeedback.textContent = message;
  eventFormFeedback.classList.toggle("is-error", tone === "error");
  if (message) replayMotionClass(eventFormFeedback, "motion-feedback");
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
    startDisplay: detailStartTimeInput?.value || "",
    endDisplay: detailEndTimeInput?.value || "",
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
  const connected = isGoogleConnected();
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
  eventStartTimeInput.disabled = Boolean(enabled);
  eventEndTimeInput.disabled = Boolean(enabled);
  if (eventEndDateInput) eventEndDateInput.disabled = !enabled;
  if (enabled && eventEndDateInput && !eventEndDateInput.value) {
    eventEndDateInput.value = eventDateInput.value;
  }
  eventStartInput.closest(".time-picker-field")?.classList.toggle("is-disabled", Boolean(enabled));
  eventEndInput.closest(".time-picker-field")?.classList.toggle("is-disabled", Boolean(enabled));
  if (enabled) closeEventTimePicker();
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
    if (text) replayMotionClass(target, "motion-feedback");
    return;
  }
  const message = document.createElement("span");
  message.className = kind;
  message.textContent = String(text || "");
  target.appendChild(message);
  replayMotionClass(target, "motion-feedback");
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
  if (!emoji) return defaultRoomEmoji;
  try {
    const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    return segmenter.segment(emoji)[Symbol.iterator]().next().value?.segment || defaultRoomEmoji;
  } catch {
    return Array.from(emoji)[0] || defaultRoomEmoji;
  }
}

function normalizedEmojiSearchText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function emojiEntryName(entry) {
  const keyword = entry?.label || entry?.keywords?.find((value) => typeof value === "string" && /[a-z]/i.test(value));
  const label = normalizedEmojiSearchText(keyword || "emoji").replace(/_/g, " ");
  return label ? `${label.charAt(0).toUpperCase()}${label.slice(1)}` : "Emoji";
}

function springMapFor(node) {
  let springMap = emojiSpringStates.get(node);
  if (!springMap) {
    springMap = new Map();
    emojiSpringStates.set(node, springMap);
  }
  return springMap;
}

function stopSpring(node, key) {
  const springMap = emojiSpringStates.get(node);
  const state = springMap?.get(key);
  if (state?.frame) cancelAnimationFrame(state.frame);
  springMap?.delete(key);
}

function springTo(node, key, target, {
  initial = target,
  stiffness,
  damping,
  mass = 1,
  onUpdate,
  onRest
}) {
  if (!node) return;
  const springMap = springMapFor(node);
  let state = springMap.get(key);
  if (!state) {
    state = {
      value: initial,
      velocity: 0,
      target,
      frame: null,
      lastTime: 0,
      onUpdate,
      onRest
    };
    springMap.set(key, state);
  }

  state.target = target;
  state.stiffness = stiffness;
  state.damping = damping;
  state.mass = mass;
  state.onUpdate = onUpdate;
  state.onRest = onRest;

  if (prefersReducedMotion()) {
    if (state.frame) cancelAnimationFrame(state.frame);
    state.frame = null;
    state.value = target;
    state.velocity = 0;
    state.onUpdate?.(target);
    state.onRest?.();
    return;
  }

  const tick = (timestamp) => {
    if (!state.lastTime) state.lastTime = timestamp;
    const elapsed = Math.min(Math.max((timestamp - state.lastTime) / 1000, 1 / 240), 1 / 30);
    state.lastTime = timestamp;
    const steps = Math.max(1, Math.ceil(elapsed / (1 / 120)));
    const step = elapsed / steps;

    for (let index = 0; index < steps; index += 1) {
      const springForce = -state.stiffness * (state.value - state.target);
      const dampingForce = -state.damping * state.velocity;
      state.velocity += ((springForce + dampingForce) / state.mass) * step;
      state.value += state.velocity * step;
    }

    state.onUpdate?.(state.value);
    if (Math.abs(state.velocity) < 0.002 && Math.abs(state.target - state.value) < 0.002) {
      state.value = state.target;
      state.velocity = 0;
      state.frame = null;
      state.lastTime = 0;
      state.onUpdate?.(state.target);
      state.onRest?.();
      return;
    }

    state.frame = requestAnimationFrame(tick);
  };

  if (!state.frame) {
    state.lastTime = performance.now();
    state.onUpdate?.(state.value);
    state.frame = requestAnimationFrame(tick);
  }
}

function setEmojiCellScale(cell, targetScale) {
  springTo(cell, "scale", targetScale, {
    initial: 1,
    stiffness: 400,
    damping: 30,
    mass: 1,
    onUpdate: (value) => {
      cell.style.transform = `translate3d(0, 0, 0) scale(${value.toFixed(4)})`;
    }
  });
}

function applyEmojiPickerMotion(progress) {
  if (!emojiPickerPopover) return;
  emojiPickerState.progress = progress;
  const visualProgress = Math.max(-0.12, Math.min(1.12, progress));
  const opacity = Math.max(0, Math.min(1, progress));
  const scale = 0.95 + (0.05 * visualProgress);
  emojiPickerPopover.style.opacity = opacity.toFixed(4);
  emojiPickerPopover.style.transform = `translate3d(${emojiPickerState.x}px, ${emojiPickerState.y}px, 0) scale(${scale.toFixed(5)})`;
}

function emojiPopoverIsShowing() {
  if (!emojiPickerPopover) return false;
  try {
    return emojiPickerPopover.matches(":popover-open");
  } catch {
    return emojiPickerPopover.dataset.fallbackOpen === "true";
  }
}

function showEmojiPopoverElement() {
  if (!emojiPickerPopover || emojiPopoverIsShowing()) return;
  if (typeof emojiPickerPopover.showPopover === "function") {
    emojiPickerPopover.showPopover();
  } else {
    emojiPickerPopover.dataset.fallbackOpen = "true";
  }
}

function hideEmojiPopoverElement() {
  if (!emojiPickerPopover) return;
  if (typeof emojiPickerPopover.hidePopover === "function" && emojiPopoverIsShowing()) {
    emojiPickerPopover.hidePopover();
  }
  delete emojiPickerPopover.dataset.fallbackOpen;
}

function syncEmojiTrigger(input) {
  if (!input?.id) return;
  const trigger = emojiPickerTriggers.find((candidate) => candidate.dataset.emojiTarget === input.id);
  if (!trigger) return;
  const emoji = normalizeRoomEmoji(input.value);
  if (input.value !== emoji) input.value = emoji;
  const valueNode = trigger.querySelector(".emoji-trigger-value");
  if (valueNode) valueNode.textContent = emoji;
  const entry = emojiKeywordEntryMap.get(emoji);
  trigger.setAttribute("aria-label", `Choose room emoji, current ${entry ? emojiEntryName(entry) : emoji}`);
}

function syncAllEmojiTriggers() {
  for (const trigger of emojiPickerTriggers) {
    syncEmojiTrigger(document.getElementById(trigger.dataset.emojiTarget));
  }
}

async function loadEmojiKeywordDictionary() {
  if (emojiKeywordEntries) return emojiKeywordEntries;
  if (emojiKeywordLoadPromise) return emojiKeywordLoadPromise;

  emojiKeywordLoadPromise = (async () => {
    let dictionary = null;
    const sources = [emojiKeywordDictionaryUrl, emojiKeywordDictionaryFallbackUrl];
    let lastError = null;

    for (const source of sources) {
      try {
        const response = await fetch(source, {
          headers: { Accept: "application/json" },
          mode: source.startsWith("http") ? "cors" : "same-origin",
          credentials: source.startsWith("http") ? "omit" : "same-origin"
        });
        if (!response.ok) {
          throw new Error(`Emoji dictionary response not ok: ${response.status}`);
        }
        dictionary = await response.json();
        if (!dictionary || Array.isArray(dictionary) || typeof dictionary !== "object") {
          throw new Error("Emoji dictionary response is invalid.");
        }
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!dictionary) {
      emojiPickerState.loadError = true;
      if (emojiPickerState.open) renderEmojiPicker();
      throw lastError || new Error("Emoji dictionary could not be loaded.");
    }

    const entries = Object.entries(dictionary)
      .filter(([emoji, keywords]) => emoji && Array.isArray(keywords))
      .map(([emoji, keywords]) => {
        const safeKeywords = keywords.filter((keyword) => typeof keyword === "string");
        const safeLabel = safeKeywords.find((keyword) => typeof keyword === "string" && /[a-z]/i.test(keyword)) || "emoji";
        return {
          emoji,
          label: safeLabel,
          keywords: safeKeywords,
          searchText: normalizedEmojiSearchText(`${emoji} ${safeLabel} ${safeKeywords.join(" ")}`)
        };
      });

    emojiKeywordEntries = entries;
    emojiKeywordEntryMap = new Map(entries.map((entry) => [entry.emoji, entry]));
    emojiPickerState.loadError = false;
    syncAllEmojiTriggers();
    if (emojiPickerState.open) renderEmojiPicker();
    return emojiKeywordEntries;
  })().catch((error) => {
    emojiPickerState.loadError = true;
    if (emojiPickerState.open) renderEmojiPicker();
    throw error;
  });

  return emojiKeywordLoadPromise;
}

function filteredEmojiEntries(query) {
  const normalizedQuery = normalizedEmojiSearchText(query);
  if (!normalizedQuery) {
    return frequentRoomEmojis
      .slice(0, maxFrequentlyUsedEmojis)
      .map((emoji) => emojiKeywordEntryMap.get(emoji) || {
        emoji,
        label: "emoji",
        keywords: [],
        searchText: emoji
      });
  }
  if (!emojiKeywordEntries) return null;

  const terms = normalizedQuery.split(" ").filter(Boolean);
  const results = [];
  for (const entry of emojiKeywordEntries) {
    if (!terms.every((term) => entry.searchText.includes(term))) continue;
    results.push(entry);
    if (results.length === maxEmojiPickerResults) break;
  }
  return results;
}

function renderEmojiPicker() {
  if (!emojiPickerGrid || !emojiPickerStatus || !emojiPickerSearch) return;
  const query = normalizedEmojiSearchText(emojiPickerSearch.value);
  const entries = filteredEmojiEntries(query);
  const fragment = document.createDocumentFragment();
  emojiPickerGrid.setAttribute("aria-busy", String(Boolean(query && entries === null && !emojiPickerState.loadError)));

  if (entries === null) {
    const message = document.createElement("p");
    message.className = "emoji-picker-empty";
    message.textContent = emojiPickerState.loadError ? "No emojis found" : "Loading emojis...";
    fragment.appendChild(message);
    emojiPickerStatus.textContent = message.textContent;
  } else if (entries.length === 0) {
    const message = document.createElement("p");
    message.className = "emoji-picker-empty";
    message.textContent = "No emojis found";
    fragment.appendChild(message);
    emojiPickerStatus.textContent = "No emojis found";
  } else {
    for (const entry of entries) {
      const button = document.createElement("button");
      button.className = "emoji-picker-cell";
      button.type = "button";
      button.dataset.emoji = entry.emoji;
      button.textContent = entry.emoji;
      button.setAttribute("aria-label", emojiEntryName(entry));
      button.setAttribute("aria-pressed", String(emojiPickerState.input?.value === entry.emoji));
      fragment.appendChild(button);
    }
    emojiPickerStatus.textContent = query
      ? `${entries.length} emoji${entries.length === 1 ? "" : "s"} found.`
      : `${entries.length} frequently used emojis.`;
  }

  emojiPickerGrid.replaceChildren(fragment);
  emojiPickerGrid.scrollTop = 0;
}

function positionEmojiPicker() {
  const trigger = emojiPickerState.trigger;
  if (!emojiPickerState.open || !emojiPickerPopover || !trigger?.isConnected) return;
  const triggerRect = trigger.getBoundingClientRect();
  const pickerWidth = emojiPickerPopover.offsetWidth || Math.min(320, window.innerWidth - 16);
  const pickerHeight = emojiPickerPopover.offsetHeight || Math.min(400, window.innerHeight - 16);
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const inset = 8;
  const gap = 8;
  const belowY = triggerRect.bottom + gap;
  const aboveY = triggerRect.top - pickerHeight - gap;
  const roomBelow = viewportHeight - triggerRect.bottom;
  const roomAbove = triggerRect.top;
  const placeBelow = belowY + pickerHeight <= viewportHeight - inset || roomBelow >= roomAbove;
  const unclampedY = placeBelow ? belowY : aboveY;
  const maxX = Math.max(inset, viewportWidth - pickerWidth - inset);
  const maxY = Math.max(inset, viewportHeight - pickerHeight - inset);

  emojiPickerState.x = Math.round(Math.min(Math.max(triggerRect.right - pickerWidth, inset), maxX));
  emojiPickerState.y = Math.round(Math.min(Math.max(unclampedY, inset), maxY));
  emojiPickerState.placement = placeBelow ? "bottom" : "top";
  emojiPickerPopover.style.setProperty("--emoji-picker-x", `${emojiPickerState.x}px`);
  emojiPickerPopover.style.setProperty("--emoji-picker-y", `${emojiPickerState.y}px`);
  emojiPickerPopover.style.setProperty("--emoji-picker-origin", `${placeBelow ? "top" : "bottom"} center`);
  applyEmojiPickerMotion(emojiPickerState.progress);
}

function scheduleEmojiPickerPosition() {
  if (!emojiPickerState.open || emojiPositionFrame) return;
  emojiPositionFrame = requestAnimationFrame(() => {
    emojiPositionFrame = null;
    positionEmojiPicker();
  });
}

function closeEmojiPicker({ restoreFocus = false, immediate = false } = {}) {
  if (!emojiPickerPopover || (!emojiPickerState.open && !emojiPopoverIsShowing())) return;
  const trigger = emojiPickerState.trigger;
  emojiPickerState.open = false;
  trigger?.setAttribute("aria-expanded", "false");

  if (restoreFocus && trigger?.isConnected) {
    requestAnimationFrame(() => trigger.focus({ preventScroll: true }));
  }

  const finishClose = () => {
    if (emojiPickerState.open) return;
    hideEmojiPopoverElement();
    emojiPickerPopover.classList.remove("is-closing");
    emojiPickerState.progress = 0;
    emojiPickerState.trigger = null;
    emojiPickerState.input = null;
    if (emojiPickerPopover.parentElement !== document.body) document.body.appendChild(emojiPickerPopover);
  };

  if (immediate || prefersReducedMotion()) {
    stopSpring(emojiPickerPopover, "open");
    applyEmojiPickerMotion(0);
    finishClose();
    return;
  }

  emojiPickerPopover.classList.add("is-closing");
  springTo(emojiPickerPopover, "open", 0, {
    initial: emojiPickerState.progress,
    stiffness: 300,
    damping: 25,
    mass: 1,
    onUpdate: applyEmojiPickerMotion,
    onRest: finishClose
  });
}

function openEmojiPicker(trigger) {
  if (!emojiPickerPopover || !emojiPickerSearch || !emojiPickerGrid || !trigger) return;
  if (emojiPickerState.open && emojiPickerState.trigger === trigger) {
    closeEmojiPicker({ restoreFocus: true });
    return;
  }

  const input = document.getElementById(trigger.dataset.emojiTarget || "");
  if (!input) return;
  emojiPickerState.trigger?.setAttribute("aria-expanded", "false");
  emojiPickerState.trigger = trigger;
  emojiPickerState.input = input;
  emojiPickerState.open = true;
  trigger.setAttribute("aria-expanded", "true");
  emojiPickerPopover.classList.remove("is-closing");

  const openDialog = trigger.closest("dialog[open]");
  const popoverHost = openDialog || document.body;
  if (emojiPickerPopover.parentElement !== popoverHost) {
    hideEmojiPopoverElement();
    popoverHost.appendChild(emojiPickerPopover);
  }

  emojiPickerSearch.value = "";
  renderEmojiPicker();
  showEmojiPopoverElement();
  positionEmojiPicker();
  springTo(emojiPickerPopover, "open", 1, {
    initial: emojiPickerState.progress,
    stiffness: 300,
    damping: 25,
    mass: 1,
    onUpdate: applyEmojiPickerMotion
  });

  loadEmojiKeywordDictionary().catch(() => {
    // The frequent set remains usable if the keyword dictionary cannot load.
  });
  requestAnimationFrame(() => emojiPickerSearch.focus({ preventScroll: true }));
}

function selectEmoji(emoji) {
  const input = emojiPickerState.input;
  if (!input || !emoji) return;
  input.value = normalizeRoomEmoji(emoji);
  syncEmojiTrigger(input);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  closeEmojiPicker({ restoreFocus: true });
}

function initializeEmojiPickers() {
  if (!emojiPickerPopover || !emojiPickerSearch || !emojiPickerGrid) return;
  syncAllEmojiTriggers();

  for (const trigger of emojiPickerTriggers) {
    trigger.addEventListener("click", () => openEmojiPicker(trigger));
    trigger.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowDown") return;
      event.preventDefault();
      openEmojiPicker(trigger);
    });
  }

  const emojiForms = new Set(
    emojiPickerTriggers
      .map((trigger) => document.getElementById(trigger.dataset.emojiTarget || "")?.closest("form"))
      .filter(Boolean)
  );
  for (const form of emojiForms) {
    form.addEventListener("reset", () => {
      closeEmojiPicker({ restoreFocus: false, immediate: true });
      window.setTimeout(syncAllEmojiTriggers, 0);
    });
  }

  emojiPickerSearch.addEventListener("input", () => {
    if (emojiSearchRenderFrame) cancelAnimationFrame(emojiSearchRenderFrame);
    emojiSearchRenderFrame = requestAnimationFrame(() => {
      emojiSearchRenderFrame = null;
      renderEmojiPicker();
    });
  });
  emojiPickerSearch.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeEmojiPicker({ restoreFocus: true });
      return;
    }
    if (event.key !== "ArrowDown") return;
    const cells = emojiPickerGrid.querySelectorAll(".emoji-picker-cell");
    if (!cells.length) return;
    event.preventDefault();
    cells[0].focus();
  });

  emojiPickerGrid.addEventListener("click", (event) => {
    const cell = event.target.closest(".emoji-picker-cell");
    if (!cell || !emojiPickerGrid.contains(cell)) return;
    selectEmoji(cell.dataset.emoji);
  });
  emojiPickerGrid.addEventListener("pointerover", (event) => {
    const cell = event.target.closest(".emoji-picker-cell");
    if (!cell || cell.contains(event.relatedTarget)) return;
    setEmojiCellScale(cell, 1.08);
  });
  emojiPickerGrid.addEventListener("pointerout", (event) => {
    const cell = event.target.closest(".emoji-picker-cell");
    if (!cell || cell.contains(event.relatedTarget)) return;
    setEmojiCellScale(cell, 1);
  });
  emojiPickerGrid.addEventListener("focusin", (event) => {
    const cell = event.target.closest(".emoji-picker-cell");
    if (cell) setEmojiCellScale(cell, 1.08);
  });
  emojiPickerGrid.addEventListener("focusout", (event) => {
    const cell = event.target.closest(".emoji-picker-cell");
    if (cell) setEmojiCellScale(cell, 1);
  });
  emojiPickerGrid.addEventListener("keydown", (event) => {
    const cell = event.target.closest(".emoji-picker-cell");
    if (!cell) return;
    const cells = Array.from(emojiPickerGrid.querySelectorAll(".emoji-picker-cell"));
    const currentIndex = cells.indexOf(cell);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = Math.min(cells.length - 1, currentIndex + 1);
    else if (event.key === "ArrowLeft") nextIndex = Math.max(0, currentIndex - 1);
    else if (event.key === "ArrowDown") nextIndex = Math.min(cells.length - 1, currentIndex + 6);
    else if (event.key === "ArrowUp") nextIndex = Math.max(0, currentIndex - 6);
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = cells.length - 1;
    else if (event.key === "Escape") {
      event.preventDefault();
      closeEmojiPicker({ restoreFocus: true });
      return;
    } else return;
    event.preventDefault();
    cells[nextIndex]?.focus();
  });

  document.addEventListener("pointerdown", (event) => {
    if (!emojiPickerState.open) return;
    if (emojiPickerPopover.contains(event.target) || emojiPickerState.trigger?.contains(event.target)) return;
    closeEmojiPicker({ restoreFocus: false });
  }, true);
  document.addEventListener("focusin", (event) => {
    if (!emojiPickerState.open) return;
    if (emojiPickerPopover.contains(event.target) || emojiPickerState.trigger === event.target) return;
    closeEmojiPicker({ restoreFocus: false });
  });
  document.addEventListener("keydown", (event) => {
    if (!emojiPickerState.open || event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    closeEmojiPicker({ restoreFocus: true });
  }, true);
  document.addEventListener("scroll", scheduleEmojiPickerPosition, { capture: true, passive: true });
  window.addEventListener("resize", scheduleEmojiPickerPosition, { passive: true });
  window.visualViewport?.addEventListener("resize", scheduleEmojiPickerPosition, { passive: true });
  window.visualViewport?.addEventListener("scroll", scheduleEmojiPickerPosition, { passive: true });

  const prefetch = () => loadEmojiKeywordDictionary().catch(() => {});
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(prefetch, { timeout: 1500 });
  else window.setTimeout(prefetch, 80);
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

function currentGoogleNeedsReconnect() {
  return Boolean(sessionInfo?.user?.googleNeedsReconnect === true);
}

function isGoogleConnected() {
  return Boolean(
    appConfig?.googleReady === true &&
    sessionInfo?.user?.googleConnected === true &&
    currentParticipantConnected() &&
    !currentGoogleNeedsReconnect()
  );
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

function roomEventById(eventId) {
  if (!currentRoom) return null;
  const target = String(eventId || "");
  return currentRoom.events?.find((event) => String(event.id) === target) || null;
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
  // Calendar visibility is a room-level preference, not a Google connection
  // filter. A participant can block a day before connecting a provider, and
  // that availability override must still render and affect suggestions.
  const participantIds = (currentRoom?.participants || []).map((participant) => participant.id);
  return new Set(participantIds.filter((id) => participantCalendarVisible(id)));
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
  const selectedCode = currentRoom?.code || normalizeRoomCodeInput(sessionInfo?.roomCode || "");
  const otherRooms = rooms.filter((room) => normalizeRoomCodeInput(room.code) !== selectedCode);
  const renderSignature = JSON.stringify({
    selectedCode,
    rooms: otherRooms.map((room) => [
      normalizeRoomCodeInput(room.code),
      room.name || "Room",
      room.emoji || defaultRoomEmoji,
      Boolean(room.isHost),
      room.participantCount || 0,
      room.connectedCount || 0
    ])
  });

  roomSwitcher.classList.toggle("hidden", otherRooms.length === 0);
  if (!otherRooms.length) {
    roomSwitcherRenderSignature = renderSignature;
    if (roomSwitcher.childElementCount) roomSwitcher.innerHTML = "";
    return;
  }

  const expectedChildCount = otherRooms.length;
  if (
    renderSignature === roomSwitcherRenderSignature
    && roomSwitcher.childElementCount === expectedChildCount
  ) return;

  roomSwitcherRenderSignature = renderSignature;
  roomSwitcher.innerHTML = "";

  for (const room of otherRooms) {
    const code = normalizeRoomCodeInput(room.code);
    const item = document.createElement("div");
    item.className = "room-switch-item";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "room-switch-tab";
    button.dataset.roomCode = code;
    button.title = `${room.name || "Room"} · ${code}`;
    button.setAttribute("aria-label", `${room.name || "Room"}, ${room.isHost ? "Host" : "Member"}`);

    const mark = document.createElement("span");
    mark.className = "room-switch-mark";
    mark.textContent = room.emoji || roomInitials(room);
    mark.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.className = "room-switch-label";
    label.textContent = room.name || "Room";

    const meta = document.createElement("span");
    meta.className = "room-switch-meta";
    meta.textContent = room.isHost ? "Host" : "Member";

    button.append(mark, label, meta);
    button.addEventListener("click", async () => {
      await switchRoom(code);
    });
    item.appendChild(button);

    roomSwitcher.appendChild(item);
  }

}

function syncInputValue(input, nextValue) {
  if (!input) return;
  if (document.activeElement === input) return;
  if (input.value !== nextValue) {
    input.value = nextValue;
  }
  syncEmojiTrigger(input);
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
  if (!supportedCalendarViews.has(view)) return;
  if (calendarViewMenu) calendarViewMenu.open = false;
  if (currentView === view) {
    updateViewButtons();
    return;
  }
  saveCalendarScrollPosition(currentView);
  currentView = view;
  persistCalendarView(view);
  const refreshPromise = refreshCalendarAfterImmediateRender();
  restoreCalendarScrollPosition(view);
  await refreshPromise;
}

function calendarPeriodText({ includeYear = false } = {}) {
  if (currentView === "day") {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      ...(includeYear ? { year: "numeric" } : {})
    }).format(currentFocusDate);
  }

  if (currentView === "month") {
    return formatMonthYear(currentFocusDate);
  }

  if (currentView === "year") {
    return String(currentFocusDate.getFullYear());
  }

  return formatRange({ includeYear });
}

function updateCalendarPeriodControls() {
  if (!calendarPeriodLabel) return;
  const periodText = calendarPeriodText();
  const accessiblePeriodText = calendarPeriodText({ includeYear: true });
  calendarPeriodLabel.textContent = periodText;
  calendarPeriodLabel.title = accessiblePeriodText;
  calendarPeriodLabel.setAttribute("aria-label", `Calendar period: ${accessiblePeriodText}`);
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

  syncMiniCalendarToFocus();
  await refreshCalendarAfterImmediateRender();
}

async function toggleFullscreenMode() {
  if (!document.fullscreenElement) {
    await document.documentElement.requestFullscreen?.();
    updateFullscreenControl();
    return;
  }

  await document.exitFullscreen?.();
  updateFullscreenControl();
}

async function goToDateInWeek(date) {
  const wasWeekView = currentView === "week";
  if (!wasWeekView) saveCalendarScrollPosition(currentView);
  currentFocusDate = startOfDay(date);
  currentView = "week";
  persistCalendarView(currentView);
  syncMiniCalendarToFocus();
  if (wasWeekView) {
    animateCalendarTransition(render);
    return;
  }
  const refreshPromise = refreshCalendarAfterImmediateRender();
  restoreCalendarScrollPosition(currentView);
  await refreshPromise;
}

function shouldIgnoreViewShortcut(target) {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input, textarea, select, button, [contenteditable='true']"));
}

function updateViewButtons() {
  for (const button of viewSwitcher.querySelectorAll("[data-view]")) {
    button.classList.toggle("active", button.dataset.view === currentView);
    button.setAttribute("aria-pressed", String(button.dataset.view === currentView));
  }
  if (calendarViewLabel) {
    calendarViewLabel.textContent = `${currentView.slice(0, 1).toUpperCase()}${currentView.slice(1)}`;
  }
  if (roomPage) roomPage.dataset.calendarView = currentView;
}

function roomInviteLink() {
  return `${window.location.origin}/room/${currentRoom?.code || ""}`;
}

function googleAuthUrl(roomCodeValue, { calendarWrite = true, popup = false, popupToken = "" } = {}) {
  const params = new URLSearchParams({ room: normalizeRoomCodeInput(roomCodeValue) });
  params.set("calendarWrite", calendarWrite ? "1" : "0");
  if (popup) {
    params.set("popup", "1");
    params.set("popupToken", popupToken);
  }
  return `${popup ? "/api/auth/google" : "/auth/google"}?${params.toString()}`;
}

function createGoogleAuthPopupToken() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replaceAll("-", "");
  }
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function stopGoogleAuthPopupWatcher() {
  if (!googleAuthPopupPollTimer) return;
  window.clearInterval(googleAuthPopupPollTimer);
  googleAuthPopupPollTimer = null;
}

function pauseBackgroundPollingForGoogleAuth() {
  window.clearInterval(refreshTimer);
  refreshTimer = null;
  window.clearInterval(notificationPollTimer);
  notificationPollTimer = null;
  abortRoomDataRequests();
}

function resumeBackgroundPollingAfterGoogleAuth() {
  startAutoRefresh();
  startNotificationPolling();
}

function resetGoogleAuthPopupState({ resumePolling = true } = {}) {
  stopGoogleAuthPopupWatcher();
  googleAuthPopup = null;
  googleAuthPopupToken = "";
  googleAuthPopupPending = false;
  eventGoogleSyncRow?.classList.remove("is-authorizing");
  eventGoogleSyncRow?.removeAttribute("aria-busy");
  if (resumePolling) resumeBackgroundPollingAfterGoogleAuth();
}

function openGoogleAuthPopup() {
  if (!currentRoom?.code || googleAuthPopupPending) return false;

  const width = 500;
  const height = 650;
  const screenLeft = Number.isFinite(window.screenLeft) ? window.screenLeft : window.screenX;
  const screenTop = Number.isFinite(window.screenTop) ? window.screenTop : window.screenY;
  const outerWidth = window.outerWidth || window.screen.availWidth;
  const outerHeight = window.outerHeight || window.screen.availHeight;
  const left = Math.round(screenLeft + Math.max(0, (outerWidth - width) / 2));
  const top = Math.round(screenTop + Math.max(0, (outerHeight - height) / 2));
  const popupToken = createGoogleAuthPopupToken();
  const popup = window.open(
    googleAuthUrl(currentRoom.code, { calendarWrite: true, popup: true, popupToken }),
    "GoogleAuthPopup",
    `width=${width},height=${height},left=${left},top=${top}`
  );

  if (!popup) {
    if (eventGoogleSyncStatus) {
      eventGoogleSyncStatus.textContent = "Popup blocked. Allow popups to connect Google Calendar.";
    }
    eventGoogleSyncRow?.classList.add("is-error");
    return false;
  }

  googleAuthPopup = popup;
  googleAuthPopupToken = popupToken;
  googleAuthPopupPending = true;
  pauseBackgroundPollingForGoogleAuth();
  eventGoogleSyncRow?.classList.remove("is-error");
  updateEventGoogleSyncControl();
  googleAuthPopupPollTimer = window.setInterval(() => {
    if (!googleAuthPopup || !googleAuthPopup.closed) return;
    resetGoogleAuthPopupState();
    updateEventGoogleSyncControl();
    if (!calendarWriteReady() && eventGoogleSyncStatus) {
      eventGoogleSyncStatus.textContent = "Connection cancelled. Try again when you're ready.";
    }
  }, 400);
  return true;
}

async function handleGoogleAuthPopupMessage(event) {
  if (
    !googleAuthPopupPending ||
    event.origin !== window.location.origin ||
    event.source !== googleAuthPopup
  ) {
    return;
  }

  const message = event.data;
  if (
    !message ||
    typeof message !== "object" ||
    message.type !== "commonground:google-oauth" ||
    message.provider !== "google" ||
    message.requestId !== googleAuthPopupToken ||
    !["success", "error"].includes(message.status)
  ) {
    return;
  }

  const completedPopup = googleAuthPopup;
  resetGoogleAuthPopupState({ resumePolling: false });

  if (message.status === "error") {
    const safeErrors = {
      access_denied: "Google Calendar connection was cancelled.",
      provider_error: "Google could not authorize the connection. Please try again.",
      calendar_connection_failed: "Google Calendar could not be connected. Please try again."
    };
    eventGoogleSyncRow?.classList.add("is-error");
    eventGoogleSyncStatus.textContent = safeErrors[message.errorCode] || safeErrors.calendar_connection_failed;
    completedPopup?.close();
    resumeBackgroundPollingAfterGoogleAuth();
    return;
  }

  eventGoogleSyncStatus.textContent = "Finishing Google Calendar connection…";
  eventGoogleSyncRow?.classList.add("is-authorizing");
  eventGoogleSyncRow?.setAttribute("aria-busy", "true");
  try {
    const refreshed = await refreshRoomAfterGoogleConnection();
    if (!refreshed || !calendarWriteReady()) {
      throw new Error("Google Calendar permissions were not refreshed.");
    }
    eventGoogleSyncInput.checked = true;
    eventGoogleSyncRow?.classList.remove("is-error");
    eventGoogleSyncRow?.classList.add("is-connected");
    updateEventGoogleSyncControl();
    window.setTimeout(() => eventGoogleSyncRow?.classList.remove("is-connected"), 900);
  } catch {
    eventGoogleSyncRow?.classList.add("is-error");
    eventGoogleSyncStatus.textContent = "Connected, but CommonGround could not refresh the calendar. Try again.";
  } finally {
    eventGoogleSyncRow?.classList.remove("is-authorizing");
    eventGoogleSyncRow?.removeAttribute("aria-busy");
    completedPopup?.close();
    resumeBackgroundPollingAfterGoogleAuth();
  }
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

async function copyRoomLink() {
  if (!currentRoom?.code) return;
  try {
    await copyTextToClipboard(roomInviteLink());
    setCalendarStatus("Room link copied.", { notify: true, title: "Invite link ready" });
    replayMotionClass(calendarStatus, "motion-feedback");
    replayMotionClass(copyInviteButton, "motion-feedback");
    replayMotionClass(copyInviteButtonEmpty, "motion-feedback");
  } catch {
    setCalendarStatus(`Copy this room link: ${roomInviteLink()}`, {
      notify: true,
      title: "Copy failed"
    });
  }
}

async function copyRoomLinkFromTopbar() {
  if (!currentRoom?.code || !isGoogleConnected()) return;
  const roomCodeSnapshot = currentRoom.code;
  try {
    await copyTextToClipboard(roomInviteLink());
    calendarStatus.textContent = "Room link copied.";
    copiedTopbarRoomCode = roomCodeSnapshot;
    if (topbarRoomLinkCopyTimer) window.clearTimeout(topbarRoomLinkCopyTimer);
    renderCalendarGoogleControl();
    topbarRoomLinkCopyTimer = window.setTimeout(() => {
      if (copiedTopbarRoomCode === roomCodeSnapshot) {
        copiedTopbarRoomCode = "";
        renderCalendarGoogleControl();
      }
      topbarRoomLinkCopyTimer = null;
    }, 1600);
  } catch {
    calendarStatus.textContent = `Copy this room link: ${roomInviteLink()}`;
    showNotification({
      id: `local-copy-error-${Date.now()}`,
      type: "copy_error",
      title: "Room link was not copied",
      message: `Copy this link manually: ${roomInviteLink()}`,
      createdAt: new Date().toISOString()
    });
  }
}

function dismissInviteStrip() {
  if (currentRoom?.code) {
    dismissedInviteRoomCodes.add(currentRoom.code);
  }
  setPanelVisibility(emptyRoomState, false);
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
    setCalendarStatus("Room code copied.", { notify: true, title: "Room code copied" });
    roomCodeCopyTimer = window.setTimeout(() => {
      if (copiedRoomCodeValue === code) {
        copiedRoomCodeValue = "";
        renderRoomCodePill();
      }
      roomCodeCopyTimer = null;
    }, 1800);
  } catch {
    setCalendarStatus(`Copy this room code manually: ${code}`, {
      notify: true,
      title: "Copy failed"
    });
  }
}

function participantStatusText(participant) {
  if (!participant) return "Guest";
  if (participant.syncStatus === "needs_reconnect" || participant.needsReconnect) return "Reconnect";
  if (participant.syncStatus === "error" || participant.lastSyncError) return "Sync error";
  return participant.connected ? "Live" : "Guest";
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

function calendarLocationLabel(location) {
  const source = String(location || "").trim().replace(/\s+/g, " ");
  if (!source) return "";

  // Prefer the venue/main name before address fragments, then cap the visible
  // label at three words so calendar cards stay scannable in overlap stacks.
  const primary = source.split(/[,;|]/, 1)[0].trim() || source;
  return primary.split(/\s+/).filter(Boolean).slice(0, 3).join(" ");
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

function calendarParticipantLabel(participant) {
  const participantId = participant?.participantId || participant?.id || "";
  if (participantId && participantId === currentParticipant?.id) {
    return String(currentParticipant?.displayName || "You").trim() || "You";
  }
  return String(participant?.ownerName || participant?.displayName || "Participant").trim() || "Participant";
}

function calendarEventOwnerLabel(eventBlock) {
  const creatorId = eventBlock?.originalEvent?.createdByParticipantId || eventBlock?.createdByParticipantId || "";
  if (creatorId && creatorId === currentParticipant?.id) {
    return String(currentParticipant?.displayName || "You").trim() || "You";
  }
  return String(eventBlock?.participantName || "Someone").trim() || "Someone";
}

function wireInlineNameEditor(target, getCurrentName, onSave, triggerEventName = "dblclick") {
  if (!target) return;
  target.addEventListener(triggerEventName, () => {
    const currentName = getCurrentName();
    const targetTag = target.tagName.toLowerCase();
    const targetId = target.id;
    const targetClassName = target.className;
    const targetWidth = target.getBoundingClientRect().width;
    const input = document.createElement("input");
    input.type = "text";
    input.className = "inline-name-input";
    input.value = currentName;
    if (targetWidth > 0) input.style.setProperty("--inline-name-width", `${targetWidth}px`);
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
    eventInviteDropdown?.classList.add("is-empty");
    updateInviteeCountText();
    return;
  }

  const optionList = document.createElement("div");
  optionList.className = "invitee-options";
  let visibleInviteeCount = 0;
  for (const participant of invitees) {
    const label = document.createElement("label");
    label.className = "invitee-option";
    label.style.setProperty("--invitee-color", participant.color);
    const isSelf = participant.id === currentParticipant?.id;
    const isCreator = participant.id === options.creatorParticipantId;
    const isLocked = lockedIds.has(participant.id);
    const suffix = isCreator ? " (Creator)" : (isSelf ? " (You)" : "");
    if (isSelf) {
      label.classList.add("is-self");
    } else {
      visibleInviteeCount += 1;
    }
    label.innerHTML = `
      <input type="checkbox" value="${escapeAttribute(participant.id)}" ${selected.has(participant.id) || isLocked ? "checked" : ""} ${isLocked ? "disabled" : ""} />
      <span class="invitee-color-dot"></span>
      <strong>${escapeHtml(participant.displayName)}${escapeHtml(suffix)}</strong>
    `;
    label.querySelector("input")?.addEventListener("change", updateInviteeCountText);
    optionList.appendChild(label);
  }
  if (visibleInviteeCount === 0) {
    const emptyState = document.createElement("p");
    emptyState.className = "invitee-empty-state";
    emptyState.textContent = "No other members to invite";
    optionList.appendChild(emptyState);
  }
  eventInviteDropdown?.classList.toggle("is-empty", visibleInviteeCount === 0);
  inviteePicker.appendChild(optionList);
  updateInviteeCountText();
}

function renderTopbarIdentity() {
  if (!topbarIdentity || !currentParticipant) return;
  const currentColorOption = participantColorOption(currentParticipant.color);
  const profileInitial = [...String(currentParticipant.displayName || "G").trim()][0]?.toUpperCase() || "G";
  topbarIdentity.dataset.initial = profileInitial;
  topbarIdentity.innerHTML = `
    <button class="identity-name-button" id="topbarIdentityName" type="button" data-initial="${escapeAttribute(profileInitial)}" aria-label="Edit your profile name">${escapeHtml(currentParticipant.displayName)}</button>
    <details class="color-picker-menu topbar-identity-menu">
      <summary class="color-picker-trigger topbar-color-trigger" aria-label="Choose your color, current ${escapeAttribute(currentColorOption.name)}">
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
  const participants = currentRoom?.participants || [];
  const duplicateNameCounts = new Map();
  for (const participant of participants) {
    const key = normalizedTextKey(participant.displayName) || "member";
    duplicateNameCounts.set(key, (duplicateNameCounts.get(key) || 0) + 1);
  }
  const duplicateNameIndexes = new Map();

  for (const participant of participants) {
    const nameKey = normalizedTextKey(participant.displayName) || "member";
    const duplicateIndex = (duplicateNameIndexes.get(nameKey) || 0) + 1;
    duplicateNameIndexes.set(nameKey, duplicateIndex);
    const duplicateSuffix = duplicateNameCounts.get(nameKey) > 1 ? ` (${duplicateIndex})` : "";
    const selfSuffix = participant.id === currentParticipant?.id ? " (You)" : "";
    const memberDisplayName = `${participant.displayName}${duplicateSuffix}${selfSuffix}`;
    const isHidden = hiddenParticipantIds.has(participant.id);
    const row = document.createElement("div");
    row.className = [
      "participant-chip",
      "member-calendar-row",
      participant.connected ? "" : "faded",
      isHidden ? "is-hidden" : ""
    ].filter(Boolean).join(" ");
    row.style.setProperty("--chip-color", participant.color);
    row.style.setProperty("--member-color", participant.color);
    row.dataset.memberName = normalizedTextKey(participant.displayName);

    const label = document.createElement("label");
    label.className = "member-calendar-label";

    const checkbox = document.createElement("input");
    checkbox.className = "member-calendar-checkbox";
    checkbox.type = "checkbox";
    checkbox.checked = !isHidden;
    checkbox.value = participant.id;
    checkbox.dataset.participantId = participant.id;
    checkbox.setAttribute("aria-label", `Show ${memberDisplayName}'s calendar`);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        hiddenParticipantIds.delete(participant.id);
      } else {
        hiddenParticipantIds.add(participant.id);
      }
      saveHiddenParticipantIds();
      renderParticipants();
      renderCalendar();
    });

    const checkmark = document.createElement("span");
    checkmark.className = "member-checkbox-visual";
    checkmark.setAttribute("aria-hidden", "true");

    const copy = document.createElement("span");
    copy.className = "participant-copy member-calendar-copy";
    const participantStatus = participantStatusText(participant);
    const memberName = document.createElement("strong");
    memberName.textContent = memberDisplayName;
    const status = document.createElement("small");
    const statusClass = participantStatus.toLowerCase().replace(/\s+/g, "-");
    status.className = `member-calendar-status member-calendar-status-${statusClass}`;
    if (["Reconnect", "Sync error"].includes(participantStatus)) {
      status.classList.add("member-calendar-alert");
    }
    status.textContent = participantStatus;
    if (participant.lastSyncError) status.title = participant.lastSyncError;
    copy.append(memberName, status);

    label.append(checkbox, checkmark, copy);
    row.appendChild(label);

    if (currentIsHost && !participant.isCurrent) {
      const removeButton = document.createElement("button");
      removeButton.className = "chip-action";
      removeButton.type = "button";
      removeButton.setAttribute("aria-label", `Remove ${participant.displayName}`);
      removeButton.innerHTML = '<span class="ui-icon ui-icon-circle-x" aria-hidden="true"></span>';
      removeButton.addEventListener("click", async (event) => {
        event.stopPropagation();
        await removeParticipant(participant.id);
      });
      removeButton.addEventListener("keydown", (event) => {
        event.stopPropagation();
      });
      row.appendChild(removeButton);
    }

    participantStrip.appendChild(row);
  }
  filterParticipantRows();
}

function filterParticipantRows() {
  if (!participantStrip) return;
  const query = normalizedTextKey(memberSearchInput?.value);
  for (const row of participantStrip.querySelectorAll(".member-calendar-row")) {
    row.hidden = Boolean(query && !String(row.dataset.memberName || "").includes(query));
  }
}

function sidebarUsesDrawerLayout() {
  return window.matchMedia("(max-width: 900px)").matches;
}

function setParticipantsPanelExpanded(expanded, { persist = true, restoreFocus = true } = {}) {
  if (!participantsSidebar) return;
  const isExpanded = Boolean(expanded);
  const focusWasInside = participantsSidebar.contains(document.activeElement);
  participantsSidebar.classList.toggle("is-open", isExpanded);
  roomPage?.classList.toggle("sidebar-collapsed", !isExpanded);
  participantsSidebar.dataset.open = String(isExpanded);
  participantsSidebar.inert = !isExpanded;
  participantsSidebar.setAttribute("aria-hidden", String(!isExpanded));
  calendarSidebarButton?.setAttribute("aria-expanded", String(isExpanded));
  calendarSidebarButton?.setAttribute("aria-label", isExpanded ? "Close rooms and members sidebar" : "Open rooms and members sidebar");
  const showBackdrop = isExpanded && sidebarUsesDrawerLayout();
  sidebarBackdrop?.classList.toggle("hidden", !showBackdrop);
  sidebarBackdrop?.setAttribute("aria-hidden", String(!showBackdrop));
  if (sidebarBackdrop) sidebarBackdrop.inert = !showBackdrop;
  if (persist) persistSidebarOpen(isExpanded);
  if (!isExpanded && restoreFocus && focusWasInside) {
    calendarSidebarButton?.focus({ preventScroll: true });
  }
}

function focusableElementsWithin(container) {
  if (!container) return [];
  return [...container.querySelectorAll(
    'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex]:not([tabindex="-1"])'
  )].filter((element) => (
    !element.hidden &&
    !element.closest(".hidden") &&
    element.getAttribute("aria-hidden") !== "true" &&
    getComputedStyle(element).display !== "none"
  ));
}

function settingsPanelIsOpen() {
  return Boolean(hostPopover && !hostPopover.classList.contains("hidden") && !hostPopover.classList.contains("is-closing"));
}

function setSettingsPanelOpen(open, { focusFirst = false, restoreFocus = true } = {}) {
  if (!hostPopover || !settingsButton) return;
  const isOpen = Boolean(open);
  const focusWasInside = hostPopover.contains(document.activeElement);

  if (isOpen) {
    settingsReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : settingsButton;
    hostPopover.inert = false;
    hostPopover.setAttribute("aria-hidden", "false");
    hostPopover.setAttribute("role", "dialog");
    hostPopover.setAttribute("aria-modal", "false");
    hostPopover.setAttribute("aria-label", "Settings");
    settingsButton.setAttribute("aria-expanded", "true");
    settingsButton.setAttribute("aria-controls", hostPopover.id);
    setPanelVisibility(hostPopover, true);
    if (focusFirst) {
      window.requestAnimationFrame(() => {
        focusableElementsWithin(hostPopover)[0]?.focus({ preventScroll: true });
      });
    }
    return;
  }

  settingsButton.setAttribute("aria-expanded", "false");
  hostPopover.setAttribute("aria-hidden", "true");
  if (restoreFocus && focusWasInside) {
    const focusTarget = settingsReturnFocus?.isConnected ? settingsReturnFocus : settingsButton;
    focusTarget?.focus({ preventScroll: true });
  }
  hostPopover.inert = true;
  settingsReturnFocus = null;
  setPanelVisibility(hostPopover, false);
}

function setCalendarUtilityMenuOpen(open, { focusFirst = false } = {}) {
  if (!calendarUtilityOverflowButton || !calendarUtilityOverflowMenu) return;
  const isOpen = Boolean(open);
  calendarUtilityOverflowMenu.classList.toggle("hidden", !isOpen);
  calendarUtilityOverflowMenu.inert = !isOpen;
  calendarUtilityOverflowButton.setAttribute("aria-expanded", String(isOpen));
  if (isOpen && focusFirst) {
    window.requestAnimationFrame(() => {
      focusableElementsWithin(calendarUtilityOverflowMenu)[0]?.focus({ preventScroll: true });
    });
  }
}

function initializeCalendarUtilityMenu() {
  if (!calendarUtilityOverflowMenu || calendarUtilityOverflowMenu.children.length) return;
  const utilities = [
    {
      label: "Reload calendar",
      iconClass: "ui-icon-refresh",
      run: async () => {
        setCalendarUtilityMenuOpen(false);
        await refreshRoomData();
      }
    },
    {
      label: "Toggle fullscreen",
      iconClass: "ui-icon-maximize",
      run: async () => {
        setCalendarUtilityMenuOpen(false);
        await toggleFullscreenMode();
      }
    },
    {
      label: "Settings",
      iconClass: "ui-icon-settings",
      run: async () => {
        setCalendarUtilityMenuOpen(false);
        setSettingsPanelOpen(true, { focusFirst: true });
      }
    }
  ];

  for (const utility of utilities) {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("role", "menuitem");
    button.className = "calendar-utility-overflow-item button-with-icon";
    setButtonLabelWithIcon(button, utility.label, utility.iconClass);
    button.addEventListener("click", () => {
      void utility.run();
    });
    calendarUtilityOverflowMenu.appendChild(button);
  }
  calendarUtilityOverflowMenu.inert = true;
}

function syncCalendarUtilityOverflowVisibility() {
  if (!calendarUtilityOverflowButton) return;
  const shouldShow = window.matchMedia("(max-width: 1320px)").matches;
  calendarUtilityOverflowButton.classList.toggle("hidden", !shouldShow);
  calendarUtilityOverflowButton.setAttribute("aria-hidden", String(!shouldShow));
  if (!shouldShow) setCalendarUtilityMenuOpen(false);
}

function renderJoinRequests() {
  if (!joinRequestQueue || !joinRequestList || !joinRequestCount) return;
  const showQueue = currentIsHost && Boolean(currentRoom?.accessLocked);
  const requests = showQueue ? (currentRoom?.pendingJoinRequests || []) : [];
  joinRequestQueue.classList.toggle("hidden", !showQueue);
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

  const connected = isGoogleConnected();
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

function renderCalendarGoogleControl() {
  if (!calendarGoogleButton) return;

  const ready = Boolean(currentRoom?.code && currentParticipant);
  const googleAvailable = appConfig?.googleReady === true;
  const connected = isGoogleConnected();
  const needsReconnect = currentGoogleNeedsReconnect();
  let label = "Connect Google Calendar";
  let accessibleLabel = "Connect Google Calendar";
  let iconClass = "ui-icon-calendar-sync";
  let state = "needs-connection";

  if (ready && !googleAvailable && !connected) {
    label = "Google Calendar unavailable";
    accessibleLabel = "Google Calendar connection is currently unavailable";
    iconClass = "ui-icon-calendar-sync";
    state = "is-unavailable";
  } else if (needsReconnect) {
    label = "Reconnect Google Calendar";
    accessibleLabel = "Reconnect Google Calendar";
    iconClass = "ui-icon-rotate";
    state = "needs-reconnect";
  } else if (connected) {
    label = "Google Calendar connected";
    accessibleLabel = "Google Calendar connected";
    iconClass = "ui-icon-calendar-sync";
    state = "is-connected";
  }

  setButtonLabelWithIcon(calendarGoogleButton, label, iconClass);
  calendarGoogleButton.classList.remove(
    "needs-connection",
    "needs-reconnect",
    "needs-permission",
    "is-unavailable",
    "is-connected"
  );
  calendarGoogleButton.classList.add(state);
  calendarGoogleButton.dataset.googleAction = connected ? "connected" : (googleAvailable ? "authorize" : "unavailable");
  calendarGoogleButton.title = accessibleLabel;
  calendarGoogleButton.setAttribute("aria-label", accessibleLabel);
  calendarGoogleButton.disabled = connected || !ready || !googleAvailable;
  calendarGoogleButton.classList.toggle("hidden", connected);
  calendarGoogleButton.setAttribute("aria-busy", String(!ready));

  roomPage.dataset.googleReady = String(ready);
  roomPage.dataset.googleConnected = String(connected);
  googleConnectionIndicator?.classList.toggle("hidden", !connected);
  googleConnectionIndicator?.setAttribute("aria-hidden", String(!connected));
  googleConnectionIndicator?.setAttribute("aria-label", connected ? "Google Calendar connected" : "");
  const connectionNoticeText = calendarConnectionNotice?.querySelector("span:last-child");
  if (connectionNoticeText) {
    connectionNoticeText.textContent = googleAvailable
      ? "Connect your Google Calendar to see overlapping availability."
      : "Google Calendar connection is currently unavailable.";
  }
  // The top-bar CTA is the single connection action. Keeping a second banner
  // over the grid duplicated state and obscured time slots.
  calendarConnectionNotice?.classList.add("hidden");
  calendarConnectionNotice?.setAttribute("aria-hidden", "true");
  setPanelVisibility(emptyRoomState, false);
}

function renderRoomMeta() {
  syncRoomNameSurfaces();
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
  updateRoomLockIcon(Boolean(currentRoom?.accessLocked));
  hostPanel.classList.remove("hidden");
  hostSettings.classList.toggle("hidden", !currentIsHost);

  setPanelVisibility(emptyRoomState, false);

  if (connectGoogleButton) connectGoogleButton.disabled = false;

  if (currentGoogleNeedsReconnect()) {
    setButtonLabelWithIcon(connectGoogleButton, "Reconnect calendar", "ui-icon-rotate");
    settingsReconnectButton.classList.remove("hidden");
    settingsReconnectButton.dataset.calendarWrite = "true";
    setButtonLabelWithIcon(settingsReconnectButton, "Reconnect calendar", "ui-icon-rotate");
    connectWidgetText.textContent = currentParticipant?.lastSyncError
      ? `Last sync issue: ${currentParticipant.lastSyncError}`
      : "Reconnect calendar to keep availability updated.";
  } else if (isGoogleConnected()) {
    setButtonLabelWithIcon(connectGoogleButton, "Calendar connected", "ui-icon-calendar-sync");
    connectGoogleButton.disabled = true;
    connectGoogleButton.setAttribute("aria-label", "Google Calendar connected");
    const needsWriteAccess = !calendarWriteReady();
    settingsReconnectButton.classList.toggle("hidden", !needsWriteAccess);
    settingsReconnectButton.dataset.calendarWrite = needsWriteAccess ? "true" : "false";
    setButtonLabelWithIcon(
      settingsReconnectButton,
      needsWriteAccess ? "Enable Google event sync" : "Reconnect calendar",
      needsWriteAccess ? "ui-icon-calendar-sync" : "ui-icon-rotate"
    );
    const syncStamp = formatSyncStamp(currentParticipant?.lastSyncedAt || sessionInfo?.user?.sync?.lastSuccessAt);
    connectWidgetText.textContent = `Last synced at ${syncStamp || "--"}`;
  } else {
    setButtonLabelWithIcon(connectGoogleButton, "Connect calendar", "ui-icon-calendar-sync");
    connectGoogleButton.disabled = appConfig?.googleReady !== true;
    connectGoogleButton.setAttribute(
      "aria-label",
      appConfig?.googleReady === true ? "Connect Google Calendar" : "Google Calendar connection unavailable"
    );
    settingsReconnectButton.classList.add("hidden");
    settingsReconnectButton.dataset.calendarWrite = "false";
    connectWidgetText.textContent = "Connect calendar to sync availability.";
  }

  renderCalendarEventSyncControls();
  renderCalendarGoogleControl();
  renderTopbarIdentity();
  renderJoinRequests();
}

function refreshStatusLine() {
  if (calendarStatus.textContent === "Loading room…") calendarStatus.textContent = "";
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

function syncSelectedEventCard() {
  for (const card of calendarGrid?.querySelectorAll(".event-card[data-event-id]") || []) {
    const selected = Boolean(selectedEventId && card.dataset.eventId === selectedEventId);
    card.classList.toggle("is-selected", selected);
    card.setAttribute("aria-pressed", String(selected));
  }
}

function setDetailTitleEditing(editing) {
  detailTitle?.classList.toggle("hidden", Boolean(editing));
  detailTitleField?.classList.toggle("hidden", !editing);
}

async function setDayBlocked(date, blocked) {
  if (!currentRoom || !currentParticipant) return;
  const key = typeof date === "string" ? date : dateKey(date);
  const data = await fetchJson(`/api/rooms/${currentRoom.code}/day-blocks/${key}`, {
    method: blocked ? "POST" : "DELETE"
  });
  currentRoom = data.room;
  currentParticipant = data.participant;
  currentIsHost = Boolean(data.isHost);
  selectedBusyGroup = null;
  render();
  calendarStatus.textContent = blocked
    ? `${formatFullDate(new Date(`${key}T12:00:00`))} is now busy all day.`
    : `${formatFullDate(new Date(`${key}T12:00:00`))} is available again.`;
}

async function toggleFocusedDayBlock() {
  const key = dateKey(currentFocusDate);
  const blocked = Boolean(currentParticipantDayBlock(key));
  if (sidebarBlockDayButton) sidebarBlockDayButton.disabled = true;
  try {
    await setDayBlocked(key, !blocked);
  } catch (error) {
    calendarStatus.textContent = error.message || "The day could not be updated.";
  } finally {
    if (sidebarBlockDayButton) sidebarBlockDayButton.disabled = false;
    renderDayBlockControls();
  }
}

function openBusyDetail(group) {
  if (activeEventTimePicker?.context === "detail") closeEventTimePicker();
  setPanelVisibility(detailPanel, true);
  selectedBusyGroup = group;
  selectedEventId = null;
  syncSelectedEventCard();
  detailEmpty.classList.add("hidden");
  eventDetail.classList.add("hidden");
  busyDetail.classList.remove("hidden");
  detailLabel.textContent = "Busy overlap";
  detailTitle.textContent = `${group.participants.length} busy`;
  setDetailTitleEditing(false);
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
    owner.textContent = calendarParticipantLabel(entry);
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
        if (busyItem.provider === "commonground_day_block" && busyItem.date) {
          const removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.className = "secondary day-block-remove-button";
          removeButton.textContent = "Make this day available";
          removeButton.addEventListener("click", async () => {
            removeButton.disabled = true;
            try {
              await setDayBlocked(busyItem.date, false);
            } catch (error) {
              removeButton.disabled = false;
              calendarStatus.textContent = error.message || "The day could not be updated.";
            }
          });
          sub.appendChild(removeButton);
        }
        section.appendChild(sub);
      }
    }
    busyDetailList.appendChild(section);
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
  const rangeInputs = new Set([
    detailDateInput,
    detailStartInput,
    detailEndInput,
    detailStartTimeInput,
    detailEndTimeInput
  ]);
  for (const input of [
    detailTitleInput,
    detailDateInput,
    detailStartInput,
    detailEndInput,
    detailStartTimeInput,
    detailEndTimeInput,
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
  if (detailTitleInput) {
    const visibleTitle = event.viewerCanSeeDetails ? String(event.title || "") : "Busy";
    detailTitleInput.value = visibleTitle === "(No title)" ? "" : visibleTitle;
  }
  if (detailDateInput) detailDateInput.value = dateKey(start);
  if (detailStartInput) detailStartInput.value = `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`;
  if (detailEndInput) detailEndInput.value = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
  for (const picker of eventTimePickers.filter((entry) => entry.context === "detail")) {
    syncEventTimePickerDisplay(picker);
  }
  if (detailLocationInput) detailLocationInput.value = event.viewerCanSeeDetails ? (event.location || "") : "";
  if (detailDescriptionInput) detailDescriptionInput.value = event.viewerCanSeeDetails ? (event.description || "") : "";
  if (detailGoogleSyncInput) detailGoogleSyncInput.checked = event.syncToGoogle !== false;
  if (detailInviteeFeedback) {
    detailInviteeFeedback.dataset.persistedMessage = canManage ? "" : "Read only";
    detailInviteeFeedback.textContent = detailInviteeFeedback.dataset.persistedMessage;
  }

  setEventPanelReadOnly(!canManage, preserveOriginalRange);
  for (const input of [
    detailDateInput,
    detailStartInput,
    detailEndInput,
    detailStartTimeInput,
    detailEndTimeInput
  ]) {
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
    const active = button.dataset.response === responseValue;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  }
}

function openEventDetail(eventId) {
  closeAllLocationAutocompletes({ immediate: true, resetSession: true });
  selectedEventId = eventId;
  selectedBusyGroup = null;
  const event = activeEvent();
  if (!event) {
    clearDetailPanel();
    return;
  }
  setPanelVisibility(detailPanel, true);
  syncSelectedEventCard();

  detailEmpty.classList.add("hidden");
  busyDetail.classList.add("hidden");
  eventDetail.classList.remove("hidden");
  detailLabel.textContent = "Group event";
  detailTitle.textContent = event.title || "Event";
  setDetailTitleEditing(true);
  detailTime.textContent = formatDateTimeRange(event.start, event.end);
  responseSummary.textContent = `${event.responseSummary?.yes || 0} yes, ${event.responseSummary?.maybe || 0} maybe, ${event.responseSummary?.no || 0} no.`;
  renderComments(event);
  const currentResponse = event.responses?.[currentParticipant?.id] || "";
  setVoteButtons(currentResponse);

  const canManage = currentIsHost || event.createdByParticipantId === currentParticipant?.id;
  // The detail panel is an inspection/RSVP surface. All mutations go through
  // the same compact composer used for event creation.
  renderEventPanelForm(event, false);
  eventPanelForm?.setAttribute("aria-label", "Event details");
  inviteeSummary.textContent = event.invitees?.length ? `${event.invitees.length} invited` : "No invitees selected.";
  const canRespond = Boolean(event.isInvited);
  editEventButton.classList.toggle("hidden", !canManage);
  saveEventChangesButton?.classList.add("hidden");
  deleteEventButton.classList.toggle("hidden", !canManage);
  // Time changes are made by the event creator in the editor. Guests can vote
  // without mutating the event's canonical start and end times.
  for (const button of document.querySelectorAll(".vote-button")) {
    button.disabled = !canRespond;
  }
}

function clearDetailPanel() {
  closeAllLocationAutocompletes({ immediate: true, resetSession: true });
  if (activeEventTimePicker?.context === "detail") closeEventTimePicker();
  selectedEventId = null;
  selectedBusyGroup = null;
  syncSelectedEventCard();
  setPanelVisibility(detailPanel, false, {
    afterHide: () => {
      detailEmpty.classList.remove("hidden");
      eventDetail.classList.add("hidden");
      busyDetail.classList.add("hidden");
      detailLabel.textContent = "Event details";
      detailTitle.textContent = "Select an event";
      setDetailTitleEditing(false);
      inviteeSummary.textContent = "";
      eventPanelInitialState = "";
    }
  });
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

function roomDayBlockBusyBlocks() {
  return (currentRoom?.dayBlocks || []).map((block) => {
    const start = new Date(`${block.date}T00:00:00`);
    const end = addDays(start, 1);
    const participant = currentRoom?.participants?.find((entry) => entry.id === block.participantId);
    const ownerName = participant?.displayName || block.displayName || "Participant";
    const color = participant?.color || block.color || participantPalette[0].value;
    const sourceId = `day-block:${block.participantId}:${block.date}`;
    return {
      participantId: block.participantId,
      ownerId: block.participantId,
      ownerName,
      color,
      start: start.toISOString(),
      end: end.toISOString(),
      items: [{
        provider: "commonground_day_block",
        sourceId,
        title: "Busy all day",
        start: start.toISOString(),
        end: end.toISOString(),
        date: block.date,
        editable: block.participantId === currentParticipant?.id
      }]
    };
  });
}

function buildBusyDayBlocks() {
  const byDay = new Map();
  const visibleIds = visibleParticipantIds();
  const seenDayKeys = new Set();

  for (const block of normalizeBusyBlocks([...googleBusy, ...roomDayBlockBusyBlocks()])) {
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

function busySegmentsForDate(date) {
  const blocks = (buildBusyDayBlocks().get(dateKey(date)) || [])
    .slice()
    .sort((a, b) => {
      if (a.startHour !== b.startHour) return a.startHour - b.startHour;
      if (a.endHour !== b.endHour) return b.endHour - a.endHour;
      return String(a.sourceKey || a.participantId).localeCompare(String(b.sourceKey || b.participantId));
    });

  return blocks.map((block, index) => {
    const items = dedupeBusyItems(block.items || []);
    const sourceKey = block.sourceKey || busyBlockSourceKey(block);
    const participant = {
      participantId: block.participantId,
      ownerId: block.ownerId,
      ownerName: block.ownerName,
      color: block.color,
      start: block.start,
      end: block.end,
      items
    };
    return {
      id: `${dateKey(date)}-busy-${index}-${block.participantId}-${sourceKey}`,
      date,
      startHour: block.startHour,
      endHour: block.endHour,
      participants: [participant],
      participantKey: `${block.participantId}:${sourceKey}`
    };
  });
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
  const sourceOrder = new Map(events.map((eventBlock, index) => [eventBlock, index]));
  const sorted = events
    .slice()
    .sort((a, b) => {
      if (a.startHour !== b.startHour) return a.startHour - b.startHour;
      if (a.endHour !== b.endHour) return b.endHour - a.endHour;
      return (sourceOrder.get(a) || 0) - (sourceOrder.get(b) || 0);
    });
  const laidOut = [];
  let cluster = [];
  let clusterEnd = null;

  const flushCluster = () => {
    if (!cluster.length) return;
    const anchor = cluster
      .slice()
      .sort((a, b) => {
        const durationDifference = (b.endHour - b.startHour) - (a.endHour - a.startHour);
        if (Math.abs(durationDifference) > 0.001) return durationDifference;
        if (a.startHour !== b.startHour) return a.startHour - b.startHour;
        return (sourceOrder.get(a) || 0) - (sourceOrder.get(b) || 0);
      })[0];
    const overlayLaneEnds = [];
    const clusterItems = [{ ...anchor, laneIndex: 0, overlapRole: "anchor" }];

    for (const eventBlock of cluster) {
      if (eventBlock === anchor) continue;
      let overlayLaneIndex = overlayLaneEnds.findIndex((laneEnd) => eventBlock.startHour >= laneEnd);
      if (overlayLaneIndex === -1) {
        overlayLaneIndex = overlayLaneEnds.length;
        overlayLaneEnds.push(eventBlock.endHour);
      } else {
        overlayLaneEnds[overlayLaneIndex] = eventBlock.endHour;
      }
      clusterItems.push({ ...eventBlock, laneIndex: overlayLaneIndex + 1, overlapRole: "overlay" });
    }

    const clusterLaneCount = Math.max(1, overlayLaneEnds.length + 1);
    for (const item of clusterItems) {
      const laneCount = Math.max(
        1,
        ...clusterItems
          .filter((candidate) => (
            candidate.startHour < item.endHour &&
            candidate.endHour > item.startHour
          ))
          .map((candidate) => candidate.laneIndex + 1)
      );
      laidOut.push({
        ...item,
        laneCount,
        clusterLaneCount,
        overlapRole: clusterItems.length > 1 ? item.overlapRole : "single"
      });
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
  return laidOut.sort((a, b) => {
    if (a.startHour !== b.startHour) return a.startHour - b.startHour;
    if (a.endHour !== b.endHour) return b.endHour - a.endHour;
    if (a.laneIndex !== b.laneIndex) return a.laneIndex - b.laneIndex;
    return String(a.id).localeCompare(String(b.id));
  });
}

function calendarLaneGeometry(laneCount = 1, laneIndex = 0) {
  const safeLaneCount = Math.max(1, Number(laneCount || 1));
  const safeLaneIndex = Math.max(0, Math.min(safeLaneCount - 1, Number(laneIndex || 0)));
  if (safeLaneCount === 1 || safeLaneIndex === 0) {
    return {
      laneCount: safeLaneCount,
      laneIndex: safeLaneIndex,
      leftFraction: 0,
      rightFraction: 0,
      widthFraction: 1
    };
  }

  // Keep the long event as the full-width anchor, then cascade overlapping
  // cards with a gentle inset. This preserves enough horizontal space for
  // title, time, and location instead of collapsing foreground events into
  // unreadable slivers.
  const leftFraction = Math.min(0.14, 0.04 + ((safeLaneIndex - 1) * 0.055));
  const rightFraction = 0.02;
  const widthFraction = Math.max(0.84, 1 - leftFraction - rightFraction);

  return {
    laneCount: safeLaneCount,
    laneIndex: safeLaneIndex,
    leftFraction,
    rightFraction,
    widthFraction
  };
}

function applyCalendarLanePosition(
  block,
  dayIndex,
  laneCount = 1,
  laneIndex = 0,
  clusterLaneCount = laneCount
) {
  const dayCount = Number(calendarGrid.style.getPropertyValue("--day-count")) || (currentView === "day" ? 1 : 7);
  const lane = calendarLaneGeometry(laneCount, laneIndex);
  const columnWidthPercent = 100 / dayCount;
  const laneLeftPercent = columnWidthPercent * (dayIndex + lane.leftFraction);
  const laneWidthPercent = columnWidthPercent * lane.widthFraction;
  block.style.left = `calc(${laneLeftPercent}% + var(--calendar-block-gap))`;
  block.style.width = `calc(${laneWidthPercent}% - var(--calendar-block-double-gap))`;
  block.style.setProperty("--event-stack-order", lane.laneIndex);
  block.style.setProperty("--event-cluster-lane-count", Math.max(lane.laneCount, Number(clusterLaneCount || lane.laneCount)));
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
    const isOwnerEditable = canManageEvent(event);
    const showDetails = Boolean(event.viewerCanSeeDetails);
    const allDay = Boolean(event.allDay);
    items.push({
      id: event.id,
      title: showDetails ? event.title : "Busy",
      location: showDetails ? event.location || "" : "",
      participantName: event.createdByDisplayName || "Someone",
      participantColor: event.createdByColor || participantPalette[0].value,
      inviteeParticipantIds: (event.invitees || []).map((invitee) => invitee.participantId),
      isGroupEvent: hasMultipleEventParticipants(eventInviteeIds(event)),
      startHour,
      endHour,
      summary: `${event.responseSummary?.yes || 0} yes · ${event.responseSummary?.maybe || 0} maybe · ${event.responseSummary?.no || 0} no`,
      isInvitee: isInvitee && !isCreator,
      isInvitedViewer: Boolean(event.isInvited),
      continuesBefore: start < dayStart,
      continuesAfter: end > dayEnd,
      showDetails,
      allDay,
      timezone: event.timezone || "UTC",
      eventStart: event.start,
      eventEnd: event.end,
      originalEvent: event,
      isEditable: isOwnerEditable
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
  const names = participants.slice(0, limit).map(calendarParticipantLabel).filter(Boolean);
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

function panelIsVisible(panel) {
  return Boolean(panel && !panel.classList.contains("hidden"));
}

function suppressFollowupOutsideSurfaceClick() {
  suppressOutsideSurfaceClick = true;
  if (suppressOutsideSurfaceTimer) window.clearTimeout(suppressOutsideSurfaceTimer);
  suppressOutsideSurfaceTimer = window.setTimeout(() => {
    suppressOutsideSurfaceClick = false;
    suppressOutsideSurfaceTimer = null;
  }, 600);
}

function dismissOutsideFloatingSurfaces(target) {
  let dismissed = false;
  const datePickerTarget = window.commonGroundDatePicker?.containsTarget(target) === true;

  if (
    (weatherHourlyPopoverIsOpen() || weatherHourlyTrigger) &&
    !weatherHourlyPopover?.contains(target)
  ) {
    closeWeatherHourlyPopover();
    hideWeatherHighLowTooltip({ immediate: true });
    dismissed = true;
  }

  if (activeEventTimePicker && !activeEventTimePicker.field.contains(target)) {
    closeEventTimePicker({ commit: true });
    dismissed = true;
  }

  if (
    emojiPickerState.open &&
    !emojiPickerPopover?.contains(target) &&
    !emojiPickerState.trigger?.contains(target)
  ) {
    closeEmojiPicker({ restoreFocus: false });
    dismissed = true;
  }

  if (panelIsVisible(hostPopover) && !hostPopover.contains(target)) {
    setSettingsPanelOpen(false, { restoreFocus: false });
    dismissed = true;
  }

  if (
    calendarUtilityOverflowButton?.getAttribute("aria-expanded") === "true" &&
    !calendarUtilityOverflowMenu?.contains(target) &&
    !calendarUtilityOverflowButton.contains(target)
  ) {
    setCalendarUtilityMenuOpen(false);
    dismissed = true;
  }

  const expandedStacks = [...document.querySelectorAll(".busy-stack.expanded")];
  if (expandedStacks.length && !expandedStacks.some((stack) => stack.contains(target))) {
    closeExpandedBusyStacks();
    dismissed = true;
  }

  for (const menu of document.querySelectorAll(".color-picker-menu[open]")) {
    if (menu.contains(target)) continue;
    menu.open = false;
    dismissed = true;
  }

  if (calendarViewMenu?.open && !calendarViewMenu.contains(target)) {
    calendarViewMenu.open = false;
    dismissed = true;
  }

  if (eventInviteDropdown?.open && !eventInviteDropdown.contains(target)) {
    eventInviteDropdown.open = false;
    dismissed = true;
  }

  if (panelIsVisible(detailPanel) && !detailPanel.contains(target) && !datePickerTarget) {
    clearDetailPanel();
    dismissed = true;
  }

  return datePickerTarget ? false : dismissed;
}

function targetAcceptsTextEntry(target) {
  if (!(target instanceof Element)) return false;
  const editable = target.closest(
    'textarea:not(:disabled), input:not(:disabled), [contenteditable="true"]'
  );
  if (!editable) return false;
  if (editable instanceof HTMLTextAreaElement || editable.matches('[contenteditable="true"]')) return true;
  if (!(editable instanceof HTMLInputElement)) return false;
  return ["text", "search", "email", "url", "tel", "password", "number"].includes(editable.type);
}

function handleOutsideFloatingSurfacePointer(event) {
  if (event.button !== undefined && event.button !== 0) return;
  if (!dismissOutsideFloatingSurfaces(event.target)) return;
  if (targetAcceptsTextEntry(event.target)) return;
  suppressFollowupOutsideSurfaceClick();
  event.preventDefault();
  event.stopImmediatePropagation();
}

function handleOutsideFloatingSurfaceClick(event) {
  if (!suppressOutsideSurfaceClick) return;
  suppressOutsideSurfaceClick = false;
  if (suppressOutsideSurfaceTimer) window.clearTimeout(suppressOutsideSurfaceTimer);
  suppressOutsideSurfaceTimer = null;
  event.preventDefault();
  event.stopImmediatePropagation();
}

function createSingleBusyCard(segment, dayIndex) {
  const participant = segment.participants[0];
  const isOwnBlock = participant.participantId === currentParticipant?.id;
  const singleItem = participant.items?.length === 1 ? participant.items[0] : null;
  const dayBlockItem = singleItem?.provider === "commonground_day_block" ? singleItem : null;
  const googleItem = participant.items?.length === 1 &&
    participant.items[0]?.provider === "google" &&
    participant.items[0]?.editable === true
    ? participant.items[0]
    : null;
  const canMove = Boolean(
    isOwnBlock &&
    googleItem?.googleCalendarId &&
    googleItem?.googleEventId &&
    googleItem?.start &&
    googleItem?.end &&
    sameDate(new Date(googleItem.start), new Date(googleItem.end))
  );
  const ownerLabel = calendarParticipantLabel(participant);
  const visibilityLabel = busyVisibilityLabel(participant, isOwnBlock);
  const block = document.createElement("button");
  block.type = "button";
  const duration = segment.endHour - segment.startHour;
  const { durationClass } = eventCardMetrics(duration);
  const isTiny = duration < 0.75;
  const isCompact = duration < 1;
  const hasInvitedOverlap = invitedEventOverlap(participant.participantId, segment.date, segment.startHour, segment.endHour);
  const hasLaneOverlap = Number(segment.laneCount || 1) > 1;
  const laneIndex = Math.max(0, Number(segment.laneIndex || 0));
  const isOverlapAnchor = hasLaneOverlap && laneIndex === 0;
  const isOverlapOverlay = hasLaneOverlap && laneIndex > 0;
  const laneSizeClass = hasLaneOverlap ? `event-lanes-${Math.min(Number(segment.laneCount || 1), 4)}` : "";
  block.className = [
    "busy-card",
    durationClass,
    isCompact ? "compact" : "",
    isTiny ? "tiny" : "",
    hasInvitedOverlap ? "invited-overlap" : "",
    isOverlapAnchor ? "busy-overlap-anchor" : "",
    isOverlapOverlay ? "busy-overlap-lane" : "",
    laneSizeClass,
    dayBlockItem ? "day-block-card" : "",
    canMove ? "can-move" : ""
  ].filter(Boolean).join(" ");
  block.dataset.canMove = String(canMove);
  block.dataset.overlapRole = hasLaneOverlap ? (isOverlapAnchor ? "anchor" : "overlay") : "single";
  block.dataset.googleCalendarId = googleItem?.googleCalendarId || "";
  block.dataset.googleEventId = googleItem?.googleEventId || "";
  block.dataset.eventStart = googleItem?.start || "";
  block.dataset.eventEnd = googleItem?.end || "";
  block.dataset.eventDate = dateKey(segment.date);
  block.dataset.dayBlockDate = dayBlockItem?.date || "";
  block.dataset.dayIndex = String(dayIndex);
  block.dataset.startMinute = String(Math.round((segment.startHour - calendarStartHour) * 60));
  block.dataset.durationMinute = String(Math.max(
    eventResizeMinMinutes,
    Math.round((segment.endHour - segment.startHour) * 60)
  ));
  block.style.setProperty("--day-index", dayIndex);
  block.style.setProperty("--start", segment.startHour - calendarStartHour);
  block.style.setProperty("--duration", duration);
  block.style.setProperty("--event-color", participant.color);
  applyEventInk(block, participant.color);
  applyCalendarLanePosition(
    block,
    dayIndex,
    segment.laneCount,
    segment.laneIndex,
    segment.clusterLaneCount
  );
  const coversVisibleDay = duration >= (calendarEndHour - calendarStartHour) - 0.001;
  const timeRange = coversVisibleDay ? "All day" : formatEventRange(segment.startHour, segment.endHour);
  const titleLabel = normalizedTextKey(visibilityLabel) === normalizedTextKey(ownerLabel) ? "" : visibilityLabel;
  const titleText = titleLabel || (isOwnBlock ? "(No title)" : "Busy");
  const locationLabel = isOwnBlock ? calendarLocationLabel(singleItem?.location) : "";
  const participantLabel = isOwnBlock ? "" : ownerLabel;
  const compactLine = [ownerLabel, titleLabel].filter(Boolean).join(" · ");
  const tooltip = [ownerLabel, titleLabel || (isOwnBlock ? "No title" : "Busy"), timeRange].filter(Boolean).join(" · ");
  block.dataset.tooltip = tooltip;
  block.title = tooltip;
  block.setAttribute("aria-label", [formatFullDate(segment.date), ownerLabel, titleLabel || (isOwnBlock ? "No title" : "Busy"), timeRange].filter(Boolean).join(", "));

  const appendLine = (className, text) => {
    if (!text) return null;
    const line = document.createElement("div");
    line.className = `busy-line ${className}`;
    line.textContent = text;
    block.appendChild(line);
    return line;
  };

  appendLine("busy-line-title", titleText);
  if (durationClass === "event-15" || durationClass === "event-30") {
    configureCalendarBlockTimeLine(appendLine("busy-line-time", timeRange));
  } else if (durationClass === "event-45") {
    configureCalendarBlockTimeLine(appendLine("busy-line-time", timeRange));
    appendLine("busy-line-location", locationLabel);
  } else {
    configureCalendarBlockTimeLine(appendLine("busy-line-time", timeRange));
    appendLine("busy-line-location", locationLabel);
    appendLine("busy-line-participant", participantLabel);
  }

  block.addEventListener("click", (event) => {
    if (shouldSuppressCalendarClick(event)) return;
    openBusyDetail(segment);
  });
  if (canMove) {
    block.addEventListener("pointerdown", startGoogleBusyMove);
    block.addEventListener("keydown", handleGoogleBusyKeyboardAdjustment);
    block.setAttribute(
      "aria-description",
      "Alt plus Up or Down moves by 15 minutes. Alt plus Shift plus Up or Down changes the duration by 15 minutes. Alt plus Left or Right moves by one day."
    );
  }
  return block;
}

function createBusyStack(segment, dayIndex) {
  const duration = segment.endHour - segment.startHour;
  const { sizeClass, durationClass } = eventCardMetrics(duration);
  const hasLaneOverlap = Number(segment.laneCount || 1) > 1;
  const laneIndex = Math.max(0, Number(segment.laneIndex || 0));
  const isOverlapAnchor = hasLaneOverlap && laneIndex === 0;
  const isOverlapOverlay = hasLaneOverlap && laneIndex > 0;
  const isFifteen = durationClass === "event-15";
  const hasInvitedOverlap = segment.participants.some((participant) => (
    invitedEventOverlap(participant.participantId, segment.date, segment.startHour, segment.endHour)
  ));
  const stack = document.createElement("div");
  stack.className = `busy-stack ${isOverlapAnchor ? "busy-overlap-anchor" : ""} ${isOverlapOverlay ? "busy-overlap-lane" : ""} ${hasInvitedOverlap ? "invited-overlap" : ""}`.trim();
  stack.dataset.overlapRole = hasLaneOverlap ? (isOverlapAnchor ? "anchor" : "overlay") : "single";
  stack.style.setProperty("--day-index", dayIndex);
  stack.style.setProperty("--start", segment.startHour - calendarStartHour);
  stack.style.setProperty("--duration", duration);
  applyCalendarLanePosition(
    stack,
    dayIndex,
    segment.laneCount,
    segment.laneIndex,
    segment.clusterLaneCount
  );
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
    const ownerLabel = calendarParticipantLabel(participant);
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
    applyEventInk(card, participant.color);
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

function createEventBlock(item, dayIndex, dayDate) {
  const block = document.createElement("button");
  block.type = "button";
  const duration = item.endHour - item.startHour;
  const startMinute = Math.round((item.startHour - calendarStartHour) * 60);
  const durationMinute = Math.max(
    eventResizeMinMinutes,
    Math.round((item.endHour - item.startHour) * 60)
  );
  const { sizeClass, durationClass } = eventCardMetrics(duration);
  const laneCount = Math.max(1, Number(item.laneCount || 1));
  const laneIndex = Math.max(0, Number(item.laneIndex || 0));
  const isOverlapAnchor = laneCount > 1 && laneIndex === 0;
  const isOverlapOverlay = laneCount > 1 && laneIndex > 0;
  const laneSizeClass = laneCount > 1 ? `event-lanes-${Math.min(laneCount, 4)}` : "";
  const isEditable = canManageEvent(item.originalEvent || {});
  const isOwnedByViewer = Boolean(
    currentParticipant?.id &&
    item.originalEvent?.createdByParticipantId === currentParticipant.id
  );
  const canMove = Boolean(
    isOwnedByViewer &&
    !item.continuesBefore &&
    !item.continuesAfter &&
    !item.allDay &&
    item.id &&
    item.eventStart &&
    item.eventEnd
  );
  const canResizeTop = Boolean(isEditable && !item.continuesBefore && !item.allDay && item.id && item.eventStart);
  const canResizeBottom = Boolean(isEditable && !item.continuesAfter && !item.allDay && item.id && item.eventEnd);
  block.className = [
    "event-card",
    sizeClass,
    durationClass,
    isOverlapAnchor ? "event-overlap-anchor" : "",
    isOverlapOverlay ? "event-overlap-lane" : "",
    laneSizeClass,
    isEditable ? "can-resize" : "",
    canMove ? "can-move" : "",
    canResizeTop ? "event-resize-top" : "",
    canResizeBottom ? "event-resize-bottom" : "",
    item.isInvitee ? "invitee" : "",
    item.isInvitedViewer ? "is-invited-viewer" : "",
    item.isGroupEvent ? "is-group-event" : "",
    item.id === selectedEventId ? "is-selected" : ""
  ].filter(Boolean).join(" ");
  block.dataset.eventId = item.id;
  block.dataset.overlapRole = laneCount > 1 ? (isOverlapAnchor ? "anchor" : "overlay") : "single";
  block.dataset.eventDate = dayDate ? dateKey(dayDate) : "";
  block.dataset.eventStart = item.eventStart || "";
  block.dataset.eventEnd = item.eventEnd || "";
  block.dataset.eventTimezone = item.timezone || "UTC";
  block.dataset.dayIndex = String(dayIndex);
  block.dataset.canResizeTop = String(canResizeTop);
  block.dataset.canResizeBottom = String(canResizeBottom);
  block.dataset.canMove = String(canMove);
  block.dataset.startMinute = String(startMinute);
  block.dataset.durationMinute = String(durationMinute);
  block.setAttribute("aria-pressed", String(item.id === selectedEventId));
  block.style.setProperty("--day-index", dayIndex);
  block.style.setProperty("--start", item.startHour - calendarStartHour);
  block.style.setProperty("--duration", duration);
  block.style.setProperty("--event-owner-color", item.participantColor);
  applyEventInk(block, item.participantColor);
  block.style.setProperty("--event-lane-count", laneCount);
  block.style.setProperty("--event-lane-index", laneIndex);
  applyCalendarLanePosition(block, dayIndex, laneCount, laneIndex, item.clusterLaneCount);
  const timeRange = formatEventRange(item.startHour, item.endHour);
  const ownerLabel = calendarEventOwnerLabel(item);
  const fullDateLabel = dayDate ? formatFullDate(dayDate) : "";
  block.setAttribute("aria-label", [fullDateLabel, ownerLabel, item.title || "Event", timeRange].filter(Boolean).join(", "));
  const tooltip = [ownerLabel, item.title, timeRange, item.location, item.summary].filter(Boolean).join("\n");
  block.dataset.tooltip = tooltip;
  block.title = tooltip;
  const titleText = item.title === "No title" ? "(No title)" : (item.title || "(No title)");
  const participantLabel = isOwnedByViewer ? "" : ownerLabel;
  const locationLabel = calendarLocationLabel(item.location);
  const compactPrefix = [ownerLabel, titleText].filter(Boolean).join(" · ");
  const compactMeta = [timeRange, item.location].filter(Boolean).join(" · ");

  const appendLine = (className, text) => {
    if (!text) return null;
    const line = document.createElement("div");
    line.className = `event-line ${className}`;
    line.textContent = text;
    block.appendChild(line);
    return line;
  };

    appendLine("event-line-title", titleText);
  if (durationClass === "event-15" || durationClass === "event-30") {
    configureCalendarBlockTimeLine(appendLine("event-line-meta", timeRange));
  } else if (durationClass === "event-45") {
    configureCalendarBlockTimeLine(appendLine("event-line-meta", timeRange));
    appendLine("event-line-location", locationLabel);
  } else {
    configureCalendarBlockTimeLine(appendLine("event-line-meta", timeRange));
    appendLine("event-line-location", locationLabel);
    appendLine("event-line-participant", participantLabel);
  }

  block.addEventListener("click", (event) => {
    if (shouldSuppressCalendarClick(event)) return;
    if (event.target.closest(".event-resize-handle")) return;
    openEventDetail(item.id);
  });
  if (canMove) {
    block.addEventListener("pointerdown", startEventMove);
    block.addEventListener("keydown", handleRoomEventKeyboardAdjustment);
    block.setAttribute(
      "aria-description",
      "Alt plus Up or Down moves by 15 minutes. Alt plus Shift plus Up or Down changes the duration by 15 minutes. Alt plus Left or Right moves by one day."
    );
  }

  if (canResizeTop) {
    const topHandle = document.createElement("span");
    topHandle.className = "event-resize-handle event-resize-handle-top";
    topHandle.setAttribute("data-edge", "top");
    topHandle.setAttribute("aria-label", "Resize event start");
    topHandle.tabIndex = -1;
    topHandle.addEventListener("pointerdown", startEventResize);
    block.appendChild(topHandle);
  }

  if (canResizeBottom) {
    const bottomHandle = document.createElement("span");
    bottomHandle.className = "event-resize-handle event-resize-handle-bottom";
    bottomHandle.setAttribute("data-edge", "bottom");
    bottomHandle.setAttribute("aria-label", "Resize event end");
    bottomHandle.tabIndex = -1;
    bottomHandle.addEventListener("pointerdown", startEventResize);
    block.appendChild(bottomHandle);
  }

  return block;
}

function configureFreeGlowBlock(block, segment, dayIndex, { live = false } = {}) {
  const occupiedSegments = segment.occupiedSegments || [];
  const duration = segment.endHour - segment.startHour;
  const freeSizeClass = duration <= 0.25 ? "free-15" : duration <= 0.5 ? "free-30" : duration < 1 ? "free-45" : "free-long";
  const labelHeightHours = duration >= 2 ? 1.35 : duration >= 1 ? 0.82 : 0.42;
  const labelOverlap = occupiedSegments.some((item) => (
    item.endHour > segment.startHour && item.startHour < Math.min(segment.endHour, segment.startHour + labelHeightHours)
  ));
  block.className = [
    "free-block",
    "free-glow-block",
    freeSizeClass,
    labelOverlap ? "free-glow-block--label-hidden" : "",
    live ? "is-live-reflowing" : ""
  ].filter(Boolean).join(" ");
  block.style.setProperty("--day-index", dayIndex);
  block.style.setProperty("--start", segment.startHour - calendarStartHour);
  block.style.setProperty("--duration", duration);
  block.dataset.dayKey = dateKey(segment.date);
  block.dataset.dayIndex = String(dayIndex);
  block.dataset.startHour = String(segment.startHour);
  block.dataset.endHour = String(segment.endHour);
  const coversVisibleDay = duration >= (calendarEndHour - calendarStartHour) - 0.001;
  const timeRange = coversVisibleDay ? "All day" : formatEventRange(segment.startHour, segment.endHour);
  block.dataset.tooltip = `${timeRange} free`;
  block.title = block.dataset.tooltip;
  block.setAttribute("aria-label", `${timeRange} free. Create an event.`);
  block.replaceChildren();
  if (duration >= 1 && !labelOverlap) {
    const title = document.createElement("strong");
    const time = document.createElement("span");
    title.textContent = "Free";
    time.textContent = timeRange;
    block.append(title, time);
  } else if (duration >= 0.5 && !labelOverlap) {
    const time = document.createElement("span");
    time.textContent = `${timeRange} free`;
    block.appendChild(time);
  }
  return block;
}

function createFreeGlowBlock(segment, dayIndex, options = {}) {
  const block = document.createElement("button");
  block.type = "button";
  block.addEventListener("click", (event) => {
    if (shouldSuppressCalendarClick(event)) return;
    const startHour = Number(block.dataset.startHour);
    const endHour = Number(block.dataset.endHour);
    if (!Number.isFinite(startHour) || !Number.isFinite(endHour)) return;
    void openCalendarEventComposerAt({
      date: block.dataset.dayKey,
      startMinute: Math.round(startHour * 60),
      durationMinutes: Math.max(15, Math.round((endHour - startHour) * 60)),
      inviteeParticipantIds: defaultInviteeIds()
    });
  });
  return configureFreeGlowBlock(block, segment, dayIndex, options);
}

function plannerSupportsDragCreate() {
  return currentView === "day" || currentView === "week";
}

function isTouchPointer(event) {
  return event.pointerType === "touch" || window.matchMedia("(pointer: coarse)").matches;
}

function dragTargetIsBlocked(target) {
  if (target.closest(".day-header, .calendar-corner")) return true;
  if (target.closest(".event-resize-handle")) return true;
  if (target.closest(".event-card")) return true;
  if (target.closest(".busy-card.can-move")) return true;
  if (target.closest(".busy-card, .busy-stack-summary")) return false;
  return Boolean(target.closest(
    ".busy-stack-popover, .busy-stack-item, .color-picker-menu, .host-popover, .detail-panel, .modal-card, .vote-button, .chip-action, .icon-button, .add-event-button, input, textarea, select, summary, label"
  ));
}

function markCalendarClickSuppressed() {
  suppressCalendarClickUntil = Date.now() + 220;
}

function resolvedCalendarRowHeight() {
  const renderedCellHeight = calendarGrid.querySelector(".calendar-cell")?.getBoundingClientRect().height;
  if (Number.isFinite(renderedCellHeight) && renderedCellHeight > 0) return renderedCellHeight;
  const configuredRowHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--row-height"));
  return Number.isFinite(configuredRowHeight) && configuredRowHeight > 0 ? configuredRowHeight : 58;
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
  const rowHeight = resolvedCalendarRowHeight();
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
  const rowHeight = resolvedCalendarRowHeight();
  const left = rect.left + dayWidth * dragCreateState.dayIndex + 8;
  const top = rect.top + (selection.startHour - calendarStartHour) * rowHeight + 8;
  const width = Math.max(dayWidth - 16, 24);
  const height = Math.max((selection.endHour - selection.startHour) * rowHeight - 12, 24);
  return { left, top, width, height };
}

function calendarComposerSelectionRect(targetDate, startHour, endHour) {
  const eventsLayer = calendarGrid.querySelector(".events-layer");
  if (!eventsLayer || (currentView !== "day" && currentView !== "week")) return null;
  const days = currentView === "day"
    ? [{ date: startOfDay(currentFocusDate) }]
    : currentWeekDays();
  const dayIndex = days.findIndex((day) => sameDate(day.date, targetDate));
  if (dayIndex < 0) return null;
  const rect = eventsLayer.getBoundingClientRect();
  const dayWidth = rect.width / Math.max(1, days.length);
  const rowHeight = resolvedCalendarRowHeight();
  const visibleStart = clampVisibleHour(startHour);
  const visibleEnd = Math.max(visibleStart + 0.25, clampVisibleHour(endHour));
  return {
    left: rect.left + dayWidth * dayIndex + 8,
    top: rect.top + (visibleStart - calendarStartHour) * rowHeight + 8,
    width: Math.max(dayWidth - 16, 24),
    height: Math.max((visibleEnd - visibleStart) * rowHeight - 12, 24)
  };
}

function revealCalendarComposerSelection(targetDate, startHour, endHour) {
  let anchorRect = calendarComposerSelectionRect(targetDate, startHour, endHour);
  const scrollport = calendarGrid.closest(".calendar-wrap");
  if (!anchorRect || !scrollport) return anchorRect;
  const scrollportRect = scrollport.getBoundingClientRect();
  const safeTop = scrollportRect.top + 88;
  const safeBottom = scrollportRect.bottom - 32;
  const anchorBottom = anchorRect.top + anchorRect.height;
  if (anchorRect.top < safeTop || anchorBottom > safeBottom) {
    const targetTop = scrollport.scrollTop + anchorRect.top - safeTop;
    scrollport.scrollTop = Math.max(0, targetTop);
    anchorRect = calendarComposerSelectionRect(targetDate, startHour, endHour);
  }
  return anchorRect;
}

async function openCalendarEventComposerAt(draft = {}) {
  if (!currentRoom?.code || eventModal.open) return false;
  const parsedStart = draft.start ? new Date(draft.start) : null;
  const parsedEnd = draft.end ? new Date(draft.end) : null;
  const hasStart = parsedStart && !Number.isNaN(parsedStart.getTime());
  const hasEnd = parsedEnd && !Number.isNaN(parsedEnd.getTime()) && (!hasStart || parsedEnd > parsedStart);
  const startMinute = Number(draft.startMinute);
  const hasStartMinute = Number.isFinite(startMinute) && startMinute >= 0 && startMinute < 24 * 60;
  const defaultStart = new Date();
  defaultStart.setMinutes(0, 0, 0);
  defaultStart.setHours(Math.max(calendarStartHour + 2, defaultStart.getHours() + 1));
  const targetDate = hasStart
    ? startOfDay(parsedStart)
    : (draft.date
      ? dayStartFromDateKey(draft.date)
      : (hasStartMinute ? startOfDay(currentFocusDate) : startOfDay(defaultStart)));
  const defaultStartHour = defaultStart.getHours() + defaultStart.getMinutes() / 60;
  const startHour = hasStart
    ? parsedStart.getHours() + parsedStart.getMinutes() / 60
    : (hasStartMinute ? startMinute / 60 : defaultStartHour);
  const durationMinutes = Math.max(15, Number(draft.durationMinutes) || 60);
  const endTimeHour = hasEnd
    ? parsedEnd.getHours() + parsedEnd.getMinutes() / 60
    : startHour + durationMinutes / 60;
  const anchorEndHour = hasEnd && sameDate(parsedEnd, targetDate)
    ? endTimeHour
    : Math.min(24, startHour + 1);
  const allDay = draft.allDay === true;
  const selectedInvitees = [...new Set([
    ...defaultInviteeIds(),
    ...(Array.isArray(draft.inviteeParticipantIds) ? draft.inviteeParticipantIds : [])
  ].filter(Boolean))];

  const navigationPromise = goToDateInWeek(targetDate);
  await new Promise((resolve) => window.requestAnimationFrame(resolve));
  const endDate = hasEnd
    ? dateKey(allDay ? addDays(parsedEnd, -1) : parsedEnd)
    : dateKey(addDays(targetDate, allDay ? 0 : Math.floor(endTimeHour / 24)));
  pendingEventPrefill = {
    date: dateKey(targetDate),
    endDate,
    startTime: formatInputTime(startHour),
    endTime: formatInputTime(endTimeHour),
    inviteeParticipantIds: selectedInvitees,
    title: String(draft.title || "").trim(),
    location: String(draft.location || "").trim(),
    description: String(draft.description || "").trim(),
    allDay
  };
  const anchorRect = allDay
    ? null
    : revealCalendarComposerSelection(targetDate, startHour, anchorEndHour);
  openEventModal("create", { anchorRect });
  void navigationPromise.catch((error) => {
    calendarStatus.textContent = error.message || "The calendar could not refresh.";
  });
  return true;
}

window.openCalendarEventComposerAt = openCalendarEventComposerAt;

function upsertCalendarEventPreview({
  dayIndex,
  startHour,
  endHour,
  title = "",
  inviteeParticipantIds = [],
  composer = false
} = {}) {
  const eventsLayer = calendarGrid.querySelector(".events-layer");
  if (!eventsLayer) return null;
  if (!Number.isFinite(dayIndex) || !Number.isFinite(startHour) || !Number.isFinite(endHour) || endHour <= startHour) {
    return null;
  }
  if (!dragPreviewNode) {
    dragPreviewNode = document.createElement("div");
    dragPreviewNode.className = "drag-create-preview";
  }
  const rootStyles = getComputedStyle(document.documentElement);
  const rowHeight = resolvedCalendarRowHeight();
  const blockGap = parseFloat(rootStyles.getPropertyValue("--calendar-block-gap")) || 6;
  const halfGap = parseFloat(rootStyles.getPropertyValue("--calendar-block-half-gap")) || 3;
  const startRows = startHour - calendarStartHour;
  const durationRows = endHour - startHour;
  const previewHeight = Math.max(18, durationRows * rowHeight - blockGap);
  const { sizeClass, durationClass } = eventCardMetrics(durationRows);
  const previewColor = currentParticipant?.color || participantPalette[0]?.value || "#b39458";
  dragPreviewNode.className = [
    "drag-create-preview",
    "event-card",
    sizeClass,
    durationClass,
    composer ? "event-composer-preview" : "",
    hasMultipleEventParticipants(inviteeParticipantIds) ? "is-group-event" : ""
  ].filter(Boolean).join(" ");
  dragPreviewNode.setAttribute("aria-hidden", "true");
  dragPreviewNode.style.setProperty("--day-index", dayIndex);
  dragPreviewNode.style.setProperty("--preview-y", `${startRows * rowHeight + halfGap}px`);
  dragPreviewNode.style.setProperty("--preview-height", `${previewHeight}px`);
  dragPreviewNode.style.setProperty("--event-owner-color", previewColor);
  dragPreviewNode.style.setProperty("--event-color", previewColor);
  dragPreviewNode.dataset.previewTimeRange = formatEventRange(startHour, endHour);
  dragPreviewNode.dataset.previewKind = composer ? "composer" : "drag";
  const titleText = String(title || "").trim() || "(No title)";
  const timeRange = formatEventRange(startHour, endHour);
  const ownerLabel = String(currentParticipant?.displayName || "You").trim() || "You";
  const compactPrefix = [ownerLabel, titleText].filter(Boolean).join(" · ");
  applyEventInk(dragPreviewNode, previewColor);
  dragPreviewNode.innerHTML = `
    <div class="drag-create-preview-copy">
      ${durationClass === "event-15"
        ? `<div class="event-line event-line-compact event-line-owner">${escapeHtml(compactPrefix)}</div>`
        : `<div class="event-line event-line-owner">${escapeHtml(ownerLabel)}</div>
           <div class="event-line event-line-title">${escapeHtml(titleText)}</div>`}
      <div class="event-line event-line-meta" data-event-time-line="true" data-event-time-prefix="" data-event-time-suffix="">${escapeHtml(timeRange)}</div>
    </div>
  `;
  if (!dragPreviewNode.isConnected) {
    eventsLayer.appendChild(dragPreviewNode);
  }
  return dragPreviewNode;
}

function ensureDragPreview() {
  if (!dragCreateState) return;
  const selection = dragSelection();
  if (!selection) return;
  upsertCalendarEventPreview({
    dayIndex: dragCreateState.dayIndex,
    startHour: selection.startHour,
    endHour: selection.endHour,
    inviteeParticipantIds: defaultInviteeIds()
  });
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

function eventComposerPreviewDraft() {
  if (!eventComposerPreviewActive || !eventModal?.open || editingEventId || eventAllDayInput?.checked) {
    return null;
  }
  const targetDate = dayStartFromDateKey(eventDateInput.value);
  const startMinute = timeInputValueToMinutes(eventStartInput.value);
  const endMinute = timeInputValueToMinutes(eventEndInput.value);
  if (startMinute === null || endMinute === null) return null;

  const start = dateTimeFromDateKeyAndMinutes(eventDateInput.value, startMinute);
  const endDateKey = eventEndDateInput?.value || eventDateInput.value;
  const end = dateTimeFromDateKeyAndMinutes(endDateKey, endMinute);
  if (end <= start && endMinute === 0 && endDateKey === eventDateInput.value) {
    end.setDate(end.getDate() + 1);
  }
  if (end <= start) return null;

  const visibleStartHour = clampVisibleHour(startMinute / 60);
  const endsOnStartDate = sameDate(start, end);
  const visibleEndHour = clampVisibleHour(endsOnStartDate ? endMinute / 60 : calendarEndHour);
  if (visibleEndHour <= visibleStartHour) return null;

  return {
    targetDate,
    startHour: visibleStartHour,
    endHour: visibleEndHour,
    title: eventTitleInput.value,
    inviteeParticipantIds: [...inviteePicker.querySelectorAll("input[type='checkbox']:checked")]
      .map((input) => input.value)
  };
}

function plannerDayIndexForDate(targetDate) {
  if (currentView === "day") {
    return sameDate(startOfDay(currentFocusDate), targetDate) ? 0 : -1;
  }
  if (currentView !== "week") return -1;
  return currentWeekDays().findIndex((day) => sameDate(day.date, targetDate));
}

function ensureEventComposerDateVisible(targetDate) {
  if (plannerDayIndexForDate(targetDate) >= 0) return false;
  if (currentView !== "day" && currentView !== "week") currentView = "week";
  currentFocusDate = startOfDay(targetDate);
  syncMiniCalendarToFocus();
  animateCalendarTransition(render);
  void loadCalendarRangeWithMotion()
    .then((loaded) => {
      if (!loaded || !eventComposerPreviewActive) return;
      render();
      scheduleEventComposerPreviewUpdate();
    })
    .catch((error) => {
      calendarStatus.textContent = error.message || "The calendar could not refresh.";
    });
  return true;
}

function syncEventComposerPreview({ reveal = false, navigate = false } = {}) {
  if (!eventComposerPreviewActive) return null;
  const draft = eventComposerPreviewDraft();
  if (!draft) {
    clearDragPreview();
    eventModalAnchorRect = null;
    eventModal.classList.remove("anchored-composer");
    delete eventModal.dataset.anchorSide;
    eventModal.style.removeProperty("--composer-left");
    eventModal.style.removeProperty("--composer-top");
    eventModal.style.removeProperty("--composer-transform-origin");
    return null;
  }

  if (navigate) ensureEventComposerDateVisible(draft.targetDate);
  const dayIndex = plannerDayIndexForDate(draft.targetDate);
  if (dayIndex < 0) {
    clearDragPreview();
    return null;
  }
  if (reveal) {
    revealCalendarComposerSelection(draft.targetDate, draft.startHour, draft.endHour);
  }
  const preview = upsertCalendarEventPreview({
    ...draft,
    dayIndex,
    composer: true
  });
  if (!preview) return null;

  const previewRect = preview.getBoundingClientRect();
  eventModalAnchorRect = {
    left: previewRect.left,
    top: previewRect.top,
    width: previewRect.width,
    height: previewRect.height
  };
  eventModal.classList.add("anchored-composer");
  positionEventModal();
  return preview;
}

function scheduleEventComposerPreviewUpdate({ reveal = false, navigate = false } = {}) {
  if (!eventComposerPreviewActive) return;
  eventComposerPreviewShouldReveal = eventComposerPreviewShouldReveal || reveal;
  eventComposerPreviewShouldNavigate = eventComposerPreviewShouldNavigate || navigate;
  if (eventComposerPreviewFrame) return;
  eventComposerPreviewFrame = window.requestAnimationFrame(() => {
    eventComposerPreviewFrame = 0;
    const shouldReveal = eventComposerPreviewShouldReveal;
    const shouldNavigate = eventComposerPreviewShouldNavigate;
    eventComposerPreviewShouldReveal = false;
    eventComposerPreviewShouldNavigate = false;
    syncEventComposerPreview({ reveal: shouldReveal, navigate: shouldNavigate });
  });
}

function deactivateEventComposerPreview() {
  eventComposerPreviewActive = false;
  eventComposerPreviewShouldReveal = false;
  eventComposerPreviewShouldNavigate = false;
  if (eventComposerPreviewFrame) {
    window.cancelAnimationFrame(eventComposerPreviewFrame);
    eventComposerPreviewFrame = 0;
  }
  clearDragPreview();
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
    title: "",
    location: "",
    description: ""
  };
  openEventModal("create", { anchorRect });
}

function stopDragCreate({ preservePreview = false } = {}) {
  if (dragCreateState?.captureTarget?.hasPointerCapture?.(dragCreateState.pointerId)) {
    dragCreateState.captureTarget.releasePointerCapture(dragCreateState.pointerId);
  }
  window.removeEventListener("pointermove", handleDragCreateMove);
  window.removeEventListener("pointerup", handleDragCreateEnd);
  window.removeEventListener("pointercancel", handleDragCreateCancel);
  dragCreateState = null;
  if (!preservePreview) clearDragPreview();
}

function resetEventResizeVisual(
  block,
  startMinute = Number(block?.dataset.startMinute),
  durationMinute = Number(block?.dataset.durationMinute)
) {
  if (!block) return;
  if (!Number.isFinite(startMinute) || !Number.isFinite(durationMinute)) return;
  applyEventResizePreview(block, startMinute, durationMinute);
  restoreCalendarBlockTimeText(block);
}

function configureCalendarBlockTimeLine(line, { prefix = "", suffix = "" } = {}) {
  if (!line) return null;
  line.dataset.eventTimeLine = "true";
  line.dataset.eventTimePrefix = String(prefix || "");
  line.dataset.eventTimeSuffix = String(suffix || "");
  line.dataset.eventTimeOriginal = line.textContent || "";
  line.setAttribute("aria-live", "polite");
  line.setAttribute("aria-atomic", "true");
  return line;
}

function updateCalendarBlockTimeText(block, startMinute, durationMinute) {
  const line = block?.querySelector?.('[data-event-time-line="true"]');
  if (!line) return "";

  const safeStartMinute = clampEventMinutes(
    snapEventMinutes(startMinute, eventResizeSnapMinutes),
    0,
    24 * 60 - eventResizeMinMinutes
  );
  const safeDurationMinute = clampEventMinutes(
    snapEventMinutes(durationMinute, eventResizeSnapMinutes),
    eventResizeMinMinutes,
    24 * 60 - safeStartMinute
  );
  const startHour = calendarStartHour + safeStartMinute / 60;
  const endHour = calendarStartHour + (safeStartMinute + safeDurationMinute) / 60;
  const timeRange = formatEventRange(startHour, endHour);
  const parts = [
    line.dataset.eventTimePrefix || "",
    timeRange,
    line.dataset.eventTimeSuffix || ""
  ].filter(Boolean);

  line.textContent = parts.join(" \u00b7 ");
  block.dataset.previewTimeRange = timeRange;
  return timeRange;
}

function restoreCalendarBlockTimeText(block) {
  const line = block?.querySelector?.('[data-event-time-line="true"]');
  if (!line) return;
  if (line.hasAttribute("data-event-time-original")) {
    line.textContent = line.dataset.eventTimeOriginal || "";
  }
  delete block.dataset.previewTimeRange;
}

function applyEventResizePreview(block, startMinute, durationMinute) {
  if (!block) return { startMinute: 0, durationMinute: eventResizeMinMinutes };

  const clampedStart = clampEventMinutes(Math.round(startMinute), 0, (24 * 60) - eventResizeMinMinutes);
  const clampedDuration = Math.max(
    eventResizeMinMinutes,
    Math.min(24 * 60 - clampedStart, Math.round(durationMinute))
  );
  const safeDuration = Math.max(eventResizeMinMinutes, clampEventMinutes(clampedDuration, eventResizeMinMinutes, 24 * 60));

  const snappedStart = snapEventMinutes(clampedStart, eventResizeSnapMinutes);
  const snappedDuration = clampEventMinutes(safeDuration, eventResizeMinMinutes, 24 * 60 - snappedStart);

  const { sizeClass, durationClass } = eventCardMetrics(Math.max(0.25, snappedDuration / 60));
  block.style.setProperty("--start", `${snappedStart / 60}`);
  block.style.setProperty("--duration", `${snappedDuration / 60}`);
  block.dataset.startMinute = String(snappedStart);
  block.dataset.durationMinute = String(snappedDuration);
  block.classList.remove(
    "event-15",
    "event-30",
    "event-45",
    "event-60plus",
    "event-small",
    "event-medium",
    "event-large",
    "event-tiny"
  );
  block.classList.add(sizeClass, durationClass);
  updateCalendarBlockTimeText(block, snappedStart, snappedDuration);
  return { startMinute: snappedStart, durationMinute: snappedDuration };
}

function animateLiveFreeBlock(block, previousRect = null) {
  if (!block || reducedMotionQuery.matches || typeof block.animate !== "function") return;
  freeBlockReflowAnimations.get(block)?.cancel();

  const nextRect = block.getBoundingClientRect();
  const hasPreviousGeometry = Boolean(
    previousRect &&
    previousRect.width > 0 &&
    previousRect.height > 0 &&
    nextRect.width > 0 &&
    nextRect.height > 0
  );
  const translateY = hasPreviousGeometry ? previousRect.top - nextRect.top : 0;
  const scaleY = hasPreviousGeometry
    ? clampEventMinutes(previousRect.height / nextRect.height, 0.2, 5)
    : 0.94;
  const hasVisibleChange = !hasPreviousGeometry || Math.abs(translateY) > 0.5 || Math.abs(scaleY - 1) > 0.01;
  if (!hasVisibleChange) return;

  const animation = block.animate([
    {
      opacity: hasPreviousGeometry ? 0.78 : 0.5,
      transform: `translate3d(0, ${translateY}px, 0) scaleY(${scaleY})`
    },
    {
      opacity: 1,
      transform: "translate3d(0, 0, 0) scaleY(1)"
    }
  ], {
    duration: motionFastMs,
    easing: "cubic-bezier(0.32, 0.72, 0, 1)",
    fill: "none"
  });
  freeBlockReflowAnimations.set(block, animation);
  animation.addEventListener("finish", () => {
    if (freeBlockReflowAnimations.get(block) === animation) {
      freeBlockReflowAnimations.delete(block);
    }
  }, { once: true });
  animation.addEventListener("cancel", () => {
    if (freeBlockReflowAnimations.get(block) === animation) {
      freeBlockReflowAnimations.delete(block);
    }
  }, { once: true });
}

function refreshLiveFreeBlocksForResize(
  state,
  startMinute,
  durationMinute,
  { live = true, force = false } = {}
) {
  if (!state?.dayKey || !Number.isFinite(startMinute) || !Number.isFinite(durationMinute)) return;
  if (!freeBlocksEnabled()) {
    calendarGrid.querySelectorAll(".free-block").forEach((block) => block.remove());
    return;
  }
  const signature = `${state.dayKey}:${startMinute}:${durationMinute}:${live ? "live" : "settled"}`;
  if (!force && state.liveFreeSignature === signature) return;
  state.liveFreeSignature = signature;

  const eventsLayer = calendarGrid.querySelector(".events-layer");
  if (!eventsLayer) return;
  const date = dayStartFromDateKey(state.dayKey);
  const startHour = calendarStartHour + startMinute / 60;
  const endHour = calendarStartHour + (startMinute + durationMinute) / 60;
  const busySegments = state.liveBusySegments || busySegmentsForDate(date);
  const eventBlocks = state.liveEventBlocks || eventBlocksForDate(date);
  state.liveBusySegments = busySegments;
  state.liveEventBlocks = eventBlocks;
  const previewEvents = eventBlocks.map((eventBlock) => (
    String(eventBlock.id) === String(state.eventId)
      ? { ...eventBlock, startHour, endHour }
      : eventBlock
  ));
  const occupiedSegments = occupiedSegmentsForDate(date, busySegments, previewEvents);
  const nextSegments = freeSegmentsForDate(date, occupiedSegments)
    .map((segment) => ({ ...segment, occupiedSegments }));
  const dayIndex = Number.isFinite(Number(state.dayIndex)) ? Number(state.dayIndex) : 0;
  const existing = [...eventsLayer.querySelectorAll(".free-block")]
    .filter((block) => block.dataset.dayKey === state.dayKey)
    .sort((a, b) => Number(a.dataset.startHour) - Number(b.dataset.startHour));
  const previousRects = existing.map((block) => block.getBoundingClientRect());
  const nextBlocks = [];
  const firstOccupiedNode = eventsLayer.querySelector(".busy-card, .busy-stack, .event-card");

  nextSegments.forEach((segment, index) => {
    let block = existing[index];
    if (block) {
      configureFreeGlowBlock(block, segment, dayIndex, { live });
    } else {
      block = createFreeGlowBlock(segment, dayIndex, { live });
      eventsLayer.insertBefore(block, firstOccupiedNode);
    }
    nextBlocks.push(block);
  });

  for (const staleBlock of existing.slice(nextSegments.length)) {
    freeBlockReflowAnimations.get(staleBlock)?.cancel();
    freeBlockReflowAnimations.delete(staleBlock);
    staleBlock.remove();
  }

  nextBlocks.forEach((block, index) => {
    animateLiveFreeBlock(block, previousRects[index] || null);
  });
}

function buildEventResizePayload(eventEntry, startMinute, durationMinute, dayKey) {
  const date = dayStartFromDateKey(dayKey || dateKey(startOfDay(new Date())));
  const snappedStart = clampEventMinutes(
    snapEventMinutes(startMinute, eventResizeSnapMinutes),
    0,
    24 * 60 - eventResizeMinMinutes
  );
  const snappedDuration = clampEventMinutes(
    snapEventMinutes(durationMinute, eventResizeSnapMinutes),
    eventResizeMinMinutes,
    24 * 60 - snappedStart
  );
  const snappedEnd = snappedStart + snappedDuration;

  const nextStart = new Date(date);
  const nextEnd = new Date(date);
  nextStart.setHours(0, snappedStart, 0, 0);
  nextEnd.setHours(0, snappedEnd, 0, 0);

  return {
    title: eventEntry.title || "(No title)",
    start: nextStart.toISOString(),
    end: nextEnd.toISOString(),
    timezone: eventEntry.timezone || "UTC",
    allDay: Boolean(eventEntry.allDay),
    location: eventEntry.location || "",
    description: eventEntry.description || "",
    syncToGoogle: eventEntry.syncToGoogle === true,
    syncToOutlook: eventEntry.syncToOutlook === true,
    inviteeParticipantIds: eventInviteeIds(eventEntry)
  };
}

function resetEventMoveVisual(block) {
  if (!block) return;
  block.querySelectorAll(".event-move-snap-feedback").forEach((node) => node.remove());
  restoreCalendarBlockTimeText(block);
  block.classList.remove("is-moving", "is-move-committing");
  block.style.removeProperty("--event-move-x");
  block.style.removeProperty("--event-move-y");
}

function settleEventMoveVisual(block) {
  if (!block) return;
  block.querySelectorAll(".event-move-snap-feedback").forEach((node) => node.remove());
  block.classList.remove("is-moving");
  block.classList.add("is-move-committing");
}

function ensureEventMoveFeedback(state) {
  if (!state?.block) return {};
  const timeLine = state.block.querySelector('[data-event-time-line="true"]');

  let snapFeedback = state.snapFeedback;
  if (!snapFeedback?.isConnected) {
    snapFeedback = document.createElement("span");
    snapFeedback.className = "event-move-snap-feedback";
    snapFeedback.setAttribute("aria-hidden", "true");
    state.block.appendChild(snapFeedback);
    state.snapFeedback = snapFeedback;
  }
  return { timeLine, snapFeedback };
}

function triggerEventMoveSnapFeedback(state) {
  if (!state || reducedMotionQuery.matches) return;
  const { timeLine, snapFeedback } = ensureEventMoveFeedback(state);
  state.timeAnimation?.cancel?.();
  state.snapAnimation?.cancel?.();
  state.timeAnimation = timeLine?.animate?.([
    { opacity: 0.76, transform: "translate3d(0, 0, 0) scale(0.96)" },
    { opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" }
  ], {
    duration: eventMoveSnapFeedbackMs,
    easing: "cubic-bezier(0.32, 0.72, 0, 1)",
    fill: "none"
  });
  state.snapAnimation = snapFeedback?.animate?.([
    { opacity: 0.72, transform: "scale(0.985)" },
    { opacity: 0, transform: "scale(1.015)" }
  ], {
    duration: eventMoveSnapFeedbackMs,
    easing: "cubic-bezier(0.32, 0.72, 0, 1)",
    fill: "none"
  });
}

function updateEventMoveFeedback(state, dayIndex, startMinute) {
  if (!state?.block) return;
  ensureEventMoveFeedback(state);
  updateCalendarBlockTimeText(state.block, startMinute, state.baseDurationMinute);

  const snapChanged = state.lastSnapStartMinute !== startMinute;
  if (state.hasDisplayedMoveTime && snapChanged) {
    triggerEventMoveSnapFeedback(state);
  }
  state.hasDisplayedMoveTime = true;
  state.lastSnapStartMinute = startMinute;
  state.lastSnapDayIndex = dayIndex;
}

function applyEventMovePreview(state, dayIndex, startMinute) {
  const { block, baseDayIndex, baseStartMinute, baseDurationMinute, pixelsPerMinute } = state || {};
  if (!block) return { dayIndex: baseDayIndex || 0, startMinute: baseStartMinute || 0 };

  const safeDayIndex = Math.max(0, Math.min(currentView === "day" ? 0 : 6, Number(dayIndex || 0)));
  const safeStartMinute = clampEventMinutes(
    snapEventMinutes(startMinute, eventResizeSnapMinutes),
    0,
    Math.max(0, 24 * 60 - baseDurationMinute)
  );
  const eventsLayer = calendarGrid.querySelector(".events-layer");
  const dayCount = currentView === "day" ? 1 : 7;
  const dayWidth = eventsLayer?.getBoundingClientRect().width / dayCount || 0;
  const translateX = (safeDayIndex - baseDayIndex) * dayWidth;
  const translateY = (safeStartMinute - baseStartMinute) * pixelsPerMinute;

  block.style.setProperty("--event-move-x", `${translateX}px`);
  block.style.setProperty("--event-move-y", `${translateY}px`);
  return { dayIndex: safeDayIndex, startMinute: safeStartMinute };
}

function resolveEventMovePreview(state) {
  if (!state?.block?.isConnected) return null;
  const deltaY = state.moveY - state.startDragY;
  const candidateStart = state.baseStartMinute + deltaY / state.pixelsPerMinute;
  const result = applyEventMovePreview(
    state,
    dayIndexFromPointer(state.moveX),
    candidateStart
  );
  state.finalDayIndex = result.dayIndex;
  state.finalStartMinute = result.startMinute;
  updateEventMoveFeedback(state, result.dayIndex, result.startMinute);
  return result;
}

function scheduleEventMoveUpdate() {
  if (eventMoveFrame) return;
  eventMoveFrame = window.requestAnimationFrame(() => {
    eventMoveFrame = 0;
    const state = eventMoveState;
    if (!state?.block?.isConnected) return;

    const deltaX = state.moveX - state.startDragX;
    const deltaY = state.moveY - state.startDragY;
    if (!state.moved && Math.hypot(deltaX, deltaY) < eventMoveThresholdPixels) return;

    if (!state.moved) {
      state.moved = true;
      state.block.classList.add("is-moving");
      markCalendarClickSuppressed();
    }

    resolveEventMovePreview(state);
  });
}

function stopEventMove() {
  if (eventMoveState?.captureTarget?.hasPointerCapture?.(eventMoveState.pointerId)) {
    eventMoveState.captureTarget.releasePointerCapture(eventMoveState.pointerId);
  }
  window.removeEventListener("pointermove", handleEventMoveMove);
  window.removeEventListener("pointerup", handleEventMoveEnd);
  window.removeEventListener("pointercancel", handleEventMoveCancel);
  if (eventMoveFrame) {
    window.cancelAnimationFrame(eventMoveFrame);
    eventMoveFrame = 0;
  }
  eventMoveState = null;
}

function handleEventMoveMove(event) {
  if (!eventMoveState || event.pointerId !== eventMoveState.pointerId) return;
  eventMoveState.moveX = event.clientX;
  eventMoveState.moveY = event.clientY;
  const deltaX = event.clientX - eventMoveState.startDragX;
  const deltaY = event.clientY - eventMoveState.startDragY;
  if (eventMoveState.moved || Math.hypot(deltaX, deltaY) >= eventMoveThresholdPixels) {
    event.preventDefault();
  }
  scheduleEventMoveUpdate();
}

async function handleEventMoveEnd(event) {
  if (!eventMoveState || event.pointerId !== eventMoveState.pointerId) return;
  eventMoveState.moveX = event.clientX;
  eventMoveState.moveY = event.clientY;
  const releaseDeltaX = event.clientX - eventMoveState.startDragX;
  const releaseDeltaY = event.clientY - eventMoveState.startDragY;
  const releaseIsMove = eventMoveState.moved ||
    Math.hypot(releaseDeltaX, releaseDeltaY) >= eventMoveThresholdPixels;
  if (releaseIsMove) {
    // Pointer-up is followed by a synthetic click before the next animation
    // frame. Suppress it synchronously so a successful drag can never open
    // the event/busy detail popover.
    event.preventDefault();
    event.stopPropagation();
    markCalendarClickSuppressed();
    eventMoveState.moved = true;
    eventMoveState.block?.classList.add("is-moving");
  }
  const state = eventMoveState;
  const block = state?.block;
  if (eventMoveFrame) {
    window.cancelAnimationFrame(eventMoveFrame);
    eventMoveFrame = 0;
  }
  if (releaseIsMove) {
    resolveEventMovePreview(state);
  }
  if (!state?.moved) {
    resetEventMoveVisual(block);
    stopEventMove();
    return;
  }

  const isGoogleBusy = state.source === "google";
  const dayEvent = isGoogleBusy ? null : roomEventById(state.eventId);
  const finalDayIndex = Number.isFinite(state.finalDayIndex) ? state.finalDayIndex : state.baseDayIndex;
  const finalStartMinute = Number.isFinite(state.finalStartMinute) ? state.finalStartMinute : state.baseStartMinute;
  const targetDayKey = dateKey(dateFromDayIndex(finalDayIndex));
  const roomCodeSnapshot = currentRoom?.code;

  if (!block || !roomCodeSnapshot || (!isGoogleBusy && !dayEvent)) {
    resetEventMoveVisual(block);
    stopEventMove();
    return;
  }
  if (targetDayKey === state.dayKey && finalStartMinute === state.baseStartMinute) {
    resetEventMoveVisual(block);
    stopEventMove();
    return;
  }

  const moveKey = state.moveKey || (
    isGoogleBusy
      ? `google:${roomCodeSnapshot}:${state.calendarId}:${state.providerEventId}`
      : `room:${roomCodeSnapshot}:${state.eventId}`
  );
  pendingEventMoveKeys.add(moveKey);

  const targetDate = dayStartFromDateKey(targetDayKey);
  const nextStart = new Date(targetDate);
  nextStart.setHours(0, finalStartMinute, 0, 0);
  const nextEnd = new Date(nextStart.getTime() + state.baseDurationMinute * 60 * 1000);
  const previousGoogleBusy = googleBusy;
  const previousRoomEvents = currentRoom.events;
  let optimisticEvent = null;

  if (isGoogleBusy) {
    googleBusy = normalizeBusyBlocks(googleBusy.map((busyBlock) => {
      const items = (busyBlock.items || []).map((item) => {
        const isMovedItem = item.provider === "google" &&
          item.googleCalendarId === state.calendarId &&
          item.googleEventId === state.providerEventId;
        return isMovedItem
          ? { ...item, start: nextStart.toISOString(), end: nextEnd.toISOString() }
          : item;
      });
      const movedItem = items.find((item) => (
        item.provider === "google" &&
        item.googleCalendarId === state.calendarId &&
        item.googleEventId === state.providerEventId
      ));
      if (!movedItem) return busyBlock;
      return {
        ...busyBlock,
        start: movedItem.start,
        end: movedItem.end,
        items
      };
    }));
  } else {
    const payload = buildEventResizePayload(
      dayEvent,
      finalStartMinute,
      state.baseDurationMinute,
      targetDayKey
    );
    optimisticEvent = { ...dayEvent, start: payload.start, end: payload.end };
    currentRoom.events = currentRoom.events.map((item) => (
      item.id === state.eventId ? optimisticEvent : item
    ));
  }

  // The pointer capture, moving cursor, and drag transform all end before
  // persistence begins. Rendering the optimistic local state keeps the block
  // exactly where it was dropped while Google/CommonGround sync in the background.
  settleEventMoveVisual(block);
  stopEventMove();
  render();

  try {
    if (isGoogleBusy) {
      await fetchJson(`/api/rooms/${roomCodeSnapshot}/google-calendar-events`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calendarId: state.calendarId,
          eventId: state.providerEventId,
          start: nextStart.toISOString(),
          end: nextEnd.toISOString()
        })
      });
      if (currentRoom?.code !== roomCodeSnapshot) return;
      try {
        if (await loadFreeBusy()) render();
      } catch (syncRefreshError) {
        setCalendarStatus(syncRefreshError.message, {
          notify: true,
          title: "Calendar refresh delayed"
        });
      }
      setCalendarStatus("Google event moved.", { notify: true, title: "Event updated" });
      return;
    }

    const payload = buildEventResizePayload(
      dayEvent,
      finalStartMinute,
      state.baseDurationMinute,
      targetDayKey
    );
    payload.syncToGoogle = dayEvent.syncToGoogle === true || calendarEventSyncEnabled();
    const data = await fetchJson(`/api/rooms/${roomCodeSnapshot}/events/${state.eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!data?.event) {
      throw new Error("Could not move event.");
    }
    if (currentRoom?.code !== roomCodeSnapshot) return;

    currentRoom.events = currentRoom.events.map((item) => (
      item.id === state.eventId ? data.event : item
    ));
    render();
    fetchNotifications();
    try {
      if (await loadFreeBusy()) render();
    } catch (syncRefreshError) {
      setCalendarStatus(syncRefreshError.message, {
        notify: true,
        title: "Calendar refresh delayed"
      });
    }
    setCalendarStatus("Event moved.", { notify: true, title: "Event updated" });
  } catch (error) {
    if (currentRoom?.code !== roomCodeSnapshot) return;
    setCalendarStatus(error.message || "The event could not be moved.", {
      notify: true,
      title: "Move failed"
    });
    if (isGoogleBusy) {
      googleBusy = previousGoogleBusy;
    } else {
      currentRoom.events = previousRoomEvents;
    }
    render();
  } finally {
    resetEventMoveVisual(block);
    pendingEventMoveKeys.delete(moveKey);
  }
}

function handleEventMoveCancel() {
  if (!eventMoveState) return;
  resetEventMoveVisual(eventMoveState.block);
  stopEventMove();
}

function startEventMove(event) {
  const block = event.currentTarget;
  if (!block || event.button !== undefined && event.button !== 0) return;
  if (event.target.closest(".event-resize-handle")) return;
  if (eventResizeState || eventMoveState || dragCreateState) return;
  if (block.dataset.canMove !== "true") return;

  const eventId = block.dataset.eventId;
  const calendarEvent = roomEventById(eventId);
  if (!calendarEvent || calendarEvent.createdByParticipantId !== currentParticipant?.id) return;
  const moveKey = `room:${currentRoom?.code || ""}:${eventId}`;
  if (pendingEventMoveKeys.has(moveKey)) return;
  const startMinute = Number(block.dataset.startMinute);
  const durationMinute = Number(block.dataset.durationMinute);
  if (!Number.isFinite(startMinute) || !Number.isFinite(durationMinute)) return;

  event.stopPropagation();
  eventMoveState = {
    eventId,
    block,
    captureTarget: block,
    pointerId: event.pointerId,
    dayKey: block.dataset.eventDate || "",
    baseDayIndex: Number(block.dataset.dayIndex || 0),
    finalDayIndex: Number(block.dataset.dayIndex || 0),
    baseStartMinute: startMinute,
    finalStartMinute: startMinute,
    baseDurationMinute: durationMinute,
    startDragX: event.clientX,
    startDragY: event.clientY,
    moveX: event.clientX,
    moveY: event.clientY,
    pixelsPerMinute: resolvedCalendarRowHeight() / 60,
    moveKey,
    lastSnapStartMinute: startMinute,
    lastSnapDayIndex: Number(block.dataset.dayIndex || 0),
    hasDisplayedMoveTime: false,
    moved: false
  };
  block.setPointerCapture?.(event.pointerId);
  window.addEventListener("pointermove", handleEventMoveMove);
  window.addEventListener("pointerup", handleEventMoveEnd);
  window.addEventListener("pointercancel", handleEventMoveCancel);
}

function startGoogleBusyMove(event) {
  const block = event.currentTarget;
  if (!block || event.button !== undefined && event.button !== 0) return;
  if (eventResizeState || eventMoveState || dragCreateState) return;
  if (block.dataset.canMove !== "true") return;

  const startMinute = Number(block.dataset.startMinute);
  const durationMinute = Number(block.dataset.durationMinute);
  const calendarId = block.dataset.googleCalendarId;
  const providerEventId = block.dataset.googleEventId;
  if (
    !calendarId ||
    !providerEventId ||
    !Number.isFinite(startMinute) ||
    !Number.isFinite(durationMinute)
  ) return;
  const moveKey = `google:${currentRoom?.code || ""}:${calendarId}:${providerEventId}`;
  if (pendingEventMoveKeys.has(moveKey)) return;

  event.stopPropagation();
  eventMoveState = {
    source: "google",
    eventId: `google:${calendarId}:${providerEventId}`,
    calendarId,
    providerEventId,
    block,
    captureTarget: block,
    pointerId: event.pointerId,
    dayKey: block.dataset.eventDate || "",
    baseDayIndex: Number(block.dataset.dayIndex || 0),
    finalDayIndex: Number(block.dataset.dayIndex || 0),
    baseStartMinute: startMinute,
    finalStartMinute: startMinute,
    baseDurationMinute: durationMinute,
    startDragX: event.clientX,
    startDragY: event.clientY,
    moveX: event.clientX,
    moveY: event.clientY,
    pixelsPerMinute: resolvedCalendarRowHeight() / 60,
    moveKey,
    lastSnapStartMinute: startMinute,
    lastSnapDayIndex: Number(block.dataset.dayIndex || 0),
    hasDisplayedMoveTime: false,
    moved: false
  };
  block.setPointerCapture?.(event.pointerId);
  window.addEventListener("pointermove", handleEventMoveMove);
  window.addEventListener("pointerup", handleEventMoveEnd);
  window.addEventListener("pointercancel", handleEventMoveCancel);
}

function scheduleEventResizeUpdate() {
  if (eventResizeFrame) return;
  eventResizeFrame = window.requestAnimationFrame(() => {
    eventResizeFrame = 0;
    if (!eventResizeState) return;
    const {
      block,
      edge,
      baseStartMinute,
      baseDurationMinute,
      startDragY,
      pixelsPerMinute,
      moveY
    } = eventResizeState;
    if (!block || !block.isConnected || !edge) return;

    const deltaMinutes = (moveY - startDragY) / pixelsPerMinute;
    const baseBottomMinute = baseStartMinute + baseDurationMinute;

    let result;
    if (edge === "top") {
      const candidateStart = snapEventMinutes(baseStartMinute + deltaMinutes, eventResizeSnapMinutes);
      const maxStart = Math.min(
        baseBottomMinute - eventResizeMinMinutes,
        (24 * 60) - eventResizeMinMinutes
      );
      const nextStart = clampEventMinutes(candidateStart, 0, maxStart);
      const nextDuration = baseBottomMinute - nextStart;
      result = applyEventResizePreview(block, nextStart, nextDuration);
      eventResizeState.finalStartMinute = result.startMinute;
      eventResizeState.finalDurationMinute = result.durationMinute;
    } else {
      const candidateEnd = snapEventMinutes(baseBottomMinute + deltaMinutes, eventResizeSnapMinutes);
      const minEnd = baseStartMinute + eventResizeMinMinutes;
      const nextEnd = clampEventMinutes(candidateEnd, minEnd, 24 * 60);
      const nextDuration = nextEnd - baseStartMinute;
      result = applyEventResizePreview(block, baseStartMinute, nextDuration);
      eventResizeState.finalStartMinute = result.startMinute;
      eventResizeState.finalDurationMinute = result.durationMinute;
    }
    refreshLiveFreeBlocksForResize(
      eventResizeState,
      result.startMinute,
      result.durationMinute
    );
  });
}

function stopEventResize() {
  if (eventResizeState?.captureTarget?.hasPointerCapture?.(eventResizeState.pointerId)) {
    eventResizeState.captureTarget.releasePointerCapture(eventResizeState.pointerId);
  }
  window.removeEventListener("pointermove", handleEventResizeMove);
  window.removeEventListener("pointerup", handleEventResizeEnd);
  window.removeEventListener("pointercancel", handleEventResizeCancel);
  if (eventResizeFrame) {
    window.cancelAnimationFrame(eventResizeFrame);
    eventResizeFrame = 0;
  }
  for (const freeBlock of calendarGrid.querySelectorAll(".free-block.is-live-reflowing")) {
    freeBlock.classList.remove("is-live-reflowing");
  }
  eventResizeState = null;
}

function handleEventResizeMove(event) {
  if (!eventResizeState || event.pointerId !== eventResizeState.pointerId) return;
  event.preventDefault();
  eventResizeState.moveY = event.clientY;
  scheduleEventResizeUpdate();
}

async function handleEventResizeEnd(event) {
  if (!eventResizeState || event.pointerId !== eventResizeState.pointerId) return;
  event.preventDefault();
  markCalendarClickSuppressed();
  eventResizeState.moveY = event.clientY;
  scheduleEventResizeUpdate();
  await new Promise((resolve) => {
    if (eventResizeFrame) {
      window.requestAnimationFrame(resolve);
    } else {
      resolve();
    }
  });

  const state = eventResizeState;
  const dayEvent = roomEventById(state.eventId);
  const block = state.block;
  const finalStartMinute = Number.isFinite(state.finalStartMinute) ? state.finalStartMinute : state.baseStartMinute;
  const finalDurationMinute = Number.isFinite(state.finalDurationMinute) ? state.finalDurationMinute : state.baseDurationMinute;
  const startPx = Math.round(finalStartMinute * state.pixelsPerMinute);
  const heightPx = Math.round(finalDurationMinute * state.pixelsPerMinute);
  console.log(`Resize pixel result => top: ${startPx}, height: ${heightPx}`);

  try {
    if (!dayEvent || !block) return;

    if (finalStartMinute === state.baseStartMinute && finalDurationMinute === state.baseDurationMinute) {
      resetEventResizeVisual(block, state.baseStartMinute, state.baseDurationMinute);
      return;
    }

    const payload = buildEventResizePayload(dayEvent, finalStartMinute, finalDurationMinute, state.dayKey);
    const data = await fetchJson(`/api/rooms/${currentRoom.code}/events/${state.eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!data?.event) {
      throw new Error("Could not update event timing.");
    }
    currentRoom.events = currentRoom.events.map((item) => item.id === state.eventId ? data.event : item);
    render();
    fetchNotifications();
    setCalendarStatus("Event duration updated.", { notify: true, title: "Event updated" });
  } catch (error) {
    setCalendarStatus(error.message || "The event duration could not be updated.", {
      notify: true,
      title: "Resize failed"
    });
    if (dayEvent && block?.isConnected) {
      resetEventResizeVisual(block, state.baseStartMinute, state.baseDurationMinute);
    }
    render();
  } finally {
    if (block) block.classList.remove("is-resizing");
    stopEventResize();
  }
}

function handleEventResizeCancel() {
  if (!eventResizeState) return;
  const state = eventResizeState;
  const { block, baseStartMinute, baseDurationMinute } = state;
  if (block && block.isConnected) {
    resetEventResizeVisual(block, baseStartMinute, baseDurationMinute);
  }
  refreshLiveFreeBlocksForResize(state, baseStartMinute, baseDurationMinute, {
    live: false,
    force: true
  });
  stopEventResize();
}

function startEventResize(event) {
  event.preventDefault();
  event.stopPropagation();
  const handle = event.currentTarget;
  if (!handle || event.button !== undefined && event.button !== 0) return;
  if (eventMoveState || dragCreateState) return;
  const block = handle.closest(".event-card");
  if (!block) return;
  if (block.classList.contains("is-resizing")) return;
  const eventId = block.dataset.eventId;
  if (!eventId) return;
  const edge = handle.dataset.edge;
  if (!edge) return;

  const dayKey = block.dataset.eventDate || "";
  const calendarEvent = roomEventById(eventId);
  if (!calendarEvent) return;

  const canResizeTop = block.dataset.canResizeTop === "true";
  const canResizeBottom = block.dataset.canResizeBottom === "true";
  if (edge === "top" && !canResizeTop) return;
  if (edge === "bottom" && !canResizeBottom) return;

  const startMinute = Number(block.dataset.startMinute);
  const durationMinute = Number(block.dataset.durationMinute);
  if (!Number.isFinite(startMinute) || !Number.isFinite(durationMinute)) return;

  const pixelsPerMinute = resolvedCalendarRowHeight() / 60;
  eventResizeState = {
    active: true,
    eventId,
    block,
    edge,
    dayKey,
    dayIndex: Number(block.dataset.dayIndex || 0),
    captureTarget: block,
    pointerId: event.pointerId,
    startDragY: event.clientY,
    moveY: event.clientY,
    baseStartMinute: startMinute,
    baseDurationMinute: durationMinute,
    finalStartMinute: startMinute,
    finalDurationMinute: durationMinute,
    pixelsPerMinute
  };

  block.classList.add("is-resizing");
  markCalendarClickSuppressed();
  block.setPointerCapture?.(event.pointerId);
  window.addEventListener("pointermove", handleEventResizeMove);
  window.addEventListener("pointerup", handleEventResizeEnd);
  window.addEventListener("pointercancel", handleEventResizeCancel);
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
  stopDragCreate({ preservePreview: true });
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
  calendarGrid.setAttribute("role", "grid");
  calendarGrid.setAttribute("aria-label", `${currentView === "day" ? "Day" : "Week"} calendar, ${calendarPeriodText({ includeYear: true })}`);
  calendarGrid.setAttribute("aria-rowcount", String(hours.length + 1));
  calendarGrid.setAttribute("aria-colcount", String(days.length + 1));
  calendarGrid.style.setProperty("--day-count", days.length);
  calendarGrid.style.setProperty("--hour-count", hours.length);

  const corner = document.createElement("div");
  corner.className = "calendar-corner";
  corner.setAttribute("role", "columnheader");
  corner.setAttribute("aria-colindex", "1");
  corner.setAttribute("aria-rowindex", "1");
  corner.textContent = currentTimezoneLabel(days[0]?.date || currentFocusDate);
  corner.setAttribute("aria-label", `Time zone ${corner.textContent}`);
  calendarGrid.appendChild(corner);

  for (const [dayIndex, day] of days.entries()) {
    const header = document.createElement("div");
    const isSelected = sameDate(day.date, currentFocusDate);
    header.className = `day-header ${isSelected ? "selected" : ""}`.trim();
    header.setAttribute("role", "columnheader");
    header.setAttribute("aria-colindex", String(dayIndex + 2));
    header.setAttribute("aria-rowindex", "1");
    header.setAttribute("aria-label", formatFullDate(day.date));
    header.innerHTML = formatDayHeader(day);
    const dateButton = header.querySelector(".day-header-date");
    if (isSelected) dateButton?.setAttribute("aria-current", "date");
    dateButton?.addEventListener("click", async () => {
      await goToDateInWeek(day.date);
    });
    const weatherSymbol = createWeatherSymbol(day.date, "planner");
    if (weatherSymbol) header.appendChild(weatherSymbol);
    calendarGrid.appendChild(header);
  }

  for (const hour of hours) {
    const timeCell = document.createElement("div");
    timeCell.className = "time-cell";
    timeCell.textContent = formatHour(hour);
    timeCell.setAttribute("role", "rowheader");
    timeCell.setAttribute("aria-rowindex", String(hour - calendarStartHour + 2));
    timeCell.setAttribute("aria-colindex", "1");
    calendarGrid.appendChild(timeCell);

    for (let dayIndex = 0; dayIndex < days.length; dayIndex += 1) {
      const day = days[dayIndex];
      const cell = document.createElement("div");
      cell.className = "calendar-cell";
      cell.dataset.dayIndex = String(dayIndex);
      cell.dataset.dayKey = dateKey(day.date);
      cell.dataset.hour = String(hour);
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-rowindex", String(hour - calendarStartHour + 2));
      cell.setAttribute("aria-colindex", String(dayIndex + 2));
      cell.setAttribute("aria-label", `${formatFullDate(day.date)}, ${formatHour(hour)}`);
      calendarGrid.appendChild(cell);
    }
  }

  const eventsLayer = document.createElement("div");
  eventsLayer.className = "events-layer";
  eventsLayer.setAttribute("role", "presentation");
  calendarGrid.appendChild(eventsLayer);

  days.forEach((day, dayIndex) => {
    const rawBusySegments = busySegmentsForDate(day.date);
    const rawEventBlocks = eventBlocksForDate(day.date);
    const laneItems = layoutEventLanes([
      ...rawBusySegments.map((segment) => ({ ...segment, laneKind: "busy" })),
      ...rawEventBlocks.map((eventBlock) => ({ ...eventBlock, laneKind: "event" }))
    ]);
    const occupiedSegments = occupiedSegmentsForDate(day.date, rawBusySegments, rawEventBlocks);

    if (freeBlocksEnabled()) {
      for (const segment of freeSegmentsForDate(day.date, occupiedSegments)) {
        eventsLayer.appendChild(createFreeGlowBlock({ ...segment, occupiedSegments }, dayIndex));
      }
    }

    for (const item of laneItems) {
      const node = item.laneKind === "busy"
        ? createSingleBusyCard(item, dayIndex)
        : createEventBlock(item, dayIndex, day.date);
      eventsLayer.appendChild(node);
    }
  });

  window.commandCentreRenderAvailabilityHighlights?.(eventsLayer, days);

  if (dragCreateState && dragCreateState.active) {
    ensureDragPreview();
  } else if (eventComposerPreviewActive) {
    scheduleEventComposerPreviewUpdate();
  }
}

function renderMonth() {
  calendarGrid.innerHTML = "";
  calendarGrid.className = "calendar-grid month-view";
  calendarGrid.setAttribute("role", "grid");
  calendarGrid.setAttribute("aria-label", `Month calendar, ${formatMonthYear(currentFocusDate)}`);
  calendarGrid.setAttribute("aria-rowcount", "7");
  calendarGrid.setAttribute("aria-colcount", "7");

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

  for (const [dayIndex, day] of dayNames.entries()) {
    const header = document.createElement("div");
    header.className = "month-weekday";
    header.textContent = day.short;
    header.setAttribute("role", "columnheader");
    header.setAttribute("aria-colindex", String(dayIndex + 1));
    header.setAttribute("aria-rowindex", "1");
    header.setAttribute("aria-label", new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(addDays(startOfWeek(new Date(2026, 0, 4)), dayIndex)));
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
    cell.className = [
      "month-cell",
      date.getMonth() !== monthStart.getMonth() ? "muted-month" : "",
      sameDate(date, today) ? "today" : "",
      sameDate(date, currentFocusDate) ? "selected" : "",
      dayBlocksForDate(date).length ? "has-day-block" : "",
      currentParticipantDayBlock(date) ? "is-blocked-by-you" : ""
    ].filter(Boolean).join(" ");
    cell.setAttribute("role", "gridcell");
    cell.setAttribute("aria-rowindex", String(Math.floor(index / 7) + 2));
    cell.setAttribute("aria-colindex", String((index % 7) + 1));
    cell.setAttribute("aria-label", formatFullDate(date));
    if (freeBlocksEnabled() && isFreeDay) {
      cell.classList.add("free-day");
      cell.title = "Free day";
    }
    const openWeek = async () => {
      await goToDateInWeek(date);
    };
    const dateButton = document.createElement("button");
    dateButton.type = "button";
    dateButton.className = "month-date-number";
    dateButton.textContent = String(date.getDate());
    dateButton.setAttribute("aria-label", `View ${formatFullDate(date)} in week view`);
    dateButton.title = `View ${formatFullDate(date)} in week view`;
    if (sameDate(date, currentFocusDate)) dateButton.setAttribute("aria-current", "date");
    dateButton.addEventListener("click", async (event) => {
      event.stopPropagation();
      await openWeek();
    });
    cell.appendChild(dateButton);
    const weatherSymbol = createWeatherSymbol(date, "month");
    if (weatherSymbol) cell.appendChild(weatherSymbol);
    cell.addEventListener("click", openWeek);

    const dayBlockSegments = (data?.segments || []).filter((segment) => (
      segment.participants?.some((participant) => (
        participant.items?.some((item) => item.provider === "commonground_day_block")
      ))
    ));
    const totalItems = dayBlockSegments.length + events.length;
    const contentLimit = Math.max(1, totalItems > maxRows ? maxRows - 1 : maxRows);
    const visibleDayBlocks = dayBlockSegments.slice(0, contentLimit);
    for (const segment of visibleDayBlocks) {
      const participant = segment.participants[0];
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "event-chip day-block-chip";
      chip.style.setProperty("--event-color", participant?.color || participantPalette[0].value);
      chip.textContent = participant?.participantId === currentParticipant?.id
        ? "Busy all day"
        : `${calendarParticipantLabel(participant)} ? Busy all day`;
      chip.setAttribute("aria-label", `${calendarParticipantLabel(participant)}, busy all day`);
      chip.addEventListener("click", (event) => {
        event.stopPropagation();
        openBusyDetail(segment);
      });
      cell.appendChild(chip);
    }

    const visibleLimit = Math.max(0, contentLimit - visibleDayBlocks.length);
    for (const eventBlock of events.slice(0, visibleLimit)) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = `event-chip ${eventBlock.isGroupEvent ? "is-group-event" : ""}`.trim();
      chip.style.setProperty("--event-color", eventBlock.participantColor || participantPalette[0].value);
      const ownerLabel = calendarEventOwnerLabel(eventBlock);
      const titleLabel = String(eventBlock.title || "Busy").trim() || "Busy";
      const timeLabel = eventBlock.startHour <= calendarStartHour && eventBlock.endHour >= calendarEndHour
        ? "All day"
        : formatEventRange(eventBlock.startHour, eventBlock.endHour);
      chip.textContent = monthEventChipLabel(eventBlock);
      chip.setAttribute("aria-label", [ownerLabel, titleLabel, timeLabel].filter(Boolean).join(", "));
      chip.title = [ownerLabel, titleLabel, timeLabel].filter(Boolean).join(" · ");
      chip.addEventListener("click", (event) => {
        event.stopPropagation();
        openEventDetail(eventBlock.id);
      });
      cell.appendChild(chip);
    }

    const hiddenCount = Math.max(0, totalItems - visibleDayBlocks.length - Math.min(events.length, visibleLimit));
    if (hiddenCount) {
      const moreButton = document.createElement("button");
      moreButton.type = "button";
      moreButton.className = "month-more-button";
      moreButton.textContent = `+${hiddenCount} more`;
      moreButton.addEventListener("click", async (event) => {
        event.stopPropagation();
        await openWeek();
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
  const ownerLabel = calendarEventOwnerLabel(eventBlock);
  const title = String(eventBlock.title || "Busy").trim() || "Busy";
  const isAllDayLike = eventBlock.startHour <= calendarStartHour && eventBlock.endHour >= calendarEndHour;
  return [isAllDayLike ? "" : formatTime(eventBlock.startHour), ownerLabel, title].filter(Boolean).join(" · ");
}

function renderYear() {
  calendarGrid.innerHTML = "";
  calendarGrid.className = "calendar-grid year-view";
  calendarGrid.setAttribute("role", "region");
  calendarGrid.setAttribute("aria-label", `Year calendar, ${currentFocusDate.getFullYear()}`);
  calendarGrid.removeAttribute("aria-rowcount");
  calendarGrid.removeAttribute("aria-colcount");
  const today = new Date();
  const year = currentFocusDate.getFullYear();

  const monthJump = document.createElement("nav");
  monthJump.className = "year-month-jump";
  monthJump.setAttribute("aria-label", `Jump to a month in ${year}`);
  for (let month = 0; month < 12; month += 1) {
    const monthDate = new Date(year, month, 1);
    const monthName = new Intl.DateTimeFormat(undefined, { month: "long" }).format(monthDate);
    const jumpButton = document.createElement("button");
    jumpButton.type = "button";
    jumpButton.className = "year-month-jump-button";
    jumpButton.textContent = monthName.slice(0, 3);
    jumpButton.setAttribute("aria-label", `Jump to ${monthName} ${year}`);
    if (month === currentFocusDate.getMonth()) jumpButton.setAttribute("aria-current", "true");
    jumpButton.addEventListener("click", () => {
      for (const button of monthJump.querySelectorAll(".year-month-jump-button")) {
        button.removeAttribute("aria-current");
      }
      jumpButton.setAttribute("aria-current", "true");
      const target = document.querySelector(`#calendar-year-month-${year}-${month + 1}`);
      target?.scrollIntoView({
        block: "start",
        behavior: prefersReducedMotion() ? "auto" : "smooth"
      });
    });
    monthJump.appendChild(jumpButton);
  }
  calendarGrid.appendChild(monthJump);

  for (let month = 0; month < 12; month += 1) {
    const tile = document.createElement("section");
    tile.className = "year-month";
    tile.id = `calendar-year-month-${year}-${month + 1}`;
    const title = document.createElement("h3");
    title.id = `${tile.id}-title`;
    title.textContent = new Intl.DateTimeFormat(undefined, { month: "long" }).format(new Date(currentFocusDate.getFullYear(), month, 1));
    tile.setAttribute("aria-labelledby", title.id);
    tile.appendChild(title);

    const mini = document.createElement("div");
    mini.className = "mini-month";
    for (const [dayIndex, day] of dayNames.entries()) {
      const label = document.createElement("span");
      label.className = "mini-weekday";
      label.textContent = day.short.slice(0, 1);
      label.setAttribute("aria-label", new Intl.DateTimeFormat(undefined, { weekday: "long" }).format(addDays(startOfWeek(new Date(2026, 0, 4)), dayIndex)));
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
        sameDate(date, currentFocusDate) ? "selected" : "",
        dayBlocksForDate(date).length ? "has-day-block" : "",
        currentParticipantDayBlock(date) ? "is-blocked-by-you" : ""
      ].filter(Boolean).join(" ");
      node.textContent = date.getDate();
      node.setAttribute("aria-label", `View ${formatFullDate(date)} in week view`);
      node.title = `View ${formatFullDate(date)} in week view`;
      if (sameDate(date, currentFocusDate)) node.setAttribute("aria-current", "date");
      node.addEventListener("click", async () => {
        await goToDateInWeek(date);
      });
      mini.appendChild(node);
    }

    tile.appendChild(mini);
    calendarGrid.appendChild(tile);
  }
}

function renderCalendar() {
  closeWeatherHourlyPopover();
  hideWeatherHighLowTooltip({ immediate: true });
  const days = currentWeekDays();
  if (currentView === "month") {
    renderMonth();
  } else if (currentView === "year") {
    renderYear();
  } else if (currentView === "day") {
    renderPlanner([{
      key: dayNames[currentFocusDate.getDay()].key,
      short: dayNames[currentFocusDate.getDay()].short,
      day: currentFocusDate.getDay(),
      date: startOfDay(currentFocusDate)
    }]);
  } else {
    renderPlanner(days);
  }
  if (currentView !== "year") void ensureWeatherForecast();
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
  renderDayBlockControls();
  renderRoomSwitcher();
  renderParticipants();
  renderMiniCalendar();
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
  window.commandCentreReset?.();
  selectedEventId = null;
  selectedBusyGroup = null;
  expandedBusyStackId = null;
  editingEventId = null;
  pendingEventPrefill = null;
  hiddenParticipantIds.clear();
  stopDragCreate();
  handleEventMoveCancel();
  handleEventResizeCancel();
  closeExpandedBusyStacks();

  if (eventModal?.open) {
    closeEventModal();
  }
  if (createRoomModal?.open) {
    closeCreateRoomModal();
  }
  clearDetailPanel();

  if (clearRoom) {
    clearWeatherForecast();
    currentRoom = null;
    currentParticipant = null;
    currentIsHost = false;
    googleBusy = [];
    roomPage.dataset.googleReady = "false";
    roomPage.dataset.googleConnected = "false";
    calendarGoogleButton.disabled = true;
    calendarGoogleButton.setAttribute("aria-busy", "true");
    calendarGoogleButton.dataset.googleAction = "unavailable";
    googleConnectionIndicator?.classList.add("hidden");
    calendarConnectionNotice?.classList.add("hidden");
    topbarIdentity.innerHTML = "";
    participantStrip.innerHTML = "";
    calendarGrid.innerHTML = "";
    renderJoinRequests();
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    cache: "no-store",
    ...options
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || "Request failed.");
    error.status = response.status;
    error.code = data.code || null;
    error.details = data.details || null;
    throw error;
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
  }, motionDelay(motionFastMs));
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
  const icon = card.querySelector(".notification-icon");
  if (message) message.textContent = text;
  if (icon) icon.textContent = "✓";
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
  setSettingsPanelOpen(true);
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

  if (
    (notification.type === "event_invite" || notification.type === "event_updated")
    && notification.roomCode
    && notification.eventId
  ) {
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

  roomPage.classList.remove("is-room-entering");
  roomPage.classList.add("is-room-switching");
  calendarStatus.classList.add("is-loading");
  window.clearInterval(refreshTimer);
  abortRoomDataRequests();
  resetRoomScopedState({ clearRoom: true });
  sessionInfo = { ...sessionInfo, roomCode: nextCode };
  pushRoomRoute(nextCode);
  showRoom();
  calendarStatus.textContent = "Switching room...";

  try {
    const switched = await refreshRoomData();
    if (switched) {
      roomPage.classList.remove("is-room-switching");
      replayMotionClass(roomPage, "is-room-entering");
    }
    startAutoRefresh();
  } catch (error) {
    if (isAbortError(error)) return;
    calendarStatus.textContent = error.message;
  } finally {
    roomPage.classList.remove("is-room-switching");
    calendarStatus.classList.remove("is-loading");
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
  restoreCalendarScrollPosition(currentView);
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
  applyTheme(pendingThemePreference || me.theme, { persist: true });
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
    freeBusyGeneration += 1;
    const pendingController = freeBusyController;
    freeBusyController = null;
    pendingController?.abort();
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
  if (sessionInfo?.user && typeof data.googleNeedsReconnect === "boolean") {
    sessionInfo.user.googleNeedsReconnect = data.googleNeedsReconnect;
  }

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

function googleConnectionReturnPending() {
  return new URL(window.location.href).searchParams.get("connected") === "google";
}

function clearGoogleConnectionReturnParams() {
  const url = new URL(window.location.href);
  url.searchParams.delete("connected");
  url.searchParams.delete("calendarWrite");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

function googleAvailabilityRefreshComplete() {
  return Boolean(
    isGoogleConnected() &&
    currentParticipantConnected() &&
    !currentParticipantNeedsReconnect() &&
    currentParticipant?.lastSyncedAt
  );
}

function waitForGoogleConnectionRetry(delayMs) {
  return new Promise((resolve) => window.setTimeout(resolve, delayMs));
}

async function refreshRoomAfterGoogleConnection({ maxAttempts = 3 } = {}) {
  if (googleConnectionRefreshPromise) return googleConnectionRefreshPromise;

  const roomCode = routeRoomCode();
  if (!roomCode) return false;

  googleConnectionRefreshPromise = (async () => {
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const refreshed = await refreshRoomData();
      if (
        refreshed &&
        routeRoomCode() === roomCode &&
        googleAvailabilityRefreshComplete()
      ) {
        return true;
      }

      if (attempt < maxAttempts - 1) {
        await waitForGoogleConnectionRetry(250 * (attempt + 1));
      }
    }

    return false;
  })();

  try {
    return await googleConnectionRefreshPromise;
  } finally {
    googleConnectionRefreshPromise = null;
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

function keyboardCalendarAdjustment(event) {
  if (!event.altKey || event.ctrlKey || event.metaKey) return null;
  if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return null;
  if (event.shiftKey && !["ArrowUp", "ArrowDown"].includes(event.key)) return null;
  if (event.shiftKey) {
    return {
      kind: "resize-end",
      minuteDelta: event.key === "ArrowUp" ? -eventResizeSnapMinutes : eventResizeSnapMinutes,
      dayDelta: 0
    };
  }
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    return {
      kind: "move",
      minuteDelta: 0,
      dayDelta: event.key === "ArrowLeft" ? -1 : 1
    };
  }
  return {
    kind: "move",
    minuteDelta: event.key === "ArrowUp" ? -eventResizeSnapMinutes : eventResizeSnapMinutes,
    dayDelta: 0
  };
}

function adjustedKeyboardEventRange(startValue, endValue, adjustment) {
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (
    !adjustment ||
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    end <= start
  ) return null;

  const durationMs = end.getTime() - start.getTime();
  if (adjustment.kind === "resize-end") {
    const nextEnd = new Date(end.getTime() + adjustment.minuteDelta * 60 * 1000);
    const minimumEnd = new Date(start.getTime() + eventResizeMinMinutes * 60 * 1000);
    if (nextEnd < minimumEnd) return null;
    return { start, end: nextEnd };
  }

  const offsetMs = adjustment.minuteDelta * 60 * 1000 + adjustment.dayDelta * 24 * 60 * 60 * 1000;
  const nextStart = new Date(start.getTime() + offsetMs);
  const nextEnd = new Date(nextStart.getTime() + durationMs);
  if (adjustment.dayDelta === 0 && dateKey(nextStart) !== dateKey(start)) return null;
  if (adjustment.dayDelta === 0 && dateKey(nextEnd) !== dateKey(end)) return null;
  return { start: nextStart, end: nextEnd };
}

function eventPayloadForAdjustedRange(eventEntry, range) {
  return {
    title: eventEntry.title || "(No title)",
    start: range.start.toISOString(),
    end: range.end.toISOString(),
    timezone: eventEntry.timezone || "UTC",
    allDay: Boolean(eventEntry.allDay),
    location: eventEntry.location || "",
    description: eventEntry.description || "",
    syncToGoogle: eventEntry.syncToGoogle === true || calendarEventSyncEnabled(),
    syncToOutlook: eventEntry.syncToOutlook === true,
    inviteeParticipantIds: eventInviteeIds(eventEntry)
  };
}

async function adjustRoomEventFromKeyboard(eventId, adjustment, block) {
  const eventEntry = roomEventById(eventId);
  if (
    !eventEntry ||
    eventEntry.createdByParticipantId !== currentParticipant?.id ||
    eventEntry.allDay
  ) return;
  const range = adjustedKeyboardEventRange(eventEntry.start, eventEntry.end, adjustment);
  if (!range) {
    setCalendarStatus("That adjustment would move the event outside the supported day range.", {
      notify: true,
      title: "Event time unchanged"
    });
    return;
  }

  const moveKey = `room:${currentRoom?.code || ""}:${eventId}`;
  if (pendingEventMoveKeys.has(moveKey)) return;
  pendingEventMoveKeys.add(moveKey);
  block?.setAttribute("aria-busy", "true");
  try {
    const data = await fetchJson(`/api/rooms/${currentRoom.code}/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventPayloadForAdjustedRange(eventEntry, range))
    });
    currentRoom.events = currentRoom.events.map((item) => item.id === eventId ? data.event : item);
    render();
    try {
      if (await loadFreeBusy()) render();
    } catch {
      // The room event is already saved; the normal refresh loop will reconcile availability.
    }
    setCalendarStatus(
      adjustment.kind === "resize-end" ? "Event duration updated by 15 minutes." : "Event moved by 15 minutes.",
      { notify: true, title: "Event updated" }
    );
  } catch (error) {
    setCalendarStatus(error.message || "The event time could not be updated.", {
      notify: true,
      title: "Event update failed"
    });
  } finally {
    pendingEventMoveKeys.delete(moveKey);
    block?.removeAttribute("aria-busy");
  }
}

async function adjustGoogleBusyFromKeyboard(calendarId, providerEventId, startValue, endValue, adjustment, block) {
  if (!calendarId || !providerEventId) return;
  const range = adjustedKeyboardEventRange(startValue, endValue, adjustment);
  if (!range) {
    setCalendarStatus("That adjustment would move the event outside the supported day range.", {
      notify: true,
      title: "Event time unchanged"
    });
    return;
  }
  const moveKey = `google:${currentRoom?.code || ""}:${calendarId}:${providerEventId}`;
  if (pendingEventMoveKeys.has(moveKey)) return;
  pendingEventMoveKeys.add(moveKey);
  block?.setAttribute("aria-busy", "true");
  try {
    await fetchJson(`/api/rooms/${currentRoom.code}/google-calendar-events`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        calendarId,
        eventId: providerEventId,
        start: range.start.toISOString(),
        end: range.end.toISOString()
      })
    });
    await loadFreeBusy();
    render();
    setCalendarStatus(
      adjustment.kind === "resize-end" ? "Google event duration updated by 15 minutes." : "Google event moved by 15 minutes.",
      { notify: true, title: "Google event updated" }
    );
  } catch (error) {
    setCalendarStatus(error.message || "The Google event time could not be updated.", {
      notify: true,
      title: "Google event update failed"
    });
  } finally {
    pendingEventMoveKeys.delete(moveKey);
    block?.removeAttribute("aria-busy");
  }
}

function handleRoomEventKeyboardAdjustment(event) {
  const adjustment = keyboardCalendarAdjustment(event);
  if (!adjustment) return;
  event.preventDefault();
  event.stopPropagation();
  void adjustRoomEventFromKeyboard(event.currentTarget?.dataset.eventId, adjustment, event.currentTarget);
}

function handleGoogleBusyKeyboardAdjustment(event) {
  const adjustment = keyboardCalendarAdjustment(event);
  if (!adjustment) return;
  event.preventDefault();
  event.stopPropagation();
  const block = event.currentTarget;
  void adjustGoogleBusyFromKeyboard(
    block?.dataset.googleCalendarId,
    block?.dataset.googleEventId,
    block?.dataset.eventStart,
    block?.dataset.eventEnd,
    adjustment,
    block
  );
}

function clearPendingEntryState() {
  pendingEntryRoomCode = null;
  pendingEntryMode = null;
  pendingHostRoomState = null;
  pendingRoomPreview = null;
}

async function createRoomFromPendingDraft() {
  const draft = pendingHostRoomState?.draft;
  if (pendingEntryMode !== "host" || !draft) {
    throw new Error("The room draft is no longer available. Please start again.");
  }
  if (!pendingHostRoomState.createPromise) {
    pendingHostRoomState.createPromise = fetchJson("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft)
    });
  }
  return pendingHostRoomState.createPromise;
}

async function continueEntryWithGoogle() {
  if (pendingEntryMode === "host") {
    try {
      choiceConnectButton.disabled = true;
      const data = await createRoomFromPendingDraft();
      createRoomForm?.reset();
      if (currentUserConnected()) {
        clearPendingEntryState();
        await enterRoomFromResponse(data);
        return;
      }
      const roomCodeValue = data.room.code;
      clearPendingEntryState();
      window.location.href = googleAuthUrl(roomCodeValue);
    } catch (error) {
      if (pendingHostRoomState) pendingHostRoomState.createPromise = null;
      entryChoiceLead.textContent = error.message || "The room could not be created.";
      choiceConnectButton.disabled = false;
    }
    return;
  }

  if (!pendingEntryRoomCode) return;
  window.location.href = googleAuthUrl(pendingEntryRoomCode);
}

async function createRoom(event) {
  event.preventDefault();
  const roomNameValue = String(createRoomName?.value || "").trim() || "Untitled room";
  createRoomName?.setAttribute("aria-invalid", "false");
  pendingEntryMode = "host";
  pendingEntryRoomCode = null;
  pendingRoomPreview = null;
  pendingHostRoomState = {
    draft: {
      name: roomNameValue,
      emoji: normalizeRoomEmoji(createRoomEmoji?.value)
    },
    createPromise: null
  };
  entryChoiceLead.textContent = `Choose how you want to enter “${roomNameValue}”. The room will be created when you continue.`;
  showEntryChoice();
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

function sidebarCreateMenuItems() {
  return [sidebarCreateEventButton, sidebarBlockDayButton, sidebarCreateRoomButton, sidebarJoinRoomButton].filter(Boolean);
}

function setSidebarCreateMenuOpen(open, { focusItem = null } = {}) {
  if (!sidebarCreatePopover || !addEventButton) return;
  const isOpen = Boolean(open);
  sidebarCreatePopover.classList.toggle("hidden", !isOpen);
  addEventButton.setAttribute("aria-expanded", String(isOpen));
  sidebarCreateMenu?.classList.toggle("is-open", isOpen);

  if (!isOpen || focusItem === null) return;
  const items = sidebarCreateMenuItems();
  const target = focusItem === "last" ? items.at(-1) : items[0];
  target?.focus({ preventScroll: true });
}

function openCreateRoomModal() {
  if (!createRoomModal) return;
  createRoomModalForm?.reset();
  syncEmojiTrigger(quickRoomEmojiInput);
  prepareDialogForOpen(createRoomModal);
  createRoomModal.showModal();
}

function closeCreateRoomModal() {
  closeDialogWithMotion(createRoomModal);
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
    joinRoomCode.setAttribute("aria-invalid", "true");
    setStatus(homeStatus, "Enter the six-character room code.", "warn");
    joinRoomCode.focus();
    return;
  }
  joinRoomCode.setAttribute("aria-invalid", "false");

  try {
    const previewData = await fetchJson(`/api/rooms/${code}/preview`);
    const preview = previewData?.room || previewData;
    if (!preview || preview.exists === false || normalizeRoomCodeInput(preview.code || code) !== code) {
      throw new Error("That room could not be found.");
    }
    pendingEntryRoomCode = code;
    pendingEntryMode = "join";
    pendingHostRoomState = null;
    pendingRoomPreview = preview;

    if (currentUserConnected()) {
      await joinRoomAsGuest(code);
      return;
    }

    const roomLabel = String(preview.name || code).trim() || code;
    entryChoiceLead.textContent = Boolean(preview.locked ?? preview.accessLocked)
      ? `${roomLabel} is locked. Continue to send a join request to the host.`
      : `Join ${roomLabel} as a guest, or connect Google Calendar to add live availability.`;
    showEntryChoice();
  } catch (error) {
    clearPendingEntryState();
    joinRoomCode.setAttribute("aria-invalid", "true");
    setStatus(homeStatus, error.message || "That room could not be found.", "warn");
    joinRoomCode.focus();
  }
}

async function joinRoomAsGuest(code = pendingEntryRoomCode) {
  const roomCode = normalizeRoomCodeInput(code);
  if (!roomCode && pendingEntryMode !== "host") return;
  try {
    if (pendingEntryMode === "host" && pendingHostRoomState?.draft) {
      choiceGuestButton.disabled = true;
      const data = await createRoomFromPendingDraft();
      createRoomForm?.reset();
      clearPendingEntryState();
      await enterRoomFromResponse(data);
      return;
    }

    const data = await fetchJson(`/api/rooms/${roomCode}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });

    if (data.requested) {
      clearPendingEntryState();
      showHome();
      setStatus(homeStatus, data.message || "Join request sent to the host.", "connected");
      return;
    }

    await enterRoomFromResponse(data);
    clearPendingEntryState();
  } catch (error) {
    choiceGuestButton.disabled = false;
    if (pendingEntryMode === "host" && pendingHostRoomState?.draft) {
      pendingHostRoomState.createPromise = null;
      entryChoiceLead.textContent = error.message || "The room could not be created. Try again.";
      showEntryChoice();
      return;
    }
    clearPendingEntryState();
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
    syncEmojiTrigger(renameRoomEmojiInput);
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

async function updateRoomCodeByValue(value) {
  if (!currentRoom) throw new Error("Open a room before changing its code.");
  if (!currentIsHost) throw new Error("Only the host can change the room code.");
  const code = normalizeCustomRoomCodeInput(value);
  if (!/^[A-HJ-NP-Z2-9]{6}$/.test(code)) {
    throw new Error("Room codes must contain exactly six unambiguous letters or numbers.");
  }
  if (code === currentRoom.code) {
    return {
      room: currentRoom,
      participant: currentParticipant,
      isHost: currentIsHost,
      unchanged: true
    };
  }

  const previousCode = currentRoom.code;
  const data = await fetchJson(`/api/rooms/${previousCode}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  });
  currentRoom = data.room;
  currentParticipant = data.participant;
  currentIsHost = Boolean(data.isHost);
  pushRoomRoute(currentRoom.code);
  sessionInfo.roomCode = currentRoom.code;
  calendarStatus.textContent = `Room code changed from ${previousCode} to ${currentRoom.code}.`;
  await refreshMyRooms();
  render();
  return {
    ...data,
    previousCode,
    unchanged: false
  };
}

async function saveRoomCode() {
  if (!currentRoom) return;
  try {
    await updateRoomCodeByValue(customRoomCodeInput?.value || "");
  } catch (error) {
    if (customRoomCodeInput) customRoomCodeInput.value = currentRoom.code;
    calendarStatus.textContent = error.message;
  }
}

async function saveRoomLockState() {
  if (!currentRoom || !roomLockToggle) return;
  const locked = Boolean(roomLockToggle.checked);
  updateRoomLockIcon(locked);
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
    setCalendarStatus(locked ? "Room locked." : "Room unlocked.", {
      notify: true,
      title: "Room access updated"
    });
    render();
  } catch (error) {
    if (roomLockToggle) roomLockToggle.checked = Boolean(currentRoom?.accessLocked);
    updateRoomLockIcon(Boolean(currentRoom?.accessLocked));
    setCalendarStatus(error.message || "Room access could not be updated.", {
      notify: true,
      title: "Room update failed"
    });
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
    setCalendarStatus(`${participant?.displayName || "Participant"} was removed.`, {
      notify: true,
      title: "Member removed"
    });
  } catch (error) {
    setCalendarStatus(error.message || "The participant could not be removed.", {
      notify: true,
      title: "Member removal failed"
    });
  }
}

function formatEventComposerDateLabel(value, fallback) {
  if (!value) return fallback;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).format(date);
}

function syncEventComposerDateLabels() {
  if (eventDateField) {
    eventDateField.dataset.dateLabel = formatEventComposerDateLabel(
      eventDateInput?.value,
      "Select date"
    );
  }
  if (eventEndDateField) {
    eventEndDateField.dataset.dateLabel = formatEventComposerDateLabel(
      eventEndDateInput?.value,
      "End date"
    );
  }
}

function positionEventModal() {
  if (!eventModal?.classList.contains("anchored-composer") || !eventModalAnchorRect) return;
  const card = eventModal.querySelector(".modal-card");
  if (!card) return;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const edge = viewportWidth <= 820 ? 8 : 12;
  const gap = 12;
  const width = Math.min(card.offsetWidth || 440, viewportWidth - edge * 2);
  const height = Math.min(card.offsetHeight || 480, viewportHeight - edge * 2);
  const anchorLeft = Math.max(edge, Math.min(viewportWidth - edge, eventModalAnchorRect.left));
  const anchorRight = Math.max(anchorLeft, Math.min(
    viewportWidth - edge,
    eventModalAnchorRect.left + eventModalAnchorRect.width
  ));
  const anchorTop = Math.max(edge, Math.min(viewportHeight - edge, eventModalAnchorRect.top));
  const anchorBottom = Math.max(anchorTop, Math.min(
    viewportHeight - edge,
    eventModalAnchorRect.top + eventModalAnchorRect.height
  ));
  const rightCandidate = anchorRight + gap;
  const leftCandidate = anchorLeft - width - gap;
  const rightFits = rightCandidate + width <= viewportWidth - edge;
  const leftFits = leftCandidate >= edge;
  const rightSpace = viewportWidth - edge - anchorRight;
  const leftSpace = anchorLeft - edge;

  let side = "right";
  let left = rightCandidate;
  if (!rightFits && leftFits) {
    side = "left";
    left = leftCandidate;
  } else if (!rightFits && !leftFits) {
    side = rightSpace >= leftSpace ? "right" : "left";
    const nearAnchor = side === "right" ? rightCandidate : leftCandidate;
    left = Math.max(edge, Math.min(viewportWidth - width - edge, nearAnchor));
  }

  const anchorCenterY = anchorTop + (anchorBottom - anchorTop) / 2;
  const top = Math.max(edge, Math.min(
    viewportHeight - height - edge,
    anchorCenterY - height / 2
  ));
  const transformOrigin = rightFits || leftFits
    ? `${side === "right" ? "left" : "right"} center`
    : "center center";

  eventModal.dataset.anchorSide = side;
  eventModal.style.setProperty("--composer-left", `${left}px`);
  eventModal.style.setProperty("--composer-top", `${top}px`);
  eventModal.style.setProperty("--composer-transform-origin", transformOrigin);
}

function updateEventGoogleSyncControl() {
  if (!eventGoogleSyncInput || !eventGoogleSyncStatus) return;
  const needsAuthorization = !calendarWriteReady() || !isGoogleConnected();
  const email = String(sessionInfo?.user?.email || "").trim();

  eventGoogleSyncRow?.classList.toggle("is-unlinked", needsAuthorization && !googleAuthPopupPending);
  eventGoogleSyncRow?.classList.toggle("is-authorizing", googleAuthPopupPending);
  eventGoogleSyncRow?.classList.remove("is-error");
  eventGoogleSyncInput.disabled = needsAuthorization || googleAuthPopupPending;

  if (googleAuthPopupPending) {
    eventGoogleSyncRow?.setAttribute("aria-busy", "true");
    eventGoogleSyncRow?.setAttribute("role", "button");
    eventGoogleSyncRow?.setAttribute("tabindex", "0");
    eventGoogleSyncRow?.setAttribute("aria-label", "Connecting to Google Calendar");
    eventGoogleSyncStatus.textContent = "Connecting to Google Calendar…";
  } else if (needsAuthorization) {
    eventGoogleSyncInput.checked = false;
    eventGoogleSyncRow?.removeAttribute("aria-busy");
    eventGoogleSyncRow?.setAttribute("role", "button");
    eventGoogleSyncRow?.setAttribute("tabindex", "0");
    eventGoogleSyncRow?.setAttribute("aria-label", "Connect Google Calendar to sync this event");
    eventGoogleSyncStatus.textContent = "Connect Google Calendar first.";
  } else if (eventGoogleSyncInput.checked) {
    eventGoogleSyncRow?.removeAttribute("role");
    eventGoogleSyncRow?.removeAttribute("tabindex");
    eventGoogleSyncRow?.removeAttribute("aria-label");
    eventGoogleSyncRow?.removeAttribute("aria-busy");
    eventGoogleSyncStatus.textContent = email ? `Synced to ${email}` : "Synced to Google Calendar.";
  } else {
    eventGoogleSyncRow?.removeAttribute("role");
    eventGoogleSyncRow?.removeAttribute("tabindex");
    eventGoogleSyncRow?.removeAttribute("aria-label");
    eventGoogleSyncRow?.removeAttribute("aria-busy");
    eventGoogleSyncStatus.textContent = "This event will stay in CommonGround.";
  }
}

function activateEventGoogleSyncRow(event) {
  const needsAuthorization = !calendarWriteReady() || !isGoogleConnected();
  if (!needsAuthorization || !eventGoogleSyncInput || !eventGoogleSyncRow || googleAuthPopupPending) return;
  event.preventDefault();
  event.stopPropagation();
  openGoogleAuthPopup();
}

function openDiscardEventDraftDialog(source) {
  if (!discardEventDraftDialog || discardEventDraftDialog.open) return;
  const sourceElement = source?.currentTarget instanceof HTMLElement
    ? source.currentTarget
    : document.activeElement instanceof HTMLElement
      ? document.activeElement
      : cancelEventSecondary;
  discardEventDraftReturnFocus = sourceElement;
  prepareDialogForOpen(discardEventDraftDialog);
  discardEventDraftDialog.showModal();
  requestAnimationFrame(() => {
    cancelDiscardEventDraftButton?.focus({ preventScroll: true });
  });
}

function closeDiscardEventDraftDialog({ restoreFocus = true, discardDraft = false } = {}) {
  if (!discardEventDraftDialog?.open) {
    if (discardDraft) closeEventModal();
    return;
  }
  const returnFocus = discardEventDraftReturnFocus;
  closeDialogWithMotion(discardEventDraftDialog, () => {
    discardEventDraftReturnFocus = null;
    if (discardDraft) {
      closeEventModal();
      return;
    }
    if (!restoreFocus || !eventModal?.open) return;
    const focusTarget = returnFocus?.isConnected ? returnFocus : cancelEventSecondary;
    focusTarget?.focus({ preventScroll: true });
  });
}

function attemptCloseEventModal(source) {
  if (eventForm.dataset.saving === "true") return false;
  if (eventFormHasUnsavedChanges()) {
    openDiscardEventDraftDialog(source);
    return false;
  }
  closeEventModal();
  return true;
}

function openEventModal(mode = "create", options = {}) {
  closeAllLocationAutocompletes({ immediate: true, resetSession: true });
  editingEventId = mode === "edit" ? (options.eventId || selectedEventId) : null;
  const editingEvent = editingEventId
    ? currentRoom?.events?.find((event) => String(event.id) === String(editingEventId)) || null
    : null;
  if (mode === "edit" && !editingEvent) {
    editingEventId = null;
    setCalendarStatus("That event is no longer available to edit.", {
      notify: true,
      title: "Event unavailable"
    });
    return;
  }
  if (eventModalLabel) eventModalLabel.textContent = mode === "edit" ? "Edit group event" : "Add group event";
  if (eventModalTitle) eventModalTitle.textContent = mode === "edit" ? "Update proposal" : pendingEventPrefill ? "Create group event" : "Create proposal";
  saveEventButton.textContent = mode === "edit" ? "Save changes" : "Create event";
  setEventFormFeedback();
  setEventFormSaving(false);
  eventModalAnchorRect = options.anchorRect || null;
  eventModal.classList.toggle("anchored-composer", Boolean(eventModalAnchorRect));
  eventComposerPreviewActive = mode === "create";
  if (!eventComposerPreviewActive) clearDragPreview();
  if (eventInviteDropdown) eventInviteDropdown.open = false;

  if (mode === "edit" && editingEvent) {
    const event = editingEvent;
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
      eventTitleInput.value = pendingEventPrefill.title || "";
      eventDateInput.value = pendingEventPrefill.date;
      eventEndDateInput.value = pendingEventPrefill.endDate || pendingEventPrefill.date;
      eventStartInput.value = pendingEventPrefill.startTime;
      eventEndInput.value = pendingEventPrefill.endTime;
      setAllDayMode(pendingEventPrefill.allDay === true);
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
      eventTitleInput.value = "";
      eventDateInput.value = dateKey(nextHour);
      eventEndDateInput.value = dateKey(nextHour);
      eventStartInput.value = formatInputTime(nextHour.getHours() + nextHour.getMinutes() / 60);
      eventEndInput.value = formatInputTime(endHour.getHours() + endHour.getMinutes() / 60);
      renderInviteePicker(defaultInviteeIds(), {
        lockedParticipantIds: defaultInviteeIds()
      });
    }
  }

  syncEventComposerDateLabels();
  syncEventTimePickerDisplays();
  updateEventGoogleSyncControl();
  prepareDialogForOpen(eventModal);
  eventModal.showModal();
  eventModalInitialState = eventFormStateSnapshot();
  requestAnimationFrame(() => {
    eventTitleInput?.focus({ preventScroll: true });
    if (eventComposerPreviewActive) {
      syncEventComposerPreview({ reveal: true, navigate: true });
    } else {
      positionEventModal();
    }
  });
  pendingEventPrefill = null;
}

function closeEventModal() {
  if (discardEventDraftDialog?.open) {
    prepareDialogForOpen(discardEventDraftDialog);
    discardEventDraftDialog.close();
    discardEventDraftReturnFocus = null;
  }
  deactivateEventComposerPreview();
  stopDragCreate();
  closeEventTimePicker();
  closeAllLocationAutocompletes({ immediate: true, resetSession: true });
  closeDialogWithMotion(eventModal, () => {
    editingEventId = null;
    pendingEventPrefill = null;
    eventModalInitialState = "";
    eventModalAnchorRect = null;
    eventModal.classList.remove("anchored-composer");
    delete eventModal.dataset.anchorSide;
    eventModal.style.removeProperty("--composer-left");
    eventModal.style.removeProperty("--composer-top");
    eventModal.style.removeProperty("--composer-transform-origin");
    setEventFormFeedback();
  });
}

async function saveEvent(event) {
  event.preventDefault();
  if (!currentRoom || eventForm.dataset.saving === "true") return;
  setEventFormFeedback();
  const wasEditing = Boolean(editingEventId);

  const date = eventDateInput.value;
  const allDay = Boolean(eventAllDayInput?.checked);
  const start = allDay ? new Date(`${date}T00:00`) : new Date(`${date}T${eventStartInput.value}`);
  const endDate = eventEndDateInput?.value || date;
  const end = allDay ? new Date(`${endDate}T00:00`) : new Date(`${endDate}T${eventEndInput.value}`);
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
    setCalendarStatus(wasEditing ? "Event changes saved." : "Event created.", {
      notify: true,
      title: wasEditing ? "Event updated" : "Event created"
    });
  } catch (error) {
    setCalendarStatus(error.message || (wasEditing ? "The event could not be updated." : "The event could not be created."), {
      notify: true,
      title: wasEditing ? "Update failed" : "Create failed"
    });
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

function openDeleteEventConfirmDialog() {
  if (!deleteEventConfirmDialog || !selectedEventId || deleteEventConfirmDialog.open) return;
  if (confirmDeleteEventButton) confirmDeleteEventButton.disabled = false;
  deleteEventReturnFocus = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : deleteEventButton;
  prepareDialogForOpen(deleteEventConfirmDialog);
  deleteEventConfirmDialog.showModal();
  window.requestAnimationFrame(() => {
    cancelDeleteEventButton?.focus({ preventScroll: true });
  });
}

function closeDeleteEventConfirmDialog({ restoreFocus = true } = {}) {
  if (!deleteEventConfirmDialog?.open) return;
  const returnFocus = deleteEventReturnFocus;
  closeDialogWithMotion(deleteEventConfirmDialog, () => {
    deleteEventReturnFocus = null;
    if (!restoreFocus) return;
    const focusTarget = returnFocus?.isConnected ? returnFocus : deleteEventButton;
    focusTarget?.focus({ preventScroll: true });
  });
}

async function deleteEvent() {
  if (!currentRoom || !selectedEventId) return;
  if (confirmDeleteEventButton?.disabled) return;

  const deletedEvent = activeEvent();
  if (confirmDeleteEventButton) confirmDeleteEventButton.disabled = true;

  try {
    await fetchJson(`/api/rooms/${currentRoom.code}/events/${selectedEventId}`, { method: "DELETE" });
    removeEventFromUndoStack(selectedEventId);
    currentRoom.events = currentRoom.events.filter((event) => event.id !== selectedEventId);
    closeDeleteEventConfirmDialog({ restoreFocus: false });
    clearDetailPanel();
    render();
    fetchNotifications();
    setCalendarStatus(`${deletedEvent?.title || "Event"} was deleted.`, {
      notify: true,
      title: "Event deleted",
      type: "event_cancelled"
    });
  } catch (error) {
    if (confirmDeleteEventButton) confirmDeleteEventButton.disabled = false;
    setCalendarStatus(error.message || "The event could not be deleted.", {
      notify: true,
      title: "Delete failed",
      type: "event_cancelled"
    });
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
    event.preventDefault();
    event.stopPropagation();
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

function applyTheme(theme, { persist = false } = {}) {
  let appliedTheme;

  if (window.CommonGroundTheme?.apply) {
    appliedTheme = window.CommonGroundTheme.apply(theme, { persist });
  } else {
    appliedTheme = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = appliedTheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      "content",
      appliedTheme === "dark" ? "#101c31" : "#f7f3ee"
    );
    if (persist) {
      try {
        localStorage.setItem("cg-theme", appliedTheme);
      } catch {
        // The visible theme can still change when storage is unavailable.
      }
    }
  }

  if (themeToggle) themeToggle.checked = appliedTheme === "dark";
  return appliedTheme;
}

function maybeRestoreTheme() {
  let storedTheme = "dark";
  if (window.CommonGroundTheme?.read) {
    storedTheme = window.CommonGroundTheme.read();
  } else {
    try {
      storedTheme = localStorage.getItem("cg-theme") || "dark";
    } catch {
      // Keep the default when storage is unavailable.
    }
  }
  applyTheme(storedTheme);
}

async function saveThemePreference(theme) {
  const nextTheme = theme === "light" ? "light" : "dark";
  const previousTheme = sessionInfo?.theme === "light" ? "light" : "dark";
  const saveVersion = ++themePreferenceSaveVersion;
  pendingThemePreference = nextTheme;
  if (themeToggle) themeToggle.disabled = true;

  try {
    const data = await fetchJson("/api/me/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: nextTheme })
    });
    if (saveVersion !== themePreferenceSaveVersion) return;
    pendingThemePreference = null;
    sessionInfo = {
      ...sessionInfo,
      theme: data.theme,
      user: data.user || sessionInfo?.user || null
    };
    applyTheme(data.theme, { persist: true });
  } catch {
    if (saveVersion !== themePreferenceSaveVersion) return;
    pendingThemePreference = null;
    applyTheme(previousTheme, { persist: true });
    const message = "Could not save the theme preference. Your previous theme was restored.";
    if (currentRoom && calendarStatus) {
      calendarStatus.textContent = message;
    } else if (homeStatus) {
      setStatus(homeStatus, message, "warn");
    }
  } finally {
    if (saveVersion === themePreferenceSaveVersion && themeToggle) {
      themeToggle.disabled = false;
    }
  }
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
    setCalendarStatus(`Room renamed to ${nextName}.`, {
      notify: true,
      title: "Room renamed"
    });
  } catch (error) {
    setCalendarStatus(error.message || "The room could not be renamed.", {
      notify: true,
      title: "Rename failed"
    });
  }
}

function syncRoomNameSurfaces(name = currentRoom?.name || "Room") {
  const displayName = String(name || "").trim() || "Room";
  for (const target of [roomName, topbarRoomName]) {
    if (!target) continue;
    target.textContent = displayName;
    target.contentEditable = "false";
    target.classList.remove("is-editing");
  }

  if (topbarRoomName) {
    const canRename = Boolean(currentIsHost);
    topbarRoomName.dataset.canRename = String(canRename);
    topbarRoomName.tabIndex = canRename ? 0 : -1;
    topbarRoomName.title = canRename ? "Double-click to rename room" : displayName;
    topbarRoomName.setAttribute(
      "aria-label",
      canRename ? `${displayName}. Double-click to rename room.` : displayName
    );
  }
}

function startInlineRoomRename(target = roomName) {
  if (!currentIsHost || inlineRoomRenameActive || !target) return;
  inlineRoomRenameActive = true;
  inlineRoomRenameTarget = target;
  target.contentEditable = "true";
  target.classList.add("is-editing");
  target.focus();
  document.getSelection()?.selectAllChildren(target);
}

async function finishInlineRoomRename(commit = true) {
  const target = inlineRoomRenameTarget;
  if (!inlineRoomRenameActive || !target) return;
  inlineRoomRenameActive = false;
  inlineRoomRenameTarget = null;
  const nextName = target.textContent.trim();
  target.contentEditable = "false";
  target.classList.remove("is-editing");
  target.blur();
  if (!commit || !nextName) {
    syncRoomNameSurfaces();
    return;
  }
  renameRoomInput.value = nextName;
  await renameRoomByValue(nextName);
  syncRoomNameSurfaces();
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
  if (googleConnectionReturnPending()) {
    try {
      const refreshed = await refreshRoomAfterGoogleConnection();
      if (!refreshed) {
        calendarStatus.textContent = "Google Calendar connected, but availability could not refresh yet.";
      }
    } finally {
      clearGoogleConnectionReturnParams();
    }
  } else {
    await refreshRoomData();
  }
  restoreCalendarScrollPosition(currentView);
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
  joinRoomCode.setAttribute("aria-invalid", "false");
});
createRoomName?.addEventListener("input", () => {
  createRoomName.setAttribute("aria-invalid", "false");
});
choiceConnectButton.addEventListener("click", () => {
  void continueEntryWithGoogle();
});
choiceGuestButton.addEventListener("click", async () => {
  await joinRoomAsGuest();
});
entryChoiceBackButton.addEventListener("click", () => {
  clearPendingEntryState();
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
addEventButton.addEventListener("click", () => {
  const isOpen = addEventButton.getAttribute("aria-expanded") === "true";
  setSidebarCreateMenuOpen(!isOpen);
});
addEventButton.addEventListener("keydown", (event) => {
  if (!["ArrowDown", "ArrowUp", "Escape"].includes(event.key)) return;
  event.preventDefault();
  if (event.key === "Escape") {
    setSidebarCreateMenuOpen(false);
    return;
  }
  setSidebarCreateMenuOpen(true, { focusItem: event.key === "ArrowUp" ? "last" : "first" });
});
sidebarCreatePopover?.addEventListener("keydown", (event) => {
  const items = sidebarCreateMenuItems();
  const currentIndex = items.indexOf(document.activeElement);
  if (event.key === "Escape") {
    event.preventDefault();
    setSidebarCreateMenuOpen(false);
    addEventButton.focus({ preventScroll: true });
    return;
  }
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  if (event.key === "Home") {
    items[0]?.focus({ preventScroll: true });
    return;
  }
  if (event.key === "End") {
    items.at(-1)?.focus({ preventScroll: true });
    return;
  }
  const direction = event.key === "ArrowDown" ? 1 : -1;
  const nextIndex = currentIndex < 0
    ? (direction > 0 ? 0 : items.length - 1)
    : (currentIndex + direction + items.length) % items.length;
  items[nextIndex]?.focus({ preventScroll: true });
});
sidebarCreateEventButton?.addEventListener("click", () => {
  setSidebarCreateMenuOpen(false);
  void openCalendarEventComposerAt({ date: dateKey(currentFocusDate) });
});
sidebarBlockDayButton?.addEventListener("click", () => {
  setSidebarCreateMenuOpen(false);
  void toggleFocusedDayBlock();
});
sidebarCreateRoomButton?.addEventListener("click", () => {
  setSidebarCreateMenuOpen(false);
  openCreateRoomModal();
});
sidebarJoinRoomButton?.addEventListener("click", async () => {
  setSidebarCreateMenuOpen(false);
  await openRoomEntryPage();
});
copyInviteButton.addEventListener("click", copyRoomLink);
copyInviteButtonEmpty.addEventListener("click", async () => {
  await copyRoomLink();
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
themeToggle?.addEventListener("change", () => {
  const theme = themeToggle.checked ? "dark" : "light";
  document.documentElement.classList.add("is-theme-switching");
  applyTheme(theme, { persist: true });
  void saveThemePreference(theme);
  window.setTimeout(() => {
    document.documentElement.classList.remove("is-theme-switching");
  }, motionDelay(motionStandardMs + 40));
});
settingsButton.addEventListener("click", () => {
  setSettingsPanelOpen(!settingsPanelIsOpen(), { focusFirst: true });
});
settingsCloseButton?.addEventListener("click", () => {
  setSettingsPanelOpen(false);
});
calendarGoogleButton?.addEventListener("click", () => {
  if (!currentRoom?.code) return;
  if (calendarGoogleButton.dataset.googleAction !== "authorize") return;

  window.location.href = googleAuthUrl(currentRoom.code, { calendarWrite: true });
});
sidebarBackdrop?.addEventListener("click", () => {
  setParticipantsPanelExpanded(false, { restoreFocus: true });
});
calendarUtilityOverflowButton?.addEventListener("click", () => {
  const isOpen = calendarUtilityOverflowButton.getAttribute("aria-expanded") === "true";
  setCalendarUtilityMenuOpen(!isOpen, { focusFirst: !isOpen });
});
calendarUtilityOverflowMenu?.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  event.preventDefault();
  setCalendarUtilityMenuOpen(false);
  calendarUtilityOverflowButton?.focus({ preventScroll: true });
});
hostPopover?.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    setSettingsPanelOpen(false);
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = focusableElementsWithin(hostPopover);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus({ preventScroll: true });
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus({ preventScroll: true });
  }
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
    if (calendarUtilityOverflowButton?.getAttribute("aria-expanded") === "true") {
      event.preventDefault();
      setCalendarUtilityMenuOpen(false);
      calendarUtilityOverflowButton.focus({ preventScroll: true });
      return;
    }
    if (settingsPanelIsOpen()) {
      event.preventDefault();
      setSettingsPanelOpen(false);
      return;
    }
    if (sidebarUsesDrawerLayout() && participantsSidebar?.dataset.open === "true") {
      event.preventDefault();
      setParticipantsPanelExpanded(false, { restoreFocus: true });
      return;
    }
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
  if (activeEventTimePicker) positionEventTimePicker(activeEventTimePicker);
  syncCalendarUtilityOverflowVisibility();
  setParticipantsPanelExpanded(participantsSidebar?.dataset.open === "true", {
    persist: false,
    restoreFocus: false
  });
});
calendarGrid.addEventListener("pointerdown", startDragCreate, true);
calendarGrid.addEventListener("click", suppressCalendarClickCapture, true);
calendarScrollport?.addEventListener("scroll", () => {
  if (calendarScrollRestoreFrame) return;
  window.clearTimeout(calendarScrollSaveTimer);
  calendarScrollSaveTimer = window.setTimeout(() => {
    saveCalendarScrollPosition(currentView);
    calendarScrollSaveTimer = null;
  }, 140);
}, { passive: true });
initializeCalendarUtilityMenu();
syncCalendarUtilityOverflowVisibility();
setParticipantsPanelExpanded(readStoredSidebarOpen(), { persist: false, restoreFocus: false });
function bindRoomNameEditor(target) {
  if (!target) return;
  target.addEventListener("dblclick", (event) => {
    event.preventDefault();
    startInlineRoomRename(target);
  });
  target.addEventListener("keydown", async (event) => {
    if (!inlineRoomRenameActive) {
      if (currentIsHost && (event.key === "Enter" || event.key === "F2")) {
        event.preventDefault();
        startInlineRoomRename(target);
      }
      return;
    }
    if (inlineRoomRenameTarget !== target) return;
    if (event.key === "Enter") {
      event.preventDefault();
      await finishInlineRoomRename(true);
    } else if (event.key === "Escape") {
      event.preventDefault();
      await finishInlineRoomRename(false);
    }
  });
  target.addEventListener("blur", async () => {
    if (inlineRoomRenameTarget === target) {
      await finishInlineRoomRename(true);
    }
  });
}

bindRoomNameEditor(roomName);
bindRoomNameEditor(topbarRoomName);
closeDetailButton.addEventListener("click", clearDetailPanel);
editEventButton?.addEventListener("click", () => {
  const eventId = selectedEventId;
  const eventEntry = activeEvent();
  if (!eventId || !eventEntry || !canManageEvent(eventEntry)) return;
  clearDetailPanel();
  openEventModal("edit", { eventId });
});
initializeEventTimePickers();
initializeLocationAutocomplete(eventLocationInput);
initializeLocationAutocomplete(detailLocationInput);
eventForm.addEventListener("submit", commitEventTimePickersBeforeSubmit, true);
eventForm.addEventListener("submit", saveEvent);
eventPanelForm?.addEventListener("submit", commitEventTimePickersBeforeSubmit, true);
eventPanelForm?.addEventListener("submit", saveEventPanelChanges);
for (const input of [
  detailTitleInput,
  detailDateInput,
  detailStartInput,
  detailEndInput,
  detailStartTimeInput,
  detailEndTimeInput,
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
eventInviteDropdown?.addEventListener("toggle", () => {
  requestAnimationFrame(positionEventModal);
});
eventInviteDropdown?.querySelector("summary")?.addEventListener("click", (event) => {
  if (!eventInviteDropdown.classList.contains("is-empty")) return;
  event.preventDefault();
  eventInviteDropdown.open = false;
});
const eventComposerPreviewInput = (target) => (
  target === eventTitleInput ||
  target === eventDateInput ||
  target === eventEndDateInput ||
  target === eventStartInput ||
  target === eventEndInput ||
  target === eventAllDayInput ||
  Boolean(target?.closest?.("#inviteePicker input[type='checkbox']"))
);
eventForm.addEventListener("input", (event) => {
  if (!eventComposerPreviewInput(event.target)) return;
  scheduleEventComposerPreviewUpdate();
});
eventForm.addEventListener("change", (event) => {
  if (!eventComposerPreviewInput(event.target)) return;
  const changesRange = event.target === eventDateInput ||
    event.target === eventEndDateInput ||
    event.target === eventStartInput ||
    event.target === eventEndInput ||
    event.target === eventAllDayInput;
  scheduleEventComposerPreviewUpdate({
    reveal: changesRange,
    navigate: event.target === eventDateInput
  });
});
eventAllDayInput?.addEventListener("change", () => {
  setAllDayMode(eventAllDayInput.checked);
  requestAnimationFrame(positionEventModal);
});
eventDateInput?.addEventListener("change", () => {
  syncEventComposerDateLabels();
  if (!eventAllDayInput?.checked || !eventEndDateInput) return;
  if (!eventEndDateInput.value || eventEndDateInput.value < eventDateInput.value) {
    eventEndDateInput.value = eventDateInput.value;
    syncEventComposerDateLabels();
  }
});
eventEndDateInput?.addEventListener("change", syncEventComposerDateLabels);
cancelEventButton.addEventListener("click", attemptCloseEventModal);
cancelEventSecondary.addEventListener("click", attemptCloseEventModal);
cancelDiscardEventDraftButton?.addEventListener("click", () => {
  closeDiscardEventDraftDialog();
});
confirmDiscardEventDraftButton?.addEventListener("click", () => {
  closeDiscardEventDraftDialog({ restoreFocus: false, discardDraft: true });
});
createRoomModalForm?.addEventListener("submit", createRoomFromSwitcher);
cancelCreateRoomModalButton?.addEventListener("click", closeCreateRoomModal);
cancelCreateRoomModalSecondary?.addEventListener("click", closeCreateRoomModal);
deleteEventButton.addEventListener("click", openDeleteEventConfirmDialog);
deleteEventConfirmDialog?.addEventListener("click", (event) => {
  if (event.target.closest("#cancelDeleteEventButton")) {
    event.preventDefault();
    event.stopPropagation();
    closeDeleteEventConfirmDialog();
    return;
  }
  if (event.target.closest("#confirmDeleteEventButton")) {
    event.preventDefault();
    event.stopPropagation();
    void deleteEvent();
  }
});
emojiPickerCloseButton?.addEventListener("click", () => {
  closeEmojiPicker({ restoreFocus: true });
});
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
  if (
    addEventButton?.getAttribute("aria-expanded") === "true"
    && !sidebarCreateMenu?.contains(event.target)
  ) {
    setSidebarCreateMenuOpen(false);
  }

  if (
    calendarUtilityOverflowButton?.getAttribute("aria-expanded") === "true"
    && !calendarUtilityOverflowButton.contains(event.target)
    && !calendarUtilityOverflowMenu?.contains(event.target)
  ) {
    setCalendarUtilityMenuOpen(false);
  }

  if (hostPopover && !hostPopover.classList.contains("hidden")) {
    if (
      !hostPopover.contains(event.target) &&
      !settingsButton.contains(event.target) &&
      !calendarGoogleButton?.contains(event.target) &&
      !calendarUtilityOverflowMenu?.contains(event.target) &&
      !emojiPickerPopover?.contains(event.target)
    ) {
      setSettingsPanelOpen(false, { restoreFocus: false });
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
      deleteEventConfirmDialog?.open ||
      deleteEventConfirmDialog?.contains(event.target) ||
      window.commonGroundDatePicker?.containsTarget(event.target) ||
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
enableDialogBackdropClose(discardEventDraftDialog, closeDiscardEventDraftDialog);
enableDialogBackdropClose(deleteEventConfirmDialog, closeDeleteEventConfirmDialog);
enableDialogBackdropClose(createRoomModal, closeCreateRoomModal);

createRoomModal?.addEventListener("close", () => {
  if (emojiPickerState.trigger?.closest("#createRoomModal")) {
    closeEmojiPicker({ restoreFocus: false, immediate: true });
  }
});

eventModal.addEventListener("cancel", (event) => {
  event.preventDefault();
  if (activeEventTimePicker) {
    closeEventTimePicker({ restoreFocus: true });
    return;
  }
  attemptCloseEventModal();
});

discardEventDraftDialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeDiscardEventDraftDialog();
});

deleteEventConfirmDialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeDeleteEventConfirmDialog();
});

deleteEventConfirmDialog?.addEventListener("close", () => {
  if (!deleteEventReturnFocus) return;
  const focusTarget = deleteEventReturnFocus?.isConnected ? deleteEventReturnFocus : deleteEventButton;
  deleteEventReturnFocus = null;
  focusTarget?.focus({ preventScroll: true });
});

updateFullscreenControl();
setSettingsPanelOpen(false, { restoreFocus: false });
document.addEventListener("pointerdown", handleOutsideFloatingSurfacePointer, true);
document.addEventListener("click", handleOutsideFloatingSurfaceClick, true);
initializeEmojiPickers();
void observeWeatherLocationPermission();
boot();
