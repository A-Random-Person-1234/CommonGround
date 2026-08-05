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
const emojiPickerTriggers = Array.from(document.querySelectorAll(".emoji-trigger[data-emoji-target]"));

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
const pendingEventMoveKeys = new Set();
const weatherForecastFreshnessMs = 25 * 60 * 1000;
const weatherForecastRetryMs = 5 * 60 * 1000;
const weatherIconNames = new Set([
  "sun",
  "cloud-sun×N|óKh‘éì¶»§q«^t]
LJOË™›Øİ\ÊÈ™]™[ØÜ›ÛˆYHJNÂˆ™]\›ÂˆBˆÛÛœİ\™Xİ[ÛˆH]™[šÙ^HOOH\œ›İÑİÛˆˆÈHˆLNÂˆÛÛœİ™^[™^Hİ\œ™[[™^ˆÈ
\™Xİ[ÛˆˆÈˆ][\Ë›[™İHJBˆˆ
İ\œ™[[™^
È\™Xİ[Ûˆ
È][\Ë›[™İ
H	H][\Ë›[™İÂˆ][\ÖÛ™^[™^OË™›Øİ\ÊÈ™]™[ØÜ›ÛˆYHJNÂŸJNÂœÚYX˜\Ü™X]Q]™[]ÛË˜Y]™[\İ[™\Š˜ÛXÚÈ‹

HOˆÂˆÙ]ÚYX˜\Ü™X]SY[SÜ[Š˜[ÙJNÂˆ›ÚYÜ[Ø[[™\‘]™[ÛÛ\ÜÙ\]
È]Nˆ]RÙ^Jİ\œ™[›Øİ\Ñ]JHJNÂŸJNÂœÚYX˜\Ü™X]T›ÛÛP]ÛË˜Y]™[\İ[™\Š˜ÛXÚÈ‹

HOˆÂˆÙ]ÚYX˜\Ü™X]SY[SÜ[Š˜[ÙJNÂˆÜ[Ü™X]T›ÛÛS[Ù[

NÂŸJNÂœÚYX˜\’›Ú[”›ÛÛP]ÛË˜Y]™[\İ[™\Š˜ÛXÚÈ‹\Ş[˜È

HOˆÂˆÙ]ÚYX˜\Ü™X]SY[SÜ[Š˜[ÙJNÂˆ]ØZ]Ü[”›ÛÛQ[TYÙJ
NÂŸJNÂ˜ÛÜR[š]P]Û‹˜Y]™[\İ[™\Š˜ÛXÚÈ‹ÛÜT›ÛÛS[šÊNÂ˜ÛÜR[š]P]Û‘[\K˜Y]™[\İ[™\Š˜ÛXÚÈ‹\Ş[˜È

HOˆÂˆ]ØZ]ÛÜT›ÛÛS[šÊ
NÂˆ\ÛZ\ÜÒ[š]Tİš\

NÂŸJNÂ™\ÛZ\ÜÒ[š]P]ÛË˜Y]™[\İ[™\Š˜ÛXÚÈ‹\ÛZ\ÜÒ[š]Tİš\
NÂœ›ÛÛPÛÙOË˜Y]™[\İ[™\Š˜ÛXÚÈ‹ÛÜT›ÛÛPÛÙJNÂœ™]”\š[Ù]ÛË˜Y]™[\İ[™\Š˜ÛXÚÈ‹

HOˆÚYØ[[™\”\š[Ù
LJJNÂ›™^\š[Ù]ÛË˜Y]™[\İ[™\Š˜ÛXÚÈ‹

HOˆÚYØ[[™\”\š[Ù
JJNÂÙ^P]ÛË˜Y]™[\İ[™\Š˜ÛXÚÈ‹\Ş[˜È

HOˆÂˆİ\œ™[›Øİ\Ñ]HHİ\Ù‘^J™]È]J
JNÂˆŞ[˜ÓZ[šPØ[[™\•Ñ›Øİ\Ê
NÂˆ]ØZ]™Yœ™\ÚØ[[™\Y\’[[YYX]T™[™\Š
NÂŸJNÂ˜Ø[[™\”ÚYX˜\]ÛË˜Y]™[\İ[™\Š˜ÛXÚÈ‹

HOˆÂˆÙ]\XÚ\[Ô[™[^[™Y
\XÚ\[ÔÚYX˜\Ë™]\Ù]›Ü[ˆOOHYHŠNÂŸJNÂ›Y[X™\”ÙX\˜Ú[œ]Ë˜Y]™[\İ[™\Šš[œ]‹š[\”\XÚ\[›İÜÊNÂ›Y[X™\œÔÙXİ[Û•ÙÙÛOË˜Y]™[\İ[™\Š˜ÛXÚÈ‹

HOˆÂˆÛÛœİ^[™YHY[X™\œÔÙXİ[Û•ÙÙÛK™Ù]]šX]J˜\šXKY^[™YŠHOOH™˜[ÙHÂˆY[X™\œÔÙXİ[Û•ÙÙÛKœÙ]]šX]J˜\šXKY^[™Y‹İš[™ÊY^[™Y
JNÂˆY[X™\œÔÙXİ[Û•ÙÙÛK˜ÛÜÙ\İ
‹›Y[X™\œË\ÙXİ[ÛˆŠOË˜Û\ÜÓ\İÙÙÛJš\ËXÛÛ\ÙY‹^[™Y
NÂŸJNÂ›Z[šPØ[[™\”™]š[İ\ÏË˜Y]™[\İ[™\Š˜ÛXÚÈ‹

HOˆÂˆZ[šPØ[[™\İ\œÛÜˆHY[ÛÊZ[šPØ[[™\İ\œÛÜ‹LJNÂˆ™[™\“Z[šPØ[[™\Š
NÂŸJNÂ›Z[šPØ[[™\“™^Ë˜Y]™[\İ[™\Š˜ÛXÚÈ‹

HOˆÂˆZ[šPØ[[™\İ\œÛÜˆHY[ÛÊZ[šPØ[[™\İ\œÛÜ‹JNÂˆ™[™\“Z[šPØ[[™\Š
NÂŸJNÂ™\Ü^S˜[YR[œ]Ë˜Y]™[\İ[™\Šš[œ]‹ØÚY[Q\Ü^S˜[YTØ]™JNÂœ™[˜[YT›ÛÛR[œ]Ë˜Y]™[\İ[™\Šš[œ]‹ØÚY[T›ÛÛS˜[YTØ]™JNÂœ™[˜[YT›ÛÛQ[[ÚšR[œ]Ë˜Y]™[\İ[™\Š˜Ú[™ÙH‹Ø]™T›ÛÛQ[[ÚšJNÂœ™[˜[YT›ÛÛQ[[ÚšR[œ]Ë˜Y]™[\İ[™\ŠšÙ^YİÛˆ‹\Ş[˜È
]™[
HOˆÂˆYˆ
]™[šÙ^HOOH‘[\ˆŠH™]\›Âˆ]™[œ™]™[Y˜][

NÂˆ]ØZ]Ø]™T›ÛÛQ[[ÚšJ
NÂŸJNÂ˜İ\İÛT›ÛÛPÛÙR[œ]Ë˜Y]™[\İ[™\Šš[œ]‹

HOˆÂˆİ\İÛT›ÛÛPÛÙR[œ]˜[YHH›Ü›X[^™Pİ\İÛT›ÛÛPÛÙR[œ]
İ\İÛT›ÛÛPÛÙR[œ]˜[YJNÂŸJNÂ˜İ\İÛT›ÛÛPÛÙR[œ]Ë˜Y]™[\İ[™\ŠšÙ^YİÛˆ‹\Ş[˜È
]™[
HOˆÂˆYˆ
]™[šÙ^HOOH‘[\ˆŠH™]\›Âˆ]™[œ™]™[Y˜][

NÂˆ]ØZ]Ø]™T›ÛÛPÛÙJ
NÂŸJNÂ˜İ\İÛT›ÛÛPÛÙR[œ]Ë˜Y]™[\İ[™\Š˜›\ˆ‹\Ş[˜È

HOˆÂˆ]ØZ]Ø]™T›ÛÛPÛÙJ
NÂŸJNÂœ›ÛÛSØÚÕÙÙÛOË˜Y]™[\İ[™\Š˜Ú[™ÙH‹Ø]™T›ÛÛSØÚÔİ]JNÂ[YUÙÙÛOË˜Y]™[\İ[™\Š˜Ú[™ÙH‹

HOˆÂˆÛÛœİ[YHH[YUÙÙÛK˜ÚXÚÙYÈ™\šÈˆˆ›YÚÂˆØİ[Y[™Øİ[Y[[[Y[˜Û\ÜÓ\İ˜Y
š\Ë][YK\İÚ]Ú[™ÈŠNÂˆ\U[YJ[YKÈ\œÚ\İˆYHJNÂˆ›ÚYØ]™U[YT™Y™\™[˜ÙJ[YJNÂˆÚ[™İËœÙ][Y[İ]


HOˆÂˆØİ[Y[™Øİ[Y[[[Y[˜Û\ÜÓ\İœ™[[İ™Jš\Ë][YK\İÚ]Ú[™ÈŠNÂˆK[İ[Û‘[^J[İ[Û”İ[™\™\È
È
JNÂŸJNÂœÙ][™ÜĞ]Û‹˜Y]™[\İ[™\Š˜ÛXÚÈ‹

HOˆÂˆÛÛœİÚİ[Ü[ˆHÜİÜİ™\‹˜Û\ÜÓ\İ˜ÛÛZ[œÊšY[ˆŠHÜİÜİ™\‹˜Û\ÜÓ\İ˜ÛÛZ[œÊš\ËXÛÜÚ[™ÈŠNÂˆÙ][™[š\ÚXš[]JÜİÜİ™\‹Úİ[Ü[ŠNÂŸJNÂ˜Ø[[™\‘ÛÛÙÛP]ÛË˜Y]™[\İ[™\Š˜ÛXÚÈ‹

HOˆÂˆYˆ
Xİ\œ™[›ÛÛOË˜ÛÙJH™]\›Â‚ˆYˆ
Ø[[™\‘ÛÛÙÛP]Û‹™]\Ù]™ÛÛÙÛPXİ[ÛˆOOH˜ÛÜHˆ	‰ˆ\ÑÛÛÙÛPÛÛ›™XİY

JHÂˆ›ÚYÛÜT›ÛÛS[šÑœ›ÛUÜ˜\Š
NÂˆ™]\›ÂˆB‚ˆYˆ
Ø[[™\‘ÛÛÙÛP]Û‹™]\Ù]™ÛÛÙÛPXİ[ÛˆOOH˜]]Üš^™HŠH™]\›Â‚ˆÚ[™İË›ØØ][Û‹š™YˆHÛÛÙÛP]]\›
İ\œ™[›ÛÛK˜ÛÙKÈØ[[™\•Üš]NˆYHJNÂŸJNÂœ\XÚ\[ÔÚYX˜\Ë˜Y]™[\İ[™\ŠœÚ[\™İÛˆ‹
]™[
HOˆÂˆYˆ
]™[œÚ[\•\HOOH›[İ\ÙHŠH™]\›Âˆ\XÚ\[Ñ˜]Ù\‘Ù\İ\™HHÂˆÚ[\’Yˆ]™[œÚ[\’Yˆİ\ˆ]™[˜ÛY[ˆİ\Nˆ]™[˜ÛY[KˆNÂŸJNÂœ\XÚ\[ÔÚYX˜\Ë˜Y]™[\İ[™\ŠœÚ[\\‹
]™[
HOˆÂˆYˆ
\\XÚ\[Ñ˜]Ù\‘Ù\İ\™H\XÚ\[Ñ˜]Ù\‘Ù\İ\™KœÚ[\’YOOH]™[œÚ[\’Y
H™]\›ÂˆÛÛœİ[VH]™[˜ÛY[H\XÚ\[Ñ˜]Ù\‘Ù\İ\™Kœİ\ÂˆÛÛœİ[VHH]™[˜ÛY[HH\XÚ\[Ñ˜]Ù\‘Ù\İ\™Kœİ\NÂˆYˆ
X]˜XœÊ[V
HHÌˆ	‰ˆX]˜XœÊ[V
HˆX]˜XœÊ[VJH
ˆKŒŠHÂˆÙ]\XÚ\[Ô[™[^[™Y
[Vˆ
NÂˆBˆ\XÚ\[Ñ˜]Ù\‘Ù\İ\™HH[ÂŸJNÂœ\XÚ\[ÔÚYX˜\Ë˜Y]™[\İ[™\ŠœÚ[\˜Ø[˜Ù[‹
]™[
HOˆÂˆYˆ
\XÚ\[Ñ˜]Ù\‘Ù\İ\™OËœÚ[\’YOOH]™[œÚ[\’Y
HÂˆ\XÚ\[Ñ˜]Ù\‘Ù\İ\™HH[ÂˆBŸJNÂ™[ØÜ™Y[]Û‹˜Y]™[\İ[™\Š˜ÛXÚÈ‹\Ş[˜È

HOˆÂˆ]ØZ]ÙÙÛQ[ØÜ™Y[“[ÙJ
NÂŸJNÂšY]ÔİÚ]Ú\‹˜Y]™[\İ[™\Š˜ÛXÚÈ‹\Ş[˜È
]™[
HOˆÂˆÛÛœİ]ÛˆH]™[\™Ù]˜ÛÜÙ\İ
–Ù]K]šY]×HŠNÂˆYˆ
X]ÛŠH™]\›Âˆ]ØZ]Ù]İ\œ™[šY]Ê]Û‹™]\Ù]šY]ÊNÂŸJNÂ™Øİ[Y[˜Y]™[\İ[™\ŠšÙ^YİÛˆ‹
]™[
HOˆÂˆYˆ
]™[œ™\X]
]™[šÙ^HOOH‘[\ˆˆ	‰ˆ]™[šÙ^HOOHˆŠJH™]\›Âˆ™\ÜÒÙ^X›Ø\™[İ[ÛŠ]™[\™Ù]
NÂŸJNÂ™Øİ[Y[˜Y]™[\İ[™\ŠšÙ^]\‹
]™[
HOˆÂˆYˆ
]™[šÙ^HOOH‘[\ˆˆ	‰ˆ]™[šÙ^HOOHˆŠH™]\›Âˆ™[X\ÙRÙ^X›Ø\™[İ[ÛŠ]™[\™Ù]
NÂŸJNÂ™Øİ[Y[˜Y]™[\İ[™\Š™›Øİ\Ûİ]‹
]™[
HOˆÂˆ™[X\ÙRÙ^X›Ø\™[İ[ÛŠ]™[\™Ù]
NÂŸJNÂÚ[™İË˜Y]™[\İ[™\ŠšÙ^YİÛˆ‹\Ş[˜È
]™[
HOˆÂˆYˆ
]™[šÙ^HOOH‘\ØØ\HŠHÂˆÛÜÙQ^[™Y\ŞTİXÚÜÊ
NÂˆÙ]\XÚ\[Ô[™[^[™Y
˜[ÙJNÂˆBˆYˆ

]™[›Y]RÙ^H]™[˜İ›Ù^JH	‰ˆY]™[œÚYÙ^H	‰ˆ]™[šÙ^KÓİÙ\Ø\ÙJ
HOOHˆŠHÂˆYˆ
Úİ[YÛ›Ü™U[™ÔÚÜİ]
]™[\™Ù]
JH™]\›Âˆ]™[œ™]™[Y˜][

NÂˆ]ØZ][™Ó\İ]™[Ü™X][ÛŠ
NÂˆ™]\›ÂˆBˆYˆ
]™[›Y]RÙ^H]™[˜İ›Ù^H]™[˜[Ù^JH™]\›ÂˆYˆ
Úİ[YÛ›Ü™UšY]ÔÚÜİ]
]™[\™Ù]
JH™]\›ÂˆYˆ
]™[šÙ^HOOHˆ]™[šÙ^HOOHˆŠHÂˆ]™[œ™]™[Y˜][

NÂˆ]ØZ]ÚYØ[[™\”\š[Ù
]™[šÙ^HOOHˆÈLHˆJNÂˆ™]\›ÂˆBˆYˆ
]™[šÙ^KÓİÙ\Ø\ÙJ
HOOH™ˆŠHÂˆ]™[œ™]™[Y˜][

NÂˆ]ØZ]ÙÙÛQ[ØÜ™Y[“[ÙJ
NÂˆ™]\›ÂˆBˆÛÛœİ™^šY]ÈHšY]ÔÚÜİ]X\Ù]™[šÙ^KÓİÙ\Ø\ÙJ
WNÂˆYˆ
[™^šY]ÊH™]\›Âˆ]™[œ™]™[Y˜][

NÂˆ]ØZ]Ù]İ\œ™[šY]Ê™^šY]ÊNÂŸJNÂÚ[™İË˜Y]™[\İ[™\Šœ™\Ú^™H‹

HOˆÂˆÜÚ][Û‘]™[[Ù[

NÂˆYˆ
Xİ]™Q]™[[YTXÚÙ\ŠHÜÚ][Û‘]™[[YTXÚÙ\ŠXİ]™Q]™[[YTXÚÙ\ŠNÂŸJNÂ˜Ø[[™\‘ÜšY˜Y]™[\İ[™\ŠœÚ[\™İÛˆ‹İ\˜YĞÜ™X]KYJNÂ˜Ø[[™\‘ÜšY˜Y]™[\İ[™\Š˜ÛXÚÈ‹İ\™\ÜĞØ[[™\ÛXÚĞØ\\™KYJNÂœÙ]\XÚ\[Ô[™[^[™Y
]Ú[™İË›X]ÚYYXJŠX^]ÚYˆÍŒ
HŠK›X]Ú\ÊNÂ™[˜İ[Ûˆš[™›ÛÛS˜[YQY]ÜŠ\™Ù]
HÂˆYˆ
]\™Ù]
H™]\›Âˆ\™Ù]˜Y]™[\İ[™\Š™›ÛXÚÈ‹
]™[
HOˆÂˆ]™[œ™]™[Y˜][

NÂˆİ\[›[™T›ÛÛT™[˜[YJ\™Ù]
NÂˆJNÂˆ\™Ù]˜Y]™[\İ[™\ŠšÙ^YİÛˆ‹\Ş[˜È
]™[
HOˆÂˆYˆ
Z[›[™T›ÛÛT™[˜[YPXİ]™JHÂˆYˆ
İ\œ™[\ÒÜİ	‰ˆ
]™[šÙ^HOOH‘[\ˆˆ]™[šÙ^HOOH‘ŒˆŠJHÂˆ]™[œ™]™[Y˜][

NÂˆİ\[›[™T›ÛÛT™[˜[YJ\™Ù]
NÂˆBˆ™]\›ÂˆBˆYˆ
[›[™T›ÛÛT™[˜[YU\™Ù]OOH\™Ù]
H™]\›ÂˆYˆ
]™[šÙ^HOOH‘[\ˆŠHÂˆ]™[œ™]™[Y˜][

NÂˆ]ØZ]š[š\Ú[›[™T›ÛÛT™[˜[YJYJNÂˆH[ÙHYˆ
]™[šÙ^HOOH‘\ØØ\HŠHÂˆ]™[œ™]™[Y˜][

NÂˆ]ØZ]š[š\Ú[›[™T›ÛÛT™[˜[YJ˜[ÙJNÂˆBˆJNÂˆ\™Ù]˜Y]™[\İ[™\Š˜›\ˆ‹\Ş[˜È

HOˆÂˆYˆ
[›[™T›ÛÛT™[˜[YU\™Ù]OOH\™Ù]
HÂˆ]ØZ]š[š\Ú[›[™T›ÛÛT™[˜[YJYJNÂˆBˆJNÂŸB‚˜š[™›ÛÛS˜[YQY]ÜŠ›ÛÛS˜[YJNÂ˜š[™›ÛÛS˜[YQY]ÜŠÜ˜\”›ÛÛS˜[YJNÂ˜ÛÜÙQ]Z[]Û‹˜Y]™[\İ[™\Š˜ÛXÚÈ‹ÛX\‘]Z[[™[
NÂš[š]X[^™Q]™[[YTXÚÙ\œÊ
NÂš[š]X[^™SØØ][Û]]ØÛÛ\]J]™[ØØ][Û’[œ]
NÂš[š]X[^™SØØ][Û]]ØÛÛ\]J]Z[ØØ][Û’[œ]
NÂ™]™[›Ü›K˜Y]™[\İ[™\ŠœİX›Z]‹ÛÛ[Z]]™[[YTXÚÙ\œĞ™Y›Ü™TİX›Z]YJNÂ™]™[›Ü›K˜Y]™[\İ[™\ŠœİX›Z]‹Ø]™Q]™[
NÂ™]™[[™[›Ü›OË˜Y]™[\İ[™\ŠœİX›Z]‹ÛÛ[Z]]™[[YTXÚÙ\œĞ™Y›Ü™TİX›Z]YJNÂ™]™[[™[›Ü›OË˜Y]™[\İ[™\ŠœİX›Z]‹Ø]™Q]™[[™[Ú[™Ù\ÊNÂ™›Üˆ
ÛÛœİ[œ]ÙˆÂˆ]Z[]R[œ]ˆ]Z[]R[œ]ˆ]Z[İ\[œ]ˆ]Z[[™[œ]ˆ]Z[İ\[YR[œ]ˆ]Z[[™[YR[œ]ˆ]Z[ØØ][Û’[œ]ˆ]Z[\ØÜš\[Û’[œ]—JHÂˆ[œ]Ë˜Y]™[\İ[™\Šš[œ]‹

HOˆÂˆYˆ
]Z[[š]YQ™YY˜XÚÊHÂˆ]Z[[š]YQ™YY˜XÚË™]\Ù]œ\œÚ\İYY\ÜØYÙHHˆÂˆ]Z[[š]YQ™YY˜XÚË^ÛÛ[H]™[[™[\Õ[œØ]™YÚ[™Ù\Ê
HÈ•[œØ]™YÚ[™Ù\ÈˆˆˆÂˆBˆ\]Q]™[[™[Ø]™Tİ]J
NÂˆJNÂˆ[œ]Ë˜Y]™[\İ[™\Š˜Ú[™ÙH‹

HOˆÂˆYˆ
]Z[[š]YQ™YY˜XÚÊHÂˆ]Z[[š]YQ™YY˜XÚË™]\Ù]œ\œÚ\İYY\ÜØYÙHHˆÂˆ]Z[[š]YQ™YY˜XÚË^ÛÛ[H]™[[™[\Õ[œØ]™YÚ[™Ù\Ê
HÈ•[œØ]™YÚ[™Ù\ÈˆˆˆÂˆBˆ\]Q]™[[™[Ø]™Tİ]J
NÂˆJNÂŸB™]Z[ÛÛÙÛTŞ[˜Ò[œ]Ë˜Y]™[\İ[™\Š˜Ú[™ÙH‹

HOˆÂˆYˆ
]Z[[š]YQ™YY˜XÚÊHÂˆ]Z[[š]YQ™YY˜XÚË™]\Ù]œ\œÚ\İYY\ÜØYÙHHˆÂˆ]Z[[š]YQ™YY˜XÚË^ÛÛ[H]™[[™[\Õ[œØ]™YÚ[™Ù\Ê
HÈ•[œØ]™YÚ[™Ù\ÈˆˆˆÂˆBˆ\]Q]Z[ÛÛÙÛTŞ[˜ĞÛÛ›Û
]™[[™[›Ü›OË™]\Ù]˜Ø[“X[˜YÙHOOHYHŠNÂˆ\]Q]™[[™[Ø]™Tİ]J
NÂŸJNÂ™]™[ÛÛÙÛTŞ[˜Ò[œ]Ë˜Y]™[\İ[™\Š˜Ú[™ÙH‹\]Q]™[ÛÛÙÛTŞ[˜ĞÛÛ›Û
NÂ™]™[ÛÛÙÛTŞ[˜Ô›İÏË˜Y]™[\İ[™\Š˜ÛXÚÈ‹Xİ]˜]Q]™[ÛÛÙÛTŞ[˜Ô›İÊNÂ™]™[ÛÛÙÛTŞ[˜Ô›İÏË˜Y]™[\İ[™\ŠšÙ^YİÛˆ‹
]™[
HOˆÂˆYˆ
]™[šÙ^HOOH‘[\ˆˆ	‰ˆ]™[šÙ^HOOHˆŠH™]\›ÂˆXİ]˜]Q]™[ÛÛÙÛTŞ[˜Ô›İÊ]™[
NÂŸJNÂ™]™[[š]Q›ÜİÛË˜Y]™[\İ[™\ŠÙÙÛH‹

HOˆÂˆ™\]Y\İ[š[X][Û‘œ˜[YJÜÚ][Û‘]™[[Ù[
NÂŸJNÂ™]™[[š]Q›ÜİÛËœ]Y\TÙ[XİÜŠœİ[[X\HŠOË˜Y]™[\İ[™\Š˜ÛXÚÈ‹
]™[
HOˆÂˆYˆ
Y]™[[š]Q›ÜİÛ‹˜Û\ÜÓ\İ˜ÛÛZ[œÊš\ËY[\HŠJH™]\›Âˆ]™[œ™]™[Y˜][

NÂˆ]™[[š]Q›ÜİÛ‹›Ü[ˆH˜[ÙNÂŸJNÂ˜ÛÛœİ]™[ÛÛ\ÜÙ\”™]šY]Ò[œ]H
\™Ù]
HOˆ
ˆ\™Ù]OOH]™[]R[œ]ˆ\™Ù]OOH]™[]R[œ]ˆ\™Ù]OOH]™[[™]R[œ]ˆ\™Ù]OOH]™[İ\[œ]ˆ\™Ù]OOH]™[[™[œ]ˆ\™Ù]OOH]™[[^R[œ]ˆ›ÛÛX[Š\™Ù]Ë˜ÛÜÙ\İËŠˆÚ[š]YTXÚÙ\ˆ[œ]İ\OIØÚXÚØ›Ş	×HŠJBŠNÂ™]™[›Ü›K˜Y]™[\İ[™\Šš[œ]‹
]™[
HOˆÂˆYˆ
Y]™[ÛÛ\ÜÙ\”™]šY]Ò[œ]
]™[\™Ù]
JH™]\›ÂˆØÚY[Q]™[ÛÛ\ÜÙ\”™]šY]Õ\]J
NÂŸJNÂ™]™[›Ü›K˜Y]™[\İ[™\Š˜Ú[™ÙH‹
]™[
HOˆÂˆYˆ
Y]™[ÛÛ\ÜÙ\”™]šY]Ò[œ]
]™[\™Ù]
JH™]\›ÂˆÛÛœİÚ[™Ù\Ô˜[™ÙHH]™[\™Ù]OOH]™[]R[œ]ˆ]™[\™Ù]OOH]™[[™]R[œ]ˆ]™[\™Ù]OOH]™[İ\[œ]ˆ]™[\™Ù]OOH]™[[™[œ]ˆ]™[\™Ù]OOH]™[[^R[œ]ÂˆØÚY[Q]™[ÛÛ\ÜÙ\”™]šY]Õ\]JÂˆ™]™X[ˆÚ[™Ù\Ô˜[™ÙKˆ˜]šYØ]Nˆ]™[\™Ù]OOH]™[]R[œ]ˆJNÂŸJNÂ™]™[[^R[œ]Ë˜Y]™[\İ[™\Š˜Ú[™ÙH‹

HOˆÂˆÙ][^S[ÙJ]™[[^R[œ]˜ÚXÚÙY
NÂˆ™\]Y\İ[š[X][Û‘œ˜[YJÜÚ][Û‘]™[[Ù[
NÂŸJNÂ™]™[]R[œ]Ë˜Y]™[\İ[™\Š˜Ú[™ÙH‹

HOˆÂˆŞ[˜Ñ]™[ÛÛ\ÜÙ\‘]SX™[Ê
NÂˆYˆ
Y]™[[^R[œ]Ë˜ÚXÚÙYY]™[[™]R[œ]
H™]\›ÂˆYˆ
Y]™[[™]R[œ]˜[YH]™[[™]R[œ]˜[YH]™[]R[œ]˜[YJHÂˆ]™[[™]R[œ]˜[YHH]™[]R[œ]˜[YNÂˆŞ[˜Ñ]™[ÛÛ\ÜÙ\‘]SX™[Ê
NÂˆBŸJNÂ™]™[[™]R[œ]Ë˜Y]™[\İ[™\Š˜Ú[™ÙH‹Ş[˜Ñ]™[ÛÛ\ÜÙ\‘]SX™[ÊNÂ˜Ø[˜Ù[]™[]Û‹˜Y]™[\İ[™\Š˜ÛXÚÈ‹][\ÛÜÙQ]™[[Ù[
NÂ˜Ø[˜Ù[]™[ÙXÛÛ™\K˜Y]™[\İ[™\Š˜ÛXÚÈ‹][\ÛÜÙQ]™[[Ù[
NÂ˜Ø[˜Ù[\ØØ\™]™[˜Y]ÛË˜Y]™[\İ[™\Š˜ÛXÚÈ‹

HOˆÂˆÛÜÙQ\ØØ\™]™[˜YX[ÙÊ
NÂŸJNÂ˜ÛÛ™š\›Q\ØØ\™]™[˜Y]ÛË˜Y]™[\İ[™\Š˜ÛXÚÈ‹

HOˆÂˆÛÜÙQ\ØØ\™]™[˜YX[ÙÊÈ™\İÜ™Q›Øİ\Îˆ˜[ÙK\ØØ\™˜YˆYHJNÂŸJNÂ˜Ü™X]T›ÛÛS[Ù[›Ü›OË˜Y]™[\İ[™\ŠœİX›Z]‹Ü™X]T›ÛÛQœ›ÛTİÚ]Ú\ŠNÂ˜Ø[˜Ù[Ü™X]T›ÛÛS[Ù[]ÛË˜Y]™[\İ[™\Š˜ÛXÚÈ‹ÛÜÙPÜ™X]T›ÛÛS[Ù[
NÂ˜Ø[˜Ù[Ü™X]T›ÛÛS[Ù[ÙXÛÛ™\OË˜Y]™[\İ[™\Š˜ÛXÚÈ‹ÛÜÙPÜ™X]T›ÛÛS[Ù[
NÂˆ[]Q]™[]Û‹˜Y]™[\İ[™\Š˜ÛXÚÈ‹[]Q]™[
NÂˆİÛ›ØYXÜĞ]Û‹˜Y]™[\İ[™\Š˜ÛXÚÈ‹İÛ›ØYXÜÊNÂˆÛÛ[Y[›Ü›K˜Y]™[\İ[™\ŠœİX›Z]‹YÛÛ[Y[
NÂ™›Üˆ
ÛÛœİ]ÛˆÙˆØİ[Y[œ]Y\TÙ[XİÜ[
‹›İKX]ÛˆŠJHÂˆ]Û‹˜Y]™[\İ[™\Š˜ÛXÚÈ‹

HOˆ™\ÜÛ™Ñ]™[
]Û‹™]\Ù]œ™\ÜÛœÙJJNÂŸB‚Ú[™İË˜Y]™[\İ[™\ŠœÜİ]H‹\Ş[˜È

HOˆÂˆÚ[™İË˜ÛX\’[\˜[
™Yœ™\Ú[Y\ŠNÂˆ]ØZ]›Ûİ

NÂŸJNÂ‚Ú[™İË˜Y]™[\İ[™\Š›Y\ÜØYÙH‹[™QÛÛÙÛP]]Ü\Y\ÜØYÙJNÂ‚™Øİ[Y[˜Y]™[\İ[™\Š˜ÛXÚÈ‹
]™[
HOˆÂˆYˆ
ˆY]™[]ÛË™Ù]]šX]J˜\šXKY^[™YŠHOOHYH‚ˆ	‰ˆ\ÚYX˜\Ü™X]SY[OË˜ÛÛZ[œÊ]™[\™Ù]
Bˆ
HÂˆÙ]ÚYX˜\Ü™X]SY[SÜ[Š˜[ÙJNÂˆB‚ˆYˆ
ÜİÜİ™\ˆ	‰ˆZÜİÜİ™\‹˜Û\ÜÓ\İ˜ÛÛZ[œÊšY[ˆŠJHÂˆYˆ
ˆZÜİÜİ™\‹˜ÛÛZ[œÊ]™[\™Ù]
H	‰‚ˆ\Ù][™ÜĞ]Û‹˜ÛÛZ[œÊ]™[\™Ù]
H	‰‚ˆXØ[[™\‘ÛÛÙÛP]ÛË˜ÛÛZ[œÊ]™[\™Ù]
H	‰‚ˆY[[ÚšTXÚÙ\”Üİ™\Ë˜ÛÛZ[œÊ]™[\™Ù]
Bˆ
HÂˆÙ][™[š\ÚXš[]JÜİÜİ™\‹˜[ÙJNÂˆBˆB‚ˆYˆ
Y]™[\™Ù]˜ÛÜÙ\İ
‹˜\ŞK\İXÚÈŠJHÂˆÛÜÙQ^[™Y\ŞTİXÚÜÊ
NÂˆB‚ˆ›Üˆ
ÛÛœİY[HÙˆØİ[Y[œ]Y\TÙ[XİÜ[
‹˜ÛÛÜ‹\XÚÙ\‹[Y[VÛÜ[—HŠJHÂˆYˆ
Y[K˜ÛÛZ[œÊ]™[\™Ù]
JHÛÛ[YNÂˆY[K›Ü[ˆH˜[ÙNÂˆB‚ˆYˆ
]Z[[™[	‰ˆY]Z[[™[˜Û\ÜÓ\İ˜ÛÛZ[œÊšY[ˆŠJHÂˆYˆ
ˆ]Z[[™[˜ÛÛZ[œÊ]™[\™Ù]
HˆÚ[™İË˜ÛÛ[[Û‘Ü›İ[™]TXÚÙ\Ë˜ÛÛZ[œÕ\™Ù]
]™[\™Ù]
Hˆ]™[\™Ù]˜ÛÜÙ\İ
‹™]™[XØ\™˜\ŞKXØ\™˜\ŞK\İXÚË˜\ŞKXÚ\™]™[XÚ\™œ™YKX›ØÚË™œ™YKYÛİËX›ØÚÈŠBˆ
HÂˆ™]\›ÂˆBˆÛX\‘]Z[[™[

NÂˆBŸJNÂ‚™Øİ[Y[˜Y]™[\İ[™\Š™[ØÜ™Y[˜Ú[™ÙH‹

HOˆÂˆØİ[Y[™Øİ[Y[[[Y[˜Û\ÜÓ\İÙÙÛJ™[ØÜ™Y[‹[[ÙH‹›ÛÛX[ŠØİ[Y[™[ØÜ™Y[‘[[Y[
JNÂˆ\]Q[ØÜ™Y[ÛÛ›Û

NÂˆ™\^S[İ[ÛÛ\ÜÊØ[[™\‘ÜšYš\Ë]šY]ËY[\š[™ÈŠNÂŸJNÂ‚™[˜X›QX[ÙĞ˜XÚÙ›ÜÛÜÙJ]™[[Ù[][\ÛÜÙQ]™[[Ù[
NÂ™[˜X›QX[ÙĞ˜XÚÙ›ÜÛÜÙJ\ØØ\™]™[˜YX[ÙËÛÜÙQ\ØØ\™]™[˜YX[ÙÊNÂ™[˜X›QX[ÙĞ˜XÚÙ›ÜÛÜÙJÜ™X]T›ÛÛS[Ù[ÛÜÙPÜ™X]T›ÛÛS[Ù[
NÂ‚˜Ü™X]T›ÛÛS[Ù[Ë˜Y]™[\İ[™\Š˜ÛÜÙH‹

HOˆÂˆYˆ
[[ÚšTXÚÙ\”İ]KšYÙÙ\Ë˜ÛÜÙ\İ
ˆØÜ™X]T›ÛÛS[Ù[ŠJHÂˆÛÜÙQ[[ÚšTXÚÙ\ŠÈ™\İÜ™Q›Øİ\Îˆ˜[ÙK[[YYX]NˆYHJNÂˆBŸJNÂ‚™]™[[Ù[˜Y]™[\İ[™\Š˜Ø[˜Ù[‹
]™[
HOˆÂˆ]™[œ™]™[Y˜][

NÂˆYˆ
Xİ]™Q]™[[YTXÚÙ\ŠHÂˆÛÜÙQ]™[[YTXÚÙ\ŠÈ™\İÜ™Q›Øİ\ÎˆYHJNÂˆ™]\›ÂˆBˆ][\ÛÜÙQ]™[[Ù[

NÂŸJNÂ‚™\ØØ\™]™[˜YX[ÙÏË˜Y]™[\İ[™\Š˜Ø[˜Ù[‹
]™[
HOˆÂˆ]™[œ™]™[Y˜][

NÂˆÛÜÙQ\ØØ\™]™[˜YX[ÙÊ
NÂŸJNÂ‚\]Q[ØÜ™Y[ÛÛ›Û

NÂ™Øİ[Y[˜Y]™[\İ[™\ŠœÚ[\™İÛˆ‹[™Sİ]ÚYQ›Ø][™Ôİ\™˜XÙTÚ[\‹YJNÂ™Øİ[Y[˜Y]™[\İ[™\Š˜ÛXÚÈ‹[™Sİ]ÚYQ›Ø][™Ôİ\™˜XÙPÛXÚËYJNÂš[š]X[^™Q[[ÚšTXÚÙ\œÊ
NÂ›ÚYØœÙ\™UÙX]\“ØØ][Û”\›Z\ÜÚ[ÛŠ
NÂ˜›Ûİ

NÂ