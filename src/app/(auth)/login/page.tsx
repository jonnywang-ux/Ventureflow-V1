'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createBrowserClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '400px',
      }}
    >
      {/* Logo / Brand */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1
          style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: '28px',
            letterSpacing: '-0.5px',
            color: 'var(--ink)',
          }}
        >
          VentureFlow
        </h1>
        <p
          style={{
            fontFamily: 'Geist Mono, monospace',
            fontWeight: 300,
            fontSize: '13px',
            color: 'var(--ink3)',
            marginTop: '6px',
          }}
        >
          AI Venture Intelligence Hub
        </p>
      </div>

      {/* Login Card */}
      <div className="card" style={{ padding: '32px' }}>
        <h2
          style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '18px',
            marginBottom: '24px',
          }}
        >
          Sign in
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '12px',
                color: 'var(--ink3)',
                marginBottom: '6px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Email
            </label>
            <input
              id="email"
              data-testid="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '12px',
                color: 'var(--ink3)',
                marginBottom: '6px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              Password
            </label>
            <input
              id="password"
              data-testid="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div
              data-testid="login-error"
              style={{
                padding: '10px 14px',
                background: 'color-mix(in srgb, var(--china) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--china) 25%, transparent)',
                borderRadius: '6px',
                fontSize: '13px',
                color: 'var(--china)',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          <button
            data-testid="login-submit"
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 20px',
              background: 'var(--ink)',
              color: 'var(--surface)',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'Geist Mono, monospace',
              fontWeight: 300,
              letterSpacing: '0.03em',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 0.15s ease',
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>

      <p
        style={{
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--ink4)',
          marginTop: '20px',
        }}
      >
        Access restricted to team members only.
      </p>
    </div>
  )
}
