import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, USER_COOKIE, verifySession, verifyUserSession } from '@/lib/session'

export async function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/account')) {
    // подпись сверяется здесь же, как и для /admin; DAL на каждой странице — вторая линия защиты
    if ((await verifyUserSession(req.cookies.get(USER_COOKIE)?.value)) !== null) return NextResponse.next()
    const url = new URL('/login', req.url)
    url.searchParams.set('next', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  if (await verifySession(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next()
  return NextResponse.redirect(new URL('/admin/login', req.url))
}

export const config = {
  matcher: ['/admin', '/admin/((?!login).*)', '/account', '/account/:path*'],
}
