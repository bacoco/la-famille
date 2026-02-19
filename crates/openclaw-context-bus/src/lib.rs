pub mod claims;
pub mod decay;
pub mod namespace;
pub mod query;

use rusqlite::Connection;
use std::path::Path;
use std::sync::Mutex;

/// The shared context bus backed by SQLite (WAL mode).
/// Thread-safe via Mutex — suitable for single-process multi-threaded access.
/// For multi-process access, SQLite WAL mode handles concurrency.
pub struct ContextBus {
    conn: Mutex<Connection>,
}

impl ContextBus {
    /// Open (or create) the context bus database at the given path.
    pub fn open(path: impl AsRef<Path>) -> Result<Self, ContextBusError> {
        let conn = Connection::open(path)?;
        conn.execute_batch("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;")?;
        let bus = Self {
            conn: Mutex::new(conn),
        };
        bus.init_schema()?;
        Ok(bus)
    }

    /// Open an in-memory context bus (for testing).
    pub fn open_memory() -> Result<Self, ContextBusError> {
        let conn = Connection::open_in_memory()?;
        conn.execute_batch("PRAGMA foreign_keys = ON;")?;
        let bus = Self {
            conn: Mutex::new(conn),
        };
        bus.init_schema()?;
        Ok(bus)
    }

    /// Initialize the database schema.
    fn init_schema(&self) -> Result<(), ContextBusError> {
        let conn = self.conn.lock().unwrap();
        conn.execute_batch(include_str!("../../../context-bus/schema.sql"))?;
        Ok(())
    }

    /// Store a context entry.
    pub fn store(
        &self,
        namespace: &namespace::Namespace,
        key: &str,
        value: &str,
        created_by: &str,
    ) -> Result<String, ContextBusError> {
        let id = uuid::Uuid::new_v4().to_string();
        let ns = namespace.to_string();
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO context_entries (id, namespace, key, value, created_by) VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![id, ns, key, value, created_by],
        )?;
        Ok(id)
    }

    /// Recall a context entry by namespace and key.
    pub fn recall(
        &self,
        namespace: &namespace::Namespace,
        key: &str,
    ) -> Result<Option<String>, ContextBusError> {
        let ns = namespace.to_string();
        let conn = self.conn.lock().unwrap();
        let mut stmt =
            conn.prepare("SELECT value FROM context_entries WHERE namespace = ?1 AND key = ?2")?;
        let result = stmt
            .query_row(rusqlite::params![ns, key], |row| row.get::<_, String>(0))
            .ok();
        Ok(result)
    }

    /// Get a reference to the connection (for advanced queries).
    pub fn connection(&self) -> std::sync::MutexGuard<'_, Connection> {
        self.conn.lock().unwrap()
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ContextBusError {
    #[error("sqlite error: {0}")]
    Sqlite(#[from] rusqlite::Error),

    #[error("namespace error: {0}")]
    InvalidNamespace(String),

    #[error("entry not found: {namespace}/{key}")]
    NotFound { namespace: String, key: String },
}
