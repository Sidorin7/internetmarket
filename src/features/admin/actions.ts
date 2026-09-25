'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/db/client'
import { ORDER_STATUSES } from '@/db/schema'
import { requireAdmin } from '@/lib/admin'
import { saveUpload } from '@/lib/uploads'
import { createCategory, deleteCategory, renameCategory } from './categories'
import { setOrderStatus } from './orders'
import { deleteProduct, productInputSchema, saveProduct } from './products'

export type FormResult = { error?: string }

function json(v: FormDataEntryValue | null): unknown {
  try {
    return JSON.parse(String(v ?? 'null'))
  } catch {
    return null
  }
}

export async function saveProductAction(id: number | null, formData: FormData): Promise<FormResult> {
  await requireAdmin()
  let uploaded: string[]
  try {
    uploaded = await Promise.all(formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0).map(saveUpload))
  } catch (e) {
    return { error: (e as Error).message }
  }
  const parsed = productInputSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') ?? '',
    price: formData.get('price'),
    oldPrice: formData.get('oldPrice'),
    categoryId: formData.get('categoryId'),
    isActive: formData.get('isActive'),
    variants: json(formData.get('variants')),
    images: [...((json(formData.get('images')) as string[] | null) ?? []), ...uploaded],
  })
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join('. ') }
  await saveProduct(db, parsed.data, id ?? undefined)
  revalidatePath('/', 'layout')
  redirect('/admin/products')
}

export async function deleteProductAction(id: number): Promise<void> {
  await requireAdmin()
  await deleteProduct(db, id)
  revalidatePath('/', 'layout')
}

export async function createCategoryAction(name: string): Promise<FormResult> {
  await requireAdmin()
  const res = await createCategory(db, name)
  revalidatePath('/', 'layout')
  return res.ok ? {} : { error: res.error }
}

export async function renameCategoryAction(id: number, name: string): Promise<void> {
  await requireAdmin()
  await renameCategory(db, id, name)
  revalidatePath('/', 'layout')
}

export async function deleteCategoryAction(id: number): Promise<FormResult> {
  await requireAdmin()
  const res = await deleteCategory(db, id)
  revalidatePath('/', 'layout')
  return res.ok ? {} : { error: res.error }
}

export async function setOrderStatusAction(id: number, status: string): Promise<FormResult> {
  await requireAdmin()
  const res = await setOrderStatus(db, id, z.enum(ORDER_STATUSES).parse(status))
  revalidatePath('/', 'layout') // при отмене меняются остатки на витрине
  return res.ok ? {} : { error: res.error }
}
