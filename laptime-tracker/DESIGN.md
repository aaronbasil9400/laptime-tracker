# Design

<!-- impeccable:design-schema 1 -->

## Identity

A lap time tracker that reads like the timing screen of a race car: dark, precise,
instrument-grade. The interface behaves like a piece of pit-wall equipment — flat charcoal
plates, hairline rules, monospaced figures that never shift width — rather than a
consumer fitness app.

Mode: **Operate**. The visitor is completing a task under time pressure (just out of the
sim), often one-handed. Expression lives in precision, not decoration.

## Color

Dark-only. The scene: a dim room, a rig, a monitor at low brightness, a phone on the desk.
A light theme would be glare, not clarity.

| Token | Value | Role |
|---|---|---|
| `--ground` | `#0B0D10` | Page field |
| `--plate` | `#111418` | Card surface |
| `--plate-2` | `#161A1F` | Inputs, nested rows |
| `--plate-3` | `#1C2128` | Hover, active input |
| `--rule` | `#232930` | Default hairline |
| `--rule-2` | `#2E353E` | Control borders |
| `--rule-3` | `#3B444F` | Emphasis border |

Text ramp, all verified ≥ 4.5:1 on every surface above:

| Token | Value | Use |
|---|---|---|
| `--ink` | `#EAEDF0` | Primary text, times |
| `--ink-2` | `#A7B0BA` | Secondary text |
| `--ink-3` | `#868F9C` | Labels, metadata |
| `--ink-4` | `#8B94A0` | Micro-labels, disabled |

Accents are semantic only, never decorative:

- `--purple` `#B57BFF` — personal best. The one colour that means something.
- `--green` `#3FDD8C` — improvement, tight consistency.
- `--amber` `#FFB020` — caution, loose consistency.
- `--red` `#FF5A5F` — destructive only.

Colour strategy: **Restrained**. Neutrals plus one meaning-bearing accent. Purple appears
only where a lap is actually your best, which is what makes it legible at a glance.

## Type

`--font-ui`: `"Bahnschrift", "DIN Alternate", "Roboto Condensed", "Segoe UI", system-ui`
— condensed grotesque, the lettering of motorsport timing and signage. All system-available;
no webfont, because the file must work offline and from `file://`.

`--font-mono`: `"Cascadia Mono", "Cascadia Code", Consolas, "SF Mono", "Roboto Mono", ui-monospace`
— every time, delta, and statistic. Tabular figures throughout so columns never jitter.

Size ramp (nothing below 11px, body 14px):

| Role | Size | Weight | Tracking |
|---|---|---|---|
| View title `h2` | 24px / 28px desktop | 700 | -0.01em |
| Lap time (hero input) | 32px mono | 600 | 0.01em |
| Lap time (row) | 18px mono | 600 | — |
| Statistic value | 19px mono | 600 | — |
| Plate title `h3` | 13px | 700 | 0.12em, caps |
| Body / prose | 14px | 400 | — |
| Lap track name | 13px | 600 | — |
| Field label | 11px | 600 | 0.12em, caps |
| Metadata / detail | 11px | 600 | 0.07em, caps |

Hierarchy steps by 1.25× or more at every level. Micro-labels are uppercase with wide
tracking so they read as instrumentation rather than small body copy.

## Layout

**Mobile:** single column. Sticky masthead at 58px. Fixed bottom rail with four
destinations, 58px tall plus safe-area inset. Main content pads 78px at the bottom so
nothing hides behind the rail.

**Desktop (≥900px):** two-pane. Fixed 232px left rail, sticky, full height, with the
storage note anchored at its foot. Masthead spans both columns and reveals a live
metadata strip (laps, circuits, fastest, last logged).

**Desktop (≥1100px):** the Log view splits into entry form (430px) beside the lap list,
so you can add a lap and watch it land without scrolling.

Plates are the only container. Each carries 6px corner ticks — a crop-mark detail that
reads as instrument panel, not decoration.

## Components

- **Plate** — 1px `--rule` border, 2px radius, corner ticks at top-left and bottom-right.
- **Plate head** — 44px min-height, `h3` title, right-aligned note.
- **Input** — 44px min-height, `--plate-2`, 1px `--rule-2`. Focus swaps to `--plate-3`
  with a lighter border. No glow, no ring beyond the global focus-visible outline.
- **Segmented control** — used for game selection. Pressed state inverts to `--ink` on
  `--ground`.
- **Button** — 44px, uppercase 12px 700 with 0.1em tracking. Primary inverts to solid
  `--ink`. Ghost for everything secondary.
- **Lap row** — three-column grid: time, meta, actions. Detail line (session, conditions,
  date, class, notes) sits below on mobile, and reveals on hover on desktop.
- **Timing group** — disclosure row, circuit name plus lap/car counts, best time in purple
  at right, chevron rotates 90° on open.
- **Stat strip** — 2×2 on mobile, 1×4 on desktop, hairline divided.

## Motion

Deliberately minimal. State changes are 90ms linear — a step, not an ease. The only
entrance animation is the toast (140ms, 6px rise). No scroll reveals, no parallax, no
hover scale. Under `prefers-reduced-motion` every duration drops to ~0.

The reasoning: this is an instrument. An instrument that animates is an instrument you
distrust.

## Interaction rules

- Time input validates live and echoes the parsed value in green, or flags unreadable
  input in red before submit.
- On blur, a valid time reformats to canonical `M:SS.mmm`.
- After submit the form clears the time but keeps circuit and car, and `lastUsed` persists
  to `localStorage` — so the second lap of a stint is one field and Enter.
- Destructive actions always route through a native `<dialog>` with an explicit verb.
- Empty states explain what will appear and never show fake data unlabelled.

## Data presentation

- Times always monospaced and tabular. Never proportional.
- Personal bests in `--purple`, everywhere, consistently.
- Deltas signed with a true minus `−`, three decimals, prefixed `+`/`−`.
- Charts are hand-drawn SVG — no library. Progression shows each lap as a hairline
  polyline with dots, plus a dashed purple best-so-far line. Axis labels at 9–10px
  inside the SVG are chart furniture, not UI text.
- Consistency bars are relative to the loosest circuit, so the worst case is always full
  width and every other bar is read against it.

## Accessibility

- Every text/background pair verified at ≥ 4.5:1 across all four surface tokens.
- All interactive targets ≥ 40px, 44px on coarse pointers.
- `aria-pressed` on segmented controls, `aria-expanded` on disclosures, `aria-current="page"`
  on the rail, `aria-live` on the toast stack.
- Native `<dialog>` for confirmations, so focus trapping and Escape come from the platform.
- Keyboard: `1`–`4` switch views, `n` focuses the time field. Enter submits from the time input.
- Labels are real `<label>` elements bound by `for`; filter selects carry `.sr` labels.
