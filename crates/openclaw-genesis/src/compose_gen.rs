use crate::FamilySpec;

/// Generate docker-compose service entries for a family.
pub fn generate_compose_services(spec: &FamilySpec) -> String {
    let mut yaml = String::new();

    for agent in &spec.agents {
        let api_key_env = match agent.provider.as_str() {
            "anthropic" => "ANTHROPIC_API_KEY",
            "openai" => "OPENAI_API_KEY",
            "google" => "GOOGLE_API_KEY",
            "openrouter" => "OPENROUTER_API_KEY",
            _ => "API_KEY",
        };

        yaml.push_str(&format!(
            r#"  {name}:
    <<: *zc
    ports: ["{port}:{port}"]
    environment:
      {key}: "${{{key}}}"
      RUST_LOG: info
    command: [zeroclaw, gateway, --config, /app/families/{family}/{name}/agent.toml]

"#,
            name = agent.name,
            port = agent.port,
            key = api_key_env,
            family = spec.name,
        ));
    }

    yaml
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::AgentSpec;

    #[test]
    fn test_compose_generation() {
        let spec = FamilySpec {
            name: "test".into(),
            display_name: "Test Family".into(),
            emoji: "🧪".into(),
            description: "A test family".into(),
            agents: vec![AgentSpec {
                name: "alpha".into(),
                role: "tester".into(),
                provider: "anthropic".into(),
                model: "claude-opus-4".into(),
                port: 3201,
                emoji: Some("🔬".into()),
                temperature: None,
            }],
        };

        let yaml = generate_compose_services(&spec);
        assert!(yaml.contains("alpha:"));
        assert!(yaml.contains("3201:3201"));
        assert!(yaml.contains("ANTHROPIC_API_KEY"));
    }
}
