import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import useUsers from '../hooks/useUsers';
import { db } from '../../config/firebase';
import { ref, onValue } from 'firebase/database';
import { formatNumber, coinsToINR } from '../utils/formatters';
import { exportToCSV } from '../utils/exportCSV';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const GAME_COLORS = ['#9d00ff', '#ff00d4', '#ffbe0b', '#00f0ff', '#39ff14'];
const GAMES = ['Lucky Spin', 'Coin Flip', 'Coin Mines', 'Crash', 'Color Predict'];

function getLast30Days() {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    d.setHours(0, 0, 0, 0);
    return { date: d, label: d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short' }) };
  });
}

export default function AnalyticsPage() {
  const { users, loading: uLoad } = useUsers();
  const [allActivity, setAllActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onValue(ref(db, 'users'), (snap) => {
      const data = snap.val() || {};
      const acts = [];
      Object.entries(data).forEach(([uid, userData]) => {
        if (userData.activity) {
          Object.values(userData.activity).forEach(a => acts.push({ ...a, uid }));
        }
      });
      setAllActivity(acts);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const days = getLast30Days();

  const dailyNewUsers = days.map(d => {
    const count = users.filter(u => {
      if (!u.createdAt) return false;
      const cd = new Date(u.createdAt);
      return cd.toDateString() === d.date.toDateString();
    }).length;
    return { label: d.label, users: count };
  });

  const dailyActivity = days.map(d => {
    const earned = allActivity.filter(a => {
      if (!a.date) return false;
      return new Date(a.date).toDateString() === d.date.toDateString() && (a.result === 'win' || a.result === 'bonus');
    }).reduce((s, a) => s + (a.amount || 0), 0);
    const withdrawn = allActivity.filter(a => {
      if (!a.date) return false;
      return new Date(a.date).toDateString() === d.date.toDateString() && a.result === 'lose';
    }).reduce((s, a) => s + (a.amount || 0), 0);
    return { label: d.label, earned, withdrawn };
  });

  const pieData = GAMES.map((g, i) => ({
    name: g.split(' ')[0],
    value: allActivity.filter(a => a.gameName === g).length,
    color: GAME_COLORS[i]
  })).filter(d => d.value > 0);

  const hourActivity = Array.from({ length: 24 }, (_, h) => ({
    hour: `${h}h`,
    count: allActivity.filter(a => a.date && new Date(a.date).getHours() === h).length
  }));

  const totalEarned = allActivity.filter(a => a.result === 'win' || a.result === 'bonus').reduce((s, a) => s + (a.amount || 0), 0);
  const totalWithdrawn = allActivity.filter(a => a.result === 'lose').reduce((s, a) => s + (a.amount || 0), 0);

  const exportAnalytics = () => {
    const data = days.map((d, i) => ({
      Date: d.label,
      'New Users': dailyNewUsers[i].users,
      'Coins Earned': dailyActivity[i].earned,
      'Coins Withdrawn': dailyActivity[i].withdrawn
    }));
    exportToCSV(data, 'analytics');
  };

  const ttStyle = { background: '#151528', border: '1px solid #2a2a4a', borderRadius: 8, fontFamily: 'Outfit,sans-serif', color: '#f0f0f5', fontSize: 12 };

  return (
    <AdminLayout title="📈 Analytics & Reports">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatBox label="👥 Total Users" value={formatNumber(users.length)} color="#9d00ff" />
        <StatBox label="🪙 Total Earned" value={formatNumber(totalEarned)} sub="coins" color="#39ff14" />
        <StatBox label="💸 Total Withdrawn" value={formatNumber(totalWithdrawn)} sub="coins" color="#ff003c" />
        <StatBox label="🎮 Total Activity" value={formatNumber(allActivity.length)} color="#00f0ff" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={exportAnalytics} className="admin-btn" style={{ padding: '10px 20px', background: '#9d00ff22', border: '1px solid #9d00ff55', borderRadius: 12, color: '#9d00ff', fontFamily: 'Outfit,sans-serif', fontSize: 14, fontWeight: 700 }}>
          📥 CSV Export
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <ChartCard title="📈 Daily New Users (Last 30 Days)">
          {loading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyNewUsers}>
                <XAxis dataKey="label" tick={{ fill: '#8e8e9f', fontSize: 10 }} interval={4} />
                <YAxis tick={{ fill: '#8e8e9f', fontSize: 10 }} />
                <Tooltip contentStyle={ttStyle} />
                <Bar dataKey="users" fill="#9d00ff" radius={[4,4,0,0]} name="New Users" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="💰 Coins Flow (Earned vs Withdrawn)">
          {loading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dailyActivity}>
                <XAxis dataKey="label" tick={{ fill: '#8e8e9f', fontSize: 10 }} interval={4} />
                <YAxis tick={{ fill: '#8e8e9f', fontSize: 10 }} />
                <Tooltip contentStyle={ttStyle} />
                <Area type="monotone" dataKey="earned" stroke="#39ff14" fill="#39ff1422" name="Earned" />
                <Area type="monotone" dataKey="withdrawn" stroke="#ff003c" fill="#ff003c22" name="Withdrawn" />
                <Legend wrapperStyle={{ fontFamily: 'Outfit,sans-serif', fontSize: 12, color: '#8e8e9f' }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <ChartCard title="🎮 Game Popularity">
            {loading ? <Skeleton /> : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={ttStyle} />
                  <Legend wrapperStyle={{ fontFamily: 'Outfit,sans-serif', fontSize: 12, color: '#8e8e9f' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="⏰ Peak Hours">
            {loading ? <Skeleton /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={hourActivity}>
                  <XAxis dataKey="hour" tick={{ fill: '#8e8e9f', fontSize: 9 }} interval={3} />
                  <YAxis tick={{ fill: '#8e8e9f', fontSize: 10 }} />
                  <Tooltip contentStyle={ttStyle} />
                  <Bar dataKey="count" fill="#00f0ff" radius={[3,3,0,0]} name="Activity" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </div>
    </AdminLayout>
  );
}

const ChartCard = ({ title, children }) => (
  <div style={{ background: '#151528', border: '1px solid #1a1a2e', borderRadius: 16, padding: 20 }}>
    <div style={{ color: '#f0f0f5', fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>{title}</div>
    {children}
  </div>
);
const StatBox = ({ label, value, sub, color }) => (
  <div style={{ background: '#151528', border: `1px solid ${color}33`, borderRadius: 14, padding: 16 }}>
    <div style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 12 }}>{label}</div>
    <div style={{ color, fontFamily: 'Outfit,sans-serif', fontSize: 22, fontWeight: 800 }}>{value}</div>
    {sub && <div style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 12 }}>{sub}</div>}
  </div>
);
const Skeleton = () => <div className="skeleton" style={{ height: 200, borderRadius: 8 }} />;
