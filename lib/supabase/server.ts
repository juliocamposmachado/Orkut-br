import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/supabase'

export function createServerSupabaseClient() {
  const cookieStore = cookies()
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Se não estiver configurado, retornar cliente mock
  if (!supabaseUrl || !supabaseAnonKey || 
      supabaseUrl.includes('placeholder') || 
      supabaseUrl.includes('your_') ||
      !supabaseUrl.startsWith('https://')) {
    console.warn('Supabase não configurado no servidor - usando cliente mock')
    
    // Cliente mock simples para desenvolvimento
    const mockFunction = () => Promise.resolve({ data: null, error: { message: 'Supabase não configurado' } })
    const mockSuccessFunction = () => Promise.resolve({ data: [], error: null })
    
    const createMockChain = () => ({
      select: () => createMockChain(),
      insert: () => createMockChain(),
      update: () => createMockChain(),
      delete: () => createMockChain(),
      upsert: () => createMockChain(),
      eq: () => createMockChain(),
      or: () => createMockChain(),
      neq: () => createMockChain(),
      gte: () => createMockChain(),
      lte: () => createMockChain(),
      limit: () => createMockChain(),
      order: () => createMockChain(),
      ilike: () => createMockChain(),
      single: () => mockFunction(),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      then: (callback: Function) => callback({ data: [], error: null })
    })
    
    return {
      from: () => createMockChain(),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null })
      }
    } as any
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Server component can't set cookies
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Server component can't remove cookies
          }
        },
      },
    }
  )
}
