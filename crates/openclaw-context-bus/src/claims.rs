use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::ContextBus;
use crate::ContextBusError;

/// A validated knowledge claim in the context bus.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claim {
    pub id: String,
    pub namespace: String,
    pub claim: String,
    pub evidence: Option<String>,
    pub confidence: f64,
    pub claimed_by: String,
    pub validated_by: Option<String>,
    pub created_at: DateTime<Utc>,
}

impl ContextBus {
    /// Add a new claim to the ledger.
    pub fn add_claim(
        &self,
        namespace: &str,
        claim: &str,
        evidence: Option<&str>,
        confidence: f64,
        claimed_by: &str,
    ) -> Result<String, ContextBusError> {
        let id = uuid::Uuid::new_v4().to_string();
        let conn = self.connection();
        conn.execute(
            "INSERT INTO claims (id, namespace, claim, evidence, confidence, claimed_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            rusqlite::params![id, namespace, claim, evidence, confidence, claimed_by],
        )?;
        Ok(id)
    }

    /// Validate an existing claim (another agent confirms it).
    pub fn validate_claim(
        &self,
        claim_id: &str,
        validated_by: &str,
    ) -> Result<(), ContextBusError> {
        let conn = self.connection();
        conn.execute(
            "UPDATE claims SET validated_by = ?1, updated_at = datetime('now') WHERE id = ?2",
            rusqlite::params![validated_by, claim_id],
        )?;
        Ok(())
    }

    /// List claims by namespace, ordered by confidence descending.
    pub fn list_claims(
        &self,
        namespace: &str,
        limit: usize,
    ) -> Result<Vec<Claim>, ContextBusError> {
        let conn = self.connection();
        let mut stmt = conn.prepare(
            "SELECT id, namespace, claim, evidence, confidence, claimed_by, validated_by, created_at
             FROM claims WHERE namespace = ?1 ORDER BY confidence DESC LIMIT ?2",
        )?;
        let claims = stmt
            .query_map(rusqlite::params![namespace, limit], |row| {
                Ok(Claim {
                    id: row.get(0)?,
                    namespace: row.get(1)?,
                    claim: row.get(2)?,
                    evidence: row.get(3)?,
                    confidence: row.get(4)?,
                    claimed_by: row.get(5)?,
                    validated_by: row.get(6)?,
                    created_at: row.get::<_, String>(7)?.parse().unwrap_or_default(),
                })
            })?
            .filter_map(|r| r.ok())
            .collect();
        Ok(claims)
    }
}
