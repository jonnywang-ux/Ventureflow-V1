import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { extractFromNameCard, extractFromNotes, ExtractionError } from '@/lib/ai/extraction'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png']
const ALLOWED_DOC_TYPES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const modeSchema = z.enum(['namecard', 'notes'])

function validateFile(
  file: File,
  allowedTypes: string[],
  fieldName: string
): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return `${fieldName} must be under 10MB`
  }
  if (!allowedTypes.includes(file.type)) {
    return `${fieldName} must be one of: ${allowedTypes.join(', ')}`
  }
  return null
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid form data' },
      { status: 400 }
    )
  }

  const rawMode = formData.get('mode')
  const parsedMode = modeSchema.safeParse(rawMode)
  if (!parsedMode.success) {
    return NextResponse.json(
      { success: false, error: 'mode must be "namecard" or "notes"' },
      { status: 400 }
    )
  }

  const mode = parsedMode.data

  if (mode === 'namecard') {
    const image = formData.get('image')
    if (!image || !(image instanceof File)) {
      return NextResponse.json(
        { success: false, error: 'image file is required for namecard mode' },
        { status: 400 }
      )
    }

    const imageError = validateFile(image, ALLOWED_IMAGE_TYPES, 'image')
    if (imageError) {
      return NextResponse.json({ success: false, error: imageError }, { status: 400 })
    }

    let data
    try {
      const buffer = await image.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      data = await extractFromNameCard(base64)
    } catch (err) {
      if (err instanceof ExtractionError) {
        console.error('[scan/namecard] ExtractionError:', err.message, err.cause)
        return NextResponse.json(
          { success: false, error: 'Failed to extract data from image' },
          { status: 422 }
        )
      }
      console.error('[scan/namecard] Unexpected error:', err)
      return NextResponse.json(
        { success: false, error: 'Internal server error' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  }

  // mode === 'notes'
  const rawText = formData.get('text')
  const text = typeof rawText === 'string' ? rawText.trim() : ''
  const docx = formData.get('docx')

  let combinedText = text

  if (docx instanceof File) {
    const docxError = validateFile(docx, ALLOWED_DOC_TYPES, 'docx')
    if (docxError) {
      return NextResponse.json({ success: false, error: docxError }, { status: 400 })
    }

    try {
      const mammoth = await import('mammoth')
      const buffer = await docx.arrayBuffer()
      const result = await mammoth.extractRawText({ buffer: Buffer.from(buffer) })
      const docxText = result.value.trim()
      combinedText = [docxText, text].filter(Boolean).join('\n\n')
    } catch (err) {
      console.error('[scan/notes] Failed to parse docx:', err)
      return NextResponse.json(
        { success: false, error: 'Failed to parse document' },
        { status: 422 }
      )
    }
  }

  if (!combinedText) {
    return NextResponse.json(
      { success: false, error: 'text or docx content is required for notes mode' },
      { status: 400 }
    )
  }

  let data
  try {
    data = await extractFromNotes(combinedText)
  } catch (err) {
    if (err instanceof ExtractionError) {
      console.error('[scan/notes] ExtractionError:', err.message, err.cause)
      return NextResponse.json(
        { success: false, error: 'Failed to extract structured data from notes' },
        { status: 422 }
      )
    }
    console.error('[scan/notes] Unexpected error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data })
}
