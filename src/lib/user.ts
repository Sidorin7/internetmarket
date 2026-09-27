import 'server-only'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { db } from '@/db/client'
import { users, type User } from '@/db/schema'
import { USER_COOKIE, verifyUserSession } from './session'

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const id = await verifyUserSession((await cookies()).get(USER_COOKIE)?.value)
  if (id === null) return null
  return (await db.select().from(users).where(eq(users.id, id)).get()) ?? null
})

export async function requireUser(next = '/account'): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`)
  return user
}
