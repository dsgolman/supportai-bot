// @/utils/supabase/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/client'

export async function updateSession(request: NextRequest) {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  // Allow public access to the landing page
  if (request.nextUrl.pathname === '/') {
    return NextResponse.next()
  }

  // Redirect to /login if the user is not authenticated
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}