import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') // 'given' ou 'received'

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    let query = supabase
      .from('user_classifications')
      .select(`
        *,
        from_profile:profiles!user_classifications_from_user_id_fkey(id, username, display_name, photo_url),
        to_profile:profiles!user_classifications_to_user_id_fkey(id, username, display_name, photo_url)
      `)

    // Filtrar por tipo de consulta
    if (type === 'given') {
      query = query.eq('from_user_id', userId)
    } else if (type === 'received') {
      query = query.eq('to_user_id', userId)
    } else {
      // Se não especificado, buscar ambos
      query = query.or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar classificações:', error)
      return NextResponse.json({ error: 'Erro ao buscar classificações' }, { status: 500 })
    }

    return NextResponse.json({ classifications: data })
  } catch (error) {
    console.error('Erro na API de classificações:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to_user_id, classification_type, level } = body

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Validações
    if (!to_user_id || !classification_type || !level) {
      return NextResponse.json({ 
        error: 'Campos obrigatórios: to_user_id, classification_type, level' 
      }, { status: 400 })
    }

    if (!['fan', 'trustworthy', 'cool', 'sexy'].includes(classification_type)) {
      return NextResponse.json({ 
        error: 'Tipo de classificação inválido' 
      }, { status: 400 })
    }

    if (![1, 2, 3].includes(level)) {
      return NextResponse.json({ 
        error: 'Nível deve ser 1, 2 ou 3' 
      }, { status: 400 })
    }

    // Não pode classificar a si mesmo
    if (user.id === to_user_id) {
      return NextResponse.json({ 
        error: 'Você não pode classificar a si mesmo' 
      }, { status: 400 })
    }

    // Inserir ou atualizar classificação
    const { data, error } = await supabase
      .from('user_classifications')
      .upsert({
        from_user_id: user.id,
        to_user_id,
        classification_type,
        level,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'from_user_id,to_user_id,classification_type'
      })
      .select()

    if (error) {
      console.error('Erro ao salvar classificação:', error)
      return NextResponse.json({ error: 'Erro ao salvar classificação' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      classification: data?.[0],
      message: 'Classificação salva com sucesso!'
    })
  } catch (error) {
    console.error('Erro na API de classificações:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const to_user_id = searchParams.get('to_user_id')
    const classification_type = searchParams.get('classification_type')

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    if (!to_user_id || !classification_type) {
      return NextResponse.json({ 
        error: 'Parâmetros obrigatórios: to_user_id, classification_type' 
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_classifications')
      .delete()
      .eq('from_user_id', user.id)
      .eq('to_user_id', to_user_id)
      .eq('classification_type', classification_type)

    if (error) {
      console.error('Erro ao remover classificação:', error)
      return NextResponse.json({ error: 'Erro ao remover classificação' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Classificação removida com sucesso!'
    })
  } catch (error) {
    console.error('Erro na API de classificações:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
