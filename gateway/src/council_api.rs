use std::sync::Arc;

use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::{Json, Router};
use serde::Deserialize;

use openclaw_council::protocol::{AgentEndpoint, CouncilConfig};
use openclaw_council::CouncilTool;

use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct StartCouncilRequest {
    pub topic: String,
    #[serde(default = "default_family")]
    pub family: String,
}

fn default_family() -> String {
    "openclaw".into()
}

pub fn routes(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/v1/council/start", axum::routing::post(start_council))
        .route("/v1/council/sessions", axum::routing::get(list_sessions))
        .with_state(state)
}

/// Start a new COUNCIL deliberation session.
async fn start_council(
    State(state): State<Arc<AppState>>,
    Json(req): Json<StartCouncilRequest>,
) -> impl IntoResponse {
    // Build agent endpoints from registry
    let agents: Vec<AgentEndpoint> = state
        .registry
        .agents
        .values()
        .filter(|a| a.name != "maman") // Maman is the orchestrator, not a participant
        .map(|a| AgentEndpoint {
            name: a.name.clone(),
            url: a.url.clone(),
            emoji: None,
        })
        .collect();

    if agents.len() < 2 {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": "not enough agents for COUNCIL (minimum 2)"
            })),
        )
            .into_response();
    }

    let config = CouncilConfig {
        family: req.family,
        agents,
        quorum: 3,
        timeout_seconds: 90,
        max_rounds: 3,
        convergence_threshold: 0.7,
    };

    let tool = CouncilTool::new(config);
    match tool.deliberate(&req.topic).await {
        Ok(session) => {
            // Store session in context bus
            let conn = state.context_bus.connection();
            let _ = conn.execute(
                "INSERT OR REPLACE INTO council_sessions (id, family, topic, initiated_by, phase, decision)
                 VALUES (?1, ?2, ?3, 'gateway', 'complete', ?4)",
                rusqlite::params![
                    session.id,
                    session.family,
                    session.topic,
                    session.decision,
                ],
            );

            (StatusCode::OK, Json(serde_json::to_value(&session).unwrap_or_default())).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": format!("council failed: {e}")
            })),
        )
            .into_response(),
    }
}

/// List past COUNCIL sessions.
async fn list_sessions(State(state): State<Arc<AppState>>) -> Json<serde_json::Value> {
    let conn = state.context_bus.connection();
    let mut stmt = conn
        .prepare(
            "SELECT id, family, topic, phase, started_at, decision
             FROM council_sessions ORDER BY started_at DESC LIMIT 50",
        )
        .unwrap();

    let sessions: Vec<serde_json::Value> = stmt
        .query_map([], |row| {
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "family": row.get::<_, String>(1)?,
                "topic": row.get::<_, String>(2)?,
                "phase": row.get::<_, String>(3)?,
                "started_at": row.get::<_, String>(4)?,
                "decision": row.get::<_, Option<String>>(5)?,
            }))
        })
        .unwrap()
        .filter_map(|r| r.ok())
        .collect();

    Json(serde_json::json!({
        "sessions": sessions,
    }))
}
