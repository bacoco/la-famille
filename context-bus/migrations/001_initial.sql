-- Context Bus Schema v1
-- Shared memory for multi-agent families (SQLite WAL mode)

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Main context entries table
CREATE TABLE IF NOT EXISTS context_entries (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    namespace TEXT NOT NULL,          -- 'agent:maman', 'family:openclaw', 'shared', 'council:session_id', 'legacy:source'
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    content_type TEXT DEFAULT 'text/plain',
    confidence REAL DEFAULT 1.0,      -- 0.0 to 1.0, decays over time
    created_by TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT,                   -- NULL = never expires
    UNIQUE(namespace, key)
);

-- Full-text search index
CREATE VIRTUAL TABLE IF NOT EXISTS context_fts USING fts5(
    key,
    value,
    namespace,
    content='context_entries',
    content_rowid='rowid'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS context_entries_ai AFTER INSERT ON context_entries BEGIN
    INSERT INTO context_fts(rowid, key, value, namespace)
    VALUES (new.rowid, new.key, new.value, new.namespace);
END;

CREATE TRIGGER IF NOT EXISTS context_entries_ad AFTER DELETE ON context_entries BEGIN
    INSERT INTO context_fts(context_fts, rowid, key, value, namespace)
    VALUES ('delete', old.rowid, old.key, old.value, old.namespace);
END;

CREATE TRIGGER IF NOT EXISTS context_entries_au AFTER UPDATE ON context_entries BEGIN
    INSERT INTO context_fts(context_fts, rowid, key, value, namespace)
    VALUES ('delete', old.rowid, old.key, old.value, old.namespace);
    INSERT INTO context_fts(rowid, key, value, namespace)
    VALUES (new.rowid, new.key, new.value, new.namespace);
END;

-- Claims ledger (validated knowledge)
CREATE TABLE IF NOT EXISTS claims (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    namespace TEXT NOT NULL DEFAULT 'shared',
    claim TEXT NOT NULL,
    evidence TEXT,
    confidence REAL DEFAULT 1.0,
    claimed_by TEXT NOT NULL,
    validated_by TEXT,                 -- NULL = unvalidated
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Council sessions
CREATE TABLE IF NOT EXISTS council_sessions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    family TEXT NOT NULL,
    topic TEXT NOT NULL,
    initiated_by TEXT NOT NULL,
    phase TEXT NOT NULL DEFAULT 'collect',  -- collect, challenge, resolve, synthesize, complete
    started_at TEXT DEFAULT (datetime('now')),
    ended_at TEXT,
    decision TEXT                      -- Final synthesized decision
);

-- Council rounds (individual agent positions)
CREATE TABLE IF NOT EXISTS council_rounds (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    session_id TEXT NOT NULL REFERENCES council_sessions(id),
    round_number INTEGER NOT NULL,
    agent TEXT NOT NULL,
    position TEXT NOT NULL,
    confidence REAL DEFAULT 0.5,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Action trajectories (OneContext pattern)
CREATE TABLE IF NOT EXISTS trajectories (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    agent TEXT NOT NULL,
    action TEXT NOT NULL,
    input TEXT,
    output TEXT,
    context_refs TEXT,                 -- JSON array of context_entry IDs used
    started_at TEXT DEFAULT (datetime('now')),
    duration_ms INTEGER
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_context_namespace ON context_entries(namespace);
CREATE INDEX IF NOT EXISTS idx_context_created_by ON context_entries(created_by);
CREATE INDEX IF NOT EXISTS idx_context_expires ON context_entries(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_claims_namespace ON claims(namespace);
CREATE INDEX IF NOT EXISTS idx_claims_claimed_by ON claims(claimed_by);
CREATE INDEX IF NOT EXISTS idx_council_family ON council_sessions(family);
CREATE INDEX IF NOT EXISTS idx_council_rounds_session ON council_rounds(session_id);
CREATE INDEX IF NOT EXISTS idx_trajectories_agent ON trajectories(agent);
CREATE INDEX IF NOT EXISTS idx_trajectories_started ON trajectories(started_at);
