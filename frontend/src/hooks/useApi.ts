import { useCallback, useEffect, useState } from 'react';
import { errorMessage } from '../api/client';

export function useApi<T>(loader: () => Promise<T>, dependencies: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await loader());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, dependencies);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { data, loading, error, reload, setData };
}
