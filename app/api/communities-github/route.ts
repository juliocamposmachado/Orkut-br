import { NextRequest, NextResponse } from 'next/server'
import { githubDB } from '@/lib/github-db'

// Importar sistema GitHub Files (mesmo padrão dos posts)
import https from 'https'

// Configurações do GitHub
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const GITHUB_OWNER = process.env.GITHUB_REPO_OWNER || process.env.GITHUB_OWNER
const GITHUB_REPO = process.env.GITHUB_REPO_NAME || process.env.GITHUB_REPO
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main'

/**
 * Sistema GitHub Files para comunidades (seguindo o padrão dos posts)
 */
class GitHubCommunitiesAPI {
  static isConfigured() {
    return !!(GITHUB_TOKEN && GITHUB_OWNER && GITHUB_REPO)
  }

  static async githubRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        port: 443,
        path,
        method,
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'User-Agent': 'Orkut-GitHub-Communities/1.0',
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28'
        }
      }

      if (data) {
        const jsonData = JSON.stringify(data)
        options.headers['Content-Type'] = 'application/json'
        options.headers['Content-Length'] = Buffer.byteLength(jsonData)
      }

      const req = https.request(options, (res) => {
        let body = ''
        res.on('data', (chunk) => body += chunk)
        res.on('end', () => {
          try {
            const response = body ? JSON.parse(body) : {}
            if (res.statusCode >= 400) {
              reject(new Error(`GitHub API Error: ${res.statusCode} - ${response.message || body}`))
            } else {
              resolve(response)
            }
          } catch (e) {
            reject(new Error(`JSON Parse Error: ${e.message}`))
          }
        })
      })

      req.on('error', reject)

      if (data) {
        req.write(JSON.stringify(data))
      }
      req.end()
    })
  }

  static async getFileContent(filePath) {
    try {
      const response = await this.githubRequest(
        `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`
      )
      return {
        content: Buffer.from(response.content, 'base64').toString('utf8'),
        sha: response.sha
      }
    } catch (error) {
      if (error.message.includes('404')) {
        return null
      }
      throw error
    }
  }

  static async getCommunities({ category, search, limit = 50 } = {}) {
    try {
      console.log('📡 Buscando comunidades do GitHub...')
      const indexContent = await this.getFileContent('communities/index.json')
      
      if (!indexContent) {
        return { communities: [], total: 0 }
      }

      const index = JSON.parse(indexContent.content)
      let filteredCommunities = [...index.communities]

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

      // Aplicar limite
      const limitedCommunities = filteredCommunities.slice(0, limit)
      console.log(`✅ Comunidades do GitHub: ${limitedCommunities.length}`)

      return {
        communities: limitedCommunities,
        total: index.totalCommunities || 0
      }
    } catch (error) {
      console.error('❌ Erro ao buscar comunidades do GitHub:', error)
      throw error
    }
  }
}

/**
 * GET /api/communities-github - Lista comunidades usando GitHub como BD
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Verificar se GitHub está configurado
    if (!githubDB.isConfigured()) {
      console.warn('GitHub não configurado - retornando dados demo para comunidades')
      
      const { communities, total } = githubDB.getDemoCommunities()
      
      // Aplicar filtros nos dados demo
      let filteredCommunities = [...communities]
      
      if (category && category !== 'Todos') {
        filteredCommunities = filteredCommunities.filter(c => c.category === category)
      }
      
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
        source: 'github-fallback',
        timestamp: new Date().toISOString()
      })
    }

    // Buscar comunidades no GitHub
    const result = await githubDB.getCommunities({
      category,
      search,
      limit,
      offset
    })

    return NextResponse.json({
      success: true,
      communities: result.communities,
      total: result.total,
      pagination: {
        limit,
        offset,
        hasMore: result.total > offset + limit
      },
      source: 'github',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na API de comunidades GitHub:', error)
    
    // Em caso de erro, retornar dados demo
    const { communities, total } = githubDB.getDemoCommunities()
    
    return NextResponse.json({
      success: true,
      communities,
      total,
      demo: true,
      source: 'github-error-fallback',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    })
  }
}

/**
 * POST /api/communities-github - Criar nova comunidade no GitHub
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar se GitHub está configurado
    if (!githubDB.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'GitHub não configurado',
        message: 'Para criar comunidades, é necessário configurar GITHUB_TOKEN, GITHUB_REPO_OWNER e GITHUB_REPO_NAME',
        demo: true,
        community: {
          id: 'demo-' + Date.now(),
          name: 'Comunidade Demo',
          description: 'Esta comunidade seria criada no GitHub se estivesse configurado',
          category: 'Demo',
          created_at: new Date().toISOString()
        }
      }, { status: 503 })
    }

    const body = await request.json()
    const { name, description, category, privacy, rules, photo_url, owner } = body

    console.log('📝 Dados recebidos para criação de comunidade no GitHub:', {
      name, description, category, privacy, rules, photo_url, owner
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

    // Preparar dados da comunidade
    const communityData = {
      name: name.trim(),
      description: description.trim(),
      category,
      photo_url: photo_url || `https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop&q=80&auto=format`,
      members_count: 1,
      owner: owner || 'github-user',
      visibility: (privacy || 'public') as 'public' | 'private' | 'restricted',
      join_approval_required: privacy === 'restricted' || privacy === 'private',
      rules: rules || 'Seja respeitoso e mantenha as discussões relevantes ao tema da comunidade.',
      welcome_message: `Bem-vindo à comunidade ${name.trim()}!`,
      tags: [],
      is_active: true
    }

    // Criar comunidade no GitHub
    const newCommunity = await githubDB.createCommunity(communityData)

    console.log('✅ Comunidade criada no GitHub com sucesso:', newCommunity)

    return NextResponse.json({
      success: true,
      community: newCommunity,
      message: `Comunidade "${name}" criada com sucesso no GitHub!`,
      source: 'github',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na criação de comunidade no GitHub:', error)
    
    return NextResponse.json({
      error: 'Erro ao criar comunidade no GitHub',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      source: 'github'
    }, { status: 500 })
  }
}

/**
 * PUT /api/communities-github/[id] - Atualizar comunidade no GitHub
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        error: 'ID da comunidade é obrigatório'
      }, { status: 400 })
    }

    if (!githubDB.isConfigured()) {
      return NextResponse.json({
        error: 'GitHub não configurado'
      }, { status: 503 })
    }

    const updates = await request.json()
    const updatedCommunity = await githubDB.updateCommunity(id, updates)

    if (!updatedCommunity) {
      return NextResponse.json({
        error: 'Comunidade não encontrada'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      community: updatedCommunity,
      message: 'Comunidade atualizada com sucesso!',
      source: 'github',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao atualizar comunidade no GitHub:', error)
    
    return NextResponse.json({
      error: 'Erro ao atualizar comunidade',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/communities-github/[id] - Remover comunidade no GitHub
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        error: 'ID da comunidade é obrigatório'
      }, { status: 400 })
    }

    if (!githubDB.isConfigured()) {
      return NextResponse.json({
        error: 'GitHub não configurado'
      }, { status: 503 })
    }

    const deleted = await githubDB.deleteCommunity(id)

    if (!deleted) {
      return NextResponse.json({
        error: 'Erro ao remover comunidade'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Comunidade removida com sucesso!',
      source: 'github',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao remover comunidade no GitHub:', error)
    
    return NextResponse.json({
      error: 'Erro ao remover comunidade',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
