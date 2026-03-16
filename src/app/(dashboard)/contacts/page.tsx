import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Avatar } from '@/components/ui/Avatar'
import { RegionChip } from '@/components/ui/RegionChip'
import { WarmthBadge } from '@/components/ui/WarmthBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { AddContactModal } from '@/components/modals/AddContactModal'
import type { Contact } from '@/types'

// Deterministic color from contact id for avatar background
const AVATAR_COLORS = [
  '#c94040', '#2a5ca8', '#2a7a4a', '#7a4a2a', '#b8960a',
  '#5a3a8a', '#2a7a8a', '#8a4a6a',
]

function avatarColor(id: string): string {
  const sum = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default async function ContactsPage() {
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

  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, name, role, organization, region, tags, warmth, notes')
    .eq('team_id', member?.team_id ?? '')
    .order('created_at', { ascending: false })
    .limit(200)

  const list = (contacts ?? []) as Contact[]

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
            Contact <em style={{ fontStyle: 'italic', color: 'var(--ink3)' }}>Intelligence</em>
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--ink3)', marginTop: '4px', letterSpacing: '0.3px' }}>
            VCs · Founders · Operators — China &amp; USA
          </p>
        </div>
        <AddContactModal />
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        {['All', 'China', 'USA', 'VC', 'Founder', 'Hot'].map((label) => (
          <span
            key={label}
            style={{
              fontFamily: 'Geist Mono, monospace',
              fontSize: '11px',
              padding: '5px 12px',
              borderRadius: '20px',
              border: '1px solid var(--border)',
              background: label === 'All' ? 'var(--ink)' : 'var(--surface)',
              color: label === 'All' ? 'var(--bg)' : 'var(--ink3)',
              cursor: 'pointer',
              letterSpacing: '0.3px',
            }}
          >
            {label}
          </span>
        ))}
        <span style={{ fontSize: '11px', color: 'var(--ink4)', marginLeft: 'auto' }}>
          {list.length} contact{list.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Contact list */}
      {list.length === 0 ? (
        <EmptyState message="No contacts yet. Add your first contact to get started." />
      ) : (
        <div data-testid="contact-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {list.map((contact) => (
            <Link
              key={contact.id}
              href={`/contacts/${contact.id}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
            <div
              data-testid="contact-card"
              className="card"
              style={{
                padding: '14px 16px',
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
              }}
            >
              <Avatar
                initials={initials(contact.name)}
                color={avatarColor(contact.id)}
                size={38}
                square
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: 600,
                    fontSize: '13px',
                    color: 'var(--ink)',
                    marginBottom: '2px',
                  }}
                >
                  {contact.name}
                </div>

                {contact.role && (
                  <div style={{ fontSize: '11px', color: 'var(--ink3)', marginBottom: '2px', letterSpacing: '0.2px' }}>
                    {contact.role}
                  </div>
                )}

                {contact.organization && (
                  <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--ink2)', marginBottom: '8px' }}>
                    {contact.organization}
                  </div>
                )}

                {/* Tags */}
                {contact.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '6px' }}>
                    {contact.tags.map((tag) => (
                      <span
                        key={tag}
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
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {contact.notes && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--ink3)',
                      lineHeight: 1.5,
                      fontStyle: 'italic',
                      borderTop: '1px dashed var(--border)',
                      paddingTop: '6px',
                    }}
                  >
                    {contact.notes.slice(0, 160)}
                    {contact.notes.length > 160 ? '…' : ''}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                <WarmthBadge warmth={contact.warmth} />
                <RegionChip region={contact.region} />
              </div>
            </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
