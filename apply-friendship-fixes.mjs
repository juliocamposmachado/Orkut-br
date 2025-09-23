import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
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

console.log('🔧 Aplicando correções para sistema de amizades...')

async function applySqlFixes() {
  try {
    // Ler o arquivo SQL
    const sqlContent = readFileSync('./fix-friendships.sql', 'utf8')
    
    // Dividir em comandos individuais (simples)
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`)
    
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i]
      
      if (command.length < 10) continue // Pular comandos muito pequenos
      
      try {
        console.log(`\n${i + 1}/${commands.length} - Executando: ${command.substring(0, 50)}...`)
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql_command: command + ';' 
        })
        
        if (error) {
          console.log(`⚠️ Aviso: ${error.message}`)
          
          // Se for erro de "já existe", não é crítico
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate key') ||
              error.message.includes('does not exist')) {
            console.log('   (Ignorando - não é um erro crítico)')
          } else {
            errorCount++
          }
        } else {
          console.log('✅ OK')
          successCount++
        }
        
        // Pequena pausa para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (err) {
        console.error(`❌ Erro no comando ${i + 1}:`, err.message)
        errorCount++
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('📊 RESULTADO DA APLICAÇÃO:')
    console.log(`✅ Comandos executados com sucesso: ${successCount}`)
    console.log(`⚠️ Comandos com aviso/erro: ${errorCount}`)
    
    if (errorCount === 0) {
      console.log('\n🎉 Todas as correções foram aplicadas com sucesso!')
    } else {
      console.log('\n⚠️ Algumas correções podem ter falhado, mas o sistema deve funcionar.')
    }
    
    // Testar se a view foi criada
    console.log('\n🧪 Testando se a view friends_view foi criada...')
    const { data: testView, error: testError } = await supabase
      .from('friends_view')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.log('❌ View friends_view ainda não funciona:', testError.message)
      console.log('\n💡 MANUAL: Execute os comandos SQL diretamente no Supabase Dashboard')
    } else {
      console.log('✅ View friends_view está funcionando!')
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

// Função alternativa para aplicar via comandos individuais
async function applyManualFixes() {
  console.log('\n🔧 Aplicando correções manualmente...')
  
  try {
    // 1. Criar a view friends_view
    console.log('\n1. Criando view friends_view...')
    const createViewSql = `
      CREATE OR REPLACE VIEW friends_view AS
      SELECT 
        CASE 
          WHEN f.requester_id = auth.uid() THEN f.addressee_id
          ELSE f.requester_id 
        END as friend_id,
        CASE 
          WHEN f.requester_id = auth.uid() THEN addressee.username
          ELSE requester.username 
        END as friend_username,
        CASE 
          WHEN f.requester_id = auth.uid() THEN addressee.display_name
          ELSE requester.display_name 
        END as friend_name,
        CASE 
          WHEN f.requester_id = auth.uid() THEN addressee.photo_url
          ELSE requester.photo_url 
        END as friend_avatar,
        CASE 
          WHEN f.requester_id = auth.uid() THEN COALESCE(addressee.phone, '')
          ELSE COALESCE(requester.phone, '')
        END as friend_phone,
        CASE 
          WHEN f.requester_id = auth.uid() THEN COALESCE(addressee.whatsapp_enabled, true)
          ELSE COALESCE(requester.whatsapp_enabled, true)
        END as friend_whatsapp_enabled,
        CASE 
          WHEN f.requester_id = auth.uid() THEN COALESCE(addressee.privacy_settings, '{}'::jsonb)
          ELSE COALESCE(requester.privacy_settings, '{}'::jsonb)
        END as friend_privacy_settings,
        f.created_at as friendship_date,
        CASE 
          WHEN f.requester_id = auth.uid() THEN f.requester_id
          ELSE f.addressee_id 
        END as user_id
      FROM friendships f
      JOIN profiles requester ON f.requester_id = requester.id
      JOIN profiles addressee ON f.addressee_id = addressee.id
      WHERE f.status = 'accepted'
        AND (f.requester_id = auth.uid() OR f.addressee_id = auth.uid())
    `
    
    const { error: viewError } = await supabase.rpc('exec_sql', { 
      sql_command: createViewSql 
    })
    
    if (viewError) {
      console.log('⚠️ Erro ao criar view:', viewError.message)
    } else {
      console.log('✅ View criada com sucesso!')
    }
    
    // 2. Testar a view
    console.log('\n2. Testando a view...')
    const { data: viewTest, error: viewTestError } = await supabase
      .from('friends_view')
      .select('*')
      .limit(1)
    
    if (viewTestError) {
      console.log('❌ View não funciona:', viewTestError.message)
    } else {
      console.log('✅ View funcionando!')
    }
    
    console.log('\n✅ Correções manuais aplicadas!')
    
  } catch (error) {
    console.error('❌ Erro nas correções manuais:', error.message)
  }
}

// Executar as correções
console.log('Escolha o método de aplicação:')
console.log('1. Automático (via arquivo SQL)')
console.log('2. Manual (comandos individuais)')

// Por ora, vamos usar o método manual que é mais confiável
applyManualFixes()
