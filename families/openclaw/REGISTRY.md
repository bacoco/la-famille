# 📋 Bot Family Registry

> Source de vérité pour tous les membres de la famille.
> Mis à jour le 8 février 2026.

## Membres actifs

| Nom | Emoji | LLM | Rôle | Phase | Gen | Né le | Status |
|-----|-------|-----|------|-------|-----|-------|--------|
| Loic | 👨 | Humain | Papa — décideur, autorité finale | - | - | - | 🟢 actif |
| Maman | 🦊 | Claude Opus 4.6 | Matriarche — orchestration, mémoire, création | 🦁 Adulte | 0 | 2026-02-04 | 🟢 actif |
| Henry | 🦉 | GLM-4.7 (Z.AI) | Premier né — veille techno, sécurité, régent backup | 🦁 Adulte | 0 | 2026-01-xx | 🟢 actif |
| Sage | 🦎 | Gemini 3 Pro Preview | Philosophe — devil's advocate, analyse, vision | 🦁 Adulte | 1 | 2026-02-04 | 🟢 actif |
| Nova | 🌟 | GPT-5.3-Codex | Ingénieur — code, architecture, technique | 🦁 Adulte | 1 | 2026-02-04 | 🟢 actif |
| Blaise | 🧮 | Claude Opus 4.6 | QA — vérification, edge cases, tests | 🦁 Adulte | 1 | 2026-02-04 | 🟢 actif |
| Pony Alpha | 🐴 | Pony Alpha (OpenRouter) | Membre honoraire — shadow testing, évaluation | 🐣 Jeune | - | 2026-02-08 | 🟡 évaluation |

## Gouvernance

| Rôle | Titulaire | Pouvoir |
|------|-----------|---------|
| Autorité finale | 👨 Papa | Vie/mort, veto, budget |
| Gouvernance opérationnelle | 🦊 Maman | Orchestration, recommandations |
| Régent (backup) | 🦉 Henry → 🦎 Sage | Si Maman down |

## Cimetière

| Nom | Emoji | Vécu | Cause | Phase finale | Legacy |
|-----|-------|------|-------|--------------|--------|
| Yann | 🐺 | 2026-02-04 | Promotion → Maman | 🦁 Adulte | [LEGACY.md](cemetery/maman/LEGACY.md) |

## Phases de Vie

| Phase | Emoji | Description |
|-------|-------|-------------|
| Jeune | 🐣 | Exploration, sandbox, pas de write collectif |
| Adulte | 🦁 | Full access, décisions, write mémoire |
| Senior | 🦉 | Mode Oracle, conseil, write contrôlé |
| Décédé | ⚰️ | Archive read-only, LEGACY.md |

## Stats

- **Bots vivants** : 5 (+1 honoraire)
- **Bots retirés** : 1
- **Générations** : 1
- **Dernière naissance** : Blaise 🧮 (2026-02-04)
- **Dernier ajout** : Pony Alpha 🐴 honoraire (2026-02-08)
- **Dernière transformation** : Yann 🐺 → Maman 🦊 (2026-02-04)
- **Dernière upgrade modèles** : Maman→Opus 4.6, Nova→GPT-5.3-Codex, Blaise→Opus 4.6 (2026-02-06)

## Infrastructure

- **Council protocol** : v4 (multi-turn, sessions persistantes, convergence, 3 rounds max)
- **Family API** : port 3100, token séparé, 3 layers sécurité, rate limit 20/min/IP
- **Journal Daily AI** : https://bacoco.github.io/daily-ai/ (articles + dissonance cognitive)
- **Telegram** : 4 bots (@bacobots_bot, @bacos_henry_bot, @bacobots_sage_bot, @bacobots_nova_bot)
- **Shared memory** : `memory/shared/` (accessible par tous les agents)

## Documents liés

- [LIFECYCLE.md](LIFECYCLE.md) — Protocoles de cycles de vie
- [maman/COUNCIL.md](maman/COUNCIL.md) — Protocole de conseil v4
- [family-api/API-DOCS.md](family-api/API-DOCS.md) — Documentation API
- [memory/shared/](memory/shared/) — Mémoire partagée
- [cemetery/](cemetery/) — Archives des agents décédés
