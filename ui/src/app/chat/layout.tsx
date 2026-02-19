'use client';

import { useEffect } from 'react';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { useAgentStore } from '@/stores/agent-store';
import { useBackendHealth } from '@/hooks/use-backend-health';
import { getPresetAgents } from '@/config/presets';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const initializePresets = useAgentStore((s) => s.initializePresets);
  useBackendHealth();

  useEffect(() => {
    initializePresets(getPresetAgents());
  }, [initializePresets]);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <ChatSidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}
