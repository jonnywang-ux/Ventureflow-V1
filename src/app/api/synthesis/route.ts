import 'server-only'
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generateSynthesis, SynthesisError } from '@/lib/ai/synthesis'

export async function POST() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { data: membership } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ success: false, error: 'No team found' }, { status: 403 })
  }

  let content: string
  try {
    content = await generateSynthesis(membership.team_id)
  } catch (err) {
    if (err instanceof SynthesisError) {
      console.error('[synthesis] SynthesisError:', err.message, err.cause)
      const status = err.message.includes('No data') ? 422 : 500
      return NextResponse.json({ success: false, error: err.message }, { status })
    }
    console.error('[synthesis] Unexpected error:', err)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }

  const { error: upsertError } = await supabase.from('thesis').upsert(
    {
      team_id: membership.team_id,
      content,
      created_by: user.id,
      generated_at: new Date().toISOString(),
    },
    { onConflict: 'team_id' }
  )

  if (upsertError) {
    console.error('[synthesis] Failed to save thesis:', upsertError)
    return NextResponse.json({ success: false, error: 'Failed to save synthesis' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
