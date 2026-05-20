import { useState, useEffect } from 'react';
import { getGamePool } from '../utils/adminFirebase';

export default function useGamePool() {
  const [gamePool, setGamePool] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = getGamePool((data) => {
      setGamePool(data);
      setLoading(false);
    });
    return () => unsub && unsub();
  }, []);

  return { gamePool, loading };
}
