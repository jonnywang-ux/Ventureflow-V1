'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import type { ActionResult, Comment, EntityType } from '@/types'

const ENTITY_TO_PATH: Record<string, string> = {
  contact: 'contacts',
  idea: 'ideas',
  action: 'actions',
  note: 'notes',
}

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
  entityType: z.enum(['contact', 'idea', 'action', 'note']),
  entityId: z.string().uuid('Invalid entity ID'),
})

export async function createComment(
  formData: FormData,
): Promise<ActionResult<Comment>> {
  const parsed = createCommentSchema.safeParse({
    content: formData.get('content'),
    entityType: formData.get('entityType'),
    entityId: formData.get('entityId'),
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
    .from('comments')
    .insert({
      content: parsed.data.content,
      entity_type: parsed.data.entityType as EntityType,
      entity_id: parsed.data.entityId,
      team_id: member.team_id,
      added_by: user.id,
    })
    .select('id, team_id, added_by, entity_type, entity_id, content, created_at')
    .single()

  if (error) return { success: false, error: 'Failed to post comment' }

  const entityPath = ENTITY_TO_PATH[parsed.data.entityType]
  revalidatePath(`/${entityPath}/${parsed.data.entityId}`)

  return { success: true, data: data as Comment }
}

export async function deleteComment(
  commentId: string,
): Promise<ActionResult<void>> {
  if (!commentId) return { success: false, error: 'Comment ID is required' }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // Fetch comment to verify ownership and get entity info for revalidation
  const { data: comment, error: fetchError } = await supabase
    .from('comments')
    .select('id, added_by, entity_type, entity_id')
    .eq('id', commentId)
    .single()

  if (fetchError || !comment) return { success: false, error: 'Comment not found' }
  if (comment.added_by !== user.id) return { success: false, error: 'Not authorized to delete this comment' }

  const { error } = await supabase.from('comments').delete().eq('id', commentId)

  if (error) return { success: false, error: 'Failed to delete comment' }

  const entityPath = ENTITY_TO_PATH[comment.entity_type]
  revalidatePath(`/${entityPath}/${comment.entity_id}`)

  return { success: true }
}
