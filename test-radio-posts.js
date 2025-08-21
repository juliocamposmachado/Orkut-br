const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://woyyikaztjrhqzgvbhmn.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndveXlpa2F6dGpyaHF6Z3ZiaG1uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTY2NTA5NSwiZXhwIjoyMDcxMjQxMDk1fQ.nxVKHOalxeURcLkHPoe1JS3TtlmnJsO3C4bvwBEzpe0'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testRadioPost() {
  console.log('🤖 Testando sistema de posts automáticos do Orky...\n')
  
  try {
    // 1. Primeiro, verificar se o servidor está rodando
    console.log('🌐 Testando conexão com servidor local...')
    const serverTest = await fetch('http://localhost:3001/api/radio-status')
    
    if (!serverTest.ok) {
      throw new Error('Servidor local não está rodando! Execute: npm run dev')
    }
    console.log('✅ Servidor local conectado!\n')
    
    // 2. Testar a API de post automático
    console.log('🎵 Testando criação de post automático...')
    const response = await fetch('http://localhost:3001/api/radio-auto-post', {
      method: 'POST'
    })
    
    const result = await response.json()
    console.log('📊 Resultado:', JSON.stringify(result, null, 2))
    
    if (result.success) {
      console.log('\n✅ POST CRIADO COM SUCESSO!')
      console.log(`📝 Post ID: ${result.postId}`)
      console.log(`🎵 Música atual: ${result.radioData.currentSong}`)
      console.log(`🧠 Comentário IA: ${result.aiComment}`)
      
      // 3. Verificar se o post aparece no feed
      console.log('\n📋 Verificando se o post apareceu no banco...')
      const { data: posts, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:author (
            username,
            display_name,
            bio
          )
        `)
        .eq('id', result.postId)
        .single()
      
      if (error) {
        console.error('❌ Erro ao buscar post:', error)
      } else {
        console.log('✅ Post encontrado no banco!')
        console.log(`👤 Autor: ${posts.profiles.display_name} (@${posts.profiles.username})`)
        console.log(`📝 Conteúdo: ${posts.content.substring(0, 100)}...`)
        console.log(`⏰ Criado em: ${posts.created_at}`)
      }
      
      // 4. Verificar perfil do Orky
      console.log('\n👤 Verificando perfil do Orky...')
      const { data: orkyProfile, error: orkyError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', 'orky')
        .single()
      
      if (orkyError) {
        console.log('⚠️ Perfil do Orky não encontrado:', orkyError.message)
      } else {
        console.log('✅ Perfil do Orky encontrado!')
        console.log(`🤖 Nome: ${orkyProfile.display_name}`)
        console.log(`📍 Localização: ${orkyProfile.location}`)
        console.log(`📝 Bio: ${orkyProfile.bio}`)
      }
      
    } else {
      console.log('\n⏳ Post não foi criado (aguardando intervalo)')
      console.log(`⏰ Próximo post em: ${result.timeLeftMinutes || 'N/A'} minutos`)
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error.message)
  }
}

// Executar teste
console.log('🧪 TESTE DO SISTEMA DE POSTS AUTOMÁTICOS - ORKY DJ\n')
testRadioPost()
