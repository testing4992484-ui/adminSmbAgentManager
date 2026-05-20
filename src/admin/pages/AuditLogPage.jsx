import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import BadgeStatus from '../components/BadgeStatus';
import { db } from '../../config/firebase';
import { ref, onValue } from 'firebase/database';
import { formatTimestamp } from '../utils/formatters';
import { useEffect } from 'react';

const ACTION_COLORS = {
  BAN_USER:             '#ff003c',
  UNBAN_USER:           '#39ff14',
  ADJUST_COINS:         '#ffbe0b',
  APPROVE_WITHDRAWAL:   '#39ff14',
  REJECT_WITHDRAWAL:    '#ff003c',
  FULFILL_ORDER:        '#00f0ff',
  CANCEL_ORDER:         '#ff003c',
  REMOVE_LEADERBOARD:   '#ff003c',
  SET_FEATURED_PLAYER:  '#9d00ff',
  WEEKLY_RESET_LEADERBOARD: '#ff003c',
  UPDATE_SETTING:       '#00f0ff',
  TOGGLE_SETTING:       '#9d00ff',
  ADJUST_HOUSE_POOL:    '#ffbe0b',
  PASSWORD_RESET:       '#00f0ff',
  SEND_NOTIFICATION:    '#9d00ff',
  BROADCAST_NOTIFICATION: '#ff00d4',
};

const PER_PAGE = 20;

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const unsub = onValue(ref(db, 'adminLogs'), (snap) => {
      const data = snap.val() || {};
      const list = Object.entries(data).map(([id, val]) => ({ id, ...val })).sort((a, b) => b.timestamp - a.timestamp);
      setLogs(list);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const actions = ['All', ...new Set(logs.map(l => l.action))];

  let filtered = logs.filter(l => {
    const matchAction = actionFilter === 'All' || l.action === actionFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || (l.targetUserId || '').toLowerCase().includes(q) || (l.adminEmail || '').toLowerCase().includes(q) || (l.action || '').toLowerCase().includes(q);
    return matchAction && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const current = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const parseVal = (v) => {
    if (!v || v === 'null') return '—';
    try { const p = JSON.parse(v); return typeof p === 'object' ? JSON.stringify(p).slice(0, 60) + '...' : String(p); }
    catch { return String(v).slice(0, 60); }
  };

  return (
    <AdminLayout title="📋 Audit Log">
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="🔍 Action, UID, email..." style={inputStyle} />
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }} style={selectStyle}>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 13, marginBottom: 12 }}>
        {filtered.length} logs mili
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[...Array(8)].map((_, i) => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10 }} />)}</div>
      ) : (
        <div style={{ background: '#151528', border: '1px solid #1a1a2e', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0d0d1a' }}>
                  {['Time', 'Admin', 'Action', 'Target UID', 'Old Value', 'New Value'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {current.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#8e8e9f', fontFamily: 'Outfit,sans-serif' }}>Koi log nahi mili</td></tr>
                ) : current.map(l => {
                  const color = ACTION_COLORS[l.action] || '#8e8e9f';
                  return (
                    <tr key={l.id} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={{ ...tdStyle, color: '#8e8e9f', fontSize: 11, whiteSpace: 'nowrap' }}>{formatTimestamp(l.timestamp)}</td>
                      <td style={{ ...tdStyle, color: '#f0f0f5', fontSize: 12 }}>{(l.adminEmail || '').split('@')[0]}</td>
                      <td style={tdStyle}>
                        <span style={{ background: `${color}18`, border: `1px solid ${color}55`, borderRadius: 6, padding: '3px 8px', color, fontFamily: 'Outfit,sans-serif', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {l.action}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, color: '#8e8e9f', fontSize: 11 }}>{l.targetUserId ? l.targetUserId.slice(0, 14) + '...' : '—'}</td>
                      <td style={{ ...tdStyle, color: '#ff003c', fontSize: 11, maxWidth: 120, overflow: 'hidden' }}>{parseVal(l.oldValue)}</td>
                      <td style={{ ...tdStyle, color: '#39ff14', fontSize: 11, maxWidth: 120, overflow: 'hidden' }}>{parseVal(l.newValue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ padding: '14px 20px', borderTop: '1px solid #1a1a2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 13 }}>Page {page}/{totalPages} — {filtered.length} total</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} style={pgBtn}>←</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} style={pgBtn}>→</button>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}

const inputStyle = { flex: 1, minWidth: 200, padding: '10px 14px', background: '#151528', border: '1px solid #2a2a4a', borderRadius: 12, color: '#f0f0f5', fontSize: 14, outline: 'none', fontFamily: 'Outfit,sans-serif' };
const selectStyle = { padding: '10px 14px', background: '#151528', border: '1px solid #2a2a4a', borderRadius: 12, color: '#f0f0f5', fontSize: 13, outline: 'none', fontFamily: 'Outfit,sans-serif', cursor: 'pointer' };
const thStyle = { padding: '12px 14px', color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 12, fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' };
const tdStyle = { padding: '12px 14px', fontFamily: 'Outfit,sans-serif', verticalAlign: 'middle' };
const pgBtn = { padding: '7px 14px', background: 'transparent', border: '1px solid #2a2a4a', borderRadius: 8, color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 14, cursor: 'pointer' };
