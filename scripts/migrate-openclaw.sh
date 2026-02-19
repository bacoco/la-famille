#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
SOURCE="${1:-/home/baconnier/dev/openclaw-families}"

echo "=== Migrating from $SOURCE to $ROOT_DIR ==="

# Step 1: Copy family files
echo "--- Copying family files ---"
for agent in maman henry sage nova blaise; do
    echo "  Copying $agent..."
    for f in SOUL.md IDENTITY.md AGENTS.md; do
        src="$SOURCE/families/openclaw/$agent/$f"
        [ -f "$src" ] && cp "$src" "$ROOT_DIR/families/openclaw/$agent/"
    done
done

# Step 2: Copy shared files
echo "--- Copying shared family files ---"
for f in LIFECYCLE.md REGISTRY.md; do
    src="$SOURCE/families/openclaw/$f"
    [ -f "$src" ] && cp "$src" "$ROOT_DIR/families/openclaw/"
done

# Step 3: Copy COUNCIL.md
[ -f "$SOURCE/families/openclaw/maman/COUNCIL.md" ] && \
    cp "$SOURCE/families/openclaw/maman/COUNCIL.md" "$ROOT_DIR/families/openclaw/maman/"

# Step 4: Convert SOUL.md to AIEOS for each agent
echo "--- Converting SOUL.md to AIEOS ---"
for agent in maman henry sage nova blaise; do
    soul="$ROOT_DIR/families/openclaw/$agent/SOUL.md"
    if [ -f "$soul" ]; then
        echo "  Converting $agent..."
        python3 "$ROOT_DIR/scripts/convert-soul-to-aieos.py" "$soul"
    fi
done

# Step 5: Import claims.jsonl into SQLite (if exists)
claims="$SOURCE/families/openclaw/collective_memory/claims.jsonl"
if [ -f "$claims" ]; then
    echo "--- Importing claims ---"
    python3 -c "
import json, sqlite3, sys
db = sqlite3.connect('$ROOT_DIR/context-bus/openclaw.db')
db.execute('PRAGMA journal_mode=WAL')
with open('$claims') as f:
    for line in f:
        c = json.loads(line.strip())
        db.execute(
            'INSERT OR IGNORE INTO claims (claim, evidence, confidence, claimed_by) VALUES (?, ?, ?, ?)',
            (c.get('claim',''), c.get('evidence',''), c.get('confidence', 1.0), c.get('agent','unknown'))
        )
db.commit()
db.close()
print('  Claims imported.')
"
fi

echo "=== Migration complete ==="
