import { createClient } from '@supabase/supabase-js'

// Usar as credenciais do .env.local
const supabaseUrl = 'https://wjglxlnbizbqwpkvihsy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZ2x4bG5iaXpicXdwa3ZpaHN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MTk4NDUsImV4cCI6MjA3MzI5NTg0NX0.d3xjt__Qv88opoNyjE_kvo2OGIKxG5giP_uQOaUEphQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSupabaseData() {
  console.log('🔍 Verificando dados no Supabase atual...')
  console.log('📡 URL:', supabaseUrl)
  
  const tables = ['profiles', 'posts', 'communities', 'friendships', 'messages', 'calls', 'notifications']
  
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.log(`❌ ${table}: Erro - ${error.message}`)
      } else {
        console.log(`📊 ${table}: ${count || 0} registros`)
      }
    } catch (err) {
      console.log(`⚠️ ${table}: Tabela não existe ou erro de acesso`)
    }
  }
  
  // Verificar se há algum dado específico
  try {
    console.log('\n🔍 Verificando dados específicos...')
    
    const { data: profileData } = await supabase.from('profiles').select('id, username, display_name').limit(5)
    if (profileData && profileData.length > 0) {
      console.log('👤 Profiles encontrados:')
      profileData.forEach(p => console.log(`  - ${p.display_name} (@${p.username})`))
    }
    
    const { data: postData } = await supabase.from('posts').select('id, author_name, content').limit(5)
    if (postData && postData.length > 0) {
      console.log('📝 Posts encontrados:')
      postData.forEach(p => console.log(`  - ${p.author_name}: ${p.content.substring(0, 50)}...`))
    }
    
  } catch (err) {
    console.log('⚠️ Erro ao buscar dados específicos:', err)
  }
}

checkSupabaseData().catch(console.error)
