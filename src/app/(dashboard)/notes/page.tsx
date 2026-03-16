import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/EmptyState'
import { AddNoteModal } from '@/components/modals/AddNoteModal'
import type { Note } from '@/types'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function NotesPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: member } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .single()

  const { data: notes } = await supabase
    .from('notes')
    .select('id, title, content, tags, created_at, updated_at, added_by, team_id')
    .eq('team_id', member?.team_id ?? '')
    .order('created_at', { ascending: false })
    .limit(200)

  const list = (notes ?? []) as Note[]

  return (
    <div>
      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '24px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'Instrument Serif, serif',
              fontWeight: 400,
              fontSize: '28px',
              color: 'var(--ink)',
            }}
          >
            Field <em style={{ fontStyle: 'italic', color: 'var(--ink3)' }}>Notes</em>
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--ink3)', marginTop: '4px', letterSpacing: '0.3px' }}>
            Research observations · meeting notes · market signals
          </p>
        </div>
        <AddNoteModal />
      </div>

      {/* Notes grid */}
      {list.length === 0 ? (
        <EmptyState message="No field notes yet. Log your first observation." />
      ) : (
        <div
          data-testid="note-list"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '16px',
          }}
        >
          {list.map((note) => (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <NoteCard note={note} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function NoteCard({ note }: { note: Note }) {
  const preview = note.content.slice(0, 280)
  const truncated = note.content.length > 280

  return (
    <div
      data-testid="note-card"
      className="card"
      style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '10px' }}
    >
      {/* Gold top accent bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'var(--gold)',
          borderRadius: 'var(--radius) var(--radius) 0 0',
        }}
      />

      {/* Title */}
      <div
        style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 600,
          fontSize: '13px',
          color: 'var(--ink)',
          lineHeight: 1.3,
          paddingRight: '8px',
        }}
      >
        {note.title}
      </div>

      {/* Content preview */}
      <div
        style={{
          fontSize: '12px',
          color: 'var(--ink2)',
          lineHeight: 1.65,
          flex: 1,
        }}
      >
        {preview}
        {truncated ? '…' : ''}
      </div>

      {/* Tags */}
      {note.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {note.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'var(--gold-dim)',
                border: '1px solid var(--border)',
                color: 'var(--gold)',
                letterSpacing: '0.3px',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '8px',
          borderTop: '1px dashed var(--border)',
        }}
      >
        <span style={{ fontSize: '10px', color: 'var(--ink4)', letterSpacing: '0.3px' }}>
          {formatDate(note.created_at)}
        </span>
        {note.updated_at !== note.created_at && (
          <span style={{ fontSize: '10px', color: 'var(--ink4)', fontStyle: 'italic' }}>
            edited
          </span>
        )}
      </div>
    </div>
  )
}
