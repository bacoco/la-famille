# Gemini OAuth Token Refresh via agent-browser

## Quand l'utiliser
Le token OAuth Gemini CLI expire toutes les ~1h.
Quand sage retourne "Gemini API key not found" ou le token est expiré.

## Prerequis
- `agent-browser` installé (`npm install -g agent-browser`)
- `gemini` CLI installé (`npm install -g @google/gemini-cli`)
- Compte Google avec Cloud Code Assist API activee

## Procedure automatique

```bash
# 1. Lancer gemini CLI qui genere l'URL OAuth
source ~/.nvm/nvm.sh
gemini -p "hello" 2>&1 &
GEMINI_PID=$!

# 2. Attendre l'URL OAuth dans les logs
# 3. Ouvrir l'URL avec agent-browser
# 4. S'authentifier avec le compte Google
# 5. Le token est sauvegarde dans ~/.gemini/oauth_creds.json
# 6. Copier vers la-famille/families/openclaw/sage/.gemini/

# Copie du token refreshe
cp ~/.gemini/oauth_creds.json /home/baconnier/dev/la-famille/families/openclaw/sage/.gemini/oauth_creds.json

# Restart sage (pas de rebuild)
cd /home/baconnier/dev/la-famille && docker compose up -d sage
```

## Procedure manuelle (fallback)
1. Sur une machine avec browser, aller sur https://accounts.google.com/o/oauth2/auth?...
2. Se connecter avec le compte Google
3. Copier le token dans oauth_creds.json
4. Restart sage
