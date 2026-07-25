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
  highlight: null,
  conflictDraft: null
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
  commandCentreState.conflictDraft = null;
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
  return `${commandHumanDate(start)} Â· ${commandHumanTime(start)}â€“${commandHumanTime(end)}`;
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
     ×M¸òÚ$z{-®éÜj×r‡&W7VÇBÂ&W7VÇBæWfVçD6æF–FFW5³Ò“°¢&WGW&ã°¢Ğ¢6öÖÖæE&VæFW$æf–vFR‡&W7VÇB“°§Ğ ¦7–æ2gVæ7F–öâ&ö6W75W6W$–çFVçB†–çWEFW‡BÂ²7V&Ö—GFVBÒG'VRÒÒ·Ò’°¢6öç7B6öÖÖæBÒ7G&–ær†–çWEFW‡BÇÂ""’çG&–Ò‚“°¢–b†6öÖÖæBæÆVæwF‚Â"ÇÂ7W'&VçE&ööÓòæ6öFR’°¢6öÖÖæD6VçG&U&VæFW$–çG&ò‚“°¢&WGW&â°¢7V66W73¢fÇ6RÀ¢ÖW76vS¢7W'&VçE&ööÓòæ6öFRò$VçFW"6ÆVæF"6öÖÖæBâ"¢$÷Vâ&ööÒ&Vf÷&RW6–ær6öÖÖæB6VçG&Râ ¢Ó°¢Ğ¢6öÖÖæD6VçG&T6ÆV$FV&÷Væ6R‚“°¢6öÖÖæD6VçG&T&÷'E&WVW7B‚“°¢6öç7B6öçG&öÆÆW"ÒæWr&÷'D6öçG&öÆÆW"‚“°¢6öç7BvVæW&F–öâÒ²¶6öÖÖæD6VçG&U7FFRævVæW&F–öã°¢6öç7B&ööÔ6öFU6æ6†÷BÒ7W'&VçE&ööÒæ6öFS°¢6öÖÖæD6VçG&U7FFRæ6öçG&öÆÆW"Ò6öçG&öÆÆW#°¢6öÖÖæD6VçG&U6WE†6R‚''6–ær"Â%VæFW'7FæF–ær6öÖÖæBâ"“°¢6öÖÖæD6VçG&U&VæFW$ÆöF–ær‚%VæFW'7FæF–ær–÷W"6öÖÖæN(
b"“°¢G'’°¢6öç7BFFÒv—BfWF6„§6öâ†ö’÷&öö×2òG·&ööÔ6öFU6æ6†÷GÒö6öÖÖæBÖ6VçG&R÷'6VÂ°¢ÖWF†öC¢%õ5B"À¢†VFW'3¢²$6öçFVçBÕG—R#¢&Æ–6F–öâö§6öâ"ÒÀ¢&öG“¢¥4ôâç7G&–æv–g’‡°¢6öÖÖæBÀ¢F–ÖW¦öæS¢6öÖÖæD6VçG&UF–ÖW¦öæR‚¢Ò’À¢6–væÃ¢6öçG&öÆÆW"ç6–væÀ¢Ò“°¢–b€¢vVæW&F–öâÓÒ6öÖÖæD6VçG&U7FFRævVæW&F–öâÇÀ¢7W'&VçE&ööÓòæ6öFRÓÒ&ööÔ6öFU6æ6†÷BÇÀ¢6öÖÖæD6VçG&TF–Æöræ÷Và¢’°¢&WGW&â°¢7V66W73¢fÇ6RÀ¢ÖW76vS¢%F†R6öÖÖæB&W7VÇBv2–væ÷&VB&V6W6RF†R7F—fR&ööÒ6†ævVBâ"À¢6öFS¢'7FÆUö6öÖÖæB ¢Ó°¢Ğ¢6öÖÖæD6öçF–çVU'6VE&W7VÇB†FFç&W7VÇBÂ²7V&Ö—GFVBÒ“°¢&WGW&â°¢7V66W73¢G'VRÀ¢ÖW76vS¢$6öÖÖæBVæFW'7FööBâ"À¢–ÆöC¢FFç&W7VÇ@¢Ó°¢Ò6F6‚†W'&÷"’°¢–b†W'&÷"ææÖRÓÓÒ$&÷'DW'&÷""’°¢&WGW&â°¢7V66W73¢fÇ6RÀ¢ÖW76vS¢$6öÖÖæB6æ6VÆÆVBâ"À¢6öFS¢&&÷'FVB ¢Ó°¢Ğ¢6öÖÖæD6VçG&U&VæFW$ÖW76vR‚$6öÖÖæBf–ÆVB"ÂW'&÷"æÖW76vRÇÂ%G'’v–ââ"“°¢&WGW&â°¢7V66W73¢fÇ6RÀ¢ÖW76vS¢W'&÷"æÖW76vRÇÂ%G'’v–ââ"À¢6öFS¢W'&÷"æ6öFRÇÂçVÆÀ¢Ó°¢Òf–æÆÇ’°¢–b†6öÖÖæD6VçG&U7FFRæ6öçG&öÆÆW"ÓÓÒ6öçG&öÆÆW"’6öÖÖæD6VçG&U7FFRæ6öçG&öÆÆW"ÒçVÆÃ°¢Ğ§Ğ ¦7–æ2gVæ7F–öâ&WVW7D6öÖÖæE'6R‡²7V&Ö—GFVBÒG'VRÒÒ·Ò’°¢&WGW&â&ö6W75W6W$–çFVçB†6öÖÖæD6VçG&T–çWBçfÇVRÂ²7V&Ö—GFVBÒ“°§Ğ §v–æF÷rç&ö6W75W6W$–çFVçBÒ&ö6W75W6W$–çFVçC°§v–æF÷rä6öÖÖöäw&÷VæD6öÖÖæE&÷WFW"Òö&¦V7Bæg&VW¦R‡°¢&ö6W75W6W$–çFVçBÀ¢ââçv–æF÷rä6öÖÖöäw&÷VæD6öÖÖæD7F–öç0§Ò“° ¦gVæ7F–öâ6öÖÖæD6VçG&U6VÆV7F&ÆT÷F–öç2‚’°¢&WGW&â²ââæ6öÖÖæD6VçG&T&öG’çVW'•6VÆV7F÷$ÆÂ‚%¶FFÖ6öÖÖæBÖ÷F–öåÒ"•Ó°§Ğ ¦gVæ7F–öâ6öÖÖæD6VçG&U6VÆV7D–æFW‚†æW‡D–æFW‚’°¢6öç7B÷F–öç2Ò6öÖÖæD6VçG&U6VÆV7F&ÆT÷F–öç2‚“°¢–b‚÷F–öç2æÆVæwF‚’&WGW&ã°¢6öç7Bæ÷&ÖÆ—¦VBÒ‚†æW‡D–æFW‚R÷F–öç2æÆVæwF‚’²÷F–öç2æÆVæwF‚’R÷F–öç2æÆVæwFƒ°¢6öÖÖæD6VçG&U7FFRç6VÆV7FVD–æFW‚Òæ÷&ÖÆ—¦VC°¢÷F–öç2æf÷$V6‚‚†÷F–öâÂ–æFW‚’Óâ°¢6öç7B6VÆV7FVBÒ–æFW‚ÓÓÒæ÷&ÖÆ—¦VC°¢÷F–öâæ6Æ74Æ—7BçFövvÆR‚&—2×6VÆV7FVB"Â6VÆV7FVB“°¢÷F–öâç6WDGG&–'WFR‚&&–×6VÆV7FVB"Â7G&–ær‡6VÆV7FVB’“°¢Ò“°¢÷F–öç5¶æ÷&ÖÆ—¦VEÒç67&öÆÄ–çFõf–Wr‡²&Æö6³¢&æV&W7B"Ò“°§Ğ ¦gVæ7F–öâ6öÖÖæD6VçG&T7F—fFU6VÆV7FVB‚’°¢6öç7B÷F–öç2Ò6öÖÖæD6VçG&U6VÆV7F&ÆT÷F–öç2‚“°¢÷F–öç5¶6öÖÖæD6VçG&U7FFRç6VÆV7FVD–æFW…Óòæ6Æ–6²‚“°§Ğ ¦gVæ7F–öâ6öÖÖæE&Vf–æTf–Æ&–Æ—G’†¶–æB’°¢6öç7B&W7VÇBÒ²ââæ6öÖÖæD6VçG&U7FFRç'6U&W7VÇBÓ°¢–b†¶–æBÓÓÒ'6†÷'FW""’&W7VÇBæGW&F–öäÖ–çWFW2Ò3°¢–b†¶–æBÓÓÒ&WfVæ–æw2"’°¢&W7VÇBçF–ÖTödF’ÒçVÆÃ°¢&W7VÇBæV&Æ–W7DÖ–çWFRÒ‚¢c°¢&W7VÇBæÆFW7DÖ–çWFRÒ#¢c°¢Ğ¢–b†¶–æBÓÓÒ&W‡æB"’°¢&W7VÇBç&ævTVæBÒæWrFFR†æWrFFR‡&W7VÇBç&ævTVæB’ævWEF–ÖR‚’²r¢#B¢c¢c¢’çFô•4õ7G&–ær‚“°¢Ğ¢6öÖÖæD6VçG&U7FFRç'6U&W7VÇBÒ&W7VÇC°¢6öÖÖæDÆöDf–Æ&–Æ—G’‡&W7VÇB“°§Ğ ¦7–æ2gVæ7F–öâ6öÖÖæE6†÷tf–Æ&–Æ—G”öä6ÆVæF"‚’°¢6öç7Bf–Æ&–Æ—G’Ò6öÖÖæD6VçG&U7FFRæf–Æ&–Æ—G“°¢6öç7B&W7VÇBÒ6öÖÖæD6VçG&U7FFRç'6U&W7VÇC°¢–b‚f–Æ&–Æ—G“òæg&VT–çFW'fÇ3òæÆVæwF‚’&WGW&ã°¢6öÖÖæD6VçG&U7FFRæ†–v†Æ–v‡BÒ°¢&ööÔ6öFS¢7W'&VçE&ööÓòæ6öFRÀ¢'F–6—çD–G3¢²ââç&W7VÇBç'F–6—çD–G5ÒÀ¢–çFW'fÇ3¢f–Æ&–Æ—G’æg&VT–çFW'fÇ2ç6Æ–6RƒÂƒ’À¢7&VFVDC¢FFRææ÷r‚¢Ó°¢6öç7Bf—'7BÒæWrFFR†f–Æ&–Æ—G’æg&VT–çFW'fÇ5³Òç7F'B“°¢6Æ÷6T6öÖÖæD6VçG&R‡²&W7F÷&Tfö7W3¢fÇ6RÒ“°¢v—BvõFôFFT–åvVV²†f—'7B“°¢6ÆVæF%7FGW2çFW‡D6öçFVçBÒ6†÷v–ær6†&VBf–Æ&–Æ—G’f÷"G¶6öÖÖæE'F–6—çDæÖW2‡&W7VÇBç'F–6—çD–G2’æ¦ö–â‚"Â"—Òæ°§Ğ §v–æF÷ræ6öÖÖæD6VçG&U&VæFW$f–Æ&–Æ—G”†–v†Æ–v‡G2Ò†WfVçG4Æ–W"ÂF—2’Óâ°¢6öç7B†–v†Æ–v‡BÒ6öÖÖæD6VçG&U7FFRæ†–v†Æ–v‡C°¢–b‚†–v†Æ–v‡BÇÂ†–v†Æ–v‡Bç&ööÔ6öFRÓÒ7W'&VçE&ööÓòæ6öFRÇÂWfVçG4Æ–W"’&WGW&ã°¢f÷"†6öç7B¶F”–æFW‚ÂF•ÒöbF—2æVçG&–W2‚’’°¢6öç7BF•7F'BÒ7F'DödF’†F’æFFR“°¢6öç7BF”VæBÒFDF—2†F•7F'BÂ“°¢f÷"†6öç7B–çFW'fÂöb†–v†Æ–v‡Bæ–çFW'fÇ2’°¢6öç7B&u7F'BÒæWrFFR†–çFW'fÂç7F'B“°¢6öç7B&tVæBÒæWrFFR†–çFW'fÂæVæB“°¢–b‡&u7F'BãÒF”VæBÇÂ&tVæBÃÒF•7F'B’6öçF–çVS°¢6öç7B7F'BÒ&u7F'BâF•7F'Bò&u7F'B¢F•7F'C°¢6öç7BVæBÒ&tVæBÂF”VæBò&tVæB¢F”VæC°¢6öç7B7F'D†÷W"Ò7F'BævWD†÷W'2‚’²7F'BævWDÖ–çWFW2‚’òc°¢6öç7BVæD†÷W"ÒVæBãÒF”VæBò#B¢VæBævWD†÷W'2‚’²VæBævWDÖ–çWFW2‚’òc°¢–b†VæD†÷W"ÃÒ7F'D†÷W"’6öçF–çVS°¢6öç7B&Æö6²ÒFö7VÖVçBæ7&VFTVÆVÖVçB‚&F—b"“°¢&Æö6²æ6Æ74æÖRÒ&6öÖÖæBÖf–Æ&–Æ—G’Ö&Æö6²#°¢&Æö6²ç7G–ÆRç6WE&÷W'G’‚"ÒÖF’Ö–æFW‚"Â7G&–ær†F”–æFW‚’“°¢&Æö6²ç7G–ÆRç6WE&÷W'G’‚"Ò×7F'B"Â7G&–ær‡7F'D†÷W"Ò6ÆVæF%7F'D†÷W"’“°¢&Æö6²ç7G–ÆRç6WE&÷W'G’‚"ÒÖGW&F–öâ"Â7G&–ær†VæD†÷W"Ò7F'D†÷W"’“°¢&Æö6²ç6WDGG&–'WFR‚&&–Ö†–FFVâ"Â'G'VR"“°¢6öç7BF—FÆRÒFö7VÖVçBæ7&VFTVÆVÖVçB‚'7G&öær"“°¢6öç7BF–ÖRÒFö7VÖVçBæ7&VFTVÆVÖVçB‚'7â"“°¢F—FÆRçFW‡D6öçFVçBÒ%6†&VBg&VRF–ÖR#°¢F–ÖRçFW‡D6öçFVçBÒf÷&ÖDWfVçE&ævR‡7F'D†÷W"ÂVæD†÷W"“°¢&Æö6²æVæB‡F—FÆRÂF–ÖR“°¢WfVçG4Æ–W"æVæD6†–ÆB†&Æö6²“°¢Ğ¢Ğ§Ó° §v–æF÷ræ6öÖÖæD6VçG&U&W6WBÒ‚’Óâ°¢6öÖÖæD6VçG&U7FFRæ†–v†Æ–v‡BÒçVÆÃ°¢6öÖÖæD6VçG&U7FFRç'6U&W7VÇBÒçVÆÃ°¢6öÖÖæD6VçG&U7FFRæf–Æ&–Æ—G’ÒçVÆÃ°¢6öÖÖæD6VçG&U7FFRæÖ÷fT6æF–FFRÒçVÆÃ°¢6öÖÖæD6VçG&U7FFRæ6öæfÆ–7DG&gBÒçVÆÃ°¢6öÖÖæD6VçG&T6ÆV$FV&÷Væ6R‚“°¢6öÖÖæD6VçG&T&÷'E&WVW7B‚“°¢–b†6öÖÖæD6VçG&TF–Æöræ÷Vâ’6Æ÷6T6öÖÖæD6VçG&R‡²&W7F÷&Tfö7W3¢fÇ6RÂ–ÖÖVF–FS¢G'VRÒ“°§Ó° ¦6öÖÖæD6VçG&T'WGFöãòæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ°¢–b†6öÖÖæD6VçG&TF–Æöræ÷Vâ’6Æ÷6T6öÖÖæD6VçG&R‚“°¢VÇ6R÷Vä6öÖÖæD6VçG&R†6öÖÖæD6VçG&T'WGFöâ“°§Ò“° ¦6öÖÖæD6VçG&T6Æ÷6T'WGFöãòæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ6Æ÷6T6öÖÖæD6VçG&R‚’“° ¦6öÖÖæD6VçG&T–çWCòæFDWfVçDÆ—7FVæW"‚&–çWB"Â6öÖÖæD6VçG&U66†VGVÆU'6R“° ¦6öÖÖæD6VçG&Tf÷&ÓòæFDWfVçDÆ—7FVæW"‚'7V&Ö—B"Â†WfVçB’Óâ°¢WfVçBç&WfVçDFVfVÇB‚“°¢–b†6öÖÖæD6VçG&U7FFRç†6RÓÓÒ'&W7VÇG2"bb6öÖÖæD6VçG&U6VÆV7F&ÆT÷F–öç2‚’æÆVæwF‚’°¢6öÖÖæD6VçG&T7F—fFU6VÆV7FVB‚“°¢&WGW&ã°¢Ğ¢&WVW7D6öÖÖæE'6R‡²7V&Ö—GFVC¢G'VRÒ“°§Ò“° ¦6öÖÖæD6VçG&T&öG“òæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â7–æ2†WfVçB’Óâ°¢6öç7BW†×ÆRÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæBÖW†×ÆUÒ"“°¢–b†W†×ÆR’°¢6öÖÖæD6VçG&T–çWBçfÇVRÒW†×ÆRæFF6WBæ6öÖÖæDW†×ÆS°¢v—B&WVW7D6öÖÖæE'6R‡²7V&Ö—GFVC¢G'VRÒ“°¢&WGW&ã°¢Ğ¢–b†WfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæBÖ6æ6VÅÒÂ¶FFÖ6öÖÖæBÖ6Æ÷6UÒ"’’°¢6Æ÷6T6öÖÖæD6VçG&R‚“°¢&WGW&ã°¢Ğ¢–b†WfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæBÖVF—B×&Wf–WuÒ"’’°¢6öç7Bf–VÆBÒ6öÖÖæD6VçG&T&öG’çVW'•6VÆV7F÷"‚u¶&–Ö–çfÆ–CÒ'G'VR%ÒÂ66öÖÖæDWfVçEF—FÆRr“°¢f–VÆCòæfö7W2‡²&WfVçE67&öÆÃ¢G'VRÒ“°¢&WGW&ã°¢Ğ¢–b†WfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæBÖVF—BÖ6öæfÆ–7EÒ"’’°¢6öç7BG&gBÒ6öÖÖæD6VçG&U7FFRæ6öæfÆ–7DG&gC°¢–b†G&gB’°¢6öÖÖæE&VæFW$7&VFU&Wf–Wr‡°¢ââæ6öÖÖæD6VçG&U7FFRç'6U&W7VÇBÀ¢–çFVçC¢&7&VFUöWfVçB"À¢F—FÆS¢G&gBçF—FÆRÀ¢7F'C¢G&gBç7F'BÀ¢VæC¢G&gBæVæBÀ¢'F–6—çD–G3¢G&gBæ–çf—FVU'F–6—çD–G2À¢Æö6F–öã¢G&gBæÆö6F–öâÀ¢FW67&—F–öã¢G&gBæFW67&—F–öâÀ¢ÆÄF“¢G&gBæÆÄF’ÓÓÒG'VRÀ¢Ö—76–ætf–VÆG3¢µÒÀ¢Ö&–wV—F–W3¢µĞ¢Ò“°¢Ğ¢&WGW&ã°¢Ğ¢6öç7B'F–6—çD÷F–öâÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæB×'F–6—çBÖ÷F–öåÒ"“°¢–b‡'F–6—çD÷F–öâ’°¢6öç7B&W7VÇBÒ°¢ââæ6öÖÖæD6VçG&U7FFRç'6U&W7VÇBÀ¢'F–6—çD–G3¢°¢âââ†6öÖÖæD6VçG&U7FFRç'6U&W7VÇBç'F–6—çD–G2ÇÂµÒ’À¢'F–6—çD÷F–öâæFF6WBæ6öÖÖæE'F–6—çD÷F–öà¢ÒÀ¢Ö&–wV—F–W3¢†6öÖÖæD6VçG&U7FFRç'6U&W7VÇBæÖ&–wV—F–W2ÇÂµÒ’ç6Æ–6Rƒ¢Ó°¢6öÖÖæD6öçF–çVU'6VE&W7VÇB‡&W7VÇBÂ²7V&Ö—GFVC¢G'VRÒ“°¢&WGW&ã°¢Ğ¢6öç7B6Æ÷D'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæB×6Æ÷BÖ–æFW…Ò"“°¢–b‡6Æ÷D'WGFöâ’°¢6öç7B6Æ÷BÒ6öÖÖæD6VçG&U7FFRæf–Æ&–Æ—G“òç6Æ÷G3òå´çVÖ&W"‡6Æ÷D'WGFöâæFF6WBæ6öÖÖæE6Æ÷D–æFW‚•Ó°¢–b‚6Æ÷B’&WGW&ã°¢–b†6öÖÖæD6VçG&U7FFRç'6U&W7VÇBæ–çFVçBÓÓÒ'6†÷uöf–Æ&–Æ—G’"’°¢v—B6öÖÖæE6†÷tf–Æ&–Æ—G”öä6ÆVæF"‚“°¢ÒVÇ6R°¢6öÖÖæD7&VFTG&gDg&öÕ6Æ÷B†6öÖÖæD6VçG&U7FFRç'6U&W7VÇBÂ6Æ÷B“°¢Ğ¢&WGW&ã°¢Ğ¢6öç7B6æF–FFT'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæBÖWfVçBÖ6æF–FFUÒ"“°¢–b†6æF–FFT'WGFöâ’°¢6öç7B6æF–FFRÒ6öÖÖæD6VçG&U7FFRç'6U&W7VÇBæWfVçD6æF–FFW0¢æf–æB‚†VçG'’’ÓâVçG'’æ–BÓÓÒ6æF–FFT'WGFöâæFF6WBæ6öÖÖæDWfVçD6æF–FFR“°¢–b†6æF–FFR’6öÖÖæE&VæFW$Ö÷fU&Wf–Wr†6öÖÖæD6VçG&U7FFRç'6U&W7VÇBÂ6æF–FFR“°¢&WGW&ã°¢Ğ¢6öç7Bæf–vF–öä'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæBÖæf–vFRÖ¶–æEÒ"“°¢–b†æf–vF–öä'WGFöâ’°¢v—B6öÖÖæDW†V7WFTæf–vF–öâ†æf–vF–öä'WGFöâ“°¢&WGW&ã°¢Ğ¢6öç7Bf–Wt'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæBÖ÷Vâ×f–WuÒ"“°¢–b‡f–Wt'WGFöâ’°¢v—B6öÖÖæDW†V7WFUf–Wr‡f–Wt'WGFöâæFF6WBæ6öÖÖæD÷Våf–Wr“°¢&WGW&ã°¢Ğ¢–b†WfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæBÖ6öææV7BÖvöövÆUÒ"’’°¢6öÖÖæDW†V7WFTvöövÆT6öææV7B‚“°¢&WGW&ã°¢Ğ¢6öç7B&ööÔ6öFT'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæB×WFFR×&ööÒÖ6öFUÒ"“°¢–b‡&ööÔ6öFT'WGFöâ’°¢v—B6öÖÖæDW†V7WFU&ööÔ6öFR‡&ööÔ6öFT'WGFöâæFF6WBæ6öÖÖæEWFFU&ööÔ6öFR“°¢&WGW&ã°¢Ğ¢–b†WfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæBÖ6öæf—&ÒÖ7&VFUÒ"’’°¢v—B6öÖÖæD6öæf—&Ô7&VFR‚“°¢&WGW&ã°¢Ğ¢–b†WfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæBÖ6öæf—&ÒÖÖ÷fUÒ"’’°¢v—B6öÖÖæD6öæf—&ÔÖ÷fR‚“°¢&WGW&ã°¢Ğ¢–b†WfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæB×6V&6‚Öf–Æ&–Æ—G•Ò"’’°¢v—B6öÖÖæDÆöDf–Æ&–Æ—G’†6öÖÖæD6VçG&U7FFRç'6U&W7VÇB“°¢&WGW&ã°¢Ğ¢–b†WfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæBÖ6öçF–çVRÖf–Æ&–Æ—G•Ò"’’°¢G'’°¢6öç7B&W7VÇBÒ6öÖÖæDf–Æ&–Æ—G•&WVW7Dg&öÔ6Æ&–f–6F–öâ†6öÖÖæD6VçG&U7FFRç'6U&W7VÇB“°¢6öÖÖæD6VçG&U7FFRç'6U&W7VÇBÒ&W7VÇC°¢v—B6öÖÖæDÆöDf–Æ&–Æ—G’‡&W7VÇB“°¢Ò6F6‚†W'&÷"’°¢6öÖÖæE6WE&Wf–WtW'&÷"†W'&÷"æÖW76vR“°¢Ğ¢&WGW&ã°¢Ğ¢–b†WfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæB×6†÷rÖf–Æ&–Æ—G•Ò"’’°¢v—B6öÖÖæE6†÷tf–Æ&–Æ—G”öä6ÆVæF"‚“°¢&WGW&ã°¢Ğ¢–b†WfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæB×VæFòÖ7&VFUÒ"’’°¢v—BVæFôÆ7DWfVçD7&VF–öâ‚“°¢6öÖÖæD6VçG&U7FFRæ6öæfÆ–7DG&gBÒçVÆÃ°¢6öÖÖæD6VçG&U&VæFW$ÖW76vR‚$WfVçB&VÖ÷fVB"Â%F†RWfVçBæB—G26öææV7FVBÖ6ÆVæF"6÷’vW&R&VÖ÷fVBâ"Â°¢†6S¢'7V66W72"À¢7F–öç3¢sÆ'WGFöâ6Æ73Ò&6öÖÖæB×&–Ö'’Ö7F–öâ"G—SÒ&'WGFöâ"FFÖ6öÖÖæBÖ6Æ÷6SäFöæSÂö'WGFöãâp¢Ò“°¢&WGW&ã°¢Ğ¢6öç7B&Vf–æT'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæB×&Vf–æUÒ"“°¢–b‡&Vf–æT'WGFöâ’°¢6öÖÖæE&Vf–æTf–Æ&–Æ—G’‡&Vf–æT'WGFöâæFF6WBæ6öÖÖæE&Vf–æR“°¢&WGW&ã°¢Ğ¢6öç7B÷VäWfVçD'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæBÖ÷VâÖWfVçEÒ"“°¢–b†÷VäWfVçD'WGFöâ’°¢v—B6öÖÖæD÷Vå&ööÔWfVçB†÷VäWfVçD'WGFöâæFF6WBæ6öÖÖæD÷VäWfVçB“°¢Ğ§Ò“° ¦f÷"†6öç7BWfVçDæÖRöb²&–çWB"Â&6†ævR%Ò’°¢6öÖÖæD6VçG&T&öG“òæFDWfVçDÆ—7FVæW"†WfVçDæÖRÂ†WfVçB’Óâ°¢–b†WfVçBçF&vWBæÖF6†W2‚"66öÖÖæDWfVçDÆÄF’"’’°¢6öç7B6†V6¶VBÒWfVçBçF&vWBæ6†V6¶VC°¢6öç7B7F'BÒ6öÖÖæD6VçG&T&öG’çVW'•6VÆV7F÷"‚"66öÖÖæDWfVçE7F'B"“°¢6öç7BVæBÒ6öÖÖæD6VçG&T&öG’çVW'•6VÆV7F÷"‚"66öÖÖæDWfVçDVæB"“°¢–b‚6†V6¶VBbb‚7F'BçfÇVRÇÂ7F'BçfÇVRÓÓÒ#£"’bb‚VæBçfÇVRÇÂVæBçfÇVRÓÓÒ#£"’’°¢7F'BçfÇVRÒ#“£#°¢VæBçfÇVRÒ#£#°¢Ğ¢7F'BæF—6&ÆVBÒ6†V6¶VC°¢VæBæF—6&ÆVBÒ6†V6¶VC°¢7F'BçFövvÆTGG&–'WFR‚&&–Ö–çfÆ–B"Â6†V6¶VBbb7F'BçfÇVR“°¢VæBçFövvÆTGG&–'WFR‚&&–Ö–çfÆ–B"Â6†V6¶VBbbVæBçfÇVR“°¢&WGW&ã°¢Ğ¢–b‚WfVçBçF&vWBæÖF6†W2‚"66öÖÖæDÖ÷fTFFRÂ66öÖÖæDÖ÷fU7F'BÂ66öÖÖæDÖ÷fTVæB"’’&WGW&ã°¢G'’°¢6öç7BÖ÷fRÒ6öÖÖæE&VDÖ÷fTG&gB‚“°¢6öç7B7VÖÖ'’Ò6öÖÖæD6VçG&T&öG’çVW'•6VÆV7F÷"‚"66öÖÖæDÖ÷fTæWu7VÖÖ'’"“°¢–b‡7VÖÖ'’’7VÖÖ'’çFW‡D6öçFVçBÒ6öÖÖæD‡VÖå&ævR†Ö÷fRç7F'BÂÖ÷fRæVæB“°¢Ò6F6‚°¢òòF†Rfö7W6VBVF—B&VÖ–ç2f—6–&ÆRVçF–ÂÆÂF‡&VRf–VÆG2f÷&ÒfÆ–B&ævRà¢Ğ¢Ò“°§Ğ ¦6öÖÖæD6VçG&TF–ÆösòæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â†WfVçB’Óâ°¢–b†WfVçBçF&vWBÓÓÒ6öÖÖæD6VçG&TF–Æör’6Æ÷6T6öÖÖæD6VçG&R‚“°§Ò“° ¦6öÖÖæD6VçG&TF–ÆösòæFDWfVçDÆ—7FVæW"‚&6æ6VÂ"Â†WfVçB’Óâ°¢WfVçBç&WfVçDFVfVÇB‚“°¢6Æ÷6T6öÖÖæD6VçG&R‚“°§Ò“° §v–æF÷ræFDWfVçDÆ—7FVæW"‚&¶W–F÷vâ"Â†WfVçB’Óâ°¢6öç7B6öÖÖæE6†÷'F7WBÒ†WfVçBæÖWF¶W’ÇÂWfVçBæ7G&Ä¶W’’bbWfVçBæÇD¶W’bbWfVçBæ¶W’çFôÆ÷vW$66R‚’ÓÓÒ&²#°¢6öç7B6Æ6…6†÷'F7WBÒWfVçBæ¶W’ÓÓÒ"ò"bbWfVçBæÖWF¶W’bbWfVçBæ7G&Ä¶W’bbWfVçBæÇD¶W’bb6†÷VÆD–væ÷&Uf–Wu6†÷'F7WB†WfVçBçF&vWB“°¢–b†6öÖÖæE6†÷'F7WBÇÂ6Æ6…6†÷'F7WB’°¢–b‚7W'&VçE&ööÓòæ6öFRÇÂ&ööÕvRæ6Æ74Æ—7Bæ6öçF–ç2‚&†–FFVâ"’’&WGW&ã°¢WfVçBç&WfVçDFVfVÇB‚“°¢WfVçBç7F÷–ÖÖVF–FU&÷vF–öâ‚“°¢–b†6öÖÖæD6VçG&TF–Æöræ÷Vâ’6Æ÷6T6öÖÖæD6VçG&R‚“°¢VÇ6R÷Vä6öÖÖæD6VçG&R†WfVçBçF&vWB“°¢&WGW&ã°¢Ğ¢–b‚6öÖÖæD6VçG&TF–Æöræ÷Vâ’&WGW&ã°¢–b†WfVçBæ¶W’ÓÓÒ$W66R"’°¢WfVçBç&WfVçDFVfVÇB‚“°¢WfVçBç7F÷–ÖÖVF–FU&÷vF–öâ‚“°¢6Æ÷6T6öÖÖæD6VçG&R‚“°¢&WGW&ã°¢Ğ¢–b†WfVçBæ¶W’ÓÓÒ$'&÷tF÷vâ"ÇÂWfVçBæ¶W’ÓÓÒ$'&÷uW"’°¢6öç7B÷F–öç2Ò6öÖÖæD6VçG&U6VÆV7F&ÆT÷F–öç2‚“°¢–b‚÷F–öç2æÆVæwF‚’&WGW&ã°¢WfVçBç&WfVçDFVfVÇB‚“°¢WfVçBç7F÷–ÖÖVF–FU&÷vF–öâ‚“°¢6öÖÖæD6VçG&U6VÆV7D–æFW‚†6öÖÖæD6VçG&U7FFRç6VÆV7FVD–æFW‚²†WfVçBæ¶W’ÓÓÒ$'&÷tF÷vâ"ò¢Ó’“°¢&WGW&ã°¢Ğ¢–b‚†WfVçBæÖWF¶W’ÇÂWfVçBæ7G&Ä¶W’’bbWfVçBæ¶W’ÓÓÒ$VçFW""’°¢6öç7B7F–öâÒ6öÖÖæD6VçG&T&öG’çVW'•6VÆV7F÷"‚"æ6öÖÖæB×&–Ö'’Ö7F–öã¦æ÷Bƒ¦F—6&ÆVB’"“°¢–b‚7F–öâ’&WGW&ã°¢WfVçBç&WfVçDFVfVÇB‚“°¢WfVçBç7F÷–ÖÖVF–FU&÷vF–öâ‚“°¢7F–öâæ6Æ–6²‚“°¢&WGW&ã°¢Ğ¢–b†WfVçBæ¶W’ÓÓÒ$VçFW""bbWfVçBçF&vWBÓÓÒ6öÖÖæD6VçG&T–çWBbb6öÖÖæD6VçG&U6VÆV7F&ÆT÷F–öç2‚’æÆVæwF‚’°¢WfVçBç&WfVçDFVfVÇB‚“°¢WfVçBç7F÷–ÖÖVF–FU&÷vF–öâ‚“°¢6öÖÖæD6VçG&T7F—fFU6VÆV7FVB‚“°¢Ğ§ÒÂG'VR“° ¦6öç7B6öÖÖæEW6W4Ö56†÷'F7WBÒôÖ7Æ•†öæWÆ•GÆ•öBö’çFW7B†æf–vF÷"çÆFf÷&ÒÇÂæf–vF÷"çW6W$vVçB“°¦–b†6öÖÖæD6VçG&U6†÷'F7WD†–çB’6öÖÖæD6VçG&U6†÷'F7WD†–çBçFW‡D6öçFVçBÒ6öÖÖæEW6W4Ö56†÷'F7WBò.(É‚²"¢$7G&Â²#°