'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserInfo {
  name: string;
  username: string;
  email: string;
}

function getUserFromCookie(): UserInfo | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith('user_info='));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.split('=').slice(1).join('=')));
  } catch {
    return null;
  }
}

export function UserMenu() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    setUser(getUserFromCookie());
  }, []);

  if (!user) return null;

  const handleSignOut = async () => {
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    await fetch(`${basePath}/api/auth/logout`, { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 px-3 py-2 h-auto text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30"
        >
          <User className="h-4 w-4 shrink-0" />
          <span className="truncate">{user.name || user.username}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">
              {user.email || user.username}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Se deconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
