'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  children: React.ReactNode;
}

export function AppSidebar({ children }: AppSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      {/* Desktop sidebar: always visible on md+ */}
      <div className="hidden md:flex">
        <ChatSidebar />
      </div>

      {/* Mobile sidebar: Sheet overlay */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile header bar */}
          <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border/50 px-3 md:hidden">
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <div className="flex items-center gap-1.5">
              <span className="text-base">🦊</span>
              <span className="text-sm font-bold tracking-tight text-foreground">
                La Famille
              </span>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex flex-1 overflow-hidden">
            {children}
          </div>
        </div>

        <SheetContent
          side="left"
          className="w-72 p-0"
          showCloseButton={false}
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <ChatSidebar />
        </SheetContent>
      </Sheet>
    </div>
  );
}
