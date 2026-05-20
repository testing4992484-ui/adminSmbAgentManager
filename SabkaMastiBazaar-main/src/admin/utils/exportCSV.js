export const exportToCSV = (data, filename) => {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row =>
    Object.values(row).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  const csv = `${headers}\n${rows}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }).replace(/\//g, '-')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const withdrawalsToCSVData = (withdrawals) =>
  withdrawals.map(w => ({
    'User Name': w.userName || '—',
    'UID': w.uid,
    'Amount (Coins)': w.amount || 0,
    'Amount (INR)': `₹${((w.amount || 0) / 100).toFixed(2)}`,
    'Method': w.method || '—',
    'Account': w.account || '—',
    'Status': w.status || '—',
    'Date (IST)': new Date(w.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  }));

export const ordersToCSVData = (orders) =>
  orders.map(o => ({
    'User Name': o.userName || '—',
    'Product': o.product || '—',
    'Variant': o.variant || '—',
    'Plan': o.plan || '—',
    'Price (INR)': `₹${o.price || 0}`,
    'Status': o.status || '—',
    'Date (IST)': new Date(o.date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  }));
