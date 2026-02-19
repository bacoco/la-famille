'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Agent } from '@/types/agent';
import { cn } from '@/lib/utils';

interface WelcomeScreenProps {
  agent?: Agent;
  onSendSuggestion: (content: string) => void;
}

const AGENT_SUGGESTIONS: Record<string, string[]> = {
  Maman: [
    'Help me plan a creative workshop for the family',
    'What is the current state of the famille?',
    'Design a new bot personality for our team',
    'Help me organize our next big project',
  ],
  Henry: [
    'What do you think about the current tech trends?',
    'Help me draft a concise summary of this topic',
    'Give me your honest opinion on this approach',
    'Find the best resources for learning this skill',
  ],
  Sage: [
    'What are the hidden assumptions in this plan?',
    'Help me think through the trade-offs here',
    'Play devil\'s advocate on this decision',
    'What risks are we not seeing?',
  ],
  Nova: [
    'Review this code architecture for me',
    'Help me debug this tricky issue',
    'Design a clean API for this feature',
    'What\'s the best tech stack for this project?',
  ],
  Blaise: [
    'Create a test checklist for this feature',
    'Find the edge cases in this logic',
    'Verify the consistency of this documentation',
    'Fact-check these technical claims',
  ],
};

const DEFAULT_SUGGESTIONS = [
  'Tell me about yourself',
  'Help me brainstorm ideas',
  'What can you help me with?',
  'Let\'s work on something together',
];

export function WelcomeScreen({ agent, onSendSuggestion }: WelcomeScreenProps) {
  const suggestions =
    (agent && AGENT_SUGGESTIONS[agent.name]) || DEFAULT_SUGGESTIONS;

  const accentColor = agent?.color || '#f97316';

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      {/* Animated agent avatar */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative mb-6"
      >
        <motion.div
          animate={{
            boxShadow: [
              `0 0 20px ${accentColor}20`,
              `0 0 40px ${accentColor}30`,
              `0 0 20px ${accentColor}20`,
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="flex h-24 w-24 items-center justify-center rounded-full"
          style={{
            background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}30)`,
            border: `2px solid ${accentColor}40`,
          }}
        >
          <span className="text-5xl">{agent?.emoji || '🤖'}</span>
        </motion.div>

        {/* Subtle sparkle accent */}
        <motion.div
          className="absolute -right-1 -top-1"
          animate={{ rotate: [0, 15, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles
            className="h-5 w-5"
            style={{ color: accentColor }}
          />
        </motion.div>
      </motion.div>

      {/* Agent name */}
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="mb-2 text-2xl font-semibold text-foreground"
      >
        {agent?.name || 'Welcome'}
      </motion.h1>

      {/* Agent description */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="mb-2 max-w-md text-center text-sm text-muted-foreground"
      >
        {agent?.description || 'Choose an agent and start a conversation.'}
      </motion.p>

      {/* Personality vibe quote */}
      {agent?.personality?.vibe && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="mb-8 text-center text-xs italic text-muted-foreground/70"
        >
          &ldquo;{agent.personality.vibe}&rdquo;
        </motion.p>
      )}

      {/* Suggestion buttons */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="grid w-full max-w-lg gap-2 sm:grid-cols-2"
      >
        {suggestions.map((suggestion, i) => (
          <motion.div
            key={suggestion}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.08, duration: 0.3 }}
          >
            <Button
              variant="outline"
              className={cn(
                'h-auto w-full justify-start whitespace-normal px-4 py-3 text-left text-sm',
                'border-border/50 bg-muted/20 text-muted-foreground',
                'hover:bg-muted/40 hover:text-foreground hover:border-border',
                'transition-all duration-200'
              )}
              onClick={() => onSendSuggestion(suggestion)}
            >
              <span className="line-clamp-2">{suggestion}</span>
            </Button>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
