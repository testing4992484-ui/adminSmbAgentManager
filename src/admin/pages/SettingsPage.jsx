import { useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useAdmin } from '../context/AdminContext';
import useAdminSettings from '../hooks/useAdminSettings';
import { updateAdminSettings, logAdminAction } from '../utils/adminFirebase';

export default function SettingsPage() {
  const { settings, loading } = useAdminSettings();
  const { adminUser, showToast } = useAdmin();
  const [localVals, setLocalVals] = useState({});
  const [saving, setSaving] = useState({});

  const val = (key) => localVals[key] !== undefined ? localVals[key] : settings[key];
  const set = (key, v) => setLocalVals(p => ({ ...p, [key]: v }));

  const save = async (key, value) => {
    setSaving(p => ({ ...p, [key]: true }));
    try {
      await updateAdminSettings({ [key]: value });
      await logAdminAction(adminUser.uid, adminUser.email, 'UPDATE_SETTING', null, settings[key], value);
      showToast('Setting save ho gayi!', 'success');
    } catch { showToast('Error aaya!', 'error'); }
    setSaving(p => ({ ...p, [key]: false }));
  };

  const toggle = async (key) => {
    const newVal = !settings[key];
    await save(key, newVal);
  };

  if (loading) return <AdminLayout title="⚙️ Settings"><div className="skeleton" style={{ height: 400, borderRadius: 16 }} /></AdminLayout>;

  return (
    <AdminLayout title="⚙️ System Settings">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <Card title="🚧 Maintenance Mode">
          <ToggleRow
            label="Maintenance Mode"
            desc="ON karte hi users ko 'Server update' page dikhega"
            active={settings.maintenanceMode}
            onToggle={() => toggle('maintenanceMode')}
          />
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>Maintenance Message</label>
            <textarea
              value={val('maintenanceMessage')}
              onChange={e => set('maintenanceMessage', e.target.value)}
              rows={3}
              placeholder="Server update ho raha hai. Thodi der mein wapas aao!"
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            <button onClick={() => save('maintenanceMessage', val('maintenanceMessage'))} disabled={saving.maintenanceMessage} style={saveBtn}>
              {saving.maintenanceMessage ? 'Save ho raha...' : 'Save Karo'}
            </button>
          </div>
        </Card>

        <Card title="📢 Announcement Banner">
          <ToggleRow
            label="Banner Active"
            desc="Home page pe announcement banner dikhayega"
            active={settings.announcementActive}
            onToggle={() => toggle('announcementActive')}
          />
          <div style={{ marginTop: 14 }}>
            <label style={labelStyle}>Banner Text</label>
            <input
              value={val('announcementBanner')}
              onChange={e => set('announcementBanner', e.target.value)}
              placeholder="🎉 Double Coins Event chal raha hai!"
              style={inputStyle}
            />
            <button onClick={() => save('announcementBanner', val('announcementBanner'))} disabled={saving.announcementBanner} style={saveBtn}>
              {saving.announcementBanner ? 'Save ho raha...' : 'Save Karo'}
            </button>
          </div>
        </Card>

        <Card title="🎮 Game Limits">
          <SettingRow label="⬆️ Max Bet (coins)">
            <input type="number" value={val('maxBetCoins')} onChange={e => set('maxBetCoins', e.target.value)} style={numInput} />
            <button onClick={() => save('maxBetCoins', Number(val('maxBetCoins')))} style={smallSaveBtn}>Save</button>
          </SettingRow>
          <SettingRow label="⬇️ Min Bet (coins)">
            <input type="number" value={val('minBetCoins')} onChange={e => set('minBetCoins', e.target.value)} style={numInput} />
            <button onClick={() => save('minBetCoins', Number(val('minBetCoins')))} style={smallSaveBtn}>Save</button>
          </SettingRow>
        </Card>

        <Card title="📞 Contact & App Info">
          <SettingRow label="📱 Telegram Contact">
            <input value={val('telegramContact')} onChange={e => set('telegramContact', e.target.value)} placeholder="@Munnapm70045" style={{ ...numInput, width: 160 }} />
            <button onClick={() => save('telegramContact', val('telegramContact'))} style={smallSaveBtn}>Save</button>
          </SettingRow>
          <SettingRow label="📌 App Version">
            <input value={val('appVersion')} onChange={e => set('appVersion', e.target.value)} placeholder="1.0.0" style={{ ...numInput, width: 100 }} />
            <button onClick={() => save('appVersion', val('appVersion'))} style={smallSaveBtn}>Save</button>
          </SettingRow>
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

const ToggleRow = ({ label, desc, active, onToggle }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
    <div>
      <div style={{ color: '#f0f0f5', fontFamily: 'Outfit,sans-serif', fontSize: 14, fontWeight: 600 }}>{label}</div>
      <div style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 12 }}>{desc}</div>
    </div>
    <button onClick={onToggle} style={{ width: 52, height: 28, borderRadius: 14, background: active ? '#9d00ff' : '#2a2a4a', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, transition: 'left 0.2s', left: active ? 26 : 4 }} />
    </button>
  </div>
);

const SettingRow = ({ label, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #0d0d1a', gap: 10 }}>
    <span style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 13, flex: 1 }}>{label}</span>
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{children}</div>
  </div>
);

const labelStyle = { display: 'block', color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 12, fontWeight: 500, marginBottom: 6 };
const inputStyle = { width: '100%', padding: '10px 14px', background: '#0d0d1a', border: '1px solid #2a2a4a', borderRadius: 10, color: '#f0f0f5', fontSize: 14, outline: 'none', fontFamily: 'Outfit,sans-serif', marginBottom: 10 };
const numInput = { width: 100, padding: '7px 10px', background: '#0d0d1a', border: '1px solid #2a2a4a', borderRadius: 8, color: '#f0f0f5', fontSize: 14, outline: 'none', fontFamily: 'Outfit,sans-serif', textAlign: 'right' };
const saveBtn = { padding: '9px 18px', background: '#9d00ff', border: 'none', borderRadius: 10, color: '#fff', fontFamily: 'Outfit,sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%' };
const smallSaveBtn = { padding: '7px 14px', background: '#9d00ff22', border: '1px solid #9d00ff55', borderRadius: 8, color: '#9d00ff', fontFamily: 'Outfit,sans-serif', fontSize: 12, fontWeight: 600, cursor: 'pointer' };
