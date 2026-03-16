import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'
import { SYNTHESIS_SYSTEM_PROMPT } from './synthesis-prompts'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export class SynthesisError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'SynthesisError'
  }
}

export async function generateSynthesis(teamId: string): Promise<string> {
  if (!teamId) {
    throw new SynthesisError('teamId is required')
  }

  const supabase = await createServerClient()

  const [contactsResult, notesResult, ideasResult] = await Promise.all([
    supabase
      .from('contacts')
      .select('name, role, organization, region, warmth, tags')
      .eq('team_id', teamId)
      .order('warmth', { ascending: false })
      .limit(10),
    supabase
      .from('notes')
      .select('title, content, tags')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('ideas')
      .select('title, description, region, tags')
      .eq('team_id', teamId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const contacts = contactsResult.data ?? []
  const notes = notesResult.data ?? []
  const ideas = ideasResult.data ?? []

  if (contacts.length === 0 && notes.length === 0 && ideas.length === 0) {
    throw new SynthesisError('No data available to generate synthesis')
  }

  const contextParts: string[] = []

  if (contacts.length > 0) {
    const rows = contacts.map((c) => {
      const parts = [c.name]
      if (c.role) parts.push(c.role)
      if (c.organization) parts.push(`at ${c.organization}`)
      const meta: string[] = []
      meta.push(`region:${c.region ?? 'global'}`)
      meta.push(`warmth:${c.warmth}/5`)
      if (c.tags?.length) meta.push(`tags:${c.tags.join(',')}`)
      return `- ${parts.join(', ')} [${meta.join(' ')}]`
    })
    contextParts.push(`## KEY CONTACTS\n${rows.join('\n')}`)
  }

  if (ideas.length > 0) {
    const rows = ideas.map((i) => {
      const desc = i.description ? `: ${i.description.slice(0, 200)}` : ''
      const tags = i.tags?.length ? ` tags:${i.tags.join(',')}` : ''
      return `- ${i.title}${desc} [region:${i.region ?? 'global'}${tags}]`
    })
    contextParts.push(`## ACTIVE IDEAS\n${rows.join('\n')}`)
  }

  if (notes.length > 0) {
    const sections = notes.map((n) => {
      const tagLine = n.tags?.length ? ` [${n.tags.join(', ')}]` : ''
      const excerpt = n.content.slice(0, 500)
      return `### ${n.title}${tagLine}\n${excerpt}`
    })
    contextParts.push(`## FIELD NOTES\n${sections.join('\n\n')}`)
  }

  const userMessage = contextParts.join('\n\n')

  let response: Anthropic.Message
  try {
    response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYNTHESIS_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      throw new SynthesisError(`Anthropic API error (${err.status}): ${err.message}`, err)
    }
    throw new SynthesisError('Failed to call Anthropic API', err)
  }

  const block = response.content.find((b) => b.type === 'text')
  if (!block || block.type !== 'text') {
    throw new SynthesisError('No text content in Claude response')
  }

  return block.text.trim()
}
