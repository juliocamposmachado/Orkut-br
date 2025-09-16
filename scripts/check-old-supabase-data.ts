import { createClient } from '@supabase/supabase-js'

// Verificar o Supabase ANTIGO (do .env.example)
const oldSupabaseUrl = 'https://woyyikaztjrhqzgvbhmn.supabase.co'
const oldSupabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndveXlpa2F6dGpyaHF6Z3ZiaG1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2NjUwOTUsImV4cCI6MjA3MTI0MTA5NX0.rXp7c0167cjPXfp6kYDNKq6s4RrD8E7C2-NzukKPQnQ'

const oldSupabase = createClient(oldSupabaseUrl, oldSupabaseKey)

async function checkOldSupabaseData() {
  console.log('🔍 Verificando dados no Supabase ANTIGO...')
  console.log('📡 URL:', oldSupabaseUrl)
  
  const tables = ['profiles', 'posts', 'communities', 'friendships', 'messages', 'calls', 'notifications']
  let totalRecords = 0
  
  for (const table of tables) {
    try {
      const { data, error, count } = await oldSupabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ ${table}: Erro - ${error.message}`)
      } else {
        const recordCount = count || 0
        totalRecords += recordCount
        console.log(`📊 ${table}: ${recordCount} registros`)
      }
    } catch (err) {
      console.log(`⚠️ ${table}: Tabela não existe ou erro de acesso`)
    }
  }
  
  console.log(`\n📈 TOTAL DE REGISTROS NO SUPABASE ANTIGO: ${totalRecords}`)
  
  if (totalRecords > 0) {
    console.log('\n🎯 MIGRAÇÃO NECESSÁRIA!')
    console.log('Execute: POST http://localhost:3000/api/migration/run')
    console.log('Ou: POST http://localhost:3000/api/migration/incremental')
    
    // Verificar dados específicos como amostra
    try {
      console.log('\n🔍 Amostras de dados encontrados...')
      
      const { data: profileData } = await oldSupabase.from('profiles').select('id, username, display_name').limit(3)
      if (profileData && profileData.length > 0) {
        console.log('👤 Profiles encontrados:')
        profileData.forEach(p => console.log(`  - ${p.display_name} (@${p.username})`))
      }
      
      const { data: postData } = await oldSupabase.from('posts').select('id, author_name, content').limit(3)
      if (postData && postData.length > 0) {
        console.log('📝 Posts encontrados:')
        postData.forEach(p => console.log(`  - ${p.author_name}: ${p.content.substring(0, 50)}...`))
      }
      
    } catch (err) {
      console.log('⚠️ Erro ao buscar amostras:', err)
    }
  } else {
    console.log('\n✅ Nenhum dado para migrar - Supabase antigo está vazio')
  }
}

checkOldSupabaseData().catch(console.error)
