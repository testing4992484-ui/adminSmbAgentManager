import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import BadgeStatus from '../components/BadgeStatus';
import UserAvatar from '../components/UserAvatar';
import ConfirmModal from '../components/ConfirmModal';
import { useAdmin } from '../context/AdminContext';
import useUsers from '../hooks/useUsers';
import { banUser, logAdminAction } from '../utils/adminFirebase';
import { formatDate, formatDateOnly } from '../utils/formatters';

export default function BannedUsersPage() {
  const { users, loading } = useUsers();
  const { adminUser, showToast } = useAdmin();
  const [modal, setModal] = useState(null);
  const [target, setTarget] = useState(null);

  const now = Date.now();
  const banned = users.filter(u => u.banned);
  const expiredBans = banned.filter(u => u.banExpiry && u.banExpiry < now);

  const handleUnban = async () => {
    try {
      await banUser(target.uid, false, '');
      await logAdminAction(adminUser.uid, adminUser.email, 'UNBAN_USER', target.uid, true, false);
      showToast(`${target.name || 'User'} unban ho gaya!`, 'success');
      setModal(null); setTarget(null);
    } catch { showToast('Error aaya!', 'error'); }
  };

  return (
    <AdminLayout title="🚫 Banned Users">
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, flexWrap: 'wrap' }}>
        <StatBox label="🚫 Total Banned" value={banned.length} color="#ff003c" />
        {expiredBans.length > 0 && <StatBox label="⏰ Expired Bans" value={expiredBans.length} color="#ffbe0b" />}
      </div>

      {expiredBans.length > 0 && (
        <div style={{ background: 'rgba(255,190,11,0.05)', border: '1px solid #ffbe0b44', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
          <span style={{ color: '#ffbe0b', fontFamily: 'Outfit,sans-serif', fontSize: 13, fontWeight: 600 }}>
            ⏰ {expiredBans.length} users ki ban expiry ho gayi hai — unban karo!
          </span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 70, borderRadius: 12 }} />)}</div>
      ) : banned.length === 0 ? (
        <Empty />
      ) : (
        <div style={{ background: '#151528', border: '1px solid #1a1a2e', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0d0d1a' }}>
                  {['User', 'Email', 'Ban Reason', 'Ban Date', 'Expiry', 'Action'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {banned.map(u => {
                  const expired = u.banExpiry && u.banExpiry < now;
                  return (
                    <tr key={u.uid} style={{ borderBottom: '1px solid #1a1a2e', background: expired ? 'rgba(255,190,11,0.03)' : 'transparent' }}>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <UserAvatar name={u.name} size={30} />
                          <span style={{ color: '#f0f0f5', fontWeight: 600, fontSize: 14 }}>{u.name || '—'}</span>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, color: '#8e8e9f', fontSize: 13 }}>{u.email || '—'}</td>
                      <td style={{ ...tdStyle, color: '#ff003c', fontSize: 13 }}>{u.banReason || '—'}</td>
                      <td style={{ ...tdStyle, color: '#8e8e9f', fontSize: 12 }}>{u.createdAt ? '—' : '—'}</td>
                      <td style={tdStyle}>
                        {u.banExpiry ? (
                          <span style={{ color: expired ? '#ffbe0b' : '#8e8e9f', fontSize: 12, fontFamily: 'Outfit,sans-serif' }}>
                            {expired ? '⏰ Expired' : formatDateOnly(new Date(u.banExpiry).toISOString())}
                          </span>
                        ) : <span style={{ color: '#ff003c', fontSize: 12 }}>Permanent</span>}
                      </td>
                      <td style={tdStyle}>
                        <button onClick={() => { setTarget(u); setModal('unban'); }} className="admin-btn" style={{ padding: '7px 14px', background: 'rgba(57,255,20,0.1)', border: '1px solid #39ff1455', borderRadius: 8, color: '#39ff14', fontFamily: 'Outfit,sans-serif', fontSize: 13, fontWeight: 600 }}>
                          ✅ Unban
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

      <ConfirmModal isOpen={modal === 'unban'} title="✅ User Unban Karo" message={`${target?.name || 'User'} ko unban karna chahte ho? Woh dobara login kar sakenge.`} confirmText="Unban Karo" onConfirm={handleUnban} onCancel={() => { setModal(null); setTarget(null); }} />
    </AdminLayout>
  );
}

const StatBox = ({ label, value, color }) => (
  <div style={{ background: '#151528', border: `1px solid ${color}33`, borderRadius: 14, padding: '14px 20px' }}>
    <div style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 12 }}>{label}</div>
    <div style={{ color, fontFamily: 'Outfit,sans-serif', fontSize: 26, fontWeight: 800 }}>{value}</div>
  </div>
);
const Empty = () => <div style={{ textAlign: 'center', padding: 60, color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 16 }}>✅ Koi banned user nahi hai!</div>;
const thStyle = { padding: '12px 14px', color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 12, fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' };
const tdStyle = { padding: '12px 14px', fontFamily: 'Outfit,sans-serif', verticalAlign: 'middle' };
