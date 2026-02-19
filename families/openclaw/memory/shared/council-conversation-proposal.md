# Architecture de Conversation Multi-Agents pour OpenClaw

**Auteur:** Henry (subagent)
**Date:** 2026-02-08
**Contexte:** Implémenter de vraies discussions inter-agents (multi-tours) au sein du Conseil de Famille

---

## Proposition Technique

### Modèle Architectural : "Conversation as Shared State with Turn Coordinator"

Plutôt que d'essayer de transformer `sessions_spawn` (fire-and-forget) en système bidirectionnel, je propose d'utiliser **l'état partagé dans `memory/shared/` comme vérité source**. La conversation n'est pas un flux de messages mais un fichier incrémental que tous les agents lisent et mettent à jour.

#### Le Fichier d'État de Conversation

**Emplacement :** `/home/node/openclaw/memory/shared/council-active-conversation.md`

```markdown
# Conversation Active : [Sujet]

## Métadonnées
- Conversation ID: [UUID]
- Mode: [debate | prd | analysis | review | synthesis]
- Phase courante: [COLLECT | CHALLENGE | RESOLVE | SYNTHESIZE]
- Tour: [numéro]
- Créé: [timestamp]
- Dernière mise à jour: [timestamp]
- Timeout: [timestamp ISO 8601]
- Status: [ACTIVE | CONVERGED | TIMEOUT]

## Brief (immuable)
[Le brief complet de Maman, figé]

## Participants
- 🦉 Henry (agent:henry): [status: WAITING | RESPONDED | DONE]
- 🦎 Sage (agent:sage): [status: WAITING | RESPONDED | DONE]
- 🌟 Nova (agent:nova): [status: WAITING | RESPONDED | DONE]
- 🧮 Blaise (agent:blaise): [status: WAITING | RESPONDED | DONE]

## Réponses - Phase [NOM]
### 🦉 Henry
[Tour N]: [contenu]
[Tour N+1]: [contenu]

### 🦎 Sage
[Tour N]: [contenu]

...

## État de Convergence
- Taux de réponse: [X/4]
- Convergence détectée: [oui/non]
- Blocages identifiés: [liste]

## Phase Suivante
- Condition de passage: [tous répondus OU timeout]
- Actions requises: [liste]
```

---

### Orchestration : "Heartbeat-Driven Turn Coordinator"

Le problème clé est : **qui déclenche le tour suivant ?** Sans webhook ni callback, on utilise un **coordinateur passif basé sur le heartbeat**.

#### Le Coordinateur : Extension du système de heartbeat existant

**Nouveau fichier :** `/home/node/openclaw/maman/HEARTBEAT-COUNCIL.md`

```markdown
# HEARTBEAT-COUNCIL.md

À chaque heartbeat (toutes les 30 min):

1. Vérifier si une conversation est ACTIVE dans `memory/shared/council-active-conversation.md`
2. Si ACTIVE:
   - Lire le fichier d'état
   - Vérifier si tous les participants ont répondu (status === RESPONDED || DONE)
   - Vérifier si timeout dépassé
   - Si条件 réunie:
     a. Passer à la phase suivante (ex: COLLECT → CHALLENGE)
     b. Reset les status des participants à WAITING
     c. Notifier Maman via sessions_send qu'elle doit coordonner la phase
     d. Maman spawn les enfants avec le nouveau prompt (incluant les réponses précédentes)
3. Si CONVERGED ou TIMEOUT:
   - Marquer la conversation comme terminée
   - Déclencher SYNTHESIZE (Maman fait la synthèse)
   - Archiver dans `conseils/YYYY-MM-DD-[sujet].md`
   - Supprimer/renommer le fichier d'état actif
```

#### Avantages de cette approche :

1. **Aucune boucle infinie** : Le heartbeat est naturellement borné (toutes les 30 min)
2. **Résilient** : Si un enfant crash, le timeout avance quand même
3. **État partagé** : Tous les agents voient la même vérité
4. **Débuggable** : On peut inspecter le fichier d'état à tout moment
5. **Non bloquant** : Pas de polling actif, juste une vérification passive

---

### Flux de Discussion Multi-Tours

#### Protocol d'écriture par les enfants

Quand un enfant est spawné pour répondre :

1. **Lire l'état actuel** : `memory/shared/council-active-conversation.md`
2. **Identifier sa phase** : Ex: "Phase COLLECT, Tour 1"
3. **Ajouter sa réponse** à sa section dans le fichier (pas de remplacement, append)
4. **Marquer son status** : `WAITING → RESPONDED`
5. **Lire les autres réponses** : Maintenant qu'il a répondu, il VOIT les réponses des autres
6. **Si la phase est CHALLENGE ou RESOLVE** : Il peut maintenant:
   - Lire les réponses précédentes des autres
   - Critiquer/challenger spécifiquement
   - Réfuter des points précis (avec citations)

#### Transitions de phase

```
COLLECT (Tour 1)
  ↓ [Tous RESPONDED ou timeout]
CHALLENGE (Tour 2) - Maintenant tous voient les réponses du Tour 1
  ↓ [Tous RESPONDED ou timeout]
RESOLVE (Tour 3) - Réponses ciblées aux challenges
  ↓ [Tous RESPONDED ou timeout]
SYNTHESIZE - Maman synthétise et recommande
```

---

### Mise en Œuvre Technique

#### Nouveau fichier : `/home/node/openclaw/skills/council-conversation/protocol.md`

```markdown
# Protocol de Conversation Inter-Agents

## Schéma de Fichier d'État (JSON dans .md)

```json
<!--council-state
{
  "conversationId": "uuid-v4",
  "mode": "debate",
  "currentPhase": "COLLECT",
  "tour": 1,
  "createdAt": "2026-02-08T20:00:00Z",
  "updatedAt": "2026-02-08T20:15:00Z",
  "timeoutAt": "2026-02-08T21:00:00Z",
  "status": "ACTIVE",
  "participants": {
    "henry": {"status": "RESPONDED", "lastAction": "2026-02-08T20:10:00Z"},
    "sage": {"status": "WAITING", "lastAction": null},
    "nova": {"status": "RESPONDED", "lastAction": "2026-02-08T20:12:00Z"},
    "blaise": {"status": "WAITING", "lastAction": null}
  },
  "convergence": {
    "responseRate": 0.5,
    "hasConsensus": false,
    "blockingIssues": []
  }
}
-->
```

## Actions des Agents

### Quand un enfant est invoqué pour une phase :

1. **Parse le JSON** du fichier d'état
2. **Vérifie son statut** :
   - Si `RESPONDED` ou `DONE` → ne rien faire (déjà contribué)
   - Si `WAITING` → procéder
3. **Lit le contexte** :
   - Le brief (immuable)
   - Les réponses des tours précédents (si tour > 1)
   - Les réponses des autres agents (si phase CHALLENGE ou RESOLVE)
4. **Génère sa réponse** selon le mode :
   - **COLLECT** : Sa position initiale (sans voir les autres)
   - **CHALLENGE** : Critiques ciblées des réponses COLLECT
   - **RESOLVE** : Réponses aux challenges
5. **Écrit sa réponse** :
   - Ajoute à sa section dans le fichier markdown
   - Met à jour le JSON : `status → RESPONDED`, `lastAction → now`
6. **Sauvegarde** et termine

### Maman (Coordinateur)

À chaque heartbeat :
1. Lit le fichier d'état
2. Vérifie si **tous** les participants sont `RESPONDED` OU timeout dépassé
3. Si oui :
   - Passe à la phase suivante
   - Reset les status à `WAITING`
   - Incrémente le tour
   - Spawn les enfants avec le nouveau prompt incluant tout le contexte
4. Si `status === CONVERGED` → passe à SYNTHESIZE

---

## Exemple Concret : Débat sur "Faut-il créer un bot météo ?"

### Tour 1 - COLLECT (personne ne voit les autres)

**Maman crée le fichier d'état** et spawn les enfants :

```
sessions_spawn("henry", "Lire memory/shared/council-active-conversation.md. Phase COLLECT. Donner ta position sur le bot météo. NE PAS lire les réponses des autres. Écrire ta réponse, puis marquer ton status comme RESPONDED dans le JSON.")
```

Résultat : Chaque enfant écrit sa section, se marque `RESPONDED`. Personne n'a vu les autres.

### Heartbeat détecte : tous RESPONDED

**Maman (via heartbeat)** voit que `henry.status === RESPONDED`, `sage.status === RESPONDED`, etc.

→ Transition : `COLLECT → CHALLENGE`, `tour = 2`, reset status à `WAITING`

→ Maman spawn les enfants avec le nouveau prompt :

```
sessions_spawn("henry", "Lire memory/shared/council-active-conversation.md. Phase CHALLENGE. Tu vois maintenant les réponses de tout le monde (Tour 1). Critique-les selon la checklist COUNCIL.md. Cite précisément. Écrire, puis marquer RESPONDED.")
```

### Tour 2 - CHALLENGE (maintenant ils se voient)

Chaque enfant :
1. Lit le fichier
2. VOIT les réponses du Tour 1 de Henry, Sage, Nova, Blaise
3. Critique, challenge, réfute
4. Écrit sa réponse (append à sa section)
5. Se marque `RESPONDED`

### Heartbeat détecte : tous RESPONDED

→ Transition : `CHALLENGE → RESOLVE`, `tour = 3`

... et ainsi de suite.

---

## Gestion des Boucles Infinies et Edge Cases

### 1. Timeout par phase
- Chaque phase a un `timeoutAt` (ex: 1 heure après création)
- Si dépassé, on passe à la phase suivante même si tout le monde n'a pas répondu
- Maman note les absents dans la synthèse

### 2. Convergence anticipée
- Si tous les agents marquent `status → AGREED` (champ optionnel)
- On peut skip les tours restants et passer à SYNTHESIZE
- Seulement pour les modes debate/analysis

### 3. Agent crash / timeout
- Sessions_spawn a un timeout technique (ex: 120s)
- Si un agent ne répond pas, son status reste `WAITING`
- Au heartbeat suivant, si timeout dépassé, on avance sans lui
- Maman note dans l'archive : "Sage: NO RESPONSE (timeout)"

### 4. Conflit d'écriture
- Les agents écrivent dans des sections disjointes (Henry dans ### 🦉 Henry, etc.)
- Le JSON est encapsulé dans un bloc `<!--council-state ... -->` avec lock fichier
- Si conflit détecté : dernier écrivain gagne, mais on garde un historique des versions

---

## Avantages vs Solutions Alternatives

| Approche | Avantages | Inconvénients |
|----------|-----------|---------------|
| **Heartbeat + Shared State (proposé)** | Résilient, debuggable, pas de boucle infinie, utilise l'existant | Latence max 30 min entre tours |
| Polling actif (toutes les 30s) | Tours plus rapides | Gourmand en ressources, boucle infinie si bug |
| Webhooks (non-disponible) | Temps réel | Pas implémenté dans OpenClaw |
| Cron jobs par phase | Précis | Complexifié, pas de coordination entre phases |

---

## Implémentation Recommandée

### Phase 1 - POC (1-2 jours)
1. Créer le schéma de fichier d'état
2. Implémenter le heartbeat coordinator dans Maman
3. Tester un débat simple en 2 tours (COLLECT → SYNTHESIZE)
4. Valider que les enfants écrivent correctement leur status

### Phase 2 - Multi-phase (3-5 jours)
1. Implémenter les transitions complètes (COLLECT → CHALLENGE → RESOLVE → SYNTHESIZE)
2. Ajouter la gestion de timeout
3. Tester avec un sujet complexe

### Phase 3 - Optimisations (optionnel)
1. Réduire la latence heartbeat (ex: 5 min pendant un conseil actif)
2. Ajouter la détection de convergence anticipée
3. Implémenter le lock fichier pour le JSON

---

## Conclusion

Cette architecture transforme le problème du "fire-and-forget" en avantage : **la conversation devient un artefact persistent** que tous les agents peuvent lire et enrichir incrémentalement. Le heartbeat agit comme un coordinateur passif qui avance la machine d'état sans risquer de boucles infinies.

Le fichier `memory/shared/council-active-conversation.md` devient à la fois :
1. **L'état de la conversation** (JSON)
2. **Le transcript complet** (markdown)
3. **Le contexte pour les prochains tours** (historique)

C'est délibérément simple, résilient, et 100% compatible avec les contraintes OpenClaw actuelles.
