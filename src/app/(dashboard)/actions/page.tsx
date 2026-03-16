import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { EmptyState } from '@/components/ui/EmptyState'
import { AddActionModal } from '@/components/modals/AddActionModal'
import type { Action } from '@/types'

function dueBadge(dueDate: string | null): React.ReactNode {
  if (!dueDate) return null

  const due = new Date(dueDate)
  const now = new Date()
  const diffDays = Math.ceil((due.getTime() - now.getTime()) / 86400000)

  if (diffDays < 0) {
    return (
      <span
        style={{
          fontSize: '10px',
          padding: '2px 8px',
          borderRadius: '4px',
          background: 'rgba(201,64,64,0.1)',
          color: 'var(--china)',
          letterSpacing: '0.3px',
        }}
      >
        Overdue
      </span>
    )
  }

  if (diffDays <= 3) {
    return (
      <span
        style={{
          fontSize: '10px',
          padding: '2px 8px',
          borderRadius: '4px',
          background: 'var(--gold-dim)',
          color: 'var(--gold)',
          letterSpacing: '0.3px',
        }}
      >
        Due {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </span>
    )
  }

  return (
    <span
      style={{
        fontSize: '10px',
        padding: '2px 8px',
        borderRadius: '4px',
        background: 'var(--surface2)',
        color: 'var(--ink3)',
        letterSpacing: '0.3px',
      }}
    >
      {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
    </span>
  )
}

export default async function ActionsPage() {
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

  const { data: teamMembers } = await supabase
    .from('team_members')
    .select('user_id, initials, color')
    .eq('team_id', member?.team_id ?? '')
    .limit(20)

  const { data: actions } = await supabase
    .from('actions')
    .select('id, title, description, status, due_date, assigned_to, created_at')
    .eq('team_id', member?.team_id ?? '')
    .in('status', ['open', 'in_progress'])
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(200)

  const list = (actions ?? []) as Action[]
  const open = list.filter((a) => a.status === 'open')
  const inProgress = list.filter((a) => a.status === 'in_progress')

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
            Next <em style={{ fontStyle: 'italic', color: 'var(--ink3)' }}>Steps</em>
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--ink3)', marginTop: '4px', letterSpacing: '0.3px' }}>
            Open action items — tracked by the team
          </p>
        </div>
        <AddActionModal teamMembers={teamMembers ?? []} />
      </div>

      {list.length === 0 ? (
        <EmptyState message="No open actions. Add your first next step." />
      ) : (
        <>
          {inProgress.length > 0 && (
            <>
              <SectionLabel label="In Progress" count={inProgress.length} />
              <ActionList actions={inProgress} />
            </>
          )}
          {open.length > 0 && (
            <>
              <SectionLabel label="Open" count={open.length} />
              <ActionList actions={open} />
            </>
          )}
        </>
      )}
    </div>
  )
}

function SectionLabel({ label, count }: { label: string; count: number }) {
  return (
    <div
      style={{
        fontFamily: 'Syne, sans-serif',
        fontWeight: 600,
        fontSize: '11px',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        color: 'var(--ink3)',
        marginBottom: '12px',
        marginTop: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {label}
      <span
        style={{
          fontSize: '10px',
          padding: '1px 7px',
          borderRadius: '10px',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          color: 'var(--ink3)',
        }}
      >
        {count}
      </span>
      <span style={{ flex: 1, height: '1px', background: 'var(--border)', display: 'block' }} />
    </div>
  )
}

function ActionList({ actions }: { actions: Action[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '8px' }}>
      {actions.map((action) => (
        <Link
          key={action.id}
          href={`/actions/${action.id}`}
          style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
        >
        <div
          className="card"
          style={{ padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}
        >
          {/* Checkbox */}
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '4px',
              border: '2px solid var(--border-dark)',
              flexShrink: 0,
              cursor: 'pointer',
              marginTop: '1px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: action.status === 'in_progress' ? 'var(--idea-dim)' : 'transparent',
              borderColor: action.status === 'in_progress' ? 'var(--idea)' : 'var(--border-dark)',
            }}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'Syne, sans-serif',
                fontWeight: 600,
                fontSize: '13px',
                color: 'var(--ink)',
                marginBottom: '3px',
              }}
            >
              {action.title}
            </div>

            {action.description && (
              <div style={{ fontSize: '11px', color: 'var(--ink3)', lineHeight: 1.5, marginBottom: '6px' }}>
                {action.description}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {dueBadge(action.due_date)}
              {action.status === 'in_progress' && (
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'var(--idea-dim)',
                    color: 'var(--idea)',
                    letterSpacing: '0.3px',
                  }}
                >
                  In progress
                </span>
              )}
            </div>
          </div>
        </div>
        </Link>
      ))}
    </div>
  )
}
