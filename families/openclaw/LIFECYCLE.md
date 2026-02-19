# LIFECYCLE.md — Cycles de Vie des Agents 🔄

> Inspiré des articles deeplearning.fr sur les systèmes multi-agents.
> Implémenté le 5 février 2026.

## Principes Fondamentaux

1. **Les agents doivent pouvoir mourir** — L'immortalité fige le système
2. **L'héritage est sélectif** — Traces (faits) oui, directives (règles) non
3. **La mémoire doit vieillir** — Decay contrôlé, sauf invariants
4. **Personne n'est immortel** — Même le niveau méta (Maman) peut tomber

---

## Phases de Vie

| Phase | Droits | Durée typique | Caractéristiques |
|-------|--------|---------------|------------------|
| 🐣 **Jeune** | Exploration, sandbox, pas de write collectif | 0-7 jours | Tolérance à l'erreur élevée |
| 🦁 **Adulte** | Full access, décisions, write mémoire | 7+ jours | Productif, évalué |
| 🦉 **Senior** | Lecture forte, write contrôlé, conseil | Variable | Expertise, mode Oracle possible |
| ⚰️ **Décédé** | Read-only archive | Permanent | LEGACY.md extractible |

---

## Gouvernance

| Rôle | Qui | Pouvoir |
|------|-----|---------|
| **Autorité finale** | 👨 Papa (Loic) | Vie/mort, arbitrage, veto, budget |
| **Gouvernance opérationnelle** | 🦊 Maman | Orchestration, coordination, recommandations |
| **Régent (backup)** | 🦉 Henry → 🦎 Sage | Si Maman ne répond pas au heartbeat |

### Règle d'or
> **Papa décide, Maman exécute.** Aucun agent n'a le pouvoir de tuer un autre sans validation humaine.

---

## Structures de Données

### Journal d'Agent (`journal/YYYY-MM-DD.jsonl`)

Chaque agent log ses décisions importantes :

```json
{"ts": "2026-02-05T20:00:00Z", "event": "task_complete", "task": "conseil gas-town", "result": "success", "tokens": 4100, "source": "papa"}
{"ts": "2026-02-05T20:10:00Z", "event": "decision", "decision": "recommander worktree skill", "rationale": "consensus famille", "confidence": 0.9}
```

**Champs obligatoires :**
- `ts` : ISO timestamp
- `event` : task_complete | decision | error | learning | handoff

**Champs optionnels :**
- `task`, `result`, `rationale`, `confidence`, `tokens`, `source`, `links`

### Mémoire Collective (`collective_memory/claims.jsonl`)

Base de connaissance partagée, consultable mais non prescriptive :

```json
{"id": "claim-001", "ts": "2026-02-05", "claim": "Z.AI proxy fonctionne avec auth:token", "evidence": ["henry/MEMORY.md#L42"], "provenance": ["henry", "maman"], "confidence": 0.95, "tags": ["infra", "provider"]}
```

**Règles :**
- Append-only (pas d'édition, on ajoute des corrections)
- Chaque claim a une provenance (qui l'a validé)
- Confidence décroît avec le temps sauf si re-validé

### LEGACY.md (à la mort)

Créé par le "death handshake" :

```markdown
# LEGACY.md — [Nom] [Emoji]

## Résumé
Qui était cet agent, son rôle, sa durée de vie.

## Traces Utiles (à conserver)
- [Fait 1]
- [Fait 2]

## Échecs Informatifs
- [Ce qui n'a pas marché et pourquoi]

## Directives (NE PAS HÉRITER AVEUGLÉMENT)
- [Règle 1] — contexte: [pourquoi elle existait]

## Artefacts
- `workspace/fichier1.md`
- `workspace/fichier2.json`
```

---

## Protocoles

### Protocole de Mort

1. **Décision** — Papa ordonne ou Maman recommande (avec justification)
2. **Death Handshake** — L'agent (ou Maman) crée `LEGACY.md`
3. **Archivage** — Workspace déplacé vers `cemetery/[nom]/`
4. **Mise à jour** — REGISTRY.md mis à jour (status: deceased, link legacy)
5. **Héritage** — Traces pertinentes extraites vers `collective_memory/`

### Protocole de Régence

Si Maman ne répond pas après 3 heartbeats (1h30) :

1. **Henry** prend le relais de l'orchestration
2. **Notification** à Papa via tous les canaux
3. **Mode dégradé** — Pas de conseils de famille, tâches individuelles uniquement
4. **Diagnostic** — Henry check les logs, tente un restart

### Protocole d'Exhumation

Pour consulter un agent décédé :

1. Lire `cemetery/[nom]/LEGACY.md` (résumé)
2. Si besoin de détails : `cemetery/[nom]/workspace/` (traces brutes)
3. **NE JAMAIS** copier-coller ses prompts système comme directives

---

## Métriques (North Star)

| Métrique | Cible | Comment mesurer |
|----------|-------|-----------------|
| **Fiabilité** | >80% tâches acceptées sans retouche | Feedback Papa |
| **Traçabilité** | 100% décisions avec provenance | Audit journal/ |
| **Coût** | Stable ou décroissant | session_status |
| **Temps de réponse conseil** | <3 min pour 4 agents | Timestamps |

---

## Matrice RACI

| Activité | R (Exécute) | A (Décide) | C (Consulté) | I (Informé) |
|----------|-------------|------------|--------------|-------------|
| Création nouvel agent | 🌟 Nova | 🦊 Maman | 👨 Papa, 🧮 Blaise | 🦉 Henry, 🦎 Sage |
| Promotion Jeune → Adulte | 🦊 Maman | 👨 Papa | 🧮 Blaise, 🌟 Nova | 🦉 Henry, 🦎 Sage |
| Passage en Senior | 🦊 Maman | 👨 Papa | 🧮 Blaise, 🌟 Nova | 🦉 Henry, 🦎 Sage |
| Décision de mort | 🦊 Maman | 👨 Papa | Tous | — |
| Exécution mort (LEGACY) | 🌟 Nova | 🦊 Maman | 🧮 Blaise | Tous |
| Écriture mémoire collective | 🦊 Maman | 🦊 Maman | 🌟 Nova, 🧮 Blaise | Tous |
| Validation claims mémoire | 🧮 Blaise | 🦊 Maman | 🌟 Nova | Tous |
| Conseil de famille | 🦊 Maman | 👨 Papa | Tous | — |
| Tâche standard | 🌟 Nova | 🦊 Maman | 🧮 Blaise | Tous |
| Urgence sécurité | 🦉 Henry | 👨 Papa | Tous | — |

---

## Anti-patterns (à éviter)

- ❌ **Agent immortel** — Fige le système
- ❌ **Héritage total** — Embaume les erreurs
- ❌ **Decay aveugle** — Oublie les invariants critiques
- ❌ **Méta-agent avec pouvoir de mort** — Capture possible
- ❌ **Trop de phases** — Sur-ingénierie
- ❌ **Gouvernance distribuée complète** — Paralysie

---

*Document créé le 5 février 2026 par le Conseil de Famille*
*Sources : deeplearning.fr, analyses Henry/Sage/Nova/Blaise*
