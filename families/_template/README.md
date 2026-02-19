# Family Template

Use this template to create a new agent family.

## Quick Start

1. Copy this directory: `cp -r _template families/my-family`
2. Rename `family.json.template` to `family.json` and fill in the values
3. Rename `agent/` to your agent name (e.g., `my-agent/`)
4. Fill in the SOUL.md and IDENTITY.md templates
5. Create `data/` directory for your family's knowledge base
6. Create `docs/` directory for published output
7. Add your family to `registry.json` at the repo root
8. Create scripts in `my-agent/scripts/` for automation

## Required Files

```
my-family/
├── family.json              # Family manifest (required)
├── my-agent/                # At least one agent (required)
│   ├── SOUL.md              # Who the agent is (required)
│   ├── IDENTITY.md          # Quick reference (required)
│   ├── MEMORY.md            # Long-term memory
│   ├── USER.md              # About Papa
│   ├── AGENTS.md            # Workspace rules
│   ├── TOOLS.md             # Available tools
│   ├── HEARTBEAT.md         # Periodic tasks
│   └── scripts/             # Automation scripts
├── data/                    # Family knowledge base
└── docs/                    # Published output (GitHub Pages)
```

## family.json Fields

See `family.schema.json` at the repo root for the full schema.
