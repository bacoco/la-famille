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
                if let Some(families) = registry["families"].as_array() {
                    for family in families {
                        if family["status"].as_str() != Some("active") {
                            continue;
                        }
                        let family_name = family["name"].as_str().unwrap_or_default();
                        let family_path = family["path"].as_str().unwrap_or_default();
                        // Try loading family.toml for agent details
                        let family_toml_path = format!("{}/family.toml", family_path);
                        if let Ok(toml_content) = std::fs::read_to_string(&family_toml_path) {
                            if let Ok(parsed) =
                                toml_content.parse::<toml::Table>()
                            {
                                if let Some(agent_list) = parsed.get("agents") {
                                    if let Some(arr) = agent_list.as_array() {
                                        for agent in arr {
                                            let name = agent
                                                .get("name")
                                                .and_then(|v| v.as_str())
                                                .unwrap_or_default()
                                                .to_string();
                                            let port = agent
                                                .get("port")
                                                .and_then(|v| v.as_integer())
                                                .unwrap_or(3100)
                                                as u16;
                                            let model = agent
                                                .get("model")
                                                .and_then(|v| v.as_str())
                                                .unwrap_or_default()
                                                .to_string();
                                            let provider = agent
                                                .get("provider")
                                                .and_then(|v| v.as_str())
                                                .unwrap_or_default()
                                                .to_string();
                                            agents.insert(
                                                name.clone(),
                                                AgentEntry {
                                                    name: name.clone(),
                                                    url: format!("http://{}:{}", name, port),
                                                    model,
                                                    provider,
                                                    port,
                                                },
                                            );
                                        }
                                    }
                                }
                            }
                        }
                        tracing::debug!(
                            "loaded family '{}' from {}",
                            family_name,
                            family_path
                        );
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
    pub messages: Vec<ChatMessage>,
    #[serde(default)]
    pub temperature: Option<f64>,
    #[serde(default)]
    pub stream: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

/// ZeroClaw webhook request.
#[derive(Debug, Serialize)]
struct WebhookRequest {
    message: String,
}

/// ZeroClaw webhook response.
#[derive(Debug, Deserialize)]
struct WebhookResponse {
    response: Option<String>,
    #[serde(default)]
    error: Option<String>,
}

pub fn routes(state: Arc<AppState>) -> Router {
    Router::new()
        .route(
            "/v1/chat/completions",
            axum::routing::post(chat_completions),
        )
        .route("/v1/models", axum::routing::get(list_models))
        .with_state(state)
}

/// Route chat completions to the appropriate ZeroClaw agent via webhook.
///
/// Translates OpenAI format → ZeroClaw webhook format:
///   IN:  POST /v1/chat/completions {"model":"maman","messages":[{"role":"user","content":"..."}]}
///   OUT: POST http://maman:3101/webhook {"message":"..."}
///   IN:  {"response":"..."}
///   OUT: {"id":"...","choices":[{"message":{"role":"assistant","content":"..."}}]}
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

    // Extract the last user message for the webhook
    let last_user_message = req
        .messages
        .iter()
        .rev()
        .find(|m| m.role == "user")
        .map(|m| m.content.clone())
        .unwrap_or_default();

    if last_user_message.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": {
                    "message": "no user message found in messages array",
                    "type": "invalid_request_error",
                }
            })),
        )
            .into_response();
    }

    // Forward to ZeroClaw webhook endpoint
    let webhook_url = format!("{}/webhook", agent.url);
    let webhook_body = WebhookRequest {
        message: last_user_message,
    };

    tracing::info!(
        agent = %agent.name,
        url = %webhook_url,
        "forwarding to ZeroClaw webhook"
    );

    let client = reqwest::Client::new();
    match client
        .post(&webhook_url)
        .json(&webhook_body)
        .timeout(std::time::Duration::from_secs(120))
        .send()
        .await
    {
        Ok(resp) => {
            let status_code = resp.status();
            if !status_code.is_success() {
                let error_text = resp.text().await.unwrap_or_default();
                tracing::warn!(
                    agent = %agent.name,
                    status = %status_code,
                    "webhook returned error: {}",
                    error_text
                );
                return (
                    StatusCode::BAD_GATEWAY,
                    Json(serde_json::json!({
                        "error": {
                            "message": format!(
                                "agent '{}' returned {}: {}",
                                agent.name, status_code, error_text
                            ),
                            "type": "gateway_error",
                        }
                    })),
                )
                    .into_response();
            }

            // Parse ZeroClaw webhook response
            let webhook_resp: WebhookResponse = match resp.json().await {
                Ok(r) => r,
                Err(e) => {
                    return (
                        StatusCode::BAD_GATEWAY,
                        Json(serde_json::json!({
                            "error": {
                                "message": format!(
                                    "failed to parse response from '{}': {}",
                                    agent.name, e
                                ),
                                "type": "gateway_error",
                            }
                        })),
                    )
                        .into_response();
                }
            };

            if let Some(err) = webhook_resp.error {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(serde_json::json!({
                        "error": {
                            "message": format!("agent '{}' error: {}", agent.name, err),
                            "type": "agent_error",
                        }
                    })),
                )
                    .into_response();
            }

            let content = webhook_resp.response.unwrap_or_default();
            let completion_id = format!("chatcmpl-{}", uuid::Uuid::new_v4());

            // Convert to OpenAI ChatCompletion format
            (
                StatusCode::OK,
                Json(serde_json::json!({
                    "id": completion_id,
                    "object": "chat.completion",
                    "created": chrono::Utc::now().timestamp(),
                    "model": agent.name,
                    "choices": [{
                        "index": 0,
                        "message": {
                            "role": "assistant",
                            "content": content,
                        },
                        "finish_reason": "stop",
                    }],
                    "usage": {
                        "prompt_tokens": 0,
                        "completion_tokens": 0,
                        "total_tokens": 0,
                    }
                })),
            )
                .into_response()
        }
        Err(e) => {
            tracing::error!(agent = %agent.name, error = %e, "webhook request failed");
            (
                StatusCode::BAD_GATEWAY,
                Json(serde_json::json!({
                    "error": {
                        "message": format!("agent '{}' unreachable: {}", agent.name, e),
                        "type": "gateway_error",
                    }
                })),
            )
                .into_response()
        }
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
