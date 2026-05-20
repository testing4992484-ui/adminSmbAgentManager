import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import ConfirmModal from '../components/ConfirmModal';
import { useAdmin } from '../context/AdminContext';
import useAdminSettings from '../hooks/useAdminSettings';
import { updateAdminSettings, logAdminAction, updateGamePool } from '../utils/adminFirebase';
import useGamePool from '../hooks/useGamePool';
import { formatNumber } from '../utils/formatters';

const SETTINGS_CONFIG = [
  { key: 'dailyBonusAmount',      label: '🎁 Daily Bonus Coins',       type: 'number' },
  { key: 'newUserBonus',          label: '🆕 New User Bonus',           type: 'number' },
  { key: 'googleLoginBonus',      label: '🔑 Google Login Bonus',       type: 'number' },
  { key: 'referralBonus',         label: '🔗 Referral Bonus (both)',    type: 'number' },
  { key: 'referralCommissionPct', label: '💹 Referral Commission (%)',  type: 'number' },
  { key: 'minWithdrawalCoins',    label: '💸 Min Withdrawal (coins)',   type: 'number' },
  { key: 'conversionRate',        label: '💱 Conversion Rate (coins/₹)',type: 'number' },
  { key: 'gamerMissionReward',    label: '🎮 Gamer Mission Reward',     type: 'number' },
  { key: 'winnerMissionReward',   label: '🏆 Winner Mission Reward',    type: 'number' },
  { key: 'maxBetCoins',           label: '⬆️ Max Bet (coins)',          type: 'number' },
  { key: 'minBetCoins',           label: '⬇️ Min Bet (coins)',          type: 'number' },
];

const STREAK_CONFIG = [
  { key: 'day7',  label: '7 Din Streak Bonus' },
  { key: 'day14', label: '14 Din Streak Bonus' },
  { key: 'day21', label: '21 Din Streak Bonus' },
  { key: 'day30', label: '30 Din Streak Bonus' },
];

export default function EconomyPage() {
  const { settings, loading } = useAdminSettings();
  const { gamePool } = useGamePool();
  const { adminUser, showToast } = useAdmin();
  const [localVals, setLocalVals] = useState({});
  const [poolDelta, setPoolDelta] = useState('');
  const [poolReason, setPoolReason] = useState('');
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState({});

  const val = (key) => localVals[key] !== undefined ? localVals[key] : settings[key];

  const saveSetting = async (key, value) => {
    setSaving(p => ({ ...p, [key]: true }));
    try {
      await updateAdminSettings({ [key]: Number(value) });
      await logAdminAction(adminUser.uid, adminUser.email, 'UPDATE_SETTING', null, settings[key], value);
      showToast('Setting save ho gaya!', 'success');
    } catch { showToast('Error aaya!', 'error'); }
    setSaving(p => ({ ...p, [key]: false }));
  };

  const saveStreak = async (subKey, value) => {
    const newMilestones = { ...settings.streakMilestones, [subKey]: Number(value) };
    await updateAdminSettings({ streakMilestones: newMilestones });
    await logAdminAction(adminUser.uid, adminUser.email, 'UPDATE_SETTING', null, settings.streakMilestones?.[subKey], value);
    showToast('Streak bonus save ho gaya!', 'success');
  };

  const toggleBoolean = async (key, current) => {
    try {
      await updateAdminSettings({ [key]: !current });
      await logAdminAction(adminUser.uid, adminUser.email, 'TOGGLE_SETTING', null, current, !current);
      showToast(`${key} ${!current ? 'ON' : 'OFF'} ho gaya!`, 'success');
    } catch { showToast('Error aaya!', 'error'); }
  };

  const handlePoolAdjust = async () => {
    const delta = parseInt(poolDelta);
    if (isNaN(delta) || delta === 0) { showToast('Valid amount daalo!', 'error'); return; }
    if (!poolReason.trim()) { showToast('Reason likhna zaruri hai!', 'error'); return; }
    const newPool = Math.max(0, (gamePool.housePool || 0) + delta);
    await updateGamePool({ housePool: newPool });
    await logAdminAction(adminUser.uid, adminUser.email, 'ADJUST_HOUSE_POOL', null, gamePool.housePool, newPool);
    showToast(`House pool ${delta > 0 ? '+' : ''}${delta} adjust ho gaya!`, 'success');
    setModal(null); setPoolDelta(''); setPoolReason('');
  };

  if (loading) return <AdminLayout title="💰 Economy"><div className="skeleton" style={{ height: 400, borderRadius: 16 }} /></AdminLayout>;

  return (
    <AdminLayout title="💰 Economy Management">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <div>
          <Card title="📊 Coin Settings">
            {SETTINGS_CONFIG.map(({ key, label }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #0d0d1a' }}>
                <span style={{ flex: 1, color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 13 }}>{label}</span>
                <input
                  type="number"
                  value={val(key)}
                  onChange={e => setLocalVals(p => ({ ...p, [key]: e.target.value }))}
                  style={{ width: 90, padding: '6px 10px', background: '#0d0d1a', border: '1px solid #2a2a4a', borderRadius: 8, color: '#f0f0f5', fontSize: 14, outline: 'none', fontFamily: 'Outfit,sans-serif', textAlign: 'right' }}
                />
                <button onClick={() => saveSetting(key, val(key))} disabled={saving[key]} className="admin-btn" style={{ padding: '6px 12px', background: '#9d00ff22', border: '1px solid #9d00ff55', borderRadius: 8, color: '#9d00ff', fontFamily: 'Outfit,sans-serif', fontSize: 12, fontWeight: 600 }}>
                  {saving[key] ? '...' : 'Save'}
                </button>
              </div>
            ))}
          </Card>

          <Card title="🔥 Streak Milestones" style={{ marginTop: 16 }}>
            {STREAK_CONFIG.map(({ key, label }) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #0d0d1a' }}>
                <span style={{ flex: 1, color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 13 }}>{label}</span>
                <input
                  type="number"
                  defaultValue={settings.streakMilestones?.[key] || 0}
                  onBlur={e => saveStreak(key, e.target.value)}
                  style={{ width: 90, padding: '6px 10px', background: '#0d0d1a', border: '1px solid #2a2a4a', borderRadius: 8, color: '#f0f0f5', fontSize: 14, outline: 'none', fontFamily: 'Outfit,sans-serif', textAlign: 'right' }}
                />
              </div>
            ))}
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card title="⚡ Quick Toggles">
            <ToggleRow label="🎉 Double Coins Event" desc="Sabki earning 2x ho jaayegi" active={settings.doubleCoinsEvent} onToggle={() => toggleBoolean('doubleCoinsEvent', settings.doubleCoinsEvent)} />
          </Card>

          <Card title="🏦 House Pool">
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ color: '#ffbe0b', fontSize: 32, fontWeight: 800, fontFamily: 'Outfit,sans-serif' }}>{formatNumber(gamePool.housePool || 0)}</div>
              <div style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 13 }}>Current House Pool (coins)</div>
            </div>
            <button onClick={() => setModal('pool')} className="admin-btn" style={{ width: '100%', padding: '12px', background: '#ffbe0b22', border: '1px solid #ffbe0b55', borderRadius: 12, color: '#ffbe0b', fontFamily: 'Outfit,sans-serif', fontSize: 15, fontWeight: 700 }}>
              ⚙️ Pool Adjust Karo
            </button>
          </Card>
        </div>
      </div>

      <ConfirmModal isOpen={modal === 'pool'} title="🏦 House Pool Adjust" message="Amount (+/-) aur reason daalo:" confirmText="Adjust Karo" onConfirm={handlePoolAdjust} onCancel={() => { setModal(null); setPoolDelta(''); setPoolReason(''); }}>
        <input type="number" value={poolDelta} onChange={e => setPoolDelta(e.target.value)} placeholder="+1000 ya -500" style={inputStyle} />
        <input value={poolReason} onChange={e => setPoolReason(e.target.value)} placeholder="Reason likhna zaruri hai..." style={{ ...inputStyle, marginTop: 10 }} />
      </ConfirmModal>
    </AdminLayout>
  );
}

const Card = ({ title, children }) => (
  <div style={{ background: '#151528', border: '1px solid #1a1a2e', borderRadius: 16, padding: 20 }}>
    <div style={{ color: '#f0f0f5', fontFamily: 'Outfit,sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 16 }}>{title}</div>
    {children}
  </div>
);

const ToggleRow = ({ label, desc, active, onToggle }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #0d0d1a' }}>
    <div>
      <div style={{ color: '#f0f0f5', fontFamily: 'Outfit,sans-serif', fontSize: 14, fontWeight: 600 }}>{label}</div>
      <div style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 12 }}>{desc}</div>
    </div>
    <button onClick={onToggle} style={{
      width: 52, height: 28, borderRadius: 14,
      background: active ? '#9d00ff' : '#2a2a4a',
      border: 'none', cursor: 'pointer',
      position: 'relative', transition: 'background 0.2s ease'
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3, transition: 'left 0.2s ease',
        left: active ? 26 : 4
      }} />
    </button>
  </div>
);

const inputStyle = { width: '100%', padding: '10px 14px', background: '#0d0d1a', border: '1px solid #2a2a4a', borderRadius: 10, color: '#f0f0f5', fontSize: 14, outline: 'none', fontFamily: 'Outfit,sans-serif' };
