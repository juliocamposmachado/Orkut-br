import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Verificando políticas RLS...')

async function checkPolicies() {
  // Verificar políticas da tabela friendships
  const { data, error } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('schemaname', 'public')
    .eq('tablename', 'friendships')

  if (error) {
    console.log('❌ Erro:', error)
  } else {
    console.log('📋 Políticas encontradas:', data?.length || 0)
    if (data && data.length > 0) {
      data.forEach(policy => {
        console.log(`\n   📜 ${policy.policyname}:`)
        console.log(`      Comando: ${policy.cmd}`)
        console.log(`      Permissivo: ${policy.permissive}`)
      })
    }
  }

  // Testar inserção direta
  console.log('\n🧪 Testando inserção...')
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')
    .limit(2)

  if (profiles && profiles.length >= 2) {
    const { data: insertResult, error: insertError } = await supabase
      .from('friendships')
      .insert({
        requester_id: profiles[0].id,
        addressee_id: profiles[1].id,
        status: 'pending'
      })
      .select()

    if (insertError) {
      console.log('❌ Erro na inserção:', insertError.message)
      console.log('   Código:', insertError.code)
      console.log('   Detalhes:', insertError.details)
    } else {
      console.log('✅ Inserção funcionou!')
      // Limpar teste
      if (insertResult && insertResult.length > 0) {
        await supabase.from('friendships').delete().eq('id', insertResult[0].id)
        console.log('🗑️ Teste removido')
      }
    }
  }
}

checkPolicies()
