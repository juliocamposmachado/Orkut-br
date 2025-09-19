// scripts/vercel-build.js
// Build hook para Vercel garantir que dados existem durante build
// Este script é executado antes do build no ambiente Vercel

const fs = require('fs')
const path = require('path')

console.log('🚀 [Vercel Build Hook] Iniciando preparação...')

async function ensureDataExists() {
  try {
    // Verificar se diretório data existe
    const dataDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
      console.log('📁 [Vercel Build Hook] Diretório data/ criado')
    }

    // Verificar se dados existem
    const backupFile = path.join(dataDir, 'complete-database-backup.json')
    const photosFile = path.join(dataDir, 'photos-feed.json')
    
    if (!fs.existsSync(backupFile) || !fs.existsSync(photosFile)) {
      console.log('📊 [Vercel Build Hook] Dados não encontrados, gerando...')
      
      // Importar e executar função de seed
      const { seedLocalBackup } = require('./seed-complete-database.js')
      await seedLocalBackup()
      
      console.log('✅ [Vercel Build Hook] Dados gerados com sucesso')
    } else {
      console.log('✅ [Vercel Build Hook] Dados já existem')
    }

    // Verificar integridade dos dados
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf-8'))
    console.log(`📊 [Vercel Build Hook] Dados verificados: ${backupData.total_users} usuários, ${backupData.total_communities} comunidades`)

  } catch (error) {
    console.error('❌ [Vercel Build Hook] Erro:', error.message)
    
    // Criar dados mínimos de fallback se houver erro
    console.log('🔄 [Vercel Build Hook] Criando dados de fallback...')
    
    const fallbackData = {
      users: [
        {
          username: 'juliocamp',
          display_name: 'Julio Campos Machado',
          full_name: 'Julio Campos Machado',
          bio: 'Full Stack Developer | Criador do Orkut BR',
          location: 'São Paulo, SP',
          email: 'juliocamposmachado@gmail.com',
          photo_url: 'https://i.imgur.com/QUyGh3B.jpg',
          is_admin: true,
          id: `user_juliocamp_${Date.now()}`,
          created_at: new Date().toISOString()
        }
      ],
      communities: [
        {
          name: 'Orkut BR Oficial',
          description: 'Comunidade oficial do Orkut BR',
          category: 'Tecnologia',
          is_public: true,
          member_count: 1,
          id: `community_${Date.now()}`,
          created_at: new Date().toISOString()
        }
      ],
      photos: [
        {
          imgur_url: 'https://i.imgur.com/QUyGh3B.jpg',
          title: 'Logo Orkut BR',
          description: 'Logo oficial do projeto Orkut BR',
          tags: ['orkut', 'brasil', 'logo'],
          id: `photo_${Date.now()}`,
          user_id: 'juliocamp',
          likes_count: 100,
          comments_count: 10,
          views_count: 1000,
          created_at: new Date().toISOString()
        }
      ],
      posts: [
        {
          content: 'Bem-vindos ao Orkut BR! 🇧🇷',
          likes_count: 50,
          comments_count: 25,
          id: `post_${Date.now()}`,
          author_id: 'juliocamp',
          created_at: new Date().toISOString()
        }
      ],
      radios: [
        {
          name: 'Rádio Tatuapé FM',
          genre: 'MPB',
          frequency: '105.7',
          city: 'São Paulo',
          stream_url: 'https://mytuner-radio.com/radio/radio-tatuape-fm',
          logo_url: 'https://static2.mytuner.mobi/media/tvos_radios/7h/7hmwejpwgz.jpg',
          id: `radio_${Date.now()}`,
          listener_count: 500
        }
      ],
      generated_at: new Date().toISOString(),
      total_users: 1,
      total_communities: 1,
      total_photos: 1,
      total_posts: 1,
      total_radios: 1,
      fallback: true
    }

    const dataDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    fs.writeFileSync(
      path.join(dataDir, 'complete-database-backup.json'),
      JSON.stringify(fallbackData, null, 2)
    )

    // Criar photos-feed.json compatível
    const photosBackup = fallbackData.photos.map(photo => ({
      ...photo,
      imgur_id: photo.imgur_url.split('/').pop().split('.')[0],
      imgur_page_url: photo.imgur_url,
      width: 800,
      height: 600,
      file_size: 150000,
      user_name: 'Julio Campos Machado',
      user_avatar: photo.imgur_url,
      is_public: true,
      mime_type: 'image/jpeg',
      original_filename: photo.title + '.jpg'
    }))

    fs.writeFileSync(
      path.join(dataDir, 'photos-feed.json'),
      JSON.stringify(photosBackup, null, 2)
    )

    console.log('✅ [Vercel Build Hook] Dados de fallback criados')
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  ensureDataExists().then(() => {
    console.log('🎉 [Vercel Build Hook] Preparação concluída')
    process.exit(0)
  }).catch((error) => {
    console.error('❌ [Vercel Build Hook] Erro fatal:', error)
    process.exit(1)
  })
}

module.exports = { ensureDataExists }
