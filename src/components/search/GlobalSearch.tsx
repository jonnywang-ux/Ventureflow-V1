'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { SearchResult, EntityType } from '@/types'

const ENTITY_ROUTES: Record<EntityType, string> = {
  contact: '/contacts',
  idea: '/ideas',
  action: '/actions',
  note: '/notes',
}

const ENTITY_LABELS: Record<EntityType, string> = {
  contact: 'Contact',
  idea: 'Idea',
  action: 'Action',
  note: 'Note',
}

const ENTITY_COLORS: Record<EntityType, string> = {
  contact: 'var(--ink3)',
  idea: 'var(--idea)',
  action: 'var(--action)',
  note: 'var(--gold)',
}

export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  // Ctrl+K to open
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults([])
      setActiveIndex(0)
    }
  }, [open])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const json = await res.json()
      if (json.success) {
        setResults(json.data)
        setActiveIndex(0)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  function handleInput(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(value), 250)
  }

  function navigate(result: SearchResult) {
    router.push(`${ENTITY_ROUTES[result.entity_type]}`)
    setOpen(false)
  }

  function handleKeyNav(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[activeIndex]) {
      navigate(results[activeIndex])
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(26, 24, 20, 0.55)',
          zIndex: 1000,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '18vh',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '560px',
          maxWidth: 'calc(100vw - 32px)',
          background: 'var(--surface)',
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 20px 60px rgba(26,24,20,0.18)',
          zIndex: 1001,
          overflow: 'hidden',
        }}
      >
        {/* Input row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 18px',
            borderBottom: results.length ? '1px solid var(--border)' : 'none',
          }}
        >
          <span style={{ fontSize: '15px', color: 'var(--ink3)', flexShrink: 0 }}>⌕</span>
          <input
            data-testid="search-input"
            ref={inputRef}
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={handleKeyNav}
            placeholder="Search contacts, ideas, actions, notes…"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'Geist Mono, monospace',
              fontSize: '13px',
              color: 'var(--ink)',
              caretColor: 'var(--ink)',
            }}
          />
          {loading && (
            <span style={{ fontSize: '10px', color: 'var(--ink4)', fontFamily: 'Geist Mono, monospace' }}>
              …
            </span>
          )}
          <kbd
            style={{
              fontFamily: 'Geist Mono, monospace',
              fontSize: '10px',
              color: 'var(--ink4)',
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '2px 6px',
              flexShrink: 0,
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul data-testid="search-results" style={{ listStyle: 'none', margin: 0, padding: '6px 0', maxHeight: '360px', overflowY: 'auto' }}>
            {results.map((result, i) => (
              <li key={result.id}>
                <button
                  data-testid="search-result"
                  onClick={() => navigate(result)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 18px',
                    background: i === activeIndex ? 'var(--bg)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={() => setActiveIndex(i)}
                >
                  <span
                    style={{
                      fontFamily: 'Geist Mono, monospace',
                      fontSize: '9px',
                      fontWeight: 700,
                      color: ENTITY_COLORS[result.entity_type],
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                      width: '52px',
                      flexShrink: 0,
                    }}
                  >
                    {ENTITY_LABELS[result.entity_type]}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'Geist Mono, monospace',
                        fontSize: '12px',
                        color: 'var(--ink)',
                        fontWeight: 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {result.title}
                    </div>
                    {result.subtitle && (
                      <div
                        style={{
                          fontFamily: 'Geist Mono, monospace',
                          fontSize: '10px',
                          color: 'var(--ink3)',
                          marginTop: '2px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {result.subtitle}
                      </div>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Empty state */}
        {query.length >= 2 && !loading && results.length === 0 && (
          <div
            style={{
              padding: '24px 18px',
              fontFamily: 'Geist Mono, monospace',
              fontSize: '12px',
              color: 'var(--ink4)',
              textAlign: 'center',
            }}
          >
            No results for &ldquo;{query}&rdquo;
          </div>
        )}

        {/* Footer hint */}
        <div
          style={{
            padding: '8px 18px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            gap: '16px',
            background: 'var(--bg2)',
          }}
        >
          {[
            { key: '↑↓', label: 'navigate' },
            { key: '↵', label: 'open' },
            { key: 'esc', label: 'close' },
          ].map(({ key, label }) => (
            <span
              key={key}
              style={{
                fontFamily: 'Geist Mono, monospace',
                fontSize: '10px',
                color: 'var(--ink4)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <kbd
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '3px',
                  padding: '1px 5px',
                  fontSize: '10px',
                }}
              >
                {key}
              </kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}
