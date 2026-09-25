import { describe, expect, it } from 'vitest'
import { isAllowedImageUrl } from './image-url'

describe('isAllowedImageUrl', () => {
  it('accepts local uploads, Vercel Blob and seed images', () => {
    expect(isAllowedImageUrl('/uploads/0b8f2a9e-1c3d-4e5f-8a9b-0c1d2e3f4a5b.webp')).toBe(true)
    expect(isAllowedImageUrl('https://abc123.public.blob.vercel-storage.com/products/photo-x7Yz.jpg')).toBe(true)
    expect(isAllowedImageUrl('https://picsum.photos/seed/kedy-1/600/800')).toBe(true)
  })

  it('rejects everything else', () => {
    for (const url of [
      'https://evil.example.com/a.jpg',
      'http://abc.public.blob.vercel-storage.com/a.jpg',
      'https://public.blob.vercel-storage.com.evil.com/a.jpg',
      'javascript:alert(1)',
      '/uploads/../../etc/passwd',
      '//evil.com/a.jpg',
      '',
    ]) {
      expect(isAllowedImageUrl(url), url).toBe(false)
    }
  })
})
