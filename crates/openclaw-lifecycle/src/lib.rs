pub mod death;
pub mod phases;
pub mod regency;

use phases::Phase;

/// Manages the lifecycle of agents within a family.
pub struct LifecycleManager {
    family: String,
    agents: Vec<AgentStatus>,
}

/// Current status of an agent in the lifecycle.
#[derive(Debug, Clone)]
pub struct AgentStatus {
    pub name: String,
    pub phase: Phase,
    pub last_heartbeat: Option<chrono::DateTime<chrono::Utc>>,
    pub port: u16,
}

impl LifecycleManager {
    pub fn new(family: &str) -> Self {
        Self {
            family: family.to_string(),
            agents: Vec::new(),
        }
    }

    /// Register an agent with the lifecycle manager.
    pub fn register(&mut self, name: &str, port: u16) {
        self.agents.push(AgentStatus {
            name: name.to_string(),
            phase: Phase::Birth,
            last_heartbeat: None,
            port,
        });
    }

    /// Record a heartbeat from an agent.
    pub fn heartbeat(&mut self, name: &str) {
        if let Some(agent) = self.agents.iter_mut().find(|a| a.name == name) {
            agent.last_heartbeat = Some(chrono::Utc::now());
            if agent.phase == Phase::Birth {
                agent.phase = Phase::Active;
            }
        }
    }

    /// Check for agents that have missed heartbeats.
    pub fn check_health(&self, timeout: chrono::Duration) -> Vec<&AgentStatus> {
        let now = chrono::Utc::now();
        self.agents
            .iter()
            .filter(|a| {
                a.phase == Phase::Active
                    && a.last_heartbeat
                        .map(|hb| now - hb > timeout)
                        .unwrap_or(true)
            })
            .collect()
    }

    /// Get all agents and their statuses.
    pub fn agents(&self) -> &[AgentStatus] {
        &self.agents
    }

    /// Get the family name.
    pub fn family(&self) -> &str {
        &self.family
    }
}

#[derive(Debug, thiserror::Error)]
pub enum LifecycleError {
    #[error("agent not found: {0}")]
    AgentNotFound(String),

    #[error("invalid phase transition: {from} -> {to}")]
    InvalidTransition { from: String, to: String },

    #[error("regency already active for {0}")]
    RegencyActive(String),
}
