import { useState, useEffect } from 'react';
import { getAllWithdrawals } from '../utils/adminFirebase';

export default function useWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = getAllWithdrawals((data) => {
      setWithdrawals(data);
      setLoading(false);
    });
    return () => unsub && unsub();
  }, []);

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const pendingTotal = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + (w.amount || 0), 0);

  return { withdrawals, loading, pendingCount, pendingTotal, setWithdrawals };
}
