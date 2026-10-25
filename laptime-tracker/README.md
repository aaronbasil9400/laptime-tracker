# Lap Times — LMU · ACC

A personal lap time tracker for **Le Mans Ultimate** and **Assetto Corsa Competizione**.
One self-contained HTML interface. Open it from disk for local-only use, or deploy the
Worker with D1 and Cloudflare Access for a private record shared across devices.

---

## Open it

Double-click `index.html`. It runs straight from disk.

When opened directly from disk, data lives in your browser's `localStorage`, scoped to the origin you open it from.
Opening the file from disk and later from a Worker are **different origins** — they do
not share data. Use **Data → Backup JSON** to move your record between them.

---

## The four views

| View | What it does |
|---|---|
| **Log** | Search for a circuit and car, or tap a recent combination. Type `1:43.271` or `103.271` seconds. Session details stay collapsed with their defaults visible; circuit, car, session and conditions are remembered. Filter history by game, circuit, car and session. |
| **Timing** | Personal bests per circuit, expandable to a per-car breakdown. Your fastest lap at each circuit is the headline. |
| **Analysis** | Progression for one game, circuit, car and condition, with each lap and a best-so-far line. Median change compares the latest third with the earliest third after six matched laps. Consistency groups keep cars and conditions separate, require three laps, and open their progression when selected. |
| **Data** | CSV export, JSON backup, CSV/JSON import, storage stats, and the circuit/car library. |

Keyboard: `1`–`4` switch views, `n` jumps to the lap time field.

---

## Export & analysis

**CSV** is the analysis format. Columns:

```
id, game, circuit, country, car, class, lap_time, lap_ms, session, conditions, date, notes
```

`lap_time` is the readable `M:SS.mmm`; `lap_ms` is integer milliseconds so spreadsheets
can do real arithmetic. Open in Excel, Sheets, or Numbers and pivot on `circuit` or `car`.

**Import** accepts a CSV exported from here, or a JSON backup. Unknown circuits and cars
in an imported CSV are registered automatically, so a file from a friend or a future
version of this app won't lose rows. Re-importing the same file is a no-op — rows are
de-duplicated by `id`.

Historical imports can leave dates, sessions and conditions unrecorded. These entries still
contribute to personal bests and pace statistics. Only dated laps appear on the progression
timeline or contribute to median change; missing dates are never replaced with today's date.

---

## Circuits included

**Le Mans Ultimate** — 18 circuits, base game through the 2026 US Track Packs:
Circuit de la Sarthe, Monza, Spa-Francorchamps, Sebring, Bahrain, Portimão, Fuji, Imola,
COTA, Interlagos, Lusail, Silverstone, Paul Ricard, Barcelona-Catalunya, Daytona,
Laguna Seca, Road Atlanta, Long Beach.

**Assetto Corsa Competizione** — 25 circuits across base game and all DLC:
Barcelona, Brands Hatch, Hungaroring, Misano, Monza, Nürburgring GP, Paul Ricard,
Silverstone, Spa, Zandvoort, Zolder, Donington, Oulton Park, Snetterton, Kyalami,
Suzuka, Laguna Seca, Mount Panorama, Imola, COTA, Indianapolis, Watkins Glen, Valencia,
Red Bull Ring, Nürburgring Nordschleife 24H.

Both rosters are **user-extensible**. LMU is still shipping content — US Track Pack 3
(2 circuits) is announced for December 2026 and not yet named. When it lands, use
**Data → Add circuit** and it appears in the entry form immediately.

---

## Private cloud storage

The hosted app uses D1 as its saved record, protected by Cloudflare Access and an exact
owner-email check in the Worker. Browser storage caches the record and retains pending
changes when offline. The sync panel distinguishes device-only changes from confirmed
cloud saves. Another device's newer revision produces a conflict instead of being overwritten.
Back up local changes before choosing **Load cloud record** to resolve a conflict.

`GET /api/state` reads the record and revision. `PUT /api/state` validates the record and
applies additions, edits, removals and roster changes in one D1 transaction. A unique write
token gates every statement after the revision claim, so rejected stale requests cannot
delete or overwrite rows. Records are stored individually in `laps` and `custom_roster`.
The API accepts at most 5,000 laps and a 1,900,000-byte request body per sync.

### Setup and deployment

The configured account is `b94afbadc132814062291afba7c06c0c`, Worker `laptime-tracker`,
owner `aaronbasil9400@gmail.com`. Remote commands use a separate Wrangler auth profile.

1. Authenticate: `npx wrangler auth create laptime-tracker` and choose the configured account.
2. Bind the profile to this directory with `npx wrangler auth activate laptime-tracker`,
   then confirm it with `npx wrangler whoami`.
3. Create or select `laptime-tracker-db` in that account. Record its actual UUID as
   `database_id` in the `[[d1_databases]]` binding before deploying.
4. Apply the schema with `npm run db:migrate:remote`.
5. Run `npm run db:seed:prepare`, then `npx wrangler d1 execute DB --remote --file .wrangler/seed.sql --profile laptime-tracker`.
   The seed preserves existing lap IDs and imports the 56 supplied laps and the custom Lexus.
6. In the Worker's **Access** tab, protect **All traffic** and allow only the configured
   owner's exact email. Protect production and previews, not only the preview URL.
7. Run `npm run deploy`. Verify owner sign-in works and signed-out access is blocked.

The Worker fails closed when Access did not run, the email differs, or the database binding
is unavailable. `access.dev` only simulates the owner during local development; it does not
configure production Access. Deployment is incomplete until the real Access policy is applied.

### Local cloud testing

Run `npm ci`, `npm run db:migrate:local`, then `npm run dev -- --port 8788`.
In another terminal run `npm run test:cloud`. Tests only accept localhost URLs; they exercise
real local D1 storage, stale and simultaneous writes, invalid data and cross-origin rejection.
They restore the 56-lap fixture after testing and never modify remote data.

## Hosting on Cloudflare Workers

The repo includes `worker.js` and `wrangler.toml`. The Worker imports `index.html` as
text and serves it with a CSP that permits requests to the same Worker's API.

```bash
npm install
npm run db:migrate:local
npx wrangler dev      # private cloud simulation at http://localhost:8787
```

The interface has no CDN fonts, analytics or chart library. The hosted version makes
same-origin API requests to save and load D1 data. The standalone HTML version makes
no API requests and works entirely from browser storage.

### About the CSP

`style-src` and `script-src` allow `'unsafe-inline'` because the CSS and JS are inline in
the single HTML file. That is the trade for having one file you can open from disk. If you
later want a stricter policy, split the `<style>` and `<script>` into `app.css` and `app.js`,
switch the CSP to `'self'`, and serve them as assets.

---

## Files

```
index.html      the entire app
worker.js       Access-protected Worker and sync API
storage.js      validation and transactional D1 storage
migrations/     database schema
scripts/        idempotent seed generation and local integration checks
wrangler.toml   Worker config
PRODUCT.md      product decisions and constraints
DESIGN.md       design system: tokens, type ramp, components
```

---

## Known limits

- **Standalone mode is per-browser.** The hosted D1 version syncs across signed-in devices.
- **Offline changes are device-local until confirmed.** Keep the page or a JSON backup until sync succeeds.
- **No sector times.** S1/S2/S3 splits were scoped out deliberately.
- **No benchmark comparison.** Gap-to-reference-time was scoped out.
- **Single owner.** Cloudflare Access handles sign-in; no sharing or leaderboards.

Exported JSON and CSV remain independent backups in either mode.
