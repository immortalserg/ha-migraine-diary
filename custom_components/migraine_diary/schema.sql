-- Migraine Diary schema v1. All timestamps are ISO-8601 UTC strings.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS profiles (
 id TEXT PRIMARY KEY, display_name TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS episodes (
 id TEXT PRIMARY KEY,
 profile_id TEXT NOT NULL REFERENCES profiles(id),
 started_at TEXT NOT NULL,
 ended_at TEXT,
 headache_type TEXT NOT NULL DEFAULT 'unspecified',
 notes TEXT,
 CHECK (ended_at IS NULL OR ended_at >= started_at)
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_episode_per_profile ON episodes(profile_id) WHERE ended_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_episodes_profile_start ON episodes(profile_id, started_at);
CREATE TABLE IF NOT EXISTS catalog_items (
 id TEXT PRIMARY KEY,
 profile_id TEXT NOT NULL REFERENCES profiles(id),
 kind TEXT NOT NULL CHECK (kind IN ('symptom','medication','premonition','food')),
 label TEXT NOT NULL,
 builtin_key TEXT,
 active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)),
 sort_order INTEGER NOT NULL DEFAULT 0,
 created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_catalog_profile_kind ON catalog_items(profile_id, kind, active);
CREATE TABLE IF NOT EXISTS events (
 id TEXT PRIMARY KEY,
 profile_id TEXT NOT NULL REFERENCES profiles(id),
 episode_id TEXT REFERENCES episodes(id),
 event_type TEXT NOT NULL CHECK(event_type IN ('premonition','symptom','pain','medication','food','note','activity','response')),
 occurred_at TEXT NOT NULL,
 recorded_at TEXT NOT NULL,
 payload_json TEXT NOT NULL,
 CHECK(length(payload_json)>1)
);
CREATE INDEX IF NOT EXISTS idx_events_profile_time ON events(profile_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_episode_time ON events(episode_id, occurred_at);
CREATE TABLE IF NOT EXISTS event_catalog_items (
 event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
 catalog_item_id TEXT REFERENCES catalog_items(id) ON DELETE SET NULL,
 label_snapshot TEXT NOT NULL,
 PRIMARY KEY(event_id, label_snapshot)
);
CREATE TABLE IF NOT EXISTS preferences (
 profile_id TEXT NOT NULL REFERENCES profiles(id),
 setting_key TEXT NOT NULL,
 value_json TEXT NOT NULL,
 PRIMARY KEY(profile_id, setting_key)
);
