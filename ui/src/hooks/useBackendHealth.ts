'use client';

import { useEffect, useRef } from 'react';
import { useBackendStore } from '@/stores/backend-store';

const POLL_INTERVAL_MS = 30_000;
const TIMEOUT_MS = 5_000;

/**
 * Polls all registered backends' /health endpoints and updates their healthStatus.
 * Automatically starts polling on mount and stops on unmount.
 */
export function useBackendHealth() {
  const backends = useBackendStore((s) => s.backends);
  const setHealthStatus = useBackendStore((s) => s.setHealthStatus);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function checkAll() {
      for (const backend of backends) {
        try {
          const healthUrl = backend.baseUrl.replace(/\/v1\/?$/, '/health');
          const res = await fetch(healthUrl, {
            signal: AbortSignal.timeout(TIMEOUT_MS),
          });
          setHealthStatus(backend.id, res.ok ? 'healthy' : 'unhealthy');
        } catch {
          setHealthStatus(backend.id, 'unhealthy');
        }
      }
    }

    checkAll();
    intervalRef.current = setInterval(checkAll, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [backends, setHealthStatus]);
}
