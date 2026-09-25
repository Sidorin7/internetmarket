import fs from 'node:fs/promises'
import path from 'node:path'
import { FILE_RE, MIME_BY_EXT, uploadDir } from '@/lib/uploads'

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params
  if (!FILE_RE.test(file)) return new Response('Not found', { status: 404 })
  try {
    const data = await fs.readFile(path.join(uploadDir(), file))
    return new Response(new Uint8Array(data), {
      headers: { 'Content-Type': MIME_BY_EXT[file.split('.').pop()!], 'Cache-Control': 'public, max-age=31536000, immutable' },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
