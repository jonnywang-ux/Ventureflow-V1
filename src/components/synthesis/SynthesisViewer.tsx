'use client'

import React, { useState } from 'react'
import type { Thesis } from '@/types'

interface SynthesisViewerProps {
  thesis: Pick<Thesis, 'id' | 'content' | 'generated_at' | 'created_by'>
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function renderContent(content: string): React.ReactNode[] {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let key = 0

  for (const line of lines) {
    if (line.startsWith('## ')) {
      elements.push(
        <h2
          key={key++}
          style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '15px',
            fontWeight: 700,
            color: 'var(--ink)',
            margin: '28px 0 10px 0',
            paddingBottom: '6px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1
          key={key++}
          style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '20px',
            fontWeight: 800,
            color: 'var(--ink)',
            margin: '0 0 16px 0',
          }}
        >
          {line.slice(2)}
        </h1>
      )
    } else if (line.trim()) {
      elements.push(
        <p
          key={key++}
          style={{
            fontFamily: 'Geist Mono, monospace',
            fontSize: '13px',
            color: 'var(--ink2)',
            lineHeight: '1.75',
            margin: '0 0 12px 0',
          }}
        >
          {line}
        </p>
      )
    }
  }

  return elements
}

export default function SynthesisViewer({ thesis }: SynthesisViewerProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(thesis.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--bg2)',
        }}
      >
        <span
          style={{
            fontFamily: 'Geist Mono, monospace',
            fontSize: '11px',
            color: 'var(--ink3)',
          }}
        >
          Generated {formatDate(thesis.generated_at)}
        </span>
        <button
          onClick={handleCopy}
          style={{
            padding: '4px 12px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            backgroundColor: 'var(--surface)',
            fontFamily: 'Geist Mono, monospace',
            fontSize: '11px',
            color: copied ? 'var(--idea)' : 'var(--ink3)',
            cursor: 'pointer',
          }}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      <div data-testid="synthesis-content" style={{ padding: '28px 32px', maxWidth: '800px' }}>
        {renderContent(thesis.content)}
      </div>
    </div>
  )
}
