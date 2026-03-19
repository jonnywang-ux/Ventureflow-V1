'use client'

import React, { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { saveImportResults } from '@/app/(dashboard)/import/actions'
import type { ExtractedContact, ExtractedIdea } from '@/lib/ai/extraction'

interface StructuredResult {
  title: string
  tags: string[]
  content: string
  contacts: ExtractedContact[]
  ideas: ExtractedIdea[]
}

interface ImportResult {
  importId: string
  rawText: string
  structured: StructuredResult
}

type Stage = 'idle' | 'uploading' | 'results' | 'saving'

export default function ImportUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, startUpload] = useTransition()
  const [isSaving, startSave] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    setError(null)
    setStage('uploading')

    const formData = new FormData()
    formData.set('file', file)

    startUpload(async () => {
      try {
        const response = await fetch('/api/import', {
          method: 'POST',
          body: formData,
        })

        const json = await response.json()

        if (!json.success) {
          setError(json.error || 'Import failed')
          setStage('idle')
          return
        }

        setResult({
          importId: json.data.importId,
          rawText: json.data.rawText,
          structured: json.data.structured,
        })
        setStage('results')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed'
        setError(message)
        setStage('idle')
      }
    })
  }

  const handleSaveNote = () => {
    if (!result) return

    setError(null)
    startSave(async () => {
      try {
        const res = await saveImportResults({
          note: {
            title: result.structured.title,
            content: result.structured.content,
            tags: result.structured.tags,
          },
          contacts: result.structured.contacts ?? [],
          ideas: result.structured.ideas ?? [],
        })

        if (res.success) {
          router.push('/notes')
        } else {
          setError(res.error || 'Failed to save')
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Save failed'
        setError(message)
      }
    })
  }

  const handleReset = () => {
    setFile(null)
    setStage('idle')
    setResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      setFile(droppedFile)
      setError(null)
    }
  }

  return (
    <div>
      {error && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          backgroundColor: 'rgba(220, 38, 38, 0.1)',
          border: '1px solid var(--china)',
          borderRadius: 'var(--radius)',
          fontSize: '13px',
          color: 'var(--china)',
          fontFamily: 'Geist Mono, monospace',
        }}>
          {error}
        </div>
      )}

      {stage === 'idle' && (
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '28px',
        }}>
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '24px',
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius)',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--ink)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
            }}
          >
            <p style={{
              fontFamily: 'Geist Mono, monospace',
              fontSize: '13px',
              color: file ? 'var(--ink)' : 'var(--ink3)',
              margin: '0 0 8px 0',
            }}>
              {file ? file.name : 'Drop file here or click to select'}
            </p>
            <p style={{
              fontFamily: 'Geist Mono, monospace',
              fontSize: '12px',
              color: 'var(--ink4)',
              margin: 0,
            }}>
              Accept .docx, .xlsx, .pdf, .md • Max 10MB
            </p>
          </div>

          <input
            data-testid="file-input"
            ref={fileInputRef}
            type="file"
            accept=".docx,.xlsx,.pdf,.md,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/pdf,text/markdown"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <button
            data-testid="upload-btn"
            onClick={handleUpload}
            disabled={!file || isUploading}
            style={{
              marginTop: '20px',
              width: '100%',
              padding: '12px 16px',
              fontFamily: 'Geist Mono, monospace',
              fontSize: '13px',
              fontWeight: 600,
              backgroundColor: file && !isUploading ? 'var(--ink)' : 'var(--border)',
              color: 'var(--bg)',
              border: 'none',
              borderRadius: 'var(--radius)',
              cursor: file && !isUploading ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (file && !isUploading) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--ink2)'
              }
            }}
            onMouseLeave={(e) => {
              if (file && !isUploading) {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--ink)'
              }
            }}
          >
            {isUploading ? 'Processing...' : 'Import & Extract'}
          </button>
        </div>
      )}

      {stage === 'uploading' && (
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '28px',
          textAlign: 'center',
          minHeight: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <p style={{
            fontFamily: 'Geist Mono, monospace',
            fontSize: '13px',
            color: 'var(--ink3)',
            margin: 0,
          }}>
            Extracting with Claude...
          </p>
        </div>
      )}

      {stage === 'results' && result && (
        <div
          data-testid="import-results"
          style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '28px',
        }}>
          <h3
            data-testid="extracted-title"
            style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '16px',
            fontWeight: 700,
            margin: '0 0 16px 0',
            color: 'var(--ink)',
          }}>
            {result.structured.title}
          </h3>

          {result.structured.tags.length > 0 && (
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '16px',
            }}>
              {result.structured.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: '4px 10px',
                    backgroundColor: 'var(--bg2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    fontSize: '11px',
                    fontFamily: 'Geist Mono, monospace',
                    color: 'var(--ink3)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div style={{
            padding: '12px',
            backgroundColor: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            marginBottom: '16px',
            fontSize: '13px',
            fontFamily: 'Geist Mono, monospace',
            color: 'var(--ink)',
            lineHeight: 1.5,
          }}>
            {result.structured.content.length > 300
              ? result.structured.content.slice(0, 300) + '...'
              : result.structured.content}
          </div>

          {(result.structured.contacts ?? []).length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{
                fontFamily: 'Geist Mono, monospace',
                fontSize: '11px',
                color: 'var(--ink3)',
                margin: '0 0 8px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Contacts found ({result.structured.contacts.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {result.structured.contacts.map((c, i) => (
                  <div key={i} style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    fontSize: '12px',
                    fontFamily: 'Geist Mono, monospace',
                    color: 'var(--ink2)',
                  }}>
                    <strong>{c.name}</strong>
                    {c.role && ` — ${c.role}`}
                    {c.organization && `, ${c.organization}`}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(result.structured.ideas ?? []).length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{
                fontFamily: 'Geist Mono, monospace',
                fontSize: '11px',
                color: 'var(--ink3)',
                margin: '0 0 8px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Ideas found ({result.structured.ideas.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {result.structured.ideas.map((idea, i) => (
                  <div key={i} style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    fontSize: '12px',
                    fontFamily: 'Geist Mono, monospace',
                    color: 'var(--ink2)',
                  }}>
                    <strong>{idea.title}</strong>
                    {idea.description && <div style={{ color: 'var(--ink3)', marginTop: '2px' }}>{idea.description.slice(0, 100)}{idea.description.length > 100 && '...'}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <details style={{
            marginBottom: '16px',
            cursor: 'pointer',
          }}>
            <summary style={{
              fontSize: '12px',
              fontFamily: 'Geist Mono, monospace',
              color: 'var(--ink4)',
              fontStyle: 'italic',
            }}>
              Show raw text ({result.rawText.length} chars)
            </summary>
            <div style={{
              padding: '12px',
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              marginTop: '8px',
              fontSize: '12px',
              fontFamily: 'Geist Mono, monospace',
              color: 'var(--ink4)',
              maxHeight: '200px',
              overflowY: 'auto',
            }}>
              {result.rawText.slice(0, 200)}
              {result.rawText.length > 200 && '...'}
            </div>
          </details>

          <div style={{
            display: 'flex',
            gap: '12px',
          }}>
            <button
              data-testid="save-note-btn"
              onClick={handleSaveNote}
              disabled={isSaving}
              style={{
                flex: 1,
                padding: '12px 16px',
                fontFamily: 'Geist Mono, monospace',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: 'var(--idea)',
                color: 'var(--bg)',
                border: 'none',
                borderRadius: 'var(--radius)',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving) {
                  (e.currentTarget as HTMLButtonElement).style.opacity = '1'
                }
              }}
            >
              {isSaving ? 'Saving...' : 'Save All'}
            </button>

            <button
              onClick={handleReset}
              disabled={isSaving}
              style={{
                flex: 1,
                padding: '12px 16px',
                fontFamily: 'Geist Mono, monospace',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: 'var(--border)',
                color: 'var(--ink)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isSaving) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--bg2)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isSaving) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--border)'
                }
              }}
            >
              Import Another
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
