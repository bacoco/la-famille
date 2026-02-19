use std::sync::Arc;

use axum::extract::{Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::{Json, Router};
use serde::Deserialize;

use openclaw_context_bus::namespace::Namespace;
use openclaw_context_bus::query::ContextQuery;

use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct QueryParams {
    pub q: Option<String>,
    pub namespace: Option<String>,
    #[serde(default = "default_limit")]
    pub limit: usize,
    pub min_confidence: Option<f64>,
}

fn default_limit() -> usize {
    10
}

#[derive(Debug, Deserialize)]
pub struct ClaimRequest {
    pub namespace: Option<String>,
    pub claim: String,
    pub evidence: Option<String>,
    pub confidence: Option<f64>,
    pub claimed_by: String,
}

#[derive(Debug, Deserialize)]
pub struct TrajectoryParams {
    pub agent: String,
    pub since: Option<String>,
    #[serde(default = "default_limit")]
    pub limit: usize,
}

pub fn routes(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/v1/context/query", axum::routing::get(query_context))
        .route("/v1/context/store", axum::routing::post(store_context))
        .route("/v1/context/claim", axum::routing::post(add_claim))
        .route("/v1/context/claims", axum::routing::get(list_claims))
        .route(
            "/v1/context/trajectory",
            axum::routing::get(query_trajectories),
        )
        .with_state(state)
}

/// Query the context bus with FTS5 search.
async fn query_context(
    State(state): State<Arc<AppState>>,
    Query(params): Query<QueryParams>,
) -> impl IntoResponse {
    let query = ContextQuery {
        q: params.q,
        namespace: params.namespace,
        limit: params.limit,
        min_confidence: params.min_confidence,
    };

    match state.context_bus.query(&query) {
        Ok(entries) => (StatusCode::OK, Json(serde_json::json!({ "entries": entries }))).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

/// Store a context entry.
#[derive(Debug, Deserialize)]
pub struct StoreRequest {
    pub namespace: String,
    pub key: String,
    pub value: String,
    pub created_by: String,
}

async fn store_context(
    State(state): State<Arc<AppState>>,
    Json(req): Json<StoreRequest>,
) -> impl IntoResponse {
    let namespace = match Namespace::parse(&req.namespace) {
        Ok(ns) => ns,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": e })),
            )
                .into_response()
        }
    };

    match state
        .context_bus
        .store(&namespace, &req.key, &req.value, &req.created_by)
    {
        Ok(id) => (StatusCode::CREATED, Json(serde_json::json!({ "id": id }))).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

/// Add a claim to the ledger.
async fn add_claim(
    State(state): State<Arc<AppState>>,
    Json(req): Json<ClaimRequest>,
) -> impl IntoResponse {
    let namespace = req.namespace.as_deref().unwrap_or("shared");
    match state.context_bus.add_claim(
        namespace,
        &req.claim,
        req.evidence.as_deref(),
        req.confidence.unwrap_or(1.0),
        &req.claimed_by,
    ) {
        Ok(id) => (StatusCode::CREATED, Json(serde_json::json!({ "id": id }))).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

/// List claims by namespace.
async fn list_claims(
    State(state): State<Arc<AppState>>,
    Query(params): Query<QueryParams>,
) -> impl IntoResponse {
    let namespace = params.namespace.as_deref().unwrap_or("shared");
    match state.context_bus.list_claims(namespace, params.limit) {
        Ok(claims) => (StatusCode::OK, Json(serde_json::json!({ "claims": claims }))).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}

/// Query agent trajectories.
async fn query_trajectories(
    State(state): State<Arc<AppState>>,
    Query(params): Query<TrajectoryParams>,
) -> impl IntoResponse {
    match state
        .context_bus
        .query_trajectories(&params.agent, params.since.as_deref(), params.limit)
    {
        Ok(trajectories) => {
            (StatusCode::OK, Json(serde_json::json!({ "trajectories": trajectories }))).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": e.to_string() })),
        )
            .into_response(),
    }
}
