import { NextRequest, NextResponse } from 'next/server'
import { parseString } from 'xml2js'

export interface TrendingTopic {
  title: string
  traffic: string
  description?: string
  url?: string
  image?: string
  category?: string
  publishedAt?: string
}

export async function GET() {
  try {
    // Buscar RSS feed do Google Trends Brasil
    const response = await fetch('https://trends.google.com.br/trending/rss?geo=BR', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Erro ao buscar RSS: ${response.status}`)
    }

    const xmlData = await response.text()
    
    // Parse do XML
    const trends: TrendingTopic[] = await new Promise((resolve, reject) => {
      parseString(xmlData, (err, result) => {
        if (err) {
          reject(err)
          return
        }

        try {
          const items = result.rss?.channel?.[0]?.item || []
          
          const parsedTrends: TrendingTopic[] = items.slice(0, 10).map((item: any) => {
            const title = item.title?.[0] || 'Sem título'
            const description = item.description?.[0] || ''
            const link = item.link?.[0] || ''
            const pubDate = item.pubDate?.[0] || ''
            
            // Extrair informações do título (formato: "termo - volume de busca")
            const titleParts = title.split(' - ')
            const term = titleParts[0] || title
            const traffic = titleParts[1] || '100+ pesquisas'

            // Tentar extrair imagem da descrição HTML
            let imageUrl = ''
            const imgMatch = description.match(/<img[^>]+src="([^"]+)"/i)
            if (imgMatch) {
              imageUrl = imgMatch[1]
            }

            return {
              title: term,
              traffic: traffic,
              description: description.replace(/<[^>]*>/g, '').substring(0, 150) + '...',
              url: link,
              image: imageUrl,
              publishedAt: pubDate
            }
          })

          resolve(parsedTrends)
        } catch (parseError) {
          reject(parseError)
        }
      })
    })

    return NextResponse.json({
      success: true,
      trends,
      updatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao buscar Google Trends:', error)
    
    // Retornar dados mockados em caso de erro
    const mockTrends: TrendingTopic[] = [
      {
        title: 'Novela Dona de Mim',
        traffic: '100 mil+ pesquisas',
        description: 'Resumo e novidades do capítulo da novela Dona de Mim...',
        publishedAt: new Date().toISOString()
      },
      {
        title: 'Lollapalooza 2025',
        traffic: '50 mil+ pesquisas', 
        description: 'Lineup e informações sobre o festival de música...',
        publishedAt: new Date().toISOString()
      },
      {
        title: 'Fluminense x Bahia',
        traffic: '200 mil+ pesquisas',
        description: 'Resultado e análise da partida de futebol...',
        publishedAt: new Date().toISOString()
      }
    ]

    return NextResponse.json({
      success: false,
      trends: mockTrends,
      error: 'Usando dados de fallback',
      updatedAt: new Date().toISOString()
    })
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Método não permitido' }, { status: 405 })
}
