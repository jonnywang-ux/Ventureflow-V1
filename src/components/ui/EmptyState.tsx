interface EmptyStateProps {
  message: string
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '60px 20px',
        color: 'var(--ink4)',
        fontFamily: 'Instrument Serif, serif',
        fontStyle: 'italic',
        fontSize: '16px',
      }}
    >
      {message}
    </div>
  )
}
