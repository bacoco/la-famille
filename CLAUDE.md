# CLAUDE.md — la-famille

## Overview

Unified AI agent family platform. ZeroClaw (Rust) runtime per agent, COUNCIL protocol for collective decisions, SQLite context bus for shared memory.

## Repository Structure

| Directory | Purpose |
|-----------|---------|
| `runtime/` | ZeroClaw git submodule (`zeroclaw-labs/zeroclaw`) |
| `crates/openclaw-council/` | COUNCIL protocol (multi-round deliberation) |
| `crates/openclaw-context-bus/` | Shared SQLite memory (namespaces, claims, trajectories) |
| `crates/openclaw-lifecycle/` | Agent birth/death/promotion/regency |
| `crates/openclaw-genesis/` | Family factory (scaffold + compose generation) |
| `gateway/` | Central Rust/Axum gateway (port 3000) |
| `families/` | Family configs (SOUL.md, agent.toml, family.toml) |
| `context-bus/` | SQLite schema + migrations |
| `ui/` | Next.js frontend |
| `scripts/` | Migration, conversion, build scripts |

## Key Patterns

- **1 ZeroClaw process per agent** — each agent is an independent process on its own port
- **SOUL.md is source of truth** — human edits SOUL.md, AIEOS JSON is generated via `scripts/convert-soul-to-aieos.py`
- **agent.toml** — ZeroClaw config per agent (provider, model, port, tools, memory namespace)
- **family.toml** — family manifest (agents list, council config)
- **Context bus** — single SQLite WAL file shared by all agents, namespaced entries
- **COUNCIL protocol** — Maman's exclusive tool: COLLECT → CHALLENGE → RESOLVE → SYNTHESIZE
- **Inter-agent communication** — HTTP between ZeroClaw instances (not internal delegation)

## Build Commands

```bash
# Rust
cargo check          # Type check
cargo build --release # Build all crates + gateway
cargo test           # Run tests

# Make targets
make build           # cargo build --release
make dev             # Run gateway locally
make test            # cargo test
make convert-souls   # SOUL.md → AIEOS JSON for all agents
make migrate         # Import data from openclaw-families
make db-init         # Create SQLite database from schema
make docker-up       # docker compose up -d
make docker-down     # docker compose down
```

## Agent Ports

| Agent | Port | Provider |
|-------|------|----------|
| gateway | 3000 | — |
| maman | 3101 | anthropic |
| henry | 3102 | openrouter |
| sage | 3103 | google |
| nova | 3104 | openai |
| blaise | 3105 | anthropic |
| ui | 3050 | — |

## Gateway API

- `POST /v1/chat/completions` — OpenAI-compatible, routed by model name to agent
- `GET /v1/models` — List available agents/models
- `GET /v1/context/query?q=...&namespace=...` — Search context bus
- `POST /v1/context/store` — Store context entry
- `POST /v1/context/claim` — Add validated claim
- `GET /v1/context/claims?namespace=...` — List claims
- `GET /v1/context/trajectory?agent=...` — Query agent trajectories
- `POST /v1/council/start` — Start COUNCIL session
- `GET /v1/council/sessions` — List past sessions
- `GET /health` — Health check

## Context Bus Namespaces

- `agent:<name>` — Agent-private (e.g., `agent:maman`)
- `family:<name>` — Family-wide (e.g., `family:openclaw`)
- `shared` — Global across all families
- `council:<session_id>` — Council session data
- `legacy:<source>` — Imported from previous system

## Adding a New Agent

1. Create directory under `families/<family>/<agent>/`
2. Write `SOUL.md` (personality) and `IDENTITY.md`
3. Create `agent.toml` with provider, model, port, tools
4. Run `make convert-souls` to generate `identity.aieos.json`
5. Add agent entry to `family.toml`
6. Add service to `docker-compose.yml`

## Adding a New Family

Use the Genesis wizard (UI) or manually:
1. Create `families/<name>/` with `family.toml`
2. Create agent subdirectories with SOUL.md + agent.toml
3. Add family to `registry.json`
4. Add services to `docker-compose.yml`
