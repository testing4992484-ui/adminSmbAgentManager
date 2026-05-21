import { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import useGamePool from '../hooks/useGamePool';
import useUsers from '../hooks/useUsers';
import { db } from '../../config/firebase';
import { ref, onValue, remove, set, get } from 'firebase/database';
import { formatNumber, coinsToINR, isTodayIST } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const GAMES = ['Lucky Spin', 'Coin Flip', 'Coin Mines', 'Crash', 'Color Predict'];
const COLORS = ['#9d00ff', '#ff00d4', '#ffbe0b', '#00f0ff', '#39ff14'];
const POOL_KEYS = ['luckySpin','coinFlip','coinMines','crash','colorPredict'];

export default function GameStatsPage() {
  const { gamePool, loading: gLoad } = useGamePool();
  const { users, loading: uLoad } = useUsers();
  const [allActivity, setAllActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [resetError, setResetError] = useState('');

  const doReset = async () => {
    setShowConfirm(false);
    setResetting(true);
    setResetError('');
    try {
      const usersSnap = await get(ref(db, 'users'));
      const removeOps = [];
      if (usersSnap.exists()) {
        usersSnap.forEach((child) => {
          removeOps.push(remove(ref(db, `users/${child.key}/activity`)));
        });
      }
      await Promise.all(removeOps);
      await Promise.all(POOL_KEYS.map((k) => set(ref(db, `gamePool/${k}/pool`), 0)));
      await set(ref(db, 'gamePool/totalGamesPlayed'), 0);
      await set(ref(db, 'gamePool/totalCoinsWon'), 0);
      setResetDone(true);
      setTimeout(() => setResetDone(false), 3000);
    } catch (e) {
      setResetError(e.message);
    }
    setResetting(false);
  };

  useEffect(() => {
    const unsub = onValue(ref(db, 'users'), (snap) => {
      const data = snap.val() || {};
      const acts = [];
      Object.entries(data).forEach(([uid, userData]) => {
        if (userData.activity) {
          Object.values(userData.activity).forEach(a => {
            acts.push({ ...a, uid, userName: userData.name });
          });
        }
      });
      setAllActivity(acts);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const houseProfitForGame = (gameName) => {
    const acts = allActivity.filter(a => a.gameName === gameName);
    const lost = acts.filter(a => a.result === 'lose').reduce((s, a) => s + (a.amount || 0), 0);
    const won  = acts.filter(a => a.result === 'win').reduce((s, a) => s + (a.amount || 0), 0);
    return lost - won;
  };

  const countForGame = (gameName) => allActivity.filter(a => a.gameName === gameName).length;

  const todayActivity = allActivity.filter(a => isTodayIST(a.date));
  const todayBiggestWin = todayActivity.filter(a => a.result === 'win').sort((a, b) => b.amount - a.amount)[0];

  const suspicious = users.filter(u => {
    const userActs = allActivity.filter(a => a.uid === u.uid && a.result === 'win');
    const last24hWins = userActs.filter(a => Date.now() - new Date(a.date).getTime() < 86400000);
    const total = last24hWins.reduce((s, a) => s + (a.amount || 0), 0);
    return total >= 5000;
  });

  const pieData = GAMES.map((g, i) => ({ name: g.split(' ')[0], value: countForGame(g), color: COLORS[i] }));
  const barData = GAMES.map((g, i) => ({ name: g.split(' ')[0], profit: Math.max(0, houseProfitForGame(g)) }));

  return (
    <AdminLayout title="🎮 Game Statistics">

      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, backdropFilter: 'blur(6px)',
        }}>
          <div style={{
            background: 'linear-gradient(145deg,#12122a,#1a1a35)',
            border: '1px solid #ff003c55',
            borderRadius: 20, padding: '32px 28px', maxWidth: 360, width: '90%',
            boxShadow: '0 0 60px rgba(255,0,60,0.25), 0 20px 60px rgba(0,0,0,0.5)',
            textAlign: 'center', fontFamily: 'Outfit,sans-serif',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: 20, marginBottom: 8 }}>
              Reset All Stats?
            </div>
            <div style={{
              color: '#9e9eb5', fontSize: 14, lineHeight: 1.6, marginBottom: 24,
            }}>
              Sabhi games ki <span style={{ color: '#ff6b6b' }}>activity history</span> aur{' '}
              <span style={{ color: '#ff6b6b' }}>pool amounts</span> zero ho jaenge.<br />
              <span style={{ color: '#ffbe0b', fontWeight: 600 }}>Yeh action undo nahi hoga!</span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 12,
                  background: '#1e1e3a', border: '1px solid #2a2a4a',
                  color: '#9e9eb5', fontFamily: 'Outfit,sans-serif',
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                }}
              >
                ✕ Cancel
              </button>
              <button
                onClick={doReset}
                style={{
                  flex: 1, padding: '12px 0', borderRadius: 12,
                  background: 'linear-gradient(135deg,#ff003c,#ff6b00)',
                  border: 'none', color: '#fff',
                  fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', boxShadow: '0 0 20px rgba(255,0,60,0.4)',
                }}
              >
                🗑️ Reset Karo
              </button>
            </div>
          </div>
        </div>
      )}

      {resetDone && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 999,
          background: 'linear-gradient(135deg,#0d2b1a,#0a1f14)',
          border: '1px solid #39ff1466', borderRadius: 14,
          padding: '14px 22px', fontFamily: 'Outfit,sans-serif',
          color: '#39ff14', fontWeight: 700, fontSize: 14,
          boxShadow: '0 0 30px rgba(57,255,20,0.2)',
          animation: 'fadeIn 0.3s ease',
        }}>
          ✅ Sab kuch reset ho gaya!
        </div>
      )}

      {resetError && (
        <div style={{
          background: 'rgba(255,0,60,0.08)', border: '1px solid #ff003c44',
          borderRadius: 12, padding: '12px 16px', marginBottom: 16,
          color: '#ff6b6b', fontFamily: 'Outfit,sans-serif', fontSize: 13,
        }}>
          ❌ Error: {resetError}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          onClick={() => setShowConfirm(true)}
          disabled={resetting}
          style={{
            background: resetting ? '#3a1a1a' : 'linear-gradient(135deg,#ff003c,#ff6b00)',
            color: '#fff', border: 'none', borderRadius: 10, padding: '10px 22px',
            fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 14,
            cursor: resetting ? 'not-allowed' : 'pointer', opacity: resetting ? 0.6 : 1,
            boxShadow: resetting ? 'none' : '0 0 16px rgba(255,0,60,0.5)',
            transition: 'all 0.2s',
          }}
        >
          {resetting ? '⏳ Resetting...' : '🗑️ Reset All Stats'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <StatBox label="🏦 Total Pool" value={formatNumber(POOL_KEYS.reduce((s,k) => s + (gamePool[k]?.pool || 0), 0))} sub="coins" color="#ffbe0b" />
        <StatBox label="🎮 Total Games" value={formatNumber(gamePool.totalGamesPlayed || 0)} color="#9d00ff" />
        <StatBox label="🪙 Total Won" value={formatNumber(gamePool.totalCoinsWon || 0)} color="#00f0ff" />
        <StatBox label="⚠️ Suspicious Today" value={suspicious.length} color="#ff003c" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
        <Card title="🎯 Game Popularity">
          {loading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#151528', border: '1px solid #2a2a4a', borderRadius: 8, fontFamily: 'Outfit,sans-serif', color: '#f0f0f5' }} />
                <Legend wrapperStyle={{ fontFamily: 'Outfit,sans-serif', fontSize: 12, color: '#8e8e9f' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="💰 House Profit by Game">
          {loading ? <Skeleton /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <XAxis dataKey="name" tick={{ fill: '#8e8e9f', fontSize: 11, fontFamily: 'Outfit' }} />
                <YAxis tick={{ fill: '#8e8e9f', fontSize: 11, fontFamily: 'Outfit' }} />
                <Tooltip contentStyle={{ background: '#151528', border: '1px solid #2a2a4a', borderRadius: 8, fontFamily: 'Outfit,sans-serif', color: '#f0f0f5' }} />
                <Bar dataKey="profit" fill="#9d00ff" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>
        {GAMES.map((game, i) => {
          const acts = allActivity.filter(a => a.gameName === game);
          const wins = acts.filter(a => a.result === 'win');
          const losses = acts.filter(a => a.result === 'lose');
          const profit = houseProfitForGame(game);
          return (
            <div key={game} style={{ background: '#151528', border: `1px solid ${COLORS[i]}33`, borderRadius: 14, padding: 18 }}>
              <div style={{ color: COLORS[i], fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
                {['🎡', '🪙', '💣', '🚀', '🎨'][i]} {game}
              </div>
              <InfoRow label="Total Rounds" value={formatNumber(acts.length)} />
              <InfoRow label="Wins" value={formatNumber(wins.length)} />
              <InfoRow label="Losses" value={formatNumber(losses.length)} />
              <InfoRow label="House Profit" value={<span style={{ color: profit >= 0 ? '#39ff14' : '#ff003c' }}>{profit >= 0 ? '+' : ''}{formatNumber(profit)} 🪙</span>} />
              <InfoRow label="Win Rate" value={`${acts.length ? Math.round((wins.length / acts.length) * 100) : 0}%`} />
              <InfoRow label="🏦 Pool" value={<span style={{color:'#ffbe0b',fontWeight:700}}>{formatNumber(gamePool[POOL_KEYS[i]]?.pool || 0)} 🪙</span>} />
            </div>
          );
        })}
      </div>

      {suspicious.length > 0 && (
        <div style={{ background: 'rgba(255,190,11,0.05)', border: '1px solid #ffbe0b44', borderRadius: 16, padding: 20 }}>
          <div style={{ color: '#ffbe0b', fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 14 }}>
            ⚠️ Suspicious Activity (5000+ coins won in last 24h)
          </div>
          {suspicious.map(u => (
            <div key={u.uid} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1a1a2e' }}>
              <span style={{ color: '#f0f0f5', fontFamily: 'Outfit,sans-serif' }}>{u.name || 'Unknown'}</span>
              <span style={{ color: '#ffbe0b', fontFamily: 'Outfit,sans-serif', fontWeight: 700 }}>{formatNumber(u.coins || 0)} 🪙</span>
            </div>
          ))}
        </div>
      )}

      {todayBiggestWin && (
        <div style={{ background: '#151528', border: '1px solid #9d00ff44', borderRadius: 14, padding: '14px 20px', marginTop: 16 }}>
          <span style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 13 }}>🏆 Aaj ka sabse bada win: </span>
          <span style={{ color: '#ffbe0b', fontWeight: 700, fontFamily: 'Outfit,sans-serif' }}>{todayBiggestWin.userName || 'Unknown'} — {formatNumber(todayBiggestWin.amount)} 🪙 ({todayBiggestWin.gameName})</span>
        </div>
      )}
    </AdminLayout>
  );
}

const StatBox = ({ label, value, sub, color }) => (
  <div style={{ background: '#151528', border: `1px solid ${color}33`, borderRadius: 14, padding: 18 }}>
    <div style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 12, marginBottom: 6 }}>{label}</div>
    <div style={{ color, fontFamily: 'Outfit,sans-serif', fontSize: 24, fontWeight: 800 }}>{value}</div>
    {sub && <div style={{ color: '#8e8e9f', fontSize: 12 }}>{sub}</div>}
  </div>
);
const Card = ({ title, children }) => (
  <div style={{ background: '#151528', border: '1px solid #1a1a2e', borderRadius: 16, padding: 20 }}>
    <div style={{ color: '#f0f0f5', fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>{title}</div>
    {children}
  </div>
);
const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #0d0d1a' }}>
    <span style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 13 }}>{label}</span>
    <span style={{ color: '#f0f0f5', fontFamily: 'Outfit,sans-serif', fontSize: 13, fontWeight: 600 }}>{value}</span>
  </div>
);
const Skeleton = () => <div className="skeleton" style={{ height: 200, borderRadius: 8 }} />;
