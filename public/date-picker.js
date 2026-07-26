(() => {
  "use strict";

  // One controller progressively enhances every canonical date input.
  const DATE_INPUT_SELECTOR = 'input[type="date"]:not([data-native-date-picker])';
  const PICKER_ID = "commonGroundDatePicker";
  const PICKER_WIDTH = 296;
  const VIEWPORT_INSET = 8;
  const ANCHOR_GAP = 8;
  const CLOSE_DURATION_MS = 150;

  const state = {
    input: null,
    viewMonth: null,
    activeDate: null,
    closeTimer: 0,
    generation: 0
  };

  const picker = document.createElement("div");
  picker.id = PICKER_ID;
  picker.className = "common-ground-date-picker";
  picker.setAttribute("popover", "manual");
  picker.setAttribute("role", "dialog");
  picker.setAttribute("aria-modal", "false");
  picker.setAttribute("aria-labelledby", `${PICKER_ID}Month`);
  picker.setAttribute("aria-describedby", `${PICKER_ID}Help`);
  picker.innerHTML = `
    <header class="common-ground-date-picker-header">
      <h2 id="${PICKER_ID}Month" aria-live="polite"></h2>
      <div class="common-ground-date-picker-navigation" role="group" aria-label="Change month">
        <button type="button" data-date-picker-previous aria-label="Previous month">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m15 18-6-6 6-6"></path>
          </svg>
        </button>
        <button type="button" data-date-picker-next aria-label="Next month">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 18 6-6-6-6"></path>
          </svg>
        </button>
      </div>
    </header>
    <div class="common-ground-date-picker-weekdays" aria-hidden="true"></div>
    <div class="common-ground-date-picker-grid" role="grid" aria-labelledby="${PICKER_ID}Month"></div>
    <p class="sr-only" id="${PICKER_ID}Help">
      Use the arrow keys to move between dates, Page Up and Page Down to change month,
      Enter to select, and Escape to close.
    </p>
  `;
  document.body.appendChild(picker);

  const monthLabel = picker.querySelector(`#${PICKER_ID}Month`);
  const weekdayRow = picker.querySelector(".common-ground-date-picker-weekdays");
  const dateGrid = picker.querySelector(".common-ground-date-picker-grid");
  const previousMonthButton = picker.querySelector("[data-date-picker-previous]");
  const nextMonthButton = picker.querySelector("[data-date-picker-next]");

  const monthFormatter = new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric"
  });
  const fullDateFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const weekdayFormatter = new Intl.DateTimeFormat(undefined, {
    weekday: "short"
  });

  function localNoon(year, month, day) {
    return new Date(year, month, day, 12, 0, 0, 0);
  }

  function validDate(value) {
    return value instanceof Date && !Number.isNaN(value.getTime());
  }

  function parseDateKey(value) {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const date = localNoon(year, month, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month ||
      date.getDate() !== day
    ) {
      return null;
    }
    return date;
  }

  function dateKey(date) {
    if (!validDate(date)) return "";
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  function startOfMonth(date) {
    return localNoon(date.getFullYear(), date.getMonth(), 1);
  }

  function addDays(date, amount) {
    return localNoon(date.getFullYear(), date.getMonth(), date.getDate() + amount);
  }

  function addMonths(date, amount) {
    return localNoon(date.getFullYear(), date.getMonth() + amount, 1);
  }

  function daysInMonth(date) {
    return localNoon(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  function inputMinimum(input) {
    return parseDateKey(input?.min);
  }

  function inputMaximum(input) {
    return parseDateKey(input?.max);
  }

  function clampToInputRange(input, date) {
    const minimum = inputMinimum(input);
    const maximum = inputMaximum(input);
    if (minimum && dateKey(date) < dateKey(minimum)) return minimum;
    if (maximum && dateKey(date) > dateKey(maximum)) return maximum;
    return date;
  }

  function dateIsDisabled(input, date) {
    const key = dateKey(date);
    const minimum = input?.min && parseDateKey(input.min) ? input.min : "";
    const maximum = input?.max && parseDateKey(input.max) ? input.max : "";
    return Boolean((minimum && key < minimum) || (maximum && key > maximum));
  }

  function createWeekdayLabels() {
    const sunday = localNoon(2026, 0, 4);
    const fragment = document.createDocumentFragment();
    for (let index = 0; index < 7; index += 1) {
      const label = document.createElement("span");
      label.textContent = weekdayFormatter.format(addDays(sunday, index)).slice(0, 1);
      fragment.appendChild(label);
    }
    weekdayRow.replaceChildren(fragment);
  }

  function pickerIsShowing() {
    try {
      return picker.matches(":popover-open");
    } catch {
      return picker.dataset.fallbackOpen === "true";
    }
  }

  function showPickerElement() {
    if (pickerIsShowing()) return;
    if (typeof picker.showPopover === "function") {
      picker.showPopover();
    } else {
      picker.dataset.fallbackOpen = "true";
    }
  }

  function hidePickerElement() {
    if (typeof picker.hidePopover === "function" && pickerIsShowing()) {
      picker.hidePopover();
    }
    delete picker.dataset.fallbackOpen;
  }

  function pickerHostForInput(input) {
    return (
      input.closest("dialog[open]") ||
      input.closest(".detail-panel:not(.hidden)") ||
      document.body
    );
  }

  function prepareDateInput(input) {
    if (!(input instanceof HTMLInputElement) || input.dataset.commonGroundDatePicker === "ready") {
      return;
    }
    input.dataset.commonGroundDatePicker = "ready";
    input.classList.add("common-ground-date-input");
    input.setAttribute("aria-haspopup", "dialog");
    input.setAttribute("aria-controls", PICKER_ID);
    input.setAttribute("aria-expanded", "false");
    const descriptions = new Set(
      String(input.getAttribute("aria-describedby") || "")
        .split(/\s+/)
        .filter(Boolean)
    );
    descriptions.add(`${PICKER_ID}Help`);
    input.setAttribute("aria-describedby", [...descriptions].join(" "));
  }

  function prepareDateInputs(root = document) {
    if (root instanceof Element && root.matches(DATE_INPUT_SELECTOR)) {
      prepareDateInput(root);
    }
    root.querySelectorAll?.(DATE_INPUT_SELECTOR).forEach(prepareDateInput);
  }

  function renderDatePicker() {
    const input = state.input;
    const viewMonth = state.viewMonth;
    if (!input || !viewMonth) return;

    const selectedKey = input.value && parseDateKey(input.value) ? input.value : "";
    const activeKey = dateKey(state.activeDate);
    const todayKey = dateKey(new Date());
    const monthStart = startOfMonth(viewMonth);
    const gridStart = addDays(monthStart, -monthStart.getDay());
    const fragment = document.createDocumentFragment();

    monthLabel.textContent = monthFormatter.format(monthStart);

    let row = null;
    for (let index = 0; index < 42; index += 1) {
      if (index % 7 === 0) {
        row = document.createElement("div");
        row.className = "common-ground-date-picker-row";
        row.setAttribute("role", "row");
        fragment.appendChild(row);
      }

      const date = addDays(gridStart, index);
      const key = dateKey(date);
      const cell = document.createElement("div");
      const button = document.createElement("button");
      const outsideMonth = date.getMonth() !== monthStart.getMonth();
      const selected = key === selectedKey;
      const today = key === todayKey;
      const disabled = dateIsDisabled(input, date);

      button.type = "button";
      button.className = [
        "common-ground-date-picker-day",
        outsideMonth ? "is-outside-month" : "",
        selected ? "is-selected" : "",
        today ? "is-today" : ""
      ].filter(Boolean).join(" ");
      button.dataset.datePickerDate = key;
      button.textContent = String(date.getDate());
      button.disabled = disabled;
      button.tabIndex = key === activeKey && !disabled ? 0 : -1;
      button.setAttribute("aria-label", fullDateFormatter.format(date));
      if (today) button.setAttribute("aria-current", "date");
      cell.className = "common-ground-date-picker-cell";
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-selected", String(selected));
      cell.appendChild(button);
      row.appendChild(cell);
    }

    dateGrid.replaceChildren(fragment);

    const previousMonth = addMonths(monthStart, -1);
    const previousMonthEnd = localNoon(
      previousMonth.getFullYear(),
      previousMonth.getMonth(),
      daysInMonth(previousMonth)
    );
    const nextMonth = addMonths(monthStart, 1);
    const minimum = inputMinimum(input);
    const maximum = inputMaximum(input);
    previousMonthButton.disabled = Boolean(minimum && previousMonthEnd < minimum);
    nextMonthButton.disabled = Boolean(maximum && nextMonth > maximum);
  }

  function positionDatePicker() {
    const input = state.input;
    if (!input?.isConnected || !pickerIsShowing()) return;

    const inputRect = input.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const pickerWidth = Math.min(
      picker.offsetWidth || PICKER_WIDTH,
      viewportWidth - (VIEWPORT_INSET * 2)
    );
    const pickerHeight = picker.offsetHeight || 326;
    const maximumX = Math.max(VIEWPORT_INSET, viewportWidth - pickerWidth - VIEWPORT_INSET);
    const left = Math.min(Math.max(inputRect.left, VIEWPORT_INSET), maximumX);
    const below = inputRect.bottom + ANCHOR_GAP;
    const above = inputRect.top - pickerHeight - ANCHOR_GAP;
    const fitsBelow = below + pickerHeight <= viewportHeight - VIEWPORT_INSET;
    const fitsAbove = above >= VIEWPORT_INSET;
    const placement = fitsBelow || !fitsAbove ? "bottom" : "top";
    const unclampedTop = placement === "bottom" ? below : above;
    const maximumY = Math.max(VIEWPORT_INSET, viewportHeight - pickerHeight - VIEWPORT_INSET);
    const top = Math.min(Math.max(unclampedTop, VIEWPORT_INSET), maximumY);

    picker.dataset.placement = placement;
    picker.style.setProperty("--date-picker-x", `${Math.round(left)}px`);
    picker.style.setProperty("--date-picker-y", `${Math.round(top)}px`);
    picker.style.setProperty(
      "--date-picker-origin",
      placement === "bottom" ? "top center" : "bottom center"
    );
  }

  function finishDatePickerClose(generation) {
    if (generation !== state.generation || state.input) return;
    hidePickerElement();
    picker.classList.remove("is-opening", "is-closing");
    if (picker.parentElement !== document.body) document.body.appendChild(picker);
  }

  function closeDatePicker({ restoreFocus = false, immediate = false } = {}) {
    const input = state.input;
    if (!input && !pickerIsShowing()) return;

    state.input = null;
    state.viewMonth = null;
    state.activeDate = null;
    state.generation += 1;
    const generation = state.generation;
    if (state.closeTimer) {
      window.clearTimeout(state.closeTimer);
      state.closeTimer = 0;
    }
    input?.setAttribute("aria-expanded", "false");
    input?.classList.remove("is-date-picker-open");
    picker.classList.remove("is-opening");

    if (restoreFocus && input?.isConnected && !input.disabled) {
      input.focus({ preventScroll: true });
    }

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (immediate || reducedMotion) {
      finishDatePickerClose(generation);
      return;
    }

    picker.classList.add("is-closing");
    state.closeTimer = window.setTimeout(() => {
      state.closeTimer = 0;
      finishDatePickerClose(generation);
    }, CLOSE_DURATION_MS);
  }

  function openDatePicker(input, { focusGrid = false } = {}) {
    if (
      !(input instanceof HTMLInputElement) ||
      !input.matches(DATE_INPUT_SELECTOR) ||
      input.disabled ||
      input.readOnly
    ) {
      return false;
    }

    prepareDateInput(input);
    if (state.input && state.input !== input) {
      closeDatePicker({ immediate: true });
    }
    if (state.closeTimer) {
      window.clearTimeout(state.closeTimer);
      state.closeTimer = 0;
    }

    const selected = parseDateKey(input.value);
    const initialDate = clampToInputRange(input, selected || new Date());
    state.input = input;
    state.activeDate = initialDate;
    state.viewMonth = startOfMonth(initialDate);
    state.generation += 1;

    input.setAttribute("aria-expanded", "true");
    input.classList.add("is-date-picker-open");
    picker.classList.remove("is-opening", "is-closing");

    const host = pickerHostForInput(input);
    if (picker.parentElement !== host) {
      hidePickerElement();
      host.appendChild(picker);
    }

    renderDatePicker();
    showPickerElement();
    positionDatePicker();
    void picker.offsetWidth;
    picker.classList.add("is-opening");

    if (focusGrid) {
      requestAnimationFrame(() => {
        dateGrid.querySelector(`[data-date-picker-date="${dateKey(state.activeDate)}"]`)?.focus({
          preventScroll: true
        });
      });
    }
    return true;
  }

  function moveActiveDate(date, { focus = true } = {}) {
    if (!state.input || !validDate(date)) return;
    const nextDate = clampToInputRange(state.input, date);
    state.activeDate = nextDate;
    state.viewMonth = startOfMonth(nextDate);
    renderDatePicker();
    if (focus) {
      requestAnimationFrame(() => {
        dateGrid.querySelector(`[data-date-picker-date="${dateKey(nextDate)}"]`)?.focus({
          preventScroll: true
        });
      });
    }
  }

  function moveActiveByMonth(amount, { focus = true } = {}) {
    if (!state.input || !state.activeDate) return;
    const targetMonth = addMonths(state.activeDate, amount);
    const targetDay = Math.min(state.activeDate.getDate(), daysInMonth(targetMonth));
    moveActiveDate(
      localNoon(targetMonth.getFullYear(), targetMonth.getMonth(), targetDay),
      { focus }
    );
  }

  function selectDate(key) {
    const input = state.input;
    const date = parseDateKey(key);
    if (!input || !date || dateIsDisabled(input, date)) return;

    input.value = key;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    closeDatePicker({ restoreFocus: true });
  }

  function dateInputFromTarget(target) {
    if (!(target instanceof Element)) return null;
    const input = target.closest(DATE_INPUT_SELECTOR);
    return input instanceof HTMLInputElement ? input : null;
  }

  function targetBelongsToDatePicker(target) {
    if (!(target instanceof Node)) return false;
    return picker.contains(target) || Boolean(state.input?.contains(target));
  }

  function handleDatePickerKeydown(event) {
    if (event.isComposing || event.keyCode === 229) return;
    const input = dateInputFromTarget(event.target);

    if (!state.input) {
      if (
        input &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        ["Enter", " ", "ArrowDown"].includes(event.key)
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        openDatePicker(input, { focusGrid: true });
      }
      return;
    }

    const withinPicker = picker.contains(event.target);
    if (input !== state.input && !withinPicker) return;

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeDatePicker({ restoreFocus: true });
      return;
    }

    if (event.target.closest("[data-date-picker-previous], [data-date-picker-next]")) {
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      event.stopImmediatePropagation();
      moveActiveDate(addDays(state.activeDate, event.key === "ArrowLeft" ? -1 : 1));
      return;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      event.stopImmediatePropagation();
      moveActiveDate(addDays(state.activeDate, event.key === "ArrowUp" ? -7 : 7));
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      event.stopImmediatePropagation();
      const weekday = state.activeDate.getDay();
      moveActiveDate(addDays(
        state.activeDate,
        event.key === "Home" ? -weekday : 6 - weekday
      ));
      return;
    }

    if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      event.stopImmediatePropagation();
      const direction = event.key === "PageUp" ? -1 : 1;
      moveActiveByMonth(direction * (event.shiftKey ? 12 : 1));
      return;
    }

    if (
      (event.key === "Enter" || event.key === " ") &&
      !event.target.closest("[data-date-picker-previous], [data-date-picker-next]")
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      selectDate(dateKey(state.activeDate));
    }
  }

  createWeekdayLabels();
  prepareDateInputs();

  picker.addEventListener("click", (event) => {
    const dayButton = event.target.closest("[data-date-picker-date]");
    if (dayButton) {
      selectDate(dayButton.dataset.datePickerDate);
      return;
    }

    if (event.target.closest("[data-date-picker-previous]")) {
      moveActiveByMonth(-1, { focus: false });
      previousMonthButton.focus({ preventScroll: true });
      return;
    }

    if (event.target.closest("[data-date-picker-next]")) {
      moveActiveByMonth(1, { focus: false });
      nextMonthButton.focus({ preventScroll: true });
    }
  });

  document.addEventListener("pointerdown", (event) => {
    const input = dateInputFromTarget(event.target);
    if (input) {
      if (event.button !== undefined && event.button !== 0) return;
      if (input.disabled || input.readOnly) return;
      event.preventDefault();
      input.focus({ preventScroll: true });
      openDatePicker(input);
      return;
    }
    if (!state.input || picker.contains(event.target)) return;
    closeDatePicker();
  }, true);

  document.addEventListener("click", (event) => {
    const input = dateInputFromTarget(event.target);
    if (!input || input.disabled || input.readOnly) return;
    event.preventDefault();
    if (state.input !== input) openDatePicker(input);
  }, true);

  document.addEventListener("focusin", (event) => {
    if (!state.input || targetBelongsToDatePicker(event.target)) return;
    closeDatePicker();
  });

  window.addEventListener("keydown", handleDatePickerKeydown, true);
  window.addEventListener("resize", positionDatePicker);
  window.addEventListener("scroll", (event) => {
    if (!state.input || picker.contains(event.target)) return;
    closeDatePicker({ immediate: true });
  }, true);

  document.addEventListener("close", (event) => {
    if (!state.input || !event.target.contains?.(state.input)) return;
    closeDatePicker({ immediate: true });
  }, true);

  const dateInputObserver = new MutationObserver((records) => {
    for (const record of records) {
      record.addedNodes.forEach((node) => {
        if (node instanceof Element) prepareDateInputs(node);
      });
      if (
        record.type === "attributes" &&
        record.target instanceof HTMLInputElement &&
        record.target.matches(DATE_INPUT_SELECTOR)
      ) {
        prepareDateInput(record.target);
      }
    }

    if (!state.input) return;
    const ownerDialog = state.input.closest("dialog");
    const hiddenAncestor = state.input.closest("[hidden], .hidden");
    if (
      !state.input.isConnected ||
      state.input.disabled ||
      (ownerDialog && !ownerDialog.open) ||
      hiddenAncestor
    ) {
      closeDatePicker({ immediate: true });
    }
  });
  dateInputObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "disabled", "hidden", "open", "type"]
  });

  window.commonGroundDatePicker = Object.freeze({
    close: closeDatePicker,
    containsTarget: targetBelongsToDatePicker,
    initialize: prepareDateInputs,
    isOpen: () => Boolean(state.input),
    open: (input) => openDatePicker(input, { focusGrid: true })
  });
})();
