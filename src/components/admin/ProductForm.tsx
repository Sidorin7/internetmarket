'use client'

import { ActionIcon, Alert, Button, CloseButton, Group, Image, NumberInput, Paper, Select, SimpleGrid, Stack, Switch, Text, Textarea, TextInput, Title } from '@mantine/core'
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone'
import { useState, useTransition } from 'react'
import { saveProductAction } from '@/features/admin/actions'
import { uploadImage, type ImageStorage } from '@/lib/upload-client'

type Variant = { size: string; stock: number }
type Initial = { id: number; title: string; description: string; price: number; oldPrice: number | null; categoryId: number; isActive: boolean; variants: Variant[]; images: string[] }

const PRESETS: Record<string, string[]> = {
  'Одежда XS–XL': ['XS', 'S', 'M', 'L', 'XL'],
  'Обувь 36–44': ['36', '37', '38', '39', '40', '41', '42', '43', '44'],
  'Один размер': ['ONE SIZE'],
}

export function ProductForm({ categories, initial, storage }: { categories: { id: number; name: string }[]; initial?: Initial; storage: ImageStorage }) {
  const [variants, setVariants] = useState<Variant[]>(initial?.variants ?? [])
  const [images, setImages] = useState<string[]>(initial?.images ?? [])
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [pending, start] = useTransition()

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.set('isActive', String(fd.get('isActive') === 'on'))
    fd.set('variants', JSON.stringify(variants))
    setError('')
    start(async () => {
      // сначала фото (прямо в хранилище), потом товар — так запрос к серверу остаётся маленьким
      let uploaded: string[]
      try {
        uploaded = await Promise.all(files.map((f) => uploadImage(f, storage)))
      } catch (err) {
        setError((err as Error).message)
        return
      }
      const all = [...images, ...uploaded]
      // загруженные переносим в список фото, чтобы при ошибке валидации не грузить их повторно
      setImages(all)
      setFiles([])
      fd.set('images', JSON.stringify(all))
      const res = await saveProductAction(initial?.id ?? null, fd)
      if (res?.error) setError(res.error)
    })
  }

  const setVariant = (i: number, patch: Partial<Variant>) => setVariants((vs) => vs.map((v, j) => (j === i ? { ...v, ...patch } : v)))

  return (
    <form onSubmit={submit}>
      <Stack maw={860}>
        <Title order={2}>{initial ? 'Редактирование товара' : 'Новый товар'}</Title>
        {error && <Alert color="red">{error}</Alert>}
        <Paper withBorder p="lg" radius="md">
          <Stack>
            <TextInput name="title" label="Название" required defaultValue={initial?.title} />
            <Textarea name="description" label="Описание" autosize minRows={4} defaultValue={initial?.description} />
            <SimpleGrid cols={{ base: 1, sm: 3 }}>
              <NumberInput name="price" label="Цена, ₽" required min={1} thousandSeparator=" " defaultValue={initial ? initial.price / 100 : undefined} />
              <NumberInput name="oldPrice" label="Старая цена, ₽ (для скидки)" min={1} thousandSeparator=" " defaultValue={initial?.oldPrice ? initial.oldPrice / 100 : undefined} />
              <Select name="categoryId" label="Категория" required data={categories.map((c) => ({ value: String(c.id), label: c.name }))} defaultValue={initial ? String(initial.categoryId) : null} />
            </SimpleGrid>
            <Switch name="isActive" label="В продаже" defaultChecked={initial?.isActive ?? true} />
          </Stack>
        </Paper>

        <Paper withBorder p="lg" radius="md">
          <Group justify="space-between" mb="sm">
            <Text fw={600}>Размеры и остатки</Text>
            <Group gap="xs">
              {Object.entries(PRESETS).map(([label, sizes]) => (
                <Button key={label} size="xs" variant="light" onClick={() => setVariants(sizes.map((size) => variants.find((v) => v.size === size) ?? { size, stock: 0 }))}>{label}</Button>
              ))}
              <Button size="xs" variant="default" onClick={() => setVariants((vs) => [...vs, { size: '', stock: 0 }])}>+ размер</Button>
            </Group>
          </Group>
          <SimpleGrid cols={{ base: 2, sm: 4 }}>
            {variants.map((v, i) => (
              <Group key={i} gap={4} wrap="nowrap">
                <TextInput aria-label="Размер" placeholder="Размер" value={v.size} onChange={(e) => setVariant(i, { size: e.currentTarget.value })} w={90} />
                <NumberInput aria-label="Остаток" min={0} value={v.stock} onChange={(n) => setVariant(i, { stock: Number(n) || 0 })} w={80} />
                <CloseButton aria-label="Убрать размер" onClick={() => setVariants((vs) => vs.filter((_, j) => j !== i))} />
              </Group>
            ))}
          </SimpleGrid>
        </Paper>

        <Paper withBorder p="lg" radius="md">
          <Text fw={600} mb="sm">Фото (первое — обложка)</Text>
          <Group mb="md">
            {images.map((src, i) => (
              <div key={src} style={{ position: 'relative' }}>
                <Image src={src} alt="" w={90} h={120} radius="md" fit="cover" />
                <Group gap={2} style={{ position: 'absolute', top: 4, right: 4 }}>
                  {i > 0 && <ActionIcon size="sm" variant="white" aria-label="Сделать раньше" onClick={() => setImages((im) => { const c = [...im]; [c[i - 1], c[i]] = [c[i], c[i - 1]]; return c })}>←</ActionIcon>}
                  <ActionIcon size="sm" color="red" aria-label="Удалить фото" onClick={() => setImages((im) => im.filter((x) => x !== src))}>✕</ActionIcon>
                </Group>
              </div>
            ))}
            {files.map((f, i) => (
              <div key={`${f.name}-${i}`} style={{ position: 'relative' }}>
                <Image src={URL.createObjectURL(f)} alt="" w={90} h={120} radius="md" fit="cover" style={{ outline: '2px dashed var(--mantine-color-violet-4)' }} />
                <ActionIcon size="sm" color="red" style={{ position: 'absolute', top: 4, right: 4 }} aria-label="Убрать" onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))}>✕</ActionIcon>
              </div>
            ))}
          </Group>
          <Dropzone accept={IMAGE_MIME_TYPE} maxSize={5 * 1024 ** 2} onDrop={(dropped) => setFiles((fs) => [...fs, ...dropped])} onReject={() => setError('Некоторые файлы отклонены: только изображения до 5 МБ')}>
            <Text ta="center" c="dimmed" py="lg">Перетащите фото сюда или нажмите, чтобы выбрать (до 5 МБ)</Text>
          </Dropzone>
        </Paper>

        <Group>
          <Button type="submit" size="md" loading={pending}>Сохранить</Button>
          <Button component="a" href="/admin/products" variant="default" size="md">Отмена</Button>
        </Group>
      </Stack>
    </form>
  )
}
