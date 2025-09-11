// scripts/seed-photos.js
// Seed de fotos de exemplo com fallback automático para backup local
// Prioridade: Supabase -> backup local (data/photos-feed.json)

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Carregar .env.local manualmente (formato NEXT_PUBLIC_SUPABASE_URL=...)
function loadDotenvLocal() {
  const envPath = path.join(process.cwd(), '.env.local')
  try {
    const content = fs.readFileSync(envPath, 'utf-8')
    content.split(/\r?\n/).forEach(line => {
      if (!line || line.trim().startsWith('#')) return
      const idx = line.indexOf('=')
      if (idx === -1) return
      const key = line.slice(0, idx).trim()
      const val = line.slice(idx + 1).trim()
      if (!(key in process.env)) process.env[key] = val
    })
  } catch (e) {
    // Ignorar se não existir
  }
}

// Função para salvar no backup local
function saveToLocalBackup(photos) {
  const dataDir = path.join(process.cwd(), 'data')
  const backupFile = path.join(dataDir, 'photos-feed.json')
  
  try {
    // Criar diretório se não existir
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    
    // Ler arquivo existente
    let existingPhotos = []
    if (fs.existsSync(backupFile)) {
      try {
        const content = fs.readFileSync(backupFile, 'utf-8')
        existingPhotos = JSON.parse(content) || []
      } catch (e) {
        console.warn('⚠️ Erro ao ler backup existente, criando novo')
      }
    }
    
    // Adicionar novas fotos (evitar duplicatas por imgur_id)
    const existingIds = new Set(existingPhotos.map(p => p.imgur_id))
    const newPhotos = photos.filter(p => !existingIds.has(p.imgur_id))
    
    if (newPhotos.length === 0) {
      console.log('📝 Todas as fotos já existem no backup local')
      return existingPhotos.length
    }
    
    const updatedPhotos = [...newPhotos, ...existingPhotos]
    fs.writeFileSync(backupFile, JSON.stringify(updatedPhotos, null, 2))
    
    console.log(`📝 Backup local atualizado: ${newPhotos.length} novas fotos adicionadas`)
    return updatedPhotos.length
    
  } catch (error) {
    console.error('❌ Erro ao salvar backup local:', error.message)
    throw error
  }
}

async function main() {
  loadDotenvLocal()

  console.log('🎯 Iniciando seed de 6 fotos de exemplo...')

  const examplePhotos = [
    {
      id: 'seed_01_' + Date.now(),
      imgur_id: 'seed_01',
      imgur_url: 'https://i.imgur.com/8KQZ7YB.jpeg',
      imgur_page_url: 'https://imgur.com/8KQZ7YB',
      title: 'Paisagem Montanha Dourada',
      description: 'Uma bela vista das montanhas durante o pôr do sol, com tons dourados.',
      tags: ['paisagem', 'montanha', 'por-do-sol', 'natureza', 'dourado'],
      width: 1920,
      height: 1080,
      file_size: 245760,
      user_name: 'NaturaFoto',
      user_avatar: null
    },
    {
      id: 'seed_02_' + Date.now(),
      imgur_id: 'seed_02',
      imgur_url: 'https://i.imgur.com/jz3h0sU.jpeg',
      imgur_page_url: 'https://imgur.com/jz3h0sU',
      title: 'Gato Fofo na Janela',
      description: 'Meu gatinho observando a chuva pela janela. 🐱',
      tags: ['gato', 'pets', 'fofo', 'janela', 'chuva'],
      width: 1024,
      height: 768,
      file_size: 156234,
      user_name: 'PetLover',
      user_avatar: null
    },
    {
      id: 'seed_03_' + Date.now(),
      imgur_id: 'seed_03',
      imgur_url: 'https://i.imgur.com/sqkVr3P.jpeg',
      imgur_page_url: 'https://imgur.com/sqkVr3P',
      title: 'Arte Digital Abstrata',
      description: 'Experimentando com cores e formas geométricas.',
      tags: ['arte', 'digital', 'abstrato', 'cores', 'geometria'],
      width: 1200,
      height: 1200,
      file_size: 187456,
      user_name: 'ArtistaCriativo',
      user_avatar: null
    },
    {
      id: 'seed_04_' + Date.now(),
      imgur_id: 'seed_04',
      imgur_url: 'https://i.imgur.com/7cWSmXV.jpeg',
      imgur_page_url: 'https://imgur.com/7cWSmXV',
      title: 'Café da Manhã Perfeito',
      description: 'Pão caseiro, geleia de morango e um café fresquinho!',
      tags: ['comida', 'cafe-da-manha', 'caseiro', 'domingo', 'delicioso'],
      width: 1080,
      height: 1350,
      file_size: 234567,
      user_name: 'ChefCaseiro',
      user_avatar: null
    },
    {
      id: 'seed_05_' + Date.now(),
      imgur_id: 'seed_05',
      imgur_url: 'https://i.imgur.com/08nZpcn.jpeg',
      imgur_page_url: 'https://imgur.com/08nZpcn',
      title: 'Praia Paradisíaca',
      description: 'Águas cristalinas e areia branca.',
      tags: ['praia', 'ferias', 'paraiso', 'mar', 'areia-branca'],
      width: 1600,
      height: 900,
      file_size: 298765,
      user_name: 'Viajante',
      user_avatar: null
    },
    {
      id: 'seed_06_' + Date.now(),
      imgur_id: 'seed_06',
      imgur_url: 'https://i.imgur.com/1qJb2Qw.jpeg',
      imgur_page_url: 'https://imgur.com/1qJb2Qw',
      title: 'Flores do Jardim',
      description: 'Primavera chegando com toda sua beleza.',
      tags: ['flores', 'jardim', 'primavera', 'natureza', 'colorido'],
      width: 1024,
      height: 1024,
      file_size: 198432,
      user_name: 'JardineiroAmador',
      user_avatar: null
    }
  ]

  // Tentar Supabase primeiro
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (supabaseUrl && supabaseServiceKey) {
    console.log('🔌 Tentando inserir no Supabase...')
    
    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      })
      
      const systemUserId = '00000000-0000-0000-0000-000000000000'
      const photoFeedData = examplePhotos.map((photo, index) => ({
        user_id: systemUserId,
        user_name: photo.user_name,
        user_avatar: photo.user_avatar,
        imgur_id: photo.imgur_id,
        imgur_url: photo.imgur_url,
        imgur_page_url: photo.imgur_page_url,
        imgur_delete_url: null,
        width: photo.width,
        height: photo.height,
        file_size: photo.file_size,
        mime_type: 'image/jpeg',
        original_filename: `seed_${index + 1}.jpg`,
        title: photo.title,
        description: photo.description,
        tags: photo.tags,
        is_public: true,
        likes_count: Math.floor(Math.random() * 50) + 1,
        comments_count: Math.floor(Math.random() * 20),
        shares_count: Math.floor(Math.random() * 10),
        views_count: Math.floor(Math.random() * 200) + 10,
        created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }))
      
      const { data, error } = await supabase
        .from('photos_feed')
        .insert(photoFeedData)
        .select('id, title, user_name')
      
      if (error) {
        throw new Error(`Supabase error: ${error.message}`)
      }
      
      console.log('✅ Inserção no Supabase concluída:', data?.length || 0, 'fotos')
      
      const { count } = await supabase
        .from('photos_feed')
        .select('*', { count: 'exact', head: true })
        .eq('is_public', true)
      
      console.log('📊 Total de fotos públicas no Supabase:', count)
      console.log('🎉 Seed concluído com sucesso no Supabase!')
      return
      
    } catch (supabaseError) {
      console.warn('⚠️ Supabase indisponível ou tabela não existe:', supabaseError.message)
      console.log('🔄 Caindo para backup local...')
    }
  } else {
    console.warn('⚠️ Credenciais do Supabase não configuradas')
    console.log('🔄 Usando backup local...')
  }
  
  // Fallback: salvar no backup local
  try {
    console.log('💾 Salvando no backup local (data/photos-feed.json)...')
    
    // Adicionar campos extras compatíveis com a API
    const localPhotos = examplePhotos.map(photo => ({
      ...photo,
      user_id: '00000000-0000-0000-0000-000000000000',
      imgur_delete_url: null,
      mime_type: 'image/jpeg',
      original_filename: `${photo.imgur_id}.jpg`,
      is_public: true,
      likes_count: Math.floor(Math.random() * 50) + 1,
      comments_count: Math.floor(Math.random() * 20),
      shares_count: Math.floor(Math.random() * 10),
      views_count: Math.floor(Math.random() * 200) + 10,
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }))
    
    const totalPhotos = saveToLocalBackup(localPhotos)
    
    console.log('✅ Backup local atualizado com sucesso!')
    console.log('📊 Total de fotos no backup local:', totalPhotos)
    console.log('🎉 Seed concluído via backup local!')
    console.log('\n💡 Dica: Para usar o Supabase, aplique a migração:')
    console.log('   1. Acesse seu painel do Supabase')
    console.log('   2. Vá em SQL Editor')
    console.log('   3. Execute o conteúdo de: supabase/migrations/20250911_create_photos_feed.sql')
    
  } catch (localError) {
    console.error('❌ Erro fatal - nem Supabase nem backup local funcionaram:', localError.message)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('❌ Erro inesperado:', e)
  process.exit(1)
})

