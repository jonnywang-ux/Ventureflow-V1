import 'server-only'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { NAMECARD_SYSTEM_PROMPT, NOTES_SYSTEM_PROMPT } from './prompts'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const nameCardSchema = z.object({
  name: z.string(),
  role: z.string(),
  organization: z.string(),
  email: z.string(),
  phone: z.string(),
  linkedin: z.string(),
  region: z.enum(['china', 'usa']).nullable(),
})

export const notesSchema = z.object({
  title: z.string().min(1).max(100),
  tags: z.array(z.string()),
  content: z.string().min(1),
})

export type NameCardData = z.infer<typeof nameCardSchema>
export type NotesData = z.infer<typeof notesSchema>

export class ExtractionError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'ExtractionError'
  }
}

function parseJsonResponse(text: string): unknown {
  const stripped = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '')
  try {
    return JSON.parse(stripped)
  } catch {
    throw new ExtractionError(`Claude returned invalid JSON: ${text.slice(0, 200)}`)
  }
}

export async function extractFromNameCard(imageBase64: string): Promise<NameCardData> {
  if (!imageBase64) {
    throw new ExtractionError('imageBase64 is required')
  }

  let response: Anthropic.Message
  try {
    response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: NAMECARD_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: 'Extract the contact information from this business card.',
            },
          ],
        },
      ],
    })
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      throw new ExtractionError(`Anthropic API error (${err.status}): ${err.message}`, err)
    }
    throw new ExtractionError('Failed to call Anthropic API', err)
  }

  const block = response.content.find((b) => b.type === 'text')
  if (!block || block.type !== 'text') {
    throw new ExtractionError('No text content in Claude response')
  }

  const raw = parseJsonResponse(block.text)

  const parsed = nameCardSchema.safeParse(raw)
  if (!parsed.success) {
    throw new ExtractionError(
      `Name card data failed validation: ${parsed.error.message}`,
      parsed.error
    )
  }

  return parsed.data
}

export async function extractFromNotes(text: string): Promise<NotesData> {
  if (!text || !text.trim()) {
    throw new ExtractionError('text is required')
  }

  let response: Anthropic.Message
  try {
    response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: NOTES_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: text,
        },
      ],
    })
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      throw new ExtractionError(`Anthropic API error (${err.status}): ${err.message}`, err)
    }
    throw new ExtractionError('Failed to call Anthropic API', err)
  }

  const block = response.content.find((b) => b.type === 'text')
  if (!block || block.type !== 'text') {
    throw new ExtractionError('No text content in Claude response')
  }

  const raw = parseJsonResponse(block.text)

  const parsed = notesSchema.safeParse(raw)
  if (!parsed.success) {
    throw new ExtractionError(
      `Notes data failed validation: ${parsed.error.message}`,
      parsed.error
    )
  }

  return parsed.data
}
