'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { AlertCircle, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message } from '@/types/chat';
import { Agent } from '@/types/agent';
import { TypingIndicator } from './typing-indicator';
import { MessageActions } from './message-actions';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ChatMessageProps {
  message: Message;
  agent?: Agent;
  onRetry?: () => void;
  onDelete?: () => void;
}

function CodeBlock({
  language,
  children,
}: {
  language?: string;
  children: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      toast.success('Code copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div className="group/code relative my-3 overflow-hidden rounded-lg border border-border bg-zinc-950 dark:bg-zinc-900/50">
      <div className="flex items-center justify-between border-b border-border/50 bg-zinc-900/80 px-4 py-2 dark:bg-zinc-800/50">
        <span className="text-xs text-muted-foreground font-mono">
          {language || 'code'}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground opacity-0 group-hover/code:opacity-100 transition-opacity"
          aria-label="Copy code"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className={language ? `hljs language-${language}` : ''}>
          {children}
        </code>
      </pre>
    </div>
  );
}

export function ChatMessage({
  message,
  agent,
  onRetry,
  onDelete,
}: ChatMessageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isUser = message.role === 'user';
  const isError = message.isError;
  const isStreaming = message.isStreaming;

  const renderContent = useCallback(() => {
    if (isStreaming && !message.content) {
      return <TypingIndicator color={agent?.color || '#f97316'} />;
    }

    return (
      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent prose-pre:border-0">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            pre: ({ children }) => <>{children}</>,
            code: ({ className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || '');
              const content = String(children).replace(/\n$/, '');

              if (match) {
                return <CodeBlock language={match[1]}>{content}</CodeBlock>;
              }

              return (
                <code
                  className={cn(
                    'rounded-md bg-muted px-1.5 py-0.5 text-sm font-mono',
                    className
                  )}
                  {...props}
                >
                  {children}
                </code>
              );
            },
            table: ({ children }) => (
              <div className="my-3 overflow-x-auto rounded-lg border border-border">
                <table className="w-full">{children}</table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border-b border-border bg-muted/50 px-4 py-2 text-left text-sm font-medium">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border-b border-border/50 px-4 py-2 text-sm">
                {children}
              </td>
            ),
            a: ({ children, href }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:text-orange-400 underline underline-offset-2"
              >
                {children}
              </a>
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>
        {isStreaming && message.content && (
          <motion.span
            className="inline-block h-4 w-0.5 ml-0.5 align-middle"
            style={{ backgroundColor: agent?.color || '#f97316' }}
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        )}
      </div>
    );
  }, [message.content, isStreaming, agent?.color]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn('group relative px-4 py-3', isUser ? 'flex justify-end' : '')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          'flex gap-3 max-w-[85%] md:max-w-[75%]',
          isUser ? 'flex-row-reverse' : 'flex-row'
        )}
      >
        {/* Agent avatar for assistant messages */}
        {!isUser && (
          <div
            className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base"
            style={{
              backgroundColor: agent?.color
                ? `${agent.color}20`
                : 'rgba(249, 115, 22, 0.125)',
              border: `1px solid ${agent?.color || '#f97316'}30`,
            }}
          >
            {agent?.emoji || '🤖'}
          </div>
        )}

        <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
          {/* Agent name for assistant messages */}
          {!isUser && agent && (
            <span className="text-xs font-medium text-muted-foreground ml-1">
              {agent.name}
            </span>
          )}

          {/* Message bubble */}
          <div
            className={cn(
              'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
              isUser
                ? 'bg-orange-600 text-white rounded-br-md'
                : isError
                  ? 'bg-destructive/10 text-destructive border border-destructive/20 rounded-bl-md'
                  : 'bg-muted/60 text-foreground border border-border/40 rounded-bl-md'
            )}
          >
            {isError && (
              <div className="flex items-center gap-2 mb-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                <span className="text-xs font-medium">Error</span>
              </div>
            )}
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              renderContent()
            )}
          </div>

          {/* Message actions on hover */}
          <AnimatePresence>
            {isHovered && !isStreaming && (
              <MessageActions
                message={message}
                onRetry={message.role === 'assistant' ? onRetry : undefined}
                onDelete={onDelete}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
