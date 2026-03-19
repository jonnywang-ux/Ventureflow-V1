'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createServerClient, getTeamId } from '@/lib/supabase/server'
import type { ActionResult, Note } from '@/types'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(50000),
  tags: z.string().optional(),
})

export async function createNote(formData: FormData): Promise<ActionResult<Note>> {
  const parsed = schema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
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
    .from('notes')
    .insert({
      title: parsed.data.title,
      content: parsed.data.content,
      tags,
      team_id: teamId,
      added_by: user.id,
    })
    .select('id, title, content, tags, created_at, updated_at, added_by, team_id')
    .single()

  if (error) return { success: false, error: 'Failed to create note' }

  revalidatePath('/notes')
  return { success: true, data: data as Note }
}
