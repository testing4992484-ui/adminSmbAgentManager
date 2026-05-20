import { NavLink, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import useWithdrawals from '../hooks/useWithdrawals';
import useOrders from '../hooks/useOrders';

const NAV = [
  { icon: '📊', label: 'Dashboard',    path: '/admin',              exact: true },
  { icon: '👥', label: 'Users',        path: '/admin/users' },
  { icon: '💸', label: 'Withdrawals',  path: '/admin/withdrawals',  badge: 'withdrawals' },
  { icon: '🛒', label: 'Store Orders', path: '/admin/orders',       badge: 'orders' },
  { icon: '🎮', label: 'Game Stats',   path: '/admin/game-stats' },
  { icon: '💰', label: 'Economy',      path: '/admin/economy' },
  { icon: '🔗', label: 'Referrals',    path: '/admin/referrals' },
  { icon: '🏆', label: 'Leaderboard',  path: '/admin/leaderboard' },
  { icon: '🔔', label: 'Notifications',path: '/admin/notifications' },
  { icon: '🚫', label: 'Banned Users', path: '/admin/banned' },
  { icon: '📈', label: 'Analytics',    path: '/admin/analytics' },
  { icon: '⚙️', label: 'Settings',     path: '/admin/settings' },
  { icon: '📋', label: 'Audit Log',    path: '/admin/audit-log' },
];

export default function AdminSidebar({ mobile = false, onClose }) {
  const { adminUser, logout } = useAdmin();
  const { pendingCount: wPending } = useWithdrawals();
  const { pendingCount: oPending } = useOrders();
  const navigate = useNavigate();

  const badges = { withdrawals: wPending, orders: oPending };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const sidebarStyle = mobile ? {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(9,9,20,0.6)',
    display: 'flex'
  } : {};

  return (
    <div style={sidebarStyle} onClick={mobile ? onClose : undefined}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 240, background: '#0d0d1a',
        borderRight: '1px solid #1a1a2e',
        height: '100vh', display: 'flex',
        flexDirection: 'column', overflowY: 'auto',
        position: mobile ? 'relative' : 'fixed',
        top: 0, left: 0, zIndex: 100,
        animation: mobile ? 'fadeSlideUp 0.2s ease' : 'none'
      }}>
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid #1a1a2e' }}>
          <div style={{ color: '#9d00ff', fontFamily: 'Outfit,sans-serif', fontSize: 20, fontWeight: 800 }}>
            🎮 Admin Panel
          </div>
          <div style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 12, marginTop: 4 }}>
            {adminUser?.email}
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {NAV.map(item => {
            const badge = item.badge ? badges[item.badge] : 0;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                onClick={mobile ? onClose : undefined}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 20px',
                  color: isActive ? '#f0f0f5' : '#8e8e9f',
                  fontFamily: 'Outfit,sans-serif', fontSize: 14, fontWeight: isActive ? 600 : 400,
                  textDecoration: 'none', borderLeft: isActive ? '3px solid #9d00ff' : '3px solid transparent',
                  background: isActive ? 'rgba(157,0,255,0.15)' : 'transparent',
                  transition: 'all 0.2s ease'
                })}
              >
                <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {badge > 0 && (
                  <span style={{
                    background: '#ff003c', color: '#fff', borderRadius: 10,
                    padding: '1px 7px', fontSize: 11, fontWeight: 700, minWidth: 20, textAlign: 'center'
                  }}>{badge}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid #1a1a2e' }}>
          <button onClick={handleLogout} className="admin-btn" style={{
            width: '100%', padding: '10px 16px',
            background: 'rgba(255,0,60,0.1)', border: '1px solid rgba(255,0,60,0.3)',
            borderRadius: 10, color: '#ff003c',
            fontFamily: 'Outfit,sans-serif', fontSize: 14, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center'
          }}>
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
}
