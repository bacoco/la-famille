pub mod convergence;
pub mod protocol;
pub mod session;

use protocol::CouncilConfig;
use session::CouncilSession;

/// The CouncilTool is a ZeroClaw custom tool installed on the orchestrator (Maman).
/// When invoked, it runs a multi-round COUNCIL deliberation across all family agents.
pub struct CouncilTool {
    config: CouncilConfig,
}

impl CouncilTool {
    pub fn new(config: CouncilConfig) -> Self {
        Self { config }
    }

    /// Start a new COUNCIL session on the given topic.
    /// Returns the session with the final decision after all rounds complete.
    pub async fn deliberate(&self, topic: &str) -> Result<CouncilSession, CouncilError> {
        let mut session = CouncilSession::new(topic, &self.config);
        session.run().await?;
        Ok(session)
    }
}

#[derive(Debug, thiserror::Error)]
pub enum CouncilError {
    #[error("agent unreachable: {agent} at {url}")]
    AgentUnreachable { agent: String, url: String },

    #[error("timeout after {seconds}s during {phase}")]
    Timeout { phase: String, seconds: u64 },

    #[error("no convergence after {rounds} rounds")]
    NoConvergence { rounds: usize },

    #[error("http error: {0}")]
    Http(#[from] reqwest::Error),

    #[error("serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
}
