import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import UserAvatar from '../components/UserAvatar';
import useUsers from '../hooks/useUsers';
import { formatNumber, coinsToINR } from '../utils/formatters';

export default function ReferralsPage() {
  const { users, loading } = useUsers();
  const [search, setSearch] = useState('');

  const referrerMap = {};
  users.forEach(u => {
    if (u.referredBy) {
      if (!referrerMap[u.referredBy]) referrerMap[u.referredBy] = { count: 0, uids: [] };
      referrerMap[u.referredBy].count++;
      referrerMap[u.referredBy].uids.push(u.uid);
    }
  });

  const topReferrers = users
    .filter(u => referrerMap[u.uid])
    .map(u => ({
      ...u,
      referralCount: referrerMap[u.uid]?.count || 0,
    }))
    .sort((a, b) => b.referralCount - a.referralCount);

  const totalCommissionPaid = users.reduce((sum, u) => {
    const acts = Object.values(u.activity || {});
    const commissions = acts.filter(a => a.gameName === 'Commission Bonus' || a.gameName === 'Referral Bonus');
    return sum + commissions.reduce((s, a) => s + (a.amount || 0), 0);
  }, 0);

  const today = new Date();
  const fraudAlerts = Object.entries(referrerMap).filter(([uid, data]) => {
    const referredUsers = users.filter(u => data.uids.includes(u.uid));
    const todayRefs = referredUsers.filter(u => {
      if (!u.createdAt) return false;
      const d = new Date(u.createdAt);
      return d.toDateString() === today.toDateString();
    });
    return todayRefs.length >= 5;
  });

  const filteredReferrers = topReferrers.filter(u => {
    const q = search.toLowerCase();
    return !q || (u.name || '').toLowerCase().includes(q) || (u.referralCode || '').toLowerCase().includes(q);
  });

  return (
    <AdminLayout title="🔗 Referral Monitoring">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatBox label="🔗 Total Referrers" value={topReferrers.length} color="#9d00ff" />
        <StatBox label="👥 Total Referred" value={Object.values(referrerMap).reduce((s, v) => s + v.count, 0)} color="#00f0ff" />
        <StatBox label="💰 Commission Paid" value={formatNumber(totalCommissionPaid)} sub="coins" color="#ffbe0b" />
        {fraudAlerts.length > 0 && <StatBox label="🚨 Fraud Alerts" value={fraudAlerts.length} color="#ff003c" />}
      </div>

      {fraudAlerts.length > 0 && (
        <div style={{ background: 'rgba(255,0,60,0.05)', border: '1px solid #ff003c44', borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <div style={{ color: '#ff003c', fontFamily: 'Outfit,sans-serif', fontWeight: 700, marginBottom: 10 }}>🚨 Fraud Alert — Aaj 5+ referrals:</div>
          {fraudAlerts.map(([uid]) => {
            const u = users.find(x => x.uid === uid);
            return <div key={uid} style={{ color: '#f0f0f5', fontFamily: 'Outfit,sans-serif', fontSize: 14, padding: '4px 0' }}>
              {u?.name || uid} — Code: {u?.referralCode || '—'}
            </div>;
          })}
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Name ya referral code..." style={{ width: '100%', maxWidth: 340, padding: '10px 14px', background: '#151528', border: '1px solid #2a2a4a', borderRadius: 12, color: '#f0f0f5', fontSize: 14, outline: 'none', fontFamily: 'Outfit,sans-serif' }} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 12 }} />)}</div>
      ) : (
        <div style={{ background: '#151528', border: '1px solid #1a1a2e', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0d0d1a' }}>
                  {['#', 'User', 'Referral Code', 'Referrals', 'Commission Earned', 'Current Coins'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredReferrers.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#8e8e9f', fontFamily: 'Outfit,sans-serif' }}>Koi referrer nahi mila</td></tr>
                ) : filteredReferrers.map((u, i) => {
                  const commissionActs = Object.values(u.activity || {}).filter(a => a.gameName === 'Commission Bonus');
                  const commission = commissionActs.reduce((s, a) => s + (a.amount || 0), 0);
                  return (
                    <tr key={u.uid} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ ...thStyle, color: '#8e8e9f', fontWeight: 400 }}>#{i + 1}</td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <UserAvatar name={u.name} size={30} />
                          <div>
                            <div style={{ color: '#f0f0f5', fontSize: 14, fontWeight: 600 }}>{u.name || '—'}</div>
                            <div style={{ color: '#8e8e9f', fontSize: 12 }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, color: '#9d00ff', fontWeight: 700 }}>{u.referralCode || '—'}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', color: '#00f0ff', fontWeight: 700, fontSize: 18 }}>{u.referralCount}</td>
                      <td style={{ ...tdStyle, color: '#ffbe0b', fontWeight: 700 }}>{formatNumber(commission)} 🪙</td>
                      <td style={{ ...tdStyle, color: '#39ff14', fontWeight: 700 }}>{formatNumber(u.coins || 0)} 🪙</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

const StatBox = ({ label, value, sub, color }) => (
  <div style={{ background: '#151528', border: `1px solid ${color}33`, borderRadius: 14, padding: 16 }}>
    <div style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 12, marginBottom: 4 }}>{label}</div>
    <div style={{ color, fontFamily: 'Outfit,sans-serif', fontSize: 24, fontWeight: 800 }}>{value}</div>
    {sub && <div style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 12 }}>{sub}</div>}
  </div>
);
const thStyle = { padding: '12px 14px', color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 12, fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' };
const tdStyle = { padding: '12px 14px', fontFamily: 'Outfit,sans-serif', verticalAlign: 'middle' };
