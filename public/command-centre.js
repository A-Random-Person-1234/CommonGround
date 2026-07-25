const commandCentreButton = document.querySelector("#commandCentreButton");
const commandCentreDialog = document.querySelector("#commandCentreDialog");
const commandCentreForm = document.querySelector("#commandCentreForm");
const commandCentreInput = document.querySelector("#commandCentreInput");
const commandCentreCompletion = document.querySelector("#commandCentreCompletion");
const commandCentreCompletionPrefix = document.querySelector("#commandCentreCompletionPrefix");
const commandCentreCompletionSuffix = document.querySelector("#commandCentreCompletionSuffix");
const commandCentreCloseButton = document.querySelector("#commandCentreCloseButton");
const commandCentreBody = document.querySelector("#commandCentreBody");
const commandCentreStatus = document.querySelector("#commandCentreStatus");
const commandCentreShortcutHint = document.querySelector("#commandCentreShortcutHint");

const commandCentrePhases = new Set([
  "closed",
  "idle",
  "parsing",
  "needs_clarification",
  "preview",
  "searching_availability",
  "results",
  "confirming",
  "saving",
  "success",
  "error"
]);

const commandCentreState = {
  phase: "closed",
  parseResult: null,
  availability: null,
  selectedIndex: 0,
  opener: null,
  debounceTimer: null,
  controller: null,
  generation: 0,
  roomCode: null,
  moveCandidate: null,
  highlight: null,
  conflictDraft: null,
  prediction: null,
  composing: false,
  announcedPrediction: null,
  createSuggestionCursor: 0,
  createTitleSuggestion: ""
};

const commandEventIdeaLabels = Object.freeze([
  "Lunch",
  "Coffee",
  "Catch-up",
  "Planning"
]);

let commandCentrePredictor = null;
import("/command-centre-predictor.js?v=20260725-predictive-commands")
  .then((module) => {
    commandCentrePredictor = module;
    if (commandCentreDialog?.open) commandCentreHandleInput();
  })
  .catch(() => {
    commandCentrePredictor = null;
  });

function commandCentreTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function commandEscape(value) {
  return escapeHtml(String(value ?? ""));
}

function commandAttribute(value) {
  return escapeAttribute(String(value ?? ""));
}

function commandCentreSetPhase(phase, announcement = "") {
  const nextPhase = commandCentrePhases.has(phase) ? phase : "error";
  commandCentreState.phase = nextPhase;
  commandCentreDialog.dataset.state = nextPhase;
  commandCentreForm.toggleAttribute("aria-busy", ["parsing", "searching_availability", "saving"].includes(nextPhase));
  if (announcement) commandCentreStatus.textContent = announcement;
}

function commandCentreSetBody(markup) {
  window.closeLocationAutocompletes?.({ immediate: true, resetSession: true });
  commandCentreBody.innerHTML = markup;
}

function commandCentreIntroMarkup() {
  return `
    <div class="command-centre-intro">
      <p>Tell CommonGround what you want to do.</p>
      <div class="command-example-list" aria-label="Example commands">
        <button type="button" data-command-example="Find an hour for everyone next week">Find a time for everyone</button>
        <button type="button" data-command-example="Create an event tomorrow at 1">Create an event</button>
        <button type="button" data-command-example="Open August">Navigate the calendar</button>
      </div>
    </div>
  `;
}

function commandCentreRenderIntro() {
  commandCentreSetPhase("idle", "Command Centre ready.");
  commandCentreSetBody(commandCentreIntroMarkup());
}

function commandCentreRenderLoading(label) {
  commandCentreSetBody(`
    <div class="command-loading-row">
      <span class="command-loading-spinner" aria-hidden="true"></span>
      <span>${commandEscape(label)}</span>
    </div>
  `);
}

function commandCentreRenderMessage(title, message, {
  phase = "error",
  actions = ""
} = {}) {
  commandCentreSetPhase(phase, message);
  commandCentreSetBody(`
    <div class="command-state-card">
      <h3>${commandEscape(title)}</h3>
      <p>${commandEscape(message)}</p>
      ${actions ? `<div class="command-actions">${actions}</div>` : ""}
    </div>
  `);
}

function commandCentreAbortRequest() {
  commandCentreState.controller?.abort();
  commandCentreState.controller = null;
}

function commandCentreClearDebounce() {
  if (commandCentreState.debounceTimer) {
    window.clearTimeout(commandCentreState.debounceTimer);
    commandCentreState.debounceTimer = null;
  }
}

function commandCentreClearPrediction() {
  commandCentreState.prediction = null;
  commandCentreState.announcedPrediction = null;
  commandCentreCompletionPrefix.textContent = "";
  commandCentreCompletionSuffix.textContent = "";
  commandCentreCompletion.classList.remove("is-visible");
  commandCentreCompletion.style.removeProperty("--completion-scroll-x");
}

function commandCentreSyncCompletionScroll() {
  const offset = Math.max(0, Number(commandCentreInput.scrollLeft) || 0);
  commandCentreCompletion.style.setProperty("--completion-scroll-x", `${-offset}px`);
}

function commandCentreUpdatePrediction() {
  if (
    commandCentreState.composing ||
    !commandCentrePredictor ||
    commandCentreInput.selectionStart !== commandCentreInput.value.length ||
    commandCentreInput.selectionEnd !== commandCentreInput.value.length
  ) {
    commandCentreClearPrediction();
    return null;
  }

  const prediction = commandCentrePredictor.predictCommand(commandCentreInput.value);
  commandCentreState.prediction = prediction;
  commandCentreCompletionPrefix.textContent = prediction?.inlineSuffix ? commandCentreInput.value : "";
  commandCentreCompletionSuffix.textContent = prediction?.inlineSuffix || "";
  commandCentreCompletion.classList.toggle("is-visible", Boolean(prediction?.inlineSuffix));
  commandCentreSyncCompletionScroll();
  return prediction;
}

function commandCentreRenderPrediction(prediction) {
  commandCentreState.selectedIndex = 0;
  const detail = prediction.corrected
    ? `Correct to “${prediction.acceptedCommand}”`
    : prediction.kind === "prefix"
      ? `Complete “${prediction.acceptedCommand}”`
      : "Predicted action";
  const announcementKey = `${prediction.label}:${prediction.acceptedCommand}`;
  commandCentreSetPhase("results");
  if (commandCentreState.announcedPrediction !== announcementKey) {
    commandCentreState.announcedPrediction = announcementKey;
    const completionHint = prediction.inlineSuffix || prediction.corrected
      ? "Press Tab to complete or Enter to run it."
      : "Press Enter to run it.";
    commandCentreStatus.textContent = `Suggestion: ${prediction.label}. ${completionHint}`;
  }
  commandCentreSetBody(`
    <div class="command-results-heading">
      <h3>Suggested command</h3>
      <span>Nothing runs until you confirm</span>
    </div>
    <div class="command-event-candidate-list" role="listbox" aria-label="Predicted command">
      <button class="command-option is-selected" type="button" role="option" aria-selected="true" data-command-option data-command-prediction-command="${commandAttribute(prediction.acceptedCommand)}">
        <span class="command-candidate-copy">
          <strong>${commandEscape(prediction.label)}</strong>
          <span>${commandEscape(detail)}</span>
        </span>
        <span>Run</span>
      </button>
    </div>
  `);
}

function commandCentreAcceptPrediction({ submit = false } = {}) {
  const prediction = commandCentreState.prediction;
  if (!prediction?.acceptedCommand) return false;
  commandCentreInput.value = prediction.acceptedCommand;
  commandCentreInput.setSelectionRange(
    prediction.acceptedCommand.length,
    prediction.acceptedCommand.length
  );
  commandCentreClearPrediction();
  if (submit) requestCommandParse({ submitted: true });
  else commandCentreHandleInput();
  return true;
}

function commandCentreHandleInput() {
  if (commandCentreState.composing) return;
  commandCentreClearDebounce();
  commandCentreAbortRequest();
  commandCentreState.generation += 1;
  commandCentreScheduleParse();
}

function commandCentreHasOtherModal() {
  return Boolean(document.querySelector("dialog[open]:not(#commandCentreDialog)"));
}

function openCommandCentre(opener = commandCentreButton) {
  if (!currentRoom?.code || roomPage.classList.contains("hidden")) return;
  if (commandCentreHasOtherModal()) {
    calendarStatus.textContent = "Close the current dialog before opening Ask CommonGround.";
    return;
  }
  commandCentreState.opener = opener instanceof HTMLElement ? opener : commandCentreButton;
  commandCentreState.roomCode = currentRoom.code;
  commandCentreState.parseResult = null;
  commandCentreState.availability = null;
  commandCentreState.moveCandidate = null;
  commandCentreState.conflictDraft = null;
  commandCentreState.createTitleSuggestion = "";
  commandCentreState.selectedIndex = 0;
  commandCentreState.composing = false;
  commandCentreState.announcedPrediction = null;
  commandCentreInput.value = "";
  commandCentreClearPrediction();
  commandCentreRenderIntro();
  prepareDialogForOpen(commandCentreDialog);
  commandCentreDialog.showModal();
  commandCentreButton?.setAttribute("aria-expanded", "true");
  window.requestAnimationFrame(() => commandCentreInput.focus({ preventScroll: true }));
}

function closeCommandCentre({ restoreFocus = true, immediate = false } = {}) {
  commandCentreClearDebounce();
  commandCentreAbortRequest();
  commandCentreClearPrediction();
  window.closeLocationAutocompletes?.({ immediate: true, resetSession: true });
  commandCentreState.generation += 1;
  const restoreTarget = commandCentreState.opener;
  const finish = () => {
    commandCentreSetPhase("closed");
    commandCentreButton?.setAttribute("aria-expanded", "false");
    if (restoreFocus && restoreTarget?.isConnected) restoreTarget.focus({ preventScroll: true });
  };
  if (immediate && commandCentreDialog.open) {
    prepareDialogForOpen(commandCentreDialog);
    commandCentreDialog.close();
    finish();
    return;
  }
  closeDialogWithMotion(commandCentreDialog, finish);
}

function commandCentreScheduleParse() {
  commandCentreClearDebounce();
  if (commandCentreState.composing) return;
  const command = commandCentreInput.value.trim();
  const prediction = commandCentreUpdatePrediction();
  if (prediction) commandCentreRenderPrediction(prediction);
  if (command.length < 3) {
    commandCentreAbortRequest();
    if (!prediction) commandCentreRenderIntro();
    return;
  }
  if (prediction && (prediction.kind === "prefix" || !prediction.parseTyped)) {
    commandCentreAbortRequest();
    return;
  }
  commandCentreState.debounceTimer = window.setTimeout(() => {
    commandCentreState.debounceTimer = null;
    requestCommandParse({ submitted: false });
  }, 420);
}

function commandParticipantName(participantId) {
  return currentRoom?.participants?.find((participant) => participant.id === participantId)?.displayName || "Room member";
}

function commandParticipantNames(participantIds = [], { includeCurrent = true } = {}) {
  return participantIds
    .filter((participantId) => includeCurrent || participantId !== currentParticipant?.id)
    .map(commandParticipantName);
}

function commandEventSuggestionName(participant, members) {
  const displayName = String(participant?.displayName || "").trim();
  const firstName = displayName.split(/\s+/)[0] || "Member";
  const duplicateFirstName = members.some((member) => (
    member.id !== participant?.id &&
    String(member.displayName || "").trim().split(/\s+/)[0]?.toLocaleLowerCase("en-GB") ===
      firstName.toLocaleLowerCase("en-GB")
  ));
  return duplicateFirstName ? displayName : firstName;
}

function commandEventTitleSuggestion(participantIds = []) {
  const members = (currentRoom?.participants || []).filter((participant) => (
    participant?.id && String(participant.displayName || "").trim()
  ));
  if (members.length <= 1) return "";

  const current = members.find((participant) => participant.id === currentParticipant?.id) || members[0];
  const otherMembers = members.filter((participant) => participant.id !== current.id);
  if (!otherMembers.length) return "";

  const requestedIds = new Set(participantIds || []);
  const requestedOthers = otherMembers.filter((participant) => requestedIds.has(participant.id));
  const candidates = requestedOthers.length ? requestedOthers : otherMembers;
  const cursor = commandCentreState.createSuggestionCursor;
  const other = candidates[cursor % candidates.length];
  const ideaIndex = Math.floor(cursor / candidates.length) % commandEventIdeaLabels.length;
  commandCentreState.createSuggestionCursor += 1;

  return `${commandEventSuggestionName(current, members)}/${commandEventSuggestionName(other, members)} ${commandEventIdeaLabels[ideaIndex]}`;
}

function commandPrepareEventTitleSuggestion(result) {
  const titleMissing = (
    result?.missingFields?.includes("title") ||
    !String(result?.title || "").trim()
  );
  commandCentreState.createTitleSuggestion = titleMissing
    ? commandEventTitleSuggestion(result?.participantIds || [])
    : "";
}

function commandParticipantEditorMarkup(selectedIds = []) {
  const selected = new Set([currentParticipant?.id, ...selectedIds].filter(Boolean));
  return `
    <div class="command-participant-editor">
      <span>Participants</span>
      <div class="command-participant-list">
        ${(currentRoom?.participants || []).map((participant) => {
          const isCurrent = participant.id === currentParticipant?.id;
          return `
            <label class="command-participant-chip" style="--participant-color:${commandAttribute(participant.color)}">
              <input type="checkbox" value="${commandAttribute(participant.id)}" data-command-participant ${selected.has(participant.id) ? "checked" : ""} ${isCurrent ? "disabled" : ""} />
              <span>${commandEscape(participant.displayName)}${isCurrent ? " (You)" : ""}</span>
            </label>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

function commandLocalDateValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function commandLocalTimeValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function commandInclusiveAllDayEndDateValue(start, end) {
  const startDateValue = commandLocalDateValue(start);
  if (!end) return startDateValue;
  const inclusiveEnd = new Date(end);
  if (Number.isNaN(inclusiveEnd.getTime())) return startDateValue;
  inclusiveEnd.setDate(inclusiveEnd.getDate() - 1);
  const endDateValue = commandLocalDateValue(inclusiveEnd);
  return endDateValue && endDateValue >= startDateValue ? endDateValue : startDateValue;
}

function commandHumanDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Choose a date";
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(date);
}

function commandHumanTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).format(date);
}

function commandHumanRange(start, end) {
  return `${commandHumanDate(start)} · ${commandHumanTime(start)}–${commandHumanTime(end)}`;
}

function commandMinuteLabel(minuteValue) {
  const minute = Math.max(0, Math.min(24 * 60, Number(minuteValue || 0)));
  if (minute === 24 * 60) return "24:00";
  return `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}

function commandAvailabilityScopeLabel(result) {
  const rangeLabels = {
    default_current_week: "Current week",
    current_week: "Current week",
    next_week: "Next week",
    current_month: "This month",
    next_month: "Next month",
    named_month: "Selected month",
    weekend: "Weekend"
  };
  const parts = [];
  const rangeLabel = rangeLabels[result.rangeKind];
  if (rangeLabel) {
    parts.push(rangeLabel);
  } else if (result.rangeStart && result.rangeEnd) {
    const finalMoment = new Date(new Date(result.rangeEnd).getTime() - 1);
    const startLabel = commandHumanDate(result.rangeStart);
    const endLabel = commandHumanDate(finalMoment);
    parts.push(startLabel === endLabel ? startLabel : `${startLabel} – ${endLabel}`);
  }
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (result.allowedWeekdays?.length) {
    parts.push(result.allowedWeekdays.map((weekday) => weekdayLabels[weekday]).filter(Boolean).join(" & "));
  }
  if (result.earliestMinute !== 8 * 60 || result.latestMinute !== 21 * 60) {
    parts.push(`${commandMinuteLabel(result.earliestMinute)}–${commandMinuteLabel(result.latestMinute)}`);
  }
  return parts.join(" · ");
}

function commandMissingQuestion(result) {
  const missing = result?.missingFields || [];
  if (result?.ambiguities?.length) return result.ambiguities[0].message;
  if (missing.includes("date")) return "What date should this event happen?";
  if (missing.includes("start_time")) return "What time should this event begin?";
  if (missing.includes("date_range")) return "What day or date range should CommonGround search?";
  if (missing.includes("participants")) return "Who should CommonGround include?";
  if (missing.includes("event")) return "Which event should CommonGround move?";
  if (missing.includes("target_date_or_time")) return "When should the event move to?";
  if (missing.includes("title")) return "What should this event be called?";
  if (missing.includes("room_code")) return "What six-character room code should CommonGround use?";
  if (missing.includes("view")) return "Which view should CommonGround open?";
  return "";
}

function commandRenderAmbiguity(result) {
  const ambiguity = result.ambiguities[0];
  const hasOptions = Boolean(ambiguity.options?.length);
  commandCentreSetPhase("needs_clarification", ambiguity.message);
  commandCentreSetBody(`
    <div class="command-state-card">
      <h3>${commandEscape(ambiguity.message)}</h3>
      <p>${hasOptions
        ? "CommonGround will not guess when two room members could match."
        : "Adjust the command and try again."}</p>
    </div>
    ${hasOptions ? `<div class="command-event-candidate-list" role="listbox" aria-label="Clarification choices">
      ${(ambiguity.options || []).map((option, index) => `
        <button class="command-option ${index === 0 ? "is-selected" : ""}" type="button" role="option" aria-selected="${index === 0}" data-command-option data-command-participant-option="${commandAttribute(option.id)}">
          <span>${commandEscape(option.label)}</span>
          <span>Select</span>
        </button>
      `).join("")}
    </div>` : ""}
  `);
  commandCentreState.selectedIndex = 0;
}

function commandRenderCreatePreview(result, {
  title = result.missingFields?.includes("title") ? "" : result.title,
  start = result.start,
  end = result.end,
  participantIds = result.participantIds,
  location = result.location || "",
  description = result.description || "",
  allDay = result.allDay === true
} = {}) {
  const question = commandMissingQuestion(result);
  const dateValue = commandLocalDateValue(start) || result.dateKey || "";
  const startValue = commandLocalTimeValue(start);
  const endValue = commandLocalTimeValue(end);
  const titleValue = String(title || "").trim();
  if (!titleValue && !commandCentreState.createTitleSuggestion) {
    commandCentreState.createTitleSuggestion = commandEventTitleSuggestion(participantIds || []);
  }
  const titlePlaceholder = commandCentreState.createTitleSuggestion || "Add title";
  const inclusiveEndDateValue = allDay
    ? commandInclusiveAllDayEndDateValue(start, end)
    : dateValue;
  commandCentreSetPhase(question ? "needs_clarification" : "preview", question || "Event preview ready.");
  commandCentreSetBody(`
    <div class="command-preview-card command-create-preview" aria-label="Event details">
      <h3>Event preview</h3>
      <div class="command-preview-grid">
        <label class="command-field command-field-wide">
          <span>Title</span>
          <input id="commandEventTitle" type="text" maxlength="120" value="${commandAttribute(titleValue)}" placeholder="${commandAttribute(titlePlaceholder)}" ${!titleValue ? 'aria-invalid="true"' : ""} />
        </label>
        <div class="command-schedule-row command-field-wide ${allDay ? "is-all-day" : ""}">
          <label class="command-field command-date-field">
            <span>Date</span>
            <input id="commandEventDate" type="date" value="${commandAttribute(dateValue)}" ${!dateValue ? 'aria-invalid="true"' : ""} />
          </label>
          <span class="command-schedule-separator" data-command-all-day-separator aria-hidden="true" ${allDay ? "" : "hidden"}>–</span>
          <label class="command-field" data-command-all-day-end-field ${allDay ? "" : "hidden"}>
            <span>End date</span>
            <input id="commandEventEndDate" type="date" min="${commandAttribute(dateValue)}" value="${commandAttribute(inclusiveEndDateValue)}" />
          </label>
          <label class="command-field" data-command-time-field ${allDay ? "hidden" : ""}>
            <span>Start</span>
            <input id="commandEventStart" type="time" step="900" value="${commandAttribute(startValue)}" ${!startValue && !allDay ? 'aria-invalid="true"' : ""} ${allDay ? "disabled" : ""} />
          </label>
          <span class="command-schedule-separator" data-command-time-separator aria-hidden="true" ${allDay ? "hidden" : ""}>–</span>
          <label class="command-field" data-command-time-field ${allDay ? "hidden" : ""}>
            <span>End</span>
            <input id="commandEventEnd" type="time" step="900" value="${commandAttribute(endValue)}" ${!endValue && !allDay ? 'aria-invalid="true"' : ""} ${allDay ? "disabled" : ""} />
          </label>
        </div>
        <label class="command-all-day command-field-wide">
          <input id="commandEventAllDay" type="checkbox" ${allDay ? "checked" : ""} />
          <span>
            <strong>All day</strong>
          </span>
        </label>
        <div class="command-field command-field-wide location-autocomplete-host">
          <label for="commandEventLocation">Location</label>
          <input
            id="commandEventLocation"
            type="text"
            maxlength="200"
            value="${commandAttribute(location)}"
            placeholder="Optional"
            autocomplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-expanded="false"
            aria-controls="commandEventLocationListbox"
            aria-describedby="commandEventLocationStatus"
          />
          <div class="location-autocomplete-menu" id="commandEventLocationMenu" hidden>
            <div class="location-autocomplete-list" id="commandEventLocationListbox" role="listbox" aria-label="Address suggestions"></div>
            <div class="location-autocomplete-attribution" translate="no">Google Maps</div>
          </div>
          <span class="sr-only" id="commandEventLocationStatus" role="status" aria-live="polite"></span>
        </div>
        <label class="command-field command-field-wide">
          <span>Description</span>
          <textarea id="commandEventDescription" maxlength="4000" placeholder="Optional">${commandEscape(description)}</textarea>
        </label>
      </div>
      ${commandParticipantEditorMarkup(participantIds)}
      <div class="command-actions">
        <button class="command-secondary-action" type="button" data-command-cancel>Cancel</button>
        <button class="command-primary-action" type="button" data-command-confirm-create>Create event</button>
      </div>
    </div>
  `);
  window.initializeLocationAutocomplete?.(commandCentreBody.querySelector("#commandEventLocation"));
}

function commandCreateSummary(result) {
  if (result.start && result.end) return commandHumanRange(result.start, result.end);
  if (result.dateKey) return commandHumanDate(`${result.dateKey}T12:00`);
  return "Choose the date and time in the event composer.";
}

function commandRenderCreateLauncher(result) {
  commandCentreSetPhase("preview", "Event composer ready.");
  commandCentreSetBody(`
    <div class="command-state-card">
      <h3>Create event</h3>
      <p>${commandEscape(commandCreateSummary(result))}</p>
      <div class="command-actions">
        <button class="command-secondary-action" type="button" data-command-cancel>Cancel</button>
        <button class="command-primary-action" type="button" data-command-open-create>Open event composer</button>
      </div>
    </div>
  `);
}

async function commandOpenCreateComposer(result = commandCentreState.parseResult) {
  if (!result) return;
  const title = result.missingFields?.includes("title") ? "" : String(result.title || "").trim();
  closeCommandCentre({ restoreFocus: false, immediate: true });
  const opened = await window.openCalendarEventComposerAt?.({
    title,
    start: result.start,
    end: result.end,
    date: result.dateKey,
    startMinute: result.startMinute,
    durationMinutes: result.durationMinutes,
    allDay: result.allDay === true,
    location: result.location || "",
    description: result.description || "",
    inviteeParticipantIds: result.participantIds || []
  });
  if (!opened) {
    calendarStatus.textContent = "The event composer could not be opened. Close any other popup and try again.";
  }
}

function commandRenderAvailabilityClarification(result) {
  const question = commandMissingQuestion(result);
  const startDate = commandLocalDateValue(result.rangeStart);
  const endDate = result.rangeEnd
    ? commandLocalDateValue(new Date(new Date(result.rangeEnd).getTime() - 1))
    : startDate;
  commandCentreSetPhase("needs_clarification", question);
  commandCentreSetBody(`
    <div class="command-clarification">${commandEscape(question)}</div>
    <div class="command-preview-card">
      <h3>Availability search</h3>
      <div class="command-preview-grid">
        <label class="command-field">
          <span>From</span>
          <input id="commandRangeStartDate" type="date" value="${commandAttribute(startDate)}" />
        </label>
        <label class="command-field">
          <span>To</span>
          <input id="commandRangeEndDate" type="date" value="${commandAttribute(endDate)}" />
        </label>
        <label class="command-field">
          <span>Duration</span>
          <input id="commandDuration" type="number" min="15" max="480" step="15" value="${commandAttribute(result.durationMinutes || 60)}" />
        </label>
      </div>
      ${commandParticipantEditorMarkup(result.participantIds)}
      <div class="command-actions">
        <button class="command-secondary-action" type="button" data-command-cancel>Cancel</button>
        <button class="command-primary-action" type="button" data-command-continue-availability>Find times</button>
      </div>
    </div>
  `);
}

function commandSelectedParticipantIds() {
  const ids = [...commandCentreBody.querySelectorAll("[data-command-participant]:checked")]
    .map((input) => input.value);
  if (currentParticipant?.id && !ids.includes(currentParticipant.id)) ids.unshift(currentParticipant.id);
  return ids;
}

function commandReadCreateDraft() {
  const title = commandCentreBody.querySelector("#commandEventTitle")?.value.trim();
  const date = commandCentreBody.querySelector("#commandEventDate")?.value;
  const inclusiveEndDate = commandCentreBody.querySelector("#commandEventEndDate")?.value || date;
  const startTime = commandCentreBody.querySelector("#commandEventStart")?.value;
  const endTime = commandCentreBody.querySelector("#commandEventEnd")?.value;
  const allDay = commandCentreBody.querySelector("#commandEventAllDay")?.checked === true;
  if (!title || !date) {
    throw new Error("Add a title and date.");
  }
  if (!allDay && (!startTime || !endTime)) {
    throw new Error("Add a title, date, start time and end time.");
  }
  if (allDay && inclusiveEndDate < date) {
    throw new Error("The all-day end date must be on or after its start date.");
  }
  const start = new Date(`${date}T${allDay ? "00:00" : startTime}`);
  const end = allDay
    ? new Date(`${inclusiveEndDate}T00:00`)
    : new Date(`${date}T${endTime}`);
  if (allDay) {
    end.setDate(end.getDate() + 1);
  } else if (!Number.isNaN(end.getTime()) && end <= start && endTime === "00:00") {
    end.setDate(end.getDate() + 1);
  }
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new Error("The end time must be after the start time.");
  }
  return {
    title,
    start: start.toISOString(),
    end: end.toISOString(),
    timezone: commandCentreTimezone(),
    allDay,
    location: commandCentreBody.querySelector("#commandEventLocation")?.value.trim() || "",
    description: commandCentreBody.querySelector("#commandEventDescription")?.value.trim() || "",
    inviteeParticipantIds: commandSelectedParticipantIds(),
    syncToGoogle: Boolean(calendarEventSyncEnabled())
  };
}

function commandSetPreviewError(message) {
  const existing = commandCentreBody.querySelector(".command-clarification");
  if (existing) {
    existing.textContent = message;
  } else {
    commandCentreBody.querySelector(".command-preview-card")?.insertAdjacentHTML(
      "beforebegin",
      `<div class="command-clarification">${commandEscape(message)}</div>`
    );
  }
  commandCentreSetPhase("error", message);
}

async function commandSuggestConflictTimes(payload, failure) {
  const start = new Date(payload.start);
  const rangeStart = new Date(start);
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + 7);
  const durationMinutes = Math.max(
    15,
    Math.round((new Date(payload.end).getTime() - start.getTime()) / 60000)
  );
  commandCentreState.conflictDraft = payload;
  commandCentreSetPhase("searching_availability", "That time is busy. Looking for alternatives.");
  commandCentreRenderLoading("That time is busy. Finding the next available options…");
  const result = await window.CommonGroundCommandActions.findOverlapAvailability(
    payload.inviteeParticipantIds,
    null,
    durationMinutes,
    {
      intent: "find_time",
      rangeStart: rangeStart.toISOString(),
      rangeEnd: rangeEnd.toISOString(),
      earliestMinute: 8 * 60,
      latestMinute: 21 * 60,
      timezone: payload.timezone
    }
  );
  if (!result.success) {
    commandCentreRenderMessage(
      "That time is busy",
      `${failure.message} ${result.message}`.trim(),
      {
        actions: '<button class="command-secondary-action" type="button" data-command-edit-conflict>Edit event</button>'
      }
    );
    return;
  }
  const availability = result.payload.availability;
  const parsedResult = {
    intent: "find_time",
    participantIds: result.payload.participantIds,
    durationMinutes,
    rangeStart: result.payload.rangeStart,
    rangeEnd: result.payload.rangeEnd,
    earliestMinute: 8 * 60,
    latestMinute: 21 * 60,
    timeOfDay: null,
    missingFields: [],
    ambiguities: []
  };
  commandCentreState.parseResult = parsedResult;
  commandCentreState.availability = availability;
  if (!availability.complete) {
    commandCentreRenderMessage(
      "That time is busy",
      "A connected calendar could not be refreshed, so CommonGround did not guess at an alternative.",
      {
        actions: '<button class="command-secondary-action" type="button" data-command-edit-conflict>Edit event</button>'
      }
    );
    return;
  }
  commandRenderAvailabilityResults(parsedResult, availability);
  commandCentreBody.insertAdjacentHTML(
    "afterbegin",
    `<div class="command-clarification">That time conflicts with an existing busy block. Choose a safe alternative or edit the event.</div>
     <div class="command-actions command-conflict-actions">
       <button class="command-secondary-action" type="button" data-command-edit-conflict>Edit event</button>
     </div>`
  );
}

async function commandConfirmCreate() {
  if (commandCentreState.phase === "saving" || !currentRoom?.code) return;
  let payload;
  try {
    payload = commandReadCreateDraft();
  } catch (error) {
    commandSetPreviewError(error.message);
    return;
  }
  const roomCodeSnapshot = currentRoom.code;
  commandCentreSetPhase("confirming", "Confirming event details.");
  commandCentreSetPhase("saving", "Creating event.");
  const action = commandCentreBody.querySelector("[data-command-confirm-create]");
  if (action) {
    action.disabled = true;
    action.textContent = "Creating…";
  }
  try {
    const outcome = await window.CommonGroundCommandActions.createCalendarEvent({
      ...payload,
      roomCode: roomCodeSnapshot,
      participants: payload.inviteeParticipantIds,
      startTime: payload.start,
      endTime: payload.end
    });
    if (currentRoom?.code !== roomCodeSnapshot) return;
    if (!outcome.success) {
      if (outcome.code === "availability_conflict") {
        await commandSuggestConflictTimes(payload, outcome);
        return;
      }
      commandSetPreviewError(outcome.message || "The event could not be created.");
      if (action) {
        action.disabled = false;
        action.textContent = "Create event";
      }
      return;
    }
    commandCentreState.conflictDraft = null;
    commandCentreRenderSuccess(outcome.payload.event, "Event created", { allowUndo: true });
  } catch (error) {
    commandSetPreviewError(error.message || "The event could not be created.");
    if (action) {
      action.disabled = false;
      action.textContent = "Create event";
    }
  }
}

function commandCentreRenderSuccess(event, title, { allowUndo = false } = {}) {
  commandCentreSetPhase("success", `${title}: ${event.title}`);
  commandCentreSetBody(`
    <div class="command-state-card">
      <div class="command-success-mark" aria-hidden="true">✓</div>
      <h3>${commandEscape(title)}</h3>
      <p>${commandEscape(event.title)} · ${commandEscape(commandHumanRange(event.start, event.end))}</p>
      <div class="command-actions">
        <button class="command-secondary-action" type="button" data-command-close>Done</button>
        ${allowUndo ? '<button class="command-secondary-action" type="button" data-command-undo-create>Undo</button>' : ""}
        <button class="command-primary-action" type="button" data-command-open-event="${commandAttribute(event.id)}">View event</button>
      </div>
    </div>
  `);
}

function commandAvailabilityRequestFromClarification(result) {
  const startDate = commandCentreBody.querySelector("#commandRangeStartDate")?.value;
  const endDate = commandCentreBody.querySelector("#commandRangeEndDate")?.value || startDate;
  const durationMinutes = Number(commandCentreBody.querySelector("#commandDuration")?.value || result.durationMinutes || 60);
  const participantIds = commandSelectedParticipantIds();
  if (!startDate || !endDate || endDate < startDate) throw new Error("Choose a valid date range.");
  if (!participantIds.length) throw new Error("Choose at least one room member.");
  const rangeStart = new Date(`${startDate}T00:00`);
  const rangeEnd = new Date(`${endDate}T00:00`);
  rangeEnd.setDate(rangeEnd.getDate() + 1);
  return {
    ...result,
    participantIds,
    rangeStart: rangeStart.toISOString(),
    rangeEnd: rangeEnd.toISOString(),
    durationMinutes,
    missingFields: []
  };
}

function commandRenderAvailabilityReady(result) {
  const people = commandParticipantNames(result.participantIds).join(", ");
  const scope = commandAvailabilityScopeLabel(result);
  commandCentreSetPhase("preview", "Availability request ready.");
  commandCentreSetBody(`
    <div class="command-preview-card">
      <h3>Search shared availability</h3>
      <p>${commandEscape(people || "Selected room members")} · ${commandEscape(result.durationMinutes)} minutes</p>
      ${scope ? `<p>${commandEscape(scope)}</p>` : ""}
      <div class="command-actions">
        <button class="command-secondary-action" type="button" data-command-cancel>Cancel</button>
        <button class="command-primary-action" type="button" data-command-search-availability>Find times</button>
      </div>
    </div>
  `);
}

async function commandLoadAvailability(result) {
  if (!currentRoom?.code) return;
  commandCentreAbortRequest();
  const controller = new AbortController();
  const generation = ++commandCentreState.generation;
  const roomCodeSnapshot = currentRoom.code;
  commandCentreState.controller = controller;
  commandCentreSetPhase("searching_availability", "Checking room availability.");
  commandCentreRenderLoading("Checking everyone’s availability…");
  try {
    const outcome = await window.CommonGroundCommandActions.findOverlapAvailability(
      result.participantIds,
      null,
      result.durationMinutes,
      {
        intent: result.intent,
        rangeStart: result.rangeStart,
        rangeEnd: result.rangeEnd,
        earliestMinute: result.earliestMinute,
        latestMinute: result.latestMinute,
        timeOfDay: result.timeOfDay,
        allowedWeekdays: result.allowedWeekdays,
        timezone: commandCentreTimezone(),
        signal: controller.signal
      }
    );
    if (controller.signal.aborted) return;
    if (!outcome.success) {
      commandCentreRenderMessage("Couldn’t check availability", outcome.message || "Try again shortly.", {
        actions: '<button class="command-secondary-action" type="button" data-command-search-availability>Try again</button>'
      });
      return;
    }
    if (
      generation !== commandCentreState.generation ||
      currentRoom?.code !== roomCodeSnapshot ||
      !commandCentreDialog.open
    ) {
      return;
    }
    result.participantIds = outcome.payload.participantIds;
    commandCentreState.parseResult = result;
    commandCentreState.availability = outcome.payload.availability;
    if (!outcome.payload.availability.complete) {
      commandCentreRenderMessage(
        "Availability unavailable",
        "A connected calendar could not be refreshed, so CommonGround will not guess that the time is free.",
        {
          actions: '<button class="command-secondary-action" type="button" data-command-search-availability>Try again</button>'
        }
      );
      return;
    }
    commandRenderAvailabilityResults(result, outcome.payload.availability);
  } catch (error) {
    if (error.name === "AbortError") return;
    commandCentreRenderMessage("Couldn’t check availability", error.message || "Try again shortly.", {
      actions: '<button class="command-secondary-action" type="button" data-command-search-availability>Try again</button>'
    });
  } finally {
    if (commandCentreState.controller === controller) commandCentreState.controller = null;
  }
}

function commandRenderNoSlots(result) {
  commandCentreSetPhase("results", "No matching time was found.");
  const reduceAction = result.durationMinutes > 30
    ? '<button class="command-secondary-action" type="button" data-command-refine="shorter">Try 30 minutes</button>'
    : "";
  commandCentreSetBody(`
    <div class="command-state-card">
      <h3>No shared time found</h3>
      <p>Try expanding the date range, reducing the duration, removing a participant, or including evenings.</p>
      <div class="command-actions">
        ${reduceAction}
        <button class="command-secondary-action" type="button" data-command-refine="evenings">Include evenings</button>
        <button class="command-primary-action" type="button" data-command-refine="expand">Expand one week</button>
      </div>
    </div>
  `);
}

function commandRenderAvailabilityResults(result, availability) {
  const slots = availability.slots || [];
  if (!slots.length) {
    commandRenderNoSlots(result);
    return;
  }
  commandCentreSetPhase("results", `Found ${slots.length} possible ${slots.length === 1 ? "time" : "times"}.`);
  const showMode = result.intent === "show_availability";
  commandCentreState.selectedIndex = 0;
  commandCentreSetBody(`
    <div class="command-results-heading">
      <h3>${showMode ? "Shared availability" : `Found ${slots.length} possible times`}</h3>
      <span>${commandEscape(result.durationMinutes)} minutes</span>
    </div>
    <div class="command-slot-list" role="listbox" aria-label="Available times">
      ${slots.map((slot, index) => `
        <button class="command-slot ${index === 0 ? "is-selected" : ""}" type="button" role="option" aria-selected="${index === 0}" data-command-option data-command-slot-index="${index}">
          <span class="command-slot-copy">
            <strong>${commandEscape(commandHumanDate(slot.start))}</strong>
            <span>${commandEscape(commandHumanTime(slot.start))}–${commandEscape(commandHumanTime(slot.end))} · Shared calendars show this time as free</span>
          </span>
          <span>${showMode ? "Show" : "Select"}</span>
        </button>
      `).join("")}
    </div>
    ${showMode ? `
      <div class="command-actions">
        <button class="command-primary-action" type="button" data-command-show-availability>Show all on calendar</button>
      </div>
    ` : ""}
  `);
}

function commandCreateDraftFromSlot(result, slot) {
  const conflictDraft = commandCentreState.conflictDraft;
  if (conflictDraft) {
    void commandOpenCreateComposer({
      ...result,
      intent: "create_event",
      title: conflictDraft.title,
      start: slot.start,
      end: slot.end,
      participantIds: conflictDraft.inviteeParticipantIds,
      location: conflictDraft.location,
      description: conflictDraft.description,
      allDay: conflictDraft.allDay === true,
      missingFields: [],
      ambiguities: []
    });
    return;
  }
  void commandOpenCreateComposer({
    ...result,
    intent: "create_event",
    title: "",
    start: slot.start,
    end: slot.end,
    missingFields: ["title"],
    ambiguities: []
  });
}

function commandMoveTargetForCandidate(result, candidate) {
  const originalStart = new Date(candidate.start);
  const originalEnd = new Date(candidate.end);
  const durationMinutes = result.durationMinutes || Math.max(
    15,
    Math.round((originalEnd.getTime() - originalStart.getTime()) / 60000)
  );
  const targetDate = result.targetDateKey || commandLocalDateValue(originalStart);
  const targetMinute = result.targetStartMinute ?? (originalStart.getHours() * 60 + originalStart.getMinutes());
  const targetStart = new Date(`${targetDate}T${String(Math.floor(targetMinute / 60)).padStart(2, "0")}:${String(targetMinute % 60).padStart(2, "0")}`);
  return {
    start: targetStart.toISOString(),
    end: new Date(targetStart.getTime() + durationMinutes * 60000).toISOString()
  };
}

function commandRenderEventCandidates(result) {
  const candidates = result.eventCandidates || [];
  commandCentreSetPhase("needs_clarification", `I found ${candidates.length} matching events.`);
  commandCentreState.selectedIndex = 0;
  commandCentreSetBody(`
    <div class="command-state-card">
      <h3>Which event should move?</h3>
      <p>Select the exact CommonGround event. External calendar titles remain private.</p>
    </div>
    <div class="command-event-candidate-list" role="listbox" aria-label="Matching events">
      ${candidates.map((candidate, index) => `
        <button class="command-event-candidate ${index === 0 ? "is-selected" : ""}" type="button" role="option" aria-selected="${index === 0}" data-command-option data-command-event-candidate="${commandAttribute(candidate.id)}">
          <span class="command-candidate-copy">
            <strong>${commandEscape(candidate.title)}</strong>
            <span>${commandEscape(commandHumanRange(candidate.start, candidate.end))}</span>
          </span>
          <span>Select</span>
        </button>
      `).join("")}
    </div>
  `);
}

function commandRenderMovePreview(result, candidate) {
  const target = result.targetStart && result.targetEnd
    ? { start: result.targetStart, end: result.targetEnd }
    : commandMoveTargetForCandidate(result, candidate);
  commandCentreState.moveCandidate = candidate;
  const question = commandMissingQuestion(result);
  commandCentreSetPhase(question ? "needs_clarification" : "preview", question || "Move preview ready.");
  commandCentreSetBody(`
    ${question ? `<div class="command-clarification">${commandEscape(question)}</div>` : ""}
    <div class="command-preview-card">
      <h3>${commandEscape(candidate.title)}</h3>
      <p>Review the new time before saving.</p>
      <div class="command-before-after">
        <div class="command-time-card">
          <span>Current</span>
          <strong>${commandEscape(commandHumanRange(candidate.start, candidate.end))}</strong>
        </div>
        <div class="command-time-card">
          <span>New</span>
          <strong id="commandMoveNewSummary">${commandEscape(commandHumanRange(target.start, target.end))}</strong>
        </div>
      </div>
      <div class="command-preview-grid">
        <label class="command-field">
          <span>Date</span>
          <input id="commandMoveDate" type="date" value="${commandAttribute(commandLocalDateValue(target.start))}" />
        </label>
        <label class="command-field">
          <span>Start</span>
          <input id="commandMoveStart" type="time" step="900" value="${commandAttribute(commandLocalTimeValue(target.start))}" />
        </label>
        <label class="command-field">
          <span>End</span>
          <input id="commandMoveEnd" type="time" step="900" value="${commandAttribute(commandLocalTimeValue(target.end))}" />
        </label>
      </div>
      <div class="command-actions">
        <button class="command-secondary-action" type="button" data-command-cancel>Cancel</button>
        <button class="command-primary-action" type="button" data-command-confirm-move>Move event</button>
      </div>
    </div>
  `);
}

function commandReadMoveDraft() {
  const candidate = commandCentreState.moveCandidate;
  const date = commandCentreBody.querySelector("#commandMoveDate")?.value;
  const startTime = commandCentreBody.querySelector("#commandMoveStart")?.value;
  const endTime = commandCentreBody.querySelector("#commandMoveEnd")?.value;
  if (!candidate || !date || !startTime || !endTime) throw new Error("Choose a new date, start time and end time.");
  const start = new Date(`${date}T${startTime}`);
  const end = new Date(`${date}T${endTime}`);
  if (!Number.isNaN(end.getTime()) && end <= start && endTime === "00:00") end.setDate(end.getDate() + 1);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw new Error("The new end time must be after the start time.");
  }
  return {
    eventId: candidate.id,
    expectedUpdatedAt: candidate.updatedAt,
    start: start.toISOString(),
    end: end.toISOString(),
    timezone: commandCentreTimezone()
  };
}

async function commandConfirmMove() {
  if (commandCentreState.phase === "saving" || !currentRoom?.code) return;
  let payload;
  try {
    payload = commandReadMoveDraft();
  } catch (error) {
    commandSetPreviewError(error.message);
    return;
  }
  const roomCodeSnapshot = currentRoom.code;
  commandCentreSetPhase("confirming", "Confirming the new event time.");
  commandCentreSetPhase("saving", "Moving event.");
  const action = commandCentreBody.querySelector("[data-command-confirm-move]");
  if (action) {
    action.disabled = true;
    action.textContent = "Moving…";
  }
  try {
    const data = await fetchJson(`/api/rooms/${roomCodeSnapshot}/command-centre/move-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (currentRoom?.code !== roomCodeSnapshot) return;
    currentRoom.events = currentRoom.events.map((event) => event.id === data.event.id ? data.event : event);
    render();
    fetchNotifications();
    commandCentreRenderSuccess(data.event, "Event moved");
  } catch (error) {
    commandSetPreviewError(error.message || "The event could not be moved.");
    if (action) {
      action.disabled = false;
      action.textContent = "Move event";
    }
  }
}

function commandRenderViewAction(result) {
  const view = result.targetView;
  if (!view) {
    commandCentreRenderMessage("Choose a view", "Try day, week, month, year, or settings.");
    return;
  }
  const label = view === "settings"
    ? "Open settings"
    : `Open ${view} view`;
  commandCentreSetPhase("preview", `${label} is ready.`);
  commandCentreSetBody(`
    <div class="command-state-card">
      <h3>${commandEscape(label)}</h3>
      <p>This changes only what you are viewing. No calendar data will be edited.</p>
      <div class="command-actions">
        <button class="command-secondary-action" type="button" data-command-cancel>Cancel</button>
        <button class="command-primary-action" type="button" data-command-open-view="${commandAttribute(view)}">${commandEscape(label)}</button>
      </div>
    </div>
  `);
}

function commandRenderGoogleAction() {
  const connected = currentUserConnected() && currentParticipantConnected() && calendarWriteReady();
  commandCentreSetPhase("preview", connected ? "Google Calendar is connected." : "Google connection ready.");
  commandCentreSetBody(`
    <div class="command-state-card">
      <h3>${connected ? "Google Calendar connected" : "Connect Google Calendar"}</h3>
      <p>${connected
        ? "Open settings to review event sync."
        : "Authorization opens in CommonGround’s secure, centered Google popup."}</p>
      <div class="command-actions">
        <button class="command-secondary-action" type="button" data-command-cancel>Cancel</button>
        <button class="command-primary-action" type="button" data-command-connect-google>${connected ? "Open sync settings" : "Connect Google"}</button>
      </div>
    </div>
  `);
}

function commandRenderRoomCodePreview(result) {
  const code = result.newRoomCode;
  const question = commandMissingQuestion(result);
  if (question || !code) {
    commandCentreRenderMessage("Room code needed", question || "Enter a valid six-character room code.");
    return;
  }
  commandCentreSetPhase("preview", `Room code change to ${code} ready.`);
  commandCentreSetBody(`
    <div class="command-preview-card">
      <h3>Change room code</h3>
      <p>This updates the room link for everyone. Existing events and integrations stay attached.</p>
      <div class="command-room-code-change" aria-label="Room code change">
        <strong>${commandEscape(currentRoom?.code || "")}</strong>
        <span aria-hidden="true">→</span>
        <strong>${commandEscape(code)}</strong>
      </div>
      <div class="command-actions">
        <button class="command-secondary-action" type="button" data-command-cancel>Cancel</button>
        <button class="command-primary-action" type="button" data-command-update-room-code="${commandAttribute(code)}">Change room code</button>
      </div>
    </div>
  `);
}

async function commandExecuteView(view) {
  closeCommandCentre({ restoreFocus: false, immediate: true });
  if (view === "settings") {
    await new Promise((resolve) => window.requestAnimationFrame(resolve));
  }
  const outcome = await window.CommonGroundCommandActions.navigateToView(view);
  if (!outcome.success) calendarStatus.textContent = outcome.message;
}

function commandExecuteGoogleConnect() {
  const outcome = window.CommonGroundCommandActions.connectGoogleCalendar();
  if (!outcome.success) {
    commandCentreRenderMessage("Google connection blocked", outcome.message, {
      actions: '<button class="command-primary-action" type="button" data-command-connect-google>Try again</button>'
    });
    return;
  }
  if (outcome.payload.connected) {
    closeCommandCentre({ restoreFocus: false, immediate: true });
    return;
  }
  commandCentreRenderMessage("Google authorization opened", outcome.message, {
    phase: "success",
    actions: '<button class="command-secondary-action" type="button" data-command-close>Done</button>'
  });
}

async function commandExecuteRoomCode(code) {
  if (commandCentreState.phase === "saving") return;
  commandCentreSetPhase("saving", "Updating room code.");
  commandCentreRenderLoading("Updating the room code…");
  const outcome = await window.CommonGroundCommandActions.updateCustomRoomCode(code);
  if (!outcome.success) {
    commandCentreRenderMessage("Room code not changed", outcome.message, {
      actions: '<button class="command-secondary-action" type="button" data-command-close>Done</button>'
    });
    return;
  }
  commandCentreState.roomCode = outcome.payload.newCode;
  commandCentreRenderMessage("Room code updated", outcome.message, {
    phase: "success",
    actions: '<button class="command-primary-action" type="button" data-command-close>Done</button>'
  });
}

function commandRenderNavigate(result) {
  const options = [];
  if (result.targetDate) {
    options.push({
      kind: "date",
      id: result.targetDate,
      label: result.targetView === "month" ? `Open ${commandHumanDate(`${result.targetDate}T12:00`)}` : `Go to ${commandHumanDate(`${result.targetDate}T12:00`)}`,
      meta: result.targetView === "month" ? "Month view" : "Week view"
    });
  }
  for (const participant of result.participantCandidates || []) {
    options.push({
      kind: "participant",
      id: participant.id,
      label: participant.displayName,
      meta: "Show room member"
    });
  }
  for (const event of result.eventCandidates || []) {
    options.push({
      kind: "event",
      id: event.id,
      label: event.title,
      meta: commandHumanRange(event.start, event.end)
    });
  }
  if (!options.length) {
    commandCentreRenderMessage("Nothing matched", "Try a month, date, room member, or CommonGround event title.");
    return;
  }
  commandCentreSetPhase("results", `${options.length} navigation ${options.length === 1 ? "result" : "results"}.`);
  commandCentreState.selectedIndex = 0;
  commandCentreSetBody(`
    <div class="command-results-heading">
      <h3>Open in CommonGround</h3>
      <span>No changes will be made</span>
    </div>
    <div class="command-event-candidate-list" role="listbox" aria-label="Navigation results">
      ${options.map((option, index) => `
        <button class="command-option ${index === 0 ? "is-selected" : ""}" type="button" role="option" aria-selected="${index === 0}" data-command-option data-command-navigate-kind="${commandAttribute(option.kind)}" data-command-navigate-id="${commandAttribute(option.id)}" data-command-navigate-view="${commandAttribute(result.targetView || "")}">
          <span class="command-candidate-copy">
            <strong>${commandEscape(option.label)}</strong>
            <span>${commandEscape(option.meta)}</span>
          </span>
          <span>Open</span>
        </button>
      `).join("")}
    </div>
  `);
}

async function commandExecuteNavigation(button) {
  const kind = button.dataset.commandNavigateKind;
  const id = button.dataset.commandNavigateId;
  const view = button.dataset.commandNavigateView;
  if (kind === "event") {
    await commandOpenRoomEvent(id);
    return;
  }
  closeCommandCentre({ restoreFocus: false });
  if (kind === "participant") {
    memberSearchInput.value = commandParticipantName(id);
    setParticipantsPanelExpanded(true);
    filterParticipantRows();
    window.requestAnimationFrame(() => {
      const memberCheckbox = Array.from(
        participantStrip.querySelectorAll(".member-calendar-checkbox[data-participant-id]")
      ).find((checkbox) => checkbox.dataset.participantId === id);
      memberCheckbox?.focus({ preventScroll: true });
    });
    return;
  }
  if (kind === "date") {
    if (view === "month") {
      const alreadyMonth = currentView === "month";
      currentFocusDate = new Date(`${id}T12:00`);
      syncMiniCalendarToFocus();
      const outcome = await window.CommonGroundCommandActions.navigateToView("month");
      if (outcome.success && alreadyMonth) await refreshCalendarAfterImmediateRender();
      if (!outcome.success) calendarStatus.textContent = outcome.message;
    } else {
      const outcome = await window.CommonGroundCommandActions.navigateToDate(id);
      if (!outcome.success) calendarStatus.textContent = outcome.message;
    }
  }
}

async function commandOpenRoomEvent(eventId) {
  const event = roomEventById(eventId);
  closeCommandCentre({ restoreFocus: false });
  if (!event) {
    calendarStatus.textContent = "That event is no longer available. Refresh and try again.";
    return;
  }
  await goToDateInWeek(new Date(event.start));
  openEventDetail(event.id);
}

function commandContinueParsedResult(result, { submitted = false } = {}) {
  commandCentreState.parseResult = result;
  if (result.ambiguities?.length) {
    commandRenderAmbiguity(result);
    return;
  }
  if (result.intent === "unsupported") {
    commandCentreRenderMessage("Calendar commands only", result.reason);
    return;
  }
  if (result.intent === "navigate_view") {
    if (submitted && result.targetView) {
      void commandExecuteView(result.targetView);
    } else {
      commandRenderViewAction(result);
    }
    return;
  }
  if (result.intent === "connect_google") {
    commandRenderGoogleAction();
    return;
  }
  if (result.intent === "update_room_code") {
    commandRenderRoomCodePreview(result);
    return;
  }
  if (result.intent === "create_event") {
    commandCentreState.conflictDraft = null;
    commandPrepareEventTitleSuggestion(result);
    if (submitted) {
      void commandOpenCreateComposer(result);
    } else {
      commandRenderCreateLauncher(result);
    }
    return;
  }
  if (result.intent === "find_time" || result.intent === "show_availability") {
    commandCentreState.conflictDraft = null;
    if (result.missingFields?.length) {
      commandRenderAvailabilityClarification(result);
      return;
    }
    if (submitted) commandLoadAvailability(result);
    else commandRenderAvailabilityReady(result);
    return;
  }
  if (result.intent === "move_event") {
    if (!result.eventCandidates?.length) {
      commandCentreRenderMessage("Event not found", "Try the event’s exact CommonGround title.");
      return;
    }
    if (result.eventCandidates.length > 1) {
      commandRenderEventCandidates(result);
      return;
    }
    commandRenderMovePreview(result, result.eventCandidates[0]);
    return;
  }
  commandRenderNavigate(result);
}

async function processUserIntent(inputText, { submitted = true } = {}) {
  const command = String(inputText || "").trim();
  if (command.length < 2 || !currentRoom?.code) {
    commandCentreRenderIntro();
    return {
      success: false,
      message: currentRoom?.code ? "Enter a calendar command." : "Open a room before using Command Centre."
    };
  }
  commandCentreClearDebounce();
  commandCentreAbortRequest();
  const controller = new AbortController();
  const generation = ++commandCentreState.generation;
  const roomCodeSnapshot = currentRoom.code;
  commandCentreState.controller = controller;
  commandCentreSetPhase("parsing", "Understanding command.");
  commandCentreRenderLoading("Understanding your command…");
  try {
    const data = await fetchJson(`/api/rooms/${roomCodeSnapshot}/command-centre/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        command,
        timezone: commandCentreTimezone()
      }),
      signal: controller.signal
    });
    if (
      generation !== commandCentreState.generation ||
      currentRoom?.code !== roomCodeSnapshot ||
      !commandCentreDialog.open
    ) {
      return {
        success: false,
        message: "The command result was ignored because the active room changed.",
        code: "stale_command"
      };
    }
    commandContinueParsedResult(data.result, { submitted });
    return {
      success: true,
      message: "Command understood.",
      payload: data.result
    };
  } catch (error) {
    if (error.name === "AbortError") {
      return {
        success: false,
        message: "Command cancelled.",
        code: "aborted"
      };
    }
    commandCentreRenderMessage("Command failed", error.message || "Try again.");
    return {
      success: false,
      message: error.message || "Try again.",
      code: error.code || null
    };
  } finally {
    if (commandCentreState.controller === controller) commandCentreState.controller = null;
  }
}

async function requestCommandParse({ submitted = true } = {}) {
  return processUserIntent(commandCentreInput.value, { submitted });
}

window.processUserIntent = processUserIntent;
window.CommonGroundCommandRouter = Object.freeze({
  processUserIntent,
  ...window.CommonGroundCommandActions
});

function commandCentreSelectableOptions() {
  return [...commandCentreBody.querySelectorAll("[data-command-option]")];
}

function commandCentreSelectIndex(nextIndex) {
  const options = commandCentreSelectableOptions();
  if (!options.length) return;
  const normalized = ((nextIndex % options.length) + options.length) % options.length;
  commandCentreState.selectedIndex = normalized;
  options.forEach((option, index) => {
    const selected = index === normalized;
    option.classList.toggle("is-selected", selected);
    option.setAttribute("aria-selected", String(selected));
  });
  options[normalized].scrollIntoView({ block: "nearest" });
}

function commandCentreActivateSelected() {
  const options = commandCentreSelectableOptions();
  options[commandCentreState.selectedIndex]?.click();
}

function commandRefineAvailability(kind) {
  const result = { ...commandCentreState.parseResult };
  if (kind === "shorter") result.durationMinutes = 30;
  if (kind === "evenings") {
    result.timeOfDay = null;
    result.earliestMinute = 8 * 60;
    result.latestMinute = 21 * 60;
  }
  if (kind === "expand") {
    result.rangeEnd = new Date(new Date(result.rangeEnd).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  }
  commandCentreState.parseResult = result;
  commandLoadAvailability(result);
}

async function commandShowAvailabilityOnCalendar() {
  const availability = commandCentreState.availability;
  const result = commandCentreState.parseResult;
  if (!availability?.freeIntervals?.length) return;
  commandCentreState.highlight = {
    roomCode: currentRoom?.code,
    participantIds: [...result.participantIds],
    intervals: availability.freeIntervals.slice(0, 80),
    createdAt: Date.now()
  };
  const first = new Date(availability.freeIntervals[0].start);
  closeCommandCentre({ restoreFocus: false });
  await goToDateInWeek(first);
  calendarStatus.textContent = `Showing shared availability for ${commandParticipantNames(result.participantIds).join(", ")}.`;
}

window.commandCentreRenderAvailabilityHighlights = (eventsLayer, days) => {
  const highlight = commandCentreState.highlight;
  if (!highlight || highlight.roomCode !== currentRoom?.code || !eventsLayer) return;
  for (const [dayIndex, day] of days.entries()) {
    const dayStart = startOfDay(day.date);
    const dayEnd = addDays(dayStart, 1);
    for (const interval of highlight.intervals) {
      const rawStart = new Date(interval.start);
      const rawEnd = new Date(interval.end);
      if (rawStart >= dayEnd || rawEnd <= dayStart) continue;
      const start = rawStart > dayStart ? rawStart : dayStart;
      const end = rawEnd < dayEnd ? rawEnd : dayEnd;
      const startHour = start.getHours() + start.getMinutes() / 60;
      const endHour = end >= dayEnd ? 24 : end.getHours() + end.getMinutes() / 60;
      if (endHour <= startHour) continue;
      const block = document.createElement("div");
      block.className = "command-availability-block";
      block.style.setProperty("--day-index", String(dayIndex));
      block.style.setProperty("--start", String(startHour - calendarStartHour));
      block.style.setProperty("--duration", String(endHour - startHour));
      block.setAttribute("aria-hidden", "true");
      const title = document.createElement("strong");
      const time = document.createElement("span");
      title.textContent = "Shared free time";
      time.textContent = formatEventRange(startHour, endHour);
      block.append(title, time);
      eventsLayer.appendChild(block);
    }
  }
};

window.commandCentreReset = () => {
  commandCentreState.highlight = null;
  commandCentreState.parseResult = null;
  commandCentreState.availability = null;
  commandCentreState.moveCandidate = null;
  commandCentreState.conflictDraft = null;
  commandCentreState.composing = false;
  commandCentreState.announcedPrediction = null;
  commandCentreState.createTitleSuggestion = "";
  commandCentreClearDebounce();
  commandCentreAbortRequest();
  commandCentreClearPrediction();
  if (commandCentreDialog.open) closeCommandCentre({ restoreFocus: false, immediate: true });
};

commandCentreButton?.addEventListener("click", () => {
  if (commandCentreDialog.open) closeCommandCentre();
  else openCommandCentre(commandCentreButton);
});

commandCentreCloseButton?.addEventListener("click", () => closeCommandCentre());

commandCentreInput?.addEventListener("input", commandCentreHandleInput);
commandCentreInput?.addEventListener("compositionstart", () => {
  commandCentreState.composing = true;
  commandCentreClearDebounce();
  commandCentreAbortRequest();
  commandCentreClearPrediction();
  commandCentreRenderIntro();
});
commandCentreInput?.addEventListener("compositionend", () => {
  commandCentreState.composing = false;
  commandCentreHandleInput();
});
commandCentreInput?.addEventListener("scroll", commandCentreSyncCompletionScroll);
commandCentreInput?.addEventListener("click", commandCentreUpdatePrediction);
commandCentreInput?.addEventListener("keyup", (event) => {
  if (!["Tab", "ArrowRight"].includes(event.key)) commandCentreUpdatePrediction();
});

commandCentreForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (commandCentreState.composing) return;
  if (commandCentreState.phase === "results" && commandCentreSelectableOptions().length) {
    commandCentreActivateSelected();
    return;
  }
  requestCommandParse({ submitted: true });
});

commandCentreBody?.addEventListener("click", async (event) => {
  const predictionButton = event.target.closest("[data-command-prediction-command]");
  if (predictionButton) {
    commandCentreInput.value = predictionButton.dataset.commandPredictionCommand;
    commandCentreClearPrediction();
    await requestCommandParse({ submitted: true });
    return;
  }
  const example = event.target.closest("[data-command-example]");
  if (example) {
    commandCentreInput.value = example.dataset.commandExample;
    commandCentreClearPrediction();
    await requestCommandParse({ submitted: true });
    return;
  }
  if (event.target.closest("[data-command-cancel], [data-command-close]")) {
    closeCommandCentre();
    return;
  }
  if (event.target.closest("[data-command-edit-conflict]")) {
    const draft = commandCentreState.conflictDraft;
    if (draft) {
      commandRenderCreatePreview({
        ...commandCentreState.parseResult,
        intent: "create_event",
        title: draft.title,
        start: draft.start,
        end: draft.end,
        participantIds: draft.inviteeParticipantIds,
        location: draft.location,
        description: draft.description,
        allDay: draft.allDay === true,
        missingFields: [],
        ambiguities: []
      });
    }
    return;
  }
  const participantOption = event.target.closest("[data-command-participant-option]");
  if (participantOption) {
    const result = {
      ...commandCentreState.parseResult,
      participantIds: [
        ...(commandCentreState.parseResult.participantIds || []),
        participantOption.dataset.commandParticipantOption
      ],
      ambiguities: (commandCentreState.parseResult.ambiguities || []).slice(1)
    };
    commandContinueParsedResult(result, { submitted: true });
    return;
  }
  const slotButton = event.target.closest("[data-command-slot-index]");
  if (slotButton) {
    const slot = commandCentreState.availability?.slots?.[Number(slotButton.dataset.commandSlotIndex)];
    if (!slot) return;
    if (commandCentreState.parseResult.intent === "show_availability") {
      await commandShowAvailabilityOnCalendar();
    } else {
      commandCreateDraftFromSlot(commandCentreState.parseResult, slot);
    }
    return;
  }
  const candidateButton = event.target.closest("[data-command-event-candidate]");
  if (candidateButton) {
    const candidate = commandCentreState.parseResult.eventCandidates
      .find((entry) => entry.id === candidateButton.dataset.commandEventCandidate);
    if (candidate) commandRenderMovePreview(commandCentreState.parseResult, candidate);
    return;
  }
  const navigationButton = event.target.closest("[data-command-navigate-kind]");
  if (navigationButton) {
    await commandExecuteNavigation(navigationButton);
    return;
  }
  const viewButton = event.target.closest("[data-command-open-view]");
  if (viewButton) {
    await commandExecuteView(viewButton.dataset.commandOpenView);
    return;
  }
  if (event.target.closest("[data-command-connect-google]")) {
    commandExecuteGoogleConnect();
    return;
  }
  const roomCodeButton = event.target.closest("[data-command-update-room-code]");
  if (roomCodeButton) {
    await commandExecuteRoomCode(roomCodeButton.dataset.commandUpdateRoomCode);
    return;
  }
  if (event.target.closest("[data-command-confirm-create]")) {
    await commandConfirmCreate();
    return;
  }
  if (event.target.closest("[data-command-open-create]")) {
    await commandOpenCreateComposer();
    return;
  }
  if (event.target.closest("[data-command-confirm-move]")) {
    await commandConfirmMove();
    return;
  }
  if (event.target.closest("[data-command-search-availability]")) {
    await commandLoadAvailability(commandCentreState.parseResult);
    return;
  }
  if (event.target.closest("[data-command-continue-availability]")) {
    try {
      const result = commandAvailabilityRequestFromClarification(commandCentreState.parseResult);
      commandCentreState.parseResult = result;
      await commandLoadAvailability(result);
    } catch (error) {
      commandSetPreviewError(error.message);
    }
    return;
  }
  if (event.target.closest("[data-command-show-availability]")) {
    await commandShowAvailabilityOnCalendar();
    return;
  }
  if (event.target.closest("[data-command-undo-create]")) {
    await undoLastEventCreation();
    commandCentreState.conflictDraft = null;
    commandCentreRenderMessage("Event removed", "The event and its connected-calendar copy were removed.", {
      phase: "success",
      actions: '<button class="command-primary-action" type="button" data-command-close>Done</button>'
    });
    return;
  }
  const refineButton = event.target.closest("[data-command-refine]");
  if (refineButton) {
    commandRefineAvailability(refineButton.dataset.commandRefine);
    return;
  }
  const openEventButton = event.target.closest("[data-command-open-event]");
  if (openEventButton) {
    await commandOpenRoomEvent(openEventButton.dataset.commandOpenEvent);
  }
});

for (const eventName of ["input", "change"]) {
  commandCentreBody?.addEventListener(eventName, (event) => {
    if (event.target.matches("#commandEventAllDay, #commandEventDate")) {
      const allDayInput = commandCentreBody.querySelector("#commandEventAllDay");
      const checked = allDayInput?.checked === true;
      const date = commandCentreBody.querySelector("#commandEventDate");
      const endDate = commandCentreBody.querySelector("#commandEventEndDate");
      const start = commandCentreBody.querySelector("#commandEventStart");
      const end = commandCentreBody.querySelector("#commandEventEnd");
      const schedule = commandCentreBody.querySelector(".command-schedule-row");
      const allDayEndField = commandCentreBody.querySelector("[data-command-all-day-end-field]");
      const allDaySeparator = commandCentreBody.querySelector("[data-command-all-day-separator]");
      const timeSeparator = commandCentreBody.querySelector("[data-command-time-separator]");
      const timeFields = commandCentreBody.querySelectorAll("[data-command-time-field]");

      schedule?.classList.toggle("is-all-day", checked);
      allDayEndField?.toggleAttribute("hidden", !checked);
      allDaySeparator?.toggleAttribute("hidden", !checked);
      timeSeparator?.toggleAttribute("hidden", checked);
      timeFields.forEach((field) => field.toggleAttribute("hidden", checked));

      if (endDate && date) {
        endDate.min = date.value;
        if (!endDate.value || endDate.value < date.value) endDate.value = date.value;
      }
      if (!checked && start && end && (!start.value || start.value === "00:00") && (!end.value || end.value === "00:00")) {
        start.value = "09:00";
        end.value = "10:00";
      }
      if (start && end) {
        start.disabled = checked;
        end.disabled = checked;
        start.toggleAttribute("aria-invalid", !checked && !start.value);
        end.toggleAttribute("aria-invalid", !checked && !end.value);
      }
      return;
    }
    if (!event.target.matches("#commandMoveDate, #commandMoveStart, #commandMoveEnd")) return;
    try {
      const move = commandReadMoveDraft();
      const summary = commandCentreBody.querySelector("#commandMoveNewSummary");
      if (summary) summary.textContent = commandHumanRange(move.start, move.end);
    } catch {
      // The focused edit remains visible until all three fields form a valid range.
    }
  });
}

commandCentreDialog?.addEventListener("click", (event) => {
  if (event.target === commandCentreDialog) closeCommandCentre();
});

commandCentreDialog?.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeCommandCentre();
});

window.addEventListener("keydown", (event) => {
  if (event.isComposing || commandCentreState.composing || event.keyCode === 229) return;
  const commandShortcut = (event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === "k";
  const slashShortcut = event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey && !shouldIgnoreViewShortcut(event.target);
  if (commandShortcut || slashShortcut) {
    if (!currentRoom?.code || roomPage.classList.contains("hidden")) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (commandCentreDialog.open) closeCommandCentre();
    else openCommandCentre(event.target);
    return;
  }
  if (!commandCentreDialog.open) return;
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopImmediatePropagation();
    closeCommandCentre();
    return;
  }
  const completionKey = (
    event.target === commandCentreInput &&
    (event.key === "Tab" || event.key === "ArrowRight") &&
    (
      commandCentreState.prediction?.inlineSuffix ||
      commandCentreState.prediction?.corrected
    ) &&
    commandCentreInput.selectionStart === commandCentreInput.value.length &&
    commandCentreInput.selectionEnd === commandCentreInput.value.length
  );
  if (completionKey) {
    event.preventDefault();
    event.stopImmediatePropagation();
    commandCentreAcceptPrediction();
    return;
  }
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    const options = commandCentreSelectableOptions();
    if (!options.length) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    commandCentreSelectIndex(commandCentreState.selectedIndex + (event.key === "ArrowDown" ? 1 : -1));
    return;
  }
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    const action = commandCentreBody.querySelector(".command-primary-action:not(:disabled)");
    if (!action) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    action.click();
    return;
  }
  if (event.key === "Enter" && event.target === commandCentreInput && commandCentreSelectableOptions().length) {
    event.preventDefault();
    event.stopImmediatePropagation();
    commandCentreActivateSelected();
  }
}, true);

const commandUsesMacShortcut = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
if (commandCentreShortcutHint) commandCentreShortcutHint.textContent = commandUsesMacShortcut ? "⌘ K" : "Ctrl K";
