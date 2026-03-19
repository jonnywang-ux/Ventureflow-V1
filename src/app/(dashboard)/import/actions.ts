'use server'
import { revalidatePath } from 'next/cache'
import { createServerClient, getTeamId } from '@/lib/supabase/server'
import type { ExtractedContact, ExtractedIdea } from '@/lib/ai/extraction'

interface SaveImportInput {
  note: { title: string; content: string; tags: string[] }
  contacts: ExtractedContact[]
  ideas: ExtractedIdea[]
}

interface SaveImportResult {
  success: boolean
  error?: string
  data?: { noteId: string; contactsCreated: number; ideasCreated: number }
}

export async function saveImportResults(input: SaveImportInput): Promise<SaveImportResult> {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const teamId = await getTeamId(user.id)
  if (!teamId) return { success: false, error: 'Not a team member' }

  // Save note
  const { data: note, error: noteError } = await supabase
    .from('notes')
    .insert({
      title: input.note.title,
      content: input.note.content,
      tags: input.note.tags,
      team_id: teamId,
      added_by: user.id,
    })
    .select('id')
    .single()

  if (noteError || !note) {
    console.error('[saveImportResults] note insert error:', noteError)
    return { success: false, error: 'Failed to save note' }
  }

  // Save contacts (best-effort, don't fail the whole save if one fails)
  let contactsCreated = 0
  for (const c of input.contacts) {
    const { error } = await supabase.from('contacts').insert({
      name: c.name,
      role: c.role || null,
      organization: c.organization || null,
      email: c.email || null,
      phone: c.phone || null,
      region: c.region || null,
      tags: [],
      warmth: 0,
      team_id: teamId,
      added_by: user.id,
    })
    if (!error) contactsCreated++
    else console.error('[saveImportResults] contact insert error:', error)
  }

  // Save ideas (best-effort)
  let ideasCreated = 0
  for (const idea of input.ideas) {
    const { error } = await supabase.from('ideas').insert({
      title: idea.title,
      description: idea.description || null,
      tags: idea.tags,
      region: idea.region || null,
      team_id: teamId,
      added_by: user.id,
    })
    if (!error) ideasCreated++
    else console.error('[saveImportResults] idea insert error:', error)
  }

  revalidatePath('/notes')
  revalidatePath('/contacts')
  revalidatePath('/ideas')

  return { success: true, data: { noteId: note.id, contactsCreated, ideasCreated } }
}
