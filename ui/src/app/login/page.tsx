'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
      const response = await fetch(`${basePath}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        router.push('/chat');
        router.refresh();
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.error || 'Identifiants invalides');
      }
    } catch {
      setError('Service d\'authentification indisponible');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm border-border/50">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto text-5xl">&#x1F98A;</div>
          <div>
            <CardTitle className="text-xl font-bold tracking-tight">
              La Famille
            </CardTitle>
            <CardDescription className="mt-1">
              Connecte-toi pour acceder a ton workspace
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Utilisateur</Label>
              <Input
                id="username"
                type="text"
                placeholder="vlad"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="size-4 animate-spin" />}
              Se connecter
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
