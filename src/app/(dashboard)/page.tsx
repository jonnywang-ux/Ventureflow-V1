import { createServerClient, getTeamId } from '@/lib/supabase/server'
import type { ActivityLogEntry, EntityType } from '@/types'

const ENTITY_COLORS: Record<EntityType, string> = {
  contact: 'var(--usa)',
  idea: 'var(--china)',
  action: 'var(--action)',
  note: 'var(--gold)',
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default async function DashboardPage() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const teamId = await getTeamId(user.id)

  if (!teamId) return null

  const [contacts, ideas, actions, notes, activityResult] = await Promise.all([
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('team_id', teamId),
    supabase.from('ideas').select('id', { count: 'exact', head: true }).eq('team_id', teamId).eq('status', 'active'),
    supabase.from('actions').select('id', { count: 'exact', head: true }).eq('team_id', teamId).eq('status', 'open'),
    supabase.from('notes').select('id', { count: 'exact', head: true }).eq('team_id', teamId),
    supabase
      .from('activity_log')
      .select('id, user_id, action, entity_type, entity_name, created_at')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const stats = [
    { label: 'Contacts', count: contacts.count ?? 0, color: 'var(--usa)', accent: 'linear-gradient(90deg, var(--china), var(--usa))' },
    { label: 'Active Ideas', count: ideas.count ?? 0, color: 'var(--idea)', accent: 'var(--idea)' },
    { label: 'Open Actions', count: actions.count ?? 0, color: 'var(--action)', accent: 'var(--action)' },
    { label: 'Field Notes', count: notes.count ?? 0, color: 'var(--gold)', accent: 'var(--gold)' },
  ]

  const activity = (activityResult.data ?? []) as ActivityLogEntry[]

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
              lineHeight: 1.2,
            }}
          >
            AI Venture Intelligence <em style={{ fontStyle: 'italic', color: 'var(--ink3)' }}>Hub</em>
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--ink3)', marginTop: '4px', letterSpacing: '0.3px' }}>
            3-person team · China &amp; USA research · AI space
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        {stats.map(({ label, count, color, accent }) => (
          <div key={label} data-testid="stat-card" className="card" style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: accent,
                borderRadius: 'var(--radius) var(--radius) 0 0',
              }}
            />
            <div
              className="stat-number"
              style={{ fontSize: '40px', lineHeight: 1, color, marginBottom: '4px' }}
            >
              {count}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ink3)', letterSpacing: '0.3px' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Activity feed */}
      <div
        style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 600,
          fontSize: '11px',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: 'var(--ink3)',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        Team Activity Feed
        <span style={{ flex: 1, height: '1px', background: 'var(--border)', display: 'block' }} />
      </div>

      {activity.length === 0 ? (
        <p style={{ fontSize: '13px', color: 'var(--ink4)', fontStyle: 'italic' }}>
          No activity yet. Add contacts, ideas, or notes to get started.
        </p>
      ) : (
        <div data-testid="activity-feed" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activity.map((entry) => (
            <div
              key={entry.id}
              data-testid="activity-entry"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
            >
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: ENTITY_COLORS[entry.entity_type],
                  flexShrink: 0,
                }}
              />
              <div style={{ fontSize: '11px', color: 'var(--ink2)', flex: 1 }}>
                {entry.action}
                {entry.entity_name ? (
                  <span style={{ color: 'var(--ink)' }}> — {entry.entity_name}</span>
                ) : null}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--ink4)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {timeAgo(entry.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
