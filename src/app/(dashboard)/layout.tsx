import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import GlobalSearch from '@/components/search/GlobalSearch'

const NAV_LINKS = [
  { href: '/', label: 'Dashboard', icon: '◈' },
  { href: '/contacts', label: 'Contacts', icon: '◉' },
  { href: '/ideas', label: 'Ideas', icon: '◎' },
  { href: '/actions', label: 'Actions', icon: '▷' },
  { href: '/notes', label: 'Notes', icon: '✎' },
  { href: '/synthesis', label: 'Synthesis', icon: '⬡' },
  { href: '/import', label: 'Import', icon: '⊞' },
]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: member } = await supabase
    .from('team_members')
    .select('id, initials, color, team_id')
    .eq('user_id', user.id)
    .single()

  if (!member) {
    redirect('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Navigation — dark bar matching reference */}
      <nav
        style={{
          background: 'var(--ink)',
          borderBottom: '2px solid var(--ink)',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          height: '52px',
          position: 'sticky',
          top: 0,
          zIndex: 200,
        }}
      >
        {/* Brand */}
        <div
          style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: '15px',
            letterSpacing: '-0.3px',
            color: 'var(--bg)',
            paddingRight: '24px',
            borderRight: '1px solid rgba(255,255,255,0.12)',
            marginRight: '8px',
            whiteSpace: 'nowrap',
          }}
        >
          Venture<span style={{ color: '#c8a96e' }}>Flow</span>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', flex: 1 }}>
          {NAV_LINKS.map(({ href, label, icon }) => (
            <a
              key={href}
              href={href}
              data-testid={`nav-${label.toLowerCase()}`}
              style={{
                fontFamily: 'Geist Mono, monospace',
                fontSize: '11px',
                fontWeight: 400,
                color: 'rgba(255,255,255,0.5)',
                padding: '18px 18px',
                cursor: 'pointer',
                letterSpacing: '0.3px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                transition: 'color 0.15s',
              }}
            >
              <span style={{ fontSize: '13px' }}>{icon}</span>
              {label}
            </a>
          ))}
        </div>

        {/* Ctrl+K search hint */}
        <div
          style={{
            fontFamily: 'Geist Mono, monospace',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.3)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '5px',
            padding: '3px 8px',
            letterSpacing: '0.3px',
            cursor: 'default',
            userSelect: 'none',
            marginRight: '12px',
          }}
        >
          ⌕ Ctrl+K
        </div>

        {/* Team member badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontFamily: 'Geist Mono, monospace',
              fontSize: '10px',
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.3px',
            }}
          >
            logged in as
          </span>
          <div
            style={{
              width: '34px',
              height: '28px',
              borderRadius: '14px',
              background: member.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 700,
              color: '#fff',
              fontFamily: 'Syne, sans-serif',
              letterSpacing: '0.3px',
              border: '2px solid #c8a96e',
            }}
          >
            {member.initials}
          </div>
        </div>
      </nav>

      {/* Global search overlay — Client Component, handles its own visibility */}
      <GlobalSearch />

      {/* Page content */}
      <main style={{ padding: '28px 32px', maxWidth: '1280px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  )
}
