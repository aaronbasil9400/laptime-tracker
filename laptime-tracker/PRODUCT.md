# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Single-file static HTML/CSS/JS. One self-contained `index.html` with no build step and no runtime dependencies. Confirmed by the user so the file can be opened directly from the Desktop for testing and later served from a Cloudflare Worker as a static asset.

## Users

A single sim racing driver (the owner) who races Le Mans Ultimate and Assetto Corsa Competizione on PC. They log lap times after a session — typically alt-tabbed out of the sim or on a phone next to the rig — and come back later to see whether they are actually getting faster at a given track and car combination.

Single-user by design. No accounts, no sharing, no multi-driver support.

## Product Purpose

Record lap times across two sims and turn that record into an answer to "am I improving, and where am I slow?"

Three jobs, in order of frequency:
1. **Log** — add a lap quickly, with enough context that the entry is still meaningful months later.
2. **Review** — see personal bests per track/car combination.
3. **Analyze** — see progression over time for a track/car pairing, and compare performance across circuits.

Success means the user keeps logging laps because entry is fast, and that the analysis views change what they practice.

## Positioning

Telemetry tools analyze a single lap in depth. This tracks the long arc across two sims in one place — a personal record of pace over months, spanning games that no single in-game leaderboard covers together.

## Operating Context

- Used immediately after a session, often one-handed on a phone, sometimes alt-tabbed from a running sim.
- The user already knows the lap time; they are transcribing it, not discovering it. Entry speed matters more than entry cleverness.
- Lap times are read off a sim in `M:SS.mmm` format (e.g. `1:43.271`). Input must accept that format natively.
- Track and car rosters differ per game and expand with DLC releases; LMU in particular is still receiving content through 2026.
- Hosting target is a Cloudflare Worker serving the file as a static asset.

## Capabilities and Constraints

**Confirmed capabilities:**
- Add, edit, and delete lap entries.
- Per-entry fields: game (LMU / ACC), track, car, class, lap time, session type, conditions/weather, date, notes.
- Session types: Practice, Qualifying, Race, Hotlap/Time Attack, Test/Setup run.
- Bundled track and car lists for both games, plus user-added custom tracks and cars for future DLC.
- Personal best leaderboard per track/car combination.
- Progression chart showing lap time over time for a selected track/car.
- Track-vs-track comparison of consistency and delta to PB.
- CSV export of all data.
- CSV import, so an export can be restored or edited in a spreadsheet and brought back.
- Filtering by game, track, car, and session type.

**Confirmed constraints:**
- Data persists in browser `localStorage`. No backend, no database, no sync.
- Because storage is per-browser, the export path doubles as the backup and device-transfer mechanism. This must be obvious in the UI, not buried.
- Must work well on both desktop and mobile.
- No external network requests at runtime — no CDN fonts, no analytics, no chart library. Everything inlined so the file works offline and from `file://`.

**Explicitly undecided:**
- Sector times (S1/S2/S3) were offered and not selected. Not in scope.
- Gap-to-benchmark comparison was offered and not selected. Not in scope.
- A future migration to Cloudflare D1 is possible but not planned; `localStorage` was chosen deliberately over a D1-ready abstraction.

## Evidence on Hand

**Circuit rosters** researched from public sources (trophi.ai, Traxion, Steam DLC listings, official LMU site), current to October 2026:

- **LMU**: 7 base circuits (2023 WEC calendar) + 2024 Packs 1/2/3/5 + ELMS Packs 1/2/3 + US Track Packs. 19 circuits listed officially; US Track Pack 3 (2 circuits) is announced for December 2026 and not yet named.
- **ACC**: 11 base circuits + British GT Pack (3) + Intercontinental GT Pack (4) + 2020 GT World Challenge Pack (1) + American Track Pack (3) + 2023 GT World Challenge Pack (1) + GT2 Pack (1) + 24H Nürburgring Pack (1).

Car lists are bundled from each game's known rosters. Both roster types must remain user-extensible, since LMU content is still shipping.

No real lap time data exists yet. Any lap times shown in an empty-state or demo context are synthetic and must be labeled or removable — they must never be mistaken for the user's own record.

## Product Principles

1. **Entry speed is the product.** If logging a lap takes more than a few seconds, the record stops being kept and every other feature becomes worthless.
2. **A lap time is a number with context.** Track, car, and conditions are what make an entry still readable months later; the UI should capture them without turning entry into a form-filling chore.
3. **The roster is never finished.** LMU ships new circuits on a rolling schedule. Any design that assumes a fixed dropdown is wrong within a quarter.
4. **Local data demands a visible exit.** With no backend, export is not a power-user feature — it is the only thing standing between the user and losing everything to a cleared browser cache.
5. **Analysis must answer a question, not display a dataset.** Every view earns its place by answering "am I faster?" or "where am I slow?"

## Accessibility & Inclusion

No user-specific requirement established. Standard obligations apply: the interface is used on a phone in low light next to a sim rig, so touch targets, contrast, and legibility at small sizes carry real weight.
