import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';

export default function AdminGuard({ children }) {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/admin/login');
        setChecking(false);
        return;
      }
      try {
        const snap = await get(ref(db, `admins/${user.uid}`));
        if (!snap.exists() || !snap.val()) {
          await auth.signOut();
          navigate('/admin/login');
        }
      } catch {
        navigate('/admin/login');
      }
      setChecking(false);
    });
    return unsub;
  }, [navigate]);

  if (checking) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#090914', color: '#f0f0f5', fontSize: '18px', fontFamily: 'Outfit, sans-serif' }}>
      <div>
        <div className="skeleton" style={{ width: 200, height: 20, marginBottom: 12 }} />
        <div className="skeleton" style={{ width: 140, height: 16 }} />
      </div>
    </div>
  );
  return children;
}
