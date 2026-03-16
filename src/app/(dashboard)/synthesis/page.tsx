import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SynthesisViewer from '@/components/synthesis/SynthesisViewer'
import GenerateSynthesisButton from '@/components/synthesis/GenerateSynthesisButton'

export default async function SynthesisPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: membership } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    redirect('/login')
  }

  const { data: thesis } = await supabase
    .from('thesis')
    .select('id, content, generated_at, created_by')
    .eq('team_id', membership.team_id)
    .single()

  return (
    <div style={{ padding: '32px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '32px',
          gap: '24px',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: '28px',
              fontWeight: 800,
              margin: '0 0 12px 0',
              color: 'var(--ink)',
            }}
          >
            Synthesis
          </h1>
          <p
            style={{
              fontFamily: 'Geist Mono, monospace',
              fontSize: '13px',
              color: 'var(--ink3)',
              margin: 0,
            }}
          >
            AI-generated investment thesis based on your contacts, notes, and ideas.
          </p>
        </div>
        <GenerateSynthesisButton hasExisting={!!thesis} />
      </div>

      {thesis ? (
        <SynthesisViewer thesis={thesis} />
      ) : (
        <div
          data-testid="synthesis-empty"
          style={{
            border: '1px dashed var(--border)',
            borderRadius: 'var(--radius)',
            padding: '64px 32px',
            textAlign: 'center',
            color: 'var(--ink4)',
            fontFamily: 'Geist Mono, monospace',
            fontSize: '13px',
          }}
        >
          No synthesis generated yet. Click Generate to create your first thesis.
        </div>
      )}
    </div>
  )
}
