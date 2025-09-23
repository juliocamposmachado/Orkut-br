import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Carregar variáveis de ambiente
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas:')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Testando tabelas de amizade...')

async function testTables() {
  try {
    // 1. Testar tabela friendships
    console.log('\n📋 Testando tabela friendships...')
    const { data: friendships, error: friendshipsError } = await supabase
      .from('friendships')
      .select('*')
      .limit(1)
    
    if (friendshipsError) {
      console.log('❌ Tabela friendships:', friendshipsError)
    } else {
      console.log('✅ Tabela friendships: OK')
      console.log('   Registros encontrados:', friendships?.length || 0)
    }
    
    // 2. Testar tabela notifications
    console.log('\n🔔 Testando tabela notifications...')
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1)
    
    if (notificationsError) {
      console.log('❌ Tabela notifications:', notificationsError)
    } else {
      console.log('✅ Tabela notifications: OK')
      console.log('   Registros encontrados:', notifications?.length || 0)
    }
    
    // 3. Testar view friends_view
    console.log('\n👥 Testando view friends_view...')
    const { data: friendsView, error: friendsViewError } = await supabase
      .from('friends_view')
      .select('*')
      .limit(1)
    
    if (friendsViewError) {
      console.log('❌ View friends_view:', friendsViewError)
    } else {
      console.log('✅ View friends_view: OK')
      console.log('   Registros encontrados:', friendsView?.length || 0)
    }
    
    // 4. Testar tabela profiles
    console.log('\n👤 Testando tabela profiles...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, display_name, username')
      .limit(3)
    
    if (profilesError) {
      console.log('❌ Tabela profiles:', profilesError)
    } else {
      console.log('✅ Tabela profiles: OK')
      console.log('   Usuários encontrados:', profiles?.length || 0)
      if (profiles && profiles.length > 0) {
        console.log('   Amostra:', profiles.map(p => `${p.display_name} (@${p.username})`))
      }
    }
    
    // 5. Verificar estrutura da tabela friendships
    console.log('\n🔧 Verificando estrutura das tabelas...')
    
    // Verificar se consegue criar uma amizade de teste (mas depois remove)
    if (profiles && profiles.length >= 2) {
      console.log('\n🧪 Testando inserção na tabela friendships...')
      const testInsert = {
        requester_id: profiles[0].id,
        addressee_id: profiles[1].id,
        status: 'pending'
      }
      
      const { data: insertResult, error: insertError } = await supabase
        .from('friendships')
        .insert(testInsert)
        .select()
      
      if (insertError) {
        console.log('❌ Erro ao inserir teste:', insertError)
      } else {
        console.log('✅ Inserção teste: OK')
        
        // Remover o teste
        if (insertResult && insertResult.length > 0) {
          await supabase
            .from('friendships')
            .delete()
            .eq('id', insertResult[0].id)
          console.log('🗑️ Registro de teste removido')
        }
      }
    }
    
    console.log('\n✅ Diagnóstico completo!')
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

testTables()
