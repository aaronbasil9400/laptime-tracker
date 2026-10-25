import fs from 'node:fs/promises';
import path from 'node:path';
import { validateState } from '../storage.js';

const source = process.argv[2] || 'data/personal-lmu-laptimes-2026-10-25.json';
const destination = process.argv[3] || '.wrangler/seed.sql';
const state = validateState(JSON.parse(await fs.readFile(source, 'utf8')));
const sql = value => value === null ? 'NULL' : typeof value === 'number' ? String(value) : "'" + String(value).replaceAll("'", "''") + "'";
const lines = ['-- Idempotent import: existing lap IDs and roster names are preserved.'];
if (state.laps.length) lines.push('INSERT OR IGNORE INTO laps (id,game,track,car,lap_ms,lap_date,data,updated_at) VALUES\n' + state.laps.map(lap =>
  '(' + [lap.id,lap.game,lap.track,lap.car,lap.lapMs,lap.date || null,JSON.stringify(lap),Date.now()].map(sql).join(',') + ')').join(',\n') + ';');
for (const game of ['lmu','acc']) for (const kind of ['tracks','cars']) for (const data of state.custom[game][kind]) {
  lines.push('INSERT OR IGNORE INTO custom_roster (key,game,kind,data) VALUES (' + [JSON.stringify([game,kind,data.n]),game,kind,JSON.stringify(data)].map(sql).join(',') + ');');
}
lines.push('UPDATE sync_meta SET revision = revision + 1, write_token = \'seed-import\' WHERE id = 1;');
await fs.mkdir(path.dirname(destination), { recursive: true });
await fs.writeFile(destination, lines.join('\n') + '\n');
console.log(`Prepared ${state.laps.length} laps in ${destination}`);
