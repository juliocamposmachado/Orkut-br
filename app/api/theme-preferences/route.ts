import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticação
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar preferências do usuário
    const { data: preferences, error } = await supabase
      .from('user_theme_preferences')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (error) {
      // Se não existir, criar com padrões
      const defaultPreferences = {
        user_id: session.user.id,
        color_theme: 'purple',
        visual_theme: {
          id: 'orkut-classic',
          name: 'Orkut Clássico',
          description: 'O visual nostálgico do Orkut original',
          colorTheme: 'purple',
          wallpaper: {
            type: 'gradient',
            value: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
            name: 'Gradiente Orkut'
          }
        },
        wallpaper: {
          type: 'gradient',
          value: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
          name: 'Gradiente Orkut'
        },
        is_dark_mode: false
      }

      const { data: newPreferences, error: createError } = await supabase
        .from('user_theme_preferences')
        .insert([defaultPreferences])
        .select()
        .single()

      if (createError) {
        console.error('Erro ao criar preferências:', createError)
        return NextResponse.json({ error: 'Erro ao criar preferências' }, { status: 500 })
      }

      return NextResponse.json(newPreferences)
    }

    return NextResponse.json(preferences)

  } catch (error) {
    console.error('Erro na API de preferências:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticação
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      color_theme, 
      visual_theme, 
      wallpaper, 
      is_dark_mode, 
      custom_css 
    } = body

    // Validar dados obrigatórios
    if (!color_theme || !visual_theme || !wallpaper) {
      return NextResponse.json({ 
        error: 'Dados obrigatórios: color_theme, visual_theme, wallpaper' 
      }, { status: 400 })
    }

    // Atualizar ou inserir preferências
    const { data: preferences, error } = await supabase
      .from('user_theme_preferences')
      .upsert({
        user_id: session.user.id,
        color_theme,
        visual_theme,
        wallpaper,
        is_dark_mode: is_dark_mode || false,
        custom_css: custom_css || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar preferências:', error)
      return NextResponse.json({ error: 'Erro ao salvar preferências' }, { status: 500 })
    }

    console.log(`🎨 Preferências de tema salvas para usuário ${session.user.id}:`, {
      color_theme,
      visual_theme: visual_theme.name,
      wallpaper: wallpaper.name
    })

    return NextResponse.json(preferences)

  } catch (error) {
    console.error('Erro na API de preferências:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticação
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    
    if (authError || !session?.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Resetar para padrões
    const defaultPreferences = {
      user_id: session.user.id,
      color_theme: 'purple',
      visual_theme: {
        id: 'orkut-classic',
        name: 'Orkut Clássico',
        description: 'O visual nostálgico do Orkut original',
        colorTheme: 'purple',
        wallpaper: {
          type: 'gradient',
          value: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
          name: 'Gradiente Orkut'
        }
      },
      wallpaper: {
        type: 'gradient',
        value: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
        name: 'Gradiente Orkut'
      },
      is_dark_mode: false,
      custom_css: null,
      updated_at: new Date().toISOString()
    }

    const { data: preferences, error } = await supabase
      .from('user_theme_preferences')
      .upsert(defaultPreferences, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      console.error('Erro ao resetar preferências:', error)
      return NextResponse.json({ error: 'Erro ao resetar preferências' }, { status: 500 })
    }

    console.log(`🔄 Preferências resetadas para usuário ${session.user.id}`)

    return NextResponse.json(preferences)

  } catch (error) {
    console.error('Erro na API de preferências:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
