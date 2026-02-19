use crate::ContextBus;
use crate::ContextBusError;

/// Policy for confidence decay over time.
#[derive(Debug, Clone)]
pub struct DecayPolicy {
    /// How much confidence decays per day without revalidation
    pub daily_rate: f64,
    /// Minimum confidence before entry is considered stale
    pub floor: f64,
    /// Auto-delete entries below this threshold
    pub prune_threshold: f64,
}

impl Default for DecayPolicy {
    fn default() -> Self {
        Self {
            daily_rate: 0.01, // 1% per day
            floor: 0.1,
            prune_threshold: 0.05,
        }
    }
}

impl ContextBus {
    /// Apply confidence decay to all context entries based on age.
    /// Entries that haven't been updated decay toward the floor.
    pub fn apply_decay(&self, policy: &DecayPolicy) -> Result<DecayStats, ContextBusError> {
        let conn = self.connection();

        // Decay confidence based on days since last update
        let updated = conn.execute(
            "UPDATE context_entries
             SET confidence = MAX(?1, confidence * (1.0 - ?2 * (julianday('now') - julianday(updated_at))))
             WHERE confidence > ?1
             AND updated_at < datetime('now', '-1 day')",
            rusqlite::params![policy.floor, policy.daily_rate],
        )?;

        // Prune entries below threshold
        let pruned = conn.execute(
            "DELETE FROM context_entries WHERE confidence < ?1 AND expires_at IS NULL",
            rusqlite::params![policy.prune_threshold],
        )?;

        // Also decay claims
        let claims_decayed = conn.execute(
            "UPDATE claims
             SET confidence = MAX(?1, confidence * (1.0 - ?2 * (julianday('now') - julianday(updated_at))))
             WHERE confidence > ?1
             AND validated_by IS NULL
             AND updated_at < datetime('now', '-7 days')",
            rusqlite::params![policy.floor, policy.daily_rate * 0.5],
        )?;

        Ok(DecayStats {
            entries_decayed: updated,
            entries_pruned: pruned,
            claims_decayed,
        })
    }
}

/// Statistics from a decay run.
#[derive(Debug, Clone)]
pub struct DecayStats {
    pub entries_decayed: usize,
    pub entries_pruned: usize,
    pub claims_decayed: usize,
}
