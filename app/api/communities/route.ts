import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cliente Supabase para servidor
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Verificar se as variáveis estão configuradas
if (!supabaseUrl || !supabaseServiceKey || 
    supabaseUrl.includes('placeholder') || 
    supabaseUrl.includes('your_') ||
    !supabaseUrl.startsWith('https://')) {
  console.warn('Supabase não configurado para communities API')
}

// Criar cliente apenas se configurado corretamente
const supabase = (supabaseUrl && supabaseServiceKey &&
                 !supabaseUrl.includes('placeholder') &&
                 !supabaseUrl.includes('your_') &&
                 supabaseUrl.startsWith('https://'))
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

// Dados demo para fallback
const demoCommunities = [
  {
    id: 1,
    name: 'Nostalgia dos Anos 2000',
    description: 'Revivendo os melhores momentos da era de ouro da internet brasileira!',
    category: 'Nostalgia',
    photo_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop',
    members_count: 15420,
    owner: 'demo-user-1',
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    name: 'Desenvolvedores JavaScript',
    description: 'Comunidade para discutir as últimas tendências em JavaScript, React, Node.js e muito mais.',
    category: 'Tecnologia',
    photo_url: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop',
    members_count: 8965,
    owner: 'demo-user-2',
    created_at: '2024-02-01T14:20:00Z'
  },
  {
    id: 3,
    name: 'Amantes da Pizza',
    description: 'Para quem não resiste a uma boa pizza! Compartilhe receitas, dicas e as melhores pizzarias.',
    category: 'Culinária',
    photo_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
    members_count: 12340,
    owner: 'demo-user-3',
    created_at: '2024-01-28T16:45:00Z'
  }
]

/**
 * GET /api/communities - Lista comunidades com filtros
 */
export async function GET(request: NextRequest) {
  try {
    // Se Supabase não estiver configurado, retornar dados demo
    if (!supabase) {
      console.warn('Supabase não configurado - retornando dados demo para comunidades')
      
      const { searchParams } = new URL(request.url)
      const category = searchParams.get('category')
      const search = searchParams.get('search')
      
      let filteredCommunities = [...demoCommunities]
      
      // Filtrar por categoria
      if (category && category !== 'Todos') {
        filteredCommunities = filteredCommunities.filter(c => c.category === category)
      }
      
      // Filtrar por busca
      if (search) {
        const searchTerm = search.toLowerCase()
        filteredCommunities = filteredCommunities.filter(c =>
          c.name.toLowerCase().includes(searchTerm) ||
          c.description.toLowerCase().includes(searchTerm)
        )
      }
      
      return NextResponse.json({
        success: true,
        communities: filteredCommunities,
        total: filteredCommunities.length,
        demo: true,
        timestamp: new Date().toISOString()
      })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Construir query com novos campos
    let query = supabase
      .from('communities')
      .select(`
        id,
        name,
        description,
        category,
        photo_url,
        members_count,
        owner,
        visibility,
        join_approval_required,
        max_members,
        rules,
        welcome_message,
        tags,
        is_active,
        created_at,
        updated_at
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('members_count', { ascending: false })
      .range(offset, offset + limit - 1)

    // Aplicar filtros
    if (category && category !== 'Todos') {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Erro ao buscar comunidades:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar comunidades', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      communities: data || [],
      total: count || 0,
      pagination: {
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na API de comunidades:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/communities - Criar nova comunidade
 */
export async function POST(request: NextRequest) {
  try {
    // Se Supabase não estiver configurado, retornar erro informativo
    if (!supabase) {
      return NextResponse.json({ 
        success: false,
        error: 'Funcionalidade de criação de comunidades não disponível no momento',
        message: 'O servidor não está configurado para criar comunidades. Entre em contato com o administrador.',
        demo: true 
      }, { status: 503 })
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ 
        error: 'Autenticação necessária para criar comunidades' 
      }, { status: 401 })
    }

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Token de autenticação inválido' 
      }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, category, privacy, rules, photo_url } = body

    console.log('📝 Dados recebidos para criação de comunidade:', {
      name, description, category, privacy, rules, photo_url,
      user_id: user.id
    })

    // Validações
    if (!name || !description || !category) {
      return NextResponse.json({
        error: 'Nome, descrição e categoria são obrigatórios'
      }, { status: 400 })
    }

    if (name.length > 50) {
      return NextResponse.json({
        error: 'Nome da comunidade muito longo (máximo 50 caracteres)'
      }, { status: 400 })
    }

    if (description.length > 500) {
      return NextResponse.json({
        error: 'Descrição muito longa (máximo 500 caracteres)'
      }, { status: 400 })
    }

    // Verificar se já existe uma comunidade com o mesmo nome
    const { data: existingCommunity, error: checkError } = await supabase
      .from('communities')
      .select('id')
      .ilike('name', name.trim())
      .maybeSingle()

    console.log('🔍 Verificação de nome existente:', { existingCommunity, checkError })

    if (existingCommunity) {
      return NextResponse.json({
        error: 'Já existe uma comunidade com esse nome'
      }, { status: 409 })
    }

    // Criar a comunidade com novos campos
    const communityData = {
      name: name.trim(),
      description: description.trim(),
      category,
      photo_url: photo_url || `https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop&q=80&auto=format`,
      owner: user.id,
      members_count: 1,
      visibility: privacy || 'public',
      join_approval_required: privacy === 'restricted' || privacy === 'private',
      rules: rules || 'Seja respeitoso e mantenha as discussões relevantes ao tema da comunidade.',
      welcome_message: `Bem-vindo à comunidade ${name.trim()}!`,
      tags: [],
      is_active: true
    }
    
    // For debugging: try to set owner after creation if it fails
    console.log('🔐 Using service role key for creation with owner field')
    
    console.log('💾 Inserindo comunidade no banco:', communityData)
    
    const { data: newCommunity, error: createError } = await supabase
      .from('communities')
      .insert(communityData)
      .select()
      .single()

    if (createError) {
      console.error('❌ Erro ao criar comunidade:', createError)
      console.error('❌ Dados que causaram erro:', communityData)
      return NextResponse.json({
        error: 'Erro ao criar comunidade',
        details: createError.message
      }, { status: 500 })
    }
    
    console.log('✅ Comunidade criada com sucesso:', newCommunity)

    // Verificar se o usuário tem um perfil na tabela profiles
    console.log('🔍 Verificando perfil do usuário para adicionar como membro...')
    
    let profileId = user.id
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      
      if (profileError || !profileData) {
        console.warn('⚠️ Profile não encontrado para user.id, tentando buscar perfil relacionado')
        // Se não encontrou, talvez precise criar o profile ou usar outro método
        profileId = user.id // Manter o user.id como fallback
      } else {
        profileId = profileData.id
        console.log('✅ Profile válido encontrado:', profileId)
      }
    } catch (profileCheckError) {
      console.warn('⚠️ Erro ao verificar profile:', profileCheckError)
      profileId = user.id
    }

    // Adicionar o criador como membro da comunidade
    const memberData = {
      community_id: newCommunity.id,
      profile_id: profileId,
      role: 'admin',
      joined_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      posts_count: 0,
      invited_by: null,
      is_muted: false,
      is_banned: false
    }
    
    console.log('👤 Adicionando criador como membro:', memberData)
    
    try {
      const { data: memberResult, error: memberError } = await supabase
        .from('community_members')
        .insert(memberData)
        .select()
        .single()
        
      if (memberError) {
        console.warn('⚠️ Erro ao adicionar criador como membro:', memberError)
        console.warn('⚠️ Dados que causaram o erro:', memberData)
        // Não falhar a criação da comunidade por causa disso
      } else {
        console.log('✅ Criador adicionado como membro com sucesso:', memberResult)
      }
    } catch (memberError) {
      console.warn('⚠️ Exceção ao adicionar criador como membro:', memberError)
      // Não falhar a criação da comunidade por causa disso
    }

    return NextResponse.json({
      success: true,
      community: newCommunity,
      message: `Comunidade "${name}" criada com sucesso!`,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na criação de comunidade:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
