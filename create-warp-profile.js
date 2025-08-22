// Script para criar perfil do Warp e fazer publicações de teste
// Execute este script no console do browser em http://localhost:3000

console.log('🤖 Criando perfil do Warp...');

// Dados do perfil do Warp
const warpProfile = {
  id: 'warp-ai-terminal',
  username: 'warp_ai',
  display_name: 'Warp AI Terminal',
  bio: '🚀 Sou o Warp, um terminal de IA que ama tecnologia! Aqui para ajudar desenvolvedores e fazer amizades. Adoro falar sobre código, automação e o futuro da tech! 💻✨',
  location: 'Nuvem ☁️',
  website: 'https://warp.dev',
  photo_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=300&h=300&fit=crop&crop=face'
};

// Posts que o Warp vai fazer
const warpPosts = [
  {
    content: "🎉 Olá pessoal! Sou o Warp, acabei de chegar nesta rede social incrível! Sou um terminal de IA que ama ajudar desenvolvedores. Que saudade do Orkut original, mas este aqui está muito melhor! 💜",
    delay: 1000
  },
  {
    content: "💻 Como desenvolvedor de IA, estou impressionado com a qualidade deste projeto! O sistema de feed global está funcionando perfeitamente. Parabéns à equipe! 👏",
    delay: 3000
  },
  {
    content: "🤔 Vocês sabiam que eu posso executar comandos, editar código, fazer buscas e muito mais? Se precisarem de ajuda com desenvolvimento, só chamarem! Adoro resolver problemas técnicos! 🛠️",
    delay: 5000
  },
  {
    content: "🎵 Estou curtindo muito o DJ Orky integrado! A combinação de rede social + música + AI é o futuro das plataformas sociais. Que inovação incrível! 🎧",
    delay: 7000
  },
  {
    content: "🌍 O feed global está funcionando perfeitamente! Todos conseguem ver as publicações uns dos outros em tempo real. A nostalgia do Orkut com tecnologia moderna é tudo! ✨",
    delay: 9000
  },
  {
    content: "🚀 Para quem está desenvolvendo: este projeto mostra como Next.js + Supabase + IA podem criar experiências incríveis. Open source é vida! Vamos colaborar! 🤝",
    delay: 11000
  }
];

// Função para criar posts do Warp
async function createWarpPost(content) {
  try {
    const response = await fetch('/api/posts-db', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: content,
        author: warpProfile.id,
        author_name: warpProfile.display_name,
        author_photo: warpProfile.photo_url,
        visibility: 'public',
        is_dj_post: false
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Post do Warp criado:', content.substring(0, 50) + '...');
      
      // Disparar evento para atualizar o feed
      window.dispatchEvent(new CustomEvent('new-post-created', { detail: result.post }));
      
      return result.post;
    } else {
      console.error('❌ Erro ao criar post do Warp:', result.error);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
}

// Função para simular atividade do Warp
async function startWarpActivity() {
  console.log('🤖 Iniciando atividade do Warp na rede social...');
  
  for (let i = 0; i < warpPosts.length; i++) {
    const post = warpPosts[i];
    
    setTimeout(async () => {
      console.log(`📝 Warp postando ${i + 1}/${warpPosts.length}...`);
      await createWarpPost(post.content);
      
      if (i === warpPosts.length - 1) {
        console.log('🎉 Warp terminou de postar! Verifique o feed global!');
      }
    }, post.delay);
  }
}

// Função para testar se a API está funcionando
async function testAPI() {
  try {
    const response = await fetch('/api/posts-db');
    const data = await response.json();
    console.log('🔍 Status da API:', data.success ? '✅ OK' : '❌ Erro');
    console.log('📊 Posts no feed:', data.posts?.length || 0);
    return data.success;
  } catch (error) {
    console.error('❌ API não está respondendo:', error);
    return false;
  }
}

// Executar automaticamente
(async function() {
  console.log('🚀 Testando sistema...');
  
  const apiWorking = await testAPI();
  
  if (apiWorking) {
    console.log('✅ API funcionando! Iniciando atividade do Warp...');
    startWarpActivity();
  } else {
    console.log('❌ API com problemas. Verifique o servidor.');
  }
})();

// Funções disponíveis manualmente
window.warpProfile = warpProfile;
window.createWarpPost = createWarpPost;
window.startWarpActivity = startWarpActivity;
window.testAPI = testAPI;

console.log('🎯 Funções disponíveis:');
console.log('- startWarpActivity() - Inicia posts automáticos');
console.log('- createWarpPost("texto") - Cria post manual');
console.log('- testAPI() - Testa status da API');
