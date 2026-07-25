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
const defaultRoomEmoji = "ğŸ“…";
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
let eventMoveState = null;
let dragPreviewNode = null;
let dragPreviewFrame = 0;
let eventResizeFrame = 0;
let eventMoveFrame = 0;
let suppressCalendarClickUntil = 0;
let suppressOutsideSurfaceClick = false;
let suppressOutsideSurfaceTimer = null;
let participantsDrawerGesture = null;
const pendingEventMoveKeys = new Set();

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
  "ğŸ˜€", "ğŸ˜ƒ", "ğŸ˜„", "ğŸ˜", "ğŸ˜†", "ğŸ˜…", "ğŸ˜‚", "ğŸ™‚",
  "ğŸ™ƒ", "ğŸ˜‰", "ğŸ˜Š", "ğŸ˜‡", "ğŸ¥°", "ğŸ˜", "ğŸ¤©", "ğŸ˜˜",
  "ğŸ˜‹", "ğŸ˜›", "ğŸ˜œ", "ğŸ¤ª", "ğŸ¤—", "ğŸ¤­", "ğŸ¤”", "ğŸ¤",
  "ğŸ˜", "ğŸ˜‘", "ğŸ˜¶", "ğŸ™„", "ğŸ˜", "ğŸ˜´", "ğŸ‘", "ğŸ‘",
  "ğŸ‘Œ", "âœŒï¸", "ğŸ¤", "ğŸ¤Ÿ", "ğŸ¤˜", "ğŸ‘", "ğŸ™Œ", "ğŸ™"
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
  const moïÎùÚÚ$z{-®éÜj×6öç7B&VfW'&VE&ööÔ6öFRÒæ÷&ÖÆ—¦U&ööÔ6öFT–çWB‡6W76–öä–æfóòç&ööÔ6öFRÇÂ""“°¢6öç7BæW‡E&ööÔ6öFRÒ×•&öö×2ç6öÖR‚‡&ööÒ’Óâ&ööÒæ6öFRÓÓÒ&VfW'&VE&ööÔ6öFR’ò&VfW'&VE&ööÔ6öFR¢×•&öö×5³Óòæ6öFS°¢–b†æW‡E&ööÔ6öFR’°¢&WÆ6U&ööÕ&÷WFR†æW‡E&ööÔ6öFR“°¢v—B&ö÷E&ööÒ‚“°¢&WGW&ã°¢Ğ¢Ğ ¢6†÷t†öÖR‚“°¢–b‡6W76–öä–æfóòæ6öææV7FVB’°¢6WE7FGW2††öÖU7FGW2Â6ÆVæF"6öææV7FVB2G·6W76–öä–æfòçW6W#òæF—7Æ”æÖRÇÂ6W76–öä–æfòçW6W#òææÖRÇÂ'–÷R'Òâ7&VFRæWr&ööÒ÷"VçFW"6öFRFò¦ö–âæ÷F†W"öæRæÂ&6öææV7FVB"“°¢ÒVÇ6R–b†6öæf–sòævöövÆU&VG’’°¢†öÖU7FGW2çFW‡D6öçFVçBÒ$7&VFR&ööÒ÷"VçFW"6öFRFòvWB7F'FVBâ#°¢ÒVÇ6R°¢6WE7FGW2††öÖU7FGW2Â$6ÆVæF"7&VFVçF–Ç2&Ræ÷B6öæf–wW&VB–WBâ"Â'v&â"“°¢Ğ§Ğ ¦7–æ2gVæ7F–öâ&ö÷E&ööÒ‚’°¢6†÷u&ööÒ‚“°¢v—B&Vg&W6…&ööÔFF‚“°¢7F'DWFõ&Vg&W6‚‚“°§Ğ ¦7–æ2gVæ7F–öâ&ö÷B‚’°¢Ö–&U&W7F÷&UF†VÖR‚“°¢7F'Dæ÷F–f–6F–öåöÆÆ–ær‚“°¢6öç7B6öFRÒ&÷WFU&ööÔ6öFR‚“°¢–b†6öFR’°¢G'’°¢v—B&ö÷E&ööÒ‚“°¢Ò6F6‚†W'&÷"’°¢v–æF÷ræ†—7F÷'’ç&WÆ6U7FFR‡·ÒÂ""Â"ò"“°¢6†÷t†öÖR‚“°¢6WE7FGW2††öÖU7FGW2ÂW'&÷"æÖW76vRÂ'v&â"“°¢v—BÆöD6öæf–tæE6W76–öâ‚“°¢Ğ¢&WGW&ã°¢Ğ ¢v—B&ö÷D†öÖR‚“°§Ğ ¦7&VFU&ööÔf÷&ÒæFDWfVçDÆ—7FVæW"‚'7V&Ö—B"Â7&VFU&ööÒ“°¦¦ö–å&ööÔf÷&ÒæFDWfVçDÆ—7FVæW"‚'7V&Ö—B"Â¦ö–å&ööÒ“°¦¦ö–å&ööÔ6öFSòæFDWfVçDÆ—7FVæW"‚&–çWB"Â‚’Óâ°¢¦ö–å&ööÔ6öFRçfÇVRÒæ÷&ÖÆ—¦U&ööÔ6öFT–çWB†¦ö–å&ööÔ6öFRçfÇVR“°§Ò“°¦6†ö–6T6öææV7D'WGFöâæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ°¢–b‚VæF–ætVçG'•&ööÔ6öFR’&WGW&ã°¢v–æF÷ræÆö6F–öâæ‡&VbÒvöövÆTWF…W&Â‡VæF–ætVçG'•&ööÔ6öFR“°§Ò“°¦6†ö–6TwVW7D'WGFöâæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â7–æ2‚’Óâ°¢v—B¦ö–å&ööÔ4wVW7B‚“°§Ò“°¦VçG'”6†ö–6T&6´'WGFöâæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ°¢VæF–ætVçG'•&ööÔ6öFRÒçVÆÃ°¢VæF–ætVçG'”ÖöFRÒçVÆÃ°¢VæF–æt†÷7E&ööÕ7FFRÒçVÆÃ°¢6†÷t†öÖR‚“°§Ò“°¦FVÆWFU&ööÔ'WGFöâæFDWfVçDÆ—7FVæW"‚&6Æ–6²"ÂFVÆWFU&ööÒ“°§&Vg&W6„6öFT'WGFöâæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â&Vg&W6…&ööÔ6öFR“°¦6öææV7DvöövÆT'WGFöâæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ°¢–b‚7W'&VçE&ööÓòæ6öFR’&WGW&ã°¢v–æF÷ræÆö6F–öâæ‡&VbÒvöövÆTWF…W&Â†7W'&VçE&ööÒæ6öFR“°§Ò“°§6WGF–æw5&V6öææV7D'WGFöâæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ°¢–b‚7W'&VçE&ööÓòæ6öFR’&WGW&ã°¢v–æF÷ræÆö6F–öâæ‡&VbÒvöövÆTWF…W&Â†7W'&VçE&ööÒæ6öFRÂ°¢6ÆVæF%w&—FS¢6WGF–æw5&V6öææV7D'WGFöâæFF6WBæ6ÆVæF%w&—FRÓÓÒ'G'VR ¢Ò“°§Ò“°¦vöövÆTWfVçE7–æ5FövvÆSòæFDWfVçDÆ—7FVæW"‚&6†ævR"Â7–æ2‚’Óâ°¢6öç7BæW‡DVæ&ÆVBÒ&ööÆVâ†vöövÆTWfVçE7–æ5FövvÆRæ6†V6¶VB“°¢–b†æW‡DVæ&ÆVBbb6ÆVæF%w&—FU&VG’‚’’°¢vöövÆTWfVçE7–æ5FövvÆRæ6†V6¶VBÒ6ÆVæF$WfVçE7–æ5&VfW&Væ6TVæ&ÆVB‚“°¢vöövÆTWfVçE7–æ57FGW2çFW‡D6öçFVçBÒ%W6RVæ&ÆRvöövÆRWfVçB7–æ2–â6WGF–æw2Fòw&çBWfVçBÖöæÇ’66W72â#°¢&WGW&ã°¢Ğ ¢vöövÆTWfVçE7–æ5FövvÆRæF—6&ÆVBÒG'VS°¢vöövÆTWfVçE7–æ57FGW2çFW‡D6öçFVçBÒæW‡DVæ&ÆVBò%GW&æ–ærvöövÆRWfVçB7–æ2öââââ"¢%GW&æ–ærvöövÆRWfVçB7–æ2öfbâââ#°¢G'’°¢6öç7BFFÒv—BfWF6„§6öâ‚"ö’öÖRö6ÆVæF"ÖWfVçB×7–æ2"Â°¢ÖWF†öC¢%D4‚"À¢†VFW'3¢²$6öçFVçBÕG—R#¢&Æ–6F–öâö§6öâ"ÒÀ¢&öG“¢¥4ôâç7G&–æv–g’‡²&÷f–FW#¢&vöövÆR"ÂVæ&ÆVC¢æW‡DVæ&ÆVBÒ¢Ò“°¢6W76–öä–æfòçW6W"ÒFFçW6W#°¢6W76–öä–æfòæ6öææV7FVBÒ&ööÆVâ†FFçW6W#òæ6öææV7FVB“°¢&VæFW$6ÆVæF$WfVçE7–æ46öçG&öÇ2‚“°¢Ò6F6‚†W'&÷"’°¢vöövÆTWfVçE7–æ5FövvÆRæ6†V6¶VBÒ6ÆVæF$WfVçE7–æ4Væ&ÆVB‚“°¢vöövÆTWfVçE7–æ57FGW2çFW‡D6öçFVçBÒW'&÷"æÖW76vS°¢Òf–æÆÇ’°¢&VæFW$6ÆVæF$WfVçE7–æ46öçG&öÇ2‚“°¢Ğ§Ò“°§&Vg&W6„'WGFöâæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â&Vg&W6…&ööÔFF“°¦FDWfVçD'WGFöâæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ÷VäWfVçDÖöFÂ‚&7&VFR"’“°¦6÷”–çf—FT'WGFöâæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â6÷”–çf—FTÆ–æ²“°¦6÷”–çf—FT'WGFöäV×G’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â7–æ2‚’Óâ°¢v—B6÷”–çf—FTÆ–æ²‚“°¢F—6Ö—74–çf—FU7G&—‚“°§Ò“°¦F—6Ö—74–çf—FT'WGFöãòæFDWfVçDÆ—7FVæW"‚&6Æ–6²"ÂF—6Ö—74–çf—FU7G&—“°§&ööÔ6öFSòæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â6÷•&ööÔ6öFR“°§&WeW&–öD'WGFöãòæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ6†–gD6ÆVæF%W&–öB‚Ó’“°¦æW‡EW&–öD'WGFöãòæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ6†–gD6ÆVæF%W&–öBƒ’“°§FöF”'WGFöãòæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â7–æ2‚’Óâ°¢7W'&VçDfö7W4FFRÒ7F'DödF’†æWrFFR‚’“°¢7–æ4Ö–æ”6ÆVæF%Fôfö7W2‚“°¢v—B&Vg&W6„6ÆVæF$gFW$–ÖÖVF–FU&VæFW"‚“°§Ò“°¦6ÆVæF%6–FV&$'WGFöãòæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ°¢6WE'F–6—çG5æVÄW‡æFVB‡'F–6—çG56–FV&#òæFF6WBæ÷VâÓÒ'G'VR"“°§Ò“°¦ÖVÖ&W%6V&6„–çWCòæFDWfVçDÆ—7FVæW"‚&–çWB"Âf–ÇFW%'F–6—çE&÷w2“°¦ÖVÖ&W'56V7F–öåFövvÆSòæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ°¢6öç7BW‡æFVBÒÖVÖ&W'56V7F–öåFövvÆRævWDGG&–'WFR‚&&–ÖW‡æFVB"’ÓÒ&fÇ6R#°¢ÖVÖ&W'56V7F–öåFövvÆRç6WDGG&–'WFR‚&&–ÖW‡æFVB"Â7G&–ær‚W‡æFVB’“°¢ÖVÖ&W'56V7F–öåFövvÆRæ6Æ÷6W7B‚"æÖVÖ&W'2×6V7F–öâ"“òæ6Æ74Æ—7BçFövvÆR‚&—2Ö6öÆÆ6VB"ÂW‡æFVB“°§Ò“°¦Ö–æ”6ÆVæF%&Wf–÷W3òæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ°¢Ö–æ”6ÆVæF$7W'6÷"ÒFDÖöçF‡2†Ö–æ”6ÆVæF$7W'6÷"ÂÓ“°¢&VæFW$Ö–æ”6ÆVæF"‚“°§Ò“°¦Ö–æ”6ÆVæF$æW‡CòæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ°¢Ö–æ”6ÆVæF$7W'6÷"ÒFDÖöçF‡2†Ö–æ”6ÆVæF$7W'6÷"Â“°¢&VæFW$Ö–æ”6ÆVæF"‚“°§Ò“°¦F—7Æ”æÖT–çWCòæFDWfVçDÆ—7FVæW"‚&–çWB"Â66†VGVÆTF—7Æ”æÖU6fR“°§&VæÖU&ööÔ–çWCòæFDWfVçDÆ—7FVæW"‚&–çWB"Â66†VGVÆU&ööÔæÖU6fR“°§&VæÖU&ööÔVÖö¦”–çWCòæFDWfVçDÆ—7FVæW"‚&6†ævR"Â6fU&ööÔVÖö¦’“°§&VæÖU&ööÔVÖö¦”–çWCòæFDWfVçDÆ—7FVæW"‚&¶W–F÷vâ"Â7–æ2†WfVçB’Óâ°¢–b†WfVçBæ¶W’ÓÒ$VçFW""’&WGW&ã°¢WfVçBç&WfVçDFVfVÇB‚“°¢v—B6fU&ööÔVÖö¦’‚“°§Ò“°¦7W7FöÕ&ööÔ6öFT–çWCòæFDWfVçDÆ—7FVæW"‚&–çWB"Â‚’Óâ°¢7W7FöÕ&ööÔ6öFT–çWBçfÇVRÒæ÷&ÖÆ—¦T7W7FöÕ&ööÔ6öFT–çWB†7W7FöÕ&ööÔ6öFT–çWBçfÇVR“°§Ò“°¦7W7FöÕ&ööÔ6öFT–çWCòæFDWfVçDÆ—7FVæW"‚&¶W–F÷vâ"Â7–æ2†WfVçB’Óâ°¢–b†WfVçBæ¶W’ÓÒ$VçFW""’&WGW&ã°¢WfVçBç&WfVçDFVfVÇB‚“°¢v—B6fU&ööÔ6öFR‚“°§Ò“°¦7W7FöÕ&ööÔ6öFT–çWCòæFDWfVçDÆ—7FVæW"‚&&ÇW""Â7–æ2‚’Óâ°¢v—B6fU&ööÔ6öFR‚“°§Ò“°§&ööÔÆö6µFövvÆSòæFDWfVçDÆ—7FVæW"‚&6†ævR"Â6fU&ööÔÆö6µ7FFR“°§F†VÖUFövvÆRæFDWfVçDÆ—7FVæW"‚&6†ævR"Â‚’Óâ°¢6öç7BF†VÖRÒF†VÖUFövvÆRæ6†V6¶VBò&F&²"¢&Æ–v‡B#°¢Fö7VÖVçBæFö7VÖVçDVÆVÖVçBæ6Æ74Æ—7BæFB‚&—2×F†VÖR×7v—F6†–ær"“°¢Fö7VÖVçBæFö7VÖVçDVÆVÖVçBæFF6WBçF†VÖRÒF†VÖS°¢Æö6Å7F÷&vRç6WD—FVÒ‚&6r×F†VÖR"ÂF†VÖR“°¢v–æF÷rç6WEF–ÖV÷WB‚‚’Óâ°¢Fö7VÖVçBæFö7VÖVçDVÆVÖVçBæ6Æ74Æ—7Bç&VÖ÷fR‚&—2×F†VÖR×7v—F6†–ær"“°¢ÒÂÖ÷F–öäFVÆ’†Ö÷F–öå7FæF&D×2²C’“°§Ò“°§6WGF–æw4'WGFöâæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ°¢6öç7B6†÷VÆD÷VâÒ†÷7E÷÷fW"æ6Æ74Æ—7Bæ6öçF–ç2‚&†–FFVâ"’ÇÂ†÷7E÷÷fW"æ6Æ74Æ—7Bæ6öçF–ç2‚&—2Ö6Æ÷6–ær"“°¢6WEæVÅf—6–&–Æ—G’††÷7E÷÷fW"Â6†÷VÆD÷Vâ“°§Ò“°¦6ÆVæF$vöövÆT'WGFöãòæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ°¢–b‚7W'&VçE&ööÓòæ6öFR’&WGW&ã° ¢6öç7B6†÷VÆDWF†÷&—¦RĞ¢7W'&VçE'F–6—çDæVVG5&V6öææV7B‚’ÇÀ¢7W'&VçEW6W$6öææV7FVB‚’ÇÀ¢7W'&VçE'F–6—çD6öææV7FVB‚’ÇÀ¢6ÆVæF%w&—FU&VG’‚“° ¢–b‡6†÷VÆDWF†÷&—¦R’°¢v–æF÷ræÆö6F–öâæ‡&VbÒvöövÆTWF…W&Â†7W'&VçE&ööÒæ6öFRÂ²6ÆVæF%w&—FS¢G'VRÒ“°¢&WGW&ã°¢Ğ ¢6WEæVÅf—6–&–Æ—G’††÷7E÷÷fW"ÂG'VR“°¢v–æF÷rç&WVW7Dæ–ÖF–öäg&ÖR‚‚’Óâ°¢7–æ56WGF–æw46&Còç67&öÆÄ–çFõf–Wr‡²&Æö6³¢&æV&W7B"Ò“°¢vöövÆTWfVçE7–æ5FövvÆSòæfö7W2‡²&WfVçE67&öÆÃ¢G'VRÒ“°¢Ò“°§Ò“°§'F–6—çG56–FV&#òæFDWfVçDÆ—7FVæW"‚'ö–çFW&F÷vâ"Â†WfVçB’Óâ°¢–b†WfVçBçö–çFW%G—RÓÓÒ&Ö÷W6R"’&WGW&ã°¢'F–6—çG4G&vW$vW7GW&RÒ°¢ö–çFW$–C¢WfVçBçö–çFW$–BÀ¢7F'Eƒ¢WfVçBæ6Æ–VçE‚À¢7F'E“¢WfVçBæ6Æ–VçE’À¢Ó°§Ò“°§'F–6—çG56–FV&#òæFDWfVçDÆ—7FVæW"‚'ö–çFW'W"Â†WfVçB’Óâ°¢–b‚'F–6—çG4G&vW$vW7GW&RÇÂ'F–6—çG4G&vW$vW7GW&Rçö–çFW$–BÓÒWfVçBçö–çFW$–B’&WGW&ã°¢6öç7BFVÇF‚ÒWfVçBæ6Æ–VçE‚Ò'F–6—çG4G&vW$vW7GW&Rç7F'Eƒ°¢6öç7BFVÇF’ÒWfVçBæ6Æ–VçE’Ò'F–6—çG4G&vW$vW7GW&Rç7F'E“°¢–b„ÖF‚æ'2†FVÇF‚’ãÒ3"bbÖF‚æ'2†FVÇF‚’âÖF‚æ'2†FVÇF’’¢ã"’°¢6WE'F–6—çG5æVÄW‡æFVB†FVÇF‚â“°¢Ğ¢'F–6—çG4G&vW$vW7GW&RÒçVÆÃ°§Ò“°§'F–6—çG56–FV&#òæFDWfVçDÆ—7FVæW"‚'ö–çFW&6æ6VÂ"Â†WfVçB’Óâ°¢–b‡'F–6—çG4G&vW$vW7GW&Sòçö–çFW$–BÓÓÒWfVçBçö–çFW$–B’°¢'F–6—çG4G&vW$vW7GW&RÒçVÆÃ°¢Ğ§Ò“°¦gVÆÇ67&VVä'WGFöâæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â7–æ2‚’Óâ°¢v—BFövvÆTgVÆÇ67&VVäÖöFR‚“°§Ò“°§f–Wu7v—F6†W"æFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â7–æ2†WfVçB’Óâ°¢6öç7B'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FF×f–WuÒ"“°¢–b‚'WGFöâ’&WGW&ã°¢v—B6WD7W'&VçEf–Wr†'WGFöâæFF6WBçf–Wr“°§Ò“°¦Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚&¶W–F÷vâ"Â†WfVçB’Óâ°¢–b†WfVçBç&WVBÇÂ†WfVçBæ¶W’ÓÒ$VçFW""bbWfVçBæ¶W’ÓÒ""’’&WGW&ã°¢&W74¶W–&ö&DÖ÷F–öâ†WfVçBçF&vWB“°§Ò“°¦Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚&¶W—W"Â†WfVçB’Óâ°¢–b†WfVçBæ¶W’ÓÒ$VçFW""bbWfVçBæ¶W’ÓÒ""’&WGW&ã°¢&VÆV6T¶W–&ö&DÖ÷F–öâ†WfVçBçF&vWB“°§Ò“°¦Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚&fö7W6÷WB"Â†WfVçB’Óâ°¢&VÆV6T¶W–&ö&DÖ÷F–öâ†WfVçBçF&vWB“°§Ò“°§v–æF÷ræFDWfVçDÆ—7FVæW"‚&¶W–F÷vâ"Â7–æ2†WfVçB’Óâ°¢–b†WfVçBæ¶W’ÓÓÒ$W66R"’°¢6Æ÷6TW‡æFVD'W7•7F6·2‚“°¢6WE'F–6—çG5æVÄW‡æFVB†fÇ6R“°¢Ğ¢–b‚†WfVçBæÖWF¶W’ÇÂWfVçBæ7G&Ä¶W’’bbWfVçBç6†–gD¶W’bbWfVçBæ¶W’çFôÆ÷vW$66R‚’ÓÓÒ'¢"’°¢–b‡6†÷VÆD–væ÷&UVæFõ6†÷'F7WB†WfVçBçF&vWB’’&WGW&ã°¢WfVçBç&WfVçDFVfVÇB‚“°¢v—BVæFôÆ7DWfVçD7&VF–öâ‚“°¢&WGW&ã°¢Ğ¢–b†WfVçBæÖWF¶W’ÇÂWfVçBæ7G&Ä¶W’ÇÂWfVçBæÇD¶W’’&WGW&ã°¢–b‡6†÷VÆD–væ÷&Uf–Wu6†÷'F7WB†WfVçBçF&vWB’’&WGW&ã°¢–b†WfVçBæ¶W’ÓÓÒ#Â"ÇÂWfVçBæ¶W’ÓÓÒ#â"’°¢WfVçBç&WfVçDFVfVÇB‚“°¢v—B6†–gD6ÆVæF%W&–öB†WfVçBæ¶W’ÓÓÒ#Â"òÓ¢“°¢&WGW&ã°¢Ğ¢–b†WfVçBæ¶W’çFôÆ÷vW$66R‚’ÓÓÒ&b"’°¢WfVçBç&WfVçDFVfVÇB‚“°¢v—BFövvÆTgVÆÇ67&VVäÖöFR‚“°¢&WGW&ã°¢Ğ¢6öç7BæW‡Ef–WrÒf–Wu6†÷'F7WDÖ¶WfVçBæ¶W’çFôÆ÷vW$66R‚•Ó°¢–b‚æW‡Ef–Wr’&WGW&ã°¢WfVçBç&WfVçDFVfVÇB‚“°¢v—B6WD7W'&VçEf–Wr†æW‡Ef–Wr“°§Ò“°§v–æF÷ræFDWfVçDÆ—7FVæW"‚'&W6—¦R"Â‚’Óâ°¢÷6—F–öäWfVçDÖöFÂ‚“°§Ò“°¦6ÆVæF$w&–BæFDWfVçDÆ—7FVæW"‚'ö–çFW&F÷vâ"Â7F'DG&t7&VFRÂG'VR“°¦6ÆVæF$w&–BæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â7W&W746ÆVæF$6Æ–6´6GW&RÂG'VR“°§6WE'F–6—çG5æVÄW‡æFVB‚v–æF÷ræÖF6„ÖVF–‚"†Ö‚×v–GFƒ¢sc‚’"’æÖF6†W2“°§&ööÔæÖRæFDWfVçDÆ—7FVæW"‚&F&Æ6Æ–6²"Â‚’Óâ°¢7F'D–æÆ–æU&ööÕ&VæÖR‚“°§Ò“°§&ööÔæÖRæFDWfVçDÆ—7FVæW"‚&¶W–F÷vâ"Â7–æ2†WfVçB’Óâ°¢–b‚–æÆ–æU&ööÕ&VæÖT7F—fR’&WGW&ã°¢–b†WfVçBæ¶W’ÓÓÒ$VçFW""’°¢WfVçBç&WfVçDFVfVÇB‚“°¢v—Bf–æ—6„–æÆ–æU&ööÕ&VæÖR‡G'VR“°¢ÒVÇ6R–b†WfVçBæ¶W’ÓÓÒ$W66R"’°¢WfVçBç&WfVçDFVfVÇB‚“°¢v—Bf–æ—6„–æÆ–æU&ööÕ&VæÖR†fÇ6R“°¢Ğ§Ò“°§&ööÔæÖRæFDWfVçDÆ—7FVæW"‚&&ÇW""Â7–æ2‚’Óâ°¢v—Bf–æ—6„–æÆ–æU&ööÕ&VæÖR‡G'VR“°§Ò“°¦6Æ÷6TFWF–Ä'WGFöâæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â6ÆV$FWF–ÅæVÂ“°¦WfVçDf÷&ÒæFDWfVçDÆ—7FVæW"‚'7V&Ö—B"Â6fTWfVçB“°¦WfVçEæVÄf÷&ÓòæFDWfVçDÆ—7FVæW"‚'7V&Ö—B"Â6fTWfVçEæVÄ6†ævW2“°¦f÷"†6öç7B–çWBöb°¢FWF–ÅF—FÆT–çWBÀ¢FWF–ÄFFT–çWBÀ¢FWF–Å7F'D–çWBÀ¢FWF–ÄVæD–çWBÀ¢FWF–ÄÆö6F–öä–çWBÀ¢FWF–ÄFW67&—F–öä–çW@¥Ò’°¢–çWCòæFDWfVçDÆ—7FVæW"‚&–çWB"Â‚’Óâ°¢–b†FWF–Ä–çf—FVTfVVF&6²’°¢FWF–Ä–çf—FVTfVVF&6²æFF6WBçW'6—7FVDÖW76vRÒ"#°¢FWF–Ä–çf—FVTfVVF&6²çFW‡D6öçFVçBÒWfVçEæVÄ†5Vç6fVD6†ævW2‚’ò%Vç6fVB6†ævW2"¢"#°¢Ğ¢WFFTWfVçEæVÅ6fU7FFR‚“°¢Ò“°¢–çWCòæFDWfVçDÆ—7FVæW"‚&6†ævR"Â‚’Óâ°¢–b†FWF–Ä–çf—FVTfVVF&6²’°¢FWF–Ä–çf—FVTfVVF&6²æFF6WBçW'6—7FVDÖW76vRÒ"#°¢FWF–Ä–çf—FVTfVVF&6²çFW‡D6öçFVçBÒWfVçEæVÄ†5Vç6fVD6†ævW2‚’ò%Vç6fVB6†ævW2"¢"#°¢Ğ¢WFFTWfVçEæVÅ6fU7FFR‚“°¢Ò“°§Ğ¦FWF–ÄvöövÆU7–æ4–çWCòæFDWfVçDÆ—7FVæW"‚&6†ævR"Â‚’Óâ°¢–b†FWF–Ä–çf—FVTfVVF&6²’°¢FWF–Ä–çf—FVTfVVF&6²æFF6WBçW'6—7FVDÖW76vRÒ"#°¢FWF–Ä–çf—FVTfVVF&6²çFW‡D6öçFVçBÒWfVçEæVÄ†5Vç6fVD6†ævW2‚’ò%Vç6fVB6†ævW2"¢"#°¢Ğ¢WFFTFWF–ÄvöövÆU7–æ46öçG&öÂ†WfVçEæVÄf÷&ÓòæFF6WBæ6äÖævRÓÓÒ'G'VR"“°¢WFFTWfVçEæVÅ6fU7FFR‚“°§Ò“°¦WfVçDvöövÆU7–æ4–çWCòæFDWfVçDÆ—7FVæW"‚&6†ævR"ÂWFFTWfVçDvöövÆU7–æ46öçG&öÂ“°¦WfVçDvöövÆU7–æ5&÷sòæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â7F—fFTWfVçDvöövÆU7–æ5&÷r“°¦WfVçDvöövÆU7–æ5&÷sòæFDWfVçDÆ—7FVæW"‚&¶W–F÷vâ"Â†WfVçB’Óâ°¢–b†WfVçBæ¶W’ÓÒ$VçFW""bbWfVçBæ¶W’ÓÒ""’&WGW&ã°¢7F—fFTWfVçDvöövÆU7–æ5&÷r†WfVçB“°§Ò“°¦WfVçDÆÄF”–çWCòæFDWfVçDÆ—7FVæW"‚&6†ævR"Â‚’Óâ°¢6WDÆÄF”ÖöFR†WfVçDÆÄF”–çWBæ6†V6¶VB“°¢&WVW7Dæ–ÖF–öäg&ÖR‡÷6—F–öäWfVçDÖöFÂ“°§Ò“°¦WfVçDFFT–çWCòæFDWfVçDÆ—7FVæW"‚&6†ævR"Â‚’Óâ°¢–b‚WfVçDÆÄF”–çWCòæ6†V6¶VBÇÂWfVçDVæDFFT–çWB’&WGW&ã°¢–b‚WfVçDVæDFFT–çWBçfÇVRÇÂWfVçDVæDFFT–çWBçfÇVRÂWfVçDFFT–çWBçfÇVR’°¢WfVçDVæDFFT–çWBçfÇVRÒWfVçDFFT–çWBçfÇVS°¢Ğ§Ò“°¦6æ6VÄWfVçD'WGFöâæFDWfVçDÆ—7FVæW"‚&6Æ–6²"ÂGFV×D6Æ÷6TWfVçDÖöFÂ“°¦6æ6VÄWfVçE6V6öæF'’æFDWfVçDÆ—7FVæW"‚&6Æ–6²"ÂGFV×D6Æ÷6TWfVçDÖöFÂ“°¦7&VFU&ööÔÖöFÄf÷&ÓòæFDWfVçDÆ—7FVæW"‚'7V&Ö—B"Â7&VFU&ööÔg&öÕ7v—F6†W"“°¦6æ6VÄ7&VFU&ööÔÖöFÄ'WGFöãòæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â6Æ÷6T7&VFU&ööÔÖöFÂ“°¦6æ6VÄ7&VFU&ööÔÖöFÅ6V6öæF'“òæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â6Æ÷6T7&VFU&ööÔÖöFÂ“°¢FVÆWFTWfVçD'WGFöâæFDWfVçDÆ—7FVæW"‚&6Æ–6²"ÂFVÆWFTWfVçB“°¢F÷væÆöD–74'WGFöâæFDWfVçDÆ—7FVæW"‚&6Æ–6²"ÂF÷væÆöD–72“°¢6öÖÖVçDf÷&ÒæFDWfVçDÆ—7FVæW"‚'7V&Ö—B"ÂFD6öÖÖVçB“°¦f÷"†6öç7B'WGFöâöbFö7VÖVçBçVW'•6VÆV7F÷$ÆÂ‚"çf÷FRÖ'WGFöâ"’’°¢'WGFöâæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ&W7öæEFôWfVçB†'WGFöâæFF6WBç&W7öç6R’“°§Ğ §v–æF÷ræFDWfVçDÆ—7FVæW"‚'÷7FFR"Â7–æ2‚’Óâ°¢v–æF÷ræ6ÆV$–çFW'fÂ‡&Vg&W6…F–ÖW"“°¢v—B&ö÷B‚“°§Ò“° §v–æF÷ræFDWfVçDÆ—7FVæW"‚&ÖW76vR"Â†æFÆTvöövÆTWF…÷WÖW76vR“° ¦Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â†WfVçB’Óâ°¢–b††÷7E÷÷fW"bb†÷7E÷÷fW"æ6Æ74Æ—7Bæ6öçF–ç2‚&†–FFVâ"’’°¢–b€¢†÷7E÷÷fW"æ6öçF–ç2†WfVçBçF&vWB’b`¢6WGF–æw4'WGFöâæ6öçF–ç2†WfVçBçF&vWB’b`¢6ÆVæF$vöövÆT'WGFöãòæ6öçF–ç2†WfVçBçF&vWB’b`¢VÖö¦•–6¶W%÷÷fW#òæ6öçF–ç2†WfVçBçF&vWB¢’°¢6WEæVÅf—6–&–Æ—G’††÷7E÷÷fW"ÂfÇ6R“°¢Ğ¢Ğ ¢–b‚WfVçBçF&vWBæ6Æ÷6W7B‚"æ'W7’×7F6²"’’°¢6Æ÷6TW‡æFVD'W7•7F6·2‚“°¢Ğ ¢f÷"†6öç7BÖVçRöbFö7VÖVçBçVW'•6VÆV7F÷$ÆÂ‚"æ6öÆ÷"×–6¶W"ÖÖVçU¶÷VåÒ"’’°¢–b†ÖVçRæ6öçF–ç2†WfVçBçF&vWB’’6öçF–çVS°¢ÖVçRæ÷VâÒfÇ6S°¢Ğ ¢–b†FWF–ÅæVÂbbFWF–ÅæVÂæ6Æ74Æ—7Bæ6öçF–ç2‚&†–FFVâ"’’°¢–b€¢FWF–ÅæVÂæ6öçF–ç2†WfVçBçF&vWB’ÇÀ¢WfVçBçF&vWBæ6Æ÷6W7B‚"æWfVçBÖ6&BÂæ'W7’Ö6&BÂæ'W7’×7F6²Âæ'W7’Ö6†—ÂæWfVçBÖ6†—Âæg&VRÖ&Æö6²Âæg&VRÖvÆ÷rÖ&Æö6²"¢’°¢&WGW&ã°¢Ğ¢6ÆV$FWF–ÅæVÂ‚“°¢Ğ§Ò“° ¦Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚&gVÆÇ67&VVæ6†ævR"Â‚’Óâ°¢Fö7VÖVçBæFö7VÖVçDVÆVÖVçBæ6Æ74Æ—7BçFövvÆR‚&gVÆÇ67&VVâÖÖöFR"Â&ööÆVâ†Fö7VÖVçBægVÆÇ67&VVäVÆVÖVçB’“°¢WFFTgVÆÇ67&VVä6öçG&öÂ‚“°¢&WÆ”Ö÷F–öä6Æ72†6ÆVæF$w&–BÂ&—2×f–WrÖVçFW&–ær"“°§Ò“° ¦Væ&ÆTF–Æöt&6¶G&÷6Æ÷6R†WfVçDÖöFÂÂGFV×D6Æ÷6TWfVçDÖöFÂ“°¦Væ&ÆTF–Æöt&6¶G&÷6Æ÷6R†7&VFU&ööÔÖöFÂÂ6Æ÷6T7&VFU&ööÔÖöFÂ“° ¦7&VFU&ööÔÖöFÃòæFDWfVçDÆ—7FVæW"‚&6Æ÷6R"Â‚’Óâ°¢–b†VÖö¦•–6¶W%7FFRçG&–vvW#òæ6Æ÷6W7B‚"67&VFU&ööÔÖöFÂ"’’°¢6Æ÷6TVÖö¦•–6¶W"‡²&W7F÷&Tfö7W3¢fÇ6RÂ–ÖÖVF–FS¢G'VRÒ“°¢Ğ§Ò“° ¦WfVçDÖöFÂæFDWfVçDÆ—7FVæW"‚&6æ6VÂ"Â†WfVçB’Óâ°¢WfVçBç&WfVçDFVfVÇB‚“°¢GFV×D6Æ÷6TWfVçDÖöFÂ‚“°§Ò“° §WFFTgVÆÇ67&VVä6öçG&öÂ‚“°¦Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚'ö–çFW&F÷vâ"Â†æFÆT÷WG6–FTfÆöF–æu7W&f6Uö–çFW"ÂG'VR“°¦Fö7VÖVçBæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â†æFÆT÷WG6–FTfÆöF–æu7W&f6T6Æ–6²ÂG'VR“°¦–æ—F–Æ—¦TVÖö¦•–6¶W'2‚“°¦&ö÷B‚“°