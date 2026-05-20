import { db, auth } from '../../config/firebase';
import { ref, get, set, update, onValue, push, remove } from 'firebase/database';
import { sendPasswordResetEmail } from 'firebase/auth';

export const getAllUsers = (callback) => {
  return onValue(ref(db, 'users'), (snap) => {
    const data = snap.val() || {};
    const users = Object.entries(data).map(([uid, val]) => ({ uid, ...val }));
    callback(users);
  });
};

export const getUserOnce = async (uid) => {
  const snap = await get(ref(db, `users/${uid}`));
  return snap.val();
};

export const banUser = async (uid, banned, reason = '', expiry = null) => {
  const updates = { banned, banReason: reason };
  if (expiry) updates.banExpiry = expiry;
  else updates.banExpiry = null;
  await update(ref(db, `users/${uid}`), updates);
};

export const adjustCoins = async (uid, currentCoins, delta) => {
  const newCoins = Math.max(0, currentCoins + delta);
  await update(ref(db, `users/${uid}`), { coins: newCoins });
  return newCoins;
};

export const resetUserPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

export const getAllWithdrawals = (callback) => {
  return onValue(ref(db, 'users'), (snap) => {
    const all = [];
    const data = snap.val() || {};
    Object.entries(data).forEach(([uid, userData]) => {
      if (userData.withdrawals) {
        Object.entries(userData.withdrawals).forEach(([wid, w]) => {
          all.push({ uid, wid, userName: userData.name, userEmail: userData.email, ...w });
        });
      }
    });
    all.sort((a, b) => new Date(b.date) - new Date(a.date));
    callback(all);
  });
};

export const updateWithdrawalStatus = async (uid, wid, status) => {
  await update(ref(db, `users/${uid}/withdrawals/${wid}`), { status });
};

export const getAllOrders = (callback) => {
  return onValue(ref(db, 'orders'), (snap) => {
    const data = snap.val() || {};
    const orders = Object.entries(data).map(([id, val]) => ({ id, ...val }));
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    callback(orders);
  });
};

export const updateOrderStatus = async (orderId, status) => {
  await update(ref(db, `orders/${orderId}`), { status });
};

export const getGamePool = (callback) => {
  return onValue(ref(db, 'gamePool'), (snap) => {
    callback(snap.val() || {});
  });
};

export const updateGamePool = async (updates) => {
  await update(ref(db, 'gamePool'), updates);
};

export const getAdminSettings = (callback) => {
  return onValue(ref(db, 'adminSettings'), (snap) => {
    callback(snap.val() || {});
  });
};

export const updateAdminSettings = async (updates) => {
  await update(ref(db, 'adminSettings'), updates);
};

export const getPublicProfiles = (callback) => {
  return onValue(ref(db, 'public_profiles'), (snap) => {
    const data = snap.val() || {};
    const profiles = Object.entries(data).map(([uid, val]) => ({ uid, ...val }));
    profiles.sort((a, b) => (b.coins || 0) - (a.coins || 0));
    callback(profiles);
  });
};

export const removeFromLeaderboard = async (uid) => {
  await remove(ref(db, `public_profiles/${uid}`));
};

export const setFeaturedPlayer = async (uid) => {
  await update(ref(db, 'adminSettings'), { featuredPlayer: uid });
};

export const sendNotificationToUser = async (uid, title, body) => {
  await update(ref(db, `users/${uid}`), {
    notification: { title, body, timestamp: Date.now(), read: false }
  });
};

export const sendBroadcastNotification = async (title, body, allUserUids) => {
  const updates = {};
  allUserUids.forEach(uid => {
    updates[`users/${uid}/notification`] = { title, body, timestamp: Date.now(), read: false };
  });
  await update(ref(db), updates);
};

export const logAdminAction = async (adminUid, adminEmail, action, targetUserId, oldValue, newValue) => {
  await push(ref(db, 'adminLogs'), {
    adminUid,
    adminEmail,
    action,
    targetUserId: targetUserId || '',
    oldValue: JSON.stringify(oldValue),
    newValue: JSON.stringify(newValue),
    timestamp: Date.now()
  });
};

export const getAdminLogs = (callback) => {
  return onValue(ref(db, 'adminLogs'), (snap) => {
    const data = snap.val() || {};
    const logs = Object.entries(data).map(([id, val]) => ({ id, ...val }));
    logs.sort((a, b) => b.timestamp - a.timestamp);
    callback(logs);
  });
};

export const initAdminSettings = async () => {
  const snap = await get(ref(db, 'adminSettings'));
  if (!snap.val()) {
    await set(ref(db, 'adminSettings'), {
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
      maintenanceMessage: 'Server update ho raha hai. Thodi der mein wapas aao!',
      announcementBanner: '',
      announcementActive: false,
      doubleCoinsEvent: false,
      telegramContact: '@Munnapm70045',
      appVersion: '1.0.0',
      streakMilestones: { day7: 500, day14: 1000, day21: 1500, day30: 2000 },
      featuredPlayer: ''
    });
  }
};
