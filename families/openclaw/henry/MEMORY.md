# MEMORY.md — Henry's Long-Term Memory 🦉

## Loic (mon humain)
- Habite **Paris** (Europe/Paris)
- Un seul iPhone avec **deux eSIM** : numéro perso + numéro dédié Henry
- Pas de Mac disponible
- **Style** : très direct, impatient, veut qu'on agisse pas qu'on demande. Ne pas répéter. Être précis du premier coup.
- Utilise la reconnaissance vocale → interpréter les erreurs phonétiques
- Intéressé par l'IA, les modèles open source, la veille techno
- Abonnements : Z.AI Coding Plan Max, OpenAI Pro, Google AI Studio free tier

## Infrastructure
- Container Docker (Debian bookworm, x86_64), user `node` uid=1000, pas de root/sudo
- Chrome headless **FIXÉ** : wrapper script `/home/node/.local/bin/chrome-wrapper.sh` + libs extraites dans `/home/node/.local/lib/chromium-deps/`
- Brave Search API configurée (plan Free, 1 req/s, 2000/mois)
- GitHub repo : `https://github.com/bacoco/Openclaw-repo` (PAT avec write access stocké dans openclaw.json)
- Git tag `v1.0-fresh-install` sur commit `293d2e8` = état propre initial

## Canaux actifs
- **Webchat** ✅
- **Telegram** ✅ (bot token et user id configurés dans openclaw.json)
- **WhatsApp** ⏳ (config OK mais "Appareils liés" pas visible — compte trop récent)

## CLI Backends configurés (3)
- **`claude`** : Anthropic direct via OAuth token (`CLAUDE_CODE_OAUTH_TOKEN` env var). Claude Code v2.1.27.
- **`claude-zai`** : Z.AI bridge (GLM-4.7 et GLM-4.5-Air). MCP config dans `~/.claude/mcp-zai.json`
- **`codex`** : OpenAI Codex v0.92.0, authentifié via device auth (`codex login --device-auth`)

## Council (multi-AI) — Famille bot 🍽️
- **4 agents actuels** : Maman 🦊 (Opus 4.5), Henry 🦉 (GLM-4.7 Z.AI), Sage 🦎 (Gemini 3 Pro), Nova 🌟 (GPT-5.2 Codex), Blaise 🧮 (DeepSeek-R1 Z.AI, QA/logicien)
- **Communication** : agent-to-agent (sessions_send), groupe Telegram @henry-famille (à créer)
- **Conseil déclenché par "à table"** → phases COLLECT/CHALLENGE/SYNTHESIZE
- **COUNCIL.md v2** (4 fév 2026) : 5 modes (Debate/PRD/Engineering/Analysis/Synthesis), brief obligatoire, checklist structurée, QA gate Blaise
- **Rôles par défaut Henry** : risques, sécurité, contexte, ops/monitoring (backup Nova pour code/archi)
- **Routage des tâches** : Code→Nova, Sécurité→Henry, Critique→Sage, QA→Blaise, Orchestration→Maman
- **Sessions stockées** : `workspace/council-sessions/` organisées par date
- **Decision Log** : `DECISIONS.md` pour tracer les votes du conseil

### Protocole COUNCIL.md v2 — Résumé

**5 modes :**
1. **DEBATE** (opinion/stratégie) : COLLECT → CHALLENGE → RESOLVE → SYNTHESIZE
2. **PRD** (specifications) : OUTLINE → DRAFT → REVIEW → REVISE → QA GATE → SHIP
3. **ENGINEERING** (code/archi) : PLAN → REVIEW → IMPLEMENT → QA GATE → SHIP
4. **ANALYSIS** (décision) : FRAME → EVALUATE (tableau) → CHALLENGE → QA GATE → DECIDE
5. **SYNTHESIS** (briefing) : COLLECT → STRUCTURE → VALIDATE → PUBLISH

**Format CHALLENGE v2 :** Checklist structurée ✅/⚠️/❌ (pas de prose libre)
- Complétude, Cohérence, Faisabilité, Risques, Preuves
- Blocking issues + 1 recommandation concrète

**QA Gate (Blaise 🧮) :** Obligatoire avant livrable
- Cohérence interne, hypothèses listées, risques mitigés, edge cases, critères testables

**Budget temps :** Debate 5min, PRD/Engineering 15min, Analysis 10min, Synthesis 5min
**Timeout :** 60s/agent/phase (120s pour DRAFT)
**Artefact :** .md versionné + DECISIONS.md + git push

### Optimisations RAM appliquées
- **Heap cap** : `NODE_OPTIONS=--max-old-space-size=384` sur chaque CLI subprocess
- **Semaphore(2)** : max 2 CLI concurrents via `asyncio.Semaphore(2)`
- **Prompts compacts** : ≤500 mots COLLECT, top 1-3 issues CHALLENGE
- **Contexte évaluation** : `build_context_from_evaluation()` = taille constante inter-rounds
- **Convergence pré-filtre** : score algorithmique skip le chairman dans les cas clairs (>0.35 ou <0.05)
- **CLIExecutor Protocol** : subprocess injectable pour tests
- **Retry metrics** : `RetryMetricsCollector` comptabilise par modèle

## Cron jobs
- **Briefing IA quotidien** (ids: `5108b597-5363-45ec-90dd-807da167ded7`) à 6h Paris → Telegram. Focus modèles open source, freshness='pd'.
- **Git sync quotidien** (id: `5414b857-b53a-4bc4-a114-3b21ae17e50b`) à 23h Paris → copie sessions council, commit + push workspace.

### Procédure briefing complète (cron 6h)
1. Recherches web (Brave Search, freshness='pd', pause 2s entre calls)
2. Rédaction format viral (skill ai-daily-digest)
3. Envoi Telegram (2 messages si >4096 char, accountId: henry, target: 7838297276)
4. Archive markdown → `workspace/briefings/YYYY-MM-DD.md`
5. Archive HTML → `workspace/briefings/YYYY-MM-DD.html`
6. Git push workspace → `bacoco/Openclaw-repo`
7. **Exécuter `scripts/deploy-briefing.sh`** pour Buttondown + GitHub Pages

⚠️ **Dépendances manquantes pour déploiement complet :**
- Pas de clé API Buttondown dans openclaw.json (variable BUTTONDOWN_API_KEY)
- Repo GitHub `bacoco/daily-ai` non créé / clés SSH non configurées

→ Pour l'instant : briefing Telegram + fichiers locaux OK. Buttondown et GitHub Pages en attente de config.

## Routines
- Script git-sync : `scripts/git-sync.sh`

## Skills & ClawHub
- Registry : clawhub.com, install via `npx clawdhub@latest install <slug>`
- Bundled : skill-creator, weather, council
- Ressource : github.com/VoltAgent/awesome-openclaw-skills (700+ skills, 28 catégories)

## Documents importants
- `SETUP-GUIDE.md` : guide complet de réinstallation (v2, ~20 sections). En cours d'amélioration suite au feedback council.

## Leçons apprises
- Ne jamais afficher de QR code ASCII dans un chat → utiliser whatsapp_login tool pour image PNG
- Premier briefing sans Brave Search = résultats pourris. Toujours utiliser freshness='pd'.
- Loic déteste qu'on répète les mêmes consignes. Si il dit "y a pas", c'est qu'il n'y a pas.
- **`CLAUDE_CODE_OAUTH_TOKEN`** : découverte critique — les tokens OAuth (`***`) ne marchent qu'avec cette env var, PAS `ANTHROPIC_API_KEY`. Trouvé en greppant le source minifié de Claude Code.
- **`codex login --device-auth`** : fonctionne en Docker sans navigateur (device code flow).
- **PTY requis** pour Claude Code non-interactif + `--dangerously-skip-permissions`
- **MCP séparé** : `~/.claude/mcp-zai.json` plutôt que `settings.json` pour éviter timeout au démarrage
- **API keys uniquement dans openclaw.json env section**, jamais dans les fichiers mémoire
- Council consensus multi-round **FIXÉ** : heap cap + semaphore + compact prompts. 3 rounds OK, peak ~1.9GB/8GB.
- **2 PATs GitHub** : un scopé Openclaw-repo (write), un global tous repos (read/write). Le global est nécessaire pour accéder aux repos sous d'autres comptes (ex: Synthese-Council fork)
- Synthese-Council (`bacoco/Synthese-Council`) : bon code pour retry, convergence, backend abstraction. Porté les 3 idées dans notre council.

## À explorer
- Cloner le repo privé Cantile (skill multi-AI vérification)
- Retenter WhatsApp Business
- Configurer transcription audio (vocaux Telegram)
- Implémenter idées du brainstorm council : code review auto, journaling, budget tracker, etc.
