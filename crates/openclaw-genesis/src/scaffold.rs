use std::path::{Path, PathBuf};

use crate::{AgentSpec, FamilySpec, GenesisError};

/// Scaffold the directory structure for a new family.
pub fn scaffold_family(
    families_dir: &Path,
    _template_dir: &Path,
    spec: &FamilySpec,
) -> Result<PathBuf, GenesisError> {
    let family_dir = families_dir.join(&spec.name);

    if family_dir.exists() {
        return Err(GenesisError::AlreadyExists(spec.name.clone()));
    }

    // Create family directory
    std::fs::create_dir_all(&family_dir)?;

    // Create agent directories
    for agent in &spec.agents {
        let agent_dir = family_dir.join(&agent.name);
        std::fs::create_dir_all(agent_dir.join("memory"))?;

        // Create minimal SOUL.md
        let soul = format!(
            "# {} {}\n\n## Core Truths\n\n- I am {}, {} of the {} family\n\n## Role\n\n{}\n\n## Vibe\n\nProfessional and focused.\n\n## Limits\n\n- I stay within my role boundaries\n- I defer to the orchestrator on family decisions\n",
            agent.emoji.as_deref().unwrap_or(""),
            agent.name,
            agent.name,
            agent.role,
            spec.display_name,
            agent.role,
        );
        std::fs::write(agent_dir.join("SOUL.md"), soul)?;

        // Create minimal IDENTITY.md
        let identity = format!(
            "# {}\n\n**Role**: {}\n**Provider**: {}\n**Model**: {}\n**Family**: {}\n",
            agent.name, agent.role, agent.provider, agent.model, spec.display_name,
        );
        std::fs::write(agent_dir.join("IDENTITY.md"), identity)?;
    }

    // Create shared directories
    std::fs::create_dir_all(family_dir.join("memory/shared/councils"))?;
    std::fs::create_dir_all(family_dir.join("collective_memory"))?;
    std::fs::create_dir_all(family_dir.join("cemetery"))?;

    // Create family.toml
    let family_toml = generate_family_toml(spec)?;
    std::fs::write(family_dir.join("family.toml"), family_toml)?;

    tracing::info!("scaffolded family '{}' at {}", spec.name, family_dir.display());
    Ok(family_dir)
}

/// Generate family.toml content from a spec.
fn generate_family_toml(spec: &FamilySpec) -> Result<String, GenesisError> {
    let mut toml = format!(
        r#"[family]
name = "{}"
display_name = "{}"
emoji = "{}"
description = "{}"
version = "2.0.0"

[family.council]
protocol = "COUNCIL.md"
quorum = {}
timeout_seconds = 90

"#,
        spec.name,
        spec.display_name,
        spec.emoji,
        spec.description,
        (spec.agents.len() / 2) + 1, // majority quorum
    );

    for agent in &spec.agents {
        toml.push_str(&format!(
            r#"[[agents]]
name = "{}"
role = "{}"
provider = "{}"
model = "{}"
port = {}
"#,
            agent.name, agent.role, agent.provider, agent.model, agent.port,
        ));
        if let Some(emoji) = &agent.emoji {
            toml.push_str(&format!("emoji = \"{emoji}\"\n"));
        }
        toml.push('\n');
    }

    Ok(toml)
}

/// Generate agent.toml for a specific agent within a family.
pub fn generate_agent_toml(
    family_dir: &Path,
    agent: &AgentSpec,
    spec: &FamilySpec,
) -> Result<(), GenesisError> {
    let api_key_env = match agent.provider.as_str() {
        "anthropic" => "ANTHROPIC_API_KEY",
        "openai" => "OPENAI_API_KEY",
        "google" => "GOOGLE_API_KEY",
        "openrouter" => "OPENROUTER_API_KEY",
        _ => "API_KEY",
    };

    let mut toml = format!(
        r#"[identity]
format = "aieos"
path = "identity.aieos.json"
soul_md = "SOUL.md"

[provider]
name = "{}"
model = "{}"
api_key_env = "{}"

[memory]
backend = "sqlite"
database = "../../context-bus/{}.db"
namespace = "agent:{}"
auto_save = true

[gateway]
host = "0.0.0.0"
port = {}
"#,
        agent.provider, agent.model, api_key_env, spec.name, agent.name, agent.port,
    );

    // Add context tools for all agents
    toml.push_str(
        r#"
[[tools.custom]]
name = "context_query"
crate = "openclaw-context-bus"
"#,
    );

    let agent_dir = family_dir.join(&agent.name);
    std::fs::write(agent_dir.join("agent.toml"), toml)?;
    Ok(())
}

/// Rollback a failed scaffold by removing the family directory.
pub fn rollback(family_dir: &Path) -> Result<(), std::io::Error> {
    if family_dir.exists() {
        std::fs::remove_dir_all(family_dir)?;
        tracing::info!("rolled back scaffold at {}", family_dir.display());
    }
    Ok(())
}
