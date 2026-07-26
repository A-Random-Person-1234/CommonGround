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
  createTitleSuggestion: "",
  createRequestId: null,
  createCommandKey: "",
  deleteRequestId: null,
  deleteCommandKey: "",
  deleteCandidateId: null,
  interpretation: null,
  lastCommand: "",
  contextEvent: null,
  pendingEventAction: null
};

const commandEventIdeaLabels = Object.freeze([
  "Lunch",
  "Coffee",
  "Catch-up",
  "Planning"
]);

let commandCentrePredictor = null;
import("/command-centre-predictor.js?v=20260726-assistant-upgrade")
  .then((module) => {
    commandCentrePredictor = module;
    if (commandCentreDialog?.open) commandCentreHandleInput();
  })
  .catch(() => {
    commandCentrePredictor = null;
  });

const commandWordAliases = Object.freeze({
  "2moro": "tomorrow",
  "2morow": "tomorrow",
  "tmrw": "tomorrow",
  "tmr": "tomorrow",
  "tomorow": "tomorrow",
  "tommorow": "tomorrow",
  "tommorrow": "tomorrow",
  "nxt": "next",
  "w": "with",
  "wk": "week",
  "wks": "weeks",
  "mins": "minutes",
  "min": "minutes",
  "hr": "hour",
  "hrs": "hours",
  "cal": "calendar",
  "calender": "calendar",
  "calandar": "calendar",
  "clendar": "calendar",
  "avail": "availability",
  "availablity": "availability",
  "schedual": "schedule",
  "shedule": "schedule",
  "shcedule": "schedule",
  "creat": "create",
  "craete": "create",
  "evnt": "event",
  "evt": "event",
  "mtg": "meeting",
  "meetting": "meeting",
  "mvoe": "move",
  "moev": "move",
  "delet": "delete",
  "delte": "delete",
  "remvoe": "remove",
  "cancle": "cancel",
  "duplicte": "duplicate",
  "duplciate": "duplicate",
  "renmae": "rename",
  "opne": "open",
  "googl": "google",
  "evryone": "everyone",
  "every1": "everyone",
  "setings": "settings",
  "settigns": "settings",
  "settting": "settings",
  "thrusday": "thursday",
  "thurday": "thursday",
  "thurs": "thursday",
  "wensday": "wednesday",
  "wednsday": "wednesday",
  "tues": "tuesday",
  "weds": "wednesday",
  "fri": "friday",
  "sat": "saturday",
  "sun": "sunday",
  "tody": "today",
  "todya": "today",
  "whens": "when is"
});

function commandNormalizeVocabulary(value) {
  const normalized = String(value || "")
    .normalize("NFKC")
    .toLocaleLowerCase("en-GB")
    .replace(/[’']/g, "")
    .replace(/\bw\s*\/\s*/g, "with ")
    .replace(/\b(?:could|can|would)\s+(?:you|u)\s+/g, "")
    .replace(/\b(?:please|pls)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
  return normalized
    .split(" ")
    .map((token) => commandWordAliases[token] || token)
    .join(" ")
    .replace(/\b(?:id like to|i want to|i need to|let me)\s+/g, "")
    .trim();
}

function commandExpandForParser(value) {
  let expanded = String(value || "")
    .normalize("NFKC")
    .replace(/[’]/g, "'")
    .replace(/\bwhen's\b/gi, "when is")
    .replace(/\bwho's\b/gi, "who is")
    .replace(/\bwhat's\b/gi, "what is")
    .replace(/\blet's\b/gi, "let me")
    .replace(/\bw\s*\/\s*/gi, "with ")
    .replace(/^\s*(?:(?:could|can|would)\s+(?:you|u)|please|pls)\s+/i, "")
    .trim();
  for (const [alias, replacement] of Object.entries(commandWordAliases)) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    expanded = expanded.replace(new RegExp(`\\b${escaped}\\b`, "gi"), replacement);
  }
  return expanded
    .replace(/^\s*(?:i(?:'d| would)? like to|i want to|i need to|let me)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function commandEditDistance(left, right) {
  if (commandCentrePredictor?.damerauLevenshtein) {
    return commandCentrePredictor.damerauLevenshtein(left, right);
  }
  const a = String(left || "");
  const b = String(right || "");
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= a.length; leftIndex += 1) {
    let diagonal = row[0];
    row[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= b.length; rightIndex += 1) {
      const previous = row[rightIndex];
      row[rightIndex] = Math.min(
        row[rightIndex] + 1,
        row[rightIndex - 1] + 1,
        diagonal + (a[leftIndex - 1] === b[rightIndex - 1] ? 0 : 1)
      );
      diagonal = previous;
    }
  }
  return row[b.length];
}

function commandTokenMatches(typed, target, { allowPrefix = false } = {}) {
  if (typed === target) return { matched: true, cost: 0, prefix: false };
  if (allowPrefix && typed.length >= 2 && target.startsWith(typed)) {
    return { matched: true, cost: 0, prefix: true };
  }
  const limit = typed.length >= 8 ? 2 : typed.length >= 4 ? 1 : 0;
  const distance = Math.abs(typed.length - target.length) <= limit
    ? commandEditDistance(typed, target)
    : limit + 1;
  return { matched: distance <= limit, cost: distance, prefix: false };
}

function commandPhraseMatch(typedValue, targetValue) {
  const typed = commandNormalizeVocabulary(typedValue).split(" ").filter(Boolean);
  const target = commandNormalizeVocabulary(targetValue).split(" ").filter(Boolean);
  if (!typed.length || typed.length > target.length) return null;
  let cost = 0;
  let usedPrefix = false;
  for (let index = 0; index < typed.length; index += 1) {
    const match = commandTokenMatches(typed[index], target[index], {
      allowPrefix: index === typed.length - 1
    });
    if (!match.matched) return null;
    cost += match.cost;
    usedPrefix ||= match.prefix;
  }
  if (cost > Math.max(2, Math.floor(typed.length / 2))) return null;
  return {
    cost,
    prefix: usedPrefix || typed.length < target.length,
    exact: cost === 0 && typed.length === target.length
  };
}

function commandPredictionEntries() {
  const entries = [
    ["Open settings", "open settings", ["settings", "open settings", "show settings", "preferences"]],
    ["Open day view", "day view", ["day", "day view", "show day"]],
    ["Open week view", "week view", ["week", "week view", "show week"]],
    ["Open month view", "month view", ["month", "month view", "show month"]],
    ["Open year view", "year view", ["year", "year view", "show year"]],
    ["Connect Google Calendar", "connect Google Calendar", ["google calendar", "connect google", "sync google calendar"]],
    ["Create an event", "create an event", ["create", "create event", "new event", "schedule event"]],
    ["Find shared time", "find a time for everyone this week", ["find time", "find a time", "everyone free", "shared availability"]]
  ].map(([label, command, aliases]) => ({ label, command, aliases }));

  const roomParticipants = currentRoom?.participants || [];
  const firstNameCounts = new Map();
  for (const participant of roomParticipants) {
    const firstName = commandNormalizeVocabulary(
      String(participant?.displayName || "").trim().split(/\s+/)[0]
    );
    if (firstName) firstNameCounts.set(firstName, (firstNameCounts.get(firstName) || 0) + 1);
  }
  for (const participant of roomParticipants) {
    if (!participant?.displayName || participant.id === currentParticipant?.id) continue;
    const name = String(participant.displayName).trim();
    const firstName = name.split(/\s+/)[0];
    const firstNameIsUnique = firstNameCounts.get(commandNormalizeVocabulary(firstName)) === 1;
    const findAliases = [`find time with ${name}`, `when is ${name} free`];
    const createAliases = [`create event with ${name}`, `meet ${name}`];
    if (firstNameIsUnique) {
      findAliases.push(`find time with ${firstName}`, `when is ${firstName} free`);
      createAliases.push(`create event with ${firstName}`, `meet ${firstName}`);
    }
    entries.push(
      {
        label: `Find time with ${name}`,
        command: `find a time with ${name} this week`,
        aliases: findAliases,
        specificTerms: [name, ...(firstNameIsUnique ? [firstName] : [])]
      },
      {
        label: `Create event with ${name}`,
        command: `create an event with ${name}`,
        aliases: createAliases,
        specificTerms: [name, ...(firstNameIsUnique ? [firstName] : [])]
      }
    );
  }

  for (const event of (currentRoom?.events || []).slice(0, 80)) {
    const title = String(event?.title || "").trim();
    if (!title || title === "(No title)") continue;
    entries.push(
      {
        label: `Move ${title}`,
        command: `move ${title}`,
        aliases: [`move ${title}`, `reschedule ${title}`],
        specificTerms: [title]
      },
      {
        label: `Rename ${title}`,
        command: `rename ${title}`,
        aliases: [`rename ${title}`, `change ${title} title`],
        specificTerms: [title]
      },
      {
        label: `Duplicate ${title}`,
        command: `duplicate ${title}`,
        aliases: [`duplicate ${title}`, `copy ${title}`],
        specificTerms: [title]
      },
      {
        label: `Delete ${title}`,
        command: `delete ${title}`,
        aliases: [`delete ${title}`, `remove ${title}`, `cancel ${title}`],
        specificTerms: [title]
      }
    );
  }
  return entries;
}

function commandDynamicPrediction(value) {
  const normalized = commandNormalizeVocabulary(value);
  if (normalized.length < 2) return null;
  const typedTokens = normalized.split(" ");
  const candidates = [];
  for (const entry of commandPredictionEntries()) {
    if (entry.specificTerms?.length) {
      const hasSpecificTerm = entry.specificTerms.some((term) => (
        commandNormalizeVocabulary(term).split(" ").some((targetToken) => (
          typedTokens.some((typedToken) => commandTokenMatches(typedToken, targetToken, { allowPrefix: true }).matched)
        ))
      ));
      if (!hasSpecificTerm) continue;
    }
    for (const alias of entry.aliases) {
      const match = commandPhraseMatch(normalized, alias);
      if (!match) continue;
      const acceptedCommand = entry.command;
      const raw = String(value || "");
      const rawComparable = raw.trim().toLocaleLowerCase("en-GB");
      const acceptedComparable = acceptedCommand.toLocaleLowerCase("en-GB");
      const corrected = match.cost > 0 || commandNormalizeVocabulary(raw) !== rawComparable;
      const inlineSuffix = (
        !corrected &&
        raw === raw.trim() &&
        acceptedComparable.startsWith(rawComparable)
      ) ? acceptedCommand.slice(raw.length) : "";
      candidates.push({
        kind: match.exact ? "exact" : corrected ? "typo" : "prefix",
        label: entry.label,
        acceptedCommand,
        inlineSuffix,
        corrected,
        parseTyped: match.exact,
        rank: match.cost * 100 + (match.prefix ? 20 : 0) + acceptedCommand.length - normalized.length
      });
    }
  }
  candidates.sort((left, right) => left.rank - right.rank || left.acceptedCommand.length - right.acceptedCommand.length);
  const best = candidates[0] || null;
  if (
    best &&
    candidates.some((candidate, index) => (
      index > 0 &&
      candidate.rank === best.rank &&
      commandNormalizeVocabulary(candidate.acceptedCommand) !==
        commandNormalizeVocabulary(best.acceptedCommand)
    ))
  ) {
    return null;
  }
  return best;
}

function commandBestPrediction(value) {
  const dynamic = commandDynamicPrediction(value);
  const base = commandCentrePredictor?.predictCommand(value, {
    members: currentRoom?.participants || [],
    events: currentRoom?.events || []
  }) || null;
  if (!dynamic) return base;
  if (!base) return dynamic;
  const normalized = commandNormalizeVocabulary(value);
  const hasRoomVocabulary = (currentRoom?.participants || []).some((participant) => (
    normalized.includes(commandNormalizeVocabulary(participant.displayName).split(" ")[0])
  )) || (currentRoom?.events || []).some((event) => (
    normalized.includes(commandNormalizeVocabulary(event.title))
  ));
  return hasRoomVocabulary || dynamic.corrected || normalized.split(" ").length > 2
    ? dynamic
    : base;
}

function commandCentreTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function commandEscape(value) {
  return escapeHtml(String(value ?? ""));
}

function commandAttribute(value) {
  return escapeAttribute(String(value ?? ""));
}

function commandIntentLabel(result = {}) {
  const labels = {
    create_event: "Create event",
    find_time: "Find shared time",
    show_availability: "Show availability",
    move_event: "Move event",
    delete_event: "Delete event",
    duplicate_event: "Duplicate event",
    update_event: "Update event",
    rename_event: "Rename event",
    adjust_participants: "Update participants",
    update_participants: "Update participants",
    participant_adjustment: "Update participants",
    add_participant: "Add participant",
    remove_participant: "Remove participant",
    navigate_date: "Open date",
    navigate_view: "Switch view",
    connect_google: "Connect Google Calendar",
    update_room_code: "Change room code"
  };
  return labels[result.intent] || "Calendar command";
}

function commandSetInterpretation(result, rawCommand = commandCentreState.lastCommand, parsedCommand = rawCommand) {
  const raw = String(rawCommand || "").trim();
  const parsed = String(parsedCommand || "").trim();
  commandCentreState.interpretation = {
    label: commandIntentLabel(result),
    correction: raw && parsed && raw.toLocaleLowerCase("en-GB") !== parsed.toLocaleLowerCase("en-GB")
      ? parsed
      : ""
  };
}

function commandInterpretationMarkup() {
  const interpretation = commandCentreState.interpretation;
  if (!interpretation) return "";
  return `
    <div class="command-interpretation" aria-label="Interpreted command">
      <span>Understood</span>
      <strong>${commandEscape(interpretation.label)}</strong>
      ${interpretation.correction ? `<span>as “${commandEscape(interpretation.correction)}”</span>` : ""}
    </div>
  `;
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

function commandCreateRequestId() {
  if (!commandCentreState.createRequestId) {
    commandCentreState.createRequestId = globalThis.crypto?.randomUUID?.()
      || `command-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
  return commandCentreState.createRequestId;
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
  if (
    commandCentreState.interpretation &&
    ["needs_clarification", "preview", "results", "success", "error"].includes(commandCentreState.phase) &&
    !commandCentreBody.querySelector(".command-interpretation")
  ) {
    commandCentreBody.insertAdjacentHTML("afterbegin", commandInterpretationMarkup());
  }
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
    commandCentreInput.selectionStart !== commandCentreInput.value.length ||
    commandCentreInput.selectionEnd !== commandCentreInput.value.length
  ) {
    commandCentreClearPrediction();
    return null;
  }

  const prediction = commandBestPrediction(commandCentreInput.value);
  commandCentreState.prediction = prediction;
  commandCentreCompletionPrefix.textContent = prediction?.inlineSuffix ? commandCentreInput.value : "";
  commandCentreCompletionSuffix.textContent = prediction?.inlineSuffix || "";
  commandCentreCompletion.classList.toggle("is-visible", Boolean(prediction?.inlineSuffix));
  commandCentreSyncCompletionScroll();
  return prediction;
}

function commandCentreRenderPrediction(prediction) {
  commandCentreState.selectedIndex = 0;
  commandCentreState.interpretation = {
    label: prediction.label,
    correction: prediction.corrected ? prediction.acceptedCommand : ""
  };
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
    <div class="command-event-candidate-list command-prediction-list" role="listbox" aria-label="Predicted command">
      <button class="command-option command-prediction-option is-selected" type="button" role="option" aria-selected="true" data-command-option data-command-prediction-command="${commandAttribute(prediction.acceptedCommand)}">
        <span class="command-candidate-copy">
          <strong>${commandEscape(prediction.acceptedCommand)}</strong>
          <span>${commandEscape(detail)}</span>
        </span>
        <span>Tab to complete</span>
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
  commandCentreState.createRequestId = null;
  commandCentreState.createCommandKey = "";
  commandCentreState.deleteRequestId = null;
  commandCentreState.deleteCommandKey = "";
  commandCentreState.deleteCandidateId = null;
  commandCentreState.interpretation = null;
  commandCentreState.lastCommand = "";
  commandCentreState.pendingEventAction = null;
  commandCentreState.contextEvent = typeof activeEvent === "function" ? activeEvent() : null;
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

function commandCanManageEvent(event = {}) {
  if (typeof canManageEvent === "function") return canManageEvent(event);
  const isHost = typeof currentIsHost !== "undefined" && currentIsHost;
  return Boolean(isHost || (currentParticipant?.id && event.createdByParticipantId === currentParticipant.id));
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

function commandParticipantEditorMarkup(selectedIds = [], {
  creatorParticipantId = null,
  includeCurrent = true
} = {}) {
  const requiredIds = [
    creatorParticipantId,
    includeCurrent ? currentParticipant?.id : null
  ].filter(Boolean);
  const selected = new Set([...requiredIds, ...selectedIds].filter(Boolean));
  return `
    <div class="command-participant-editor">
      <span>Participants</span>
      <div class="command-participant-list">
        ${(currentRoom?.participants || []).map((participant) => {
          const isCurrent = participant.id === currentParticipant?.id;
          const isCreator = participant.id === creatorParticipantId;
          const required = isCreator || (includeCurrent && isCurrent);
          const suffix = [
            isCreator ? "Creator" : "",
            isCurrent ? "You" : ""
          ].filter(Boolean).join(" · ");
          return `
            <label class="command-participant-chip" style="--participant-color:${commandAttribute(participant.color)}">
              <input type="checkbox" value="${commandAttribute(participant.id)}" data-command-participant ${selected.has(participant.id) ? "checked" : ""} ${required ? "disabled" : ""} />
              <span>${commandEscape(participant.displayName)}${suffix ? ` (${commandEscape(suffix)})` : ""}</span>
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
  if (missing.includes("event")) {
    const action = {
      rename_event: "rename",
      delete_event: "delete",
      duplicate_event: "duplicate",
      add_participant: "update",
      remove_participant: "update",
      update_event: "update"
    }[result?.intent] || "move";
    return `Which event should CommonGround ${action}?`;
  }
  if (missing.includes("target_date_or_time")) return "When should the event move to?";
  if (missing.includes("title")) return "What should this event be called?";
  if (missing.includes("room_code")) return "What six-character room code should CommonGround use?";
  if (missing.includes("view")) return "Which view should CommonGround open?";
  return "";
}

function commandRecoveryCommand(suffix) {
  const base = String(commandCentreInput?.value || commandCentreState.lastCommand || "").trim().replace(/[.,;:!?]+$/, "");
  return `${base} ${suffix}`.trim();
}

function commandReplaceRecoveryToken(token, replacement) {
  const base = String(commandCentreInput?.value || commandCentreState.lastCommand || "").trim();
  if (!token) return commandRecoveryCommand(`with ${replacement}`);
  const escaped = String(token).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const replaced = base.replace(new RegExp(`\\b${escaped}\\b`, "i"), replacement);
  return replaced === base ? commandRecoveryCommand(`with ${replacement}`) : replaced;
}

function commandRecoveryMarkup(result) {
  const missing = result?.missingFields || [];
  const participantIssue = (result?.ambiguities || []).find((ambiguity) => (
    ambiguity.type === "participant_not_found" || ambiguity.type === "participant"
  ));
  const options = [];
  if (missing.includes("date")) {
    options.push(
      ["Today", commandRecoveryCommand("today")],
      ["Tomorrow", commandRecoveryCommand("tomorrow")],
      ["Next Monday", commandRecoveryCommand("next Monday")]
    );
  } else if (missing.includes("start_time") || missing.includes("target_date_or_time")) {
    options.push(
      ["9:00am", commandRecoveryCommand("at 9am")],
      ["1:00pm", commandRecoveryCommand("at 1pm")],
      ["5:00pm", commandRecoveryCommand("at 5pm")]
    );
    if (missing.includes("target_date_or_time")) {
      options.unshift(["15 minutes later", commandRecoveryCommand("15 minutes later")]);
    }
  } else if (missing.includes("date_range")) {
    options.push(
      ["This week", commandRecoveryCommand("this week")],
      ["Next week", commandRecoveryCommand("next week")],
      ["This month", commandRecoveryCommand("this month")]
    );
  } else if (missing.includes("participants") || participantIssue) {
    for (const participant of (currentRoom?.participants || []).filter((entry) => entry.id !== currentParticipant?.id).slice(0, 5)) {
      options.push([
        participant.displayName,
        commandReplaceRecoveryToken(participantIssue?.token, participant.displayName)
      ]);
    }
    if ((currentRoom?.participants || []).length > 1) {
      options.push([
        "Everyone",
        participantIssue
          ? commandReplaceRecoveryToken(participantIssue.token, "everyone")
          : commandRecoveryCommand("with everyone")
      ]);
    }
  } else if (missing.includes("event")) {
    const canUseEvent = (entry) => result?.intent === "duplicate_event" || commandCanManageEvent(entry);
    for (const event of (currentRoom?.events || []).filter(canUseEvent).slice(0, 5)) {
      const title = event.title || "(No title)";
      options.push([
        title,
        result?.eventQuery
          ? commandReplaceRecoveryToken(result.eventQuery, title)
          : commandRecoveryCommand(title)
      ]);
    }
  } else if (missing.includes("title")) {
    for (const label of ["Catch-up", "Planning", "Lunch"]) {
      options.push([label, commandRecoveryCommand(`called ${label}`)]);
    }
  }
  if (!options.length) return "";
  return `
    <div class="command-recovery" aria-label="Quick answers">
      ${options.map(([label, command]) => `
        <button type="button" data-command-recovery-command="${commandAttribute(command)}">${commandEscape(label)}</button>
      `).join("")}
    </div>
  `;
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
    ${!hasOptions ? commandRecoveryMarkup(result) : ""}
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
    ${question ? `<div class="command-clarification">${commandEscape(question)}</div>${commandRecoveryMarkup(result)}` : ""}
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
          ${commandTimePickerMarkup({
            id: "commandEventStart",
            label: "Start",
            value: startValue,
            kind: "start",
            hidden: allDay,
            disabled: allDay,
            fieldAttributes: "data-command-time-field"
          })}
          <span class="command-schedule-separator" data-command-time-separator aria-hidden="true" ${allDay ? "hidden" : ""}>–</span>
          ${commandTimePickerMarkup({
            id: "commandEventEnd",
            label: "End",
            value: endValue,
            kind: "end",
            hidden: allDay,
            disabled: allDay,
            fieldAttributes: "data-command-time-field"
          })}
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
    ${commandRecoveryMarkup(result)}
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

function commandSelectedParticipantIds({ includeCurrent = true } = {}) {
  const ids = [...commandCentreBody.querySelectorAll("[data-command-participant]:checked")]
    .map((input) => input.value);
  if (includeCurrent && currentParticipant?.id && !ids.includes(currentParticipant.id)) {
    ids.unshift(currentParticipant.id);
  }
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
    requestId: commandCreateRequestId(),
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
    if (!window.CommonGroundTimePicker?.commit(commandCentreBody)) {
      throw new Error("Pick a valid start and end time.");
    }
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
  commandCentreState.contextEvent = event;
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

function commandEventActionCandidate(result) {
  const candidates = result?.eventCandidates || [];
  if (candidates.length === 1) return candidates[0];
  const explicitId = result?.eventId || result?.targetEventId || result?.contextEventId;
  if (explicitId) return (currentRoom?.events || []).find((event) => event.id === explicitId) || null;
  if (result?.usedContextEvent && commandCentreState.contextEvent?.id) {
    return (currentRoom?.events || []).find((event) => event.id === commandCentreState.contextEvent.id) || null;
  }
  return result?.eventCandidate || result?.event || null;
}

function commandEventActionLabel(intent) {
  return {
    move_event: "move",
    delete_event: "delete",
    duplicate_event: "duplicate",
    update_event: "update",
    rename_event: "rename",
    adjust_participants: "update",
    update_participants: "update",
    participant_adjustment: "update",
    add_participant: "update",
    remove_participant: "update"
  }[intent] || "update";
}

function commandRenderEventCandidates(result) {
  const candidates = result.eventCandidates || [];
  commandCentreSetPhase("needs_clarification", `I found ${candidates.length} matching events.`);
  commandCentreState.selectedIndex = 0;
  const action = commandEventActionLabel(result.intent);
  commandCentreSetBody(`
    <div class="command-state-card">
      <h3>Which event should ${commandEscape(action)}?</h3>
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

function commandIntendedParticipantIds(result, candidate) {
  const existing = new Set(candidate.inviteeParticipantIds || candidate.invitees?.map((entry) => entry.participantId) || []);
  const additions = result.addParticipantIds || result.participantIdsToAdd || [];
  const removals = result.removeParticipantIds || result.participantIdsToRemove || [];
  additions.forEach((id) => existing.add(id));
  removals.forEach((id) => existing.delete(id));
  if (
    ["adjust_participants", "update_participants", "participant_adjustment", "add_participant", "remove_participant"].includes(result.intent) &&
    result.participantIds?.length
  ) {
    if (result.intent === "remove_participant" || result.participantAction === "remove") {
      result.participantIds.forEach((id) => existing.delete(id));
    } else {
      result.participantIds.forEach((id) => existing.add(id));
    }
  }
  return [...existing];
}

function commandRenderDeletePreview(result, candidate) {
  const commandKey = commandNormalizeVocabulary(commandCentreState.lastCommand);
  if (
    !commandCentreState.deleteRequestId ||
    commandCentreState.deleteCandidateId !== candidate.id ||
    commandCentreState.deleteCommandKey !== commandKey
  ) {
    commandCentreState.deleteRequestId = globalThis.crypto?.randomUUID?.()
      || `delete-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    commandCentreState.deleteCandidateId = candidate.id;
    commandCentreState.deleteCommandKey = commandKey;
  }
  commandCentreState.pendingEventAction = { intent: "delete_event", candidate };
  commandCentreState.contextEvent = candidate;
  if (!commandCanManageEvent(candidate)) {
    commandCentreRenderMessage("Read-only event", "Only the event creator or room host can delete this event.");
    return;
  }
  commandCentreSetPhase("confirming", "Deletion requires confirmation.");
  commandCentreSetBody(`
    <div class="command-preview-card command-destructive-preview">
      <h3>Delete “${commandEscape(candidate.title)}”?</h3>
      <p>${commandEscape(commandHumanRange(candidate.start, candidate.end))}</p>
      <p>This removes the CommonGround event and any calendar copies created through CommonGround.</p>
      <div class="command-actions">
        <button class="command-secondary-action" type="button" data-command-cancel>Keep event</button>
        <button class="command-destructive-action" type="button" data-command-confirm-delete>Delete event</button>
      </div>
    </div>
  `);
}

function commandRenderDuplicatePreview(result, candidate) {
  if (!candidate?.start || !candidate?.end) {
    commandCentreRenderMessage("Event unavailable", "The source event no longer has a complete time range.");
    return;
  }
  commandCentreState.createRequestId = null;
  const duplicate = {
    intent: "create_event",
    sourceIntent: "duplicate_event",
    title: result.newTitle || `${candidate.title || "Event"} copy`,
    start: result.targetStart || result.start || candidate.start,
    end: result.targetEnd || result.end || candidate.end,
    participantIds: result.participantIds?.length
      ? result.participantIds
      : (candidate.inviteeParticipantIds || []),
    location: candidate.location || "",
    description: candidate.description || "",
    allDay: candidate.allDay === true,
    missingFields: [],
    ambiguities: []
  };
  commandCentreState.parseResult = duplicate;
  commandCentreState.contextEvent = candidate;
  commandRenderCreatePreview(duplicate, duplicate);
}

function commandRenderUpdatePreview(result, candidate) {
  commandCentreState.pendingEventAction = { intent: result.intent, candidate };
  commandCentreState.contextEvent = candidate;
  if (!commandCanManageEvent(candidate)) {
    commandCentreRenderMessage("Read-only event", "Only the event creator or room host can change this event.");
    return;
  }
  const proposedTitle = result.newTitle || result.updatedTitle || candidate.title || "(No title)";
  const selectedParticipantIds = commandIntendedParticipantIds(result, candidate);
  commandCentreSetPhase("preview", "Event update ready for review.");
  commandCentreSetBody(`
    <div class="command-preview-card command-update-preview">
      <h3>Review event changes</h3>
      <p>${commandEscape(commandHumanRange(candidate.start, candidate.end))}</p>
      <label class="command-field">
        <span>Title</span>
        <input id="commandUpdateEventTitle" type="text" maxlength="120" value="${commandAttribute(proposedTitle)}" />
      </label>
      ${commandParticipantEditorMarkup(selectedParticipantIds, {
        creatorParticipantId: candidate.createdByParticipantId,
        includeCurrent: false
      })}
      <div class="command-actions">
        <button class="command-secondary-action" type="button" data-command-cancel>Cancel</button>
        <button class="command-primary-action" type="button" data-command-confirm-update>Save changes</button>
      </div>
    </div>
  `);
}

function commandContinueEventAction(result, candidate) {
  if (!candidate) {
    commandCentreRenderMessage("Event not found", "Try the event’s exact CommonGround title.", {
      actions: commandRecoveryMarkup({ ...result, missingFields: ["event"] })
    });
    return;
  }
  if (result.intent === "move_event") {
    commandRenderMovePreview(result, candidate);
  } else if (result.intent === "delete_event") {
    commandRenderDeletePreview(result, candidate);
  } else if (result.intent === "duplicate_event") {
    commandRenderDuplicatePreview(result, candidate);
  } else {
    commandRenderUpdatePreview(result, candidate);
  }
}

function commandRenderMovePreview(result, candidate) {
  const target = result.targetStart && result.targetEnd
    ? { start: result.targetStart, end: result.targetEnd }
    : commandMoveTargetForCandidate(result, candidate);
  commandCentreState.moveCandidate = candidate;
  commandCentreState.contextEvent = candidate;
  const question = commandMissingQuestion(result);
  commandCentreSetPhase(question ? "needs_clarification" : "preview", question || "Move preview ready.");
  commandCentreSetBody(`
    ${question ? `<div class="command-clarification">${commandEscape(question)}</div>${commandRecoveryMarkup(result)}` : ""}
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
        ${commandTimePickerMarkup({
          id: "commandMoveStart",
          label: "Start",
          value: commandLocalTimeValue(target.start),
          kind: "start"
        })}
        ${commandTimePickerMarkup({
          id: "commandMoveEnd",
          label: "End",
          value: commandLocalTimeValue(target.end),
          kind: "end"
        })}
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
    if (!window.CommonGroundTimePicker?.commit(commandCentreBody)) {
      throw new Error("Pick a valid start and end time.");
    }
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

async function commandConfirmEventUpdate() {
  if (commandCentreState.phase === "saving" || !currentRoom?.code) return;
  const candidate = commandCentreState.pendingEventAction?.candidate || commandCentreState.contextEvent;
  if (!candidate || !commandCanManageEvent(candidate)) {
    commandSetPreviewError("This event is no longer editable.");
    return;
  }
  const title = commandCentreBody.querySelector("#commandUpdateEventTitle")?.value.trim();
  if (!title) {
    commandSetPreviewError("Add an event title.");
    return;
  }
  const action = commandCentreBody.querySelector("[data-command-confirm-update]");
  if (action) {
    action.disabled = true;
    action.textContent = "Saving…";
  }
  commandCentreSetPhase("saving", "Updating event.");
  try {
    const updateAction = window.CommonGroundCommandActions?.updateCalendarEvent;
    if (typeof updateAction !== "function") {
      throw new Error("Event updates are temporarily unavailable. Open the event to edit it directly.");
    }
    const outcome = await updateAction(
      candidate.id,
      {
        title,
        inviteeParticipantIds: commandSelectedParticipantIds({ includeCurrent: false })
      },
      { expectedUpdatedAt: candidate.updatedAt || candidate.createdAt }
    );
    if (!outcome.success) throw Object.assign(new Error(outcome.message), { code: outcome.code });
    commandCentreState.contextEvent = outcome.payload.event;
    commandCentreState.pendingEventAction = null;
    commandCentreRenderSuccess(outcome.payload.event, "Event updated");
  } catch (error) {
    commandSetPreviewError(error.message || "The event could not be updated.");
    if (action) {
      action.disabled = false;
      action.textContent = "Save changes";
    }
  }
}

async function commandConfirmEventDelete() {
  if (commandCentreState.phase === "saving" || !currentRoom?.code) return;
  const candidate = commandCentreState.pendingEventAction?.candidate;
  if (!candidate || !commandCanManageEvent(candidate)) {
    commandCentreRenderMessage("Event unavailable", "This event can no longer be deleted.");
    return;
  }
  const action = commandCentreBody.querySelector("[data-command-confirm-delete]");
  if (action) {
    action.disabled = true;
    action.textContent = "Deleting…";
  }
  commandCentreSetPhase("saving", "Deleting event.");
  try {
    const deleteAction = window.CommonGroundCommandActions?.deleteCalendarEvent;
    if (typeof deleteAction !== "function") {
      throw new Error("Event deletion is temporarily unavailable. Open the event to delete it directly.");
    }
    const outcome = await deleteAction(candidate.id, {
      expectedUpdatedAt: candidate.updatedAt || candidate.createdAt,
      requestId: commandCentreState.deleteRequestId
    });
    if (!outcome.success) throw Object.assign(new Error(outcome.message), { code: outcome.code });
    commandCentreState.pendingEventAction = null;
    commandCentreState.contextEvent = null;
    commandCentreState.deleteRequestId = null;
    commandCentreState.deleteCommandKey = "";
    commandCentreState.deleteCandidateId = null;
    commandCentreRenderMessage("Event deleted", `${candidate.title} was removed.`, {
      phase: "success",
      actions: '<button class="command-primary-action" type="button" data-command-close>Done</button>'
    });
  } catch (error) {
    commandSetPreviewError(error.message || "The event could not be deleted.");
    if (action) {
      action.disabled = false;
      action.textContent = "Delete event";
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

function commandCurrentCreateContext() {
  const result = commandCentreState.parseResult;
  const titleInput = commandCentreBody.querySelector("#commandEventTitle");
  if (!titleInput && result?.intent !== "create_event") return null;
  const date = commandCentreBody.querySelector("#commandEventDate")?.value;
  const startTime = commandCentreBody.querySelector("#commandEventStart")?.value;
  const endTime = commandCentreBody.querySelector("#commandEventEnd")?.value;
  let start = result?.start || null;
  let end = result?.end || null;
  if (date && startTime) {
    const nextStart = new Date(`${date}T${startTime}`);
    if (!Number.isNaN(nextStart.getTime())) start = nextStart.toISOString();
  }
  if (date && endTime) {
    const nextEnd = new Date(`${date}T${endTime}`);
    if (!Number.isNaN(nextEnd.getTime())) {
      if (start && nextEnd <= new Date(start) && endTime === "00:00") nextEnd.setDate(nextEnd.getDate() + 1);
      end = nextEnd.toISOString();
    }
  }
  return {
    ...(result || {}),
    intent: "create_event",
    title: titleInput?.value.trim() || result?.title || "",
    start,
    end,
    participantIds: titleInput ? commandSelectedParticipantIds() : (result?.participantIds || []),
    location: commandCentreBody.querySelector("#commandEventLocation")?.value.trim() || result?.location || "",
    description: commandCentreBody.querySelector("#commandEventDescription")?.value.trim() || result?.description || "",
    allDay: commandCentreBody.querySelector("#commandEventAllDay")?.checked === true || result?.allDay === true,
    missingFields: [...(result?.missingFields || [])],
    ambiguities: []
  };
}

function commandCurrentMoveContext() {
  const candidate = commandCentreState.moveCandidate || commandCentreState.contextEvent;
  if (!candidate || !commandCanManageEvent(candidate)) return null;
  try {
    if (commandCentreBody.querySelector("#commandMoveDate")) {
      const draft = commandReadMoveDraft();
      return { candidate, start: draft.start, end: draft.end };
    }
  } catch {
    // Fall back to the last complete target below.
  }
  const result = commandCentreState.parseResult || {};
  if (result.targetStart && result.targetEnd) {
    return { candidate, start: result.targetStart, end: result.targetEnd };
  }
  return { candidate, start: candidate.start, end: candidate.end };
}

function commandDurationFromWords(text) {
  if (/\bhalf (?:an )?hour\b/.test(text)) return 30;
  if (/\b(?:an|one) hour\b/.test(text)) return 60;
  const match = text.match(/\b(\d{1,3})\s*(minutes?|hours?)\b/);
  if (!match) return null;
  const amount = Number(match[1]);
  return match[2].startsWith("hour") ? amount * 60 : amount;
}

function commandResolveMember(value) {
  const phrase = commandNormalizeVocabulary(value);
  const matches = [];
  for (const participant of currentRoom?.participants || []) {
    if (participant.id === currentParticipant?.id) continue;
    const full = commandNormalizeVocabulary(participant.displayName);
    const first = full.split(" ")[0];
    if (phrase === full || phrase === first) {
      matches.push({ participant, score: 0 });
      continue;
    }
    const fullDistance = commandEditDistance(phrase, full);
    const firstDistance = commandEditDistance(phrase, first);
    const score = Math.min(fullDistance, firstDistance);
    const limit = phrase.length >= 8 ? 2 : phrase.length >= 4 ? 1 : 0;
    if (score <= limit) matches.push({ participant, score });
  }
  matches.sort((left, right) => left.score - right.score);
  const bestScore = matches[0]?.score;
  const best = matches.filter((entry) => entry.score === bestScore);
  return best.length === 1 ? best[0].participant : null;
}

function commandRenderContextPreviewMessage(message) {
  commandCentreStatus.textContent = message;
  commandCentreSetPhase("preview", message);
}

function commandApplyDurationContext(durationMinutes) {
  if (!Number.isFinite(durationMinutes) || durationMinutes < 15 || durationMinutes > 24 * 60) return false;
  const create = commandCurrentCreateContext();
  if (create?.start) {
    const start = new Date(create.start);
    const next = {
      ...create,
      end: new Date(start.getTime() + durationMinutes * 60000).toISOString(),
      durationMinutes,
      missingFields: create.missingFields.filter((field) => field !== "start_time")
    };
    commandCentreState.parseResult = next;
    commandRenderCreatePreview(next, next);
    commandRenderContextPreviewMessage(`Duration updated to ${durationMinutes} minutes.`);
    return true;
  }
  const move = commandCurrentMoveContext();
  if (!move) return false;
  const next = {
    ...(commandCentreState.parseResult || {}),
    intent: "move_event",
    targetStart: move.start,
    targetEnd: new Date(new Date(move.start).getTime() + durationMinutes * 60000).toISOString(),
    durationMinutes,
    missingFields: []
  };
  commandCentreState.parseResult = next;
  commandRenderMovePreview(next, move.candidate);
  commandRenderContextPreviewMessage(`Duration updated to ${durationMinutes} minutes.`);
  return true;
}

function commandApplyShiftContext(deltaMinutes) {
  if (!Number.isFinite(deltaMinutes) || !deltaMinutes || Math.abs(deltaMinutes) > 14 * 24 * 60) return false;
  const create = commandCurrentCreateContext();
  if (create?.start && create?.end) {
    const next = {
      ...create,
      start: new Date(new Date(create.start).getTime() + deltaMinutes * 60000).toISOString(),
      end: new Date(new Date(create.end).getTime() + deltaMinutes * 60000).toISOString(),
      missingFields: create.missingFields.filter((field) => !["date", "start_time", "target_date_or_time"].includes(field))
    };
    commandCentreState.parseResult = next;
    commandRenderCreatePreview(next, next);
    commandRenderContextPreviewMessage(`Event shifted ${Math.abs(deltaMinutes)} minutes ${deltaMinutes > 0 ? "later" : "earlier"}.`);
    return true;
  }
  const move = commandCurrentMoveContext();
  if (!move) return false;
  const next = {
    ...(commandCentreState.parseResult || {}),
    intent: "move_event",
    targetStart: new Date(new Date(move.start).getTime() + deltaMinutes * 60000).toISOString(),
    targetEnd: new Date(new Date(move.end).getTime() + deltaMinutes * 60000).toISOString(),
    missingFields: []
  };
  commandCentreState.parseResult = next;
  commandRenderMovePreview(next, move.candidate);
  commandRenderContextPreviewMessage(`Event shifted ${Math.abs(deltaMinutes)} minutes ${deltaMinutes > 0 ? "later" : "earlier"}.`);
  return true;
}

function commandApplyParticipantContext(memberText) {
  const create = commandCurrentCreateContext();
  const participant = commandResolveMember(memberText);
  if (!participant) return false;
  if (!create) {
    const candidate = commandCentreState.moveCandidate || commandCentreState.contextEvent;
    if (!candidate || !commandCanManageEvent(candidate)) return false;
    const result = {
      intent: "update_participants",
      addParticipantIds: [participant.id],
      missingFields: [],
      ambiguities: []
    };
    commandCentreState.parseResult = result;
    commandRenderUpdatePreview(result, candidate);
    commandRenderContextPreviewMessage(`${participant.displayName} will be added when you save.`);
    return true;
  }
  const participantIds = [...new Set([...(create.participantIds || []), participant.id])];
  const next = {
    ...create,
    participantIds,
    missingFields: create.missingFields.filter((field) => field !== "participants")
  };
  commandCentreState.parseResult = next;
  commandRenderCreatePreview(next, next);
  commandRenderContextPreviewMessage(`${participant.displayName} added to the pending event.`);
  return true;
}

function commandTryContextualFollowUp(rawCommand) {
  const text = commandNormalizeVocabulary(rawCommand);
  const contextual = /\b(?:that|it|event)\b/.test(text) || /^(?:add|invite|include)\b/.test(text);
  if (!contextual) return false;

  if (/^(?:make|set|change)\b/.test(text) && /\b(?:minutes?|hours?)\b/.test(text)) {
    const duration = commandDurationFromWords(text);
    return duration ? commandApplyDurationContext(duration) : false;
  }

  const shift = text.match(/^(?:move|shift|push)\s+(?:that|it|event)(?:\s+by)?\s+(.+?)\s+(later|forward|earlier|back)$/);
  if (shift) {
    const duration = commandDurationFromWords(shift[1]);
    if (!duration) return false;
    return commandApplyShiftContext(["earlier", "back"].includes(shift[2]) ? -duration : duration);
  }

  const member = text.match(/^(?:add|invite|include)\s+(.+)$/);
  const memberName = member?.[1]?.replace(/\s+to\s+(?:that|it|event)$/, "").trim();
  if (memberName && commandApplyParticipantContext(memberName)) return true;

  const candidate = commandCentreState.moveCandidate || commandCentreState.contextEvent;
  if (!candidate || !commandCanManageEvent(candidate)) return false;
  const rename = String(rawCommand || "").trim().match(
    /^(?:rename|call|name)\s+(?:that|it|event)(?:\s+to)?\s+(.+)$/i
  );
  if (rename?.[1]) {
    const result = {
      intent: "rename_event",
      newTitle: rename[1].trim(),
      missingFields: [],
      ambiguities: []
    };
    commandCentreState.parseResult = result;
    commandRenderUpdatePreview(result, candidate);
    commandRenderContextPreviewMessage("The new title is ready for review.");
    return true;
  }
  if (/^(?:delete|remove|cancel)\s+(?:that|it|event)$/.test(text)) {
    commandRenderDeletePreview({ intent: "delete_event" }, candidate);
    return true;
  }
  if (/^(?:duplicate|copy)\s+(?:that|it|event)$/.test(text)) {
    commandRenderDuplicatePreview({ intent: "duplicate_event" }, candidate);
    return true;
  }
  return false;
}

function commandSafeContextEventId() {
  const eventId = commandCentreState.moveCandidate?.id || commandCentreState.contextEvent?.id;
  if (!eventId) return null;
  return (currentRoom?.events || []).some((event) => event.id === eventId) ? eventId : null;
}

function commandContinueParsedResult(result, { submitted = false } = {}) {
  const previousResult = commandCentreState.parseResult;
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
    const commandKey = commandNormalizeVocabulary(commandCentreState.lastCommand);
    if (previousResult?.intent !== "create_event" || commandCentreState.createCommandKey !== commandKey) {
      commandCentreState.createRequestId = null;
      commandCentreState.createCommandKey = commandKey;
    }
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
  if ([
    "move_event",
    "delete_event",
    "duplicate_event",
    "update_event",
    "rename_event",
    "adjust_participants",
    "update_participants",
    "participant_adjustment",
    "add_participant",
    "remove_participant"
  ].includes(result.intent)) {
    const candidates = result.eventCandidates || [];
    const candidate = commandEventActionCandidate(result);
    if (!candidate && candidates.length > 1) {
      commandRenderEventCandidates(result);
      return;
    }
    if (!candidate) {
      commandCentreRenderMessage("Event not found", "Try the event’s exact CommonGround title.", {
        actions: commandRecoveryMarkup({ ...result, missingFields: ["event"] })
      });
      return;
    }
    commandContinueEventAction(result, candidate);
    return;
  }
  commandRenderNavigate(result);
}

async function processUserIntent(inputText, { submitted = true } = {}) {
  const rawCommand = String(inputText || "").trim();
  const command = commandExpandForParser(rawCommand);
  commandCentreState.lastCommand = rawCommand;
  if (rawCommand.length < 2 || !currentRoom?.code) {
    commandCentreRenderIntro();
    return {
      success: false,
      message: currentRoom?.code ? "Enter a calendar command." : "Open a room before using Command Centre."
    };
  }
  if (submitted) {
    commandCentreState.interpretation = {
      label: "Update pending event",
      correction: command !== rawCommand ? command : ""
    };
  }
  if (submitted && commandTryContextualFollowUp(rawCommand)) {
    return {
      success: true,
      message: "The pending event preview was updated.",
      payload: commandCentreState.parseResult
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
        timezone: commandCentreTimezone(),
        contextEventId: commandSafeContextEventId()
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
    commandSetInterpretation(data.result, rawCommand, command);
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
  commandCentreState.createRequestId = null;
  commandCentreState.createCommandKey = "";
  commandCentreState.deleteRequestId = null;
  commandCentreState.deleteCommandKey = "";
  commandCentreState.deleteCandidateId = null;
  commandCentreState.interpretation = null;
  commandCentreState.lastCommand = "";
  commandCentreState.contextEvent = null;
  commandCentreState.pendingEventAction = null;
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
  const recoveryButton = event.target.closest("[data-command-recovery-command]");
  if (recoveryButton) {
    commandCentreInput.value = recoveryButton.dataset.commandRecoveryCommand;
    commandCentreInput.setSelectionRange(commandCentreInput.value.length, commandCentreInput.value.length);
    commandCentreClearPrediction();
    await requestCommandParse({ submitted: true });
    return;
  }
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
    if (candidate) commandContinueEventAction(commandCentreState.parseResult, candidate);
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
  if (event.target.closest("[data-command-confirm-update]")) {
    await commandConfirmEventUpdate();
    return;
  }
  if (event.target.closest("[data-command-confirm-delete]")) {
    await commandConfirmEventDelete();
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
