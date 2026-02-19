use crate::protocol::Position;

/// Detects convergence among agent positions in a COUNCIL round.
pub struct ConvergenceDetector;

impl ConvergenceDetector {
    /// Score the convergence of a set of positions (0.0 = total disagreement, 1.0 = consensus).
    ///
    /// Uses a combination of:
    /// - Confidence-weighted agreement (high confidence positions carry more weight)
    /// - Semantic similarity placeholder (to be enhanced with embeddings)
    pub fn score(positions: &[Position]) -> f64 {
        if positions.len() <= 1 {
            return 1.0;
        }

        // Simple heuristic: average confidence as a proxy for convergence
        // In production, this would use embeddings to measure semantic similarity
        let avg_confidence: f64 =
            positions.iter().map(|p| p.confidence).sum::<f64>() / positions.len() as f64;

        // Check if positions are textually similar (basic overlap check)
        let similarity = Self::text_similarity(positions);

        // Weighted combination
        avg_confidence * 0.4 + similarity * 0.6
    }

    /// Basic text similarity between positions using word overlap (Jaccard index).
    /// This is a placeholder — production would use embeddings.
    fn text_similarity(positions: &[Position]) -> f64 {
        if positions.len() <= 1 {
            return 1.0;
        }

        let word_sets: Vec<std::collections::HashSet<&str>> = positions
            .iter()
            .map(|p| {
                p.content
                    .split_whitespace()
                    .map(|w| w.trim_matches(|c: char| !c.is_alphanumeric()))
                    .filter(|w| w.len() > 3)
                    .collect()
            })
            .collect();

        let mut total_similarity = 0.0;
        let mut pairs = 0;

        for i in 0..word_sets.len() {
            for j in (i + 1)..word_sets.len() {
                let intersection = word_sets[i].intersection(&word_sets[j]).count();
                let union = word_sets[i].union(&word_sets[j]).count();
                if union > 0 {
                    total_similarity += intersection as f64 / union as f64;
                }
                pairs += 1;
            }
        }

        if pairs > 0 {
            total_similarity / pairs as f64
        } else {
            0.0
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_single_position_is_consensus() {
        let positions = vec![Position {
            agent: "maman".into(),
            content: "Use Rust".into(),
            confidence: 0.9,
            reasoning: None,
        }];
        assert_eq!(ConvergenceDetector::score(&positions), 1.0);
    }

    #[test]
    fn test_identical_positions_converge() {
        let positions = vec![
            Position {
                agent: "henry".into(),
                content: "We should use Rust for the project".into(),
                confidence: 0.8,
                reasoning: None,
            },
            Position {
                agent: "sage".into(),
                content: "We should use Rust for the project".into(),
                confidence: 0.9,
                reasoning: None,
            },
        ];
        let score = ConvergenceDetector::score(&positions);
        assert!(score > 0.8, "identical positions should converge: {score}");
    }

    #[test]
    fn test_different_positions_diverge() {
        let positions = vec![
            Position {
                agent: "henry".into(),
                content: "quantum computing is the future of AI".into(),
                confidence: 0.3,
                reasoning: None,
            },
            Position {
                agent: "sage".into(),
                content: "traditional databases remain essential for web apps".into(),
                confidence: 0.4,
                reasoning: None,
            },
        ];
        let score = ConvergenceDetector::score(&positions);
        assert!(score < 0.5, "different positions should diverge: {score}");
    }
}
