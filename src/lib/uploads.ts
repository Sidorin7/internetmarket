import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' }
export const MIME_BY_EXT = Object.fromEntries(Object.entries(TYPES).map(([mime, ext]) => [ext, mime]))
export const ALLOWED_IMAGE_TYPES = Object.keys(TYPES)
export const MAX_UPLOAD = 5 * 1024 * 1024

export const isBlobStorage = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN)
export const FILE_RE = /^[0-9a-f-]{36}\.(jpg|png|webp|avif)$/

export const uploadDir = () => path.resolve(process.env.UPLOAD_DIR ?? 'data/uploads')

export async function saveUpload(file: File): Promise<string> {
  const ext = TYPES[file.type]
  if (!ext) throw new Error(`Формат ${file.type || 'неизвестен'} не поддерживается (нужен JPG, PNG, WEBP, AVIF)`)
  if (file.size > MAX_UPLOAD) throw new Error(`Файл «${file.name}» больше 5 МБ`)
  await fs.mkdir(uploadDir(), { recursive: true })
  const name = `${randomUUID()}.${ext}`
  await fs.writeFile(path.join(uploadDir(), name), Buffer.from(await file.arrayBuffer()))
  return `/uploads/${name}`
}
