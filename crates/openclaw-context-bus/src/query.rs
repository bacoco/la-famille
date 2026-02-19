use serde::{Deserialize, Serialize};

use crate::ContextBus;
use crate::ContextBusError;

/// A query against the context bus with optional FTS5 search.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContextQuery {
    /// Full-text search query (FTS5 syntax)
    pub q: Option<String>,
    /// Filter by namespace
    pub namespace: Option<String>,
    /// Maximum results
    pub limit: usize,
    /// Minimum confidence threshold
    pub min_confidence: Option<f64>,
}

impl Default for ContextQuery {
    fn default() -> Self {
        Self {
            q: None,
            namespace: None,
            limit: 10,
            min_confidence: None,
        }
    }
}

/// A context entry returned from a query.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContextEntry {
    pub id: String,
    pub namespace: String,
    pub key: String,
    pub value: String,
    pub confidence: f64,
    pub created_by: String,
    pub created_at: String,
}

/// A trajectory record (agent action trace).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Trajectory {
    pub id: String,
    pub agent: String,
    pub action: String,
    pub input: Option<String>,
    pub output: Option<String>,
    pub context_refs: Option<String>,
    pub started_at: String,
    pub duration_ms: Option<i64>,
}

impl ContextBus {
    /// Query the context bus using full-text search and/or namespace filter.
    pub fn query(&self, q: &ContextQuery) -> Result<Vec<ContextEntry>, ContextBusError> {
        let conn = self.connection();

        if let Some(ref fts_query) = q.q {
            // FTS5 search
            let mut stmt = conn.prepare(
                "SELECT ce.id, ce.namespace, ce.key, ce.value, ce.confidence, ce.created_by, ce.created_at
                 FROM context_fts fts
                 JOIN context_entries ce ON ce.rowid = fts.rowid
                 WHERE context_fts MATCH ?1
                 AND (?2 IS NULL OR ce.namespace = ?2)
                 AND ce.confidence >= ?3
                 ORDER BY rank
                 LIMIT ?4",
            )?;
            let entries = stmt
                .query_map(
                    rusqlite::params![
                        fts_query,
                        q.namespace,
                        q.min_confidence.unwrap_or(0.0),
                        q.limit
                    ],
                    |row| {
                        Ok(ContextEntry {
                            id: row.get(0)?,
                            namespace: row.get(1)?,
                            key: row.get(2)?,
                            value: row.get(3)?,
                            confidence: row.get(4)?,
                            created_by: row.get(5)?,
                            created_at: row.get(6)?,
                        })
                    },
                )?
                .filter_map(|r| r.ok())
                .collect();
            Ok(entries)
        } else {
            // Simple namespace query
            let mut stmt = conn.prepare(
                "SELECT id, namespace, key, value, confidence, created_by, created_at
                 FROM context_entries
                 WHERE (?1 IS NULL OR namespace = ?1)
                 AND confidence >= ?2
                 ORDER BY updated_at DESC
                 LIMIT ?3",
            )?;
            let entries = stmt
                .query_map(
                    rusqlite::params![
                        q.namespace,
                        q.min_confidence.unwrap_or(0.0),
                        q.limit
                    ],
                    |row| {
                        Ok(ContextEntry {
                            id: row.get(0)?,
                            namespace: row.get(1)?,
                            key: row.get(2)?,
                            value: row.get(3)?,
                            confidence: row.get(4)?,
                            created_by: row.get(5)?,
                            created_at: row.get(6)?,
                        })
                    },
                )?
                .filter_map(|r| r.ok())
                .collect();
            Ok(entries)
        }
    }

    /// Record an agent trajectory (action trace).
    pub fn record_trajectory(
        &self,
        agent: &str,
        action: &str,
        input: Option<&str>,
        output: Option<&str>,
        context_refs: Option<&str>,
        duration_ms: Option<i64>,
    ) -> Result<String, ContextBusError> {
        let id = uuid::Uuid::new_v4().to_string();
        let conn = self.connection();
        conn.execute(
            "INSERT INTO trajectories (id, agent, action, input, output, context_refs, duration_ms) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            rusqlite::params![id, agent, action, input, output, context_refs, duration_ms],
        )?;
        Ok(id)
    }

    /// Query trajectories for an agent.
    pub fn query_trajectories(
        &self,
        agent: &str,
        since: Option<&str>,
        limit: usize,
    ) -> Result<Vec<Trajectory>, ContextBusError> {
        let conn = self.connection();
        let mut stmt = conn.prepare(
            "SELECT id, agent, action, input, output, context_refs, started_at, duration_ms
             FROM trajectories
             WHERE agent = ?1
             AND (?2 IS NULL OR started_at >= ?2)
             ORDER BY started_at DESC
             LIMIT ?3",
        )?;
        let trajectories = stmt
            .query_map(rusqlite::params![agent, since, limit], |row| {
                Ok(Trajectory {
                    id: row.get(0)?,
                    agent: row.get(1)?,
                    action: row.get(2)?,
                    input: row.get(3)?,
                    output: row.get(4)?,
                    context_refs: row.get(5)?,
                    started_at: row.get(6)?,
                    duration_ms: row.get(7)?,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();
        Ok(trajectories)
    }
}
