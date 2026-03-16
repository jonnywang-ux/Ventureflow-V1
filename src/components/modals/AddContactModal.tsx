'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createContact } from '@/app/(dashboard)/contacts/actions'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '7px',
  border: '1px solid var(--border)',
  background: 'var(--bg)',
  fontSize: '13px',
  color: 'var(--ink)',
  fontFamily: 'Geist Mono, monospace',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'Syne, sans-serif',
  fontWeight: 600,
  fontSize: '11px',
  letterSpacing: '0.5px',
  color: 'var(--ink3)',
  marginBottom: '6px',
  textTransform: 'uppercase',
}

const fieldStyle: React.CSSProperties = { marginBottom: '16px' }

export function AddContactModal() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createContact(fd)
      if (result.success) {
        setOpen(false)
        router.refresh()
      } else {
        setError(
          typeof result.error === 'string' ? result.error : 'Please check the form and try again',
        )
      }
    })
  }

  return (
    <>
      <button
        data-testid="add-contact-btn"
        onClick={() => setOpen(true)}
        style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 600,
          fontSize: '11px',
          letterSpacing: '0.5px',
          padding: '8px 16px',
          borderRadius: '7px',
          background: 'var(--ink)',
          color: 'var(--bg)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        + Add Contact
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(26,24,20,0.55)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
            }}
          />

          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'var(--surface)',
              borderRadius: '12px',
              padding: '28px 32px',
              width: 'min(560px, 90vw)',
              maxHeight: '85vh',
              overflowY: 'auto',
              zIndex: 1001,
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
              }}
            >
              <h2
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '16px',
                  color: 'var(--ink)',
                }}
              >
                Add Contact
              </h2>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--ink3)',
                  fontSize: '20px',
                  lineHeight: 1,
                  padding: '4px',
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Name *</label>
                <input data-testid="contact-name-input" name="name" style={inputStyle} placeholder="Full name" required />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <label style={labelStyle}>Role</label>
                  <input name="role" style={inputStyle} placeholder="Partner, Founder..." />
                </div>
                <div>
                  <label style={labelStyle}>Organization</label>
                  <input name="organization" style={inputStyle} placeholder="Company / Fund" />
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <label style={labelStyle}>Region</label>
                  <select
                    name="region"
                    style={{ ...inputStyle, WebkitAppearance: 'none', appearance: 'none' }}
                  >
                    <option value="">— none —</option>
                    <option value="china">China</option>
                    <option value="usa">USA</option>
                    <option value="global">Global</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Warmth (0–5)</label>
                  <input
                    name="warmth"
                    type="number"
                    min={0}
                    max={5}
                    defaultValue={0}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Tags</label>
                <input
                  name="tags"
                  style={inputStyle}
                  placeholder="vc, china-ai, founder — comma separated"
                />
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    name="email"
                    type="email"
                    style={inputStyle}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input name="phone" style={inputStyle} placeholder="+1 555..." />
                </div>
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>LinkedIn</label>
                <input name="linkedin" style={inputStyle} placeholder="linkedin.com/in/..." />
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>Notes</label>
                <textarea
                  name="notes"
                  style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                  placeholder="Background, context, how we met..."
                />
              </div>

              {error && (
                <p style={{ fontSize: '12px', color: 'var(--china)', marginBottom: '16px' }}>
                  {error}
                </p>
              )}

              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 600,
                    fontSize: '11px',
                    letterSpacing: '0.5px',
                    padding: '8px 16px',
                    borderRadius: '7px',
                    background: 'none',
                    color: 'var(--ink3)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  data-testid="contact-submit"
                  type="submit"
                  disabled={isPending}
                  style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 600,
                    fontSize: '11px',
                    letterSpacing: '0.5px',
                    padding: '8px 16px',
                    borderRadius: '7px',
                    background: isPending ? 'var(--ink3)' : 'var(--ink)',
                    color: 'var(--bg)',
                    border: 'none',
                    cursor: isPending ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isPending ? 'Saving...' : 'Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  )
}
