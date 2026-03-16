import 'server-only'

export async function parseMd(buffer: Buffer): Promise<string> {
  return buffer.toString('utf-8').trim()
}
