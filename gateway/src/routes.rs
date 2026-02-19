use std::sync::Arc;

use axum::Router;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;

use crate::context_api;
use crate::council_api;
use crate::family_router;
use crate::AppState;

/// Build the main application router.
pub fn build_router(state: Arc<AppState>) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        // Agent routing (OpenAI-compatible /v1/chat/completions)
        .merge(family_router::routes(state.clone()))
        // Context bus API
        .merge(context_api::routes(state.clone()))
        // Council API
        .merge(council_api::routes(state.clone()))
        // Health check
        .route("/health", axum::routing::get(health))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
}

async fn health() -> axum::Json<serde_json::Value> {
    axum::Json(serde_json::json!({
        "status": "ok",
        "service": "la-famille-gateway",
        "version": env!("CARGO_PKG_VERSION"),
    }))
}
