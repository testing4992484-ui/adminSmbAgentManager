import { useState, useEffect } from 'react';
import { getAdminSettings, initAdminSettings } from '../utils/adminFirebase';

const DEFAULTS = {
  dailyBonusAmount: 50,
  newUserBonus: 50,
  googleLoginBonus: 500,
  referralBonus: 200,
  referralCommissionPct: 15,
  minWithdrawalCoins: 5000,
  conversionRate: 100,
  gamerMissionReward: 100,
  winnerMissionReward: 150,
  maxBetCoins: 1000,
  minBetCoins: 10,
  maintenanceMode: false,
  maintenanceMessage: '',
  announcementBanner: '',
  announcementActive: false,
  doubleCoinsEvent: false,
  telegramContact: '@Munnapm70045',
  appVersion: '1.0.0',
  streakMilestones: { day7: 500, day14: 1000, day21: 1500, day30: 2000 },
  featuredPlayer: ''
};

export default function useAdminSettings() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initAdminSettings();
    const unsub = getAdminSettings((data) => {
      setSettings({ ...DEFAULTS, ...data });
      setLoading(false);
    });
    return () => unsub && unsub();
  }, []);

  return { settings, loading };
}
