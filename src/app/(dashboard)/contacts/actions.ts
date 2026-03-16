'use server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import type { ActionResult, Contact } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  role: z.string().max(100).optional(),
  organization: z.string().max(100).optional(),
  region: z.enum(['china', 'usa', 'global']).nullable().optional(),
  tags: z.string().optional(),
  warmth: z.coerce.number().int().min(0).max(5).default(0),
  email: z.string().optional(),
  phone: z.string().max(50).optional(),
  linkedin: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
})

export async function createContact(formData: FormData): Promise<ActionResult<Contact>> {
  const parsed = schema.safeParse({
    name: formData.get('name'),
    role: formData.get('role') || undefined,
    organization: formData.get('organization') || undefined,
    region: (formData.get('region') as string) || null,
    tags: formData.get('tags') || undefined,
    warmth: formData.get('warmth') || 0,
    email: formData.get('email') || undefined,
    phone: formData.get('phone') || undefined,
    linkedin: formData.get('linkedin') || undefined,
    notes: formData.get('notes') || undefined,
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
    .from('contacts')
    .insert({
      name: parsed.data.name,
      role: parsed.data.role || null,
      organization: parsed.data.organization || null,
      region: parsed.data.region || null,
      tags,
      warmth: parsed.data.warmth,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      linkedin: parsed.data.linkedin || null,
      notes: parsed.data.notes || null,
      team_id: member.team_id,
      added_by: user.id,
    })
    .select(
      'id, name, role, organization, region, tags, warmth, email, phone, linkedin, notes, created_at, updated_at, added_by, team_id',
    )
    .single()

  if (error) return { success: false, error: 'Failed to create contact' }

  revalidatePath('/contacts')
  return { success: true, data: data as Contact }
}
