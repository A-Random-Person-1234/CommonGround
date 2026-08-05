# CommonGround clash rendering - design QA

## Scope

- User reference: `C:\Users\aryan\AppData\Local\Temp\codex-clipboard-51cc30f3-903f-43f4-8db7-991eec165ccb.png`
- Reference asset size: 311 x 746 px
- Production-style fixture: `C:\Users\aryan\Documents\Codex\2026-07-17\do\publish-event-owner-theme-full-20260805\.tmp-visual\overlap-qa.html`
- Implementation capture: `C:\Users\aryan\Documents\Codex\2026-07-17\do\publish-event-owner-theme-full-20260805\.tmp-visual\implementation-full.png`
- Implementation capture size: 1264 x 831 px
- Side-by-side evidence: `C:\Users\aryan\Documents\Codex\2026-07-17\do\publish-event-owner-theme-full-20260805\.tmp-visual\comparison.png`
- Side-by-side capture size: 1264 x 935 px
- Browser viewport: 1280 x 720 CSS px at device-pixel-ratio 1.5

The focused fixture imports the production `public/styles.css` and uses the exact `busy-card`, `event-card`, duration, and overlap-lane classes emitted by the application. Functional source tests separately verify that the live planner sends synced and manual events through the same lane-layout function.

## State and inputs

- Theme: dark
- View: one-day timed planner representative of day/week rendering
- Synced event: 9am-5pm
- Synced/manual mixed clash: two distinct 11am-12pm events
- Manual/synced mixed clash: two distinct 1pm-1:45pm events
- Lane count: three, because the long synced event overlaps both shorter pairs

## Acceptance checks

| Check | Evidence | Result |
| --- | --- | --- |
| Synced events remain atomic rather than being sliced at every overlap boundary | The 9am-5pm synced block stays continuous in the visual fixture; `busySegmentsForDate()` returns one segment per source block | Passed |
| Synced-vs-synced, manual-vs-manual, and mixed clashes use one layout | `renderPlanner()` passes both types into one `layoutEventLanes()` call | Passed |
| Every clashing event is visibly represented | Five source events render as five independent cards | Passed |
| No `+1` / `+2` aggregation replaces event details | No aggregate label appears in the implementation capture; the old merge helper is absent from the active segment builder | Passed |
| Exact-time provider events are not silently deduplicated | Server dedupe key includes each calendar item's `sourceId` | Passed |
| CommonGround visual language is preserved | Production Bordeaux cards, dark canvas, spacing, type hierarchy, and narrow-lane density are retained | Passed |

## Visual comparison findings

- The reference's essential behavior is matched: a long event remains intact while each collision is visible as its own card.
- CommonGround intentionally uses equal-width conflict lanes instead of copying the reference's inset cascade. This preserves the app's existing drag, resize, click, and ownership interactions while making synced and manual clashes identical.
- Card color and typography intentionally remain CommonGround's production design tokens rather than the reference's blue palette.
- No blocking overflow, clipping, duplicate aggregation, or missing-event defect was observed in the tested state.

## Verification history

1. Rendered the focused production-style clash fixture in the Codex in-app browser.
2. Captured the implementation and a side-by-side comparison against the supplied reference.
3. Confirmed distinct accessible button nodes for all five events.
4. Ran syntax, integration, smoke, command-centre, and weather regression tests successfully.

final result: passed

---

# CommonGround compact invite control QA

- Source visual truth: `C:\Users\aryan\AppData\Local\Temp\codex-clipboard-8f38a98d-3d6d-4ea5-8979-07e566eca97c.png`
- Browser-rendered implementation: `C:\Users\aryan\.codex\visualizations\2026\07\16\019f6cbd-b495-7901-9098-72138f0a387b\commonground-invite-control-full.png`
- Focused implementation crop: `C:\Users\aryan\.codex\visualizations\2026\07\16\019f6cbd-b495-7901-9098-72138f0a387b\commonground-invite-control-focused.png`
- Combined comparison: `C:\Users\aryan\.codex\visualizations\2026\07\16\019f6cbd-b495-7901-9098-72138f0a387b\commonground-invite-control-comparison.png`
- Viewport: 1280 x 720 CSS px, desktop dark-mode event composer, device pixel ratio 1.
- Source pixels: 377 x 113. Implementation pixels: 1280 x 720 full view and 495 x 60 focused crop. The focused crop was normalized to the source width for the side-by-side comparison.
- State: new event composer in a one-member room, invite control at rest.

## Full-view comparison evidence

The implementation keeps the invite control aligned with the other event metadata rows and removes the tall selected-self card that previously expanded the modal. The composer remains stable in height and the controls beneath Invite others retain their spacing and alignment.

## Focused region comparison evidence

The combined image places the supplied clunky state and the browser-rendered replacement in one canvas. The original uses a large filled card for `Guest (You)` even though the current participant cannot be removed. The replacement preserves `Only you` as lightweight status copy, omits the redundant self row, and removes the chevron when there is nobody else to invite.

## Required fidelity surfaces

- Fonts and typography: passed. The existing SF Pro Display family and 14/12 px metadata hierarchy remain consistent with the rest of the composer.
- Spacing and layout rhythm: passed. The control is a single 40 px row with no redundant expanded card. Icon, label, and status share a common vertical centre.
- Colors and visual tokens: passed. The replacement uses the existing neutral composer text and surface tokens; selected guests in populated rooms use only a low-opacity participant tint.
- Image quality and asset fidelity: passed. The existing supplied user-plus icon remains in use; no icon was recreated.
- Copy and content: passed. `Invite others` and `Only you` remain, while redundant `Guest (You)` content is removed from the one-member state.

## Interaction and accessibility verification

- In a one-member room, activating the summary does not open an empty menu.
- The current participant’s checked form value remains in the DOM, preserving event creation and edit payloads.
- When other members exist, the menu uses compact 34 px checkbox rows in an anchored popover and closes on outside click.
- Browser console errors: none.
- `npm.cmd run check` passed.
- `npm.cmd test` passed, including weather, Command Centre unit/integration, and smoke suites.

## Findings

No actionable P0, P1, or P2 differences remain.

## Comparison history

1. Initial P1: the first floating-menu pass overlaid its empty state on the Google sync row because the invite row’s isolated stacking context prevented the panel from clearing later siblings.
2. Fix: empty invite menus no longer open, the redundant current-user option is visually omitted while retained in form state, and populated menus receive a raised stacking context.
3. Post-fix evidence: the final focused comparison shows a single calm row with no duplicate card, overlap, clipping, or modal jump.

## Follow-up polish

No P3 follow-up is required for this scoped change.

final result: passed

---

# CommonGround sidebar consolidation and SF Pro Display QA

- Source visual truth: `C:\Users\aryan\AppData\Local\Temp\codex-clipboard-a6912973-8803-4f2e-b1bb-07eed556a1ac.png`
- Implementation screenshot: `C:\Users\aryan\.codex\visualizations\2026\07\16\019f6cbd-b495-7901-9098-72138f0a387b\sidebar-audit\sidebar-implementation-1440x900.png`
- Combined comparison: `C:\Users\aryan\.codex\visualizations\2026\07\16\019f6cbd-b495-7901-9098-72138f0a387b\sidebar-audit\sidebar-comparison.png`
- Create-menu evidence: `C:\Users\aryan\.codex\visualizations\2026\07\16\019f6cbd-b495-7901-9098-72138f0a387b\sidebar-audit\sidebar-create-menu.png`
- Mobile evidence: `C:\Users\aryan\.codex\visualizations\2026\07\16\019f6cbd-b495-7901-9098-72138f0a387b\sidebar-audit\sidebar-mobile-390x844.png`
- Desktop viewport: 1440 x 900 CSS px, dark weekly room view, device pixel ratio 1
- Responsive viewports: 1024 x 768 and 390 x 844 CSS px
- Source pixels: 297 x 858
- Focused implementation pixels: 297 x 858
- Density normalization: both comparison images were captured or normalized to the same 297 x 858 pixel crop
- State: host in a single room, Create menu closed for the main comparison

## Full-view comparison evidence

The normalized comparison places the original sidebar and the browser-rendered implementation in the same image. The intended redesign is visible: the Create control is shorter, the repeated current-room row and separate New room row are removed, the current room becomes one compact accented group, normal member status copy is removed, and the selected mini-calendar date uses CommonGround gold instead of blue. The sidebar retains the original information sequence and all calendar/member controls.

## Focused region comparison evidence

The focused Create-menu capture confirms that Event, Room, and Join room fit inside one 188 px menu without clipping. The mobile capture confirms the 264 px drawer fits within a 390 px viewport, keeps its independent scroll area, and leaves calendar context visible. A 1024 px browser measurement reported equal panel scroll and client widths, so the sidebar has no horizontal overflow.

## Required fidelity surfaces

- Fonts and typography: passed. The supplied SF Pro Display regular, medium, and bold OTF files are self-hosted and used by the main app, forms, legal pages, and OAuth popup. Dates, times, calendar numbers, room codes, and time-picker values use one `--font-numeric` token with tabular lining numerals and zero numeric letter-spacing. Contextual hierarchy remains intact while digit shapes and widths stay consistent.
- Spacing and layout rhythm: passed. Desktop width is 248 px, with 14 px vertical rhythm, 16 px outer padding, a 42 px Create control, 38 px member rows, and a compact current-room group. No text or controls overflow at the verified breakpoints.
- Colors and visual tokens: passed. The selected/current date and room accent use `#b39458` / `#d1ad69`; the existing dark surfaces and member colours remain intact.
- Image quality and asset fidelity: passed. Existing CommonGround and supplied vector icon assets are reused without recreation. The new font files match the exact supplied binaries.
- Copy and content: passed. Duplicate CommonGround/room identity copy, the duplicate current-room row, the separate New room row, and routine live/guest member labels are removed. Actionable sync error labels remain available.

## Interaction and accessibility verification

- Create exposes `aria-haspopup="menu"`, `aria-expanded`, a labelled menu, and three menuitems.
- Pointer opening, Escape dismissal, and the Event action opening the anchored event composer were browser-tested.
- Arrow-key, Home, End, and focus-restoration paths are implemented and source-tested.
- Current-room code and copy controls retain their original IDs and behavior.
- Active room filtering keeps only other rooms in the switcher; the existing room-switch handler is preserved.
- The mobile sidebar opens as a 264 px drawer with no horizontal overflow.
- Browser console errors for the current 4173 QA build: none.
- `npm.cmd run check` passed.
- `npm.cmd test` passed, including weather, Command Centre unit/integration, and smoke suites.

## Findings

No actionable P0, P1, or P2 differences remain.

## Comparison history

1. Initial source P2: room identity appeared three times and room creation had a separate competing row.
2. Fix: the active room now owns one compact group; only other rooms render beneath it; Event, Room, and Join room move into the Create menu.
3. Initial source P2: the 56 px Create button, nested surfaces, blue selected date, and low-contrast duplicate status labels made the sidebar feel heavy.
4. Fix: tightened the sidebar rhythm, flattened rows, added one gold selection accent, and retained only actionable member statuses.
5. Typography request: replaced Geist Mono with the supplied SF Pro Display assets and verified computed font and tabular-numeral features on calendar dates, period labels, and time labels.
6. Post-fix browser evidence: the desktop comparison, open-menu crop, 1024 px measurements, and 390 px drawer show no clipping or overflow.

## Follow-up polish

No P3 follow-up is required for this scoped change.

final result: passed

---

# CommonGround event composer schedule structure QA

- Source visual truth: `C:\Users\aryan\AppData\Local\Temp\codex-clipboard-a3b5ae88-a72b-43bf-b64d-95287609ff5a.png`
- Implementation screenshot: `C:\Users\aryan\.codex\visualizations\2026\07\16\019f6cbd-b495-7901-9098-72138f0a387b\commonground-event-composer-implementation.png`
- Combined comparison: `C:\Users\aryan\.codex\visualizations\2026\07\16\019f6cbd-b495-7901-9098-72138f0a387b\commonground-event-composer-comparison.png`
- Viewport: 1280 x 720 CSS px, desktop dark weekly room view, device pixel ratio 1.
- Source pixels: 997 x 465. Implementation pixels: 1280 x 720. The combined comparison preserves each native capture; review is scoped to the event composer region rather than browser chrome.
- State: new event composer, All day off, date picker closed.

## Full-view comparison evidence

The combined image places the source reference and browser-rendered composer in one canvas. The implementation reproduces the requested title-underlined schedule hierarchy: a large frameless title, one clock-led row, human-readable date control, start/end time fields, and an All day control below. The reference-only Event/Task/Appointment controls and Time zone link are intentionally omitted at the user’s request. Existing invite, sync, location, description, and action controls remain beneath this matched section.

## Focused region comparison evidence

The schedule row was checked at the same desktop state. The full weekday/month/day date is visible without truncation at the normal composer width; start time, dash, and end time remain on one line. Clicking the visible date control opened the existing accessible CommonGround date picker. The browser console contained no errors.

## Required fidelity surfaces

- Fonts and typography: passed. SF Pro Display remains the explicit font for the date and time controls with tabular lining numerals; title hierarchy is visually distinct without introducing a competing font.
- Spacing and layout rhythm: passed. The 24 px composer padding, title baseline/underline, 44 px schedule controls, clock column, and second-row All day alignment match the reference’s compact rhythm. No control clips at the verified desktop width.
- Colors and visual tokens: passed. The source’s neutral dark controls are adapted to CommonGround’s existing dark surface and gold focus/accent system; no unnecessary blue state is introduced.
- Image quality and asset fidelity: passed. The existing supplied clock icon is used; no visual source asset was replaced with a fabricated image or glyph.
- Copy and content: passed. “Add title,” the readable date, times, and “All day” match the intended structure. The user explicitly excluded the type selector and Time zone copy.

## Findings

No actionable P0, P1, or P2 differences remain.

## Comparison history

1. Initial browser capture exposed the hidden end-date control as an extra visible schedule cell, breaking the single-line date/start/end layout.
2. Fix: restored the end-date control’s hidden default and only reveal it in All day mode.
3. Post-fix browser capture shows a single readable date field and one complete start/end time row; date-picker interaction and console checks passed.

## Follow-up polish

No P3 follow-up is required for this scoped change.

final result: passed

---

# Archived QA: CommonGround topbar identity alignment

- Source visual truth: `C:\Users\aryan\AppData\Local\Temp\codex-clipboard-2d61a6c3-e102-4bb2-9b52-d0544c33af6e.png`
- Browser-rendered implementation: `C:\Users\aryan\AppData\Local\Temp\commonground-topbar-after-full.png`
- Focused implementation crop: `C:\Users\aryan\AppData\Local\Temp\commonground-topbar-after-focus.png`
- Normalized comparison: `C:\Users\aryan\AppData\Local\Temp\commonground-topbar-comparison.png`
- Viewport: 1280 × 720 CSS px, desktop dark-mode room view, device pixel ratio 1.5
- Source pixels: 677 × 255. The zoomed reference was normalized to 169 × 64 for the focused comparison.
- Implementation pixels: 1280 × 720 full view; 163 × 60 focused crop. Browser capture was normalized to CSS-pixel dimensions.
- State: guest identity named “Guest”, colour selected, colour menu closed

## Full-view comparison evidence

The full browser capture shows the identity control remaining inside the single-row calendar navigation without clipping, wrapping, or pushing adjacent utilities out of the topbar. At 1280 px the full avatar, name, and colour control remain visible.

## Focused comparison evidence

The normalized comparison places the supplied reference and the rendered identity region together. The requested change is intentionally visible: the colour swatch moves from an approximately 24 px visual footprint to 16 px including its halo, while the clickable colour target remains 30 px. The avatar, name, divider, trigger, and swatch now share one vertical centre.

## Findings

- No remaining P0, P1, or P2 mismatch.
- Fonts and typography: the existing CommonGround font family, weight, and `Guest` label are preserved. The label retains a one-line ellipsis contract for longer names.
- Spacing and layout rhythm: the identity group is 34 px high; its name is 32 px high; avatar and colour target are both 30 px; the swatch is 12 px with a 2 px halo. Measured centres align at the same vertical coordinate.
- Colours and visual tokens: the participant colour remains data-driven through `--swatch-color`; only the topbar swatch footprint changes. Palette-menu swatches remain unchanged.
- Image quality and asset fidelity: no image or icon assets were replaced. The existing avatar initial and colour swatch remain crisp CSS-rendered UI primitives.
- Copy and content: no visible copy changed.

## Comparison history

1. Initial P2: the outer group, colour-menu wrapper, trigger, and swatch mixed 38 px, 36 px, 30 px, and approximately 24 px footprints. This left the trigger top-aligned inside a larger wrapper and made the colour dominate the profile control.
2. Fix: introduced a final scoped geometry contract (`34 / 30 / 30 / 12`), centred the menu wrapper, reduced only the topbar swatch halo, and preserved the 30 px hit target.
3. Responsive P2 found during verification: the higher-specificity desktop menu rule could survive at the 1180 px compact breakpoint.
4. Fix: explicitly hide `.topbar-identity-menu` in the compact media query. Browser measurement now shows the full 127 × 34 px control at 1181 px and exactly one 30 × 30 px avatar button at 1180 px.

## Interaction and console verification

- Colour menu opens from the retained 30 px trigger.
- Clicking outside closes the colour menu.
- Desktop and compact breakpoint states were checked at 1181 px and 1180 px.
- Current local preview produced no warnings or errors for `127.0.0.1:3001`.
- `npm.cmd run check` passed.
- `npm.cmd test` passed, including weather, Command Centre unit/integration, and smoke suites.

## Follow-up polish

- P3: the existing product behavior collapses the identity to an initial-only button at 1180 px and below, so colour selection remains a desktop-only topbar action at those widths. This was pre-existing and is outside the requested alignment change.

final result: passed

---

# CommonGround room-name topbar design QA

- Source visual truth: `C:\Users\aryan\AppData\Local\Temp\codex-clipboard-5f529f6f-625a-4f3d-9bdb-8da655e9e17f.png`
- Implementation screenshot: `C:\Users\aryan\AppData\Local\Temp\implementation-room-header-final.png`
- Combined comparison: `C:\Users\aryan\AppData\Local\Temp\room-header-comparison.png`
- CSS viewport: 1440 x 900
- Source pixels: 663 x 69
- Implementation pixels: 1440 x 794
- Browser device pixel ratio: 1.5
- Density normalization: native-density source and implementation with a focused 64–69px topbar crop.
- State: dark-mode weekly room calendar, topbar at rest after inline editing.

## Full-view comparison evidence

The implementation retains the existing CommonGround logo and the original left-to-right control sequence. The adjacent wordmark is replaced by the active room name without changing the surrounding topbar proportions. The full calendar capture confirms the header remains aligned with the calendar shell and sidebar.

## Focused region comparison evidence

The combined comparison focuses on the affected region. Logo scale, header height, text weight, Today control, navigation arrows, and period label remain visually consistent with the reference. The implementation intentionally continues into the existing Ask CommonGround and connection controls because the live viewport is wider than the reference crop.

## Required fidelity surfaces

- Fonts and typography: passed. The room name inherits the existing Inter/Roboto/system topbar stack, weight, line height, and antialiasing.
- Spacing and layout rhythm: passed. Logo-to-title spacing and control alignment are preserved; long names are capped and ellipsized.
- Colors and visual tokens: passed. Resting text and editing focus treatment use the existing shell and gold brand tokens.
- Image quality and asset fidelity: passed. The supplied CommonGround app icon remains the original raster asset with unchanged size and crop.
- Copy and content: passed. The static `CommonGround` wordmark is replaced by the live room name, while the logo remains.

## Interaction evidence

- Double-clicking the topbar name entered a focused `contenteditable` state.
- Host-only edit affordance, Enter-to-save, Escape-to-cancel, and blur-to-save paths are wired to the existing room PATCH lifecycle.
- The sidebar and topbar are synchronized from the same room state.
- Browser console warnings/errors checked: none.

## Findings

No actionable P0, P1, or P2 differences remain.

## Comparison history

- Initial pass: P2 persistent focus outline remained after finishing the edit.
- Fix: the inline editor now releases focus after commit or cancel.
- Post-fix evidence: `implementation-room-header-final.png` shows the resting title without a residual border; the combined comparison confirms alignment with the reference.

## Follow-up polish

No P3 follow-up is required for this scoped change.

final result: passed
