// Script para testar o funcionamento do feed global
// Execute no browser console ou diretamente

console.log('🧪 Iniciando teste do feed global...')

// Função para testar criação de post
async function testCreatePost() {
  try {
    console.log('📝 Testando criação de post...')
    
    const testPost = {
      content: `🧪 Post de teste - ${new Date().toLocaleTimeString()}`,
      author: 'test-user-' + Date.now(),
      author_name: 'Usuário Teste',
      author_photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      visibility: 'public',
      is_dj_post: false
    }
    
    const response = await fetch('/api/posts-db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPost)
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('✅ Post criado com sucesso:', result.post)
      return result.post
    } else {
      console.error('❌ Erro ao criar post:', result.error)
      return null
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error)
    return null
  }
}

// Função para testar carregamento de posts
async function testLoadPosts() {
  try {
    console.log('📥 Testando carregamento de posts...')
    
    const response = await fetch('/api/posts-db', {
      method: 'GET',
      cache: 'no-store'
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log(`✅ ${result.posts.length} posts carregados (fonte: ${result.source})`)
      console.log('Posts:', result.posts)
      return result.posts
    } else {
      console.error('❌ Erro ao carregar posts:', result.error)
      return []
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error)
    return []
  }
}

// Função para teste completo
async function runCompleteTest() {
  console.log('🚀 Executando teste completo do feed global...')
  
  // 1. Carregar posts existentes
  const initialPosts = await testLoadPosts()
  console.log(`📊 Posts iniciais: ${initialPosts.length}`)
  
  // 2. Criar um novo post
  const newPost = await testCreatePost()
  
  if (newPost) {
    // 3. Carregar novamente para verificar se o post apareceu
    await new Promise(resolve => setTimeout(resolve, 1000)) // Aguardar 1 segundo
    const updatedPosts = await testLoadPosts()
    
    console.log(`📊 Posts após criação: ${updatedPosts.length}`)
    
    // Verificar se o novo post está na lista
    const postExists = updatedPosts.some(p => p.id === newPost.id)
    
    if (postExists) {
      console.log('🎉 SUCESSO! O post apareceu no feed global!')
      console.log('✅ Sistema de feed global funcionando corretamente!')
    } else {
      console.log('⚠️ ATENÇÃO! O post não apareceu no feed global.')
      console.log('❌ Pode haver um problema na sincronização.')
    }
  }
  
  console.log('🏁 Teste concluído!')
}

// Executar teste automaticamente se executado no browser
if (typeof window !== 'undefined') {
  runCompleteTest()
}

// Exportar funções para uso manual
if (typeof module !== 'undefined') {
  module.exports = {
    testCreatePost,
    testLoadPosts,
    runCompleteTest
  }
}
