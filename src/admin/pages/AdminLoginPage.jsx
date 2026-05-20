import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, googleProvider } from '../../config/firebase';
import { signInWithEmailAndPassword, signInWithPopup, onAuthStateChanged } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';

const SUPER_ADMIN_EMAILS = ['commentschor70068@gmail.com'];

function isSuperAdmin(email) {
  return SUPER_ADMIN_EMAILS.includes((email || '').toLowerCase());
}

export default function AdminLoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error, setError]       = useState('');
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (isSuperAdmin(user.email)) {
          try { await set(ref(db, `admins/${user.uid}`), true); } catch (_) {}
          navigate('/admin');
          return;
        }
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
      if (isSuperAdmin(cred.user.email)) {
        try { await set(ref(db, `admins/${cred.user.uid}`), true); } catch (_) {}
        navigate('/admin');
        return;
      }
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
        'auth/invalid-credential':  'Email ya password galat hai!',
        'auth/user-not-found':      'Yeh email registered nahi hai.',
        'auth/wrong-password':      'Password galat hai!',
        'auth/too-many-requests':   'Bahut zyada tries! Thodi der baad try karo.'
      };
      setError(msgs[err.code] || `Login fail: ${err.code}`);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const user  = cred.user;

      if (isSuperAdmin(user.email)) {
        try { await set(ref(db, `admins/${user.uid}`), true); } catch (_) {}
        navigate('/admin');
        return;
      }

      const snap = await get(ref(db, `admins/${user.uid}`));
      if (!snap.exists() || !snap.val()) {
        await auth.signOut();
        setError('Tum admin nahi ho! Access denied.');
        setGLoading(false);
        return;
      }
      navigate('/admin');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(`Google login fail: ${err.code}`);
      }
      setGLoading(false);
    }
  };

  if (checking) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#090914' }}>
      <div className="skeleton" style={{ width:60, height:60, borderRadius:'50%' }} />
    </div>
  );

  return (
    <div style={{
      minHeight:'100vh', background:'#090914',
      display:'flex', alignItems:'center', justifyContent:'center',
      padding:20, fontFamily:'Outfit, sans-serif'
    }}>
      <div className="admin-page-enter" style={{
        background:'#151528', border:'1px solid #2a2a4a',
        borderRadius:24, padding:'40px 36px', width:'100%', maxWidth:400
      }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🎮</div>
          <h1 style={{ color:'#f0f0f5', fontSize:26, fontWeight:800, marginBottom:4 }}>Admin Panel</h1>
          <p style={{ color:'#8e8e9f', fontSize:14 }}>Sabka Masti Bazaar</p>
        </div>

        <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={labelSt}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="admin@example.com" style={inputSt} />
          </div>
          <div>
            <label style={labelSt}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••" style={inputSt} />
          </div>

          {error && (
            <div style={{ background:'rgba(255,0,60,0.1)', border:'1px solid #ff003c', borderRadius:10, padding:'10px 14px', color:'#ff003c', fontSize:13 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || gLoading} className="admin-btn" style={{
            padding:'14px', borderRadius:14, background:'#9d00ff', border:'none',
            color:'#fff', fontSize:16, fontWeight:700,
            boxShadow:'0 0 24px rgba(157,0,255,0.4)',
            opacity:(loading || gLoading) ? 0.7 : 1, marginTop:4,
            fontFamily:'Outfit,sans-serif', cursor:'pointer'
          }}>
            {loading ? 'Login ho raha hai...' : '🔐 Login Karo'}
          </button>
        </form>

        <div style={{ display:'flex', alignItems:'center', gap:12, margin:'20px 0' }}>
          <div style={{ flex:1, height:1, background:'#2a2a4a' }} />
          <span style={{ color:'#8e8e9f', fontSize:13 }}>ya</span>
          <div style={{ flex:1, height:1, background:'#2a2a4a' }} />
        </div>

        <button onClick={handleGoogleLogin} disabled={loading || gLoading} style={{
          width:'100%', padding:'13px', borderRadius:14,
          background:'#1a1a2e', border:'1px solid #2a2a4a',
          color:'#f0f0f5', fontSize:15, fontWeight:600,
          display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          cursor:'pointer', fontFamily:'Outfit,sans-serif',
          opacity:(loading || gLoading) ? 0.7 : 1
        }}>
          {gLoading ? 'Connecting...' : (
            <>
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
              </svg>
              Google se Login Karo
            </>
          )}
        </button>

        <p style={{ color:'#8e8e9f', fontSize:12, textAlign:'center', marginTop:20 }}>
          Sirf authorized admins hi yahan aa sakte hain.
        </p>
      </div>
    </div>
  );
}

const labelSt = { display:'block', color:'#8e8e9f', fontSize:13, fontWeight:500, marginBottom:6 };
const inputSt  = { width:'100%', padding:'12px 16px', background:'#0d0d1a', border:'1px solid #2a2a4a', borderRadius:12, color:'#f0f0f5', fontSize:15, outline:'none', fontFamily:'Outfit,sans-serif', boxSizing:'border-box' };
