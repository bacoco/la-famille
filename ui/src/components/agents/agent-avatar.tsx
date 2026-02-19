'use client';

import { cn } from '@/lib/utils';

interface AgentAvatarProps {
  emoji: string;
  color: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'h-8 w-8 text-base',
  md: 'h-10 w-10 text-lg',
  lg: 'h-16 w-16 text-3xl',
  xl: 'h-24 w-24 text-5xl',
};

export function AgentAvatar({ emoji, color, size = 'md', className }: AgentAvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center shrink-0',
        sizeMap[size],
        className
      )}
      style={{ backgroundColor: `${color}20` }}
    >
      {emoji}
    </div>
  );
}
