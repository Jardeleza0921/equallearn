import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useLoad(loader, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  const firstFocus = useRef(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError('');
    Promise.resolve()
      .then(loader)
      .then(value => alive && setData(value))
      .catch(err => {
        console.error(err);
        if (alive) setError(err?.message || 'Unable to load EqualLearn data.');
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [tick, ...deps]);

  // Expo Router keeps tab screens mounted. Refresh when a user returns to a
  // screen so newly-created lessons/questions/assignments appear immediately.
  useFocusEffect(useCallback(() => {
    if (firstFocus.current) {
      firstFocus.current = false;
      return undefined;
    }
    setTick(v => v + 1);
    return undefined;
  }, []));

  const refresh = useCallback(() => setTick(v => v + 1), []);
  return { data, loading, error, refresh };
}
