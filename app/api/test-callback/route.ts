import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  
  // Testar criação do cliente Supabase
  let supabaseTest = null
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data, error } = await supabase.auth.getUser()
    supabaseTest = {
      success: true,
      hasUser: !!data?.user,
      userEmail: data?.user?.email,
      error: error?.message
    }
  } catch (e) {
    supabaseTest = {
      success: false,
      error: (e as Error).message
    }
  }
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV,
    supabase_config: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      has_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      anon_key_preview: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 50) + '...'
    },
    site_url: process.env.NEXT_PUBLIC_SITE_URL,
    request_info: {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      search_params: Object.fromEntries(url.searchParams.entries())
    },
    cookies: request.cookies.getAll(),
    supabase_test: supabaseTest,
    callback_info: {
      expected_callback_url: process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000/auth/callback'
        : 'https://orkut-br-oficial.vercel.app/auth/callback',
      current_hostname: url.hostname,
      current_origin: url.origin
    }
  }
  
  return NextResponse.json(debugInfo, { 
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json'
    }
  })
}
