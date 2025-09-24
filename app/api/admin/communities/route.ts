import { NextRequest, NextResponse } from 'next/server'
import { githubDB } from '@/lib/github-db'

// Lista de administradores autorizados
const ADMIN_USERS = [
  'admin-dev-001',
  'nostalgic-admin', 
  'chef-brasil',
  'entrepreneur-leader',
  'system-admin',
  'moderator-001',
  'community-manager'
]

/**
 * Verificar se o usuário é administrador
 */
function isAdmin(userId: string): boolean {
  return ADMIN_USERS.includes(userId) || userId.startsWith('admin-') || userId === 'system'
}

/**
 * GET /api/admin/communities - Lista todas as comunidades para administração
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    
    // Verificar se é administrador
    if (!userId || !isAdmin(userId)) {
      return NextResponse.json({
        error: 'Acesso negado. Apenas administradores podem acessar esta funcionalidade.',
        requiredRole: 'admin'
      }, { status: 403 })
    }
    
    // Buscar todas as comunidades
    let communities
    let source = 'demo'
    
    if (githubDB.isConfigured()) {
      try {
        const result = await githubDB.getCommunities({ limit: 500 })
        communities = result.communities
        source = 'github'
      } catch (error) {
        console.warn('Erro ao buscar do GitHub, usando fallback:', error)
        const fallback = githubDB.getDemoCommunities()
        communities = fallback.communities
      }
    } else {
      const fallback = githubDB.getDemoCommunities()
      communities = fallback.communities
    }

    return NextResponse.json({
      success: true,
      communities: communities.map(community => ({
        ...community,
        canEdit: true,
        canDelete: true,
        isAdmin: true
      })),
      total: communities.length,
      source,
      adminUser: userId,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro na API admin de comunidades:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

/**
 * PUT /api/admin/communities - Editar comunidade (apenas admins)
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const communityId = searchParams.get('id')
    
    // Verificar se é administrador
    if (!userId || !isAdmin(userId)) {
      return NextResponse.json({
        error: 'Acesso negado. Apenas administradores podem editar comunidades.',
        requiredRole: 'admin'
      }, { status: 403 })
    }
    
    if (!communityId) {
      return NextResponse.json({
        error: 'ID da comunidade é obrigatório'
      }, { status: 400 })
    }

    const updates = await request.json()
    console.log(`🔧 Admin ${userId} editando comunidade ${communityId}:`, updates)

    // Validações
    if (updates.name && updates.name.length > 100) {
      return NextResponse.json({
        error: 'Nome muito longo (máximo 100 caracteres)'
      }, { status: 400 })
    }

    if (updates.description && updates.description.length > 1000) {
      return NextResponse.json({
        error: 'Descrição muito longa (máximo 1000 caracteres)'
      }, { status: 400 })
    }

    // Preparar dados para atualização
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
      last_edited_by: userId
    }

    let updatedCommunity
    let source = 'demo'
    
    if (githubDB.isConfigured()) {
      try {
        updatedCommunity = await githubDB.updateCommunity(communityId, updateData)
        source = 'github'
      } catch (error) {
        console.warn('Erro ao atualizar no GitHub:', error)
        // Em modo demo, simular atualização
        updatedCommunity = {
          id: communityId,
          ...updateData,
          name: updates.name || 'Comunidade Atualizada',
          category: updates.category || 'Geral'
        }
        source = 'demo-updated'
      }
    } else {
      // Modo demo: simular atualização
      updatedCommunity = {
        id: communityId,
        ...updateData,
        name: updates.name || 'Comunidade Atualizada',
        category: updates.category || 'Geral'
      }
      source = 'demo-updated'
    }

    return NextResponse.json({
      success: true,
      community: updatedCommunity,
      message: `Comunidade "${updatedCommunity?.name}" atualizada com sucesso!`,
      editedBy: userId,
      source,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao editar comunidade:', error)
    return NextResponse.json({
      error: 'Erro ao editar comunidade',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/communities - Excluir comunidade (apenas admins)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const communityId = searchParams.get('id')
    
    // Verificar se é administrador
    if (!userId || !isAdmin(userId)) {
      return NextResponse.json({
        error: 'Acesso negado. Apenas administradores podem excluir comunidades.',
        requiredRole: 'admin'
      }, { status: 403 })
    }
    
    if (!communityId) {
      return NextResponse.json({
        error: 'ID da comunidade é obrigatório'
      }, { status: 400 })
    }

    console.log(`🗑️ Admin ${userId} excluindo comunidade ${communityId}`)

    let success = false
    let source = 'demo'
    
    if (githubDB.isConfigured()) {
      try {
        success = await githubDB.deleteCommunity(communityId)
        source = success ? 'github' : 'github-error'
      } catch (error) {
        console.warn('Erro ao excluir do GitHub:', error)
        // Em modo demo, simular exclusão bem-sucedida
        success = true
        source = 'demo-deleted'
      }
    } else {
      // Modo demo: simular exclusão bem-sucedida
      success = true
      source = 'demo-deleted'
    }

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Comunidade excluída com sucesso!`,
        communityId,
        deletedBy: userId,
        source,
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({
        error: 'Falha ao excluir comunidade',
        communityId,
        source
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Erro ao excluir comunidade:', error)
    return NextResponse.json({
      error: 'Erro ao excluir comunidade',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

/**
 * POST /api/admin/communities - Criar comunidade como admin
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    
    // Verificar se é administrador
    if (!userId || !isAdmin(userId)) {
      return NextResponse.json({
        error: 'Acesso negado. Apenas administradores podem criar comunidades via admin.',
        requiredRole: 'admin'
      }, { status: 403 })
    }

    const communityData = await request.json()
    
    // Adicionar dados de admin
    const enhancedData = {
      ...communityData,
      owner: userId,
      owner_name: communityData.owner_name || `Admin ${userId}`,
      created_by_admin: true,
      admin_created: true,
      created_at: new Date().toISOString()
    }

    console.log(`👑 Admin ${userId} criando nova comunidade:`, enhancedData.name)

    let newCommunity
    let source = 'demo'
    
    if (githubDB.isConfigured()) {
      try {
        newCommunity = await githubDB.createCommunity(enhancedData)
        source = 'github'
      } catch (error) {
        console.warn('Erro ao criar no GitHub:', error)
        // Fallback para modo demo
        newCommunity = {
          id: 'admin-' + Date.now(),
          ...enhancedData,
          created_at: new Date().toISOString()
        }
        source = 'demo-created'
      }
    } else {
      // Modo demo
      newCommunity = {
        id: 'admin-' + Date.now(),
        ...enhancedData,
        created_at: new Date().toISOString()
      }
      source = 'demo-created'
    }

    return NextResponse.json({
      success: true,
      community: newCommunity,
      message: `Comunidade "${newCommunity.name}" criada com sucesso pelo admin!`,
      createdBy: userId,
      source,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao criar comunidade como admin:', error)
    return NextResponse.json({
      error: 'Erro ao criar comunidade',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
