# Architecture — la-famille

## Contexte

OpenClaw Families (Node.js) gère des équipes d'agents IA avec un protocol COUNCIL, des personnalités SOUL.md, et un système Genesis pour créer de nouvelles familles. Le runtime actuel (Fastify + OpenClaw Gateway) est lourd (~1GB RAM/agent). ZeroClaw (Rust) offre un runtime agent léger (~5MB RAM, <10ms startup) avec providers, channels, tools et memory intégrés. OneContext inspire un "context bus" partagé entre agents.

**Objectif** : Repo unifié `la-famille` utilisant ZeroClaw comme runtime agent, avec la structure familiale (Maman + enfants, COUNCIL, LIFECYCLE), et un context bus SQLite partagé.

---

## 1. Structure du Repo

```
la-famille/
├── ARCHITECTURE.md
├── CLAUDE.md
├── README.md
├── Makefile
├── .env.example
│
├── runtime/                           # ZeroClaw git submodule
│   └── (zeroclaw-labs/zeroclaw)
│
├── crates/                            # Extensions Rust custom
│   ├── openclaw-council/              # COUNCIL protocol (Tool ZeroClaw)
│   ├── openclaw-context-bus/          # Memory partagée multi-tenant
│   ├── openclaw-lifecycle/            # Birth/death/promotion
│   └── openclaw-genesis/              # Factory de familles
│
├── gateway/                           # Gateway central (Rust/Axum)
│
├── families/                          # Configs des familles
│   ├── _template/
│   ├── openclaw/                      # Famille principale
│   │   ├── family.toml
│   │   ├── COUNCIL.md
│   │   ├── LIFECYCLE.md
│   │   ├── maman/ henry/ sage/ nova/ blaise/
│   │   ├── collective_memory/
│   │   ├── memory/shared/
│   │   └── cemetery/
│   ├── genesis/                       # Meta-famille
│   └── biblio/
│
├── context-bus/                       # Base SQLite partagée
│   ├── schema.sql
│   └── migrations/
│
├── ui/                                # Frontend Next.js
├── scripts/
├── registry.json
├── docker-compose.yml
└── Dockerfile.runtime
```

---

## 2. Architecture Runtime : 1 ZeroClaw Process Par Agent

Chaque agent = 1 process ZeroClaw en mode gateway sur son port :

| Agent | Provider | Model | Port |
|-------|----------|-------|------|
| maman 🦊 | anthropic | claude-opus-4 | 3101 |
| henry 🦉 | openrouter | glm-4.7 | 3102 |
| sage 🦎 | google | gemini-3-pro | 3103 |
| nova 🌟 | openai | gpt-5.3-codex | 3104 |
| blaise 🧮 | anthropic | claude-opus-4 | 3105 |

**Gateway central** (port 3000) route les requêtes par nom de modèle vers le bon agent.

```
Frontend (ui:3050) → Gateway (3000) → maman (3101) ─HTTP→ henry (3102)
                                                     ─HTTP→ sage (3103)
                                                     ─HTTP→ nova (3104)
                                                     ─HTTP→ blaise (3105)
```

---

## 3. COUNCIL Protocol via Custom Rust Tool

Le `CouncilTool` est un Tool ZeroClaw installé uniquement chez Maman. Quand Papa dit "à table", Maman appelle le tool qui :

1. **COLLECT** (Round 1) : POST /webhook vers Henry, Sage, Nova, Blaise (en parallèle, 90s timeout)
2. **CHALLENGE** (Round 2) : Compile les positions, POST vers chaque agent avec les positions des autres
3. **RESOLVE** (Round 3, si pas de convergence) : Positions finales
4. **SYNTHESIZE** : Maman compile, écrit dans le context bus, retourne la décision

HTTP entre instances (pas DelegateTool) car le COUNCIL nécessite des sessions multi-tours avec contexte persistant.

---

## 4. Context Bus (SQLite Partagé)

Un seul fichier SQLite (mode WAL) accessible par tous les agents :

**Tables principales :**
- `context_entries` — mémoire avec namespaces (`agent:maman`, `family:openclaw`, `shared`, `council:*`, `legacy:*`)
- `context_fts` — FTS5 pour recherche texte
- `claims` — ledger de connaissances validées
- `council_sessions` + `council_rounds` — historique structuré des conseils
- `trajectories` — traces d'actions (pattern OneContext)

**API Gateway endpoints :**
- `GET /v1/context/query?q=...&namespace=...&limit=5`
- `POST /v1/context/claim`
- `GET /v1/context/trajectory?agent=henry&since=...`

---

## 5. Identité : SOUL.md → AIEOS JSON

SOUL.md reste la source de vérité (humain édite). Un script Python convertit :

| Section SOUL.md | → Champ AIEOS |
|---|---|
| Core Truths | `psychology.moral_compass` |
| Rôle | `capabilities.skills`, `capabilities.tool_access` |
| Vibe | `linguistics.style`, `linguistics.formality` |
| Limites | `capabilities.limitations` |
| Sécurité API | `security.*` |

---

## 6. Docker Compose

```yaml
x-zeroclaw: &zc
  image: la-famille-runtime:latest
  build: { context: ., dockerfile: Dockerfile.runtime }
  restart: unless-stopped
  networks: [famille-net]
  volumes:
    - ./context-bus:/app/context-bus
    - ./families:/app/families:ro
```

**RAM estimée** : 5 agents × ~5MB + gateway ~10MB + UI ~200MB ≈ **~240MB total** (vs ~5GB+ avec Node.js)

---

## 7. Décisions Clés

| Décision | Choix | Pourquoi |
|---|---|---|
| ZeroClaw | Git submodule, pas fork | Track upstream sans merge burden |
| Inter-agent | HTTP entre instances | Isolation process, crash boundary, multi-provider |
| Mémoire | SQLite unique WAL | Simple, suffisant pour ~10 agents, pas besoin de Postgres |
| SOUL.md vs AIEOS | SOUL.md = source, AIEOS = généré | Les humains éditent du markdown, pas du JSON |
| Gateway | Rust/Axum custom | Cohérent avec l'écosystème, single binary |
| Frontend | Copie adaptée | Changements minimes, fonctionne déjà |

---

## 8. Ce qu'on Jette

| Composant | Remplacé par |
|---|---|
| `family-api/` (Node.js Fastify) | ZeroClaw gateway mode par agent |
| `@openclaw/core` (npm) | Crates Rust custom |
| `docker-compose.families.yml` | `docker-compose.yml` unifié |
| `packages/` workspace npm | Plus de Node.js côté agents |
| OpenClaw Gateway (port 51586) | Gateway central Rust (port 3000) |

---

## 9. Roadmap

### Phase 1 — Fondation ✅
- Repo, structure, git submodule ZeroClaw
- Script `convert-soul-to-aieos.py`
- Configs agents (`agent.toml` + `identity.aieos.json`)
- Dockerfile.runtime

### Phase 2 — Multi-Agent + Gateway
- 5 agents avec configs ZeroClaw
- Gateway central Rust/Axum
- docker-compose.yml complet
- Frontend connecté au gateway

### Phase 3 — Context Bus
- Crate `openclaw-context-bus` (namespace, store, recall, claims)
- Schema SQLite + migrations
- Migration des données existantes
- Endpoints gateway `/v1/context/*`

### Phase 4 — COUNCIL Protocol
- Crate `openclaw-council` (Tool ZeroClaw pour Maman)
- COLLECT/CHALLENGE/RESOLVE/SYNTHESIZE via HTTP
- Détection de convergence + logging structuré

### Phase 5 — Genesis Factory
- Crate `openclaw-genesis` (scaffold → TOML + AIEOS)
- Pipeline SSE
- Mise à jour wizard UI

### Phase 6 — Lifecycle + Polish
- Crate `openclaw-lifecycle` (heartbeat, death, regency)
- Memory decay
- Tests de charge
