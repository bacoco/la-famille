# Modèles Gratuits OpenRouter — Mise à jour 2026-02-08

## Top Tier (contexte ≥ 200K, usage élevé)

| Modèle | ID OpenRouter | Contexte | Max Output | Notes |
|--------|---------------|----------|------------|-------|
| **Qwen3 Coder 480B A35B** | `qwen/qwen3-coder:free` | 262K | 262K | Coding monstre, MoE 480B |
| **Qwen3 Next 80B A3B** | `qwen/qwen3-next-80b-a3b-instruct:free` | 262K | — | Instruct, gros contexte |
| **StepFun Step 3.5 Flash** | `stepfun/step-3.5-flash:free` | 256K | 256K | Chinois, rapide |
| **NVIDIA Nemotron 3 Nano 30B** | `nvidia/nemotron-3-nano-30b-a3b:free` | 256K | — | NVIDIA, MoE |
| **🐴 Pony Alpha** | `openrouter/pony-alpha` | 200K | 131K | Stealth, coding/agentic/reasoning |

## Mid Tier (contexte 128-164K)

| Modèle | ID OpenRouter | Contexte | Max Output | Notes |
|--------|---------------|----------|------------|-------|
| **DeepSeek R1 0528** | `deepseek/deepseek-r1-0528:free` | 164K | — | Reasoning, très populaire |
| **TNG R1T Chimera** | `tngtech/tng-r1t-chimera:free` | 164K | 65K | Reasoning hybride |
| **OpenAI gpt-oss-120B** | `openai/gpt-oss-120b:free` | 131K | 131K | OpenAI open-source! |
| **OpenAI gpt-oss-20B** | `openai/gpt-oss-20b:free` | 131K | 131K | Petit frère |
| **Arcee Trinity Large** | `arcee-ai/trinity-large-preview:free` | 131K | — | Preview |
| **Hermes 3 405B** | `nousresearch/hermes-3-llama-3.1-405b:free` | 131K | — | 405B params, mastodonte |
| **Llama 3.3 70B** | `meta-llama/llama-3.3-70b-instruct:free` | 128K | 128K | Meta, très utilisé |
| **Mistral Small 3.1 24B** | `mistralai/mistral-small-3.1-24b-instruct:free` | 128K | — | Français natif |
| **Solar Pro 3** | `upstage/solar-pro-3:free` | 128K | — | Coréen, multilingue |

## À surveiller
- `openrouter/free` = routeur aléatoire vers modèles gratuits (200K ctx)
- Les modèles `:free` peuvent disparaître ou être rate-limités sans préavis
- Prochaine mise à jour : 2026-02-15

## Favoris famille (recommandation Maman)
1. **Pony Alpha** — membre honoraire, shadow testing ✅
2. **Qwen3 Coder 480B** — fallback coding (remplace Nova si HS)
3. **DeepSeek R1** — fallback reasoning (remplace Sage si HS)
4. **Llama 3.3 70B** — fallback généraliste
5. **Mistral Small 3.1** — fallback français
