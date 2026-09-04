PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS children (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  name TEXT NOT NULL,
  nickname TEXT,
  pronouns TEXT,
  birthday TEXT,
  age_months INTEGER NOT NULL CHECK(age_months BETWEEN 0 AND 215),
  stage TEXT NOT NULL,
  primary_temperament TEXT NOT NULL,
  secondary_temperament TEXT,
  notes TEXT,
  current_mood TEXT NOT NULL DEFAULT 'Normal',
  avatar_url TEXT,
  avatar_channel_id TEXT,
  avatar_message_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_children_guild_name_unique ON children(guild_id, lower(name));

CREATE TABLE IF NOT EXISTS child_traits (
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  trait TEXT NOT NULL,
  PRIMARY KEY(child_id, trait)
);

CREATE TABLE IF NOT EXISTS behavior_stats (
  child_id INTEGER PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
  energy INTEGER NOT NULL DEFAULT 50,
  frustration INTEGER NOT NULL DEFAULT 50,
  adaptability INTEGER NOT NULL DEFAULT 50,
  sociability INTEGER NOT NULL DEFAULT 50,
  independence INTEGER NOT NULL DEFAULT 50,
  emotional_intensity INTEGER NOT NULL DEFAULT 50,
  patience INTEGER NOT NULL DEFAULT 50,
  sensory_sensitivity INTEGER NOT NULL DEFAULT 50,
  privacy_need INTEGER NOT NULL DEFAULT 50,
  peer_influence INTEGER NOT NULL DEFAULT 50,
  risk_taking INTEGER NOT NULL DEFAULT 50
);

CREATE TABLE IF NOT EXISTS relationships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  person_name TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  familiarity INTEGER NOT NULL DEFAULT 50,
  closeness INTEGER NOT NULL DEFAULT 50,
  trust INTEGER NOT NULL DEFAULT 50,
  authority INTEGER NOT NULL DEFAULT 50,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS child_relationships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  child_a INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  child_b INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  closeness INTEGER NOT NULL DEFAULT 50,
  conflict INTEGER NOT NULL DEFAULT 10,
  jealousy INTEGER NOT NULL DEFAULT 0,
  protectiveness INTEGER NOT NULL DEFAULT 0,
  dynamic_notes TEXT,
  UNIQUE(guild_id, child_a, child_b)
);

CREATE TABLE IF NOT EXISTS schools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  environment TEXT,
  notes TEXT,
  UNIQUE(guild_id, name)
);

CREATE TABLE IF NOT EXISTS classrooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade TEXT,
  teacher_name TEXT,
  teacher_style TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS enrollments (
  child_id INTEGER PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
  classroom_id INTEGER NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS groups_tbl (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Friend Group',
  notes TEXT,
  UNIQUE(guild_id, name)
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id INTEGER NOT NULL REFERENCES groups_tbl(id) ON DELETE CASCADE,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  PRIMARY KEY(group_id, child_id)
);

CREATE TABLE IF NOT EXISTS preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item TEXT NOT NULL,
  preference_type TEXT NOT NULL CHECK(preference_type IN ('like','dislike')),
  confidence INTEGER NOT NULL DEFAULT 25,
  confirmed INTEGER NOT NULL DEFAULT 0,
  UNIQUE(child_id, category, item, preference_type)
);

CREATE TABLE IF NOT EXISTS history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  canon_status TEXT NOT NULL DEFAULT 'observed',
  happened_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS temporary_effects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  effect_type TEXT NOT NULL,
  description TEXT NOT NULL,
  strength INTEGER NOT NULL DEFAULT 50,
  expires_at TEXT
);

CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  familiarity_default INTEGER NOT NULL DEFAULT 50,
  environment TEXT,
  rules_style TEXT,
  notes TEXT,
  UNIQUE(guild_id, name)
);

CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  weekday INTEGER NOT NULL CHECK(weekday BETWEEN 0 AND 6),
  location_name TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS routines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  steps_json TEXT NOT NULL,
  notes TEXT,
  UNIQUE(child_id, name)
);

CREATE TABLE IF NOT EXISTS observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  category TEXT NOT NULL,
  observation TEXT NOT NULL,
  confidence INTEGER NOT NULL DEFAULT 20,
  promoted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
