# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Single-file static HTML/CSS/JS. One self-contained `index.html` with no build step and no runtime dependencies. Confirmed by the user so the file can be opened directly from the Desktop for testing and later served from a Cloudflare Worker as a static asset.

## Users

A single sim racing driver (the owner) who races Le Mans Ultimate and Assetto Corsa Competizione on PC. They log lap times after a session — typically alt-tabbed out of the sim or on a phone next to the rig — and come back later to see whether they are actually getting faster at a given track and car combination.

Single-owner by design. Cloudflare Access handles sign-in for the hosted version;
there is no application account system, sharing, or multi-driver support.

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
- Hosting target is a Cloudflare Worker serving the interface and a D1-backed API.

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
- The hosted version uses D1 as its saved record and Cloudflare Access restricted to
  aaronbasil9400@gmail.com. The Worker checks the authenticated email on every request.
- Browser `localStorage` caches the hosted record and retains pending changes. Visible
  status distinguishes device-only changes from confirmed cloud saves. Stale revisions
  cause a conflict; they never overwrite newer changes from another device.
- Opening the standalone HTML file keeps browser-only operation without API requests.
- JSON export is an independent backup in either mode and must remain easy to find.
- Must work well on both desktop and mobile.
- No CDN fonts, analytics, or chart library. The hosted version uses same-origin API
  requests; the standalone file works offline and from file://.

**Explicitly undecided:**
- Sector times (S1/S2/S3) were offered and not selected. Not in scope.
- Gap-to-benchmark comparison was offered and not selected. Not in scope.
- D1 cloud storage was explicitly requested after the initial local-only build. Production
  deployment requires the intended account, a real D1 binding, and the Access policy.

## Evidence on Hand

**Circuit rosters** researched from public sources (trophi.ai, Traxion, Steam DLC listings, official LMU site), current to October 2026:

- **LMU**: 7 base circuits (2023 WEC calendar) + 2024 Packs 1/2/3/5 + ELMS Packs 1/2/3 + US Track Packs. 19 circuits listed officially; US Track Pack 3 (2 circuits) is announced for December 2026 and not yet named.
- **ACC**: 11 base circuits + British GT Pack (3) + Intercontinental GT Pack (4) + 2020 GT World Challenge Pack (1) + American Track Pack (3) + 2023 GT World Challenge Pack (1) + GT2 Pack (1) + 24H Nürburgring Pack (1).

Car lists are bundled from each game's known rosters. Both roster types must remain user-extensible, since LMU content is still shipping.

The owner supplied 56 real LMU laps across 10 circuits and 22 ACC laps across 8 circuits.
The imports are preserved at data/personal-lmu-laptimes-2026-10-25.json and
data/personal-acc-laptimes-2026-10-25.json, including the custom LMU Lexus RC F GT3.
Lap dates, sessions and conditions were not supplied and remain unrecorded. The Algarve
BMW/911 abbreviations were mapped to BMW M4 GT3 and Porsche 911 GT3 R LMGT3.
Synthetic sample data remains separately labeled and removable.

## Product Principles

1. **Entry speed is the product.** If logging a lap takes more than a few seconds, the record stops being kept and every other feature becomes worthless.
2. **A lap time is a number with context.** Track, car, and conditions are what make an entry still readable months later; the UI should capture them without turning entry into a form-filling chore.
3. **The roster is never finished.** LMU ships new circuits on a rolling schedule. Any design that assumes a fixed dropdown is wrong within a quarter.
4. **Local data demands a visible exit.** With no backend, export is not a power-user feature — it is the only thing standing between the user and losing everything to a cleared browser cache.
5. **Analysis must answer a question, not display a dataset.** Every view earns its place by answering "am I faster?" or "where am I slow?"

## Accessibility & Inclusion

No user-specific requirement established. Standard obligations apply: the interface is used on a phone in low light next to a sim rig, so touch targets, contrast, and legibility at small sizes carry real weight.
