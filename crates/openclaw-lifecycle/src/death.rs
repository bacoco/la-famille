use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// A death certificate for a decommissioned agent.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeathCertificate {
    pub agent: String,
    pub family: String,
    pub cause: DeathCause,
    pub last_words: Option<String>,
    pub memory_archived: bool,
    pub cemetery_path: String,
    pub time_of_death: DateTime<Utc>,
    pub born_at: Option<DateTime<Utc>>,
}

/// Why an agent was decommissioned.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DeathCause {
    /// Manually decommissioned by operator
    Manual,
    /// Replaced by a newer version
    Superseded { replacement: String },
    /// Unresponsive for too long
    Unresponsive { missed_heartbeats: usize },
    /// Family dissolved
    FamilyDissolved,
    /// Resource constraints
    ResourceLimit,
}

/// Archive an agent's state to the cemetery.
pub fn archive_agent(
    agent: &str,
    family: &str,
    cause: DeathCause,
    cemetery_base: &std::path::Path,
) -> Result<DeathCertificate, std::io::Error> {
    let cemetery_path = cemetery_base.join(agent);
    std::fs::create_dir_all(&cemetery_path)?;

    let cert = DeathCertificate {
        agent: agent.to_string(),
        family: family.to_string(),
        cause,
        last_words: None,
        memory_archived: false, // TODO: archive memory from context bus
        cemetery_path: cemetery_path.display().to_string(),
        time_of_death: Utc::now(),
        born_at: None,
    };

    // Write death certificate
    let cert_json = serde_json::to_string_pretty(&cert).unwrap_or_default();
    std::fs::write(cemetery_path.join("death_certificate.json"), cert_json)?;

    Ok(cert)
}
