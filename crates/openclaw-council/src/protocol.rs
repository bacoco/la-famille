use serde::{Deserialize, Serialize};

/// Phases of the COUNCIL protocol
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Phase {
    /// Round 1: Each agent states their position independently
    Collect,
    /// Round 2: Agents see others' positions and can adjust
    Challenge,
    /// Round 3: Final positions if no convergence yet
    Resolve,
    /// Maman synthesizes a final decision
    Synthesize,
    /// Session complete
    Complete,
}

impl std::fmt::Display for Phase {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Phase::Collect => write!(f, "collect"),
            Phase::Challenge => write!(f, "challenge"),
            Phase::Resolve => write!(f, "resolve"),
            Phase::Synthesize => write!(f, "synthesize"),
            Phase::Complete => write!(f, "complete"),
        }
    }
}

/// Configuration for a COUNCIL session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CouncilConfig {
    /// Family name
    pub family: String,
    /// Agents participating (name → endpoint URL)
    pub agents: Vec<AgentEndpoint>,
    /// Minimum agents required for quorum
    pub quorum: usize,
    /// Timeout per round in seconds
    pub timeout_seconds: u64,
    /// Maximum rounds before forced resolution
    pub max_rounds: usize,
    /// Convergence threshold (0.0 to 1.0)
    pub convergence_threshold: f64,
}

impl Default for CouncilConfig {
    fn default() -> Self {
        Self {
            family: "openclaw".into(),
            agents: vec![],
            quorum: 3,
            timeout_seconds: 90,
            max_rounds: 3,
            convergence_threshold: 0.7,
        }
    }
}

/// An agent endpoint for COUNCIL communication
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentEndpoint {
    pub name: String,
    pub url: String,
    pub emoji: Option<String>,
}

/// A position taken by an agent in a round
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Position {
    pub agent: String,
    pub content: String,
    pub confidence: f64,
    pub reasoning: Option<String>,
}

/// The result of a COUNCIL round
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoundResult {
    pub round_number: usize,
    pub phase: Phase,
    pub positions: Vec<Position>,
    pub convergence_score: f64,
}
