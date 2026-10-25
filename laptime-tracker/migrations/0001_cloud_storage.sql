CREATE TABLE IF NOT EXISTS sync_meta (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  revision INTEGER NOT NULL DEFAULT 0,
  write_token TEXT NOT NULL DEFAULT ''
);
INSERT OR IGNORE INTO sync_meta (id) VALUES (1);

CREATE TABLE IF NOT EXISTS laps (
  id TEXT PRIMARY KEY,
  game TEXT NOT NULL CHECK (game IN ('lmu', 'acc')),
  track TEXT NOT NULL,
  car TEXT NOT NULL,
  lap_ms INTEGER NOT NULL CHECK (lap_ms > 0),
  lap_date TEXT,
  data TEXT NOT NULL CHECK (json_valid(data)),
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS laps_combination ON laps (game, track, car);

CREATE TABLE IF NOT EXISTS custom_roster (
  key TEXT PRIMARY KEY,
  game TEXT NOT NULL CHECK (game IN ('lmu', 'acc')),
  kind TEXT NOT NULL CHECK (kind IN ('tracks', 'cars')),
  data TEXT NOT NULL CHECK (json_valid(data))
);
