import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySession } from '@/lib/session'
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD, saveUpload, isBlobStorage } from '@/lib/uploads'

// С BLOB_READ_WRITE_TOKEN (Vercel) — выдаём браузеру одноразовый токен, и фото уходит прямо в Blob:
// через функцию Vercel больше 4,5 МБ не пройдёт. Без токена (локально) — принимаем файл и кладём в data/uploads.
export async function POST(request: Request) {
  if (!(await verifySession((await cookies()).get(SESSION_COOKIE)?.value))) {
    return NextResponse.json({ error: 'Нужно войти в админку' }, { status: 401 })
  }

  try {
    if (isBlobStorage()) {
      const body = (await request.json()) as HandleUploadBody
      return NextResponse.json(
        await handleUpload({
          request,
          body,
          onBeforeGenerateToken: async () => ({
            allowedContentTypes: ALLOWED_IMAGE_TYPES,
            maximumSizeInBytes: MAX_UPLOAD,
            addRandomSuffix: true,
          }),
        }),
      )
    }
    const file = (await request.formData()).get('file')
    if (!(file instanceof File)) return NextResponse.json({ error: 'Файл не передан' }, { status: 400 })
    return NextResponse.json({ url: await saveUpload(file) })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 })
  }
}
