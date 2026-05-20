import { useState, useEffect } from 'react';
import { getAllOrders } from '../utils/adminFirebase';

export default function useOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = getAllOrders((data) => {
      setOrders(data);
      setLoading(false);
    });
    return () => unsub && unsub();
  }, []);

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  return { orders, loading, pendingCount, setOrders };
}
