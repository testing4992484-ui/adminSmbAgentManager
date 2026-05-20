import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import ConfirmModal from '../components/ConfirmModal';
import UserAvatar from '../components/UserAvatar';
import { useAdmin } from '../context/AdminContext';
import { getPublicProfiles, removeFromLeaderboard, setFeaturedPlayer, logAdminAction, updateAdminSettings } from '../utils/adminFirebase';
import useAdminSettings from '../hooks/useAdminSettings';
import { formatNumber } from '../utils/formatters';
import { useState as useS, useEffect } from 'react';
import { db } from '../../config/firebase';
import { ref, onValue, update, remove } from 'firebase/database';

export default function LeaderboardAdminPage() {
  const { adminUser, showToast } = useAdmin();
  const { settings } = useAdminSettings();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [target, setTarget] = useState(null);

  useEffect(() => {
    const unsub = onValue(ref(db, 'public_profiles'), (snap) => {
      const data = snap.val() || {};
      const list = Object.entries(data).map(([uid, val]) => ({ uid, ...val })).sort((a, b) => (b.coins || 0) - (a.coins || 0));
      setProfiles(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleRemove = async () => {
    try {
      await remove(ref(db, `public_profiles/${target.uid}`));
      await logAdminAction(adminUser.uid, adminUser.email, 'REMOVE_LEADERBOARD', target.uid, target, null);
      showToast('Leaderboard se remove ho gaya!', 'success');
      setModal(null); setTarget(null);
    } catch { showToast('Error aaya!', 'error'); }
  };

  const handleFeatured = async (uid) => {
    try {
      await updateAdminSettings({ featuredPlayer: uid === settings.featuredPlayer ? '' : uid });
      await logAdminAction(adminUser.uid, adminUser.email, 'SET_FEATURED_PLAYER', uid, settings.featuredPlayer, uid);
      showToast(uid === settings.featuredPlayer ? 'Featured player remove ho gaya!' : 'Featured player set ho gaya!', 'success');
    } catch { showToast('Error aaya!', 'error'); }
  };

  const handleWeeklyReset = async () => {
    try {
      const updates = {};
      profiles.forEach(p => { updates[`public_profiles/${p.uid}/coins`] = 0; });
      await update(ref(db), updates);
      await logAdminAction(adminUser.uid, adminUser.email, 'WEEKLY_RESET_LEADERBOARD', null, null, 'reset');
      showToast('Weekly reset ho gaya!', 'success');
      setModal(null);
    } catch { showToast('Error aaya!', 'error'); }
  };

  return (
    <AdminLayout title="🏆 Leaderboard Management">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => setModal('reset')} className="admin-btn" style={{ padding: '10px 20px', background: 'rgba(255,0,60,0.1)', border: '1px solid #ff003c55', borderRadius: 12, color: '#ff003c', fontFamily: 'Outfit,sans-serif', fontSize: 14, fontWeight: 700 }}>
          🔄 Weekly Reset
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[...Array(10)].map((_, i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 12 }} />)}</div>
      ) : (
        <div style={{ background: '#151528', border: '1px solid #1a1a2e', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0d0d1a' }}>
                  {['Rank', 'Player', 'Coins', 'Featured', 'Remove'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {profiles.slice(0, 50).map((p, i) => {
                  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
                  const isFeatured = settings.featuredPlayer === p.uid;
                  return (
                    <tr key={p.uid} style={{ borderBottom: '1px solid #1a1a2e', background: isFeatured ? 'rgba(157,0,255,0.05)' : 'transparent' }}>
                      <td style={{ ...thStyle, fontWeight: 700, fontSize: 16, color: i < 3 ? '#ffbe0b' : '#8e8e9f' }}>{medal}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <UserAvatar name={p.name} size={32} />
                          <div>
                            <div style={{ color: '#f0f0f5', fontWeight: 600, fontSize: 14 }}>
                              {p.name || '—'} {isFeatured && '👑'}
                            </div>
                            <div style={{ color: '#8e8e9f', fontSize: 11 }}>{p.uid.slice(0, 12)}...</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, color: '#ffbe0b', fontWeight: 700 }}>{formatNumber(p.coins || 0)} 🪙</td>
                      <td style={tdStyle}>
                        <button onClick={() => handleFeatured(p.uid)} className="admin-btn" style={{ padding: '6px 12px', background: isFeatured ? 'rgba(157,0,255,0.2)' : 'transparent', border: `1px solid ${isFeatured ? '#9d00ff' : '#2a2a4a'}`, borderRadius: 8, color: isFeatured ? '#9d00ff' : '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 12 }}>
                          {isFeatured ? '👑 Featured' : 'Set Featured'}
                        </button>
                      </td>
                      <td style={tdStyle}>
                        <button onClick={() => { setTarget(p); setModal('remove'); }} className="admin-btn" style={{ padding: '6px 12px', background: 'rgba(255,0,60,0.1)', border: '1px solid #ff003c44', borderRadius: 8, color: '#ff003c', fontFamily: 'Outfit,sans-serif', fontSize: 12 }}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal isOpen={modal === 'remove'} title="🗑️ Leaderboard se Remove" message={`${target?.name} ko leaderboard se hataana chahte ho?`} confirmText="Remove Karo" danger onConfirm={handleRemove} onCancel={() => { setModal(null); setTarget(null); }} />
      <ConfirmModal isOpen={modal === 'reset'} title="⚠️ Weekly Leaderboard Reset" message="Saare players ke leaderboard coins 0 ho jaayenge! Yeh undo nahi ho sakta." confirmText="Reset Karo" danger onConfirm={handleWeeklyReset} onCancel={() => setModal(null)} />
    </AdminLayout>
  );
}

const thStyle = { padding: '12px 14px', color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 12, fontWeight: 600, textAlign: 'left' };
const tdStyle = { padding: '12px 14px', fontFamily: 'Outfit,sans-serif', verticalAlign: 'middle' };
