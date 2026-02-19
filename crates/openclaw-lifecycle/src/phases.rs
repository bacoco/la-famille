use serde::{Deserialize, Serialize};

/// Lifecycle phases for an agent.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Phase {
    /// Agent is being initialized
    Birth,
    /// Agent is running and responding
    Active,
    /// Agent is paused / sleeping
    Dormant,
    /// Agent has been permanently decommissioned
    Dead,
}

impl std::fmt::Display for Phase {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Phase::Birth => write!(f, "birth"),
            Phase::Active => write!(f, "active"),
            Phase::Dormant => write!(f, "dormant"),
            Phase::Dead => write!(f, "dead"),
        }
    }
}

/// A phase transition event.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhaseTransition {
    pub agent: String,
    pub from: Phase,
    pub to: Phase,
    pub reason: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

impl PhaseTransition {
    pub fn new(agent: &str, from: Phase, to: Phase, reason: &str) -> Self {
        Self {
            agent: agent.to_string(),
            from,
            to,
            reason: reason.to_string(),
            timestamp: chrono::Utc::now(),
        }
    }
}

/// Validate that a phase transition is allowed.
pub fn is_valid_transition(from: Phase, to: Phase) -> bool {
    matches!(
        (from, to),
        (Phase::Birth, Phase::Active)
            | (Phase::Active, Phase::Dormant)
            | (Phase::Active, Phase::Dead)
            | (Phase::Dormant, Phase::Active)
            | (Phase::Dormant, Phase::Dead)
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_transitions() {
        assert!(is_valid_transition(Phase::Birth, Phase::Active));
        assert!(is_valid_transition(Phase::Active, Phase::Dormant));
        assert!(is_valid_transition(Phase::Active, Phase::Dead));
        assert!(is_valid_transition(Phase::Dormant, Phase::Active));
    }

    #[test]
    fn test_invalid_transitions() {
        assert!(!is_valid_transition(Phase::Dead, Phase::Active));
        assert!(!is_valid_transition(Phase::Birth, Phase::Dead));
        assert!(!is_valid_transition(Phase::Birth, Phase::Dormant));
    }
}
