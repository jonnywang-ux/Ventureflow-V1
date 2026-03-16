import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import type { SearchResult } from '@/types'

const querySchema = z.object({
  q: z.string().min(2).max(100),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse({ q: searchParams.get('q') })

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Query must be 2–100 characters' },
      { status: 400 }
    )
  }

  const { q } = parsed.data
  const pattern = `%${q}%`

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const [contacts, ideas, actions, notes] = await Promise.all([
    supabase
      .from('contacts')
      .select('id, name, organization, role')
      .or(`name.ilike.${pattern},organization.ilike.${pattern},role.ilike.${pattern}`)
      .limit(5),

    supabase
      .from('ideas')
      .select('id, title, description')
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .eq('status', 'active')
      .limit(5),

    supabase
      .from('actions')
      .select('id, title, description')
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .neq('status', 'closed')
      .limit(5),

    supabase
      .from('notes')
      .select('id, title, content')
      .or(`title.ilike.${pattern},content.ilike.${pattern}`)
      .limit(5),
  ])

  const results: SearchResult[] = [
    ...(contacts.data ?? []).map((c) => ({
      id: c.id,
      entity_type: 'contact' as const,
      title: c.name,
      subtitle: [c.role, c.organization].filter(Boolean).join(' @ ') || null,
    })),
    ...(ideas.data ?? []).map((i) => ({
      id: i.id,
      entity_type: 'idea' as const,
      title: i.title,
      subtitle: i.description ? i.description.slice(0, 80) : null,
    })),
    ...(actions.data ?? []).map((a) => ({
      id: a.id,
      entity_type: 'action' as const,
      title: a.title,
      subtitle: a.description ? a.description.slice(0, 80) : null,
    })),
    ...(notes.data ?? []).map((n) => ({
      id: n.id,
      entity_type: 'note' as const,
      title: n.title,
      subtitle: n.content ? n.content.slice(0, 80) : null,
    })),
  ]

  return NextResponse.json({ success: true, data: results })
}
