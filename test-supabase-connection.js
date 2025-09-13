// 🔍 TESTE DE CONEXÃO SUPABASE
// Execute: node test-supabase-connection.js

require('dotenv').config({ path: '.env.local' })

console.log('🔍 DIAGNÓSTICO DA CONEXÃO SUPABASE')
console.log('=====================================')

// Verificar variáveis de ambiente
console.log('📊 VARIÁVEIS DE AMBIENTE:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'DEFINIDA ✅' : 'NÃO DEFINIDA ❌')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'DEFINIDA ✅' : 'NÃO DEFINIDA ❌')
console.log('')

// Testar conexão
async function testConnection() {
  try {
    const { createClient } = require('@supabase/supabase-js')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    console.log('🔄 TESTANDO CONEXÃO COM SUPABASE...')
    
    // Teste direto: Verificar se a tabela 'todos' existe
    console.log('🔍 VERIFICANDO TABELA "todos"...')
    
    const { data: todos, error: todosError } = await supabase
      .from('todos')
      .select('*')
      .limit(1)
    
    if (todosError) {
      if (todosError.code === 'PGRST106' || todosError.message.includes('does not exist')) {
        console.log('❌ TABELA "todos" NÃO EXISTE')
        console.log('💡 SOLUÇÃO: Execute o script SQL database/complete-schema.sql no Supabase Dashboard')
        console.log('🌐 URL: https://supabase.com/dashboard/project/wjglxlnbizbqwpkvihsy/sql')
      } else {
        console.log('❌ ERRO AO ACESSAR TABELA "todos":', todosError.message)
      }
      return
    }
    
    console.log('✅ TABELA "todos" EXISTE E ACESSÍVEL')
    console.log('📊 Dados na tabela:', todos)
    
    // Teste 3: Tentar inserir um registro de teste
    console.log('🔄 TESTANDO INSERÇÃO...')
    
    const { data: insertTest, error: insertError } = await supabase
      .from('todos')
      .insert({ 
        title: 'Teste de Conexão', 
        content: 'Teste automático do script de diagnóstico',
        user_id: null 
      })
      .select()
    
    if (insertError) {
      console.log('⚠️  ERRO NA INSERÇÃO:', insertError.message)
      if (insertError.message.includes('RLS')) {
        console.log('💡 POSSÍVEL CAUSA: Política RLS (Row Level Security)')
        console.log('💡 SOLUÇÃO: Configure as políticas RLS ou use service_role_key para bypass')
      }
    } else {
      console.log('✅ INSERÇÃO: SUCESSO')
      console.log('📝 Registro inserido:', insertTest)
    }

  } catch (error) {
    console.log('❌ ERRO GERAL:', error.message)
  }
}

testConnection()
