pub mod compose_gen;
pub mod identity_converter;
pub mod scaffold;

/// The Genesis factory creates new agent families from specifications.
pub struct GenesisFactory {
    /// Base path for families directory
    families_dir: std::path::PathBuf,
    /// Template directory path
    template_dir: std::path::PathBuf,
}

impl GenesisFactory {
    pub fn new(families_dir: impl Into<std::path::PathBuf>) -> Self {
        let families_dir = families_dir.into();
        let template_dir = families_dir.join("_template");
        Self {
            families_dir,
            template_dir,
        }
    }

    /// Create a new family from a specification.
    pub async fn create_family(
        &self,
        spec: &FamilySpec,
    ) -> Result<CreatedFamily, GenesisError> {
        // Step 1: Scaffold directory structure
        let family_dir = scaffold::scaffold_family(&self.families_dir, &self.template_dir, spec)?;

        // Step 2: Generate agent.toml for each agent
        for agent in &spec.agents {
            scaffold::generate_agent_toml(&family_dir, agent, spec)?;
        }

        // Step 3: Generate docker-compose service entries
        let compose_entries = compose_gen::generate_compose_services(spec);

        Ok(CreatedFamily {
            name: spec.name.clone(),
            path: family_dir,
            agents: spec.agents.iter().map(|a| a.name.clone()).collect(),
            compose_yaml: compose_entries,
        })
    }
}

/// Specification for a new family.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct FamilySpec {
    pub name: String,
    pub display_name: String,
    pub emoji: String,
    pub description: String,
    pub agents: Vec<AgentSpec>,
}

/// Specification for a new agent.
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct AgentSpec {
    pub name: String,
    pub role: String,
    pub provider: String,
    pub model: String,
    pub port: u16,
    pub emoji: Option<String>,
    pub temperature: Option<f64>,
}

/// Result of creating a new family.
#[derive(Debug)]
pub struct CreatedFamily {
    pub name: String,
    pub path: std::path::PathBuf,
    pub agents: Vec<String>,
    pub compose_yaml: String,
}

#[derive(Debug, thiserror::Error)]
pub enum GenesisError {
    #[error("family already exists: {0}")]
    AlreadyExists(String),

    #[error("template not found at {0}")]
    TemplateNotFound(String),

    #[error("io error: {0}")]
    Io(#[from] std::io::Error),

    #[error("toml serialization error: {0}")]
    Toml(#[from] toml::ser::Error),
}
