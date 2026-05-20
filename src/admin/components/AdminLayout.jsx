import { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { useNavigate, useLocation } from 'react-router-dom';
import useWithdrawals from '../hooks/useWithdrawals';
import useOrders from '../hooks/useOrders';

const MOBILE_NAV = [
  { icon: '📊', path: '/admin' },
  { icon: '👥', path: '/admin/users' },
  { icon: '💸', path: '/admin/withdrawals' },
  { icon: '🛒', path: '/admin/orders' },
];

export default function AdminLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { pendingCount: wPending } = useWithdrawals();
  const { pendingCount: oPending } = useOrders();

  return (
    <div style={{ minHeight: '100vh', background: '#090914', display: 'flex' }}>
      <div className="desktop-sidebar" style={{ display: 'block' }}>
        <style>{`
          @media (max-width: 767px) { .desktop-sidebar { display: none !important; } }
        `}</style>
        <AdminSidebar />
      </div>

      {sidebarOpen && (
        <div className="mobile-sidebar-overlay" style={{ display: 'block' }}>
          <style>{`
            @media (min-width: 768px) { .mobile-sidebar-overlay { display: none !important; } }
          `}</style>
          <AdminSidebar mobile onClose={() => setSidebarOpen(false)} />
        </div>
      )}

      <main style={{
        flex: 1,
        marginLeft: 0,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <style>{`
          @media (min-width: 768px) { main { margin-left: 240px !important; } }
          @media (max-width: 767px) { main { padding-bottom: 70px !important; } }
        `}</style>

        <div style={{
          background: '#0d0d1a',
          borderBottom: '1px solid #1a1a2e',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}>
          <button onClick={() => setSidebarOpen(true)} className="admin-btn" style={{
            background: 'none', border: 'none', color: '#f0f0f5',
            fontSize: 22, padding: 4, display: 'none', cursor: 'pointer'
          }} id="hamburger-btn">
            ☰
          </button>
          <style>{`
            @media (max-width: 767px) { #hamburger-btn { display: block !important; } }
          `}</style>
          <h1 style={{ color: '#f0f0f5', fontFamily: 'Outfit,sans-serif', fontSize: 18, fontWeight: 700, flex: 1 }}>
            {title}
          </h1>
        </div>

        <div style={{ flex: 1, padding: '24px', maxWidth: 1200, width: '100%', margin: '0 auto' }} className="admin-page-enter">
          {children}
        </div>
      </main>

      <div style={{
        display: 'none',
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#0d0d1a',
        borderTop: '1px solid #1a1a2e',
        zIndex: 100,
        height: 60
      }} id="mobile-bottom-nav">
        <style>{`
          @media (max-width: 767px) { #mobile-bottom-nav { display: flex !important; align-items: center; justify-content: space-around; } }
        `}</style>
        {MOBILE_NAV.map(item => {
          const isActive = location.pathname === item.path;
          const badge = item.path === '/admin/withdrawals' ? wPending : item.path === '/admin/orders' ? oPending : 0;
          return (
            <button key={item.path} onClick={() => navigate(item.path)} style={{
              background: 'none', border: 'none',
              color: isActive ? '#9d00ff' : '#8e8e9f',
              fontSize: 22, padding: '8px 16px', cursor: 'pointer',
              position: 'relative'
            }}>
              {item.icon}
              {badge > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: 8,
                  background: '#ff003c', color: '#fff', borderRadius: 10,
                  fontSize: 9, fontWeight: 700, padding: '1px 4px'
                }}>{badge}</span>
              )}
            </button>
          );
        })}
        <button onClick={() => setSidebarOpen(true)} style={{
          background: 'none', border: 'none',
          color: '#8e8e9f', fontSize: 22, padding: '8px 16px', cursor: 'pointer'
        }}>☰</button>
      </div>
    </div>
  );
}
