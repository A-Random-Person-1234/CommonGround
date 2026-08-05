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
let commandCentreOptionSequence = 0;

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
    .replace(/[â€™']/g, "")
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
    .replace(/[â€™]/g, "'")
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
    correction: raw &&ß^õÒÚ$z{-®éÜj×Ğ¢6öç7B7F'D†÷W"Ò7F'BævWD†÷W'2‚’²7F'BævWDÖ–çWFW2‚’òc°Ğ¢6öç7BVæD†÷W"ÒVæBãÒF”VæBò#B¢VæBævWD†÷W'2‚’²VæBævWDÖ–çWFW2‚’òc°Ğ¢–b†VæD†÷W"ÃÒ7F'D†÷W"’6öçF–çVS°Ğ¢6öç7B&Æö6²ÒFö7VÖVçBæ7&VFTVÆVÖVçB‚&F—b"“°Ğ¢&Æö6²æ6Æ74æÖRÒ&6öÖÖæBÖf–Æ&–Æ—G’Ö&Æö6²#°Ğ¢&Æö6²ç7G–ÆRç6WE&÷W'G’‚"ÒÖF’Ö–æFW‚"Â7G&–ær†F”–æFW‚’“°Ğ¢&Æö6²ç7G–ÆRç6WE&÷W'G’‚"Ò×7F'B"Â7G&–ær‡7F'D†÷W"Ò6ÆVæF%7F'D†÷W"’“°Ğ¢&Æö6²ç7G–ÆRç6WE&÷W'G’‚"ÒÖGW&F–öâ"Â7G&–ær†VæD†÷W"Ò7F'D†÷W"’“°Ğ¢&Æö6²ç6WDGG&–'WFR‚&&–Ö†–FFVâ"Â'G'VR"“°Ğ¢6öç7BF—FÆRÒFö7VÖVçBæ7&VFTVÆVÖVçB‚'7G&öær"“°Ğ¢6öç7BF–ÖRÒFö7VÖVçBæ7&VFTVÆVÖVçB‚'7â"“°Ğ¢F—FÆRçFW‡D6öçFVçBÒ%6†&VBg&VRF–ÖR#°Ğ¢F–ÖRçFW‡D6öçFVçBÒf÷&ÖDWfVçE&ævR‡7F'D†÷W"ÂVæD†÷W"“°Ğ¢&Æö6²æVæB‡F—FÆRÂF–ÖR“°Ğ¢WfVçG4Æ–W"æVæD6†–ÆB†&Æö6²“°Ğ¢ĞĞ¢ĞĞ§Ó°Ğ Ğ§v–æF÷ræ6öÖÖæD6VçG&U&W6WBÒ‚’Óâ°Ğ¢6öÖÖæD6VçG&U7FFRæ†–v†Æ–v‡BÒçVÆÃ°Ğ¢6öÖÖæD6VçG&U7FFRç'6U&W7VÇBÒçVÆÃ°Ğ¢6öÖÖæD6VçG&U7FFRæf–Æ&–Æ—G’ÒçVÆÃ°Ğ¢6öÖÖæD6VçG&U7FFRæÖ÷fT6æF–FFRÒçVÆÃ°Ğ¢6öÖÖæD6VçG&U7FFRæ6öæfÆ–7DG&gBÒçVÆÃ°Ğ¢6öÖÖæD6VçG&U7FFRæ6ö×÷6–ærÒfÇ6S°Ğ¢6öÖÖæD6VçG&U7FFRæææ÷Væ6VE&VF–7F–öâÒçVÆÃ°Ğ¢6öÖÖæD6VçG&U7FFRæ7&VFUF—FÆU7VvvW7F–öâÒ"#°Ğ¢6öÖÖæD6VçG&U7FFRæ7&VFU&WVW7D–BÒçVÆÃ°Ğ¢6öÖÖæD6VçG&U7FFRæ7&VFT6öÖÖæD¶W’Ò"#°Ğ¢6öÖÖæD6VçG&U7FFRæFVÆWFU&WVW7D–BÒçVÆÃ°Ğ¢6öÖÖæD6VçG&U7FFRæFVÆWFT6öÖÖæD¶W’Ò"#°Ğ¢6öÖÖæD6VçG&U7FFRæFVÆWFT6æF–FFT–BÒçVÆÃ°Ğ¢6öÖÖæD6VçG&U7FFRæ–çFW'&WFF–öâÒçVÆÃ°Ğ¢6öÖÖæD6VçG&U7FFRæÆ7D6öÖÖæBÒ"#°Ğ¢6öÖÖæD6VçG&U7FFRæ6öçFW‡DWfVçBÒçVÆÃ°Ğ¢6öÖÖæD6VçG&U7FFRçVæF–ætWfVçD7F–öâÒçVÆÃ°Ğ¢6öÖÖæD6VçG&T6ÆV$FV&÷Væ6R‚“°Ğ¢6öÖÖæD6VçG&T&÷'E&WVW7B‚“°Ğ¢6öÖÖæD6VçG&T6ÆV%&VF–7F–öâ‚“°Ğ¢–b†6öÖÖæD6VçG&TF–Æöræ÷Vâ’6Æ÷6T6öÖÖæD6VçG&R‡²&W7F÷&Tfö7W3¢fÇ6RÂ–ÖÖVF–FS¢G'VRÒ“°Ğ§Ó°Ğ Ğ¦6öÖÖæD6VçG&T'WGFöãòæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ°Ğ¢–b†6öÖÖæD6VçG&TF–Æöræ÷Vâ’6Æ÷6T6öÖÖæD6VçG&R‚“°Ğ¢VÇ6R÷Vä6öÖÖæD6VçG&R†6öÖÖæD6VçG&T'WGFöâ“°Ğ§Ò“°Ğ Ğ¦6öÖÖæD6VçG&T6Æ÷6T'WGFöãòæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â‚’Óâ6Æ÷6T6öÖÖæD6VçG&R‚’“°Ğ Ğ¦6öÖÖæD6VçG&T–çWCòæFDWfVçDÆ—7FVæW"‚&–çWB"Â6öÖÖæD6VçG&T†æFÆT–çWB“°Ğ¦6öÖÖæD6VçG&T–çWCòæFDWfVçDÆ—7FVæW"‚&6ö×÷6—F–öç7F'B"Â‚’Óâ°Ğ¢6öÖÖæD6VçG&U7FFRæ6ö×÷6–ærÒG'VS°Ğ¢6öÖÖæD6VçG&T6ÆV$FV&÷Væ6R‚“°Ğ¢6öÖÖæD6VçG&T&÷'E&WVW7B‚“°Ğ¢6öÖÖæD6VçG&T6ÆV%&VF–7F–öâ‚“°Ğ¢6öÖÖæD6VçG&U&VæFW$–çG&ò‚“°Ğ§Ò“°Ğ¦6öÖÖæD6VçG&T–çWCòæFDWfVçDÆ—7FVæW"‚&6ö×÷6—F–öæVæB"Â‚’Óâ°Ğ¢6öÖÖæD6VçG&U7FFRæ6ö×÷6–ærÒfÇ6S°Ğ¢6öÖÖæD6VçG&T†æFÆT–çWB‚“°Ğ§Ò“°Ğ¦6öÖÖæD6VçG&T–çWCòæFDWfVçDÆ—7FVæW"‚'67&öÆÂ"Â6öÖÖæD6VçG&U7–æ46ö×ÆWF–öå67&öÆÂ“°Ğ¦6öÖÖæD6VçG&T–çWCòæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â6öÖÖæD6VçG&UWFFU&VF–7F–öâ“°Ğ¦6öÖÖæD6VçG&T–çWCòæFDWfVçDÆ—7FVæW"‚&¶W—W"Â†WfVçB’Óâ°Ğ¢–b‚²%F""Â$'&÷u&–v‡B%Òæ–æ6ÇVFW2†WfVçBæ¶W’’’6öÖÖæD6VçG&UWFFU&VF–7F–öâ‚“°Ğ§Ò“°Ğ Ğ¦6öÖÖæD6VçG&Tf÷&ÓòæFDWfVçDÆ—7FVæW"‚'7V&Ö—B"Â†WfVçB’Óâ°Ğ¢WfVçBç&WfVçDFVfVÇB‚“°Ğ¢–b†6öÖÖæD6VçG&U7FFRæ6ö×÷6–ær’&WGW&ã°Ğ¢6öç7B6VÆV7F&ÆT÷F–öç2Ò6öÖÖæD6VçG&U6VÆV7F&ÆT÷F–öç2‚“°Ğ¢6öç7B†5&VF–7F–öä÷F–öâÒ&ööÆVâ€Ğ¢6öÖÖæD6VçG&T&öG’çVW'•6VÆV7F÷"‚%¶FFÖ6öÖÖæB×&VF–7F–öâÖ6öÖÖæEÒ"Ğ¢“°Ğ¢6öç7B–çWDÖF6†W5&VæFW&VD6öÖÖæBÒ€Ğ¢6öÖÖæDæ÷&ÖÆ—¦Ufö6'VÆ'’†6öÖÖæD6VçG&T–çWBçfÇVR’ÓÓĞĞ¢6öÖÖæDæ÷&ÖÆ—¦Ufö6'VÆ'’†6öÖÖæD6VçG&U7FFRæÆ7D6öÖÖæBĞ¢“°Ğ¢–b€Ğ¢6öÖÖæD6VçG&U7FFRç†6RÓÓÒ'&W7VÇG2"b`Ğ¢6VÆV7F&ÆT÷F–öç2æÆVæwF‚b`Ğ¢††5&VF–7F–öä÷F–öâÇÂ–çWDÖF6†W5&VæFW&VD6öÖÖæBĞ¢’°Ğ¢6öÖÖæD6VçG&T7F—fFU6VÆV7FVB‚“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢&WVW7D6öÖÖæE'6R‡²7V&Ö—GFVC¢G'VRÒ“°Ğ§Ò“°Ğ Ğ¦6öÖÖæD6VçG&T&öG“òæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â7–æ2†WfVçB’Óâ°Ğ¢6öç7B&V6÷fW'”'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæB×&V6÷fW'’Ö6öÖÖæEÒ"“°Ğ¢–b‡&V6÷fW'”'WGFöâ’°Ğ¢6öÖÖæD6VçG&T–çWBçfÇVRÒ&V6÷fW'”'WGFöâæFF6WBæ6öÖÖæE&V6÷fW'”6öÖÖæC°Ğ¢6öÖÖæD6VçG&T–çWBç6WE6VÆV7F–öå&ævR†6öÖÖæD6VçG&T–çWBçfÇVRæÆVæwF‚Â6öÖÖæD6VçG&T–çWBçfÇVRæÆVæwF‚“°Ğ¢6öÖÖæD6VçG&T6ÆV%&VF–7F–öâ‚“°Ğ¢v—B&WVW7D6öÖÖæE'6R‡²7V&Ö—GFVC¢G'VRÒ“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢6öç7B&VF–7F–öä'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæB×&VF–7F–öâÖ6öÖÖæEÒ"“°Ğ¢–b‡&VF–7F–öä'WGFöâ’°Ğ¢6öÖÖæD6VçG&T–çWBçfÇVRÒ&VF–7F–öä'WGFöâæFF6WBæ6öÖÖæE&VF–7F–öä6öÖÖæC°Ğ¢6öÖÖæD6VçG&T6ÆV%&VF–7F–öâ‚“°Ğ¢v—B&WVW7D6öÖÖæE'6R‡²7V&Ö—GFVC¢G'VRÒ“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢6öç7BW†×ÆRÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæBÖW†×ÆUÒ"“°Ğ¢–b†W†×ÆR’°Ğ¢6öÖÖæD6VçG&T–çWBçfÇVRÒW†×ÆRæFF6WBæ6öÖÖæDW†×ÆS°Ğ¢6öÖÖæD6VçG&T6ÆV%&VF–7F–öâ‚“°Ğ¢v—B&WVW7D6öÖÖæE'6R‡²7V&Ö—GFVC¢G'VRÒ“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢–b†WfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæBÖ6æ6VÅÒÂ¶FFÖ6öÖÖæBÖ6Æ÷6UÒ"’’°Ğ¢6Æ÷6T6öÖÖæD6VçG&R‚“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢–b†WfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæBÖVF—BÖ6öæfÆ–7EÒ"’’°Ğ¢6öç7BG&gBÒ6öÖÖæD6VçG&U7FFRæ6öæfÆ–7DG&gC°Ğ¢–b†G&gB’°Ğ¢6öÖÖæE&VæFW$7&VFU&Wf–Wr‡°Ğ¢ââæ6öÖÖæD6VçG&U7FFRç'6U&W7VÇBÀĞ¢–çFVçC¢&7&VFUöWfVçB"ÀĞ¢F—FÆS¢G&gBçF—FÆRÀĞ¢7F'C¢G&gBç7F'BÀĞ¢VæC¢G&gBæVæBÀĞ¢'F–6—çD–G3¢G&gBæ–çf—FVU'F–6—çD–G2ÀĞ¢Æö6F–öã¢G&gBæÆö6F–öâÀĞ¢FW67&—F–öã¢G&gBæFW67&—F–öâÀĞ¢ÆÄF“¢G&gBæÆÄF’ÓÓÒG'VRÀĞ¢Ö—76–ætf–VÆG3¢µÒÀĞ¢Ö&–wV—F–W3¢µĞĞ¢Ò“°Ğ¢ĞĞ¢&WGW&ã°Ğ¢ĞĞ¢6öç7B'F–6—çD÷F–öâÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæB×'F–6—çBÖ÷F–öåÒ"“°Ğ¢–b‡'F–6—çD÷F–öâ’°Ğ¢6öç7B&W7VÇBÒ°Ğ¢ââæ6öÖÖæD6VçG&U7FFRç'6U&W7VÇBÀĞ¢'F–6—çD–G3¢°Ğ¢âââ†6öÖÖæD6VçG&U7FFRç'6U&W7VÇBç'F–6—çD–G2ÇÂµÒ’ÀĞ¢'F–6—çD÷F–öâæFF6WBæ6öÖÖæE'F–6—çD÷F–öàĞ¢ÒÀĞ¢Ö&–wV—F–W3¢†6öÖÖæD6VçG&U7FFRç'6U&W7VÇBæÖ&–wV—F–W2ÇÂµÒ’ç6Æ–6RƒĞ¢Ó°Ğ¢6öÖÖæD6öçF–çVU'6VE&W7VÇB‡&W7VÇBÂ²7V&Ö—GFVC¢G'VRÒ“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢6öç7B6Æ÷D'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæB×6Æ÷BÖ–æFW…Ò"“°Ğ¢–b‡6Æ÷D'WGFöâ’°Ğ¢6öç7B6Æ÷BÒ6öÖÖæD6VçG&U7FFRæf–Æ&–Æ—G“òç6Æ÷G3òå´çVÖ&W"‡6Æ÷D'WGFöâæFF6WBæ6öÖÖæE6Æ÷D–æFW‚•Ó°Ğ¢–b‚6Æ÷B’&WGW&ã°Ğ¢–b†6öÖÖæD6VçG&U7FFRç'6U&W7VÇBæ–çFVçBÓÓÒ'6†÷uöf–Æ&–Æ—G’"’°Ğ¢v—B6öÖÖæE6†÷tf–Æ&–Æ—G”öä6ÆVæF"‚“°Ğ¢ÒVÇ6R°Ğ¢6öÖÖæD7&VFTG&gDg&öÕ6Æ÷B†6öÖÖæD6VçG&U7FFRç'6U&W7VÇBÂ6Æ÷B“°Ğ¢ĞĞ¢&WGW&ã°Ğ¢ĞĞ¢6öç7B6æF–FFT'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæBÖWfVçBÖ6æF–FFUÒ"“°Ğ¢–b†6æF–FFT'WGFöâ’°Ğ¢6öç7B6æF–FFRÒ6öÖÖæD6VçG&U7FFRç'6U&W7VÇBæWfVçD6æF–FFW0Ğ¢æf–æB‚†VçG'’’ÓâVçG'’æ–BÓÓÒ6æF–FFT'WGFöâæFF6WBæ6öÖÖæDWfVçD6æF–FFR“°Ğ¢–b†6æF–FFR’6öÖÖæD6öçF–çVTWfVçD7F–öâ†6öÖÖæD6VçG&U7FFRç'6U&W7VÇBÂ6æF–FFR“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢6öç7Bæf–vF–öä'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæBÖæf–vFRÖ¶–æEÒ"“°Ğ¢–b†æf–vF–öä'WGFöâ’°Ğ¢v—B6öÖÖæDW†V7WFTæf–vF–öâ†æf–vF–öä'WGFöâ“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢6öç7Bf–Wt'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæBÖ÷Vâ×f–WuÒ"“°Ğ¢–b‡f–Wt'WGFöâ’°Ğ¢v—B6öÖÖæDW†V7WFUf–Wr‡f–Wt'WGFöâæFF6WBæ6öÖÖæD÷Våf–Wr“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢–b†WfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæBÖ6öææV7BÖvöövÆUÒ"’’°Ğ¢6öÖÖæDW†V7WFTvöövÆT6öææV7B‚“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢6öç7B&ööÔ6öFT'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæB×WFFR×&ööÒÖ6öFUÒ"“°Ğ¢–b‡&ööÔ6öFT'WGFöâ’°Ğ¢v—B6öÖÖæDW†V7WFU&ööÔ6öFR‡&ööÔ6öFT'WGFöâæFF6WBæ6öÖÖæEWFFU&ööÔ6öFR“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢–b†WfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæBÖ6öæf—&ÒÖ7&VFUÒ"’’°Ğ¢v—B6öÖÖæD6öæf—&Ô7&VFR‚“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢–b†WfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæBÖ÷VâÖ7&VFUÒ"’’°Ğ¢v—B6öÖÖæD÷Vä7&VFT6ö×÷6W"‚“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢–b†WfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæBÖ6öæf—&ÒÖÖ÷fUÒ"’’°Ğ¢v—B6öÖÖæD6öæf—&ÔÖ÷fR‚“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢–b†WfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæBÖ6öæf—&Ò×WFFUÒ"’’°Ğ¢v—B6öÖÖæD6öæf—&ÔWfVçEWFFR‚“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢–b†WfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæBÖ6öæf—&ÒÖFVÆWFUÒ"’’°Ğ¢v—B6öÖÖæD6öæf—&ÔWfVçDFVÆWFR‚“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢–b†WfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæB×6V&6‚Öf–Æ&–Æ—G•Ò"’’°Ğ¢v—B6öÖÖæDÆöDf–Æ&–Æ—G’†6öÖÖæD6VçG&U7FFRç'6U&W7VÇB“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢–b†WfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæBÖ6öçF–çVRÖf–Æ&–Æ—G•Ò"’’°Ğ¢G'’°Ğ¢6öç7B&W7VÇBÒ6öÖÖæDf–Æ&–Æ—G•&WVW7Dg&öÔ6Æ&–f–6F–öâ†6öÖÖæD6VçG&U7FFRç'6U&W7VÇB“°Ğ¢6öÖÖæD6VçG&U7FFRç'6U&W7VÇBÒ&W7VÇC°Ğ¢v—B6öÖÖæDÆöDf–Æ&–Æ—G’‡&W7VÇB“°Ğ¢Ò6F6‚†W'&÷"’°Ğ¢6öÖÖæE6WE&Wf–WtW'&÷"†W'&÷"æÖW76vR“°Ğ¢ĞĞ¢&WGW&ã°Ğ¢ĞĞ¢–b†WfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæB×6†÷rÖf–Æ&–Æ—G•Ò"’’°Ğ¢v—B6öÖÖæE6†÷tf–Æ&–Æ—G”öä6ÆVæF"‚“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢–b†WfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæB×VæFòÖ7&VFUÒ"’’°Ğ¢v—BVæFôÆ7DWfVçD7&VF–öâ‚“°Ğ¢6öÖÖæD6VçG&U7FFRæ6öæfÆ–7DG&gBÒçVÆÃ°Ğ¢6öÖÖæD6VçG&U&VæFW$ÖW76vR‚$WfVçB&VÖ÷fVB"Â%F†RWfVçBæB—G26öææV7FVBÖ6ÆVæF"6÷’vW&R&VÖ÷fVBâ"Â°Ğ¢†6S¢'7V66W72"ÀĞ¢7F–öç3¢sÆ'WGFöâ6Æ73Ò&6öÖÖæB×&–Ö'’Ö7F–öâ"G—SÒ&'WGFöâ"FFÖ6öÖÖæBÖ6Æ÷6SäFöæSÂö'WGFöãâpĞ¢Ò“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢6öç7B&Vf–æT'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæB×&Vf–æUÒ"“°Ğ¢–b‡&Vf–æT'WGFöâ’°Ğ¢6öÖÖæE&Vf–æTf–Æ&–Æ—G’‡&Vf–æT'WGFöâæFF6WBæ6öÖÖæE&Vf–æR“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢6öç7B÷VäWfVçD'WGFöâÒWfVçBçF&vWBæ6Æ÷6W7B‚%¶FFÖ6öÖÖæBÖ÷VâÖWfVçEÒ"“°Ğ¢–b†÷VäWfVçD'WGFöâ’°Ğ¢v—B6öÖÖæD÷Vå&ööÔWfVçB†÷VäWfVçD'WGFöâæFF6WBæ6öÖÖæD÷VäWfVçB“°Ğ¢ĞĞ§Ò“°Ğ Ğ¦f÷"†6öç7BWfVçDæÖRöb²&–çWB"Â&6†ævR%Ò’°Ğ¢6öÖÖæD6VçG&T&öG“òæFDWfVçDÆ—7FVæW"†WfVçDæÖRÂ†WfVçB’Óâ°Ğ¢–b†WfVçBçF&vWBæÖF6†W2‚"66öÖÖæDWfVçDÆÄF’Â66öÖÖæDWfVçDFFR"’’°Ğ¢6öç7BÆÄF”–çWBÒ6öÖÖæD6VçG&T&öG’çVW'•6VÆV7F÷"‚"66öÖÖæDWfVçDÆÄF’"“°Ğ¢6öç7B6†V6¶VBÒÆÄF”–çWCòæ6†V6¶VBÓÓÒG'VS°Ğ¢6öç7BFFRÒ6öÖÖæD6VçG&T&öG’çVW'•6VÆV7F÷"‚"66öÖÖæDWfVçDFFR"“°Ğ¢6öç7BVæDFFRÒ6öÖÖæD6VçG&T&öG’çVW'•6VÆV7F÷"‚"66öÖÖæDWfVçDVæDFFR"“°Ğ¢6öç7B7F'BÒ6öÖÖæD6VçG&T&öG’çVW'•6VÆV7F÷"‚"66öÖÖæDWfVçE7F'B"“°Ğ¢6öç7BVæBÒ6öÖÖæD6VçG&T&öG’çVW'•6VÆV7F÷"‚"66öÖÖæDWfVçDVæB"“°Ğ¢6öç7B66†VGVÆRÒ6öÖÖæD6VçG&T&öG’çVW'•6VÆV7F÷"‚"æ6öÖÖæB×66†VGVÆR×&÷r"“°Ğ¢6öç7BÆÄF”VæDf–VÆBÒ6öÖÖæD6VçG&T&öG’çVW'•6VÆV7F÷"‚%¶FFÖ6öÖÖæBÖÆÂÖF’ÖVæBÖf–VÆEÒ"“°Ğ¢6öç7BÆÄF•6W&F÷"Ò6öÖÖæD6VçG&T&öG’çVW'•6VÆV7F÷"‚%¶FFÖ6öÖÖæBÖÆÂÖF’×6W&F÷%Ò"“°Ğ¢6öç7BF–ÖU6W&F÷"Ò6öÖÖæD6VçG&T&öG’çVW'•6VÆV7F÷"‚%¶FFÖ6öÖÖæB×F–ÖR×6W&F÷%Ò"“°Ğ¢6öç7BF–ÖTf–VÆG2Ò6öÖÖæD6VçG&T&öG’çVW'•6VÆV7F÷$ÆÂ‚%¶FFÖ6öÖÖæB×F–ÖRÖf–VÆEÒ"“°Ğ Ğ¢66†VGVÆSòæ6Æ74Æ—7BçFövvÆR‚&—2ÖÆÂÖF’"Â6†V6¶VB“°Ğ¢ÆÄF”VæDf–VÆCòçFövvÆTGG&–'WFR‚&†–FFVâ"Â6†V6¶VB“°Ğ¢ÆÄF•6W&F÷#òçFövvÆTGG&–'WFR‚&†–FFVâ"Â6†V6¶VB“°Ğ¢F–ÖU6W&F÷#òçFövvÆTGG&–'WFR‚&†–FFVâ"Â6†V6¶VB“°Ğ¢F–ÖTf–VÆG2æf÷$V6‚‚†f–VÆB’Óâf–VÆBçFövvÆTGG&–'WFR‚&†–FFVâ"Â6†V6¶VB’“°Ğ Ğ¢–b†VæDFFRbbFFR’°Ğ¢VæDFFRæÖ–âÒFFRçfÇVS°Ğ¢–b‚VæDFFRçfÇVRÇÂVæDFFRçfÇVRÂFFRçfÇVR’VæDFFRçfÇVRÒFFRçfÇVS°Ğ¢ĞĞ¢–b‚6†V6¶VBbb7F'BbbVæBbb‚7F'BçfÇVRÇÂ7F'BçfÇVRÓÓÒ#£"’bb‚VæBçfÇVRÇÂVæBçfÇVRÓÓÒ#£"’’°Ğ¢7F'BçfÇVRÒ#“£#°Ğ¢VæBçfÇVRÒ#£#°Ğ¢ĞĞ¢–b‡7F'BbbVæB’°Ğ¢7F'BæF—6&ÆVBÒ6†V6¶VC°Ğ¢VæBæF—6&ÆVBÒ6†V6¶VC°Ğ¢v–æF÷rä6öÖÖöäw&÷VæEF–ÖU–6¶W#òç6WDF—6&ÆVB‡66†VGVÆRÂ6†V6¶VB“°Ğ¢6öç7B7F'DF—7Æ’Ò6öÖÖæD6VçG&T&öG’çVW'•6VÆV7F÷"‚"66öÖÖæDWfVçE7F'DF—7Æ’"“°Ğ¢6öç7BVæDF—7Æ’Ò6öÖÖæD6VçG&T&öG’çVW'•6VÆV7F÷"‚"66öÖÖæDWfVçDVæDF—7Æ’"“°Ğ¢7F'DF—7Æ“òçFövvÆTGG&–'WFR‚&&–Ö–çfÆ–B"Â6†V6¶VBbb7F'BçfÇVR“°Ğ¢VæDF—7Æ“òçFövvÆTGG&–'WFR‚&&–Ö–çfÆ–B"Â6†V6¶VBbbVæBçfÇVR“°Ğ¢ĞĞ¢&WGW&ã°Ğ¢ĞĞ¢–b‚WfVçBçF&vWBæÖF6†W2‚"66öÖÖæDÖ÷fTFFRÂ66öÖÖæDÖ÷fU7F'BÂ66öÖÖæDÖ÷fTVæB"’’&WGW&ã°Ğ¢G'’°Ğ¢6öç7BÖ÷fRÒ6öÖÖæE&VDÖ÷fTG&gB‚“°Ğ¢6öç7B7VÖÖ'’Ò6öÖÖæD6VçG&T&öG’çVW'•6VÆV7F÷"‚"66öÖÖæDÖ÷fTæWu7VÖÖ'’"“°Ğ¢–b‡7VÖÖ'’’7VÖÖ'’çFW‡D6öçFVçBÒ6öÖÖæD‡VÖå&ævR†Ö÷fRç7F'BÂÖ÷fRæVæB“°Ğ¢Ò6F6‚°Ğ¢òòF†Rfö7W6VBVF—B&VÖ–ç2f—6–&ÆRVçF–ÂÆÂF‡&VRf–VÆG2f÷&ÒfÆ–B&ævRàĞ¢ĞĞ¢Ò“°Ğ§ĞĞ Ğ¦6öÖÖæD6VçG&TF–ÆösòæFDWfVçDÆ—7FVæW"‚&6Æ–6²"Â†WfVçB’Óâ°Ğ¢–b†WfVçBçF&vWBÓÓÒ6öÖÖæD6VçG&TF–Æör’6Æ÷6T6öÖÖæD6VçG&R‚“°Ğ§Ò“°Ğ Ğ¦6öÖÖæD6VçG&TF–ÆösòæFDWfVçDÆ—7FVæW"‚&6æ6VÂ"Â†WfVçB’Óâ°Ğ¢WfVçBç&WfVçDFVfVÇB‚“°Ğ¢6Æ÷6T6öÖÖæD6VçG&R‚“°Ğ§Ò“°Ğ Ğ§v–æF÷ræFDWfVçDÆ—7FVæW"‚&¶W–F÷vâ"Â†WfVçB’Óâ°Ğ¢–b†WfVçBæ—46ö×÷6–ærÇÂ6öÖÖæD6VçG&U7FFRæ6ö×÷6–ærÇÂWfVçBæ¶W”6öFRÓÓÒ##’’&WGW&ã°Ğ¢6öç7B6öÖÖæE6†÷'F7WBÒ†WfVçBæÖWF¶W’ÇÂWfVçBæ7G&Ä¶W’’bbWfVçBæÇD¶W’bbWfVçBæ¶W’çFôÆ÷vW$66R‚’ÓÓÒ&²#°Ğ¢6öç7B6Æ6…6†÷'F7WBÒWfVçBæ¶W’ÓÓÒ"ò"bbWfVçBæÖWF¶W’bbWfVçBæ7G&Ä¶W’bbWfVçBæÇD¶W’bb6†÷VÆD–væ÷&Uf–Wu6†÷'F7WB†WfVçBçF&vWB“°Ğ¢–b†6öÖÖæE6†÷'F7WBÇÂ6Æ6…6†÷'F7WB’°Ğ¢–b‚7W'&VçE&ööÓòæ6öFRÇÂ&ööÕvRæ6Æ74Æ—7Bæ6öçF–ç2‚&†–FFVâ"’’&WGW&ã°Ğ¢WfVçBç&WfVçDFVfVÇB‚“°Ğ¢WfVçBç7F÷–ÖÖVF–FU&÷vF–öâ‚“°Ğ¢–b†6öÖÖæD6VçG&TF–Æöræ÷Vâ’6Æ÷6T6öÖÖæD6VçG&R‚“°Ğ¢VÇ6R÷Vä6öÖÖæD6VçG&R†WfVçBçF&vWB“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢–b‚6öÖÖæD6VçG&TF–Æöræ÷Vâ’&WGW&ã°Ğ¢–b†WfVçBæ¶W’ÓÓÒ$W66R"’°Ğ¢WfVçBç&WfVçDFVfVÇB‚“°Ğ¢WfVçBç7F÷–ÖÖVF–FU&÷vF–öâ‚“°Ğ¢6Æ÷6T6öÖÖæD6VçG&R‚“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢6öç7B6ö×ÆWF–öä¶W’Ò€Ğ¢WfVçBçF&vWBÓÓÒ6öÖÖæD6VçG&T–çWBb`Ğ¢†WfVçBæ¶W’ÓÓÒ%F""ÇÂWfVçBæ¶W’ÓÓÒ$'&÷u&–v‡B"’b`Ğ¢€Ğ¢6öÖÖæD6VçG&U7FFRç&VF–7F–öãòæ–æÆ–æU7Vff—‚ÇÀĞ¢6öÖÖæD6VçG&U7FFRç&VF–7F–öãòæ6÷'&V7FV@Ğ¢’b`Ğ¢6öÖÖæD6VçG&T–çWBç6VÆV7F–öå7F'BÓÓÒ6öÖÖæD6VçG&T–çWBçfÇVRæÆVæwF‚b`Ğ¢6öÖÖæD6VçG&T–çWBç6VÆV7F–öäVæBÓÓÒ6öÖÖæD6VçG&T–çWBçfÇVRæÆVæwF€Ğ¢“°Ğ¢–b†6ö×ÆWF–öä¶W’’°Ğ¢WfVçBç&WfVçDFVfVÇB‚“°Ğ¢WfVçBç7F÷–ÖÖVF–FU&÷vF–öâ‚“°Ğ¢6öÖÖæD6VçG&T66WE&VF–7F–öâ‚“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢–b†WfVçBæ¶W’ÓÓÒ$'&÷tF÷vâ"ÇÂWfVçBæ¶W’ÓÓÒ$'&÷uW"’°Ğ¢6öç7B÷F–öç2Ò6öÖÖæD6VçG&U6VÆV7F&ÆT÷F–öç2‚“°Ğ¢–b‚÷F–öç2æÆVæwF‚’&WGW&ã°Ğ¢WfVçBç&WfVçDFVfVÇB‚“°Ğ¢WfVçBç7F÷–ÖÖVF–FU&÷vF–öâ‚“°Ğ¢6öÖÖæD6VçG&U6VÆV7D–æFW‚†6öÖÖæD6VçG&U7FFRç6VÆV7FVD–æFW‚²†WfVçBæ¶W’ÓÓÒ$'&÷tF÷vâ"ò¢Ó’“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢–b‚†WfVçBæÖWF¶W’ÇÂWfVçBæ7G&Ä¶W’’bbWfVçBæ¶W’ÓÓÒ$VçFW""’°Ğ¢6öç7B7F–öâÒ6öÖÖæD6VçG&T&öG’çVW'•6VÆV7F÷"‚"æ6öÖÖæB×&–Ö'’Ö7F–öã¦æ÷Bƒ¦F—6&ÆVB’"“°Ğ¢–b‚7F–öâ’&WGW&ã°Ğ¢WfVçBç&WfVçDFVfVÇB‚“°Ğ¢WfVçBç7F÷–ÖÖVF–FU&÷vF–öâ‚“°Ğ¢7F–öâæ6Æ–6²‚“°Ğ¢&WGW&ã°Ğ¢ĞĞ¢–b†WfVçBæ¶W’ÓÓÒ$VçFW""bbWfVçBçF&vWBÓÓÒ6öÖÖæD6VçG&T–çWBbb6öÖÖæD6VçG&U6VÆV7F&ÆT÷F–öç2‚’æÆVæwF‚’°Ğ¢WfVçBç&WfVçDFVfVÇB‚“°Ğ¢WfVçBç7F÷–ÖÖVF–FU&÷vF–öâ‚“°Ğ¢6öÖÖæD6VçG&T7F—fFU6VÆV7FVB‚“°Ğ¢ĞĞ§ÒÂG'VR“°Ğ Ğ¦6öç7B6öÖÖæEW6W4Ö56†÷'F7WBÒôÖ7Æ•†öæWÆ•GÆ•öBö’çFW7B†æf–vF÷"çÆFf÷&ÒÇÂæf–vF÷"çW6W$vVçB“°Ğ¦–b†6öÖÖæD6VçG&U6†÷'F7WD†–çB’6öÖÖæD6VçG&U6†÷'F7WD†–çBçFW‡D6öçFVçBÒ6öÖÖæEW6W4Ö56†÷'F7WBò.(É‚²"¢$7G&Â²#°Ğ 