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

function commandTimePickerMarkup({
  id,
  label,
  value = "",
  kind = "start",
  hidden = false,
  disabled = false,
  fieldAttributes = ""
}) {
  const displayId = `${id}Display`;
  const labelId = `${id}Label`;
  const listboxId = `${id}Listbox`;
  return `
    <div class="command-field command-time-picker-field time-picker-field" data-time-picker="${kind}" ${fieldAttributes} ${hidden ? "hidden" : ""}>
      <span id="${labelId}">${commandEscape(label)}</span>
      <input id="${id}" type="hidden" value="${commandAttribute(value)}" ${disabled ? "disabled" : ""} />
      <input
        class="time-picker-input"
        id="${displayId}"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        spellcheck="false"
        required
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded="false"
        aria-labelledby="${labelId}"
        aria-controls="${listboxId}"
        ${disabled ? "disabled" : ""}
      />
      <div class="time-picker-dropdown ${kind === "end" ? "time-picker-dropdown-end" : ""}" hidden>
        <div class="time-picker-list" id="${listboxId}" role="listbox" aria-label="${commandAttribute(label)} time options"></div>
      </div>
    </div>
  `;
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
  window.CommonGroundTimePicker?.close({ commit: false });
  commandCentreBody.innerHTML = markup;
  window.CommonGroundTimePicker?.initialize(commandCentreBody);
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
    parts.push(`${commandMinuteLabel(r…11723 tokens truncated…commandCentreState.conflictDraft = null;
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
        window.CommonGroundTimePicker?.setDisabled(schedule, checked);
        const startDisplay = commandCentreBody.querySelector("#commandEventStartDisplay");
        const endDisplay = commandCentreBody.querySelector("#commandEventEndDisplay");
        startDisplay?.toggleAttribute("aria-invalid", !checked && !start.value);
        endDisplay?.toggleAttribute("aria-invalid", !checked && !end.value);
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
