import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import BadgeStatus from '../components/BadgeStatus';
import UserAvatar from '../components/UserAvatar';
import ConfirmModal from '../components/ConfirmModal';
import { useAdmin } from '../context/AdminContext';
import { getUserOnce, banUser, adjustCoins, resetUserPassword, logAdminAction } from '../utils/adminFirebase';
import { db } from '../../config/firebase';
import { ref, onValue } from 'firebase/database';
import { formatDate, formatNumber, coinsToINR } from '../utils/formatters';

export default function UserDetailPage() {
  const { uid } = useParams();
  const { adminUser, showToast } = useAdmin();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [coinDelta, setCoinDelta] = useState('');
  const [coinReason, setCoinReason] = useState('');
  const [banReason, setBanReason] = useState('');
  const [actPage, setActPage] = useState(1);
  const ACT_PER_PAGE = 25;

  useEffect(() => {
    getUserOnce(uid).then(data => {
      setUser(data);
      setLoading(false);
    });
    const unsub = onValue(ref(db, `users/${uid}/activity`), (snap) => {
      const data = snap.val() || {};
      const acts = Object.values(data).sort((a, b) => new Date(b.date) - new Date(a.date));
      setActivity(acts);
    });
    return () => unsub();
  }, [uid]);

  const handleBan = async () => {
    if (!banReason.trim()) { showToast('Ban reason likhna zaruri hai!', 'error'); return; }
    try {
      await banUser(uid, !user.banned, banReason);
      await logAdminAction(adminUser.uid, adminUser.email, user.banned ? 'UNBAN_USER' : 'BAN_USER', uid, user.banned, !user.banned);
      showToast(user.banned ? 'User unban ho gaya!' : 'User ban ho gaya!', 'success');
      setUser(prev => ({ ...prev, banned: !prev.banned }));
      setModal(null);
      setBanReason('');
    } catch { showToast('Error aaya!', 'error'); }
  };

  const handleCoinAdjust = async () => {
    const delta = parseInt(coinDelta);
    if (isNaN(delta) || delta === 0) { showToast('Valid amount daalo!', 'error'); return; }
    if (!coinReason.trim()) { showToast('Reason likhna zaruri hai!', 'error'); return; }
    try {
      const newCoins = await adjustCoins(uid, user.coins || 0, delta);
      await logAdminAction(adminUser.uid, adminUser.email, 'ADJUST_COINS', uid, user.coins, newCoins);
      showToast(`Coins ${delta > 0 ? '+' : ''}${delta} adjust ho gaye!`, 'success');
      setUser(prev => ({ ...prev, coins: newCoins }));
      setModal(null);
      setCoinDelta(''); setCoinReason('');
    } catch { showToast('Error aaya!', 'error'); }
  };

  const handlePasswordReset = async () => {
    try {
      await resetUserPassword(user.email);
      await logAdminAction(adminUser.uid, adminUser.email, 'PASSWORD_RESET', uid, null, user.email);
      showToast('Password reset email bhi gayi!', 'success');
      setModal(null);
    } catch { showToast('Reset email nahi gayi!', 'error'); }
  };

  if (loading) return <AdminLayout title="User Detail"><div className="skeleton" style={{ height: 300, borderRadius: 16 }} /></AdminLayout>;
  if (!user) return <AdminLayout title="User Detail"><div style={{ color: '#ff003c', padding: 40, fontFamily: 'Outfit,sans-serif' }}>User nahi mila!</div></AdminLayout>;

  const actTotal = activity.length;
  const actPages = Math.ceil(actTotal / ACT_PER_PAGE);
  const actCurrent = activity.slice((actPage - 1) * ACT_PER_PAGE, actPage * ACT_PER_PAGE);

  return (
    <AdminLayout title="👤 User Detail">
      <button onClick={() => navigate('/admin/users')} style={{ background: 'none', border: '1px solid #2a2a4a', borderRadius: 10, color: '#8e8e9f', padding: '8px 16px', fontFamily: 'Outfit,sans-serif', fontSize: 14, cursor: 'pointer', marginBottom: 20 }}>
        ← Wapas
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <Card title="Profile Info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            <UserAvatar name={user.name} size={52} />
            <div>
              <div style={{ color: '#f0f0f5', fontWeight: 700, fontSize: 18 }}>{user.name || 'No Name'}</div>
              <div style={{ color: '#8e8e9f', fontSize: 13 }}>{user.email}</div>
              <BadgeStatus status={user.banned ? 'banned' : 'active'} />
            </div>
          </div>
          <InfoRow label="UID" value={<span style={{ fontSize: 11, color: '#8e8e9f', wordBreak: 'break-all' }}>{uid}</span>} />
          <InfoRow label="Referral Code" value={user.referralCode || '—'} />
          <InfoRow label="Referred By" value={user.referredBy || '—'} />
          <InfoRow label="Streak" value={`${user.streak || 0} 🔥`} />
          <InfoRow label="Longest Streak" value={`${user.longestStreak || 0} 🔥`} />
          <InfoRow label="Joined" value={user.createdAt ? formatDate(new Date(user.createdAt).toISOString()) : '—'} />
          <InfoRow label="Last Active" value={user.lastActive ? formatDate(new Date(user.lastActive).toISOString()) : '—'} />
        </Card>

        <Card title="Wallet">
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ color: '#ffbe0b', fontSize: 36, fontWeight: 800 }}>{formatNumber(user.coins || 0)}</div>
            <div style={{ color: '#8e8e9f', fontSize: 14 }}>Coins = {coinsToINR(user.coins || 0)}</div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => setModal('coins')} className="admin-btn" style={actionBtn('#9d00ff')}>💰 Coins Adjust</button>
            <button onClick={() => setModal('ban')} className="admin-btn" style={actionBtn(user.banned ? '#39ff14' : '#ff003c')}>
              {user.banned ? '✅ Unban' : '🚫 Ban User'}
            </button>
            <button onClick={() => setModal('reset')} className="admin-btn" style={actionBtn('#00f0ff')}>🔑 Reset Password</button>
          </div>
        </Card>

        <Card title="Today's Missions">
          <InfoRow label="Games Played" value={user.missions?.gamesPlayed || 0} />
          <InfoRow label="Games Won" value={user.missions?.gamesWon || 0} />
          <InfoRow label="Gamer Mission" value={user.missions?.rewardsClaimed?.m1 ? '✅ Claimed' : '⏳ Pending'} />
          <InfoRow label="Winner Mission" value={user.missions?.rewardsClaimed?.m2 ? '✅ Claimed' : '⏳ Pending'} />
          <InfoRow label="Streak Bonus" value={user.missions?.rewardsClaimed?.bonus_claimed ? '✅ Claimed' : '⏳ Pending'} />
        </Card>
      </div>

      <div style={{ marginTop: 24 }}>
        <Card title={`📜 Transaction History (${actTotal} records)`}>
          {actCurrent.length === 0 ? (
            <div style={{ color: '#8e8e9f', textAlign: 'center', padding: 20 }}>Koi activity nahi</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0d0d1a' }}>
                    {['Game', 'Result', 'Amount', 'Date'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {actCurrent.map((a, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={tdStyle}>{a.gameName || '—'}</td>
                      <td style={tdStyle}><BadgeStatus status={a.result} /></td>
                      <td style={{ ...tdStyle, color: a.result === 'win' || a.result === 'bonus' ? '#39ff14' : '#ff003c', fontWeight: 700 }}>
                        {a.result === 'lose' ? '-' : '+'}{formatNumber(a.amount || 0)} 🪙
                      </td>
                      <td style={{ ...tdStyle, color: '#8e8e9f', fontSize: 12 }}>{formatDate(a.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {actPages > 1 && (
                <div style={{ padding: '12px 0', display: 'flex', gap: 6, justifyContent: 'center' }}>
                  <button onClick={() => setActPage(p => Math.max(1, p - 1))} disabled={actPage === 1} style={pgBtn(false)}>←</button>
                  <span style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 13, padding: '6px 12px' }}>{actPage}/{actPages}</span>
                  <button onClick={() => setActPage(p => Math.min(actPages, p + 1))} disabled={actPage === actPages} style={pgBtn(false)}>→</button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      <ConfirmModal isOpen={modal === 'coins'} title="💰 Coins Adjust" message="Amount aur reason daalo:" confirmText="Adjust Karo" onConfirm={handleCoinAdjust} onCancel={() => setModal(null)}>
        <input type="number" value={coinDelta} onChange={e => setCoinDelta(e.target.value)} placeholder="+500 ya -200" style={inputStyle} />
        <input value={coinReason} onChange={e => setCoinReason(e.target.value)} placeholder="Reason likhna zaruri hai..." style={{ ...inputStyle, marginTop: 10 }} />
      </ConfirmModal>

      <ConfirmModal isOpen={modal === 'ban'} title={user.banned ? '✅ User Unban Karo' : '🚫 User Ban Karo'} message={user.banned ? 'Is user ka ban hatana chahte ho?' : 'Ban karne ka reason daalo:'} confirmText={user.banned ? 'Unban Karo' : 'Ban Karo'} danger={!user.banned} onConfirm={handleBan} onCancel={() => setModal(null)}>
        {!user.banned && <input value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Ban reason (zaruri)..." style={inputStyle} />}
      </ConfirmModal>

      <ConfirmModal isOpen={modal === 'reset'} title="🔑 Password Reset" message={`${user.email} pe password reset email bhejein?`} confirmText="Email Bhejo" onConfirm={handlePasswordReset} onCancel={() => setModal(null)} />
    </AdminLayout>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ background: '#151528', border: '1px solid #1a1a2e', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #1a1a2e' }}>
        <span style={{ color: '#f0f0f5', fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 15 }}>{title}</span>
      </div>
      <div style={{ padding: 20 }}>{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #0d0d1a' }}>
      <span style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 13 }}>{label}</span>
      <span style={{ color: '#f0f0f5', fontFamily: 'Outfit,sans-serif', fontSize: 14, fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  );
}

const actionBtn = (color) => ({ padding: '10px 16px', background: `${color}18`, border: `1px solid ${color}`, borderRadius: 10, color, fontFamily: 'Outfit,sans-serif', fontSize: 13, fontWeight: 600 });
const inputStyle = { width: '100%', padding: '10px 14px', background: '#0d0d1a', border: '1px solid #2a2a4a', borderRadius: 10, color: '#f0f0f5', fontSize: 14, outline: 'none', fontFamily: 'Outfit,sans-serif' };
const thStyle = { padding: '10px 14px', color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 12, fontWeight: 600, textAlign: 'left' };
const tdStyle = { padding: '10px 14px', fontFamily: 'Outfit,sans-serif', fontSize: 14, color: '#f0f0f5' };
const pgBtn = () => ({ padding: '6px 12px', background: 'transparent', border: '1px solid #2a2a4a', borderRadius: 8, color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 14, cursor: 'pointer' });
