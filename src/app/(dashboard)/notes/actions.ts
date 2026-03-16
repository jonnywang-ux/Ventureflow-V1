'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import type { ActionResult, Note } from '@/types'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(10000),
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

  const { data: member } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .single()
  if (!member) return { success: false, error: 'Not a team member' }

  const tags = parsed.data.tags
    ? parsed.data.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : []

  const { data, error } = await supabase
    .from('notes')
    .insert({
      title: parsed.data.title,
      content: parsed.data.content,
      tags,
      team_id: member.team_id,
      added_by: user.id,
    })
    .select('id, title, content, tags, created_at, updated_at, added_by, team_id')
    .single()

  if (error) return { success: false, error: 'Failed to create note' }

  revalidatePath('/notes')
  return { success: true, data: data as Note }
}
