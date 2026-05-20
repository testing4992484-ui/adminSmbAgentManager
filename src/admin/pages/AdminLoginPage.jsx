import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../config/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snap = await get(ref(db, `admins/${user.uid}`));
        if (snap.exists() && snap.val()) {
          navigate('/admin');
          return;
        }
      }
      setChecking(false);
    });
    return unsub;
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const snap = await get(ref(db, `admins/${cred.user.uid}`));
      if (!snap.exists() || !snap.val()) {
        await auth.signOut();
        setError('Tum admin nahi ho! Access denied.');
        setLoading(false);
        return;
      }
      navigate('/admin');
    } catch (err) {
      const msgs = {
        'auth/invalid-credential': 'Email ya password galat hai!',
        'auth/user-not-found': 'Yeh email registered nahi hai.',
        'auth/wrong-password': 'Password galat hai!',
        'auth/too-many-requests': 'Bahut zyada tries! Thodi der baad try karo.'
      };
      setError(msgs[err.code] || 'Login fail ho gaya. Dobara try karo.');
      setLoading(false);
    }
  };

  if (checking) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#090914' }}>
      <div className="skeleton" style={{ width: 60, height: 60, borderRadius: '50%' }} />
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', background: '#090914',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, fontFamily: 'Outfit, sans-serif'
    }}>
      <div className="admin-page-enter" style={{
        background: '#151528', border: '1px solid #2a2a4a',
        borderRadius: 24, padding: '40px 36px', width: '100%', maxWidth: 400
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎮</div>
          <h1 style={{ color: '#f0f0f5', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Admin Panel</h1>
          <p style={{ color: '#8e8e9f', fontSize: 14 }}>Sabka Masti Bazaar</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ color: '#8e8e9f', fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="admin@example.com"
              style={{
                width: '100%', padding: '12px 16px',
                background: '#0d0d1a', border: '1px solid #2a2a4a',
                borderRadius: 12, color: '#f0f0f5', fontSize: 15,
                outline: 'none', fontFamily: 'Outfit,sans-serif'
              }}
            />
          </div>
          <div>
            <label style={{ color: '#8e8e9f', fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 6 }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              style={{
                width: '100%', padding: '12px 16px',
                background: '#0d0d1a', border: '1px solid #2a2a4a',
                borderRadius: 12, color: '#f0f0f5', fontSize: 15,
                outline: 'none', fontFamily: 'Outfit,sans-serif'
              }}
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(255,0,60,0.1)', border: '1px solid #ff003c',
              borderRadius: 10, padding: '10px 14px', color: '#ff003c', fontSize: 14
            }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="admin-btn" style={{
            padding: '14px', borderRadius: 14,
            background: '#9d00ff', border: 'none',
            color: '#fff', fontSize: 16, fontWeight: 700,
            boxShadow: '0 0 24px rgba(157,0,255,0.4)',
            opacity: loading ? 0.7 : 1, marginTop: 8,
            fontFamily: 'Outfit,sans-serif'
          }}>
            {loading ? 'Login ho raha hai...' : '🔐 Login Karo'}
          </button>
        </form>

        <p style={{ color: '#8e8e9f', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
          Sirf authorized admins hi yahan aa sakte hain.
        </p>
      </div>
    </div>
  );
}
