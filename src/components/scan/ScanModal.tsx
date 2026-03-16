'use client'

import React, { useState, useTransition, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { NameCardData, NotesData } from '@/lib/ai/extraction'
import { createContact } from '@/app/(dashboard)/contacts/actions'
import { createNote } from '@/app/(dashboard)/notes/actions'

type Mode = 'namecard' | 'notes'
type Stage = 'input' | 'scanning' | 'results'

interface ScanModalProps {
  open: boolean
  onClose: () => void
}

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

export function ScanModal({ open, onClose }: ScanModalProps) {
  const router = useRouter()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const docxInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<Mode>('namecard')
  const [stage, setStage] = useState<Stage>('input')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [docxFile, setDocxFile] = useState<File | null>(null)
  const [noteText, setNoteText] = useState('')
  const [namecardResult, setNamecardResult] = useState<NameCardData | null>(null)
  const [notesResult, setNotesResult] = useState<NotesData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [ncName, setNcName] = useState('')
  const [ncRole, setNcRole] = useState('')
  const [ncOrg, setNcOrg] = useState('')
  const [ncEmail, setNcEmail] = useState('')
  const [ncPhone, setNcPhone] = useState('')
  const [ncLinkedin, setNcLinkedin] = useState('')
  const [ncRegion, setNcRegion] = useState<'china' | 'usa' | ''>('')

  const [isScanning, startScanTransition] = useTransition()
  const [isSaving, startSaveTransition] = useTransition()

  if (!open) return null

  function handleClose() {
    setMode('namecard')
    setStage('input')
    setImageFile(null)
    setDocxFile(null)
    setNoteText('')
    setNamecardResult(null)
    setNotesResult(null)
    setError(null)
    setNcName('')
    setNcRole('')
    setNcOrg('')
    setNcEmail('')
    setNcPhone('')
    setNcLinkedin('')
    setNcRegion('')
    onClose()
  }

  function handleModeChange(newMode: Mode) {
    setMode(newMode)
    setStage('input')
    setImageFile(null)
    setDocxFile(null)
    setNoteText('')
    setNamecardResult(null)
    setNotesResult(null)
    setError(null)
  }

  function handleScan() {
    setError(null)
    startScanTransition(async () => {
      try {
        const formData = new FormData()
        formData.set('mode', mode)

        if (mode === 'namecard') {
          if (!imageFile) {
            setError('Please select an image file.')
            return
          }
          formData.set('image', imageFile)
        } else {
          if (!noteText.trim() && !docxFile) {
            setError('Please enter some text or upload a .docx file.')
            return
          }
          formData.set('text', noteText)
          if (docxFile) formData.set('docx', docxFile)
        }

        setStage('scanning')

        const res = await fetch('/api/scan', { method: 'POST', body: formData })
        const json = await res.json()

        if (!json.success) {
          setError(json.error ?? 'Extraction failed.')
          setStage('input')
          return
        }

        if (mode === 'namecard') {
          const data = json.data as NameCardData
          setNamecardResult(data)
          setNcName(data.name)
          setNcRole(data.role)
          setNcOrg(data.organization)
          setNcEmail(data.email)
          setNcPhone(data.phone)
          setNcLinkedin(data.linkedin)
          setNcRegion(data.region ?? '')
        } else {
          setNotesResult(json.data as NotesData)
        }

        setStage('results')
      } catch {
        setError('Network error. Please try again.')
        setStage('input')
      }
    })
  }

  function handleSaveContact() {
    startSaveTransition(async () => {
      const fd = new FormData()
      fd.set('name', ncName)
      fd.set('role', ncRole)
      fd.set('organization', ncOrg)
      fd.set('email', ncEmail)
      fd.set('phone', ncPhone)
      fd.set('linkedin', ncLinkedin)
      if (ncRegion) fd.set('region', ncRegion)

      const result = await createContact(fd)
      if (!result.success) {
        setError(typeof result.error === 'string' ? result.error : 'Failed to save contact.')
        return
      }
      router.refresh()
      handleClose()
    })
  }

  function handleSaveNote() {
    if (!notesResult) return
    startSaveTransition(async () => {
      const fd = new FormData()
      fd.set('title', notesResult.title)
      fd.set('content', notesResult.content)
      fd.set('tags', notesResult.tags.join(','))

      const result = await createNote(fd)
      if (!result.success) {
        setError(typeof result.error === 'string' ? result.error : 'Failed to save note.')
        return
      }
      router.refresh()
      handleClose()
    })
  }

  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(26,24,20,0.55)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
  }

  const cardStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%,-50%)',
    background: 'var(--surface)',
    borderRadius: '12px',
    padding: '28px 32px',
    width: 'min(560px, 90vw)',
    maxHeight: '85vh',
    overflowY: 'auto',
    zIndex: 1001,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
  }

  return (
    <>
      <div style={backdropStyle} onClick={handleClose} />
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--ink)', margin: 0 }}>
            AI Scan
          </h2>
          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink3)', fontSize: '18px', padding: '4px', lineHeight: 1 }}
          >
            x
          </button>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {(['namecard', 'notes'] as const).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              disabled={stage === 'scanning'}
              style={{
                padding: '6px 16px',
                borderRadius: '7px',
                border: '1px solid var(--border)',
                background: mode === m ? 'var(--ink)' : 'transparent',
                color: mode === m ? 'var(--surface)' : 'var(--ink2)',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 600,
                fontSize: '11px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                cursor: stage === 'scanning' ? 'not-allowed' : 'pointer',
              }}
            >
              {m === 'namecard' ? 'Name Card' : 'Notes'}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(201,64,64,0.08)', border: '1px solid rgba(201,64,64,0.2)', color: 'var(--china)', fontSize: '13px', fontFamily: 'Geist Mono, monospace' }}>
            {error}
          </div>
        )}

        {/* Scanning state */}
        {stage === 'scanning' && (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink3)', fontFamily: 'Syne, sans-serif', fontSize: '13px' }}>
            Extracting data...
          </div>
        )}

        {/* Input stage — namecard */}
        {stage === 'input' && mode === 'namecard' && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>Business Card Image</label>
              <div
                onClick={() => imageInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border)',
                  borderRadius: '8px',
                  padding: '24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  color: imageFile ? 'var(--ink2)' : 'var(--ink4)',
                  fontSize: '13px',
                  fontFamily: 'Geist Mono, monospace',
                  background: 'var(--bg)',
                }}
              >
                {imageFile ? imageFile.name : 'Click to upload JPEG or PNG (max 10MB)'}
              </div>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png"
                style={{ display: 'none' }}
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <button
              onClick={handleScan}
              disabled={!imageFile}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: imageFile ? 'var(--ink)' : 'var(--bg2)',
                color: imageFile ? 'var(--surface)' : 'var(--ink4)',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '13px',
                cursor: imageFile ? 'pointer' : 'not-allowed',
                letterSpacing: '0.5px',
              }}
            >
              Scan Card
            </button>
          </>
        )}

        {/* Input stage — notes */}
        {stage === 'input' && mode === 'notes' && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>Notes Text</label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Paste meeting notes, observations, or field notes..."
                rows={6}
                style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.5' }}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Upload .docx (optional)</label>
              <div
                onClick={() => docxInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border)',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  color: docxFile ? 'var(--ink2)' : 'var(--ink4)',
                  fontSize: '13px',
                  fontFamily: 'Geist Mono, monospace',
                  background: 'var(--bg)',
                }}
              >
                {docxFile ? docxFile.name : 'Click to upload .docx (max 10MB)'}
              </div>
              <input
                ref={docxInputRef}
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                style={{ display: 'none' }}
                onChange={(e) => setDocxFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <button
              onClick={handleScan}
              disabled={!noteText.trim() && !docxFile}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: (noteText.trim() || docxFile) ? 'var(--ink)' : 'var(--bg2)',
                color: (noteText.trim() || docxFile) ? 'var(--surface)' : 'var(--ink4)',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700,
                fontSize: '13px',
                cursor: (noteText.trim() || docxFile) ? 'pointer' : 'not-allowed',
                letterSpacing: '0.5px',
              }}
            >
              Extract Note
            </button>
          </>
        )}

        {/* Results — namecard */}
        {stage === 'results' && mode === 'namecard' && namecardResult && (
          <>
            <p style={{ fontFamily: 'Syne, sans-serif', fontSize: '11px', color: 'var(--ink3)', marginBottom: '20px', marginTop: 0 }}>
              Review and edit extracted details before saving.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Name</label>
                <input style={inputStyle} value={ncName} onChange={(e) => setNcName(e.target.value)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Role</label>
                <input style={inputStyle} value={ncRole} onChange={(e) => setNcRole(e.target.value)} />
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Organization</label>
              <input style={inputStyle} value={ncOrg} onChange={(e) => setNcOrg(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} value={ncEmail} onChange={(e) => setNcEmail(e.target.value)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} value={ncPhone} onChange={(e) => setNcPhone(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>LinkedIn</label>
                <input style={inputStyle} value={ncLinkedin} onChange={(e) => setNcLinkedin(e.target.value)} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Region</label>
                <select
                  value={ncRegion}
                  onChange={(e) => setNcRegion(e.target.value as 'china' | 'usa' | '')}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="">Unknown</option>
                  <option value="china">China</option>
                  <option value="usa">USA</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={() => setStage('input')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--ink2)',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Rescan
              </button>
              <button
                onClick={handleSaveContact}
                disabled={isSaving || !ncName.trim()}
                style={{
                  flex: 2,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: (isSaving || !ncName.trim()) ? 'var(--bg2)' : 'var(--ink)',
                  color: (isSaving || !ncName.trim()) ? 'var(--ink4)' : 'var(--surface)',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: (isSaving || !ncName.trim()) ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.5px',
                }}
              >
                {isSaving ? 'Saving...' : 'Save Contact'}
              </button>
            </div>
          </>
        )}

        {/* Results — notes */}
        {stage === 'results' && mode === 'notes' && notesResult && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>Title</label>
              <div style={{ ...inputStyle, background: 'var(--bg2)', color: 'var(--ink)', padding: '8px 12px', borderRadius: '7px' }}>
                {notesResult.title}
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Tags</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {notesResult.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: '3px 10px',
                      borderRadius: '20px',
                      background: 'var(--bg2)',
                      border: '1px solid var(--border)',
                      fontSize: '11px',
                      fontFamily: 'Geist Mono, monospace',
                      color: 'var(--ink2)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle}>Content</label>
              <div
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: '7px',
                  padding: '12px',
                  fontSize: '13px',
                  fontFamily: 'Geist Mono, monospace',
                  color: 'var(--ink2)',
                  lineHeight: '1.6',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {notesResult.content}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button
                onClick={() => setStage('input')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--ink2)',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Rescan
              </button>
              <button
                onClick={handleSaveNote}
                disabled={isSaving}
                style={{
                  flex: 2,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isSaving ? 'var(--bg2)' : 'var(--ink)',
                  color: isSaving ? 'var(--ink4)' : 'var(--surface)',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  letterSpacing: '0.5px',
                }}
              >
                {isSaving ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
