use std::sync::Arc;
use tracing_subscriber::EnvFilter;

mod family_router;
mod routes;

/// Shared application state (Phase 2: registry only, no context bus).
pub struct AppState {
    pub registry: family_router::AgentRegistry,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::from_default_env().add_directive("gateway=info".parse().unwrap()),
        )
        .init();

    let port: u16 = std::env::var("GATEWAY_PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3000);

    // Load agent registry
    let registry_path =
        std::env::var("REGISTRY_PATH").unwrap_or_else(|_| "./registry.json".into());
    let registry = family_router::AgentRegistry::load_or_default(&registry_path);

    tracing::info!(
        "loaded {} agents: {:?}",
        registry.agents.len(),
        registry.agents.keys().collect::<Vec<_>>()
    );

    let state = Arc::new(AppState { registry });

    let app = routes::build_router(state);

    let addr = format!("0.0.0.0:{port}");
    tracing::info!("gateway listening on {addr}");

    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
