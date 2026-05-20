import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AdminProvider } from './admin/context/AdminContext';

import AdminLoginPage       from './admin/pages/AdminLoginPage';
import AdminDashboard       from './admin/pages/AdminDashboard';
import UsersPage            from './admin/pages/UsersPage';
import UserDetailPage       from './admin/pages/UserDetailPage';
import WithdrawalsPage      from './admin/pages/WithdrawalsPage';
import OrdersPage           from './admin/pages/OrdersPage';
import GameStatsPage        from './admin/pages/GameStatsPage';
import EconomyPage          from './admin/pages/EconomyPage';
import ReferralsPage        from './admin/pages/ReferralsPage';
import LeaderboardAdminPage from './admin/pages/LeaderboardAdminPage';
import NotificationsPage    from './admin/pages/NotificationsPage';
import BannedUsersPage      from './admin/pages/BannedUsersPage';
import AnalyticsPage        from './admin/pages/AnalyticsPage';
import SettingsPage         from './admin/pages/SettingsPage';
import AuditLogPage         from './admin/pages/AuditLogPage';
import AdminGuard           from './admin/utils/adminGuard';

export default function App() {
  return (
    <BrowserRouter>
      <AdminProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
          <Route path="/admin/users" element={<AdminGuard><UsersPage /></AdminGuard>} />
          <Route path="/admin/users/:uid" element={<AdminGuard><UserDetailPage /></AdminGuard>} />
          <Route path="/admin/withdrawals" element={<AdminGuard><WithdrawalsPage /></AdminGuard>} />
          <Route path="/admin/orders" element={<AdminGuard><OrdersPage /></AdminGuard>} />
          <Route path="/admin/game-stats" element={<AdminGuard><GameStatsPage /></AdminGuard>} />
          <Route path="/admin/economy" element={<AdminGuard><EconomyPage /></AdminGuard>} />
          <Route path="/admin/referrals" element={<AdminGuard><ReferralsPage /></AdminGuard>} />
          <Route path="/admin/leaderboard" element={<AdminGuard><LeaderboardAdminPage /></AdminGuard>} />
          <Route path="/admin/notifications" element={<AdminGuard><NotificationsPage /></AdminGuard>} />
          <Route path="/admin/banned" element={<AdminGuard><BannedUsersPage /></AdminGuard>} />
          <Route path="/admin/analytics" element={<AdminGuard><AnalyticsPage /></AdminGuard>} />
          <Route path="/admin/settings" element={<AdminGuard><SettingsPage /></AdminGuard>} />
          <Route path="/admin/audit-log" element={<AdminGuard><AuditLogPage /></AdminGuard>} />
          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </AdminProvider>
    </BrowserRouter>
  );
}
