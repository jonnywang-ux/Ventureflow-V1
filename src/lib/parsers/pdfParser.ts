import 'server-only'

export async function parsePdf(buffer: Buffer): Promise<string> {
  const pdfModule = await import('pdf-parse')
  type PdfParseFn = (buffer: Buffer) => Promise<{ text: string }>
  const parseFn = pdfModule as unknown as PdfParseFn
  const result = await parseFn(buffer)
  return result.text.trim()
}
