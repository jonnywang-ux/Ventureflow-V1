interface AvatarProps {
  initials: string
  color: string
  size?: number
  square?: boolean
}

export function Avatar({ initials, color, size = 32, square = false }: AvatarProps) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: square ? '8px' : '50%',
        background: color,
        color: '#fff',
        fontFamily: 'Syne, sans-serif',
        fontWeight: 700,
        fontSize: Math.round(size * 0.34),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        letterSpacing: '0.02em',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  )
}
