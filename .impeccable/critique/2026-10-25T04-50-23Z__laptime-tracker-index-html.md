---
target: Lap Times UI
total_score: 30
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-10-25T04-50-23Z
slug: laptime-tracker-index-html
---
# Lap Times UI Critique

Method: dual-agent (A: design_assessment; B: detector_browser)
Target: laptime-tracker/index.html
Mode: Operate

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of system status | 3 | Clear validation and save feedback; success is transient. |
| 2 | Match with the real world | 4 | Lap-time and racing terms match the driver's workflow. |
| 3 | User control and freedom | 3 | Edit, delete, and cancel exist; delete has no undo. |
| 4 | Consistency and standards | 3 | Strong system, with a few misleading or hidden states. |
| 5 | Error prevention | 3 | Required fields are checked, but the visible cancel control can clear a new-entry draft. |
| 6 | Recognition rather than recall | 3 | Labels and retained selections help; desktop lap details require hover. |
| 7 | Flexibility and efficiency | 3 | N, 1-4, Enter, and retained selections help; shortcuts are undisclosed. |
| 8 | Aesthetic and minimalist design | 3 | Cohesive timing-screen look and clear task focus. |
| 9 | Error recovery | 3 | Time and import errors give feedback; imports lack row-level diagnostics. |
| 10 | Help and documentation | 2 | Hints and empty states help, but there is no task-focused help. |
| **Total** | | **30/40** | **Good foundation; fix trust and access gaps.** |

## Design Specificity Verdict

The dark plates, tabular lap-time display, LMU/ACC control, and personal-best accent clearly belong to a sim-racing tracker. The visual language is coherent, though it could also fit another racing logger.

CLI detector: exit 0, returned zero findings, but ran in regex fallback mode because parser dependencies were unavailable. Custom properties, selector matching, and computed contrast were not evaluated. In the browser, the detector script loaded, then failed on an invalid regular expression. No reliable overlay appeared. Treat the scan as incomplete, not a clean bill of health.

## Overall Impression

This is a focused, distinctive tool with a fast repeat-entry path. The biggest opportunity is to make analysis trustworthy and first-use logging less demanding. The current Pace gained statistic compares unlike laps and can mislead the driver about improvement.

## What's Working

- The large time field accepts the sim's M:SS.mmm format and validates as the driver types.
- The restrained colors, monospaced figures, and flat plates create a convincing timing-instrument identity.
- The app is honest about browser-local storage and gives CSV and JSON export paths instead of implying the data is synced.

## Priority Issues

1. **[P1] Cancel edit is visible during a new entry and clears the draft.** The button has a hidden attribute, but the .btn CSS rule sets display:inline-flex, which overrides it. In the add state, the label is wrong; clicking it resets the form. Hide it until editing, or provide an accurately labeled draft-clear action. Suggested: $impeccable harden. Evidence: index.html lines 251, 657, 1288-1299, 1363.

2. **[P1] Pace gained compares unrelated combinations.** It compares the oldest and newest thirds of all laps, mixing circuits, games, and cars. A faster lap at a different track can appear as driver improvement. Calculate this for one selected combo or remove the aggregate metric. Suggested: $impeccable shape. Evidence: index.html lines 1613-1621, 1629.

3. **[P2] First-entry logging exposes too many decisions at once.** The form shows game, time, circuit, car, session, conditions, date, and notes. Offer a recent-combination choice or searchable circuit/car controls; put secondary context fields behind a compact details disclosure. Suggested: $impeccable distill. Evidence: index.html lines 605-657, 1240-1255, 1354-1360.

4. **[P2] Lap context is hover-only on desktop.** Session, conditions, date, class, and notes are hidden until pointer hover, with no keyboard-focus equivalent. Keep a compact context line visible or reveal it on focus too. Suggested: $impeccable adapt. Evidence: index.html lines 521-526, 1467-1482.

5. **[P2] Reviewing a specific combo takes extra navigation.** The lap list can filter by game and session, but not circuit or car. The comparison view focuses on consistency and best times. Add circuit/car filters and let a comparison row open that combo's progression. Keep the analysis personal; external benchmark times are out of scope. Suggested: $impeccable shape. Evidence: index.html lines 668-687, 1785-1828.

## Cognitive Load

Moderate: 3 of 8 checks fail. The first-entry form presents many fields at once, track/car menus expose long rosters without visible search or recent combos, and optional context fields are not progressively disclosed. Grouping and visual hierarchy are otherwise strong, and remembering the last circuit/car makes repeat logging much faster.

## Emotional Journey

The prominent time input makes logging feel straightforward. First entry still involves several selections; subsequent laps benefit from retained choices and Enter-to-submit. Validation and the success toast reassure, but the mixed-context progress metric can undermine trust. The storage warning is clear in Data, though users may reach it after they have already built a record.

## Persona Red Flags

- Alex, power user: Repeat logging is efficient once a combo is selected. First-entry setup takes longer, and shortcuts are not advertised.
- Jordan, first-timer: Labels and the time example are clear. The visible Cancel edit button can look like a normal escape action and discard the current draft.
- Sam, keyboard user: Native controls and real labels help. Desktop lap details are not exposed by keyboard focus; the input focus style also removes the global outline, leaving only the border change.

## Minor Observations

- The Import header says merge or replace, but the importer only merges and skips duplicate IDs.
- The empty Laps panel takes substantial space before the first record.

## Questions to Consider

- Should first use ask for the driver's usual combo, then make routine logging time-first?
- Should Pace gained be limited to a selected car/circuit combination?
- Could a comparison row open the progression view for the same combo?
