'use client'

import React, { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

export interface ImportRecord {
  id: string
  file_name: string
  import_type: string
  status: string
  error_message: string | null
  created_at: string
}

interface ImportHistoryProps {
  records: ImportRecord[]
  teamId: string
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'success':
      return 'var(--idea)'
    case 'error':
      return 'var(--china)'
    case 'pending':
      return 'var(--gold)'
    default:
      return 'var(--ink3)'
  }
}

const getStatusDot = (status: string): string => {
  switch (status) {
    case 'success':
      return 'Success'
    case 'error':
      return 'Error'
    case 'pending':
      return 'Pending'
    default:
      return 'Unknown'
  }
}

export default function ImportHistory({ records: initialRecords, teamId }: ImportHistoryProps) {
  const [records, setRecords] = useState<ImportRecord[]>(initialRecords)

  useEffect(() => {
    const supabase = createBrowserClient()

    const channel = supabase
      .channel('import_history_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'import_history',
          filter: `team_id=eq.${teamId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newRecord = payload.new as ImportRecord
            setRecords((prev) => [newRecord, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as ImportRecord
            setRecords((prev) =>
              prev.map((r) => (r.id === updated.id ? updated : r))
            )
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string }
            setRecords((prev) => prev.filter((r) => r.id !== deleted.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [teamId])

  return (
    <div>
      <h3 style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: '13px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: 'var(--ink3)',
        margin: '0 0 16px 0',
      }}>
        Import History
      </h3>

      {records.length === 0 ? (
        <div style={{
          padding: '16px',
          textAlign: 'center',
          color: 'var(--ink4)',
          fontFamily: 'Geist Mono, monospace',
          fontSize: '13px',
        }}>
          No imports yet
        </div>
      ) : (
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
        }}>
          {records.map((record, index) => (
            <div
              key={record.id}
              style={{
                padding: '12px 16px',
                borderBottom:
                  index < records.length - 1 ? '1px solid var(--border)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '13px',
              }}
              title={record.error_message || ''}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontFamily: 'Geist Mono, monospace',
                  fontSize: '13px',
                  color: 'var(--ink)',
                  margin: '0 0 4px 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {record.file_name}
                </p>
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                }}>
                  <span style={{
                    padding: '2px 6px',
                    backgroundColor: 'var(--bg2)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    fontSize: '10px',
                    fontFamily: 'Geist Mono, monospace',
                    color: 'var(--ink3)',
                    textTransform: 'uppercase',
                  }}>
                    {record.import_type}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontFamily: 'Geist Mono, monospace',
                    color: 'var(--ink3)',
                  }}>
                    {formatDate(record.created_at)}
                  </span>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
              }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(record.status),
                  }}
                  title={record.error_message || getStatusDot(record.status)}
                />
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'Geist Mono, monospace',
                    color: getStatusColor(record.status),
                    textTransform: 'capitalize',
                  }}
                >
                  {record.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
