#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "Building agent identities..."
find "$ROOT/families" -name "SOUL.md" | while read soul; do
    echo "  Converting $(dirname "$soul" | xargs basename)..."
    python3 "$ROOT/scripts/convert-soul-to-aieos.py" "$soul"
done
echo "Done."
