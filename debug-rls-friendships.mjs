import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Debugando RLS da tabela friendships...')

async function debugRLSPolicies() {
  try {
    // 1. Verificar políticas RLS existentes
    console.log('\n📋 Políticas RLS da tabela friendships:')
    const { data: policies, error: policiesError } = await supabase
      .rpc('execute', {
        query: `
          SELECT 
            policyname as nome_politica,
            cmd as comando,
            permissive as permissivo,
            pg_get_expr(qual, 'public.friendships'::regclass) as condicao_using,
            pg_get_expr(with_check, 'public.friendships'::regclass) as condicao_with_check
          FROM pg_policies 
          WHERE schemaname = 'public' 
          AND tablename = 'friendships';
        `
      })

    if (policiesError) {
      console.log('❌ Erro ao buscar políticas:', policiesError)
    } else {
      console.log('✅ Políticas encontradas:', policies?.length || 0)
      if (policies && policies.length > 0) {
        policies.forEach(policy => {
          console.log(`   📜 ${policy.nome_politica} (${policy.comando}):`)
          if (policy.condicao_using) {
            console.log(`      USING: ${policy.condicao_using}`)
          }
          if (policy.condicao_with_check) {
            console.log(`      WITH CHECK: ${policy.condicao_with_check}`)
          }
        })
      }
    }

    // 2. Verificar se RLS está habilitado
    console.log('\n🔒 Verificando se RLS está habilitado:')
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('execute', {
        query: `
          SELECT 
            schemaname,
            tablename,
            rowsecurity as rls_habilitado
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename = 'friendships';
        `
      })

    if (rlsError) {
      console.log('❌ Erro ao verificar RLS:', rlsError)
    } else {
      console.log('✅ Status RLS:', rlsStatus?.[0]?.rls_habilitado ? 'HABILITADO' : 'DESABILITADO')
    }

    // 3. Testar contexto de autenticação
    console.log('\n👤 Testando contexto de autenticação:')
    
    // Primeiro como service role (sem auth context)
    const { data: serviceRoleContext, error: serviceError } = await supabase
      .rpc('execute', {
        query: 'SELECT auth.uid() as user_id, current_user as db_user;'
      })

    if (serviceError) {
      console.log('❌ Erro ao testar service role:', serviceError)
    } else {
      console.log('✅ Service Role Context:')
      console.log('   User ID:', serviceRoleContext?.[0]?.user_id || 'NULL')
      console.log('   DB User:', serviceRoleContext?.[0]?.db_user)
    }

    // 4. Testar inserção com diferentes cenários
    console.log('\n🧪 Testando cenários de inserção...')
    
    // Buscar dois usuários para teste
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .limit(2)

    if (usersError || !users || users.length < 2) {
      console.log('❌ Não foi possível buscar usuários para teste:', usersError)
      return
    }

    console.log(`\n   Usuários disponíveis: ${users[0].display_name} e ${users[1].display_name}`)

    // Teste 1: Inserção direta como service role (deve funcionar)
    console.log('\n   Teste 1: Inserção como Service Role...')
    const { data: insertTest1, error: insertError1 } = await supabase
      .from('friendships')
      .insert({
        requester_id: users[0].id,
        addressee_id: users[1].id,
        status: 'pending'
      })
      .select()

    if (insertError1) {
      console.log('   ❌ Service Role falhou:', insertError1)
    } else {
      console.log('   ✅ Service Role funcionou')
      // Remover o teste
      if (insertTest1 && insertTest1.length > 0) {
        await supabase.from('friendships').delete().eq('id', insertTest1[0].id)
        console.log('   🗑️ Registro de teste removido')
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

debugRLSPolicies()
