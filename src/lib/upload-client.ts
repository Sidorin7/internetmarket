import { upload } from '@vercel/blob/client'

export type ImageStorage = 'blob' | 'local'

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' }

export async function uploadImage(file: File, storage: ImageStorage): Promise<string> {
  if (storage === 'blob') {
    const blob = await upload(`products/photo.${EXT[file.type] ?? 'jpg'}`, file, { access: 'public', handleUploadUrl: '/api/upload' })
    return blob.url
  }
  const fd = new FormData()
  fd.set('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body: fd })
  const data = (await res.json()) as { url?: string; error?: string }
  if (!res.ok || !data.url) throw new Error(data.error ?? 'Не удалось загрузить фото')
  return data.url
}
