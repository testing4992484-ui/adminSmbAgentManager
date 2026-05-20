import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import BadgeStatus from '../components/BadgeStatus';
import ConfirmModal from '../components/ConfirmModal';
import { useAdmin } from '../context/AdminContext';
import useOrders from '../hooks/useOrders';
import { updateOrderStatus, logAdminAction } from '../utils/adminFirebase';
import { formatDate } from '../utils/formatters';
import { exportToCSV, ordersToCSVData } from '../utils/exportCSV';

const STATUS_FILTERS = ['All', 'Pending', 'Fulfilled', 'Cancelled'];
const PER_PAGE = 20;

export default function OrdersPage() {
  const { orders, loading } = useOrders();
  const { adminUser, showToast } = useAdmin();
  const [statusF, setStatusF] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [target, setTarget] = useState(null);

  let filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchQ = !q || (o.userName || '').toLowerCase().includes(q) || (o.product || '').toLowerCase().includes(q);
    const matchS = statusF === 'All' || o.status === statusF.toLowerCase();
    return matchQ && matchS;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const current = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleStatus = async (newStatus) => {
    try {
      await updateOrderStatus(target.id, newStatus);
      await logAdminAction(adminUser.uid, adminUser.email, newStatus === 'fulfilled' ? 'FULFILL_ORDER' : 'CANCEL_ORDER', target.userId, target.status, newStatus);
      showToast(`Order ${newStatus === 'fulfilled' ? 'fulfill' : 'cancel'} ho gaya!`, 'success');
      setModal(null); setTarget(null);
    } catch { showToast('Error aaya!', 'error'); }
  };

  const copyOrder = (o) => {
    const text = `Order Details:\nUser: ${o.userName}\nProduct: ${o.product}\nPlan: ${o.plan}\nPrice: ₹${o.price}\nDate: ${formatDate(o.date)}\nStatus: ${o.status}`;
    navigator.clipboard.writeText(text).then(() => showToast('Order copy ho gaya!', 'success'));
  };

  return (
    <AdminLayout title="🛒 Store Orders">
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="🔍 User ya product..." style={inputStyle} />
        {STATUS_FILTERS.map(f => (
          <button key={f} onClick={() => { setStatusF(f); setPage(1); }} className="admin-btn" style={{ padding: '8px 16px', borderRadius: 20, background: statusF === f ? '#9d00ff' : 'transparent', border: `1px solid ${statusF === f ? '#9d00ff' : '#2a2a4a'}`, color: statusF === f ? '#fff' : '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 13 }}>
            {f}
          </button>
        ))}
        <button onClick={() => exportToCSV(ordersToCSVData(filtered), 'orders')} style={outlineBtn('#9d00ff')}>📥 CSV</button>
      </div>

      <div style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 13, marginBottom: 12 }}>
        Total: {filtered.length} orders
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}</div>
      ) : (
        <div style={{ background: '#151528', border: '1px solid #1a1a2e', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0d0d1a' }}>
                  {['User', 'Product', 'Plan', 'Price', 'Date', 'Status', 'Actions'].map(h => <th key={h} style={thStyle}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {current.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#8e8e9f', fontFamily: 'Outfit,sans-serif' }}>Koi order nahi</td></tr>
                ) : current.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid #1a1a2e' }}>
                    <td style={tdStyle}>
                      <div style={{ color: '#f0f0f5', fontWeight: 600, fontSize: 14 }}>{o.userName || '—'}</div>
                      <div style={{ color: '#8e8e9f', fontSize: 11 }}>{(o.userId || '').slice(0, 10)}...</div>
                    </td>
                    <td style={{ ...tdStyle, color: '#9d00ff', fontWeight: 600 }}>{o.product || '—'}</td>
                    <td style={{ ...tdStyle, color: '#8e8e9f', fontSize: 13 }}>{o.plan || '—'}</td>
                    <td style={{ ...tdStyle, color: '#ffbe0b', fontWeight: 700 }}>₹{o.price || 0}</td>
                    <td style={{ ...tdStyle, color: '#8e8e9f', fontSize: 12 }}>{formatDate(o.date)}</td>
                    <td style={tdStyle}><BadgeStatus status={o.status} /></td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <a href="https://t.me/Munnapm70045" target="_blank" rel="noreferrer" style={{ padding: '5px 10px', background: 'rgba(0,136,204,0.15)', border: '1px solid #0088cc55', borderRadius: 8, color: '#00f0ff', fontSize: 12, fontFamily: 'Outfit,sans-serif', textDecoration: 'none' }}>
                          📱 TG
                        </a>
                        <button onClick={() => copyOrder(o)} style={{ ...outlineBtn('#9d00ff'), padding: '5px 10px', fontSize: 12 }}>📋</button>
                        {o.status === 'pending' && (
                          <>
                            <button onClick={() => { setTarget(o); setModal('fulfill'); }} className="admin-btn" style={{ ...outlineBtn('#39ff14'), padding: '5px 10px', fontSize: 12 }}>✓</button>
                            <button onClick={() => { setTarget(o); setModal('cancel'); }} className="admin-btn" style={{ ...outlineBtn('#ff003c'), padding: '5px 10px', fontSize: 12 }}>✗</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ padding: '14px 20px', borderTop: '1px solid #1a1a2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 13 }}>Page {page}/{totalPages} — {filtered.length} total</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} style={outlineBtn('#8e8e9f')}>←</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} style={outlineBtn('#8e8e9f')}>→</button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmModal isOpen={modal === 'fulfill'} title="✅ Order Fulfill" message={`${target?.product} — ${target?.plan} order fulfill karna chahte ho?`} confirmText="Fulfill Karo" onConfirm={() => handleStatus('fulfilled')} onCancel={() => { setModal(null); setTarget(null); }} />
      <ConfirmModal isOpen={modal === 'cancel'} title="❌ Order Cancel" message="Is order ko cancel karna chahte ho?" confirmText="Cancel Karo" danger onConfirm={() => handleStatus('cancelled')} onCancel={() => { setModal(null); setTarget(null); }} />
    </AdminLayout>
  );
}

const inputStyle = { flex: 1, minWidth: 200, padding: '10px 14px', background: '#151528', border: '1px solid #2a2a4a', borderRadius: 12, color: '#f0f0f5', fontSize: 14, outline: 'none', fontFamily: 'Outfit,sans-serif' };
const outlineBtn = (color) => ({ padding: '8px 14px', background: `${color}18`, border: `1px solid ${color}55`, borderRadius: 10, color, fontFamily: 'Outfit,sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-block' });
const thStyle = { padding: '12px 14px', color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 12, fontWeight: 600, textAlign: 'left', whiteSpace: 'nowrap' };
const tdStyle = { padding: '12px 14px', fontFamily: 'Outfit,sans-serif', verticalAlign: 'middle' };
