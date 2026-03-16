import 'server-only'

export async function parseXlsx(buffer: Buffer): Promise<string> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(buffer, { type: 'buffer' })

  const lines: string[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const csv = XLSX.utils.sheet_to_csv(sheet)
    const trimmed = csv.trim()
    if (trimmed) {
      lines.push(`Sheet: ${sheetName}`)
      lines.push(trimmed)
    }
  }

  return lines.join('\n\n')
}
