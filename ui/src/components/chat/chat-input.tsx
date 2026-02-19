'use client';

import { useRef, useCallback, KeyboardEvent } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Agent } from '@/types/agent';

interface ChatInputProps {
  onSend: (content: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  agent?: Agent;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  onStop,
  isStreaming,
  agent,
  disabled = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const maxHeight = 6 * 24; // ~6 rows at 24px line height
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, []);

  const handleSend = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const content = textarea.value.trim();
    if (!content || isStreaming || disabled) return;
    onSend(content);
    textarea.value = '';
    textarea.style.height = 'auto';
    textarea.focus();
  }, [onSend, isStreaming, disabled]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const accentColor = agent?.color || '#f97316';

  return (
    <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm px-4 pb-4 pt-3">
      <div
        className={cn(
          'relative flex items-end gap-2 rounded-2xl border bg-muted/30 px-4 py-3',
          'transition-all duration-200',
          'focus-within:border-orange-500/50 focus-within:ring-2 focus-within:ring-orange-500/20'
        )}
        style={{
          ['--tw-ring-color' as string]: `${accentColor}33`,
        }}
      >
        <textarea
          ref={textareaRef}
          placeholder={
            agent ? `Message ${agent.name}...` : 'Type a message...'
          }
          className={cn(
            'flex-1 resize-none bg-transparent text-sm leading-6 text-foreground',
            'placeholder:text-muted-foreground/60',
            'outline-none',
            'min-h-[24px] max-h-[144px]'
          )}
          rows={1}
          disabled={disabled}
          onInput={adjustHeight}
          onKeyDown={handleKeyDown}
          aria-label="Chat message input"
        />

        {isStreaming ? (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={onStop}
            className="shrink-0 rounded-full bg-muted hover:bg-muted/80"
            aria-label="Stop generating"
          >
            <Square className="h-3.5 w-3.5 fill-current" />
          </Button>
        ) : (
          <Button
            size="icon-sm"
            onClick={handleSend}
            disabled={disabled}
            className="shrink-0 rounded-full text-white"
            style={{ backgroundColor: accentColor }}
            aria-label="Send message"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
      <p className="mt-2 text-center text-[10px] text-muted-foreground/50">
        La Famille can make mistakes. Verify important information.
      </p>
    </div>
  );
}
