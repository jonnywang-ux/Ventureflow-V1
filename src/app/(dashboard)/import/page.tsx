import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ImportUploader from '@/components/import/ImportUploader'
import ImportHistory from '@/components/import/ImportHistory'

interface ImportRecord {
  id: string
  file_name: string
  import_type: string
  status: string
  error_message: string | null
  created_at: string
}

export default async function ImportPage() {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: teamMembersData } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .single()

  if (!teamMembersData) {
    redirect('/login')
  }

  const { data: importRecords } = await supabase
    .from('import_history')
    .select('id, file_name, import_type, status, error_message, created_at')
    .eq('team_id', teamMembersData.team_id)
    .order('created_at', { ascending: false })
    .limit(50)

  const records: ImportRecord[] = importRecords || []

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: '28px',
          fontWeight: 800,
          margin: '0 0 12px 0',
          color: 'var(--ink)',
        }}>
          Import
        </h1>
        <p style={{
          fontFamily: 'Geist Mono, monospace',
          fontSize: '13px',
          color: 'var(--ink3)',
          margin: 0,
        }}>
          Bulk import .docx or .xlsx files. Claude extracts structure automatically.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
      }}>
        <ImportUploader />
        <ImportHistory records={records} />
      </div>
    </div>
  )
}
