import 'server-only'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerClient, getTeamId } from '@/lib/supabase/server'
import { parseDocx } from '@/lib/parsers/docxParser'
import { parseXlsx } from '@/lib/parsers/xlsxParser'
import { parsePdf } from '@/lib/parsers/pdfParser'
import { parseMd } from '@/lib/parsers/mdParser'
import { extractFromNotes, ExtractionError } from '@/lib/ai/extraction'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const ALLOWED_TYPES: Record<string, 'docx' | 'xlsx' | 'pdf' | 'md'> = {
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xlsx',
  'application/pdf': 'pdf',
  'text/markdown': 'md',
  'text/plain': 'md',
}

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  // Resolve team_id for the authenticated user
  const teamId = await getTeamId(user.id)

  if (!teamId) {
    return NextResponse.json({ success: false, error: 'Team membership not found' }, { status: 403 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: 'file is required' },
      { status: 400 }
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { success: false, error: 'file must be under 10MB' },
      { status: 400 }
    )
  }

  const importType = ALLOWED_TYPES[file.type]
  if (!importType) {
    return NextResponse.json(
      {
        success: false,
        error: 'Unsupported file type. Upload a .docx, .xlsx, .pdf, or .md file.',
      },
      { status: 400 }
    )
  }

  // Log import attempt (pending)
  const { data: importRecord, error: insertError } = await supabase
    .from('import_history')
    .insert({
      team_id: teamId,
      imported_by: user.id,
      file_name: file.name,
      import_type: importType,
      status: 'pending',
    })
    .select('id')
    .single()

  if (insertError || !importRecord) {
    console.error('[import] Failed to create import record:', insertError)
    return NextResponse.json(
      { success: false, error: 'Failed to start import' },
      { status: 500 }
    )
  }

  const importId = importRecord.id

  // Parse file + upload to Storage
  let rawText: string
  let filePath: string | null = null
  try {
    const buffer = Buffer.from(await file.arrayBuffer())

    if (importType === 'docx') rawText = await parseDocx(buffer)
    else if (importType === 'xlsx') rawText = await parseXlsx(buffer)
    else if (importType === 'pdf') rawText = await parsePdf(buffer)
    else rawText = await parseMd(buffer)

    const admin = createAdminClient()
    const storagePath = `${teamId}/${file.name}`
    const { data: uploaded } = await admin.storage
      .from('imports')
      .upload(storagePath, buffer, { upsert: true, contentType: file.type })
    filePath = uploaded?.path ?? null
  } catch (err) {
    console.error('[import] Parse error:', err)
    await supabase
      .from('import_history')
      .update({ status: 'error', error_message: 'Failed to parse file' })
      .eq('id', importId)
    return NextResponse.json(
      { success: false, error: 'Failed to parse file' },
      { status: 422 }
    )
  }

  if (!rawText) {
    await supabase
      .from('import_history')
      .update({ status: 'error', error_message: 'File contained no readable text' })
      .eq('id', importId)
    return NextResponse.json(
      { success: false, error: 'File contained no readable text' },
      { status: 422 }
    )
  }

  // AI extraction
  let structured: { title: string; tags: string[]; content: string }
  try {
    structured = await extractFromNotes(rawText)
  } catch (err) {
    if (err instanceof ExtractionError) {
      console.error('[import] ExtractionError:', err.message, err.cause)
    } else {
      console.error('[import] Unexpected extraction error:', err)
    }
    await supabase
      .from('import_history')
      .update({ status: 'error', error_message: 'Failed to extract structured data' })
      .eq('id', importId)
    return NextResponse.json(
      { success: false, error: 'Failed to extract structured data from file' },
      { status: 422 }
    )
  }

  // Mark import as success
  await supabase
    .from('import_history')
    .update({ status: 'success', file_path: filePath })
    .eq('id', importId)

  return NextResponse.json({
    success: true,
    data: { importId, rawText, structured },
  })
}
