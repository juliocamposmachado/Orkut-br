import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase com service role para inserir dados
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

// Fotos de exemplo do Imgur (domínio público/creative commons)
const examplePhotos = [
  {
    imgur_id: 'dQw4w9WgXcQ',
    imgur_url: 'https://i.imgur.com/dQw4w9WgXcQ.jpg',
    imgur_page_url: 'https://imgur.com/dQw4w9WgXcQ',
    title: 'Paisagem Montanha Dourada',
    description: 'Uma bela vista das montanhas durante o pôr do sol, com tons dourados refletindo na neblina.',
    tags: ['paisagem', 'montanha', 'por-do-sol', 'natureza', 'dourado'],
    width: 1920,
    height: 1080,
    file_size: 245760,
    user_name: 'NaturaFoto',
    user_avatar: 'https://i.imgur.com/avatar1.jpg'
  },
  {
    imgur_id: 'a1B2c3D4e5F',
    imgur_url: 'https://i.imgur.com/a1B2c3D4e5F.jpg',
    imgur_page_url: 'https://imgur.com/a1B2c3D4e5F',
    title: 'Gato Fofo na Janela',
    description: 'Meu gatinho observando a chuva pela janela. Que momento mais fofo! 🐱',
    tags: ['gato', 'pets', 'fofo', 'janela', 'chuva'],
    width: 1024,
    height: 768,
    file_size: 156234,
    user_name: 'PetLover',
    user_avatar: 'https://i.imgur.com/avatar2.jpg'
  },
  {
    imgur_id: 'x9Y8z7W6v5U',
    imgur_url: 'https://i.imgur.com/x9Y8z7W6v5U.jpg',
    imgur_page_url: 'https://imgur.com/x9Y8z7W6v5U',
    title: 'Arte Digital Abstrata',
    description: 'Experimentando com cores e formas geométricas. O que vocês acham?',
    tags: ['arte', 'digital', 'abstrato', 'cores', 'geometria'],
    width: 1200,
    height: 1200,
    file_size: 187456,
    user_name: 'ArtistaCriativo',
    user_avatar: 'https://i.imgur.com/avatar3.jpg'
  },
  {
    imgur_id: 'p9O8i7U6y5T',
    imgur_url: 'https://i.imgur.com/p9O8i7U6y5T.jpg',
    imgur_page_url: 'https://imgur.com/p9O8i7U6y5T',
    title: 'Café da Manhã Perfeito',
    description: 'Preparei esse café da manhã especial para o domingo. Pão caseiro, geleia de morango e um café fresquinho!',
    tags: ['comida', 'cafe-da-manha', 'caseiro', 'domingo', 'delicioso'],
    width: 1080,
    height: 1350,
    file_size: 234567,
    user_name: 'ChefCaseiro',
    user_avatar: 'https://i.imgur.com/avatar4.jpg'
  },
  {
    imgur_id: 'q1W2e3R4t5Y',
    imgur_url: 'https://i.imgur.com/q1W2e3R4t5Y.jpg',
    imgur_page_url: 'https://imgur.com/q1W2e3R4t5Y',
    title: 'Praia Paradisíaca',
    description: 'Férias na praia mais linda que já visitei! Águas cristalinas e areia branca.',
    tags: ['praia', 'ferias', 'paraiso', 'mar', 'areia-branca'],
    width: 1600,
    height: 900,
    file_size: 298765,
    user_name: 'Viajante',
    user_avatar: 'https://i.imgur.com/avatar5.jpg'
  },
  {
    imgur_id: 'z9X8c7V6b5N',
    imgur_url: 'https://i.imgur.com/z9X8c7V6b5N.jpg',
    imgur_page_url: 'https://imgur.com/z9X8c7V6b5N',
    title: 'Flores do Jardim',
    description: 'As flores do meu jardim finalmente brotaram! Primavera chegando com toda sua beleza.',
    tags: ['flores', 'jardim', 'primavera', 'natureza', 'colorido'],
    width: 1024,
    height: 1024,
    file_size: 198432,
    user_name: 'JardineiroAmador',
    user_avatar: 'https://i.imgur.com/avatar6.jpg'
  },
  {
    imgur_id: 'm5N4b3V2c1X',
    imgur_url: 'https://i.imgur.com/m5N4b3V2c1X.jpg',
    imgur_page_url: 'https://imgur.com/m5N4b3V2c1X',
    title: 'Skyline Noturno',
    description: 'A cidade nunca dorme! Vista incrível do centro da cidade à noite.',
    tags: ['cidade', 'noite', 'skyline', 'urbano', 'luzes'],
    width: 1920,
    height: 1280,
    file_size: 367890,
    user_name: 'FotografoCidade',
    user_avatar: 'https://i.imgur.com/avatar7.jpg'
  },
  {
    imgur_id: 'l4K3j2H1g9F',
    imgur_url: 'https://i.imgur.com/l4K3j2H1g9F.jpg',
    imgur_page_url: 'https://imgur.com/l4K3j2H1g9F',
    title: 'Cachorro na Praia',
    description: 'Meu golden retriever se divertindo na praia! Olha só essa cara de felicidade 🐕',
    tags: ['cachorro', 'praia', 'golden', 'feliz', 'pets'],
    width: 1080,
    height: 1080,
    file_size: 234123,
    user_name: 'DogLover',
    user_avatar: 'https://i.imgur.com/avatar8.jpg'
  }
]

/**
 * GET /api/photos/seed-examples - Informações sobre a API
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'API Seed Examples - Orkut BR',
    description: 'Popula o banco de dados com fotos de exemplo para demonstrar o sistema',
    methods: ['POST'],
    examples_count: examplePhotos.length,
    status: 'online',
    timestamp: new Date().toISOString()
  })
}

/**
 * POST /api/photos/seed-examples - Popular com fotos de exemplo
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('🌱 [Seed Examples] Iniciando população do banco com fotos de exemplo')

  try {
    // Verificar se é ambiente de desenvolvimento (opcional)
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (!isDevelopment) {
      console.log('⚠️ [Seed Examples] Executando em produção - procedendo com cuidado')
    }

    // Verificar se já existem fotos no banco
    const { count: existingPhotos } = await supabase
      .from('photos_feed')
      .select('*', { count: 'exact', head: true })

    console.log(`📊 [Seed Examples] ${existingPhotos} fotos já existem no banco`)

    // Criar um usuário do sistema para as fotos de exemplo
    const systemUser = {
      id: '00000000-0000-0000-0000-000000000000', // UUID fixo para o sistema
      email: 'system@orkut-br.com',
      name: 'Sistema Orkut'
    }

    const photoFeedData = examplePhotos.map((photo, index) => ({
      user_id: systemUser.id,
      user_name: photo.user_name,
      user_avatar: photo.user_avatar,
      
      // Dados da imagem
      imgur_id: photo.imgur_id,
      imgur_url: photo.imgur_url,
      imgur_page_url: photo.imgur_page_url,
      imgur_delete_url: null, // Não temos delete URL para exemplos
      
      // Metadados da imagem
      width: photo.width,
      height: photo.height,
      file_size: photo.file_size,
      mime_type: 'image/jpeg',
      original_filename: `exemplo_${index + 1}.jpg`,
      
      // Dados do post
      title: photo.title,
      description: photo.description,
      tags: photo.tags,
      is_public: true,
      
      // Contadores simulados
      likes_count: Math.floor(Math.random() * 50) + 1, // 1-50 likes
      comments_count: Math.floor(Math.random() * 20), // 0-19 comments
      shares_count: Math.floor(Math.random() * 10), // 0-9 shares
      views_count: Math.floor(Math.random() * 200) + 10, // 10-209 views
      
      // Timestamps variados (últimos 30 dias)
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }))

    console.log('💾 [Seed Examples] Inserindo fotos de exemplo no banco...')

    // Inserir todas as fotos de exemplo
    const { data: insertedPhotos, error: insertError } = await supabase
      .from('photos_feed')
      .insert(photoFeedData)
      .select('id, title, user_name')

    if (insertError) {
      console.error('❌ [Seed Examples] Erro ao inserir fotos:', insertError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao inserir fotos no banco de dados',
        details: insertError.message
      }, { status: 500 })
    }

    const processingTime = Date.now() - startTime

    console.log('✅ [Seed Examples] Fotos inseridas com sucesso:', {
      inserted_count: insertedPhotos?.length || 0,
      total_in_db: (existingPhotos || 0) + (insertedPhotos?.length || 0),
      processingTime: `${processingTime}ms`
    })

    return NextResponse.json({
      success: true,
      message: 'Fotos de exemplo inseridas com sucesso!',
      data: {
        inserted_count: insertedPhotos?.length || 0,
        total_photos_in_db: (existingPhotos || 0) + (insertedPhotos?.length || 0),
        examples: insertedPhotos?.map(photo => ({
          id: photo.id,
          title: photo.title,
          user_name: photo.user_name
        })) || [],
        processing_time_ms: processingTime
      }
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    console.error(`❌ [Seed Examples] Erro após ${processingTime}ms:`, errorMessage)
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: errorMessage,
      processing_time_ms: processingTime
    }, { status: 500 })
  }
}

/**
 * DELETE /api/photos/seed-examples - Limpar fotos de exemplo
 */
export async function DELETE(request: NextRequest) {
  const startTime = Date.now()
  console.log('🗑️ [Seed Examples] Limpando fotos de exemplo do banco')

  try {
    // Deletar fotos do usuário sistema
    const { error: deleteError } = await supabase
      .from('photos_feed')
      .delete()
      .eq('user_id', '00000000-0000-0000-0000-000000000000')

    if (deleteError) {
      throw new Error(deleteError.message)
    }

    const processingTime = Date.now() - startTime

    console.log('✅ [Seed Examples] Fotos de exemplo removidas com sucesso')

    return NextResponse.json({
      success: true,
      message: 'Fotos de exemplo removidas com sucesso',
      processing_time_ms: processingTime
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    console.error(`❌ [Seed Examples] Erro ao limpar:`, errorMessage)
    
    return NextResponse.json({
      success: false,
      error: 'Erro ao limpar fotos de exemplo',
      details: errorMessage,
      processing_time_ms: processingTime
    }, { status: 500 })
  }
}

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
