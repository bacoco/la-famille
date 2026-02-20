# CLAUDE.md — la-famille

## Overview

Unified AI agent family platform. ZeroClaw (Rust) runtime per agent, COUNCIL protocol for collective decisions, SQLite context bus for shared memory.

**Current Phase: 2** — ZeroClaw native agents + gateway webhook translation. Council/context bus disabled.

## Repository Structure

| Directory | Purpose |
|-----------|---------|
| `runtime/` | ZeroClaw git submodule (`zeroclaw-labs/zeroclaw`) |
| `crates/openclaw-council/` | COUNCIL protocol (Phase 3-4) |
| `crates/openclaw-context-bus/` | Shared SQLite memory (Phase 3) |
| `crates/openclaw-lifecycle/` | Agent lifecycle (Phase 6) |
| `crates/openclaw-genesis/` | Family factory (Phase 5) |
| `gateway/` | Central Rust/Axum gateway (port 3000) — translates OpenAI ↔ ZeroClaw webhook |
| `families/` | Family configs (SOUL.md, config.toml, family.toml) |
| `context-bus/` | SQLite schema + migrations |
| `ui/` | Next.js frontend |
| `scripts/` | Migration, conversion, build scripts |

## Key Patterns

- **1 ZeroClaw process per agent** — each agent is an independent process on its own port
- **SOUL.md is source of truth** — human edits SOUL.md, AIEOS JSON is generated via `scripts/convert-soul-to-aieos.py`
- **config.toml** — ZeroClaw native config per agent (provider, model, port, temperature)
- **family.toml** — family manifest (agents list, council config)
- **Gateway translation** — frontend sends OpenAI format, gateway translates to ZeroClaw webhook
- **ZEROCLAW_WORKSPACE** — env var pointing to agent's directory (contains config.toml)
- **ZEROCLAW_API_KEY** — env var for the agent's LLM provider API key

## Build Commands

```bash
# ZeroClaw runtime (from submodule)
cd runtime && cargo build --release
# Binary: runtime/target/release/zeroclaw

# Gateway only
cargo build --release -p gateway
# Binary: target/release/gateway

# Docker
docker compose up -d           # Full stack
docker compose up -d --build   # Rebuild everything
docker compose logs -f maman   # Watch agent logs
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

## Gateway API (Phase 2)

- `POST /v1/chat/completions` — OpenAI-compatible → translated to ZeroClaw webhook
- `GET /v1/models` — List available agents/models
- `GET /health` — Health check

### Translation Flow

```
Frontend → POST /v1/chat/completions {"model":"maman","messages":[...]}
Gateway  → POST http://maman:3101/webhook {"message":"<last user msg>"}
ZeroClaw → {"response":"..."}
Gateway  → {"id":"chatcmpl-...","choices":[{"message":{"role":"assistant","content":"..."}}]}
```

## Disabled in Phase 2

- Context bus API (`/v1/context/*`) → Phase 3
- Council API (`/v1/council/*`) → Phase 3-4
- Inter-agent delegation → Phase 4
- Custom tools (council, context) → Phase 3-4
- Genesis factory → Phase 5

## Adding a New Agent

1. Create directory under `families/<family>/<agent>/`
2. Write `SOUL.md` (personality) and `IDENTITY.md`
3. Create `config.toml` (ZeroClaw native format: `default_provider`, `default_model`, `default_temperature`, `[gateway]` port)
4. Run `make convert-souls` to generate `identity.aieos.json`
5. Add agent entry to `family.toml`
6. Add service to `docker-compose.yml` with `ZEROCLAW_WORKSPACE` and `ZEROCLAW_API_KEY`
