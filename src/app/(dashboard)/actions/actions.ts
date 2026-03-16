'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import type { ActionResult, Action } from '@/types'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  due_date: z.string().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
})

export async function createAction(formData: FormData): Promise<ActionResult<Action>> {
  const parsed = schema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    due_date: formData.get('due_date') || undefined,
    assigned_to: (formData.get('assigned_to') as string) || null,
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

  const { data, error } = await supabase
    .from('actions')
    .insert({
      title: parsed.data.title,
      description: parsed.data.description || null,
      due_date: parsed.data.due_date || null,
      assigned_to: parsed.data.assigned_to || null,
      team_id: member.team_id,
      added_by: user.id,
    })
    .select(
      'id, title, description, status, due_date, assigned_to, contact_id, idea_id, created_at, updated_at, added_by, team_id',
    )
    .single()

  if (error) return { success: false, error: 'Failed to create action' }

  revalidatePath('/actions')
  return { success: true, data: data as Action }
}
