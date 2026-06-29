-- WebMerge Studio — Database Schema (SQLite)
-- Ejecutar: node setup-db.js

CREATE TABLE IF NOT EXISTS config (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  config_key  TEXT UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS faqs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  category    TEXT NOT NULL,
  question    TEXT NOT NULL,
  answer      TEXT NOT NULL,
  keywords    TEXT,
  enabled     INTEGER DEFAULT 1,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contacts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_read     INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  number      TEXT NOT NULL,
  message     TEXT NOT NULL,
  response    TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'editor' CHECK(role IN ('admin','editor')),
  created_at    TEXT DEFAULT (datetime('now'))
);
