import { useCallback, useEffect, useRef, useState } from 'react';
export function useResource<T>(loader: () => Promise<T>, key: string) {
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const generation = useRef(0);
  const [data, setData] = useState<T>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true);
    setError('');
    try {
      const result = await loaderRef.current();
      if (generation.current === current) setData(result);
    } catch (e) {
      if (generation.current === current)
        setError(e instanceof Error ? e.message : 'Unable to load data.');
    } finally {
      if (generation.current === current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    setData(undefined);
    void refresh();
    const activeGeneration = generation;
    return () => {
      activeGeneration.current++;
    };
  }, [key, refresh]);
  return { data, error, loading, refresh };
}
