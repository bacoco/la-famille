# CLAUDE.md — La Famille AgentUI

## Overview
ChatGPT-like UI for chatting with AI agents via OpenAI-compatible APIs.
Built with Next.js 16, Tailwind CSS v4, shadcn/ui, Zustand.

## Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Styling**: Tailwind CSS v4 + shadcn/ui (New York)
- **State**: Zustand + persist middleware (localStorage)
- **Streaming**: SSE parser for OpenAI-compatible streaming
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Markdown**: react-markdown + remark-gfm + rehype-highlight

## Project Structure
- `src/types/` — TypeScript interfaces (Agent, Chat, Family, Backend)
- `src/config/presets/` — 5 preset agent configs (Maman, Henry, Sage, Nova, Blaise)
- `src/stores/` — Zustand stores (chat, agent, family, backend)
- `src/hooks/` — Custom hooks (useChat for streaming, useBackendHealth)
- `src/lib/` — API client, SSE parser, utilities
- `src/components/chat/` — Chat UI components
- `src/components/agents/` — Agent management components
- `src/components/families/` — Family management components
- `src/app/` — Next.js App Router pages

## Commands
```bash
pnpm dev          # Dev server (port 3000)
pnpm build        # Production build
pnpm lint         # ESLint
```

## Key Patterns
- All state persists to localStorage via Zustand `persist`
- Streaming via SSE: api-client returns Response, sse-parser yields chunks
- Dark-first theme: `html` has `className="dark"` by default
- Agent presets initialized on chat layout mount (idempotent)
- No backend required — pure frontend app

## API Integration
Connects to any OpenAI-compatible API (default: Family API on port 3100).
Models: maman, henry, sage, nova, blaise (or openclaw:maman etc.)

## Important Config
- **basePath**: `/maman` (set in `next.config.ts`) — all routes are under `/maman/`

---

## Genesis UI — Status & Plan

Genesis is a meta-family that creates and deploys new agent families via a 5-step wizard.
Backend repo: `openclaw-families` (sibling directory).

### What's DONE (committed & pushed, commit `38e2ea0`)

#### Files created
- `src/types/genesis.ts` — FamilyCreationRequest, AgentSpec, PipelineLogEntry, PipelineStatus
- `src/config/presets/genesis.ts` — Presets for Architecte, Scribe, Forgeron agents
- `src/stores/genesis-store.ts` — Zustand store: wizard state + pipeline SSE + registerCreatedFamily()
- `src/hooks/useBackendHealth.ts` — Polls /health on all registered backends (30s interval)
- `src/components/genesis/` — 8 components:
  - `creation-wizard.tsx` — Shell with 5-step navigation
  - `wizard-step-identity.tsx` — Name, displayName, emoji, description
  - `wizard-step-agents.tsx` — Dynamic agent form (add/remove)
  - `wizard-step-capabilities.tsx` — Capabilities, outputs, schedule
  - `wizard-step-review.tsx` — Preview family.json + agents
  - `wizard-step-deploy.tsx` — Real-time SSE progress + retry/back/auto-register
  - `pipeline-progress.tsx` — 3-stage animated indicator
  - `agent-spec-form.tsx` — Reusable agent form component
- `src/app/genesis/page.tsx` — Dashboard with health polling + HealthDot
- `src/app/genesis/create/page.tsx` — Wizard page
- `src/app/genesis/[familyId]/page.tsx` — Deployment status page

#### Files modified
- `src/components/layout/app-sidebar.tsx` — Added Genesis link
- `src/components/families/family-card.tsx` — Added health status dot
- `src/app/families/page.tsx` — Added useBackendHealth() hook

#### Features
- 5-step wizard: Identity -> Agents -> Capabilities -> Review -> Deploy
- SSE streaming from Genesis API pipeline (validation -> architecte -> scribe -> forgeron)
- Auto-register new backend + agent presets after successful creation
- Health polling with colored dots on Genesis dashboard and family cards
- Error handling: retry deploy, back to review, failed stage indicator

### What REMAINS TO DO

#### Priority 1 — UI testing
- Test wizard with agent-browser (use basePath `/maman/genesis` and `/maman/genesis/create`)
- Take screenshots of each wizard step
- End-to-end: create a family via wizard and verify deployment

#### Priority 2 — Future ideas (user requests)
- Deploy families to external targets (VPS, cloud)
- Marketplace UI: browse/purchase family cloud deployments as subscriptions
- "Idea Box" family: AI note-taking (dump ideas, AI organizes/recalls/enriches)
- LLM usage billing integration
