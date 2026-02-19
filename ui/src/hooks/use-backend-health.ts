'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useBackendStore } from '@/stores/backend-store';
import { checkHealth, listModels } from '@/lib/api-client';

export function useBackendHealth(intervalMs = 120000) {
  const backends = useBackendStore((s) => s.backends);
  const setHealthStatus = useBackendStore((s) => s.setHealthStatus);
  const setModels = useBackendStore((s) => s.setModels);
  const modelsFetched = useRef(false);

  const checkAll = useCallback(async () => {
    for (const backend of backends) {
      try {
        const healthy = await checkHealth(backend);
        setHealthStatus(backend.id, healthy ? 'healthy' : 'unhealthy');

        // Only fetch models once on first successful health check
        if (healthy && !modelsFetched.current) {
          try {
            const models = await listModels(backend);
            if (models.length > 0) {
              setModels(backend.id, models);
              modelsFetched.current = true;
            }
          } catch {
            // Model listing failed -- keep whatever models were already stored
          }
        }
      } catch {
        setHealthStatus(backend.id, 'unhealthy');
      }
    }
  }, [backends, setHealthStatus, setModels]);

  useEffect(() => {
    checkAll();
    const interval = setInterval(checkAll, intervalMs);
    return () => clearInterval(interval);
  }, [checkAll, intervalMs]);

  return { checkAll };
}
