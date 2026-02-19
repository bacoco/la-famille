# Data - Favorites Knowledge Base

## Files

- **bookmarks.json** — Main registry of all saved favorites
- **collections.json** — Thematic groupings (categories)
- **search-index.json** — Text index for NLP search (title + summary + tags + keywords)

## Rules

- **Append only** — Never delete entries from bookmarks.json (mark as archived instead)
- **IDs** — Format: `YYYY-MM-DD_fav_<6chars>` (date + random suffix)
- **Git tracked** — Every change is committed automatically
- **Encoding** — UTF-8, no BOM
