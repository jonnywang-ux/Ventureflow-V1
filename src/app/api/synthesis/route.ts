import 'server-only'
import { NextResponse } from 'next/server'
import { createServerClient, getTeamId } from '@/lib/supabase/server'
import { generateSynthesis, SynthesisError } from '@/lib/ai/synthesis'

export async function POST() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const teamId = await getTeamId(user.id)

  if (!teamId) {
    return NextResponse.json({ success: false, error: 'No team found' }, { status: 403 })
  }

  let content: string
  try {
    content = await generateSynthesis(teamId)
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
      team_id: teamId,
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
