# Lap Times — LMU · ACC

A personal lap time tracker for **Le Mans Ultimate** and **Assetto Corsa Competizione**.
One self-contained HTML file. No build step, no dependencies, no backend.

---

## Open it

Double-click `index.html`. It runs straight from disk.

Data lives in your browser's `localStorage`, scoped to the origin you open it from.
Opening the file from disk and later from a Worker are **different origins** — they do
not share data. Use **Data → Backup JSON** to move your record between them.

---

## The four views

| View | What it does |
|---|---|
| **Log** | Add a lap. Type the time as `1:43.271` and it validates live. Circuit, car, session and conditions are remembered from your last entry, so logging the next lap is one field and a button. |
| **Timing** | Personal bests per circuit, expandable to a per-car breakdown. Your fastest lap at each circuit is the headline. |
| **Analysis** | Progression chart for one circuit + car (each lap, plus a best-so-far line), and a circuit comparison ranked by how repeatable your pace is. |
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

## Hosting on Cloudflare Workers

The repo includes `worker.js` and `wrangler.toml`. The Worker imports `index.html` as
text and serves it with a strict CSP.

```bash
npm install
npx wrangler login
npx wrangler dev      # test locally at http://localhost:8787
npx wrangler deploy
```

Because everything is inlined, the page makes **zero network requests** — no fonts, no
analytics, no chart library. It works offline and the CSP in `worker.js` enforces that
(`default-src 'none'`).

### About the CSP

`style-src` and `script-src` allow `'unsafe-inline'` because the CSS and JS are inline in
the single HTML file. That is the trade for having one file you can open from disk. If you
later want a stricter policy, split the `<style>` and `<script>` into `app.css` and `app.js`,
switch the CSP to `'self'`, and serve them as assets.

---

## Files

```
index.html      the entire app
worker.js       Cloudflare Worker entry point
wrangler.toml   Worker config
PRODUCT.md      product decisions and constraints
DESIGN.md       design system: tokens, type ramp, components
```

---

## Known limits

- **Per-browser storage.** No sync. Clearing site data deletes your record. Export.
- **No sector times.** S1/S2/S3 splits were scoped out deliberately.
- **No benchmark comparison.** Gap-to-reference-time was scoped out.
- **Single user.** No accounts, no sharing, no leaderboards.

If you later want multi-device sync, the natural path is Cloudflare D1 plus a thin API in
`worker.js`. The data shape is already flat and serialisable, so the migration is
mechanical: replace the `save()`/`load()` pair with fetch calls.
