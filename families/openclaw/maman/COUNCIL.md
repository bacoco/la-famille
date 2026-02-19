# COUNCIL.md — Protocole de Délibération v4 🍽️

> Mis à jour le 8 fév 2026 — Multi-turn réel avec sessions persistantes + convergence.

## Déclencheur

Papa dit **"à table"** (ou "conseil", "délibérez") suivi d'un sujet.
Maman choisit le **mode** selon le type de tâche, ou Papa le précise.

## Brief Obligatoire (Phase 0)

Avant tout conseil, Maman rédige un **brief** :

```
📋 BRIEF
- Type : [debate | prd | analysis | review | synthesis]
- Question : [question exacte]
- Contraintes : [temps, scope, dépendances]
- Format attendu : [bullets, PRD structuré, tableau, checklist...]
- Critères d'acceptation : [quand c'est "fini"]
- Rôles : Owner = [X], Reviewers = [Y, Z], QA = Blaise
- Max rounds : [2-3, défaut 3]
```

---

## Architecture Multi-Turn (v4)

### Principes

1. **Orchestrateur central** : Maman contrôle tout. Jamais de peer-to-peer.
2. **Sessions persistantes** : spawn une fois, `sessions_send` pour les tours suivants.
3. **3 rounds max** : COLLECT → CHALLENGE → RESOLVE. Au-delà, c'est du bruit.
4. **Convergence** : si tous "+1" au round 2, skip round 3.
5. **Logging structuré** : chaque round dans `memory/shared/councils/`.

### Flux

```
Maman (orchestrateur)
  │
  ├─ Round 1 (COLLECT) : sessions_spawn × N enfants → sessionKeys
  │   └─ Collecter toutes les réponses
  │
  ├─ Round 2 (CHALLENGE) : sessions_send(sessionKey, contexte_round_1)
  │   └─ Chaque enfant voit les réponses des autres
  │   └─ Réponse = maintenir / amender / contester (+ vote agree/disagree/nuance)
  │   └─ Si convergence (tous agree) → skip round 3
  │
  ├─ Round 3 (RESOLVE) — si désaccord :
  │   └─ sessions_send(sessionKey, synthèse_round_2 + question_ciblée)
  │   └─ Réponse = position finale + vote
  │
  └─ SYNTHESIZE : Maman tranche, archive, publie
```

### Fallback

- Si une session meurt (timeout/erreur) → noter l'absence, continuer sans.
- Si `sessions_send` échoue → respawn l'enfant avec historique compacté.
- Si un enfant ne répond pas après 90s → avancer sans lui.

---

## Convocation (Round 1 — COLLECT)

Pour chaque enfant, Maman fait :

```
sessions_spawn(
  agentId: "henry" | "sage" | "nova" | "blaise",
  label: "council-[sujet]-[agent]",
  task: "[brief + rôle + instructions + format attendu]",
  timeoutSeconds: 120
)
```

**Conserver les `sessionKey`** retournés pour les rounds suivants.

Le prompt de round 1 inclut :
- Le brief complet
- Le rôle assigné
- Le format de réponse attendu
- La consigne : "Donne ta position en 2-4 paragraphes. Termine par : *Ce qui me ferait changer d'avis : [...]* "

---

## Challenge (Round 2)

Maman compile les réponses du round 1, puis envoie à chaque enfant via `sessions_send` :

```
📋 ROUND 2 — CHALLENGE

Voici les positions des autres au Round 1 :

### 🦉 Henry
[résumé]

### 🦎 Sage
[résumé]

### 🌟 Nova
[résumé]

### 🧮 Blaise
[résumé]

---

Ta position était : [résumé de SA position]

Consigne : Maintiens-tu ta position, l'amendes-tu, ou contestes-tu un point précis ?
Format :
- **Vote** : agree | disagree | nuance
- **Réponse** : [2-3 §, checklist si review]
- **Blocking issues** : [liste ou "aucun"]
```

### Détection de convergence

Après round 2, si **tous les votes = "agree"** et **aucun blocking issue** → skip round 3, passer directement à SYNTHESIZE.

---

## Resolve (Round 3 — optionnel)

Déclenché uniquement si désaccord persistant au round 2.

Maman envoie via `sessions_send` :

```
📋 ROUND 3 — RESOLVE

Désaccords identifiés :
- [agent A] vs [agent B] sur [sujet précis]
- [détails]

Consigne : Position FINALE. 1 paragraphe max. Vote définitif.
Si pas de consensus, Maman tranchera.
```

---

## Synthesize (Phase Finale)

Maman seule. Pas de spawn.

1. Compiler toutes les positions finales
2. Identifier : consensus, désaccords acceptés, risques
3. Formuler la recommandation à Papa
4. Archiver (obligatoire)
5. Git push

---

## Logging Structuré

Chaque conseil produit des fichiers dans `memory/shared/councils/` :

### État du conseil : `council-{id}.json`

```json
{
  "id": "YYYY-MM-DD-{sujet}",
  "question": "...",
  "mode": "debate",
  "status": "active|resolved",
  "current_round": 2,
  "max_rounds": 3,
  "participants": {
    "henry": { "sessionKey": "...", "status": "responded|timeout|absent" },
    "sage": { "sessionKey": "...", "status": "responded" },
    "nova": { "sessionKey": "...", "status": "responded" },
    "blaise": { "sessionKey": "...", "status": "responded" }
  },
  "rounds": [
    {
      "round": 1,
      "type": "COLLECT",
      "timestamp": "...",
      "responses": {
        "henry": { "position": "...", "change_condition": "..." },
        "sage": { "position": "...", "change_condition": "..." }
      }
    },
    {
      "round": 2,
      "type": "CHALLENGE",
      "timestamp": "...",
      "responses": {
        "henry": { "vote": "agree", "response": "...", "blocking": [] },
        "sage": { "vote": "nuance", "response": "...", "blocking": [] }
      },
      "converged": false
    }
  ],
  "decision": "...",
  "archived_at": "..."
}
```

---

## Modes (inchangés)

### Mode A — DEBATE (opinion, stratégie)
Default. 3 rounds : COLLECT → CHALLENGE → RESOLVE.
Artefact : DECISIONS.md.

### Mode B — PRD / SPECIFICATION
Rounds adaptés : OUTLINE → DRAFT (Owner) → REVIEW → REVISE → QA GATE → SHIP.
Owner rédige, reviewers critiquent par domaine. Max 3 itérations review.
Artefact : `projects/[nom]-PRD.md`.

### Mode C — ENGINEERING (code, implémentation)
Rounds : PLAN → REVIEW → IMPLEMENT → QA GATE → SHIP.
Owner = Nova (défaut). QA = Blaise.
Artefact : Code + changelog.

### Mode D — ANALYSIS / DECISION
Rounds : FRAME → EVALUATE (tableau) → CHALLENGE → QA GATE → DECIDE.
Format tableau obligatoire : `| Option | Pros | Cons | Coût | Risques | Score |`
Artefact : Matrice de décision + DECISIONS.md.

### Mode E — SYNTHESIS / BRIEFING
Rounds : COLLECT → STRUCTURE → VALIDATE → PUBLISH.
1 page max, TL;DR + points d'action.
Artefact : `[sujet]-synthesis.md`.

---

## Format CHALLENGE v2 (tous modes)

```
## Review par [Nom] [Emoji]
- **Vote** : agree | disagree | nuance
- [ ] ✅/⚠️/❌ Complétude
- [ ] ✅/⚠️/❌ Cohérence
- [ ] ✅/⚠️/❌ Faisabilité
- [ ] ✅/⚠️/❌ Risques
- [ ] ✅/⚠️/❌ Preuves
**Blocking issues :** [liste ou "aucun"]
**Recommandation :** [1 action concrète]
```

## QA Gate (Blaise 🧮)

Obligatoire avant tout livrable final :
- Cohérence interne
- Hypothèses listées
- Risques + mitigations
- Edge cases / failure modes
- Critères d'acceptation testables
- Next actions avec owners

Si ❌ bloquant → retour en REVISE. Si ⚠️ → accepté avec risque documenté.

## Routage des tâches (hors conseil)

| Domaine | Lead | Backup |
|---------|------|--------|
| Code, archi, delivery | 🌟 Nova | 🦉 Henry |
| Sécurité, ops, monitoring | 🦉 Henry | 🌟 Nova |
| Critique, specs, analyse | 🦎 Sage | 🦊 Maman |
| QA, tests, validation | 🧮 Blaise | 🌟 Nova |
| Orchestration, mémoire | 🦊 Maman | 🦎 Sage |

## Archivage Obligatoire

Après CHAQUE conseil → `conseils/YYYY-MM-DD-[sujet].md` avec :
- Question, mode, participants
- Réponses de chaque round
- Décision finale
- Artefacts listés

Puis : `memory/YYYY-MM-DD.md` + DECISIONS.md + git push.

## Règles Générales

- **Budget temps** : Debate 5 min, PRD/Engineering 15 min, Analysis 10 min, Synthesis 5 min.
- **Timeout** : 90s par agent par round. Si timeout → avancer sans.
- **Max rounds** : 3 (configurable dans le brief, jamais plus de 3).
- **Convergence** : tous "agree" + 0 blocking → skip remaining rounds.
- **Papa tranche** toujours en dernier.
- **Sessions persistantes** : spawn round 1, `sessions_send` rounds suivants.
- **Logging** : `memory/shared/councils/council-{id}.json` pour chaque conseil.
- **Archivage** : `conseils/YYYY-MM-DD-[sujet].md` obligatoire.
- **Git** : push après chaque conseil.
