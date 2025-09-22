import { createClient } from '@supabase/supabase-js'

// Verificar se as variáveis de ambiente estão disponíveis
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Cria cliente Supabase com verificações de segurança para APIs
 * Retorna cliente configurado ou null se não estiver configurado
 */
export function createSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase não está configurado - algumas funcionalidades podem não funcionar')
    return null
  }
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Verifica se o Supabase está configurado
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseKey)
}

/**
 * Resposta padrão para quando Supabase não está configurado
 */
export function getUnconfiguredResponse(serviceName: string = 'Service') {
  return {
    error: `${serviceName} não configurado`,
    details: 'Supabase não está configurado. Configure as variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.',
    configured: false
  }
}
