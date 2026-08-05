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
let selectedEventI×mvóÛh‘éì¶»§q«^t[[™\•][]Sİ™\™›İÓY[OË˜Y]™[\İ[™\ŠšÙ^YİÛˆ‹
]™[
HOˆÂˆYˆ
]™[šÙ^HOOH‘\ØØ\HŠH™]\›Âˆ]™[œ™]™[Y˜][

NÂˆÙ]Ø[[™\•][]SY[SÜ[Š˜[ÙJNÂˆØ[[™\•][]Sİ™\™›İĞ]ÛË™›Øİ\ÊÈ™]™[ØÜ›ÛˆYHJNÂŸJNÂšÜİÜİ™\Ë˜Y]™[\İ[™\ŠšÙ^YİÛˆ‹
]™[
HOˆÂˆYˆ
]™[šÙ^HOOH‘\ØØ\HŠHÂˆ]™[œ™]™[Y˜][

NÂˆÙ]Ù][™ÜÔ[™[Ü[Š˜[ÙJNÂˆ™]\›ÂˆBˆYˆ
]™[šÙ^HOOH•XˆŠH™]\›ÂˆÛÛœİ›Øİ\ØX›HH›Øİ\ØX›Q[[Y[ÕÚ][ŠÜİÜİ™\ŠNÂˆYˆ
Y›Øİ\ØX›K›[™İ
H™]\›ÂˆÛÛœİš\œİH›Øİ\ØX›VÌNÂˆÛÛœİ\İH›Øİ\ØX›K˜]
LJNÂˆYˆ
]™[œÚYÙ^H	‰ˆØİ[Y[˜Xİ]™Q[[Y[OOHš\œİ
HÂˆ]™[œ™]™[Y˜][

NÂˆ\İ™›Øİ\ÊÈ™]™[ØÜ›ÛˆYHJNÂˆH[ÙHYˆ
Y]™[œÚYÙ^H	‰ˆØİ[Y[˜Xİ]™Q[[Y[OOH\İ
HÂˆ]™[œ™]™[Y˜][

NÂˆš\œİ™›Øİ\ÊÈ™]™[ØÜ›ÛˆYHJNÂˆBŸJNÂœ\XÚ\[ÔÚYX˜\Ë˜Y]™[\İ[™\ŠœÚ[\™İÛˆ‹
]™[
HOˆÃBˆYˆ
]™[œÚ[\•\HOOH›[İ\ÙHŠH™]\›ÃBˆ\XÚ\[Ñ˜]Ù\‘Ù\İ\™HHÃBˆÚ[\’Yˆ]™[œÚ[\’YBˆİ\ˆ]™[˜ÛY[Bˆİ\Nˆ]™[˜ÛY[KBˆNÃBŸJNÃBœ\XÚ\[ÔÚYX˜\Ë˜Y]™[\İ[™\ŠœÚ[\\‹
]™[
HOˆÃBˆYˆ
\\XÚ\[Ñ˜]Ù\‘Ù\İ\™H\XÚ\[Ñ˜]Ù\‘Ù\İ\™KœÚ[\’YOOH]™[œÚ[\’Y
H™]\›ÃBˆÛÛœİ[VH]™[˜ÛY[H\XÚ\[Ñ˜]Ù\‘Ù\İ\™Kœİ\ÃBˆÛÛœİ[VHH]™[˜ÛY[HH\XÚ\[Ñ˜]Ù\‘Ù\İ\™Kœİ\NÃBˆYˆ
X]˜XœÊ[V
HHÌˆ	‰ˆX]˜XœÊ[V
HˆX]˜XœÊ[VJH
ˆKŒŠHÃBˆÙ]\XÚ\[Ô[™[^[™Y
[Vˆ
NÃBˆCBˆ\XÚ\[Ñ˜]Ù\‘Ù\İ\™HH[ÃBŸJNÃBœ\XÚ\[ÔÚYX˜\Ë˜Y]™[\İ[™\ŠœÚ[\˜Ø[˜Ù[‹
]™[
HOˆÃBˆYˆ
\XÚ\[Ñ˜]Ù\‘Ù\İ\™OËœÚ[\’YOOH]™[œÚ[\’Y
HÃBˆ\XÚ\[Ñ˜]Ù\‘Ù\İ\™HH[ÃBˆCBŸJNÃB™[ØÜ™Y[]Û‹˜Y]™[\İ[™\Š˜ÛXÚÈ‹\Ş[˜È

HOˆÃBˆ]ØZ]ÙÙÛQ[ØÜ™Y[“[ÙJ
NÃBŸJNÃBšY]ÔİÚ]Ú\‹˜Y]™[\İ[™\Š˜ÛXÚÈ‹\Ş[˜È
]™[
HOˆÃBˆÛÛœİ]ÛˆH]™[\™Ù]˜ÛÜÙ\İ
–Ù]K]šY]×HŠNÃBˆYˆ
X]ÛŠH™]\›ÃBˆ]ØZ]Ù]İ\œ™[šY]Ê]Û‹™]\Ù]šY]ÊNÃBŸJNÃB™Øİ[Y[˜Y]™[\İ[™\ŠšÙ^YİÛˆ‹
]™[
HOˆÃBˆYˆ
]™[œ™\X]
]™[šÙ^HOOH‘[\ˆˆ	‰ˆ]™[šÙ^HOOHˆŠJH™]\›ÃBˆ™\ÜÒÙ^X›Ø\™[İ[ÛŠ]™[\™Ù]
NÃBŸJNÃB™Øİ[Y[˜Y]™[\İ[™\ŠšÙ^]\‹
]™[
HOˆÃBˆYˆ
]™[šÙ^HOOH‘[\ˆˆ	‰ˆ]™[šÙ^HOOHˆŠH™]\›ÃBˆ™[X\ÙRÙ^X›Ø\™[İ[ÛŠ]™[\™Ù]
NÃBŸJNÃB™Øİ[Y[˜Y]™[\İ[™\Š™›Øİ\Ûİ]‹
]™[
HOˆÃBˆ™[X\ÙRÙ^X›Ø\™[İ[ÛŠ]™[\™Ù]
NÃBŸJNÃBÚ[™İË˜Y]™[\İ[™\ŠšÙ^YİÛˆ‹\Ş[˜È
]™[
HOˆÂˆYˆ
]™[šÙ^HOOH‘\ØØ\HŠHÂˆÛÜÙQ^[™Y\ŞTİXÚÜÊ
NÂˆYˆ
Ø[[™\•][]Sİ™\™›İĞ]ÛË™Ù]]šX]J˜\šXKY^[™YŠHOOHYHŠHÂˆ]™[œ™]™[Y˜][

NÂˆÙ]Ø[[™\•][]SY[SÜ[Š˜[ÙJNÂˆØ[[™\•][]Sİ™\™›İĞ]Û‹™›Øİ\ÊÈ™]™[ØÜ›ÛˆYHJNÂˆ™]\›ÂˆBˆYˆ
Ù][™ÜÔ[™[\ÓÜ[Š
JHÂˆ]™[œ™]™[Y˜][

NÂˆÙ]Ù][™ÜÔ[™[Ü[Š˜[ÙJNÂˆ™]\›ÂˆBˆYˆ
ÚYX˜\•\Ù\Ñ˜]Ù\“^[İ]

H	‰ˆ\XÚ\[ÔÚYX˜\Ë™]\Ù]›Ü[ˆOOHYHŠHÂˆ]™[œ™]™[Y˜][

NÂˆÙ]\XÚ\[Ô[™[^[™Y
˜[ÙKÈ™\İÜ™Q›Øİ\ÎˆYHJNÂˆ™]\›ÂˆBˆBˆYˆ

]™[›Y]RÙ^H]™[˜İ›Ù^JH	‰ˆY]™[œÚYÙ^H	‰ˆ]™[šÙ^KÓİÙ\Ø\ÙJ
HOOHˆŠHÃBˆYˆ
Úİ[YÛ›Ü™U[™ÔÚÜİ]
]™[\™Ù]
JH™]\›ÃBˆ]™[œ™]™[Y˜][

NÃBˆ]ØZ][™Ó\İ]™[Ü™X][ÛŠ
NÃBˆ™]\›ÃBˆCBˆYˆ
]™[›Y]RÙ^H]™[˜İ›Ù^H]™[˜[Ù^JH™]\›ÃBˆYˆ
Úİ[YÛ›Ü™UšY]ÔÚÜİ]
]™[\™Ù]
JH™]\›ÃBˆYˆ
]™[šÙ^HOOHˆ]™[šÙ^HOOHˆŠHÃBˆ]™[œ™]™[Y˜][

NÃBˆ]ØZ]ÚYØ[[™\”\š[Ù
]™[šÙ^HOOHˆÈLHˆJNÃBˆ™]\›ÃBˆCBˆYˆ
]™[šÙ^KÓİÙ\Ø\ÙJ
HOOH™ˆŠHÃBˆ]™[œ™]™[Y˜][

NÃBˆ]ØZ]ÙÙÛQ[ØÜ™Y[“[ÙJ
NÃBˆ™]\›ÃBˆCBˆÛÛœİ™^šY]ÈHšY]ÔÚÜİ]X\Ù]™[šÙ^KÓİÙ\Ø\ÙJ
WNÃBˆYˆ
[™^šY]ÊH™]\›ÃBˆ]™[œ™]™[Y˜][

NÃBˆ]ØZ]Ù]İ\œ™[šY]Ê™^šY]ÊNÃBŸJNÃBÚ[™İË˜Y]™[\İ[™\Šœ™\Ú^™H‹

HOˆÂˆÜÚ][Û‘]™[[Ù[

NÂˆYˆ
Xİ]™Q]™[[YTXÚÙ\ŠHÜÚ][Û‘]™[[YTXÚÙ\ŠXİ]™Q]™[[YTXÚÙ\ŠNÂˆŞ[˜ĞØ[[™\•][]Sİ™\™›İÕš\ÚXš[]J
NÂˆÙ]\XÚ\[Ô[™[^[™Y
\XÚ\[ÔÚYX˜\Ë™]\Ù]›Ü[ˆOOHYH‹Âˆ\œÚ\İˆ˜[ÙKˆ™\İÜ™Q›Øİ\Îˆ˜[ÙBˆJNÂŸJNÂ˜Ø[[™\‘ÜšY˜Y]™[\İ[™\ŠœÚ[\™İÛˆ‹İ\˜YĞÜ™X]KYJNÂ˜Ø[[™\‘ÜšY˜Y]™[\İ[™\Š˜ÛXÚÈ‹İ\™\ÜĞØ[[™\ÛXÚĞØ\\™KYJNÂ˜Ø[[™\”ØÜ›ÛÜË˜Y]™[\İ[™\ŠœØÜ›Û‹

HOˆÂˆYˆ
Ø[[™\”ØÜ›Û™\İÜ™Qœ˜[YJH™]\›ÂˆÚ[™İË˜ÛX\•[Y[İ]
Ø[[™\”ØÜ›ÛØ]™U[Y\ŠNÂˆØ[[™\”ØÜ›ÛØ]™U[Y\ˆHÚ[™İËœÙ][Y[İ]


HOˆÂˆØ]™PØ[[™\”ØÜ›ÛÜÚ][ÛŠİ\œ™[šY]ÊNÂˆØ[[™\”ØÜ›ÛØ]™U[Y\ˆH[ÂˆKM
NÂŸKÈ\ÜÚ]™NˆYHJNÂš[š]X[^™PØ[[™\•][]SY[J
NÂœŞ[˜ĞØ[[™\•][]Sİ™\™›İÕš\ÚXš[]J
NÂœÙ]\XÚ\[Ô[™[^[™Y
™XYİÜ™YÚYX˜\“Ü[Š
KÈ\œÚ\İˆ˜[ÙK™\İÜ™Q›Øİ\Îˆ˜[ÙHJNÂ™[˜İ[Ûˆš[™›ÛÛS˜[YQY]ÜŠ\™Ù]
HÃBˆYˆ
]\™Ù]
H™]\›ÃBˆ\™Ù]˜Y]™[\İ[™\Š™›ÛXÚÈ‹
]™[
HOˆÃBˆ]™[œ™]™[Y˜][

NÃBˆİ\[›[™T›ÛÛT™[˜[YJ\™Ù]
NÃBˆJNÃBˆ\™Ù]˜Y]™[\İ[™\ŠšÙ^YİÛˆ‹\Ş[˜È
]™[
HOˆÃBˆYˆ
Z[›[™T›ÛÛT™[˜[YPXİ]™JHÃBˆYˆ
İ\œ™[\ÒÜİ	‰ˆ
]™[šÙ^HOOH‘[\ˆˆ]™[šÙ^HOOH‘ŒˆŠJHÃBˆ]™[œ™]™[Y˜][

NÃBˆİ\[›[™T›ÛÛT™[˜[YJ\™Ù]
NÃBˆCBˆ™]\›ÃBˆCBˆYˆ
[›[™T›ÛÛT™[˜[YU\™Ù]OOH\™Ù]
H™]\›ÃBˆYˆ
]™[šÙ^HOOH‘[\ˆŠHÃBˆ]™[œ™]™[Y˜][

NÃBˆ]ØZ]š[š\Ú[›[™T›ÛÛT™[˜[YJYJNÃBˆH[ÙHYˆ
]™[šÙ^HOOH‘\ØØ\HŠHÃBˆ]™[œ™]™[Y˜][

NÃBˆ]ØZ]š[š\Ú[›[™T›ÛÛT™[˜[YJ˜[ÙJNÃBˆCBˆJNÃBˆ\™Ù]˜Y]™[\İ[™\Š˜›\ˆ‹\Ş[˜È

HOˆÃBˆYˆ
[›[™T›ÛÛT™[˜[YU\™Ù]OOH\™Ù]
HÃBˆ]ØZ]š[š\Ú[›[™T›ÛÛT™[˜[YJYJNÃBˆCBˆJNÃBŸCBƒB˜š[™›ÛÛS˜[YQY]ÜŠ›ÛÛS˜[YJNÂ˜š[™›ÛÛS˜[YQY]ÜŠÜ˜\”›ÛÛS˜[YJNÂ˜ÛÜÙQ]Z[]Û‹˜Y]™[\İ[™\Š˜ÛXÚÈ‹ÛX\‘]Z[[™[
NÂ™Y]]™[]ÛË˜Y]™[\İ[™\Š˜ÛXÚÈ‹

HOˆÂˆÛÛœİ]™[YHÙ[XİY]™[YÂˆÛÛœİ]™[[HHXİ]™Q]™[

NÂˆYˆ
Y]™[YY]™[[HXØ[“X[˜YÙQ]™[
]™[[JJH™]\›ÂˆÛX\‘]Z[[™[

NÂˆÜ[‘]™[[Ù[
™Y]‹È]™[YJNÂŸJNÂš[š]X[^™Q]™[[YTXÚÙ\œÊ
NÃBš[š]X[^™SØØ][Û]]ØÛÛ\]J]™[ØØ][Û’[œ]
NÃBš[š]X[^™SØØ][Û]]ØÛÛ\]J]Z[ØØ][Û’[œ]
NÃB™]™[›Ü›K˜Y]™[\İ[™\ŠœİX›Z]‹ÛÛ[Z]]™[[YTXÚÙ\œĞ™Y›Ü™TİX›Z]YJNÃB™]™[›Ü›K˜Y]™[\İ[™\ŠœİX›Z]‹Ø]™Q]™[
NÃB™]™[[™[›Ü›OË˜Y]™[\İ[™\ŠœİX›Z]‹ÛÛ[Z]]™[[YTXÚÙ\œĞ™Y›Ü™TİX›Z]YJNÃB™]™[[™[›Ü›OË˜Y]™[\İ[™\ŠœİX›Z]‹Ø]™Q]™[[™[Ú[™Ù\ÊNÃB™›Üˆ
ÛÛœİ[œ]ÙˆÃBˆ]Z[]R[œ]Bˆ]Z[]R[œ]Bˆ]Z[İ\[œ]Bˆ]Z[[™[œ]Bˆ]Z[İ\[YR[œ]Bˆ]Z[[™[YR[œ]Bˆ]Z[ØØ][Û’[œ]Bˆ]Z[\ØÜš\[Û’[œ]B—JHÃBˆ[œ]Ë˜Y]™[\İ[™\Šš[œ]‹

HOˆÃBˆYˆ
]Z[[š]YQ™YY˜XÚÊHÃBˆ]Z[[š]YQ™YY˜XÚË™]\Ù]œ\œÚ\İYY\ÜØYÙHHˆÃBˆ]Z[[š]YQ™YY˜XÚË^ÛÛ[H]™[[™[\Õ[œØ]™YÚ[™Ù\Ê
HÈ•[œØ]™YÚ[™Ù\ÈˆˆˆÃBˆCBˆ\]Q]™[[™[Ø]™Tİ]J
NÃBˆJNÃBˆ[œ]Ë˜Y]™[\İ[™\Š˜Ú[™ÙH‹

HOˆÃBˆYˆ
]Z[[š]YQ™YY˜XÚÊHÃBˆ]Z[[š]YQ™YY˜XÚË™]\Ù]œ\œÚ\İYY\ÜØYÙHHˆÃBˆ]Z[[š]YQ™YY˜XÚË^ÛÛ[H]™[[™[\Õ[œØ]™YÚ[™Ù\Ê
HÈ•[œØ]™YÚ[™Ù\ÈˆˆˆÃBˆCBˆ\]Q]™[[™[Ø]™Tİ]J
NÃBˆJNÃBŸCB™]Z[ÛÛÙÛTŞ[˜Ò[œ]Ë˜Y]™[\İ[™\Š˜Ú[™ÙH‹

HOˆÃBˆYˆ
]Z[[š]YQ™YY˜XÚÊHÃBˆ]Z[[š]YQ™YY˜XÚË™]\Ù]œ\œÚ\İYY\ÜØYÙHHˆÃBˆ]Z[[š]YQ™YY˜XÚË^ÛÛ[H]™[[™[\Õ[œØ]™YÚ[™Ù\Ê
HÈ•[œØ]™YÚ[™Ù\ÈˆˆˆÃBˆCBˆ\]Q]Z[ÛÛÙÛTŞ[˜ĞÛÛ›Û
]™[[™[›Ü›OË™]\Ù]˜Ø[“X[˜YÙHOOHYHŠNÃBˆ\]Q]™[[™[Ø]™Tİ]J
NÃBŸJNÃB™]™[ÛÛÙÛTŞ[˜Ò[œ]Ë˜Y]™[\İ[™\Š˜Ú[™ÙH‹\]Q]™[ÛÛÙÛTŞ[˜ĞÛÛ›Û
NÃB™]™[ÛÛÙÛTŞ[˜Ô›İÏË˜Y]™[\İ[™\Š˜ÛXÚÈ‹Xİ]˜]Q]™[ÛÛÙÛTŞ[˜Ô›İÊNÃB™]™[ÛÛÙÛTŞ[˜Ô›İÏË˜Y]™[\İ[™\ŠšÙ^YİÛˆ‹
]™[
HOˆÃBˆYˆ
]™[šÙ^HOOH‘[\ˆˆ	‰ˆ]™[šÙ^HOOHˆŠH™]\›ÃBˆXİ]˜]Q]™[ÛÛÙÛTŞ[˜Ô›İÊ]™[
NÃBŸJNÃB™]™[[š]Q›ÜİÛË˜Y]™[\İ[™\ŠÙÙÛH‹

HOˆÃBˆ™\]Y\İ[š[X][Û‘œ˜[YJÜÚ][Û‘]™[[Ù[
NÃBŸJNÃB™]™[[š]Q›ÜİÛËœ]Y\TÙ[XİÜŠœİ[[X\HŠOË˜Y]™[\İ[™\Š˜ÛXÚÈ‹
]™[
HOˆÃBˆYˆ
Y]™[[š]Q›ÜİÛ‹˜Û\ÜÓ\İ˜ÛÛZ[œÊš\ËY[\HŠJH™]\›ÃBˆ]™[œ™]™[Y˜][

NÃBˆ]™[[š]Q›ÜİÛ‹›Ü[ˆH˜[ÙNÃBŸJNÃB˜ÛÛœİ]™[ÛÛ\ÜÙ\”™]šY]Ò[œ]H
\™Ù]
HOˆ
Bˆ\™Ù]OOH]™[]R[œ]Bˆ\™Ù]OOH]™[]R[œ]Bˆ\™Ù]OOH]™[[™]R[œ]Bˆ\™Ù]OOH]™[İ\[œ]Bˆ\™Ù]OOH]™[[™[œ]Bˆ\™Ù]OOH]™[[^R[œ]Bˆ›ÛÛX[Š\™Ù]Ë˜ÛÜÙ\İËŠˆÚ[š]YTXÚÙ\ˆ[œ]İ\OIØÚXÚØ›Ş	×HŠJCBŠNÃB™]™[›Ü›K˜Y]™[\İ[™\Šš[œ]‹
]™[
HOˆÃBˆYˆ
Y]™[ÛÛ\ÜÙ\”™]šY]Ò[œ]
]™[\™Ù]
JH™]\›ÃBˆØÚY[Q]™[ÛÛ\ÜÙ\”™]šY]Õ\]J
NÃBŸJNÃB™]™[›Ü›K˜Y]™[\İ[™\Š˜Ú[™ÙH‹
]™[
HOˆÃBˆYˆ
Y]™[ÛÛ\ÜÙ\”™]šY]Ò[œ]
]™[\™Ù]
JH™]\›ÃBˆÛÛœİÚ[™Ù\Ô˜[™ÙHH]™[\™Ù]OOH]™[]R[œ]Bˆ]™[\™Ù]OOH]™[[™]R[œ]Bˆ]™[\™Ù]OOH]™[İ\[œ]Bˆ]™[\™Ù]OOH]™[[™[œ]Bˆ]™[\™Ù]OOH]™[[^R[œ]ÃBˆØÚY[Q]™[ÛÛ\ÜÙ\”™]šY]Õ\]JÃBˆ™]™X[ˆÚ[™Ù\Ô˜[™ÙKBˆ˜]šYØ]Nˆ]™[\™Ù]OOH]™[]R[œ]BˆJNÃBŸJNÃB™]™[[^R[œ]Ë˜Y]™[\İ[™\Š˜Ú[™ÙH‹

HOˆÃBˆÙ][^S[ÙJ]™[[^R[œ]˜ÚXÚÙY
NÃBˆ™\]Y\İ[š[X][Û‘œ˜[YJÜÚ][Û‘]™[[Ù[
NÃBŸJNÃB™]™[]R[œ]Ë˜Y]™[\İ[™\Š˜Ú[™ÙH‹

HOˆÃBˆŞ[˜Ñ]™[ÛÛ\ÜÙ\‘]SX™[Ê
NÃBˆYˆ
Y]™[[^R[œ]Ë˜ÚXÚÙYY]™[[™]R[œ]
H™]\›ÃBˆYˆ
Y]™[[™]R[œ]˜[YH]™[[™]R[œ]˜[YH]™[]R[œ]˜[YJHÃBˆ]™[[™]R[œ]˜[YHH]™[]R[œ]˜[YNÃBˆŞ[˜Ñ]™[ÛÛ\ÜÙ\‘]SX™[Ê
NÃBˆCBŸJNÃB™]™[[™]R[œ]Ë˜Y]™[\İ[™\Š˜Ú[™ÙH‹Ş[˜Ñ]™[ÛÛ\ÜÙ\‘]SX™[ÊNÃB˜Ø[˜Ù[]™[]Û‹˜Y]™[\İ[™\Š˜ÛXÚÈ‹][\ÛÜÙQ]™[[Ù[
NÃB˜Ø[˜Ù[]™[ÙXÛÛ™\K˜Y]™[\İ[™\Š˜ÛXÚÈ‹][\ÛÜÙQ]™[[Ù[
NÃB˜Ø[˜Ù[\ØØ\™]™[˜Y]ÛË˜Y]™[\İ[™\Š˜ÛXÚÈ‹

HOˆÃBˆÛÜÙQ\ØØ\™]™[˜YX[ÙÊ
NÃBŸJNÃB˜ÛÛ™š\›Q\ØØ\™]™[˜Y]ÛË˜Y]™[\İ[™\Š˜ÛXÚÈ‹

HOˆÃBˆÛÜÙQ\ØØ\™]™[˜YX[ÙÊÈ™\İÜ™Q›Øİ\Îˆ˜[ÙK\ØØ\™˜YˆYHJNÃBŸJNÃB˜Ü™X]T›ÛÛS[Ù[›Ü›OË˜Y]™[\İ[™\ŠœİX›Z]‹Ü™X]T›ÛÛQœ›ÛTİÚ]Ú\ŠNÃB˜Ø[˜Ù[Ü™X]T›ÛÛS[Ù[]ÛË˜Y]™[\İ[™\Š˜ÛXÚÈ‹ÛÜÙPÜ™X]T›ÛÛS[Ù[
NÃB˜Ø[˜Ù[Ü™X]T›ÛÛS[Ù[ÙXÛÛ™\OË˜Y]™[\İ[™\Š˜ÛXÚÈ‹ÛÜÙPÜ™X]T›ÛÛS[Ù[
NÂ™[]Q]™[]Û‹˜Y]™[\İ[™\Š˜ÛXÚÈ‹Ü[‘[]Q]™[ÛÛ™š\›QX[ÙÊNÂ™[]Q]™[ÛÛ™š\›QX[ÙÏË˜Y]™[\İ[™\Š˜ÛXÚÈ‹
]™[
HOˆÂˆYˆ
]™[\™Ù]˜ÛÜÙ\İ
ˆØØ[˜Ù[[]Q]™[]ÛˆŠJHÂˆ]™[œ™]™[Y˜][

NÂˆ]™[œİÜ›ÜYØ][ÛŠ
NÂˆÛÜÙQ[]Q]™[ÛÛ™š\›QX[ÙÊ
NÂˆ™]\›ÂˆBˆYˆ
]™[\™Ù]˜ÛÜÙ\İ
ˆØÛÛ™š\›Q[]Q]™[]ÛˆŠJHÂˆ]™[œ™]™[Y˜][

NÂˆ]™[œİÜ›ÜYØ][ÛŠ
NÂˆ›ÚY[]Q]™[

NÂˆBŸJNÂ™[[ÚšTXÚÙ\ÛÜÙP]ÛË˜Y]™[\İ[™\Š˜ÛXÚÈ‹

HOˆÂˆÛÜÙQ[[ÚšTXÚÙ\ŠÈ™\İÜ™Q›Øİ\ÎˆYHJNÂŸJNÂˆİÛ›ØYXÜĞ]Û‹˜Y]™[\İ[™\Š˜ÛXÚÈ‹İÛ›ØYXÜÊNÂˆÛÛ[Y[›Ü›K˜Y]™[\İ[™\ŠœİX›Z]‹YÛÛ[Y[
NÃB™›Üˆ
ÛÛœİ]ÛˆÙˆØİ[Y[œ]Y\TÙ[XİÜ[
‹›İKX]ÛˆŠJHÃBˆ]Û‹˜Y]™[\İ[™\Š˜ÛXÚÈ‹

HOˆ™\ÜÛ™Ñ]™[
]Û‹™]\Ù]œ™\ÜÛœÙJJNÃBŸCBƒBÚ[™İË˜Y]™[\İ[™\ŠœÜİ]H‹\Ş[˜È

HOˆÃBˆÚ[™İË˜ÛX\’[\˜[
™Yœ™\Ú[Y\ŠNÃBˆ]ØZ]›Ûİ

NÃBŸJNÃBƒBÚ[™İË˜Y]™[\İ[™\Š›Y\ÜØYÙH‹[™QÛÛÙÛP]]Ü\Y\ÜØYÙJNÃBƒB™Øİ[Y[˜Y]™[\İ[™\Š˜ÛXÚÈ‹
]™[
HOˆÂˆYˆ
ˆY]™[]ÛË™Ù]]šX]J˜\šXKY^[™YŠHOOHYH‚ˆ	‰ˆ\ÚYX˜\Ü™X]SY[OË˜ÛÛZ[œÊ]™[\™Ù]
Bˆ
HÂˆÙ]ÚYX˜\Ü™X]SY[SÜ[Š˜[ÙJNÂˆB‚ˆYˆ
ˆØ[[™\•][]Sİ™\™›İĞ]ÛË™Ù]]šX]J˜\šXKY^[™YŠHOOHYH‚ˆ	‰ˆXØ[[™\•][]Sİ™\™›İĞ]Û‹˜ÛÛZ[œÊ]™[\™Ù]
Bˆ	‰ˆXØ[[™\•][]Sİ™\™›İÓY[OË˜ÛÛZ[œÊ]™[\™Ù]
Bˆ
HÂˆÙ]Ø[[™\•][]SY[SÜ[Š˜[ÙJNÂˆB‚ˆYˆ
ÜİÜİ™\ˆ	‰ˆZÜİÜİ™\‹˜Û\ÜÓ\İ˜ÛÛZ[œÊšY[ˆŠJHÂˆYˆ
ˆZÜİÜİ™\‹˜ÛÛZ[œÊ]™[\™Ù]
H	‰‚ˆ\Ù][™ÜĞ]Û‹˜ÛÛZ[œÊ]™[\™Ù]
H	‰‚ˆXØ[[™\‘ÛÛÙÛP]ÛË˜ÛÛZ[œÊ]™[\™Ù]
H	‰‚ˆXØ[[™\•][]Sİ™\™›İÓY[OË˜ÛÛZ[œÊ]™[\™Ù]
H	‰‚ˆY[[ÚšTXÚÙ\”Üİ™\Ë˜ÛÛZ[œÊ]™[\™Ù]
Bˆ
HÂˆÙ]Ù][™ÜÔ[™[Ü[Š˜[ÙKÈ™\İÜ™Q›Øİ\Îˆ˜[ÙHJNÂˆCBˆCBƒBˆYˆ
Y]™[\™Ù]˜ÛÜÙ\İ
‹˜\ŞK\İXÚÈŠJHÃBˆÛÜÙQ^[™Y\ŞTİXÚÜÊ
NÃBˆCBƒBˆ›Üˆ
ÛÛœİY[HÙˆØİ[Y[œ]Y\TÙ[XİÜ[
‹˜ÛÛÜ‹\XÚÙ\‹[Y[VÛÜ[—HŠJHÃBˆYˆ
Y[K˜ÛÛZ[œÊ]™[\™Ù]
JHÛÛ[YNÃBˆY[K›Ü[ˆH˜[ÙNÃBˆCBƒBˆYˆ
]Z[[™[	‰ˆY]Z[[™[˜Û\ÜÓ\İ˜ÛÛZ[œÊšY[ˆŠJHÃBˆYˆ
ˆ]Z[[™[˜ÛÛZ[œÊ]™[\™Ù]
Hˆ[]Q]™[ÛÛ™š\›QX[ÙÏË›Ü[ˆˆ[]Q]™[ÛÛ™š\›QX[ÙÏË˜ÛÛZ[œÊ]™[\™Ù]
HˆÚ[™İË˜ÛÛ[[Û‘Ü›İ[™]TXÚÙ\Ë˜ÛÛZ[œÕ\™Ù]
]™[\™Ù]
Hˆ]™[\™Ù]˜ÛÜÙ\İ
‹™]™[XØ\™˜\ŞKXØ\™˜\ŞK\İXÚË˜\ŞKXÚ\™]™[XÚ\™œ™YKX›ØÚË™œ™YKYÛİËX›ØÚÈŠBˆ
HÃBˆ™]\›ÃBˆCBˆÛX\‘]Z[[™[

NÃBˆCBŸJNÃBƒB™Øİ[Y[˜Y]™[\İ[™\Š™[ØÜ™Y[˜Ú[™ÙH‹

HOˆÃBˆØİ[Y[™Øİ[Y[[[Y[˜Û\ÜÓ\İÙÙÛJ™[ØÜ™Y[‹[[ÙH‹›ÛÛX[ŠØİ[Y[™[ØÜ™Y[‘[[Y[
JNÃBˆ\]Q[ØÜ™Y[ÛÛ›Û

NÃBˆ™\^S[İ[ÛÛ\ÜÊØ[[™\‘ÜšYš\Ë]šY]ËY[\š[™ÈŠNÃBŸJNÃBƒB™[˜X›QX[ÙĞ˜XÚÙ›ÜÛÜÙJ]™[[Ù[][\ÛÜÙQ]™[[Ù[
NÂ™[˜X›QX[ÙĞ˜XÚÙ›ÜÛÜÙJ\ØØ\™]™[˜YX[ÙËÛÜÙQ\ØØ\™]™[˜YX[ÙÊNÂ™[˜X›QX[ÙĞ˜XÚÙ›ÜÛÜÙJ[]Q]™[ÛÛ™š\›QX[ÙËÛÜÙQ[]Q]™[ÛÛ™š\›QX[ÙÊNÂ™[˜X›QX[ÙĞ˜XÚÙ›ÜÛÜÙJÜ™X]T›ÛÛS[Ù[ÛÜÙPÜ™X]T›ÛÛS[Ù[
NÂƒB˜Ü™X]T›ÛÛS[Ù[Ë˜Y]™[\İ[™\Š˜ÛÜÙH‹

HOˆÃBˆYˆ
[[ÚšTXÚÙ\”İ]KšYÙÙ\Ë˜ÛÜÙ\İ
ˆØÜ™X]T›ÛÛS[Ù[ŠJHÃBˆÛÜÙQ[[ÚšTXÚÙ\ŠÈ™\İÜ™Q›Øİ\Îˆ˜[ÙK[[YYX]NˆYHJNÃBˆCBŸJNÃBƒB™]™[[Ù[˜Y]™[\İ[™\Š˜Ø[˜Ù[‹
]™[
HOˆÃBˆ]™[œ™]™[Y˜][

NÃBˆYˆ
Xİ]™Q]™[[YTXÚÙ\ŠHÃBˆÛÜÙQ]™[[YTXÚÙ\ŠÈ™\İÜ™Q›Øİ\ÎˆYHJNÃBˆ™]\›ÃBˆCBˆ][\ÛÜÙQ]™[[Ù[

NÃBŸJNÃBƒB™\ØØ\™]™[˜YX[ÙÏË˜Y]™[\İ[™\Š˜Ø[˜Ù[‹
]™[
HOˆÂˆ]™[œ™]™[Y˜][

NÂˆÛÜÙQ\ØØ\™]™[˜YX[ÙÊ
NÂŸJNÂ‚™[]Q]™[ÛÛ™š\›QX[ÙÏË˜Y]™[\İ[™\Š˜Ø[˜Ù[‹
]™[
HOˆÂˆ]™[œ™]™[Y˜][

NÂˆÛÜÙQ[]Q]™[ÛÛ™š\›QX[ÙÊ
NÂŸJNÂ‚™[]Q]™[ÛÛ™š\›QX[ÙÏË˜Y]™[\İ[™\Š˜ÛÜÙH‹

HOˆÂˆYˆ
Y[]Q]™[™]\›‘›Øİ\ÊH™]\›ÂˆÛÛœİ›Øİ\Õ\™Ù]H[]Q]™[™]\›‘›Øİ\ÏËš\ĞÛÛ›™XİYÈ[]Q]™[™]\›‘›Øİ\Èˆ[]Q]™[]ÛÂˆ[]Q]™[™]\›‘›Øİ\ÈH[Âˆ›Øİ\Õ\™Ù]Ë™›Øİ\ÊÈ™]™[ØÜ›ÛˆYHJNÂŸJNÂ‚\]Q[ØÜ™Y[ÛÛ›Û

NÂœÙ]Ù][™ÜÔ[™[Ü[Š˜[ÙKÈ™\İÜ™Q›Øİ\Îˆ˜[ÙHJNÂ™Øİ[Y[˜Y]™[\İ[™\ŠœÚ[\™İÛˆ‹[™Sİ]ÚYQ›Ø][™Ôİ\™˜XÙTÚ[\‹YJNÃB™Øİ[Y[˜Y]™[\İ[™\Š˜ÛXÚÈ‹[™Sİ]ÚYQ›Ø][™Ôİ\™˜XÙPÛXÚËYJNÃBš[š]X[^™Q[[ÚšTXÚÙ\œÊ
NÃB›ÚYØœÙ\™UÙX]\“ØØ][Û”\›Z\ÜÚ[ÛŠ
NÃB˜›Ûİ

NÃB