'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createServerClient, getTeamId } from '@/lib/supabase/server'
import type { ActionResult, Idea } from '@/types'

const createIdeaSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  region: z.enum(['china', 'usa', 'global']).nullable().optional(),
  tags: z.string().optional(),
})

export async function createIdea(formData: FormData): Promise<ActionResult<Idea>> {
  const parsed = createIdeaSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    region: (formData.get('region') as string) || null,
    tags: formData.get('tags') || undefined,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const teamId = await getTeamId(user.id)
  if (!teamId) return { success: false, error: 'Not a team member' }

  const tags = parsed.data.tags
    ? parsed.data.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  const { data, error } = await supabase
    .from('ideas')
    .insert({
      title: parsed.data.title,
      description: parsed.data.description || null,
      region: parsed.data.region || null,
      tags,
      team_id: teamId,
      added_by: user.id,
    })
    .select(
      'id, title, description, region, status, tags, lead_contact_id, created_at, updated_at, added_by, team_id',
    )
    .single()

  if (error) return { success: false, error: 'Failed to create idea' }

  revalidatePath('/ideas')
  return { success: true, data: data as Idea }
}

const voteSchema = z.object({
  ideaId: z.string().uuid(),
  vote: z.union([z.literal(1), z.literal(-1)]),
})

export async function voteOnIdea(ideaId: string, vote: 1 | -1): Promise<ActionResult> {
  const parsed = voteSchema.safeParse({ ideaId, vote })
  if (!parsed.success) return { success: false, error: 'Invalid input' }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: existing } = await supabase
    .from('idea_votes')
    .select('id, vote')
    .eq('idea_id', ideaId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing && existing.vote === vote) {
    await supabase.from('idea_votes').delete().eq('id', existing.id)
  } else if (existing) {
    await supabase.from('idea_votes').update({ vote }).eq('id', existing.id)
  } else {
    await supabase.from('idea_votes').insert({ idea_id: ideaId, user_id: user.id, vote })
  }

  revalidatePath('/ideas')
  return { success: true }
}
