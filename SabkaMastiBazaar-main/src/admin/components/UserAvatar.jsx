const COLORS = ['#9d00ff', '#ff00d4', '#00f0ff', '#ffbe0b', '#39ff14', '#ff003c'];

export default function UserAvatar({ name, size = 36 }) {
  const initials = (name || '?')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const colorIndex = (name || '').charCodeAt(0) % COLORS.length;
  const color = COLORS[colorIndex];

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: `${color}22`,
      border: `2px solid ${color}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.38,
      fontWeight: 700,
      color,
      fontFamily: 'Outfit, sans-serif',
      flexShrink: 0
    }}>
      {initials}
    </div>
  );
}
