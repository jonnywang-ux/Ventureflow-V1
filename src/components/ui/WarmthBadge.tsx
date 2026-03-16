interface WarmthBadgeProps {
  warmth: number
}

export function WarmthBadge({ warmth }: WarmthBadgeProps) {
  if (warmth >= 4) {
    return (
      <span
        style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: '10px',
          padding: '3px 8px',
          borderRadius: '6px',
          background: 'rgba(201,64,64,0.12)',
          color: 'var(--china)',
        }}
      >
        HOT
      </span>
    )
  }

  if (warmth >= 2) {
    return (
      <span
        style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: '10px',
          padding: '3px 8px',
          borderRadius: '6px',
          background: 'rgba(184,150,10,0.12)',
          color: 'var(--gold)',
        }}
      >
        WARM
      </span>
    )
  }

  return (
    <span
      style={{
        fontFamily: 'Syne, sans-serif',
        fontWeight: 700,
        fontSize: '10px',
        padding: '3px 8px',
        borderRadius: '6px',
        background: 'var(--surface2)',
        color: 'var(--ink3)',
      }}
    >
      COLD
    </span>
  )
}
