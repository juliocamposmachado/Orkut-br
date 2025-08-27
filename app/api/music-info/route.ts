import { NextRequest, NextResponse } from 'next/server'
import { musicInfoService } from '@/lib/music-info-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const artistName = searchParams.get('artist')
    const quick = searchParams.get('quick') === 'true'

    if (!artistName) {
      return NextResponse.json(
        { error: 'Parâmetro "artist" é obrigatório' },
        { status: 400 }
      )
    }

    console.log(`🎵 API: Buscando informações para "${artistName}" (quick: ${quick})`)

    if (quick) {
      // Busca rápida para uso no card do DJ
      const result = await musicInfoService.quickArtistSearch(artistName)
      return NextResponse.json({
        success: true,
        data: result,
        artist: artistName,
        searchType: 'quick'
      })
    } else {
      // Busca completa
      const result = await musicInfoService.searchArtistInfo(artistName)
      return NextResponse.json({
        ...result,
        artist: artistName,
        searchType: 'complete'
      })
    }

  } catch (error) {
    console.error('❌ Erro na API music-info:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { artists } = body

    if (!Array.isArray(artists) || artists.length === 0) {
      return NextResponse.json(
        { error: 'Array "artists" é obrigatório' },
        { status: 400 }
      )
    }

    console.log(`🎵 API: Busca em lote para ${artists.length} artistas`)

    // Buscar informações para múltiplos artistas
    const results = await Promise.allSettled(
      artists.map(artist => musicInfoService.quickArtistSearch(artist))
    )

    const processedResults = results.map((result, index) => ({
      artist: artists[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }))

    return NextResponse.json({
      success: true,
      results: processedResults,
      total: artists.length,
      successful: processedResults.filter(r => r.success).length
    })

  } catch (error) {
    console.error('❌ Erro na API music-info POST:', error)
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}
