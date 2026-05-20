import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import BadgeStatus from '../components/BadgeStatus';
import UserAvatar from '../components/UserAvatar';
import ConfirmModal from '../components/ConfirmModal';
import { useAdmin } from '../context/AdminContext';
import useWithdrawals from '../hooks/useWithdrawals';
import { updateWithdrawalStatus, logAdminAction } from '../utils/adminFirebase';
import { formatDate, formatNumber, coinsToINR } from '../utils/formatters';
import { exportToCSV, withdrawalsToCSVData } from '../utils/exportCSV';

const FILTERS  = ['All', 'Pending', 'Approved', 'Rejected'];
const METHODS  = ['All', 'UPI', 'PayPal', 'PlayStore'];
const PER_PAGE = 15;

export default function WithdrawalsPage() {
  const { withdrawals, loading, pendingCount, pendingTotal } = useWithdrawals();
  const { adminUser, showToast } = useAdmin();
  const [statusF, setStatusF] = useState('All');
  const [methodF, setMethodF] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [modal, setModal] = useState(null);
  const [target, setTarget] = useState(null);

  let filtered = withdrawals.filter(w => {
    const q = search.toLowerCase();
    const matchQ = !q || (w.userName || '').toLowerCase().includes(q) || (w.uid || '').toLowerCase().includes(q) || (w.account || '').toLowerCase().includes(q);
    const matchS = statusF === 'All' || w.status === statusF.toLowerCase();
    const matchM = methodF === 'All' || (w.method || '').toLowerCase() === methodF.toLowerCase();
    return matchQ && matchS && matchM;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const current = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleAction = async (action) => {
    const items = target ? [target] : Array.from(selected).map(k => {
      const [uid, wid] = k.split('::');
      return withdrawals.find(w => w.uid === uid && w.wid === wid);
    }).filter(Boolean);

    for (const w of items) {
      try {
        await updateWithdrawalStatus(w.uid, w.wid, action);
        await logAdminAction(adminUser.uid, adminUser.email, action === 'approved' ? 'APPROVE_WITHDRAWAL' : 'REJECT_WITHDRAWAL', w.uid, w.status, action);
      } catch { showToast('Kuch items update nahi hue!', 'error'); }
    }
    showToast(`${items.length} withdrawal(s) ${action === 'approved' ? 'approve' : 'reject'} ho gaye!`, 'success');
    setSelected(new Set());
    setModal(null);
    setTarget(null);
  };

  const toggleSelect = (key) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  };

  const toggleAll = () => {
    if (selected.size === current.length) setSelected(new Set());
    else setSelected(new Set(current.map(w => `${w.uid}::${w.wid}`)));
  };

  return (
    <AdminLayout title="💸 Withdrawal Management">
      <div style={{ background: 'rgba(255,0,60,0.08)', border: '1px solid #ff003c44', borderRadius: 12, padding: '12px 20px', marginBottom: 20, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <span style={{ color: '#ff003c', fontFamily: 'Outfit,sans-serif', fontWeight: 700 }}>🔴 Pending: {pendingCount}</span>
        <span style={{ color: '#ffbe0b', fontFamily: 'Outfit,sans-serif', fontWeight: 700 }}>💰 Total: {formatNumber(pendingTotal)} coins = {coinsToINR(pendingTotal)}</span>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="🔍 User ya account..." style={inputStyle} />
        {FILTERS.map(f => <FilterBtn key={f} active={statusF === f} onClick={() => { setStatusF(f); setPage(1); }}>{f}</FilterBtn>)}
        <select value={methodF} onChange={e => { setMethodF(e.target.value); setPage(1); }} style={selectStyle}>
          {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <button onClick={() => exportToCSV(withdrawalsToCSVData(filtered), 'withdrawals')} style={outlineBtn('#9d00ff')}>📥 CSV Export</button>
      </div>

      {selected.size > 0 && (
        <div style={{ background: '#151528', border: '1px solid #9d00ff44', borderRadius: 12, padding: '10px 16px', marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 14 }}>{selected.size} selected</span>
          <button onClick={() => { setTarget(null); setModal('approve'); }} style={outlineBtn('#39ff14')}>✓ Bulk Approve</button>
          <button onClick={() => { setTarget(null); setModal('reject'); }} style={outlineBtn('#ff003c')}>✗ Bulk Reject</button>
        </div>
      )}

      {loading ? <Skeletons /> : (
        <div style={{ background: '#151528', border: '1px solid #1a1a2e', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0d0d1a' }}>
                  <th style={thStyle}><input type="checkbox" checked={selected.size === current.length && current.length > 0} onChange={toggleAll} /></th>
                  {['User', 'Amount', 'Method', 'Account', 'Date', 'Status', 'Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {current.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#8e8e9f', fontFamily: 'Outfit,sans-serif' }}>Koi withdrawal nahi mili</td></tr>
                ) : current.map(w => {
                  const key = `${w.uid}::${w.wid}`;
                  return (
                    <tr key={key} style={{ borderBottom: '1px solid #1a1a2e' }}>
                      <td style={tdStyle}><input type="checkbox" checked={selected.has(key)} onChange={() => toggleSelect(key)} /></td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <UserAvatar name={w.userName} size={28} />
                          <div>
                            <div style={{ color: '#f0f0f5', fontSize: 13, fontWeight: 600 }}>{w.userName || '—'}</div>
                            <div style={{ color: '#8e8e9f', fontSize: 11 }}>{w.uid.slice(0, 10)}...</div>
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ color: '#ffbe0b', fontWeight: 700 }}>{formatNumber(w.amount || 0)} 🪙</div>
                        <div style={{ color: '#8e8e9f', fontSize: 12 }}>{coinsToINR(w.amount || 0)}</div>
                      </td>
                      <td style={{ ...tdStyle, color: '#f0f0f5', textTransform: 'uppercase', fontSize: 12, fontWeight: 600 }}>{w.method || '—'}</td>
                      <td style={{ ...tdStyle, color: '#8e8e9f', fontSize: 12, maxWidth: 140, wordBreak: 'break-all' }}>{w.account || '—'}</td>
                      <td style={{ ...tdStyle, color: '#8e8e9f', fontSize: 12 }}>{formatDate(w.date)}</td>
                      <td style={tdStyle}><BadgeStatus status={w.status} /></td>
                      <td style={tdStyle}>
                        {w.status === 'pending' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => { setTarget(w); setModal('approve'); }} className="admin-btn" style={outlineBtn('#39ff14')}>✓</button>
                            <button onClick={() => { setTarget(w); setModal('reject'); }} className="admin-btn" style={outlineBtn('#ff003c')}>✗</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <PaginationBar page={page} totalPages={totalPages} total={filtered.length} onChange={setPage} />
        </div>
      )}

      <ConfirmModal isOpen={modal === 'approve'} title="✅ Withdrawal Approve" message={`${target ? '1 withdrawal' : `${selected.size} withdrawals`} approve karna chahte ho?`} confirmText="Approve Karo" onConfirm={() => handleAction('approved')} onCancel={() => { setModal(null); setTarget(null); }} />
      <ConfirmModal isOpen={modal === 'reject'} title="❌ Withdrawal Reject" message={`${target ? '1 withdrawal' : `${selected.size} withdrawals`} reject karna chahte ho?`} confirmText="Reject Karo" danger onConfirm={() => handleAction('rejected')} onCancel={() => { setModal(null); setTarget(null); }} />
    </AdminLayout>
  );
}

const Skeletons = () => <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10 }} />)}</div>;
const FilterBtn = ({ active, onClick, children }) => (
  <button onClick={onClick} className="admin-btn" style={{ padding: '8px 16px', borderRadius: 20, background: active ? '#9d00ff' : 'transparent', border: `1px solid ${active ? '#9d00ff' : '#2a2a4a'}`, color: active ? '#fff' : '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 13, fontWeight: active ? 700 : 400 }}>{children}</button>
);
const PaginationBar = ({ page, totalPages, total, onChange }) => {
  if (totalPages <= 1) return null;
  return <div style={{ padding: '14px 20px', borderTop: '1px solid #1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
    <span style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 13 }}>Page {page} of {totalPages} — {total} records</span>
    <div style={{ display: 'flex', gap: 6 }}>
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} style={outlineBtn('#8e8e9f')}>←</button>
      <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} style={outlineBtn('#8e8e9f')}>→</button>
    </div>
  </div>;
};

const inputStyle = { flex: 1, minWidth: 200, padding: '10px 14px', background: '#151528', border: '1px solid #2a2a4a', borderRadius: 12, color: '#f0f0f5', fontSize: 14, outline: 'none', fontFamily: 'Outfit,sans-serif' };
const selectStyle = { padding: '9px 14px', background: '#151528', border: '1px solid #2a2a4a', borderRadius: 12, color: '#f0f0f5', fontSize: 13, outline: 'none', fontFamily: 'Outfit,sans-serif', cursor: 'pointer' };
const outlineBtn = (color) => ({ padding: '8px 14px', background: `${color}18`, border: `1px solid ${color}55`, borderRadius: 10, color, fontFamily: 'Outfit,sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' });
const thStyle = { padding: '12px 14px', color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 12, fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' };
const tdStyle = { padding: '12px 14px', fontFamily: 'Outfit,sans-serif', verticalAlign: 'middle' };
