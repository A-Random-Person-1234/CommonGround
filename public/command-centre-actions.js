function commandActionSuccess(message, payload = undefined) {
  return {
    success: true,
    message,
    ...(payload === undefined ? {} : { payload })
  };
}

function commandActionFailure(error, fallbackMessage = "CommonGround could not complete that action.") {
  const source = error instanceof Error ? error : new Error(String(error || fallbackMessage));
  return {
    success: false,
    message: source.message || fallbackMessage,
    code: source.code || null,
    status: source.status || null,
    details: source.details || null
  };
}

function commandActionValidDateKey(value) {
  const match = String(value || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return { date, key: `${match[1]}-${match[2]}-${match[3]}` };
}

function commandActionDateLabel(date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function commandActionParticipantIds(participants = []) {
  if (!currentRoom?.participants?.length) throw new Error("Open a room before choosing participants.");
  const requested = Array.isArray(participants) ? participants : [participants];
  const ids = new Set();
  const members = currentRoom.participants;

  for (const requestedParticipant of requested) {
    const token = String(requestedParticipant || "").trim();
    if (!token) continue;
    const normalized = token.toLocaleLowerCase("en-GB");
    if (["everyone", "everybody", "whole room"].includes(normalized)) {
      members.forEach((member) => ids.add(member.id));
      continue;
    }
    if (["me", "myself"].includes(normalized) && currentParticipant?.id) {
      ids.add(currentParticipant.id);
      continue;
    }
    const exactId = members.find((member) => member.id === token);
    if (exactId) {
      ids.add(exactId.id);
      continue;
    }
    const exactName = members.filter(
      (member) => member.displayName.toLocaleLowerCase("en-GB") === normalized
    );
    if (exactName.length === 1) {
      ids.add(exactName[0].id);
      continue;
    }
    const firstName = members.filter(
      (member) => member.displayName.split(/\s+/)[0]?.toLocaleLowerCase("en-GB") === normalized
    );
    if (firstName.length > 1) {
      const error = new Error(`More than one room member is named ${token}. Choose their full name.`);
      error.code = "ambiguous_participant";
      error.details = {
        options: firstName.map((member) => ({ id: member.id, label: member.displayName }))
      };
      throw error;
    }
    if (firstName.length === 1) {
      ids.add(firstName[0].id);
      continue;
    }
    throw new Error(`I could not find “${token}” in this room.`);
  }

  if (currentParticipant?.id) ids.add(currentParticipant.id);
  return [...ids];
}

async function navigateToDate(dateString) {
  try {
    const parsed = commandActionValidDateKey(dateString);
    if (!parsed) throw new Error("Choose a valid date in YYYY-MM-DD format.");
    await goToDateInWeek(parsed.date);
    const message = `Showing the week containing ${commandActionDateLabel(parsed.date)}.`;
    calendarStatus.textContent = message;
    return commandActionSuccess(message, {
      date: parsed.key,
      view: "week"
    });
  } catch (error) {
    return commandActionFailure(error, "CommonGround could not navigate to that date.");
  }
}

async function navigateToView(viewName) {
  try {
    const view = String(viewName || "").trim().toLowerCase();
    if (view === "settings") {
      setPanelVisibility(hostPopover, true);
      const message = "Settings opened.";
      calendarStatus.textContent = message;
      return commandActionSuccess(message, { view });
    }
    if (!["day", "week", "month", "year"].includes(view)) {
      throw new Error("Choose day, week, month, year, or settings.");
    }
    await setCurrentView(view);
    const message = `${view.slice(0, 1).toUpperCase()}${view.slice(1)} view opened.`;
    calendarStatus.textContent = message;
    return commandActionSuccess(message, { view });
  } catch (error) {
    return commandActionFailure(error, "CommonGround could not switch calendar views.");
  }
}

function commandActionAvailabilityRange(targetDate, options = {}) {
  if (options.rangeStart && options.rangeEnd) {
    const rangeStart = new Date(options.rangeStart);
    const rangeEnd = new Date(options.rangeEnd);
    if (
      Number.isNaN(rangeStart.getTime()) ||
      Number.isNaN(rangeEnd.getTime()) ||
      rangeEnd <= rangeStart
    ) {
      throw new Error("Choose a valid availability date range.");
    }
    return {
      rangeStart: rangeStart.toISOString(),
      rangeEnd: rangeEnd.toISOString()
    };
  }

  const parsed = commandActionValidDateKey(
    targetDate || commandLocalDateValue(currentFocusDate || new Date())
  );
  if (!parsed) throw new Error("Choose a valid date for the availability search.");
  const rangeStart = new Date(parsed.date);
  rangeStart.setHours(0, 0, 0, 0);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setDate(rangeEnd.getDate() + 1);
  return {
    rangeStart: rangeStart.toISOString(),
    rangeEnd: rangeEnd.toISOString()
  };
}

async function findOverlapAvailability(
  participants,
  targetDate,
  durationMinutes = 30,
  options = {}
) {
  try {
    if (!currentRoom?.code) throw new Error("Open a room before searching availability.");
    const participantIds = commandActionParticipantIds(participants);
    const duration = Number(durationMinutes || 30);
    if (!Number.isInteger(duration) || duration < 15 || duration > 480) {
      throw new Error("Meeting duration must be between 15 minutes and 8 hours.");
    }
    const range = commandActionAvailabilityRange(targetDate, options);
    const intent = options.intent === "show_availability" ? "show_availability" : "find_time";
    const roomCodeSnapshot = currentRoom.code;
    const data = await fetchJson(`/api/rooms/${roomCodeSnapshot}/command-centre/availability`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        intent,
        participantIds,
        ...range,
        durationMinutes: duration,
        earliestMinute: Number(options.earliestMinute ?? 8 * 60),
        latestMinute: Number(options.latestMinute ?? 21 * 60),
        timeOfDay: options.timeOfDay || null,
        ...(Array.isArray(options.allowedWeekdays) && options.allowedWeekdays.length
          ? { allowedWeekdays: options.allowedWeekdays }
          : {}),
        timezone: options.timezone || commandCentreTimezone()
      }),
      signal: options.signal
    });
    if (currentRoom?.code !== roomCodeSnapshot) {
      const staleError = new Error("The active room changed before the availability search finished.");
      staleError.code = "stale_room";
      throw staleError;
    }
    const availability = {
      ...data.availability,
      slots: intent === "find_time"
        ? (data.availability?.slots || []).slice(0, 3)
        : (data.availability?.slots || [])
    };
    const count = availability.slots.length;
    const message = availability.complete === false
      ? "A connected calendar could not be refreshed, so CommonGround did not guess."
      : count
        ? `Found ${count} possible ${count === 1 ? "time" : "times"}.`
        : "No matching shared time was found.";
    return commandActionSuccess(message, {
      availability,
      participantIds,
      ...range,
      durationMinutes: duration,
      intent
    });
  } catch (error) {
    return commandActionFailure(error, "CommonGround could not check availability.");
  }
}

async function createCalendarEvent(eventData = {}) {
  try {
    if (!currentRoom?.code) throw new Error("Open a room before creating an event.");
    const roomCodeSnapshot = currentRoom.code;
    if (
      eventData.roomCode &&
      normalizeRoomCodeInput(eventData.roomCode) !== normalizeRoomCodeInput(roomCodeSnapshot)
    ) {
      throw new Error("For safety, Command Centre can only create events in the active room.");
    }
    const title = String(eventData.title || "").trim();
    if (!title) throw new Error("Add an event title.");
    const start = new Date(eventData.startTime || eventData.start);
    const end = new Date(eventData.endTime || eventData.end);
    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime()) ||
      end <= start
    ) {
      throw new Error("Choose a valid event start and end time.");
    }
    const inviteeParticipantIds = commandActionParticipantIds(
      eventData.participants || eventData.inviteeParticipantIds || []
    );
    const data = await fetchJson(`/api/rooms/${roomCodeSnapshot}/command-centre/create-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        start: start.toISOString(),
        end: end.toISOString(),
        timezone: eventData.timezone || commandCentreTimezone(),
        allDay: eventData.allDay === true,
        location: String(eventData.location || "").trim(),
        description: String(eventData.description || "").trim(),
        inviteeParticipantIds,
        syncToGoogle: eventData.syncToGoogle ?? Boolean(calendarEventSyncEnabled())
      })
    });
    if (currentRoom?.code === roomCodeSnapshot) {
      if (!currentRoom.events.some((event) => event.id === data.event.id)) {
        currentRoom.events.push(data.event);
      }
      pushUndoCreateEvent(data.event.id);
      render();
      fetchNotifications();
    }
    return commandActionSuccess(
      `Created “${data.event.title}” for ${commandHumanRange(data.event.start, data.event.end)}.`,
      { event: data.event }
    );
  } catch (error) {
    return commandActionFailure(error, "CommonGround could not create the event.");
  }
}

function connectGoogleCalendar() {
  try {
    if (!currentRoom?.code) throw new Error("Open a room before connecting Google Calendar.");
    if (currentUserConnected() && currentParticipantConnected() && calendarWriteReady()) {
      setPanelVisibility(hostPopover, true);
      window.requestAnimationFrame(() => syncSettingsCard?.scrollIntoView({ block: "nearest" }));
      return commandActionSuccess("Google Calendar is already connected.", {
        provider: "google",
        connected: true
      });
    }
    const opened = openGoogleAuthPopup();
    if (!opened) {
      throw new Error("The Google authorization popup was blocked. Allow popups and try again.");
    }
    return commandActionSuccess("Google authorization opened in a secure popup.", {
      provider: "google",
      connected: false,
      popupOpened: true
    });
  } catch (error) {
    return commandActionFailure(error, "CommonGround could not start Google authorization.");
  }
}

async function updateCustomRoomCode(newCode) {
  try {
    const code = String(newCode || "").trim().toUpperCase();
    const data = await updateRoomCodeByValue(code);
    const message = data.unchanged
      ? `The room code is already ${data.room.code}.`
      : `Room code changed from ${data.previousCode} to ${data.room.code}.`;
    return commandActionSuccess(message, {
      room: data.room,
      previousCode: data.previousCode || data.room.code,
      newCode: data.room.code,
      unchanged: data.unchanged === true
    });
  } catch (error) {
    return commandActionFailure(error, "CommonGround could not update the room code.");
  }
}

window.CommonGroundCommandActions = Object.freeze({
  navigateToDate,
  navigateToView,
  findOverlapAvailability,
  createCalendarEvent,
  connectGoogleCalendar,
  updateCustomRoomCode
});
