'use client';

import { Copy, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Message } from '@/types/chat';

interface MessageActionsProps {
  message: Message;
  onRetry?: () => void;
  onDelete?: () => void;
}

export function MessageActions({
  message,
  onRetry,
  onDelete,
}: MessageActionsProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-0.5"
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleCopy}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Copy message"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Copy</TooltipContent>
        </Tooltip>

        {message.role === 'assistant' && onRetry && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onRetry}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Retry message"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Retry</TooltipContent>
          </Tooltip>
        )}

        {onDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onDelete}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Delete message"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Delete</TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </motion.div>
  );
}
