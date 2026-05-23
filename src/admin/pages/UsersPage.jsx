import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import BadgeStatus from '../components/BadgeStatus';
import UserAvatar from '../components/UserAvatar';
import useUsers from '../hooks/useUsers';
import { formatNumber, formatDateOnly, timeAgo } from '../utils/formatters';

const FILTERS = ['All', 'Banned', 'High Balance', 'Inactive'];
const SORTS   = ['Coins ↓', 'Coins ↑', 'Newest', 'Oldest'];
const PER_PAGE = 20;

export default function UsersPage() {
  const { users, loading } = useUsers();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('Coins ↓');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const now = Date.now();

  let filtered = users.filter(u => {
    const q = search.toLowerCase();
    return !q || (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.uid || '').toLowerCase().includes(q) ||
      (u.referralCode || '').toLowerCase().includes(q);
  });

  if (filter === 'Banned') filtered = filtered.filter(u => u.banned);
  if (filter === 'High Balance') filtered = filtered.filter(u => (u.coins || 0) >= 10000);
  if (filter === 'Inactive') filtered = filtered.filter(u => !u.lastActive || now - u.lastActive > 7 * 86400000);

  if (sort === 'Coins ↓') filtered.sort((a, b) => (b.coins || 0) - (a.coins || 0));
  if (sort === 'Coins ↑') filtered.sort((a, b) => (a.coins || 0) - (b.coins || 0));
  if (sort === 'Newest')  filtered.sort((a, b) => (b.createdAt || (b.joinedAt ? new Date(b.joinedAt).getTime() : 0)) - (a.createdAt || (a.joinedAt ? new Date(a.joinedAt).getTime() : 0)));
  if (sort === 'Oldest')  filtered.sort((a, b) => (a.createdAt || (a.joinedAt ? new Date(a.joinedAt).getTime() : 0)) - (b.createdAt || (b.joinedAt ? new Date(b.joinedAt).getTime() : 0)));

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const current = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSearch = (v) => { setSearch(v); setPage(1); };
  const handleFilter = (f) => { setFilter(f); setPage(1); };
  const handleSort   = (s) => { setSort(s); setPage(1); };

  return (
    <AdminLayout title="👥 User Management">
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          value={search} onChange={e => handleSearch(e.target.value)}
          placeholder="🔍 Name, email, UID, referral code..."
          style={{
            flex: 1, minWidth: 220, padding: '10px 16px',
            background: '#151528', border: '1px solid #2a2a4a',
            borderRadius: 12, color: '#f0f0f5', fontSize: 14,
            outline: 'none', fontFamily: 'Outfit,sans-serif'
          }}
        />
        <select value={filter} onChange={e => handleFilter(e.target.value)} style={selectStyle}>
          {FILTERS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
        <select value={sort} onChange={e => handleSort(e.target.value)} style={selectStyle}>
          {SORTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 13, marginBottom: 12 }}>
        Total: {filtered.length} users
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 12 }} />)}
        </div>
      ) : current.length === 0 ? (
        <Empty />
      ) : (
        <div style={{ background: '#151528', border: '1px solid #1a1a2e', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0d0d1a' }}>
                  {['User', 'Email', 'Coins', 'Streak', 'Status', 'Joined', 'Action'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {current.map((u, i) => (
                  <tr key={u.uid} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(13,13,26,0.4)', borderBottom: '1px solid #1a1a2e' }}>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <UserAvatar name={u.name} size={32} />
                        <span style={{ color: '#f0f0f5', fontSize: 14, fontWeight: 600 }}>{u.name || '—'}</span>
                      </div>
                    </td>
                    <td style={{ ...tdStyle, color: '#8e8e9f', fontSize: 13 }}>{u.email || '—'}</td>
                    <td style={{ ...tdStyle, color: '#ffbe0b', fontWeight: 700 }}>{formatNumber(u.coins || 0)} 🪙</td>
                    <td style={{ ...tdStyle, color: '#00f0ff', textAlign: 'center' }}>{u.streak || 0} 🔥</td>
                    <td style={tdStyle}><BadgeStatus status={u.banned ? 'banned' : 'active'} /></td>
                    <td style={{ ...tdStyle, color: '#8e8e9f', fontSize: 12 }}>{(u.createdAt || u.joinedAt) ? formatDateOnly(u.joinedAt ? new Date(u.joinedAt).toISOString() : new Date(u.createdAt).toISOString()) : '—'}</td>
                    <td style={tdStyle}>
                      <button onClick={() => navigate(`/admin/users/${u.uid}`)} className="admin-btn" style={btnStyle('#9d00ff')}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} total={filtered.length} onChange={setPage} />
        </div>
      )}
    </AdminLayout>
  );
}

function Empty() {
  return <div style={{ textAlign: 'center', padding: 60, color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 16 }}>
    😕 Koi user nahi mila
  </div>;
}

function Pagination({ page, totalPages, total, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ padding: '14px 20px', borderTop: '1px solid #1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
      <span style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 13 }}>
        Page {page} of {totalPages} — Total {total} records
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} style={pageBtn(false)}>← Pehla</button>
        {[...Array(Math.min(5, totalPages))].map((_, i) => {
          const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
          return <button key={p} onClick={() => onChange(p)} style={pageBtn(p === page)}>{p}</button>;
        })}
        <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} style={pageBtn(false)}>Agla →</button>
      </div>
    </div>
  );
}

const thStyle = { padding: '12px 16px', color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 12, fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' };
const tdStyle = { padding: '12px 16px', fontFamily: 'Outfit,sans-serif' };
const selectStyle = { padding: '10px 14px', background: '#151528', border: '1px solid #2a2a4a', borderRadius: 12, color: '#f0f0f5', fontSize: 13, outline: 'none', fontFamily: 'Outfit,sans-serif', cursor: 'pointer' };
const btnStyle = (color) => ({ padding: '6px 14px', background: `${color}22`, border: `1px solid ${color}`, borderRadius: 8, color, fontFamily: 'Outfit,sans-serif', fontSize: 13, fontWeight: 600 });
const pageBtn = (active) => ({ padding: '6px 12px', background: active ? '#9d00ff' : 'transparent', border: '1px solid #2a2a4a', borderRadius: 8, color: active ? '#fff' : '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 13, cursor: 'pointer' });
