'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface GenerateSynthesisButtonProps {
  hasExisting: boolean
}

export default function GenerateSynthesisButton({ hasExisting }: GenerateSynthesisButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleClick = () => {
    if (hasExisting) {
      setShowConfirm(true)
    } else {
      handleGenerate()
    }
  }

  const handleGenerate = () => {
    setShowConfirm(false)
    setError(null)
    startTransition(async () => {
      const res = await fetch('/api/synthesis', { method: 'POST' })
      const json = await res.json()
      if (!json.success) {
        setError(json.error || 'Failed to generate synthesis')
        return
      }
      router.refresh()
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px', flexShrink: 0 }}>
      {showConfirm ? (
        <div
          style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '10px 16px',
            backgroundColor: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontFamily: 'Geist Mono, monospace',
            fontSize: '12px',
            color: 'var(--ink2)',
          }}
        >
          <span>Overwrite existing thesis?</span>
          <button
            data-testid="confirm-regenerate"
            onClick={handleGenerate}
            style={{
              padding: '4px 12px',
              border: 'none',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--china)',
              color: '#fff',
              fontFamily: 'Geist Mono, monospace',
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            Yes, regenerate
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            style={{
              padding: '4px 12px',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              backgroundColor: 'transparent',
              fontFamily: 'Geist Mono, monospace',
              fontSize: '11px',
              color: 'var(--ink3)',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          data-testid="generate-btn"
          onClick={handleClick}
          disabled={isPending}
          style={{
            padding: '8px 20px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            backgroundColor: isPending ? 'var(--bg2)' : 'var(--ink)',
            color: isPending ? 'var(--ink3)' : 'var(--surface)',
            fontFamily: 'Geist Mono, monospace',
            fontSize: '12px',
            cursor: isPending ? 'default' : 'pointer',
            transition: 'background-color 0.1s',
          }}
        >
          {isPending ? 'Generating...' : hasExisting ? 'Regenerate' : 'Generate'}
        </button>
      )}

      {error && (
        <p
          style={{
            fontFamily: 'Geist Mono, monospace',
            fontSize: '11px',
            color: 'var(--china)',
            margin: 0,
          }}
        >
          {error}
        </p>
      )}
    </div>
  )
}
