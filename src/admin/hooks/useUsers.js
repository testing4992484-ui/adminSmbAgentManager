import { useState, useEffect } from 'react';
import { getAllUsers } from '../utils/adminFirebase';

export default function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = getAllUsers((data) => {
      setUsers(data);
      setLoading(false);
    });
    return () => unsub && unsub();
  }, []);

  const bannedCount = users.filter(u => u.banned).length;
  const totalCoins  = users.reduce((s, u) => s + (u.coins || 0), 0);

  return { users, loading, bannedCount, totalCoins, setUsers };
}
