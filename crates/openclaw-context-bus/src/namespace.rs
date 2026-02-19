use serde::{Deserialize, Serialize};

/// Namespace for context bus entries, providing multi-tenant isolation.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum Namespace {
    /// Agent-private namespace: `agent:maman`
    Agent(String),
    /// Family-wide namespace: `family:openclaw`
    Family(String),
    /// Globally shared across all families
    Shared,
    /// Council session namespace: `council:session_id`
    Council(String),
    /// Legacy imported data: `legacy:source_name`
    Legacy(String),
}

impl Namespace {
    /// Parse a namespace string like "agent:maman" or "shared".
    pub fn parse(s: &str) -> Result<Self, String> {
        if s == "shared" {
            return Ok(Namespace::Shared);
        }

        if let Some((prefix, value)) = s.split_once(':') {
            match prefix {
                "agent" => Ok(Namespace::Agent(value.to_string())),
                "family" => Ok(Namespace::Family(value.to_string())),
                "council" => Ok(Namespace::Council(value.to_string())),
                "legacy" => Ok(Namespace::Legacy(value.to_string())),
                _ => Err(format!("unknown namespace prefix: {prefix}")),
            }
        } else {
            Err(format!("invalid namespace format: {s}"))
        }
    }
}

impl std::fmt::Display for Namespace {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Namespace::Agent(name) => write!(f, "agent:{name}"),
            Namespace::Family(name) => write!(f, "family:{name}"),
            Namespace::Shared => write!(f, "shared"),
            Namespace::Council(id) => write!(f, "council:{id}"),
            Namespace::Legacy(source) => write!(f, "legacy:{source}"),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_agent() {
        assert_eq!(
            Namespace::parse("agent:maman").unwrap(),
            Namespace::Agent("maman".into())
        );
    }

    #[test]
    fn test_parse_shared() {
        assert_eq!(Namespace::parse("shared").unwrap(), Namespace::Shared);
    }

    #[test]
    fn test_roundtrip() {
        let ns = Namespace::Council("abc-123".into());
        assert_eq!(Namespace::parse(&ns.to_string()).unwrap(), ns);
    }
}
