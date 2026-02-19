use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Regency protocol: when the orchestrator (Maman) goes down,
/// authority transfers to the designated regent.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegencyProtocol {
    /// The orchestrator agent name
    pub orchestrator: String,
    /// Succession order (first available takes over)
    pub succession: Vec<String>,
    /// Currently active regent (None if orchestrator is up)
    pub active_regent: Option<RegencyRecord>,
}

/// Record of an active regency period.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegencyRecord {
    pub regent: String,
    pub reason: String,
    pub started_at: DateTime<Utc>,
    pub ended_at: Option<DateTime<Utc>>,
}

impl RegencyProtocol {
    pub fn new(orchestrator: &str, succession: Vec<String>) -> Self {
        Self {
            orchestrator: orchestrator.to_string(),
            succession,
            active_regent: None,
        }
    }

    /// Activate regency when orchestrator is unavailable.
    /// Returns the name of the agent who takes over.
    pub fn activate(&mut self, reason: &str, available_agents: &[String]) -> Option<String> {
        // Find first available agent in succession order
        let regent = self
            .succession
            .iter()
            .find(|s| available_agents.contains(s))?
            .clone();

        self.active_regent = Some(RegencyRecord {
            regent: regent.clone(),
            reason: reason.to_string(),
            started_at: Utc::now(),
            ended_at: None,
        });

        Some(regent)
    }

    /// End regency when orchestrator comes back.
    pub fn deactivate(&mut self) -> Option<RegencyRecord> {
        self.active_regent.take().map(|mut r| {
            r.ended_at = Some(Utc::now());
            r
        })
    }

    /// Check if regency is currently active.
    pub fn is_active(&self) -> bool {
        self.active_regent.is_some()
    }

    /// Get the current regent name, if any.
    pub fn current_regent(&self) -> Option<&str> {
        self.active_regent.as_ref().map(|r| r.regent.as_str())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_regency_activation() {
        let mut proto = RegencyProtocol::new("maman", vec!["henry".into(), "sage".into()]);
        let available = vec!["henry".into(), "nova".into()];

        let regent = proto.activate("maman unresponsive", &available);
        assert_eq!(regent, Some("henry".into()));
        assert!(proto.is_active());
    }

    #[test]
    fn test_regency_deactivation() {
        let mut proto = RegencyProtocol::new("maman", vec!["henry".into()]);
        proto.activate("test", &["henry".into()]);

        let record = proto.deactivate();
        assert!(record.is_some());
        assert!(!proto.is_active());
    }

    #[test]
    fn test_succession_order() {
        let mut proto = RegencyProtocol::new("maman", vec!["henry".into(), "sage".into()]);
        // henry not available, sage should take over
        let regent = proto.activate("test", &["sage".into(), "nova".into()]);
        assert_eq!(regent, Some("sage".into()));
    }
}
