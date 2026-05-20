import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useAdmin } from '../context/AdminContext';
import useUsers from '../hooks/useUsers';
import { sendNotificationToUser, sendBroadcastNotification, logAdminAction } from '../utils/adminFirebase';
import { db } from '../../config/firebase';
import { ref, onValue } from 'firebase/database';
import { formatTimestamp } from '../utils/formatters';

export default function NotificationsPage() {
  const { adminUser, showToast } = useAdmin();
  const { users } = useUsers();
  const [mode, setMode] = useState('broadcast');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetUid, setTargetUid] = useState('');
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const unsub = onValue(ref(db, 'adminLogs'), (snap) => {
      const data = snap.val() || {};
      const notifs = Object.values(data)
        .filter(l => l.action === 'SEND_NOTIFICATION' || l.action === 'BROADCAST_NOTIFICATION')
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20);
      setHistory(notifs);
    });
    return () => unsub();
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) { showToast('Title aur body dono likhna zaruri hai!', 'error'); return; }
    if (mode === 'targeted' && !targetUid.trim()) { showToast('Target UID daalo!', 'error'); return; }
    setSending(true);
    try {
      if (mode === 'broadcast') {
        await sendBroadcastNotification(title, body, users.map(u => u.uid));
        await logAdminAction(adminUser.uid, adminUser.email, 'BROADCAST_NOTIFICATION', null, null, { title, body });
        showToast(`Sab ${users.length} users ko notification gayi!`, 'success');
      } else {
        await sendNotificationToUser(targetUid, title, body);
        await logAdminAction(adminUser.uid, adminUser.email, 'SEND_NOTIFICATION', targetUid, null, { title, body });
        showToast('Notification bheji gayi!', 'success');
      }
      setTitle(''); setBody(''); setTargetUid('');
    } catch { showToast('Notification nahi gayi!', 'error'); }
    setSending(false);
  };

  return (
    <AdminLayout title="🔔 Push Notifications">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <Card title="📤 Notification Bhejo">
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {['broadcast', 'targeted'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '10px', borderRadius: 10, background: mode === m ? '#9d00ff' : 'transparent', border: `1px solid ${mode === m ? '#9d00ff' : '#2a2a4a'}`, color: mode === m ? '#fff' : '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                {m === 'broadcast' ? '📢 Broadcast' : '🎯 Targeted'}
              </button>
            ))}
          </div>

          {mode === 'targeted' && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Target User UID</label>
              <input value={targetUid} onChange={e => setTargetUid(e.target.value)} placeholder="User ka Firebase UID..." style={inputStyle} />
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Double Coins Event! 🎉" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Message</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={4} placeholder="Aaj raat 12 baje tak 2x coins milenge. Abhi khelo!" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
          </div>

          <div style={{ background: '#0d0d1a', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ color: '#8e8e9f', fontSize: 12, fontFamily: 'Outfit,sans-serif', marginBottom: 6 }}>Preview:</div>
            <div style={{ color: '#f0f0f5', fontWeight: 700, fontFamily: 'Outfit,sans-serif', fontSize: 15 }}>{title || 'Notification Title'}</div>
            <div style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 13, marginTop: 4 }}>{body || 'Notification body yahan aayegi...'}</div>
          </div>

          <button onClick={handleSend} disabled={sending} className="admin-btn" style={{ width: '100%', padding: '14px', background: '#9d00ff', border: 'none', borderRadius: 12, color: '#fff', fontFamily: 'Outfit,sans-serif', fontSize: 15, fontWeight: 700, boxShadow: '0 0 20px #9d00ff44', opacity: sending ? 0.7 : 1 }}>
            {sending ? 'Bheji ja rahi hai...' : mode === 'broadcast' ? `📢 Sab ${users.length} Users Ko Bhejo` : '🎯 Is User Ko Bhejo'}
          </button>
        </Card>

        <Card title="📋 Notification History (Last 20)">
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#8e8e9f', fontFamily: 'Outfit,sans-serif' }}>Koi notification nahi bheji abhi tak</div>
          ) : history.map((n, i) => {
            const data = n.newValue ? JSON.parse(n.newValue) : {};
            return (
              <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid #0d0d1a' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#9d00ff', fontFamily: 'Outfit,sans-serif', fontSize: 12, fontWeight: 600 }}>
                    {n.action === 'BROADCAST_NOTIFICATION' ? '📢 Broadcast' : '🎯 Targeted'}
                  </span>
                  <span style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 11 }}>{formatTimestamp(n.timestamp)}</span>
                </div>
                <div style={{ color: '#f0f0f5', fontFamily: 'Outfit,sans-serif', fontSize: 14, fontWeight: 600 }}>{data.title || '—'}</div>
                <div style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 12, marginTop: 2 }}>{data.body || '—'}</div>
              </div>
            );
          })}
        </Card>
      </div>
    </AdminLayout>
  );
}

const Card = ({ title, children }) => (
  <div style={{ background: '#151528', border: '1px solid #1a1a2e', borderRadius: 16, padding: 20 }}>
    <div style={{ color: '#f0f0f5', fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>{title}</div>
    {children}
  </div>
);
const labelStyle = { display: 'block', color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 12, fontWeight: 500, marginBottom: 6 };
const inputStyle = { width: '100%', padding: '10px 14px', background: '#0d0d1a', border: '1px solid #2a2a4a', borderRadius: 10, color: '#f0f0f5', fontSize: 14, outline: 'none', fontFamily: 'Outfit,sans-serif' };
