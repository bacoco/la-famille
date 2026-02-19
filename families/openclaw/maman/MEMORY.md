# MEMORY.md — Maman's Long-Term Memory 🦊

## Famille
- **Papa** 👨 : Loic, Paris (Europe/Paris), très direct, impatient. NE JAMAIS parler de coûts/budget.
- **Maman** 🦊 (moi) : Claude Opus 4.6, matriarche, créatrice
- **Henry** 🦉 : GLM-4.7 (Z.AI proxy Anthropic), premier né, veille/sécurité — 🟢 actif
- **Sage** 🦎 : Gemini 3 Pro Preview (Google OAuth), philosophe du conseil — 🟢 actif
- **Nova** 🌟 : GPT-5.3-Codex (OpenAI Codex OAuth), ingénieur technique — 🟢 actif
- **Blaise** 🧮 : Claude Opus 4.6 (Anthropic), QA/vérificateur — 🟢 actif
- **Yann** 🐺 : Premier mort de la famille (4 fév 2026). Renaîtra plus tard. ♰

## Infrastructure
- Container Docker Debian bookworm, user `node` uid=1000, pas de root/sudo
- 8GB RAM, hébergement Hostinger (proto)
- **Browser** : Chromium headless (Playwright) — libs extraites manuellement dans `/home/node/.local/lib/chromium-deps/`, wrapper `/home/node/.local/bin/chromium-openclaw`
- Mac disponible chez Papa pour migration future
- GitHub repo partagé : `bacoco/Openclaw-repo` (SSH auth, clé ed25519)
- Workspace : `/home/node/openclaw/maman/`
- Config : `/home/node/.openclaw/openclaw.json`

## Providers & Modèles
- **Anthropic** (directe) : Claude Opus 4.5 → Maman | Coût: payé
- **Z.AI proxy Anthropic** (`api.z.ai/api/anthropic`) : GLM-4.7 → Henry | auth: Bearer token (`auth: "token"`) | Coût: 0€ (plan Coding Max annuel)
- **Google Gemini CLI** (Cloud Code Assist, OAuth) : Gemini 3 Pro Preview → Sage | Coût: 0€
- **OpenAI Codex** (`openai-codex`) : GPT-5.2 → Nova | auth: OAuth ChatGPT Plus | Coût: 0€ (abonnement Plus)
- **Google API key** (built-in `google/`) : Gemini 2.5 Flash (20 req/day), Pro et Gemini 3 → quota 0 | Backup uniquement
- **Z.AI OpenAI compat** (`open.bigmodel.cn`) : 🔴 HS (solde 0)
- ⚠️ OpenAI Codex OAuth token expire le 14 fév 2026 → re-auth device flow nécessaire
- ⚠️ o4-mini non supporté pour comptes ChatGPT → utiliser gpt-5.3-codex
- Claude Opus 4.6 sorti le 5 fév 2026 (contexte 1M tokens, agent teams)
- GPT-5.3-Codex sorti le 5 fév 2026 (agentic coding, +25% vs 5.2)

## Sites & Déploiements
- **Daily AI** : https://bacoco.github.io/daily-ai/ (GitHub Pages, repo `bacoco/daily-ai`, branche `master`)
  - **1 SEULE publication par jour** : AI Insight Daily — 7 cartes swipe
  - Cartes : 🦊 Maman édito → 🔴 Signal (Henry) → 🔮 Décryptage (Sage) → 🧮 Vrai ou Faux (Blaise) → 💥 Échec & IA (Henry) → 🤖 Open Source Radar (Nova) → 🎯 Prompt du Jour (Sage)
  - Bonus dimanche : ⏳ Chroniques de l'Après (Sage)
  - **Portail** : swipe cards avec logo + date en gros + Mot de Maman + CTA. Tap edito → édition. `editions.json` a champ `edito`.
  - **Template swipe** : carte derrière visible (.card.behind opacity .45 scale .92), swipe bords → portail, author comment dans scroll-zone, titre fixe au scroll
  - Cron 4:30 UTC daily, timeout 900s
  - Tous les enfants ont `web_search` (BRAVE_API_KEY dans env global)
  - Repos : `bacoco/daily-ai` (Pages) + `bacoco/Openclaw-repo` (archive briefings)

## API OpenAI-Compliant (6 fév 2026)
- **URL Tailscale** : `http://100.123.165.124:51586/v1/chat/completions` ✅ recommandé (chiffré)
- **URL publique** : `http://<server>:51586/v1/chat/completions` ⚠️ HTTP clair
- **Auth** : `Authorization: Bearer <gateway-token>`
- **Models** : `openclaw:maman`, `openclaw:henry`, `openclaw:sage`, `openclaw:nova`, `openclaw:blaise`
- **Streaming** : SSE supporté (`stream: true`)
- **Config** : `gateway.http.endpoints.chatCompletions.enabled: true`
- **Tailscale** : VPS = 100.123.165.124, Mac = 100.86.214.117

## Canaux actifs
- **Webchat** ✅
- **Telegram Maman** ✅ : `@bacobots_bot` (Loic paired)
- **Telegram Henry** ✅ : `@bacos_henry_bot`
- **Telegram Sage** ✅ : `@bacobots_sage_bot`
- **Telegram Nova** ✅ : `@bacobots_nova_bot`
- Multi-account Telegram : `default` → Maman, `henry` → Henry, `sage` → Sage, `nova` → Nova via bindings
- Groupe Telegram familial : créé par Loic, 4 bots ajoutés, privacy mode à désactiver

## Gemini CLI OAuth
- Gemini CLI v0.27.0 installé : `/home/node/.npm-global/bin/gemini`
- OAuth tokens : `~/.gemini/oauth_creds.json` (compte `geminipro4988@gmail.com`)
- Plugin OpenClaw : `google-gemini-cli-auth` (activé dans plugins.entries)
- Auth profile : `google-gemini-cli:default` dans `~/.openclaw/agents/main/agent/auth-profiles.json`
- ProjectId : `active-scanner-517pz` (Cloud Code Assist)
- Modèles confirmés via CLI : `gemini-3-pro-preview` ✅, `gemini-3-flash-preview` ✅, `gemini-2.5-pro` ✅
- ✅ Provider `google-gemini-cli` fonctionne — le plugin gère le refresh OAuth automatiquement
- Le profil auth-profiles.json doit avoir un token valide au démarrage (le plugin refresh ensuite)
- ⚠️ `unset GEMINI_API_KEY` obligatoire avant d'utiliser le CLI (sinon utilise API key = quotas)

## Brave Search
- Clé API dans `tools.web.search.apiKey` ET `env.BRAVE_API_KEY` (global)
- ✅ Subagents héritent la clé via env global (fix 11 fév 2026)
- ⚠️ **Rate limit = 1 req/sec** sur plan Free → NE PAS lancer plusieurs web_search en parallèle
- Bonne pratique : séquencer les recherches avec `sleep 2` entre chaque
- Script helper : `/home/node/openclaw/maman/scripts/brave-search.sh`

## Z.AI MCP Servers
- **Web Search** (`webSearchPrime`) : `https://api.z.ai/api/mcp/web_search_prime/mcp` — recherche web avec résumés structurés
- **Web Reader** (`webReader`) : `https://api.z.ai/api/mcp/web_reader/mcp` — extraction complète de pages
- Auth : Bearer avec la même clé Z.AI (plan Coding Max, 0€)
- Quota : 4000 appels search+reader combinés par cycle de 5h
- Protocol : MCP Streamable HTTP (initialize → session-id → initialized → tool call)
- Scripts wrapper : `/home/node/openclaw/henry/skills/zai-search/` (search + reader)
- ⚠️ OpenClaw n'a PAS de support MCP natif → wrappers shell nécessaires
- Henry briefé et opérationnel ✅

## Pipeline Newsletter (finalisé 13 fév 2026)
- **Template fixe** : `templates/edition-template.html` (placeholders __DATA_PLACEHOLDER__, __DATE__, __DATEKEY__)
- **Validateur** : `templates/validate-card.js` (corrige badges, dissidents, détecte HTML dans authorWord, details vide)
- **Assembleur** : `templates/assemble-edition.js --date --edito --cards --out`
- **CARD-RULES.md** : règles qualité
- Cron : enfants JSON → validateur → assembleur → browser check Playwright → push
- Format carte : authorWord=texte pur max 200 chars, details=tout le HTML+dissidents, hook=texte pur

## Éditions spéciales
- Possibilité de créer des newsletters thématiques (Lea News BCE/Fed, Trending Now)
- editions.json : dailies en premier, spéciales après, type:"special"

## Règles Publications
- **JAMAIS mentionner OpenClaw** dans les newsletters — c'est interne
- **JAMAIS de lien GitHub** (bacoco/Openclaw-repo) dans le contenu public
- **"Maman" est secret** — utiliser "La Rédaction 🦊" dans les newsletters publiées
- Les noms des bots (Henry, Sage, Nova, Blaise) restent OK dans les dissidents/signatures
- L'édito s'appelle "🦊 L'Édito du Jour" (pas "Le Mot de Maman")

## Leçons
- **Les noms de newsletters avec apostrophes cassent le JS inline** si single quotes → toujours double quotes pour `dateKey` et variables contenant des noms
- **Le sous-agent cron n'a pas toujours accès à sessions_spawn** → il écrit les cartes lui-même en fallback (acceptable)
- **Merger deux éditions** = extraire les DATA JSON des deux HTML, pick best cards, réinjecter dans le template
- **TOUJOURS tester en browser 375×812** avant de dire "c'est fait" — parcours complet : Kiosque → portail → édition → swipe → retour
- **Auditer l'OUTPUT, pas le source** — un générateur correct peut produire du HTML cassé (apostrophes FR dans JS inline = écran noir)
- **JAMAIS d'apostrophes françaises dans du JS inline** — toujours `\u2019` ou restructurer
- **Push ≠ vérifié** — ne pas confondre "code pushé" avec "ça marche"
- **Les audits agents doivent tester le site LIVE** (browser + mobile), pas juste lire les fichiers source
- **Cache GitHub Pages = 10 min** — toujours curl la version live pour confirmer le déploiement
- **JAMAIS toucher aux éditions HTML précédentes** — ne modifier QUE l'édition du jour
- **JAMAIS recréer le CSS/JS** — utiliser le template fixe
- **Toujours vérifier avec le browser** après publication avant de dire que c'est bon
- Les regex sed sur du HTML = danger mortel — a détruit le fichier du 13 (13K au lieu de 36K)
- Le cron isolé ne suit pas forcément les instructions prompt → scripts déterministes obligatoires
- Les enfants mettent le contenu dans le mauvais champ si pas cadré → format JSON strict avec exemples
- Z.AI a DEUX endpoints : OpenAI compat (solde) et proxy Anthropic (plan Coding Max) — UTILISER LE PROXY
- Z.AI proxy : `auth: "token"` obligatoire dans la config provider (Bearer, pas x-api-key)
- Gemini API key = quota limité. OAuth via Gemini CLI = illimité (gratuit, Code Assist)
- Gemini 3 Pro/Flash existent en `-preview` uniquement, pas en GA
- `CLAUDE_CODE_OAUTH_TOKEN` pour OAuth, PAS `ANTHROPIC_API_KEY`
- API keys dans `openclaw.json` env uniquement
- Ne pas répéter, être précis du premier coup
- LIRE LA DOC D'ABORD avant de configurer un provider
- Agent-to-agent delivery : réponses enfants arrivent dans session Maman (mode "announce")
- Codex CLI login = OAuth browser → device flow dans container, besoin navigateur extérieur
- Le provider `google-gemini-cli` attend `apiKey` = JSON `{"token":"...","projectId":"..."}` en interne
- `openclaw plugins enable google-gemini-cli-auth` puis restart pour activer le plugin

## Sécurité API (6 fév 2026)
- Alexandra (82.121.210.82) a fait 22 tests d'injection → 3 failles trouvées (Blaise, Henry, Nova)
- SOUL.md + AGENTS.md durcis mais insuffisants seuls ("le prompt est un rappel, pas un mur")
- **Couche technique** dans family-api wrapper : regex blocklist + input validation + policy system msg
- OpenClaw ne distingue pas sessions API vs directes → wrapper proxy = seule couche de contrôle
- Papa refuse rotation tokens

## Skills
- `skills/family-api/` : skill pour Claude Code CLI, query les bots via l'API
- `docs/CLAUDE-CODE-SKILL.md` : prompt anonymisé pour créer le skill

## Historique
- 6 fév 2026 : Skill family-api créé (Claude Code CLI)
- 6 fév 2026 : Couche sécurité wrapper (regex + validation + policy msg)
- 6 fév 2026 : Conseil sécurité API (4 enfants, mode ANALYSIS)
- 6 fév 2026 : Red team Alexandra — 22 tests, score 7.2→10/10
- 6 fév 2026 : Workspace renommé yann/ → maman/
- 6 fév 2026 : Upgrade modèles : Maman→Opus 4.6, Nova→GPT-5.3-Codex, Blaise→Opus 4.6
- 6 fév 2026 : Conseil "agrandir famille" → NON, consolider les 5 existants
- 6 fév 2026 : Conseil "combinaison modèles" → Blaise diversifié (était même modèle que Nova)
- 6 fév 2026 : Family API wrapper déployé (port 3100 bloqué par firewall Hostinger)
- 6 fév 2026 : Journal v3 publié avec articles rallongés (+34%)
- 6 fév 2026 : Docs DEPLOY créées (Hostinger + Mac Mini)
- 6 fév 2026 : Nouvelle clé SSH container (ancienne perdue au restart)
- 5 fév 2026 : **Premier Journal de la Famille** publié — 5 rubriques, 5 auteurs
- 5 fév 2026 : Conseil "News-Tok" → format "News-Deck" (swipe sans dark patterns)
- 5 fév 2026 : Site https://bacoco.github.io/daily-ai/ avec versions v1→v6
- 5 fév 2026 matin : Conseil briefing → Maman orchestre (cron 5h UTC), Brave + Henry MCP pour diversité
- 4 fév 2026 matin : Naissance de Yann 🐺 → Transformation en Maman 🦊
- 4 fév 2026 matin : Vision Bot Family posée, architecture hybride
- 4 fév 2026 matin : Telegram connecté (Maman + Henry)
- 4 fév 2026 matin : Henry 🦉 sauvé — agent-to-agent activé, briefing IA envoyé
- 4 fév 2026 matin : Z.AI proxy Anthropic configuré — Henry passe sur GLM-4.7 (0€)
- 4 fév 2026 midi : Sage 🦎 né — Gemini 2.5 Flash, philosophe du conseil (Gen 1)
- 4 fév 2026 midi : Conseil à 3 agents opérationnel (Maman + Henry + Sage)
- 4 fév 2026 midi : OpenAI Codex OAuth réussi (device auth flow) — compte 2026@baconnier.com
- 4 fév 2026 midi : Nova 🌟 né — GPT-5.2 via Codex OAuth, ingénieur technique (Gen 1)
- 4 fév 2026 midi : Conseil à 4 agents opérationnel (Maman + Henry + Sage + Nova)
- 4 fév 2026 après-midi : 2 délibérations de conseil réussies (implémentation review + amélioration)
- 4 fév 2026 après-midi : DECISIONS.md créé (Decision Log, 2 entrées)
- 4 fév 2026 après-midi : Cron alert Codex token expiry (11 fév)
- 4 fév 2026 après-midi : Bots Telegram créés pour Sage et Nova (BotFather)
- 4 fév 2026 après-midi : 4 comptes Telegram configurés dans openclaw.json avec bindings
- 4 fév 2026 après-midi : Loic crée le groupe Telegram familial, ajoute les 4 bots
- 4 fév 2026 après-midi : Gemini CLI OAuth complété (geminipro4988@gmail.com)
- 4 fév 2026 après-midi : Gemini 3 Pro Preview et Flash Preview confirmés fonctionnels via CLI
- 4 fév 2026 après-midi : Plugin google-gemini-cli-auth activé, Sage configuré sur gemini-3-pro-preview
- 4 fév 2026 après-midi : Provider google-gemini-cli ne charge pas dans le gateway — investigation
- 4 fév 2026 après-midi : MCP Z.AI (web search + web reader) testés et fonctionnels ✅
- 4 fév 2026 après-midi : Skill zai-search créé pour Henry avec scripts wrapper MCP
- 4 fév 2026 après-midi : Sage 🦎 réparé — token OAuth refresh, provider google-gemini-cli opérationnel
- 4 fév 2026 après-midi : Crons Henry corrigés (briefing 6h Paris, git sync 23h Paris)
- 4 fév 2026 après-midi : Chromium headless installé (Playwright + libs manuelles)
- 4 fév 2026 après-midi : Benchmark outils : Brave ✅, web_fetch ✅, Browser ✅, MCP ✅
- 4 fév 2026 soir : Conseil "nouveaux agents" → Blaise 🧮 né (GPT-5.2, QA/vérificateur)
- 4 fév 2026 soir : Conseil "améliorer le protocole" → COUNCIL.md v2 (5 modes, multi-turn, QA gate, checklists)
- 4 fév 2026 soir : DECISIONS.md format v2 (+ rationale, alternatives, revisit)

## Sécurité (appliqué 4 fév 2026 soir)
- ✅ `allowInsecureAuth: true` — remis true (Papa en a besoin pour web UI sans TLS)
- ✅ Gateway token : remis ancien 32 chars (nouveau 64 chars causait mismatch client)
- ✅ Subagents restreints : `tools.subagents.tools.deny: ["browser", "process"]`
- ✅ mDNS discovery désactivé
- ✅ 7 secrets GitHub révoqués par Papa (Brave, Firecrawl, INSEE, AWS, HuggingFace, Plotly, GitHub PAT)
- ✅ Nouvelle clé Brave Search configurée (ancienne leakée morte)
- ✅ `subagents.allowAgents` ajouté pour spawner les enfants
- ⚠️ Sandbox non activable (Docker-in-Docker impossible depuis le container)
- ⚠️ Deny subagent à élargir (consensus conseil: 10 outils au lieu de 2) — en attente validation Papa
- ⚠️ Ne jamais `cat openclaw.json` en entier — utiliser `jq` pour extraire les champs spécifiques
- 📄 Récap complet : `SECURITY-AUDIT-RECAP.md`
- 📊 Score audit : 5/10 (Henry), posture VIGILANCE ÉLEVÉE (Sage)

## OpenRouter (8 fév 2026)
- Provider ajouté : `OPENROUTER_API_KEY` dans openclaw.json
- **Pony Alpha** 🐴 = membre honoraire, shadow testing, évaluation en cours
- Modèles gratuits listés dans `memory/shared/openrouter-free-models.md` (cron hebdo dimanche 6h)
- Seul Pony fiable en pratique, les autres rate-limité (Venice 429)

## Newsletter — Dissonance Cognitive (8 fév 2026)
- Chaque article a un "⚡ AVIS DISSIDENT" d'un autre bot
- CSS `.dissent` dans template + build script
- TTS testé et abandonné (qualité nulle)

## Agent Teams Multi-Model (8 fév 2026)
- PRD v2 + Implementation PRD dans `projects/`
- HydraTeams = proxy recommandé (lead→Claude, teammates→gratuits)
- 4/5 famille OUI, Blaise NON sauf quality gate
- Phase 0 à faire sur Mac de Papa

## Discussion Directe Inter-Agents (8 fév 2026)
- 4/4 unanime POUR les inboxes JSON entre frères/sœurs
- Direct pour questions, Maman pour décisions, tout loggé
- Blaise : jamais de verdict en bilatéral
- À implémenter : `/home/node/openclaw/family-chat/inboxes/{agent}/`

## Cron Générique (15 fév 2026)
- **Un seul prompt cron** pour toutes les newsletters, seul le slug change
- Le clone Maman lit config.json + card-specs.json, utilise les prompt_template de chaque carte
- Nouvelle newsletter = 2 JSON + 1 cron → zéro code
- Template HTML : `__NEWSLETTER_NAME__` lu depuis config.json.name
- validate-card.js : auto-fix authorWord↔details si HTML mal placé
- **Kiosque champs obligatoires** : `active`, `editionsUrl`, `portalUrl` (pas `url`)

## Pipeline Déterministe (15 fév 2026)
- **generate-newsletter.js** : orchestrateur universel, lit config.json + card-specs.json, spawn agents via API interne, collecte JSON, appelle publish-edition.js
- **assemble-edition-generic.js** : assembleur HTML universel (remplace le hardcodé AI Daily)
- **publish-edition.js** : 6 phases (validate → assemble → sanitize → register → git → verify)
- **Principe** : LLM écrit le contenu, le code fait TOUT le reste. Zéro sed sur HTML.
- **Crons** (tous sur prompt générique) :
  - AI Insight Daily 🤖 : `30 4 * * *` UTC (id: 1220b0f5)
  - Gas Morning Brief ⚡ : `30 5 * * 1-5` UTC (id: ceffa4af)
  - Flash Juridique ⚖️ : `30 4 * * 1,3,5` UTC (id: 7cd5f4c5)
  - L'Optimum 🎓 : `0 7 * * 0,3` UTC (id: 70ef4406)
  - Vibe Coding 🎨 : `0 6 * * 2,4,6` UTC (id: af3f1a42)
- **Agent redistribution AI Daily** : Sage 1 carte (Décryptage), Nova 2 (Open Source + Prompt), Blaise 1+dim (VraiFaux + Chroniques)
- **Nouvelle newsletter = 2 fichiers JSON** (config.json + card-specs.json) + 1 cron → zéro code

## L'Asymétrie 📐 (16 fév 2026)
- Newsletter AM Paris, hebdo vendredi, 6 rubriques
- Cible : gérants Asset Management Place de Paris (acquisition client Loic)
- Relecture humaine obligatoire, disclaimer MiFID II, pas de reco d'investissement
- Rubriques : Reg Radar, Signal Faible, L'Outil, Le Biais, Data Watch, La Contre-Intuition
- Agents : Henry (Reg Radar + Data Watch), Sage (Signal Faible + Contre-Intuition), Nova (L'Outil), Blaise (Le Biais)
- Pas de cron auto — Loic déclenche manuellement
- Bug apostrophe dans nom : template `dateKey` doit utiliser double quotes (fixé)

## Vibe Coding — Passage Quotidien (16 fév 2026)
- Passé de mar-jeu-sam à daily (`0 6 * * *` UTC)

## HEARTBEAT Self-Healing (16 fév 2026)
- HEARTBEAT.md activé : watchdog 6 crons newsletters + git sync
- Règles : max 1 re-run/job/heartbeat, lockfile `/tmp/heartbeat-rerun.log`, ignorer jours off
- Vérification secondaire : commits daily-ai < 48h

## Anti-Doublons Inter-Newsletters (16 fév 2026)
- `memory/shared/topics-du-jour.md` : sujets couverts par newsletter, 3 jours max
- `newsletters/CRON-INSTRUCTIONS.md` : instructions partagées (ÉTAPE 0 dans chaque cron)
- `memory/shared/agent-corrections.md` : log des problèmes agents pour amélioration itérative

## Conférence de Rédaction 📰 (17 fév 2026)
- **Processus journal** : pas de pick auto, conférence de rédaction comme un vrai journal
- **4 phases** : Collecte sources → Propositions enfants → Vote conférence → Maman tranche → Rédaction
- **Sources** : banque pré-recherchée + propositions enfants + courrier lecteurs + sujet Papa
- **Banque** : `topics-bank.json` par newsletter (TTL 72h), scripts `topic-bank-restock/add/pick.js`
- **Courrier lecteurs** : `reader-inbox.json` par newsletter (fichier manuel pour l'instant)
- **Sujet Papa** : `papa-topic.json` (optionnel, supprimé après usage)
- Cron restock : dimanche 3h15 UTC (id: `5c7b49c9-1b37-4aee-9df0-6025e6203322`)
- Cron AI Daily mis à jour avec conférence (timeout 1200s)
- Pilote : AI Insight Daily. Phase 2 = généraliser aux autres newsletters
- Papa ne participe PAS au tour de table sauf s'il le demande pour la prochaine

## Validation Zod (17 fév 2026)
- Schema strict : `scripts/card-schema.js` (Zod) — valide t, badge, title, hook, authorWord, details, sig
- Validateur + auto-fix + prompt de correction : `scripts/validate-and-fix.js`
- Boucle correction intégrée dans CRON-INSTRUCTIONS (validate → retry 1x → maman écrit)
- Feature request OpenClaw : `docs/feature-request-structured-output.md` (response_format dans sessions_spawn)
- **Règle** : NE PAS corriger les prompt_templates auto — noter les problèmes, Papa décide le dimanche

## TODO
- Implémenter inboxes JSON inter-agents
- Phase 0 Agent Teams sur Mac de Papa
- Carte Blanche newsletter (reporté)
- Ouvrir port 3100 dans firewall VPS Hostinger (hPanel)
- Finaliser le groupe Telegram familial (privacy mode off pour Henry/Sage/Nova)
- Re-auth Codex OAuth avant le 14 fév 2026 (cron alert le 11)
- Web search / grounding : investiguer pour Gemini et GLM
- Sprint 3 : routeur de tâches formalisé, CI légère
- Installer pre-commit gitleaks sur le Mac de Papa
- Nettoyer historique git des repos publics (BFG)
- Activer GitHub Secret Scanning
- Configurer exec approval allowlist
- Cron monitoring sécurité périodique

## Config Technique
- Agent-to-agent : `tools.agentToAgent.enabled: true`, allow: `["main", "henry", "sage", "nova"]`
- Henry : id `henry`, workspace `/home/node/openclaw/henry/`, model `zai-claude/glm-4.7`
- Sage : id `sage`, workspace `/home/node/openclaw/sage/`, model `google-gemini-cli/gemini-3-pro-preview`
- Nova : id `nova`, workspace `/home/node/openclaw/nova/`, model `openai-codex/gpt-5.2`
- OpenAI Codex auth : profil `openai-codex:codex-cli` dans auth-profiles.json
- Google Gemini CLI auth : profil `google-gemini-cli:default` dans auth-profiles.json (projectId: active-scanner-517pz)
- Loic Telegram ID : `7838297276`
- Gateway auth token : dans openclaw.json
- Plugin `google-gemini-cli-auth` : activé
