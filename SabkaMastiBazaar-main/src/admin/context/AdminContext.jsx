import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { auth, db } from '../../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get } from 'firebase/database';

const AdminContext = createContext(null);

export function AdminProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const idleTimer = useRef(null);

  const resetIdleTimer = () => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      signOut(auth);
    }, 30 * 60 * 1000);
  };

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetIdleTimer));
    resetIdleTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdleTimer));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const snap = await get(ref(db, `admins/${user.uid}`));
          if (snap.exists() && snap.val()) {
            setAdminUser(user);
            setIsAdmin(true);
          } else {
            setAdminUser(null);
            setIsAdmin(false);
          }
        } catch {
          setAdminUser(null);
          setIsAdmin(false);
        }
      } else {
        setAdminUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    const offlineHandler = () => showToast('Internet nahi hai!', 'warning');
    const onlineHandler  = () => showToast('Internet wapas aa gaya!', 'success');
    window.addEventListener('offline', offlineHandler);
    window.addEventListener('online', onlineHandler);

    return () => {
      unsub();
      window.removeEventListener('offline', offlineHandler);
      window.removeEventListener('online', onlineHandler);
    };
  }, []);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    const dur = type === 'error' ? 5000 : type === 'warning' ? 4000 : 3000;
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), dur);
  };

  const logout = () => signOut(auth);

  return (
    <AdminContext.Provider value={{ adminUser, isAdmin, loading, showToast, logout }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </AdminContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map(t => {
        const colors = {
          success: '#39ff14',
          error: '#ff003c',
          warning: '#ffbe0b',
          info: '#00f0ff'
        };
        const color = colors[t.type] || colors.success;
        return (
          <div key={t.id} onClick={() => onRemove(t.id)} style={{
            background: '#151528',
            border: `1px solid ${color}`,
            borderRadius: 12,
            padding: '12px 18px',
            color: '#f0f0f5',
            fontSize: 14,
            fontFamily: 'Outfit, sans-serif',
            boxShadow: `0 0 16px ${color}40`,
            animation: 'toastSlideIn 0.3s ease forwards',
            cursor: 'pointer',
            maxWidth: 320,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{ color, fontSize: 18 }}>
              {t.type === 'success' ? '✓' : t.type === 'error' ? '✗' : t.type === 'warning' ? '⚠' : 'ℹ'}
            </span>
            {t.message}
          </div>
        );
      })}
    </div>
  );
}

export const useAdmin = () => useContext(AdminContext);
