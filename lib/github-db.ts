import { Octokit } from "@octokit/rest"

// Configuração do GitHub
const GITHUB_TOKEN = process.env.GITHUB_TOKEN
const REPO_OWNER = process.env.GITHUB_REPO_OWNER || 'seu-usuario'
const REPO_NAME = process.env.GITHUB_REPO_NAME || 'orkut-data'

// Cliente GitHub
const octokit = GITHUB_TOKEN ? new Octokit({
  auth: GITHUB_TOKEN,
}) : null

// Interface para Comunidade
export interface Community {
  id: string
  name: string
  description: string
  category: string
  photo_url?: string
  members_count: number
  owner: string
  visibility: 'public' | 'private' | 'restricted'
  join_approval_required: boolean
  rules?: string
  welcome_message?: string
  tags?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Sistema GitHub Database para comunidades
 * Usa GitHub Issues como "registros" de banco de dados
 */
export class GitHubDB {
  private static instance: GitHubDB
  
  static getInstance(): GitHubDB {
    if (!this.instance) {
      this.instance = new GitHubDB()
    }
    return this.instance
  }

  /**
   * Verifica se o GitHub está configurado
   */
  isConfigured(): boolean {
    return !!(GITHUB_TOKEN && octokit)
  }

  /**
   * Lista todas as comunidades (GitHub Issues com label "community")
   */
  async getCommunities(filters?: {
    category?: string
    search?: string
    limit?: number
    offset?: number
  }): Promise<{ communities: Community[], total: number }> {
    if (!this.isConfigured()) {
      throw new Error('GitHub não configurado')
    }

    try {
      const { data: issues } = await octokit!.rest.issues.listForRepo({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        labels: 'community',
        state: 'open',
        sort: 'created',
        direction: 'desc',
        per_page: filters?.limit || 50,
        page: Math.floor((filters?.offset || 0) / (filters?.limit || 50)) + 1
      })

      let communities: Community[] = issues.map(issue => {
        try {
          // Parse do JSON no corpo da issue
          const communityData = JSON.parse(issue.body || '{}')
          
          return {
            id: issue.number.toString(),
            name: issue.title,
            description: communityData.description || '',
            category: communityData.category || 'Geral',
            photo_url: communityData.photo_url,
            members_count: communityData.members_count || 1,
            owner: issue.user?.login || 'system',
            visibility: communityData.visibility || 'public',
            join_approval_required: communityData.join_approval_required || false,
            rules: communityData.rules,
            welcome_message: communityData.welcome_message,
            tags: communityData.tags || [],
            is_active: true,
            created_at: issue.created_at,
            updated_at: issue.updated_at
          }
        } catch (parseError) {
          console.warn(`Erro ao parsear comunidade ${issue.number}:`, parseError)
          return null
        }
      }).filter(Boolean) as Community[]

      // Filtrar por categoria
      if (filters?.category && filters.category !== 'Todos') {
        communities = communities.filter(c => c.category === filters.category)
      }

      // Filtrar por busca
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase()
        communities = communities.filter(c =>
          c.name.toLowerCase().includes(searchTerm) ||
          c.description.toLowerCase().includes(searchTerm)
        )
      }

      return {
        communities,
        total: communities.length
      }

    } catch (error) {
      console.error('Erro ao buscar comunidades no GitHub:', error)
      throw new Error('Erro ao buscar comunidades')
    }
  }

  /**
   * Busca uma comunidade específica pelo ID
   */
  async getCommunity(id: string): Promise<Community | null> {
    if (!this.isConfigured()) {
      throw new Error('GitHub não configurado')
    }

    try {
      const { data: issue } = await octokit!.rest.issues.get({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        issue_number: parseInt(id)
      })

      if (!issue.labels?.some(label => 
        typeof label === 'string' ? label === 'community' : label.name === 'community'
      )) {
        return null
      }

      const communityData = JSON.parse(issue.body || '{}')
      
      return {
        id: issue.number.toString(),
        name: issue.title,
        description: communityData.description || '',
        category: communityData.category || 'Geral',
        photo_url: communityData.photo_url,
        members_count: communityData.members_count || 1,
        owner: issue.user?.login || 'system',
        visibility: communityData.visibility || 'public',
        join_approval_required: communityData.join_approval_required || false,
        rules: communityData.rules,
        welcome_message: communityData.welcome_message,
        tags: communityData.tags || [],
        is_active: true,
        created_at: issue.created_at,
        updated_at: issue.updated_at
      }

    } catch (error) {
      console.error('Erro ao buscar comunidade no GitHub:', error)
      return null
    }
  }

  /**
   * Cria uma nova comunidade (GitHub Issue)
   */
  async createCommunity(community: Omit<Community, 'id' | 'created_at' | 'updated_at'>): Promise<Community> {
    if (!this.isConfigured()) {
      throw new Error('GitHub não configurado')
    }

    try {
      // Preparar dados da comunidade (sem ID e timestamps)
      const { name, ...communityData } = community
      
      const body = JSON.stringify({
        ...communityData,
        created_by: 'orkut-system',
        created_at_local: new Date().toISOString()
      }, null, 2)

      const { data: issue } = await octokit!.rest.issues.create({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        title: name,
        body,
        labels: ['community', `category:${community.category}`]
      })

      return {
        ...community,
        id: issue.number.toString(),
        created_at: issue.created_at,
        updated_at: issue.updated_at
      }

    } catch (error) {
      console.error('Erro ao criar comunidade no GitHub:', error)
      throw new Error('Erro ao criar comunidade')
    }
  }

  /**
   * Atualiza uma comunidade existente
   */
  async updateCommunity(id: string, updates: Partial<Community>): Promise<Community | null> {
    if (!this.isConfigured()) {
      throw new Error('GitHub não configurado')
    }

    try {
      // Buscar a comunidade atual
      const current = await this.getCommunity(id)
      if (!current) {
        throw new Error('Comunidade não encontrada')
      }

      // Mesclar atualizações
      const updated = { ...current, ...updates }
      const { name, id: _, created_at, updated_at, ...communityData } = updated

      const body = JSON.stringify({
        ...communityData,
        updated_by: 'orkut-system',
        updated_at_local: new Date().toISOString()
      }, null, 2)

      const { data: issue } = await octokit!.rest.issues.update({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        issue_number: parseInt(id),
        title: name,
        body,
        labels: ['community', `category:${updated.category}`]
      })

      return {
        ...updated,
        updated_at: issue.updated_at
      }

    } catch (error) {
      console.error('Erro ao atualizar comunidade no GitHub:', error)
      throw new Error('Erro ao atualizar comunidade')
    }
  }

  /**
   * Remove uma comunidade (fecha a issue)
   */
  async deleteCommunity(id: string): Promise<boolean> {
    if (!this.isConfigured()) {
      throw new Error('GitHub não configurado')
    }

    try {
      await octokit!.rest.issues.update({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        issue_number: parseInt(id),
        state: 'closed'
      })

      return true

    } catch (error) {
      console.error('Erro ao remover comunidade no GitHub:', error)
      return false
    }
  }

  /**
   * Inicializar repositório com estrutura básica
   */
  async initializeRepository(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false
    }

    try {
      // Verificar se o repo existe
      await octokit!.rest.repos.get({
        owner: REPO_OWNER,
        repo: REPO_NAME
      })

      // Criar arquivo README se não existir
      try {
        await octokit!.rest.repos.getContent({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: 'README.md'
        })
      } catch {
        // README não existe, criar
        await octokit!.rest.repos.createOrUpdateFileContents({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: 'README.md',
          message: 'Initialize Orkut Data Repository',
          content: Buffer.from(`# Orkut Data Repository

Este repositório serve como banco de dados para o Orkut BR usando GitHub Issues.

## Estrutura

- **Issues com label "community"**: Representam comunidades
- **Issues com label "user"**: Representam perfis de usuários
- **Issues com label "post"**: Representam posts/conteúdo

## Automatização

Este repositório é gerenciado automaticamente pelo sistema Orkut BR.
`).toString('base64')
        })
      }

      return true

    } catch (error) {
      console.error('Erro ao inicializar repositório:', error)
      return false
    }
  }

  /**
   * Dados demo para fallback quando GitHub não está configurado
   */
  getDemoCommunities(): { communities: Community[], total: number } {
    const demoCommunities: Community[] = [
      {
        id: 'demo-1',
        name: 'Nostalgia dos Anos 2000',
        description: 'Revivendo os melhores momentos da era de ouro da internet brasileira!',
        category: 'Nostalgia',
        photo_url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop',
        members_count: 15420,
        owner: 'demo-user-1',
        visibility: 'public',
        join_approval_required: false,
        is_active: true,
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:30:00Z'
      },
      {
        id: 'demo-2',
        name: 'Desenvolvedores JavaScript',
        description: 'Comunidade para discutir as últimas tendências em JavaScript, React, Node.js e muito mais.',
        category: 'Tecnologia',
        photo_url: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=300&fit=crop',
        members_count: 8965,
        owner: 'demo-user-2',
        visibility: 'public',
        join_approval_required: false,
        is_active: true,
        created_at: '2024-02-01T14:20:00Z',
        updated_at: '2024-02-01T14:20:00Z'
      },
      {
        id: 'demo-3',
        name: 'Amantes da Pizza',
        description: 'Para quem não resiste a uma boa pizza! Compartilhe receitas, dicas e as melhores pizzarias.',
        category: 'Culinária',
        photo_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop',
        members_count: 12340,
        owner: 'demo-user-3',
        visibility: 'public',
        join_approval_required: false,
        is_active: true,
        created_at: '2024-01-28T16:45:00Z',
        updated_at: '2024-01-28T16:45:00Z'
      }
    ]

    return { communities: demoCommunities, total: demoCommunities.length }
  }
}

// Instância singleton
export const githubDB = GitHubDB.getInstance()
