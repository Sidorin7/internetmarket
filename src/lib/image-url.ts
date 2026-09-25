// Картинки товара — только наши загрузки (локальные или Vercel Blob) и фото из сида.
// Любой другой адрес next/image всё равно не покажет, а страница с ним упадёт.
const ALLOWED = [
  /^\/uploads\/[0-9a-f-]{36}\.(jpg|png|webp|avif)$/,
  /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/[\w\-./]+$/i,
  /^https:\/\/picsum\.photos\/seed\/[\w-]+\/\d+\/\d+$/,
]

export const isAllowedImageUrl = (url: string) => ALLOWED.some((re) => re.test(url))
