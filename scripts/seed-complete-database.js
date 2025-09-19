// scripts/seed-complete-database.js
// Script completo para popular todas as tabelas do Orkut BR com dados realistas
// Baseado nas imagens fornecidas para replicar a experiência authentic

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Carregar .env.local manualmente
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
    console.warn('⚠️ Arquivo .env.local não encontrado, usando variáveis de ambiente')
  }
}

// Dados de usuários brasileiros realistas
const BRAZILIAN_USERS = [
  {
    username: 'juliocamp',
    display_name: 'Julio Campos Machado',
    full_name: 'Julio Campos Machado',
    bio: 'Full Stack Developer | Criador do Orkut BR | Soluções em TI',
    location: 'São Paulo, SP',
    email: 'juliocamposmachado@gmail.com',
    photo_url: 'https://i.imgur.com/QUyGh3B.jpg',
    is_admin: true
  },
  {
    username: 'radiotatuape',
    display_name: 'Rádio Tatuapé FM',
    full_name: 'Rádio Tatuapé FM',
    bio: 'Love In The Age of War | Música para todos os gostos',
    location: 'São Paulo, SP',
    email: 'radio@tatuape.fm',
    photo_url: 'https://i.imgur.com/8KQZ7YB.jpeg',
    is_admin: false
  },
  {
    username: 'aildo_cesar',
    display_name: 'Aildo César',
    full_name: 'Aildo César Campos',
    bio: 'Advogado | Amante da música | Família é tudo',
    location: 'Rio de Janeiro, RJ',
    email: 'aildo@exemplo.com',
    photo_url: 'https://i.imgur.com/jz3h0sU.jpeg',
    is_admin: false
  },
  {
    username: 'maria_santos',
    display_name: 'Maria dos Santos',
    full_name: 'Maria Aparecida dos Santos',
    bio: 'Professora | Mãe de 3 | Amo viajar e conhecer lugares novos',
    location: 'Belo Horizonte, MG',
    email: 'maria@exemplo.com',
    photo_url: 'https://i.imgur.com/sqkVr3P.jpeg',
    is_admin: false
  },
  {
    username: 'carlos_drummer',
    display_name: 'Carlos Baterista',
    full_name: 'Carlos Eduardo Silva',
    bio: 'Músico profissional | Baterista da banda Noite Eterna',
    location: 'Porto Alegre, RS',
    email: 'carlos@exemplo.com',
    photo_url: 'https://i.imgur.com/7cWSmXV.jpeg',
    is_admin: false
  },
  {
    username: 'ana_designer',
    display_name: 'Ana Paula Design',
    full_name: 'Ana Paula Oliveira',
    bio: 'Designer Gráfica | Freelancer | Especialista em identidade visual',
    location: 'Curitiba, PR',
    email: 'ana@exemplo.com',
    photo_url: 'https://i.imgur.com/08nZpcn.jpeg',
    is_admin: false
  },
  {
    username: 'pedro_chef',
    display_name: 'Pedro Culinarista',
    full_name: 'Pedro Henrique Santos',
    bio: 'Chef de cozinha | Especialista em culinária brasileira',
    location: 'Salvador, BA',
    email: 'pedro@exemplo.com',
    photo_url: 'https://i.imgur.com/1qJb2Qw.jpeg',
    is_admin: false
  },
  {
    username: 'fernanda_yoga',
    display_name: 'Fernanda Zen',
    full_name: 'Fernanda Costa Lima',
    bio: 'Instrutora de Yoga | Vida saudável | Namastê 🧘‍♀️',
    location: 'Brasília, DF',
    email: 'fernanda@exemplo.com',
    photo_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
    is_admin: false
  }
]

// Dados de comunidades brasileiras realistas
const BRAZILIAN_COMMUNITIES = [
  {
    name: 'Eu amo o Brasil',
    description: 'Para brasileiros que amam nosso país e nossa cultura',
    category: 'Países e Regiões',
    is_public: true,
    member_count: 1250
  },
  {
    name: 'Nostalgia dos Anos 90',
    description: 'Lembranças da melhor década! Música, TV, jogos e muito mais',
    category: 'Entretenimento',
    is_public: true,
    member_count: 890
  },
  {
    name: 'Programadores Brasil',
    description: 'Comunidade para desenvolvedores brasileiros',
    category: 'Profissões',
    is_public: true,
    member_count: 567
  },
  {
    name: 'Música Brasileira',
    description: 'MPB, Sertanejo, Forró, Rock Nacional e muito mais',
    category: 'Música',
    is_public: true,
    member_count: 2100
  },
  {
    name: 'Culinária Caseira',
    description: 'Receitas da vovó e pratos especiais do Brasil',
    category: 'Culinária',
    is_public: true,
    member_count: 345
  },
  {
    name: 'São Paulo Capital',
    description: 'Para quem mora ou ama a terra da garoa',
    category: 'Cidades',
    is_public: true,
    member_count: 1800
  }
]

// Posts realistas para o feed
const REALISTIC_POSTS = [
  {
    content: 'Acabei de ouvir essa música incrível! Alguém mais conhece? 🎵',
    likes_count: 12,
    comments_count: 5
  },
  {
    content: 'Que saudade dos tempos de escola... quem mais sente isso? 📚',
    likes_count: 28,
    comments_count: 15
  },
  {
    content: 'Compartilhando essa foto linda que tirei ontem na praia! 🌊',
    likes_count: 45,
    comments_count: 8
  },
  {
    content: 'Alguém tem dica de um bom livro para ler? Estou precisando de novas leituras 📖',
    likes_count: 7,
    comments_count: 12
  },
  {
    content: 'Que delícia esse domingo em família! Almoço da vovó é sagrado 🍽️',
    likes_count: 33,
    comments_count: 6
  }
]

// Fotos realistas para álbuns
const REALISTIC_PHOTOS = [
  {
    imgur_url: 'https://i.imgur.com/QUyGh3B.jpg',
    title: 'Paisagem do interior',
    description: 'Vista incrível da fazenda do meu tio',
    tags: ['natureza', 'paisagem', 'campo', 'brasil']
  },
  {
    imgur_url: 'https://i.imgur.com/8KQZ7YB.jpeg',
    title: 'Por do sol na praia',
    description: 'Momento mágico em Copacabana',
    tags: ['praia', 'por-do-sol', 'rio', 'copacabana']
  },
  {
    imgur_url: 'https://i.imgur.com/jz3h0sU.jpeg',
    title: 'Churrasco em família',
    description: 'Domingo perfeito com a galera',
    tags: ['churrasco', 'família', 'domingo', 'amigos']
  },
  {
    imgur_url: 'https://i.imgur.com/sqkVr3P.jpeg',
    title: 'Festa junina',
    description: 'Arraial da escola, tradição que não pode faltar',
    tags: ['festa-junina', 'tradição', 'brasil', 'escola']
  },
  {
    imgur_url: 'https://i.imgur.com/7cWSmXV.jpeg',
    title: 'Show da banda',
    description: 'Apresentação no festival de música local',
    tags: ['música', 'show', 'banda', 'rock']
  }
]

// Estações de rádio brasileiras
const BRAZILIAN_RADIO_STATIONS = [
  {
    name: 'Rádio Tatuapé FM',
    genre: 'MPB',
    frequency: '105.7',
    city: 'São Paulo',
    stream_url: 'https://mytuner-radio.com/radio/radio-tatuape-fm',
    logo_url: 'https://static2.mytuner.mobi/media/tvos_radios/7h/7hmwejpwgz.jpg'
  },
  {
    name: 'Jovem Pan FM',
    genre: 'Pop/Rock',
    frequency: '100.9',
    city: 'São Paulo',
    stream_url: 'https://mytuner-radio.com/radio/jovem-pan-fm',
    logo_url: 'https://static2.mytuner.mobi/media/tvos_radios/f6/f6wrqpysfz.png'
  },
  {
    name: 'Antena 1',
    genre: 'Clássicos',
    frequency: '94.7',
    city: 'São Paulo',
    stream_url: 'https://mytuner-radio.com/radio/antena-1',
    logo_url: 'https://static2.mytuner.mobi/media/tvos_radios/k5/k5mn4qxtzc.jpg'
  },
  {
    name: 'Mix FM',
    genre: 'Dance/Pop',
    frequency: '106.3',
    city: 'São Paulo', 
    stream_url: 'https://mytuner-radio.com/radio/mix-fm',
    logo_url: 'https://static2.mytuner.mobi/media/tvos_radios/r2/r2bgvhnxfc.jpg'
  }
]

async function seedDatabase() {
  loadDotenvLocal()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('⚠️ Credenciais do Supabase não encontradas, usando backup local...')
    await seedLocalBackup()
    return
  }

  console.log('🚀 Iniciando seed completo do banco de dados Orkut BR...')

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  try {
    // 1. Seed de usuários
    console.log('👥 Populando usuários...')
    await seedUsers(supabase)
    
    // 2. Seed de comunidades
    console.log('🏘️ Populando comunidades...')
    await seedCommunities(supabase)
    
    // 3. Seed de fotos
    console.log('📸 Populando fotos e álbuns...')
    await seedPhotos(supabase)
    
    // 4. Seed de posts
    console.log('📝 Populando posts e atividades...')
    await seedPosts(supabase)
    
    // 5. Seed de rádios
    console.log('📻 Populando estações de rádio...')
    await seedRadios(supabase)
    
    // 6. Seed de interações (curtidas, comentários, amizades)
    console.log('❤️ Populando interações sociais...')
    await seedInteractions(supabase)

    console.log('✅ Seed completo finalizado com sucesso!')
    console.log('📊 Estatísticas finais:')
    await printStats(supabase)

  } catch (error) {
    console.error('❌ Erro durante o seed:', error)
    console.log('🔄 Tentando usar backup local...')
    await seedLocalBackup()
  }
}

async function seedUsers(supabase) {
  const usersData = BRAZILIAN_USERS.map(user => ({
    id: `user_${user.username}_${Date.now()}`,
    username: user.username,
    display_name: user.display_name,
    full_name: user.full_name,
    bio: user.bio,
    location: user.location,
    email: user.email,
    photo_url: user.photo_url,
    is_verified: user.is_admin,
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }))

  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(usersData, { onConflict: 'username' })
      .select('id, username, display_name')

    if (error) throw error
    console.log(`✅ ${data.length} usuários criados`)
    return data
  } catch (error) {
    console.warn('⚠️ Erro ao criar usuários no Supabase:', error.message)
    return []
  }
}

async function seedCommunities(supabase) {
  // Buscar usuário admin para ser dono das comunidades
  const { data: adminUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', 'juliocamp')
    .single()

  const ownerUserId = adminUser?.id || 'system_user'

  const communitiesData = BRAZILIAN_COMMUNITIES.map(community => ({
    name: community.name,
    description: community.description,
    category: community.category,
    is_public: community.is_public,
    owner_id: ownerUserId,
    member_count: community.member_count,
    created_at: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString()
  }))

  try {
    const { data, error } = await supabase
      .from('communities')
      .upsert(communitiesData, { onConflict: 'name' })
      .select('id, name, member_count')

    if (error) throw error
    console.log(`✅ ${data.length} comunidades criadas`)
    return data
  } catch (error) {
    console.warn('⚠️ Erro ao criar comunidades:', error.message)
    return []
  }
}

async function seedPhotos(supabase) {
  // Buscar usuários para associar fotos
  const { data: users } = await supabase
    .from('profiles')
    .select('id, username, display_name, photo_url')
    .limit(20)

  if (!users || users.length === 0) {
    console.warn('⚠️ Nenhum usuário encontrado para associar fotos')
    return []
  }

  const photosData = []

  // Criar fotos para cada usuário
  users.forEach(user => {
    const userPhotos = REALISTIC_PHOTOS.map((photo, index) => ({
      user_id: user.id,
      imgur_link: photo.imgur_url,
      titulo: `${photo.title} - ${user.display_name}`,
      descricao: photo.description,
      likes_count: Math.floor(Math.random() * 50) + 1,
      comments_count: Math.floor(Math.random() * 20),
      views_count: Math.floor(Math.random() * 200) + 10,
      is_public: true,
      created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }))
    photosData.push(...userPhotos.slice(0, Math.floor(Math.random() * 3) + 1)) // 1-3 fotos por usuário
  })

  try {
    const { data, error } = await supabase
      .from('album_fotos')
      .insert(photosData)
      .select('id, titulo, user_id')

    if (error) throw error
    console.log(`✅ ${data.length} fotos criadas`)
    return data
  } catch (error) {
    console.warn('⚠️ Erro ao criar fotos:', error.message)
    return []
  }
}

async function seedPosts(supabase) {
  // Buscar usuários e comunidades
  const { data: users } = await supabase.from('profiles').select('id, username').limit(10)
  const { data: communities } = await supabase.from('communities').select('id, name').limit(5)

  if (!users || users.length === 0) return []

  const postsData = []

  // Posts gerais no feed
  users.forEach(user => {
    const userPosts = REALISTIC_POSTS.slice(0, Math.floor(Math.random() * 3) + 1).map(post => ({
      author_id: user.id,
      content: post.content,
      likes_count: post.likes_count + Math.floor(Math.random() * 20),
      comments_count: post.comments_count + Math.floor(Math.random() * 10),
      is_public: true,
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }))
    postsData.push(...userPosts)
  })

  // Posts em comunidades
  if (communities && communities.length > 0) {
    communities.forEach(community => {
      const communityPosts = users.slice(0, 3).map(user => ({
        community_id: community.id,
        author_id: user.id,
        content: `Pessoal da ${community.name}, como vocês estão? Vamos interagir mais!`,
        likes_count: Math.floor(Math.random() * 15) + 1,
        comments_count: Math.floor(Math.random() * 8) + 1,
        created_at: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }))
      postsData.push(...communityPosts)
    })
  }

  try {
    // Posts gerais
    const generalPosts = postsData.filter(p => !p.community_id)
    if (generalPosts.length > 0) {
      const { data: generalData, error: generalError } = await supabase
        .from('posts')
        .insert(generalPosts)
        .select('id')

      if (generalError) throw generalError
      console.log(`✅ ${generalData.length} posts gerais criados`)
    }

    // Posts de comunidades
    const communityPosts = postsData.filter(p => p.community_id)
    if (communityPosts.length > 0) {
      const { data: communityData, error: communityError } = await supabase
        .from('community_posts')
        .insert(communityPosts)
        .select('id')

      if (communityError) throw communityError
      console.log(`✅ ${communityData.length} posts de comunidades criados`)
    }

    return true
  } catch (error) {
    console.warn('⚠️ Erro ao criar posts:', error.message)
    return false
  }
}

async function seedRadios(supabase) {
  const radiosData = BRAZILIAN_RADIO_STATIONS.map(radio => ({
    name: radio.name,
    genre: radio.genre,
    frequency: radio.frequency,
    city: radio.city,
    stream_url: radio.stream_url,
    logo_url: radio.logo_url,
    is_active: true,
    listener_count: Math.floor(Math.random() * 1000) + 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))

  try {
    const { data, error } = await supabase
      .from('radio_stations')
      .upsert(radiosData, { onConflict: 'name' })
      .select('id, name, genre')

    if (error) throw error
    console.log(`✅ ${data.length} estações de rádio criadas`)
    return data
  } catch (error) {
    console.warn('⚠️ Erro ao criar rádios (tabela pode não existir):', error.message)
    return []
  }
}

async function seedInteractions(supabase) {
  // Buscar dados existentes para criar interações
  const { data: users } = await supabase.from('profiles').select('id').limit(10)
  const { data: photos } = await supabase.from('album_fotos').select('id, user_id').limit(20)

  if (!users || users.length === 0) return

  // Criar algumas amizades
  const friendships = []
  for (let i = 0; i < users.length - 1; i++) {
    for (let j = i + 1; j < users.length && j < i + 4; j++) { // Máximo 3 amizades por usuário
      friendships.push({
        user_id: users[i].id,
        friend_id: users[j].id,
        status: 'accepted',
        created_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
    }
  }

  try {
    if (friendships.length > 0) {
      const { data, error } = await supabase
        .from('friendships')
        .insert(friendships)
        .select('id')

      if (error) throw error
      console.log(`✅ ${data.length} amizades criadas`)
    }

    console.log('✅ Interações sociais populadas')
  } catch (error) {
    console.warn('⚠️ Erro ao criar interações (tabelas podem não existir):', error.message)
  }
}

async function seedLocalBackup() {
  console.log('💾 Criando backup local completo...')
  
  const backupData = {
    users: BRAZILIAN_USERS.map(user => ({
      ...user,
      id: `user_${user.username}_${Date.now()}`,
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    })),
    communities: BRAZILIAN_COMMUNITIES.map(community => ({
      ...community,
      id: `community_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString()
    })),
    photos: REALISTIC_PHOTOS.map(photo => ({
      ...photo,
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: BRAZILIAN_USERS[Math.floor(Math.random() * BRAZILIAN_USERS.length)].username,
      likes_count: Math.floor(Math.random() * 50) + 1,
      comments_count: Math.floor(Math.random() * 20),
      views_count: Math.floor(Math.random() * 200) + 10,
      created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
    })),
    posts: REALISTIC_POSTS.map(post => ({
      ...post,
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      author_id: BRAZILIAN_USERS[Math.floor(Math.random() * BRAZILIAN_USERS.length)].username,
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    })),
    radios: BRAZILIAN_RADIO_STATIONS.map(radio => ({
      ...radio,
      id: `radio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      listener_count: Math.floor(Math.random() * 1000) + 100
    })),
    generated_at: new Date().toISOString(),
    total_users: BRAZILIAN_USERS.length,
    total_communities: BRAZILIAN_COMMUNITIES.length,
    total_photos: REALISTIC_PHOTOS.length,
    total_posts: REALISTIC_POSTS.length,
    total_radios: BRAZILIAN_RADIO_STATIONS.length
  }

  // Salvar backup completo
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }

  fs.writeFileSync(
    path.join(dataDir, 'complete-database-backup.json'),
    JSON.stringify(backupData, null, 2)
  )

  // Manter compatibilidade com photos-feed.json existente
  const photosBackup = backupData.photos.map(photo => ({
    ...photo,
    imgur_url: photo.imgur_url,
    imgur_id: photo.imgur_url.split('/').pop().split('.')[0],
    imgur_page_url: photo.imgur_url,
    width: 1200,
    height: 800,
    file_size: 245760,
    user_name: BRAZILIAN_USERS.find(u => u.username === photo.user_id)?.display_name || 'Usuário',
    user_avatar: BRAZILIAN_USERS.find(u => u.username === photo.user_id)?.photo_url || null,
    is_public: true,
    mime_type: 'image/jpeg',
    original_filename: photo.title + '.jpg'
  }))

  fs.writeFileSync(
    path.join(dataDir, 'photos-feed.json'),
    JSON.stringify(photosBackup, null, 2)
  )

  console.log('✅ Backup local criado em data/')
  console.log(`📊 Dados gerados: ${backupData.total_users} usuários, ${backupData.total_communities} comunidades, ${backupData.total_photos} fotos, ${backupData.total_posts} posts`)
}

async function printStats(supabase) {
  try {
    const [usersResult, communitiesResult, photosResult] = await Promise.allSettled([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('communities').select('*', { count: 'exact', head: true }),
      supabase.from('album_fotos').select('*', { count: 'exact', head: true })
    ])

    const userCount = usersResult.status === 'fulfilled' ? usersResult.value.count : 0
    const communityCount = communitiesResult.status === 'fulfilled' ? communitiesResult.value.count : 0
    const photoCount = photosResult.status === 'fulfilled' ? photosResult.value.count : 0

    console.log(`👥 Usuários: ${userCount}`)
    console.log(`🏘️ Comunidades: ${communityCount}`)
    console.log(`📸 Fotos: ${photoCount}`)
  } catch (error) {
    console.log('📊 Estatísticas não disponíveis')
  }
}

// Executar seed
if (require.main === module) {
  seedDatabase().catch(console.error)
}

module.exports = { seedDatabase, seedLocalBackup }
