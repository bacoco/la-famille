use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// AIEOS identity format — generated from SOUL.md.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AieosIdentity {
    pub version: String,
    pub agent_id: String,
    pub psychology: Psychology,
    pub capabilities: Capabilities,
    pub linguistics: Linguistics,
    pub security: Security,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Psychology {
    pub moral_compass: Vec<String>,
    pub personality_traits: Vec<String>,
    pub emotional_baseline: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Capabilities {
    pub skills: Vec<String>,
    pub tool_access: Vec<String>,
    pub limitations: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Linguistics {
    pub style: String,
    pub formality: String,
    pub language: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Security {
    pub trust_level: String,
    pub api_access: Vec<String>,
}

/// Convert a SOUL.md content string to an AIEOS identity.
pub fn soul_to_aieos(agent_id: &str, soul_content: &str) -> AieosIdentity {
    let sections = parse_soul_sections(soul_content);

    AieosIdentity {
        version: "1.0".into(),
        agent_id: agent_id.into(),
        psychology: Psychology {
            moral_compass: extract_list(sections.get("core truths").unwrap_or(&String::new())),
            personality_traits: extract_list(sections.get("vibe").or(sections.get("personality")).unwrap_or(&String::new())),
            emotional_baseline: "stable".into(),
        },
        capabilities: Capabilities {
            skills: extract_list(sections.get("role").or(sections.get("rôle")).unwrap_or(&String::new())),
            tool_access: extract_list(sections.get("tools").unwrap_or(&String::new())),
            limitations: extract_list(sections.get("limits").or(sections.get("limites")).unwrap_or(&String::new())),
        },
        linguistics: Linguistics {
            style: sections.get("vibe").or(sections.get("personality")).cloned().unwrap_or_default().lines().next().unwrap_or("neutral").to_string(),
            formality: "moderate".into(),
            language: "fr".into(),
        },
        security: Security {
            trust_level: "high".into(),
            api_access: extract_list(sections.get("security").or(sections.get("sécurité")).unwrap_or(&String::new())),
        },
    }
}

/// Parse SOUL.md into sections keyed by heading (lowercased).
fn parse_soul_sections(content: &str) -> HashMap<String, String> {
    let mut sections = HashMap::new();
    let mut current_heading = String::new();
    let mut current_content = String::new();

    for line in content.lines() {
        if line.starts_with("## ") || line.starts_with("# ") {
            // Save previous section
            if !current_heading.is_empty() {
                sections.insert(current_heading.clone(), current_content.trim().to_string());
            }
            current_heading = line.trim_start_matches('#').trim().to_lowercase();
            current_content = String::new();
        } else {
            current_content.push_str(line);
            current_content.push('\n');
        }
    }

    // Save last section
    if !current_heading.is_empty() {
        sections.insert(current_heading, current_content.trim().to_string());
    }

    sections
}

/// Extract bullet points from a section into a list of strings.
fn extract_list(content: &str) -> Vec<String> {
    content
        .lines()
        .filter(|l| l.starts_with("- ") || l.starts_with("* "))
        .map(|l| l.trim_start_matches("- ").trim_start_matches("* ").trim().to_string())
        .filter(|l| !l.is_empty())
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_soul() {
        let soul = r#"# Maman 🦊

## Core Truths

- I am the matriarch
- Family comes first
- Wisdom guides decisions

## Role

- Orchestrate family operations
- Run COUNCIL sessions

## Vibe

Warm, decisive, protective.

## Limits

- Never act alone on major decisions
- Always consult the COUNCIL
"#;

        let identity = soul_to_aieos("maman", soul);
        assert_eq!(identity.agent_id, "maman");
        assert_eq!(identity.psychology.moral_compass.len(), 3);
        assert_eq!(identity.capabilities.skills.len(), 2);
        assert_eq!(identity.capabilities.limitations.len(), 2);
    }
}
