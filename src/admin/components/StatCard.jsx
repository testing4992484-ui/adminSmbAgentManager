export default function StatCard({ icon, label, value, sub, color = '#9d00ff', badge, onClick }) {
  return (
    <div className="admin-stat-card" onClick={onClick} style={{
      background: '#151528',
      border: `1px solid ${color}33`,
      borderRadius: 16,
      padding: '20px 22px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      cursor: onClick ? 'pointer' : 'default',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '16px 16px 0 0' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 26 }}>{icon}</span>
        {badge !== undefined && badge > 0 && (
          <span style={{
            background: '#ff003c', color: '#fff',
            borderRadius: 20, padding: '2px 8px',
            fontSize: 11, fontWeight: 700, fontFamily: 'Outfit,sans-serif'
          }}>{badge}</span>
        )}
      </div>
      <div style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 13, fontWeight: 500 }}>{label}</div>
      <div style={{ color, fontFamily: 'Outfit,sans-serif', fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ color: '#8e8e9f', fontFamily: 'Outfit,sans-serif', fontSize: 12 }}>{sub}</div>}
    </div>
  );
}
