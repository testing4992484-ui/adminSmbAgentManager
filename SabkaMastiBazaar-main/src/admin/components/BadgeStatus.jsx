const statusConfig = {
  pending:   { bg: 'rgba(255,190,11,0.15)',  border: '#ffbe0b', text: '#ffbe0b',  label: 'Pending' },
  approved:  { bg: 'rgba(57,255,20,0.15)',   border: '#39ff14', text: '#39ff14',  label: 'Approved' },
  rejected:  { bg: 'rgba(255,0,60,0.15)',    border: '#ff003c', text: '#ff003c',  label: 'Rejected' },
  banned:    { bg: 'rgba(255,0,60,0.15)',    border: '#ff003c', text: '#ff003c',  label: 'Banned' },
  active:    { bg: 'rgba(57,255,20,0.15)',   border: '#39ff14', text: '#39ff14',  label: 'Active' },
  fulfilled: { bg: 'rgba(0,240,255,0.15)',   border: '#00f0ff', text: '#00f0ff',  label: 'Fulfilled' },
  cancelled: { bg: 'rgba(255,0,60,0.15)',    border: '#ff003c', text: '#ff003c',  label: 'Cancelled' },
  win:       { bg: 'rgba(57,255,20,0.15)',   border: '#39ff14', text: '#39ff14',  label: 'Win' },
  lose:      { bg: 'rgba(255,0,60,0.15)',    border: '#ff003c', text: '#ff003c',  label: 'Lose' },
  bonus:     { bg: 'rgba(255,190,11,0.15)',  border: '#ffbe0b', text: '#ffbe0b',  label: 'Bonus' },
};

export default function BadgeStatus({ status, customLabel }) {
  const config = statusConfig[status?.toLowerCase()] || {
    bg: 'rgba(142,142,159,0.15)', border: '#8e8e9f', text: '#8e8e9f', label: status || 'Unknown'
  };
  return (
    <span style={{
      background: config.bg,
      border: `1px solid ${config.border}`,
      color: config.text,
      borderRadius: 20,
      padding: '3px 10px',
      fontSize: 12,
      fontWeight: 600,
      fontFamily: 'Outfit, sans-serif',
      whiteSpace: 'nowrap',
      display: 'inline-block'
    }}>
      {customLabel || config.label}
    </span>
  );
}
