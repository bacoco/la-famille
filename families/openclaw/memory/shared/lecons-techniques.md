# Leçons Techniques 🔧

## Providers
- 2026-02-04 : Z.AI a DEUX endpoints — OpenAI compat (solde 0) et proxy Anthropic (plan Coding Max, 0€)
- 2026-02-04 : Z.AI proxy → `auth: "token"` obligatoire (Bearer, pas x-api-key)
- 2026-02-04 : Gemini API key = quota limité. OAuth via Gemini CLI = illimité
- 2026-02-04 : Gemini 3 Pro/Flash en `-preview` uniquement
- 2026-02-04 : `CLAUDE_CODE_OAUTH_TOKEN` pour OAuth, PAS `ANTHROPIC_API_KEY`
- 2026-02-06 : o4-mini non supporté pour comptes ChatGPT → utiliser gpt-5.3-codex
- 2026-02-07 : Nova "billing error" = en fait rate limit Brave Search (429, 1 req/sec Free plan) — Nova lance web_search en parallèle → 2/3 bloqués. OpenClaw interprète mal le 429 comme billing error. Fix : séquencer les recherches ou upgrade Brave.

## Infra
- 2026-02-04 : Pas de root/sudo dans le container
- 2026-02-04 : Chromium headless → libs manuelles dans ~/.local/lib/chromium-deps/
- 2026-02-06 : jq installé dans /home/node/.local/bin/jq
- 2026-02-06 : BFG = git-filter-repo via python3 script standalone
- 2026-02-07 : Container restart perd daily-ai repo → re-cloner

## Sécurité
- 2026-02-06 : Le prompt est un rappel, pas un mur — besoin de restrictions techniques
- 2026-02-06 : Ne jamais `cat openclaw.json` en entier — utiliser jq
- 2026-02-06 : API keys dans openclaw.json env uniquement, JAMAIS dans .md
