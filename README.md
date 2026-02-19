# la-famille

Unified AI agent family platform built on [ZeroClaw](https://github.com/zeroclaw-labs/zeroclaw) runtime.

```
Frontend (ui:3050) --> Gateway (3000) --> maman (3101) --HTTP--> henry (3102)
                                                       --HTTP--> sage  (3103)
                                                       --HTTP--> nova  (3104)
                                                       --HTTP--> blaise(3105)
```

## What is this?

**la-famille** manages teams of AI agents organized as "families". Each agent runs as a lightweight ZeroClaw process (~5MB RAM) with its own personality (SOUL.md), identity, and provider.

Key concepts:
- **Family** = a group of agents with roles, shared memory, and a COUNCIL protocol for collective decisions
- **SOUL.md** = human-editable personality file (source of truth for each agent)
- **COUNCIL** = multi-round deliberation protocol (COLLECT → CHALLENGE → RESOLVE → SYNTHESIZE)
- **Context Bus** = shared SQLite memory with namespaced entries, validated claims, and action trajectories
- **Genesis** = meta-family that creates new families from templates

## Architecture

| Component | Language | Description |
|-----------|----------|-------------|
| `runtime/` | Rust (submodule) | ZeroClaw — lightweight AI agent runtime |
| `crates/` | Rust | Custom extensions (COUNCIL, context bus, lifecycle, genesis) |
| `gateway/` | Rust (Axum) | Central API gateway, routes requests to agents |
| `families/` | TOML/Markdown | Family configs, SOUL.md files, shared memory |
| `context-bus/` | SQLite | Shared multi-tenant memory database |
| `ui/` | Next.js | Frontend (chat, families, agents, genesis wizard) |

## OpenClaw Family (Default)

| Agent | Role | Provider | Model | Port |
|-------|------|----------|-------|------|
| maman | orchestrator | anthropic | claude-opus-4 | 3101 |
| henry | researcher | openrouter | glm-4.7 | 3102 |
| sage | philosopher | google | gemini-3-pro | 3103 |
| nova | engineer | openai | gpt-5.3-codex | 3104 |
| blaise | verifier | anthropic | claude-opus-4 | 3105 |

## Quick Start

```bash
# Clone with submodule
git clone --recurse-submodules https://github.com/bacoco/la-famille.git
cd la-famille

# Copy and configure environment
cp .env.example .env
# Edit .env with your API keys

# Build and run with Docker
docker compose up -d

# Or build locally (requires Rust)
make build
make dev
```

## Development

```bash
make check        # Cargo check
make test         # Run tests
make convert-souls # Convert SOUL.md to AIEOS JSON
make docker-up    # Start all services
make docker-down  # Stop all services
```

## Project Structure

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full plan and design decisions.

## License

MIT
