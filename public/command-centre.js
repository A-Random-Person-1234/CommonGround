const commandCentreButton = document.querySelector("#commandCentreButton");
const commandCentreDialog = document.querySelector("#commandCentreDialog");
const commandCentreForm = document.querySelector("#commandCentreForm");
const commandCentreInput = document.querySelector("#commandCentreInput");
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
  highlight: null
};

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
  commandCentreBody.innerHTML = markup;
}

function commandCentreIntroMarkup() {
  return `
    <div class="command-centre-intro">
      <p>Tell CommonGround what you want to do.</p>
      <div class="command-example-list" aria-label="Example commands">
        <button type="button" data-command-example="Find an hour for everyone next week">Find a time for everyone</button>
        <button type="button" data-command-example="Lunch with Sam tomorrow at 1">Create an event</button>
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
  commandCentreState.selectedIndex = 0;
  commandCentreInput.value = "";
  commandCentreRenderIntro();
  prepareDialogForOpen(commandCentreDialog);
  commandCentreDialog.showModal();
  commandCentreButton?.setAttribute("aria-expanded", "true");
  window.requestAnimationFrame(() => commandCentreInput.focus({ preventScroll: true }));
}

function closeCommandCentre({ restoreFocus = true, immediate = false } = {}) {
  commandCentreClearDebounce();
  commandCentreAbortRequest();
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
  const command = commandCentreInput.value.trim();
  if (command.length < 3) {
    commandCentreAbortRequest();
    commandCentreRenderIntro();
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
  return "";
}

function commandRenderAmbiguity(result) {
  const ambiguity = result.ambiguities[0];
  commandCentreSetPhase("needs_clarification", ambiguity.message);
  commandCentreSetBody(`
    <div class="command-state-card">
      <h3>${commandEscape(ambiguity.message)}</h3>
      <p>CommonGround will not guess when two room members could match.</p>
    </div>
    <div class="command-event-candidate-list" role="listbox" aria-label="Clarification choices">
      ${(ambiguity.options || []).map((option, index) => `
        <button class="command-option ${index === 0 ? "is-selected" : ""}" type="button" role="option" aria-selected="${index === 0}" data-command-option data-command-participant-option="${commandAttribute(option.id)}">
          <span>${commandEscape(option.label)}</span>
          <span>Select</span>
        </button>
      `).join("")}
    </div>
  `);
  commandCentreState.selectedIndex = 0;
}

function commandRenderCreatePreview(result, {
  title = result.title,
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
  commandCentreSetPhase(question ? "needs_clarification" : "preview", question || "Event preview ready.");
  commandCentreSetBody(`
    ${question ? `<div class="command-clarification">${commandEscape(question)}</div>` : ""}
    <div class="command-preview-card">
      <h3>Event preview</h3>
      <p>Review every detail before anything is created.</p>
      <div class="command-preview-grid">
        <label class="command-field command-field-wide">
          <span>Title</span>
          <input id="commandEventTitle" type="text" maxlength="120" value="${commandAttribute(title || "")}" ${!title ? 'aria-invalid="true"' : ""} />
        </label>
        <label class="command-field">
          <span>Date</span>
          <input id="commandEventDate" type="date" value="${commandAttribute(dateValue)}" ${!dateValue ? 'aria-invalid="true"' : ""} />
        </label>
        <label class="command-field">
          <span>Room</span>
          <input type="text" value="${commandAttribute(currentRoom?.name || currentRoom?.code || "")}" readonly />
        </label>
        <label class="command-field">
          <span>Start</span>
          <input id="commandEventStart" type="time" step="900" value="${commandAttribute(startValue)}" ${!startValue && !allDay ? 'aria-invalid="true"' : ""} ${allDay ? "disabled" : ""} />
        </label>
        <label class="command-field">
          <span>End</span>
          <input id="commandEventEnd" type="time" step="900" value="${commandAttribute(endValue)}" ${!endValue && !allDay ? 'aria-invalid="true"' : ""} ${allDay ? "disabled" : ""} />
        </label>
        <label class="command-all-day command-field-wide">
          <input id="commandEventAllDay" type="checkbox" ${allDay ? "checked" : ""} />
          <span>
            <strong>All day</strong>
            <small>Use the full calendar day without a start or end time.</small>
          </span>
        </label>
        <label class="command-field command-field-wide">
          <span>Location</span>
          <input id="commandEventLocation" type="text" maxlength="200" value="${commandAttribute(location)}" placeholder="Optional" />
        </label>
        <label class="command-field command-field-wide">
          <span>Description</span>
          <textarea id="commandEventDescription" maxlength="4000" placeholder="Optional">${commandEscape(description)}</textarea>
        </label>
      </div>
      ${commandParticipantEditorMarkup(participantIds)}
      <div class="command-actions">
        <button class="command-secondary-action" type="button" data-command-cancel>Cancel</button>
        <button class="command-secondary-action" type="button" data-command-edit-preview>Edit</button>
        <button class="command-primary-action" type="button" data-command-confirm-create>Create event</button>
      </div>
    </div>
  `);
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
  const startTime = commandCentreBody.querySelector("#commandEventStart")?.value;
  const endTime = commandCentreBody.querySelector("#commandEventEnd")?.value;
  const allDay = commandCentreBody.querySelector("#commandEventAllDay")?.checked === true;
  if (!title || !date) {
    throw new Error("Add a title and date.");
  }
  if (!allDay && (!startTime || !endTime)) {
    throw new Error("Add a title, date, start time and end time.");
  }
  const start = new Date(`${date}T${allDay ? "00:00" : startTime}`);
  const end = allDay ? new Date(start) : new Date(`${date}T${endTime}`);
  if (allDay || (!Number.isNaN(end.getTime()) && end <= start && endTime === "00:00")) {
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
    const data = await fetchJson(`/api/rooms/${roomCodeSnapshot}/command-centre/create-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (currentRoom?.code !== roomCodeSnapshot) return;
    currentRoom.events.push(data.event);
    pushUndoCreateEvent(data.event.id);
    render();
    fetchNotifications();
    commandCentreRenderSuccess(data.event, "Event created");
  } catch (error) {
    commandSetPreviewError(error.message || "The event could not be created.");
    if (action) {
      action.disabled = false;
      action.textContent = "Create event";
    }
  }
}

function commandCentreRenderSuccess(event, title) {
  commandCentreSetPhase("success", `${title}: ${event.title}`);
  commandCentreSetBody(`
    <div class="command-state-card">
      <div class="command-success-mark" aria-hidden="true">✓</div>
      <h3>${commandEscape(title)}</h3>
      <p>${commandEscape(event.title)} · ${commandEscape(commandHumanRange(event.start, event.end))}</p>
      <div class="command-actions">
        <button class="command-secondary-action" type="button" data-command-close>Done</button>
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
  commandCentreSetPhase("preview", "Availability request ready.");
  commandCentreSetBody(`
    <div class="command-preview-card">
      <h3>Search shared availability</h3>
      <p>${commandEscape(people || "Selected room members")} · ${commandEscape(result.durationMinutes)} minutes</p>
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
    const data = await fetchJson(`/api/rooms/${roomCodeSnapshot}/command-centre/availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: result.intent,
        participantIds: result.participantIds,
        rangeStart: result.rangeStart,
        rangeEnd: result.rangeEnd,
        durationMinutes: result.durationMinutes,
        earliestMinute: result.earliestMinute,
        latestMinute: result.latestMinute,
        timeOfDay: result.timeOfDay,
        timezone: commandCentreTimezone()
      }),
      signal: controller.signal
    });
    if (
      generation !== commandCentreState.generation ||
      currentRoom?.code !== roomCodeSnapshot ||
      !commandCentreDialog.open
    ) {
      return;
    }
    commandCentreState.availability = data.availability;
    if (!data.availability.complete) {
      commandCentreRenderMessage(
        "Availability unavailable",
        "A connected calendar could not be refreshed, so CommonGround will not guess that the time is free.",
        {
          actions: '<button class="command-secondary-action" type="button" data-command-search-availability>Try again</button>'
        }
      );
      return;
    }
    commandRenderAvailabilityResults(result, data.availability);
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
            <span>${commandEscape(commandHumanTime(slot.start))}–${commandEscape(commandHumanTime(slot.end))} · Everyone selected is free</span>
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
  const otherNames = commandParticipantNames(result.participantIds, { includeCurrent: false });
  const title = otherNames.length ? `Meeting with ${otherNames.join(" and ")}` : "New event";
  commandRenderCreatePreview({
    ...result,
    intent: "create_event",
    title,
    start: slot.start,
    end: slot.end,
    missingFields: [],
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
    window.requestAnimationFrame(() => memberSearchInput.focus({ preventScroll: true }));
    return;
  }
  if (kind === "date") {
    const target = new Date(`${id}T12:00`);
    if (view === "month") {
      const alreadyMonth = currentView === "month";
      currentFocusDate = target;
      syncMiniCalendarToFocus();
      if (alreadyMonth) await refreshCalendarAfterImmediateRender();
      else await setCurrentView("month");
    } else {
      await goToDateInWeek(target);
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
  if (result.intent === "create_event") {
    commandRenderCreatePreview(result);
    return;
  }
  if (result.intent === "find_time" || result.intent === "show_availability") {
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

async function requestCommandParse({ submitted = true } = {}) {
  const command = commandCentreInput.value.trim();
  if (command.length < 2 || !currentRoom?.code) {
    commandCentreRenderIntro();
    return;
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
      return;
    }
    commandContinueParsedResult(data.result, { submitted });
  } catch (error) {
    if (error.name === "AbortError") return;
    commandCentreRenderMessage("Command failed", error.message || "Try again.");
  } finally {
    if (commandCentreState.controller === controller) commandCentreState.controller = null;
  }
}

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
  commandCentreClearDebounce();
  commandCentreAbortRequest();
  if (commandCentreDialog.open) closeCommandCentre({ restoreFocus: false, immediate: true });
};

commandCentreButton?.addEventListener("click", () => {
  if (commandCentreDialog.open) closeCommandCentre();
  else openCommandCentre(commandCentreButton);
});

commandCentreCloseButton?.addEventListener("click", () => closeCommandCentre());

commandCentreInput?.addEventListener("input", commandCentreScheduleParse);

commandCentreForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (commandCentreState.phase === "results" && commandCentreSelectableOptions().length) {
    commandCentreActivateSelected();
    return;
  }
  requestCommandParse({ submitted: true });
});

commandCentreBody?.addEventListener("click", async (event) => {
  const example = event.target.closest("[data-command-example]");
  if (example) {
    commandCentreInput.value = example.dataset.commandExample;
    await requestCommandParse({ submitted: true });
    return;
  }
  if (event.target.closest("[data-command-cancel], [data-command-close]")) {
    closeCommandCentre();
    return;
  }
  if (event.target.closest("[data-command-edit-preview]")) {
    const field = commandCentreBody.querySelector('[aria-invalid="true"], #commandEventTitle');
    field?.focus({ preventScroll: true });
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
  if (event.target.closest("[data-command-confirm-create]")) {
    await commandConfirmCreate();
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
    if (event.target.matches("#commandEventAllDay")) {
      const checked = event.target.checked;
      const start = commandCentreBody.querySelector("#commandEventStart");
      const end = commandCentreBody.querySelector("#commandEventEnd");
      if (!checked && (!start.value || start.value === "00:00") && (!end.value || end.value === "00:00")) {
        start.value = "09:00";
        end.value = "10:00";
      }
      start.disabled = checked;
      end.disabled = checked;
      start.toggleAttribute("aria-invalid", !checked && !start.value);
      end.toggleAttribute("aria-invalid", !checked && !end.value);
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
