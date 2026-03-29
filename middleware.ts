import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // No session → redirect to landing for protected routes
  if (!user && (pathname.startsWith('/feed') || pathname.startsWith('/article') || pathname.startsWith('/onboarding'))) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Has session → check onboarding status
  if (user && (pathname.startsWith('/feed') || pathname.startsWith('/article'))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_done')
      .eq('id', user.id)
      .single()

    if (!profile?.onboarding_done) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  // Onboarding route: only for authenticated users who haven't completed it
  if (user && pathname.startsWith('/onboarding')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_done')
      .eq('id', user.id)
      .single()

    if (profile?.onboarding_done) {
      return NextResponse.redirect(new URL('/feed', request.url))
    }
  }

  // Logged-in user hitting landing page → redirect appropriately
  if (user && pathname === '/') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_done')
      .eq('id', user.id)
      .single()

    return NextResponse.redirect(
      new URL(profile?.onboarding_done ? '/feed' : '/onboarding', request.url)
    )
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/', '/feed', '/feed/:path*', '/article/:path*', '/onboarding', '/auth/callback'],
}
