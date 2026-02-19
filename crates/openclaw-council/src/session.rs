use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::convergence::ConvergenceDetector;
use crate::protocol::{AgentEndpoint, CouncilConfig, Phase, Position, RoundResult};
use crate::CouncilError;

/// A COUNCIL deliberation session
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CouncilSession {
    pub id: String,
    pub topic: String,
    pub family: String,
    pub phase: Phase,
    pub rounds: Vec<RoundResult>,
    pub decision: Option<String>,
    pub started_at: DateTime<Utc>,
    pub ended_at: Option<DateTime<Utc>>,
    #[serde(skip)]
    config: Option<CouncilConfig>,
}

impl CouncilSession {
    pub fn new(topic: &str, config: &CouncilConfig) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            topic: topic.to_string(),
            family: config.family.clone(),
            phase: Phase::Collect,
            rounds: vec![],
            decision: None,
            started_at: Utc::now(),
            ended_at: None,
            config: Some(config.clone()),
        }
    }

    /// Run the full COUNCIL protocol
    pub async fn run(&mut self) -> Result<(), CouncilError> {
        let config = self
            .config
            .clone()
            .expect("config required to run session");

        // Round 1: COLLECT
        self.phase = Phase::Collect;
        let positions = self.collect_positions(&config.agents).await?;
        let convergence = ConvergenceDetector::score(&positions);
        self.rounds.push(RoundResult {
            round_number: 1,
            phase: Phase::Collect,
            positions: positions.clone(),
            convergence_score: convergence,
        });

        if convergence >= config.convergence_threshold {
            self.synthesize(positions).await?;
            return Ok(());
        }

        // Round 2: CHALLENGE
        self.phase = Phase::Challenge;
        let challenged = self.challenge_positions(&config.agents, &positions).await?;
        let convergence = ConvergenceDetector::score(&challenged);
        self.rounds.push(RoundResult {
            round_number: 2,
            phase: Phase::Challenge,
            positions: challenged.clone(),
            convergence_score: convergence,
        });

        if convergence >= config.convergence_threshold {
            self.synthesize(challenged).await?;
            return Ok(());
        }

        // Round 3: RESOLVE
        self.phase = Phase::Resolve;
        let resolved = self.resolve_positions(&config.agents, &challenged).await?;
        let convergence = ConvergenceDetector::score(&resolved);
        self.rounds.push(RoundResult {
            round_number: 3,
            phase: Phase::Resolve,
            positions: resolved.clone(),
            convergence_score: convergence,
        });

        // Synthesize regardless of convergence after max rounds
        self.synthesize(resolved).await?;
        Ok(())
    }

    /// COLLECT: Ask each agent for their independent position
    async fn collect_positions(
        &self,
        agents: &[AgentEndpoint],
    ) -> Result<Vec<Position>, CouncilError> {
        let client = reqwest::Client::new();
        let mut positions = Vec::new();

        let futures: Vec<_> = agents
            .iter()
            .map(|agent| {
                let client = client.clone();
                let topic = self.topic.clone();
                let agent = agent.clone();
                async move {
                    let payload = serde_json::json!({
                        "council_session": self.id,
                        "phase": "collect",
                        "topic": topic,
                    });

                    let resp = client
                        .post(&format!("{}/webhook", agent.url))
                        .json(&payload)
                        .timeout(std::time::Duration::from_secs(90))
                        .send()
                        .await
                        .map_err(|_| CouncilError::AgentUnreachable {
                            agent: agent.name.clone(),
                            url: agent.url.clone(),
                        })?;

                    let body: serde_json::Value = resp.json().await?;
                    Ok::<Position, CouncilError>(Position {
                        agent: agent.name,
                        content: body["position"]
                            .as_str()
                            .unwrap_or_default()
                            .to_string(),
                        confidence: body["confidence"].as_f64().unwrap_or(0.5),
                        reasoning: body["reasoning"].as_str().map(String::from),
                    })
                }
            })
            .collect();

        for future in futures {
            match future.await {
                Ok(pos) => positions.push(pos),
                Err(e) => tracing::warn!("agent failed in collect: {e}"),
            }
        }

        Ok(positions)
    }

    /// CHALLENGE: Share all positions and let agents adjust
    async fn challenge_positions(
        &self,
        agents: &[AgentEndpoint],
        previous: &[Position],
    ) -> Result<Vec<Position>, CouncilError> {
        let client = reqwest::Client::new();
        let mut positions = Vec::new();

        for agent in agents {
            let payload = serde_json::json!({
                "council_session": self.id,
                "phase": "challenge",
                "topic": self.topic,
                "other_positions": previous,
            });

            match client
                .post(&format!("{}/webhook", agent.url))
                .json(&payload)
                .timeout(std::time::Duration::from_secs(90))
                .send()
                .await
            {
                Ok(resp) => {
                    let body: serde_json::Value = resp.json().await?;
                    positions.push(Position {
                        agent: agent.name.clone(),
                        content: body["position"]
                            .as_str()
                            .unwrap_or_default()
                            .to_string(),
                        confidence: body["confidence"].as_f64().unwrap_or(0.5),
                        reasoning: body["reasoning"].as_str().map(String::from),
                    });
                }
                Err(e) => tracing::warn!("agent {} failed in challenge: {e}", agent.name),
            }
        }

        Ok(positions)
    }

    /// RESOLVE: Final round for remaining disagreements
    async fn resolve_positions(
        &self,
        agents: &[AgentEndpoint],
        previous: &[Position],
    ) -> Result<Vec<Position>, CouncilError> {
        // Same structure as challenge but with resolve phase marker
        let client = reqwest::Client::new();
        let mut positions = Vec::new();

        for agent in agents {
            let payload = serde_json::json!({
                "council_session": self.id,
                "phase": "resolve",
                "topic": self.topic,
                "other_positions": previous,
                "final_round": true,
            });

            match client
                .post(&format!("{}/webhook", agent.url))
                .json(&payload)
                .timeout(std::time::Duration::from_secs(90))
                .send()
                .await
            {
                Ok(resp) => {
                    let body: serde_json::Value = resp.json().await?;
                    positions.push(Position {
                        agent: agent.name.clone(),
                        content: body["position"]
                            .as_str()
                            .unwrap_or_default()
                            .to_string(),
                        confidence: body["confidence"].as_f64().unwrap_or(0.5),
                        reasoning: body["reasoning"].as_str().map(String::from),
                    });
                }
                Err(e) => tracing::warn!("agent {} failed in resolve: {e}", agent.name),
            }
        }

        Ok(positions)
    }

    /// SYNTHESIZE: Maman compiles the final decision
    async fn synthesize(&mut self, positions: Vec<Position>) -> Result<(), CouncilError> {
        self.phase = Phase::Synthesize;

        // Build a summary of all positions for synthesis
        let summary: Vec<String> = positions
            .iter()
            .map(|p| {
                format!(
                    "{} (confidence: {:.0}%): {}",
                    p.agent,
                    p.confidence * 100.0,
                    p.content
                )
            })
            .collect();

        // The decision is synthesized by Maman's LLM (the caller)
        // Here we store the raw material for synthesis
        self.decision = Some(format!(
            "COUNCIL on '{}' — {} rounds, {} positions:\n{}",
            self.topic,
            self.rounds.len(),
            positions.len(),
            summary.join("\n")
        ));

        self.phase = Phase::Complete;
        self.ended_at = Some(Utc::now());
        Ok(())
    }
}
