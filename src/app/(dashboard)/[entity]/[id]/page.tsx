import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { CommentThread } from '@/components/comments/CommentThread'
import { Avatar } from '@/components/ui/Avatar'
import { RegionChip } from '@/components/ui/RegionChip'
import { WarmthBadge } from '@/components/ui/WarmthBadge'
import type { Comment, Contact, Idea, Action, Note, EntityType, TeamMember } from '@/types'

const VALID_ENTITIES = ['contacts', 'ideas', 'actions', 'notes'] as const
type EntitySegment = (typeof VALID_ENTITIES)[number]

const SEGMENT_TO_TYPE: Record<EntitySegment, EntityType> = {
  contacts: 'contact',
  ideas: 'idea',
  actions: 'action',
  notes: 'note',
}

const SEGMENT_TO_TABLE: Record<EntitySegment, string> = {
  contacts: 'contacts',
  ideas: 'ideas',
  actions: 'actions',
  notes: 'notes',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Entity summary cards
// ---------------------------------------------------------------------------

function ContactSummary({ entity }: { entity: Contact }) {
  return (
    <div className="card" style={{ padding: '20px 24px', marginBottom: '8px' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '10px',
            background: 'var(--china)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontFamily: 'Syne, sans-serif',
            fontWeight: 700,
            fontSize: '16px',
            flexShrink: 0,
          }}
        >
          {entity.name.slice(0, 2).toUpperCase()}
        </div>

        <div style={{ flex: 1 }}>
          <h2
            style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '18px',
              color: 'var(--ink)',
              marginBottom: '4px',
            }}
          >
            {entity.name}
          </h2>
          {entity.role && (
            <div style={{ fontSize: '12px', color: 'var(--ink3)', marginBottom: '2px' }}>
              {entity.role}
              {entity.organization ? ` · ${entity.organization}` : ''}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
            <RegionChip region={entity.region} />
            <WarmthBadge warmth={entity.warmth} />
            {entity.email && (
              <span style={{ fontSize: '11px', color: 'var(--ink3)', fontFamily: 'Geist Mono, monospace' }}>
                {entity.email}
              </span>
            )}
          </div>
          {entity.notes && (
            <p
              style={{
                fontSize: '12px',
                color: 'var(--ink3)',
                lineHeight: 1.6,
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px dashed var(--border)',
                fontStyle: 'italic',
              }}
            >
              {entity.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function IdeaSummary({ entity }: { entity: Idea }) {
  return (
    <div className="card" style={{ padding: '20px 24px', marginBottom: '8px', position: 'relative', overflow: 'hidden' }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'var(--idea)',
          borderRadius: 'var(--radius) var(--radius) 0 0',
        }}
      />
      <h2
        style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: '18px',
          color: 'var(--ink)',
          marginBottom: '8px',
        }}
      >
        {entity.title}
      </h2>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: entity.description ? '12px' : '0', flexWrap: 'wrap' }}>
        <RegionChip region={entity.region} />
        <span
          style={{
            fontSize: '10px',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            color: 'var(--ink3)',
            letterSpacing: '0.3px',
          }}
        >
          {entity.status}
        </span>
        {entity.tags.map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              color: 'var(--ink3)',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
      {entity.description && (
        <p style={{ fontSize: '13px', color: 'var(--ink2)', lineHeight: 1.65, margin: 0 }}>
          {entity.description}
        </p>
      )}
    </div>
  )
}

function ActionSummary({ entity }: { entity: Action }) {
  return (
    <div className="card" style={{ padding: '20px 24px', marginBottom: '8px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            border: '2px solid var(--action)',
            flexShrink: 0,
            marginTop: '2px',
            background: entity.status === 'in_progress' ? 'rgba(122,74,42,0.15)' : 'transparent',
          }}
        />
        <div style={{ flex: 1 }}>
          <h2
            style={{
              fontFamily: 'Syne, sans-serif',
              fontWeight: 700,
              fontSize: '18px',
              color: 'var(--ink)',
              marginBottom: '8px',
            }}
          >
            {entity.title}
          </h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: entity.description ? '12px' : '0' }}>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: entity.status === 'in_progress' ? 'rgba(122,74,42,0.1)' : 'var(--surface2)',
                color: entity.status === 'in_progress' ? 'var(--action)' : 'var(--ink3)',
                border: '1px solid var(--border)',
                letterSpacing: '0.3px',
              }}
            >
              {entity.status.replace('_', ' ')}
            </span>
            {entity.due_date && (
              <span style={{ fontSize: '11px', color: 'var(--ink3)', fontFamily: 'Geist Mono, monospace' }}>
                Due {formatDate(entity.due_date)}
              </span>
            )}
          </div>
          {entity.description && (
            <p style={{ fontSize: '13px', color: 'var(--ink2)', lineHeight: 1.65, margin: 0 }}>
              {entity.description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function NoteSummary({ entity }: { entity: Note }) {
  return (
    <div className="card" style={{ padding: '20px 24px', marginBottom: '8px', position: 'relative', overflow: 'hidden' }}>
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
      <h2
        style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: '18px',
          color: 'var(--ink)',
          marginBottom: '12px',
        }}
      >
        {entity.title}
      </h2>
      <p
        style={{
          fontSize: '13px',
          color: 'var(--ink2)',
          lineHeight: 1.7,
          whiteSpace: 'pre-wrap',
          margin: 0,
        }}
      >
        {entity.content}
      </p>
      {entity.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '14px' }}>
          {entity.tags.map((tag) => (
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
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface PageParams {
  params: Promise<{ entity: string; id: string }>
}

export default async function EntityDetailPage({ params }: PageParams) {
  const { entity: entitySegment, id } = await params

  if (!VALID_ENTITIES.includes(entitySegment as EntitySegment)) {
    notFound()
  }

  const segment = entitySegment as EntitySegment
  const entityType = SEGMENT_TO_TYPE[segment]
  const tableName = SEGMENT_TO_TABLE[segment]

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
  if (!member) return null

  // Fetch entity
  const selectMap: Record<EntitySegment, string> = {
    contacts: 'id, name, role, organization, region, tags, warmth, email, phone, linkedin, notes, created_at, updated_at, added_by, team_id',
    ideas: 'id, title, description, region, status, tags, lead_contact_id, created_at, updated_at, added_by, team_id',
    actions: 'id, title, description, status, due_date, assigned_to, contact_id, idea_id, created_at, updated_at, added_by, team_id',
    notes: 'id, title, content, tags, created_at, updated_at, added_by, team_id',
  }

  const { data: entityData } = await supabase
    .from(tableName)
    .select(selectMap[segment])
    .eq('id', id)
    .eq('team_id', member.team_id)
    .single()

  if (!entityData) notFound()

  // Fetch comments
  const { data: commentsData } = await supabase
    .from('comments')
    .select('id, added_by, entity_type, entity_id, content, created_at, team_id')
    .eq('entity_type', entityType)
    .eq('entity_id', id)
    .order('created_at', { ascending: true })
    .limit(500)

  // Fetch team members for avatars
  const { data: teamMembersData } = await supabase
    .from('team_members')
    .select('id, team_id, user_id, initials, color, created_at')
    .eq('team_id', member.team_id)
    .limit(20)

  const comments = (commentsData ?? []) as Comment[]
  const teamMembers = (teamMembersData ?? []) as TeamMember[]

  // Back link labels
  const backLabels: Record<EntitySegment, string> = {
    contacts: 'Contacts',
    ideas: 'Ideas',
    actions: 'Actions',
    notes: 'Notes',
  }

  return (
    <div style={{ maxWidth: '720px' }}>
      {/* Back link */}
      <Link
        href={`/${segment}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontFamily: 'Geist Mono, monospace',
          fontSize: '11px',
          color: 'var(--ink3)',
          textDecoration: 'none',
          marginBottom: '24px',
          letterSpacing: '0.3px',
        }}
      >
        &larr; {backLabels[segment]}
      </Link>

      {/* Entity summary */}
      {segment === 'contacts' && <ContactSummary entity={entityData as unknown as Contact} />}
      {segment === 'ideas' && <IdeaSummary entity={entityData as unknown as Idea} />}
      {segment === 'actions' && <ActionSummary entity={entityData as unknown as Action} />}
      {segment === 'notes' && <NoteSummary entity={entityData as unknown as Note} />}

      {/* Metadata footer */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          padding: '10px 0',
          marginBottom: '8px',
          borderBottom: '1px dashed var(--border)',
        }}
      >
        {(() => {
          const addedBy = (entityData as unknown as { added_by: string }).added_by
          const m = teamMembers.find((tm) => tm.user_id === addedBy)
          return m ? (
            <>
              <Avatar initials={m.initials} color={m.color} size={22} />
              <span style={{ fontSize: '11px', color: 'var(--ink3)', fontFamily: 'Geist Mono, monospace' }}>
                Added by {m.initials}
              </span>
            </>
          ) : null
        })()}
        <span style={{ fontSize: '11px', color: 'var(--ink4)', fontFamily: 'Geist Mono, monospace', marginLeft: 'auto' }}>
          {formatDate((entityData as unknown as { created_at: string }).created_at)}
        </span>
      </div>

      {/* Comment thread */}
      <CommentThread
        entityType={entityType}
        entityId={id}
        initialComments={comments}
        currentUserId={user.id}
        teamMembers={teamMembers}
      />
    </div>
  )
}
