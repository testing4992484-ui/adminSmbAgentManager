import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import StatCard from '../components/StatCard';
import BadgeStatus from '../components/BadgeStatus';
import useUsers from '../hooks/useUsers';
import useWithdrawals from '../hooks/useWithdrawals';
import useOrders from '../hooks/useOrders';
import useGamePool from '../hooks/useGamePool';
import { formatNumber, coinsToINR, timeAgo } from '../utils/formatters';

export default function AdminDashboard() {
  const { users, loading: uLoad } = useUsers();
  const { withdrawals, pendingCount, pendingTotal, loading: wLoad } = useWithdrawals();
  const { orders, pendingCount: oPending, loading: oLoad } = useOrders();
  const { gamePool, loading: gLoad } = useGamePool();
  const navigate = useNavigate();

  const recentWithdrawals = withdrawals.slice(0, 5);
  const recentOrders = orders.slice(0, 5);
  const recentUsers = [...users].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5);

  const loading = uLoad || wLoad || oLoad || gLoad;

  return (
    <AdminLayout title="📊 Dashboard">
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />
          ))}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 16, marginBottom: 28 }}>
            <StatCard icon="👥" label="Total Users" value={formatNumber(users.length)} color="#9d00ff" />
            <StatCard icon="💸" label="Pending Withdrawals" value={pendingCount} sub={coinsToINR(pendingTotal)} color="#ff003c" badge={pendingCount} onClick={() => navigate('/admin/withdrawals')} />
            <StatCard icon="🏦" label="House Pool" value={formatNumber(gamePool.housePool || 0)} sub="Coins" color="#ffbe0b" />
            <StatCard icon="🎮" label="Total Games Played" value={formatNumber(gamePool.totalGamesPlayed || 0)} color="#00f0ff" />
            <StatCard icon="🪙" label="Total Coins Won" value={formatNumber(gamePool.totalCoinsWon || 0)} color="#39ff14" />
            <StatCard icon="🛒" label="Pending Orders" value={oPending} color="#ff00d4" badge={oPending} onClick={() => navigate('/admin/orders')} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            <Section title="💸 Recent Withdrawals" onViewAll={() => navigate('/admin/withdrawals')}>
              {recentWithdrawals.length === 0 ? <Empty text="Koi withdrawal nahi" /> : recentWithdrawals.map(w => (
                <Row key={`${w.uid}-${w.wid}`}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#f0f0f5', fontWeight: 600, fontSize: 14 }}>{w.userName || 'Unknown'}</div>
                    <div style={{ color: '#8e8e9f', fontSize: 12 }}>{w.method?.toUpperCase()} · {timeAgo(w.date)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#ffbe0b', fontWeight: 700, fontSize: 14 }}>{formatNumber(w.amount)} 🪙</div>
                    <BadgeStatus status={w.status} />
                  </div>
                </Row>
              ))}
            </Section>

            <Section title="🛒 Recent Orders" onViewAll={() => navigate('/admin/orders')}>
              {recentOrders.length === 0 ? <Empty text="Koi order nahi" /> : recentOrders.map(o => (
                <Row key={o.id}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#f0f0f5', fontWeight: 600, fontSize: 14 }}>{o.userName || 'Unknown'}</div>
                    <div style={{ color: '#8e8e9f', fontSize: 12 }}>{o.product} · {timeAgo(o.date)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#9d00ff', fontWeight: 700, fontSize: 14 }}>₹{o.price}</div>
                    <BadgeStatus status={o.status} />
                  </div>
                </Row>
              ))}
            </Section>

            <Section title="👥 New Users" onViewAll={() => navigate('/admin/users')}>
              {recentUsers.length === 0 ? <Empty text="Koi user nahi" /> : recentUsers.map(u => (
                <Row key={u.uid}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#f0f0f5', fontWeight: 600, fontSize: 14 }}>{u.name || 'No Name'}</div>
                    <div style={{ color: '#8e8e9f', fontSize: 12 }}>{u.email}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#ffbe0b', fontWeight: 600, fontSize: 13 }}>{formatNumber(u.coins || 0)} 🪙</div>
                    <BadgeStatus status={u.banned ? 'banned' : 'active'} />
                  </div>
                </Row>
              ))}
            </Section>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

function Section({ title, onViewAll, children }) {
  return (
    <div style={{ background: '#151528', border: '1px solid #1a1a2e', borderRadius: 16, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#f0f0f5', fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 15 }}>{title}</span>
        <button onClick={onViewAll} style={{ background: 'none', border: 'none', color: '#9d00ff', fontFamily: 'Outfit,sans-serif', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Sab dekho →
        </button>
      </div>
      <div style={{ padding: '8px 0' }}>{children}</div>
    </div>
  );
}

function Row({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: '1px solid #0d0d1a' }}>
      {children}
    </div>
  );
}

function Empty({ text }) {
  return <div style={{ padding: '20px', textAlign: 'center', color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 14 }}>{text}</div>;
}
