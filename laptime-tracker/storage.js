const MAX_BODY_BYTES = 1900000;
const GAMES = ['lmu', 'acc'];

export class InputError extends Error {}

function text(value, name, limit, optional = false) {
  if (typeof value !== 'string' || value.length > limit || (!optional && !value.trim())) {
    throw new InputError('Invalid ' + name);
  }
  return value;
}

export function validateState(input) {
  if (!input || !Array.isArray(input.laps) || input.laps.length > 5000) {
    throw new InputError('Expected a record with at most 5,000 laps');
  }
  const ids = new Set();
  const laps = input.laps.map(lap => {
    if (!lap || !GAMES.includes(lap.game)) throw new InputError('Invalid game');
    const id = text(lap.id, 'lap ID', 160);
    if (ids.has(id)) throw new InputError('Duplicate lap ID');
    ids.add(id);
    if (!Number.isSafeInteger(lap.lapMs) || lap.lapMs <= 0 || lap.lapMs > 86400000) throw new InputError('Invalid lap time');
    if (!Number.isSafeInteger(lap.created) || lap.created <= 0) throw new InputError('Invalid record creation time');
    const date = lap.date || '';
    if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) throw new InputError('Invalid lap date');
    return {
      id, game: lap.game, created: lap.created,
      track: text(lap.track, 'circuit', 200), car: text(lap.car, 'car', 200),
      cls: text(lap.cls || '', 'class', 80, true), lapMs: lap.lapMs,
      session: text(lap.session || 'Not recorded', 'session', 80),
      cond: text(lap.cond || 'Not recorded', 'conditions', 80), date,
      notes: text(lap.notes || '', 'notes', 1000, true),
      ...(lap.sample === true ? { sample: true } : {})
    };
  });
  const custom = {};
  for (const game of GAMES) {
    custom[game] = { tracks: [], cars: [] };
    for (const kind of ['tracks', 'cars']) {
      const entries = input.custom?.[game]?.[kind] || [];
      if (!Array.isArray(entries) || entries.length > 300) throw new InputError('Invalid custom roster');
      const names = new Set();
      custom[game][kind] = entries.map(entry => {
        const name = text(entry?.n, 'roster name', 200);
        if (names.has(name)) throw new InputError('Duplicate roster entry');
        names.add(name);
        return kind === 'tracks' ? { n: name, c: text(entry.c || '', 'country', 100, true) }
          : { n: name, k: text(entry.k || 'Other', 'class', 80) };
      });
    }
  }
  return { v: 1, laps, custom };
}

export async function readBody(request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    throw new InputError('Send application/json');
  }
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) throw new InputError('Record is too large');
  if (!request.body) throw new InputError('Request body is required');
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0, body = '';
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_BODY_BYTES) { await reader.cancel(); throw new InputError('Record is too large'); }
      body += decoder.decode(chunk.value, { stream: true });
    }
    body += decoder.decode();
    try { return JSON.parse(body); } catch { throw new InputError('Invalid JSON'); }
  } finally { reader.releaseLock(); }
}

export async function readState(binding) {
  const db = binding.withSession('first-primary');
  const [meta, laps, roster] = await db.batch([
    db.prepare('SELECT revision FROM sync_meta WHERE id = 1'),
    db.prepare('SELECT data FROM laps ORDER BY id'),
    db.prepare('SELECT game, kind, data FROM custom_roster ORDER BY key')
  ]);
  const custom = { lmu: { tracks: [], cars: [] }, acc: { tracks: [], cars: [] } };
  for (const row of roster.results) custom[row.game][row.kind].push(JSON.parse(row.data));
  return { revision: meta.results[0].revision, state: { v: 1, laps: laps.results.map(row => JSON.parse(row.data)), custom } };
}

export async function writeState(binding, state, revision) {
  if (!Number.isSafeInteger(revision) || revision < 0) throw new InputError('Invalid cloud revision');
  const db = binding.withSession('first-primary');
  const token = crypto.randomUUID();
  const laps = JSON.stringify(state.laps);
  const roster = JSON.stringify(GAMES.flatMap(game => ['tracks', 'cars'].flatMap(kind =>
    state.custom[game][kind].map(data => ({ key: JSON.stringify([game, kind, data.n]), game, kind, data })) )));
  // The unique claim token gates every mutation. A stale writer cannot alter rows even
  // if another request has already advanced the revision. D1 commits the batch atomically.
  const result = await db.batch([
    db.prepare('UPDATE sync_meta SET revision = revision + 1, write_token = ? WHERE id = 1 AND revision = ?').bind(token, revision),
    db.prepare("DELETE FROM laps WHERE id NOT IN (SELECT json_extract(value, '$.id') FROM json_each(?)) AND (SELECT write_token FROM sync_meta WHERE id = 1) = ?").bind(laps, token),
    db.prepare(`INSERT INTO laps (id, game, track, car, lap_ms, lap_date, data, updated_at)
      SELECT json_extract(value, '$.id'), json_extract(value, '$.game'), json_extract(value, '$.track'),
        json_extract(value, '$.car'), json_extract(value, '$.lapMs'), NULLIF(json_extract(value, '$.date'), ''), value, ?
      FROM json_each(?) WHERE (SELECT write_token FROM sync_meta WHERE id = 1) = ?
      ON CONFLICT(id) DO UPDATE SET game=excluded.game, track=excluded.track, car=excluded.car,
        lap_ms=excluded.lap_ms, lap_date=excluded.lap_date, data=excluded.data, updated_at=excluded.updated_at
      WHERE laps.data != excluded.data`).bind(Date.now(), laps, token),
    db.prepare("DELETE FROM custom_roster WHERE key NOT IN (SELECT json_extract(value, '$.key') FROM json_each(?)) AND (SELECT write_token FROM sync_meta WHERE id = 1) = ?").bind(roster, token),
    db.prepare(`INSERT INTO custom_roster (key, game, kind, data)
      SELECT json_extract(value, '$.key'), json_extract(value, '$.game'), json_extract(value, '$.kind'), json_extract(value, '$.data')
      FROM json_each(?) WHERE (SELECT write_token FROM sync_meta WHERE id = 1) = ?
      ON CONFLICT(key) DO UPDATE SET data=excluded.data WHERE custom_roster.data != excluded.data`).bind(roster, token)
  ]);
  return result[0].meta.changes === 1 ? revision + 1 : null;
}
