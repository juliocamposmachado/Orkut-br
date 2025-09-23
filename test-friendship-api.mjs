import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  process.exit(1)
}

// Cliente anon (como usado na API)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)
// Cliente service role (para setup)
const supabaseService = createClient(supabaseUrl, serviceRoleKey)

console.log('🔍 Testando contexto de autenticação na API de friendships...')

async function testAuthContext() {
  try {
    // 1. Buscar usuários disponíveis
    const { data: users, error: usersError } = await supabaseService
      .from('profiles')
      .select('id, display_name, username')
      .limit(2)

    if (usersError || !users || users.length < 2) {
      console.log('❌ Erro ao buscar usuários:', usersError)
      return
    }

    console.log(`\n👥 Usuários encontrados:`)
    users.forEach(user => {
      console.log(`   - ${user.display_name} (@${user.username}) - ID: ${user.id}`)
    })

    const requester = users[0]
    const addressee = users[1]

    // 2. Tentar fazer login com um usuário (simular autenticação da API)
    console.log(`\n🔐 Tentando simular autenticação como ${requester.display_name}...`)
    
    // Primeiro, vamos verificar se conseguimos "fingir" estar autenticado
    // usando o client anon mas com RLS bypassed via service role
    
    // 3. Teste de inserção com contexto de autenticação "fake"
    console.log('\n🧪 Testando inserção com contexto autenticado...')
    
    // Usar service role para simular usuário autenticado
    const { data: insertResult, error: insertError } = await supabaseService
      .from('friendships')
      .insert({
        requester_id: requester.id,
        addressee_id: addressee.id,
        status: 'pending'
      })
      .select()

    if (insertError) {
      console.log('❌ Erro com service role:', insertError)
    } else {
      console.log('✅ Service role funcionou!')
      
      // Limpar
      if (insertResult && insertResult.length > 0) {
        await supabaseService.from('friendships').delete().eq('id', insertResult[0].id)
        console.log('🗑️ Teste removido')
      }
    }

    // 4. Teste real simulando o que acontece na API
    console.log('\n🎯 Simulando o exato comportamento da API...')
    
    // Simular cookie/session inexistente (o que pode estar causando o erro)
    const { data: anonInsert, error: anonError } = await supabaseAnon
      .from('friendships')
      .insert({
        requester_id: requester.id,
        addressee_id: addressee.id,
        status: 'pending'
      })
      .select()

    if (anonError) {
      console.log('❌ AQUI ESTÁ O PROBLEMA! Cliente anon falhou:', anonError)
      console.log('   Código:', anonError.code)
      console.log('   Detalhes:', anonError.details)
      console.log('   Hint:', anonError.hint)
    } else {
      console.log('✅ Cliente anon funcionou (inesperado)')
      if (anonInsert && anonInsert.length > 0) {
        await supabaseService.from('friendships').delete().eq('id', anonInsert[0].id)
      }
    }

    // 5. Verificar contexto auth no cliente anon
    console.log('\n👤 Verificando contexto de autenticação...')
    const { data: { user }, error: userError } = await supabaseAnon.auth.getUser()
    
    if (userError) {
      console.log('❌ Erro ao buscar usuário:', userError)
    } else {
      console.log('👤 Usuário atual:', user ? `${user.id}` : 'null')
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testAuthContext()
