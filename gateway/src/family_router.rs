use std::collections::HashMap;
use std::sync::Arc;

use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::{Json, Router};
use serde::{Deserialize, Serialize};

use crate::AppState;

/// Registry of agents and their endpoints.
#[derive(Debug, Clone)]
pub struct AgentRegistry {
    /// Map from model/agent name to endpoint URL
    pub agents: HashMap<String, AgentEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentEntry {
    pub name: String,
    pub url: String,
    pub model: String,
    pub provider: String,
    pub port: u16,
}

impl AgentRegistry {
    pub fn load_or_default(path: &str) -> Self {
        // Try to load from registry.json, fall back to default openclaw agents
        if let Ok(content) = std::fs::read_to_string(path) {
            if let Ok(registry) = serde_json::from_str::<serde_json::Value>(&content) {
                let mut agents = HashMap::new();
                if let Some(families) = registry["families"].as_object() {
                    for (_family_name, family) in families {
                        if let Some(family_agents) = family["agents"].as_array() {
                            for agent in family_agents {
                                let name = agent["name"].as_str().unwrap_or_default().to_string();
                                let port = agent["port"].as_u64().unwrap_or(3100) as u16;
                                agents.insert(
                                    name.clone(),
                                    AgentEntry {
                                        name: name.clone(),
                                        url: format!("http://{}:{}", name, port),
                                        model: agent["model"]
                                            .as_str()
                                            .unwrap_or_default()
                                            .to_string(),
                                        provider: agent["provider"]
                                            .as_str()
                                            .unwrap_or_default()
                                            .to_string(),
                                        port,
                                    },
                                );
                            }
                        }
                    }
                }
                if !agents.is_empty() {
                    return Self { agents };
                }
            }
        }

        // Default openclaw family
        let defaults = vec![
            ("maman", "anthropic", "claude-opus-4", 3101),
            ("henry", "openrouter", "glm-4.7", 3102),
            ("sage", "google", "gemini-3-pro", 3103),
            ("nova", "openai", "gpt-5.3-codex", 3104),
            ("blaise", "anthropic", "claude-opus-4", 3105),
        ];

        let agents = defaults
            .into_iter()
            .map(|(name, provider, model, port)| {
                (
                    name.to_string(),
                    AgentEntry {
                        name: name.to_string(),
                        url: format!("http://{name}:{port}"),
                        model: model.to_string(),
                        provider: provider.to_string(),
                        port,
                    },
                )
            })
            .collect();

        Self { agents }
    }

    /// Find an agent by name or model.
    pub fn find(&self, name_or_model: &str) -> Option<&AgentEntry> {
        self.agents.get(name_or_model).or_else(|| {
            self.agents
                .values()
                .find(|a| a.model == name_or_model)
        })
    }
}

/// OpenAI-compatible chat completion request.
#[derive(Debug, Deserialize)]
pub struct ChatCompletionRequest {
    pub model: String,
    pub messages: Vec<serde_json::Value>,
    #[serde(default)]
    pub temperature: Option<f64>,
    #[serde(default)]
    pub stream: Option<bool>,
}

pub fn routes(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/v1/chat/completions", axum::routing::post(chat_completions))
        .route("/v1/models", axum::routing::get(list_models))
        .with_state(state)
}

/// Route chat completions to the appropriate agent.
async fn chat_completions(
    State(state): State<Arc<AppState>>,
    Json(req): Json<ChatCompletionRequest>,
) -> impl IntoResponse {
    let agent = match state.registry.find(&req.model) {
        Some(a) => a,
        None => {
            return (
                StatusCode::NOT_FOUND,
                Json(serde_json::json!({
                    "error": {
                        "message": format!("model/agent '{}' not found", req.model),
                        "type": "invalid_request_error",
                    }
                })),
            )
                .into_response();
        }
    };

    // Forward the request to the agent
    let client = reqwest::Client::new();
    match client
        .post(&format!("{}/v1/chat/completions", agent.url))
        .json(&req)
        .timeout(std::time::Duration::from_secs(120))
        .send()
        .await
    {
        Ok(resp) => {
            let status =
                StatusCode::from_u16(resp.status().as_u16()).unwrap_or(StatusCode::BAD_GATEWAY);
            let body: serde_json::Value = resp.json().await.unwrap_or_default();
            (status, Json(body)).into_response()
        }
        Err(e) => (
            StatusCode::BAD_GATEWAY,
            Json(serde_json::json!({
                "error": {
                    "message": format!("agent '{}' unreachable: {}", agent.name, e),
                    "type": "gateway_error",
                }
            })),
        )
            .into_response(),
    }
}

/// List available models/agents.
async fn list_models(State(state): State<Arc<AppState>>) -> Json<serde_json::Value> {
    let models: Vec<serde_json::Value> = state
        .registry
        .agents
        .values()
        .map(|a| {
            serde_json::json!({
                "id": a.name,
                "object": "model",
                "owned_by": a.provider,
                "metadata": {
                    "port": a.port,
                    "model": a.model,
                }
            })
        })
        .collect();

    Json(serde_json::json!({
        "object": "list",
        "data": models,
    }))
}
