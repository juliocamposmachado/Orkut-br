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
   * Baseado nas 11 comunidades criadas no Supabase
   */
  getDemoCommunities(): { communities: Community[], total: number } {
    const demoCommunities: Community[] = [
      {
        id: '1',
        name: 'NÃO É CULPA NOSSA! 🤷‍♂️',
        description: '🎭 A primeira comunidade oficial do Novo Orkut! Aqui documentamos bugs, fails épicos e culpamos quem realmente tem culpa (spoiler: nunca somos nós).',
        category: 'Tecnologia',
        photo_url: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg',
        members_count: 1,
        owner: 'orkut-system',
        visibility: 'public',
        join_approval_required: false,
        is_active: true,
        created_at: '2025-01-24T01:00:00Z',
        updated_at: '2025-01-24T01:00:00Z'
      },
      {
        id: '12',
        name: 'Bugs do Orkut',
        description: '🐛 Reporte e discuta bugs encontrados no Orkut BR. Ajude-nos a melhorar a plataforma reportando problemas, sugerindo correções e acompanhando o desenvolvimento. Comunidade oficial para feedback técnico.',
        category: 'Tecnologia',
        photo_url: 'https://images.pexels.com/photos/4164418/pexels-photo-4164418.jpeg',
        members_count: 156,
        owner: 'orkut-system',
        visibility: 'public',
        join_approval_required: false,
        is_active: true,
        created_at: '2025-01-24T01:05:00Z',
        updated_at: '2025-01-24T01:05:00Z'
      },
      {
        id: '13',
        name: 'Orkut Novo',
        description: '🚀 Comunidade oficial do Orkut BR! Novidades, atualizações, recursos em desenvolvimento e discussões sobre o futuro da plataforma. Seja parte da evolução da nossa rede social!',
        category: 'Tecnologia',
        photo_url: 'https://images.pexels.com/photos/3861958/pexels-photo-3861958.jpeg',
        members_count: 342,
        owner: 'orkut-system',
        visibility: 'public',
        join_approval_required: false,
        is_active: true,
        created_at: '2025-01-24T01:06:00Z',
        updated_at: '2025-01-24T01:06:00Z'
      },
      {
        id: '14',
        name: 'Desenvolvedores',
        description: '👨‍💻 Comunidade para desenvolvedores de software. Compartilhe conhecimentos, discuta tecnologias, troque experiências sobre programação, frameworks e melhores práticas de desenvolvimento.',
        category: 'Tecnologia',
        photo_url: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg',
        members_count: 289,
        owner: 'dev-community',
        visibility: 'public',
        join_approval_required: false,
        is_active: true,
        created_at: '2025-01-24T01:07:00Z',
        updated_at: '2025-01-24T01:07:00Z'
      },
      {
        id: '15',
        name: 'Networking Profissional',
        description: '🤝 Expanda sua rede de contatos profissionais! Conecte-se com profissionais da sua área, compartilhe oportunidades de trabalho, troque experiências de carreira e desenvolva relacionamentos profissionais.',
        category: 'Trabalho',
        photo_url: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg',
        members_count: 234,
        owner: 'professional-network',
        visibility: 'public',
        join_approval_required: false,
        is_active: true,
        created_at: '2025-01-24T01:08:00Z',
        updated_at: '2025-01-24T01:08:00Z'
      },
      {
        id: '16',
        name: 'Cursos Online',
        description: '📚 Compartilhe e descubra cursos online gratuitos e pagos. Discuta plataformas de ensino, recomende cursos, tire dúvidas e ajude outros a encontrar o melhor conteúdo educacional.',
        category: 'Educação',
        photo_url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg',
        members_count: 187,
        owner: 'education-hub',
        visibility: 'public',
        join_approval_required: false,
        is_active: true,
        created_at: '2025-01-24T01:09:00Z',
        updated_at: '2025-01-24T01:09:00Z'
      },
      {
        id: '17',
        name: 'Empreendedorismo',
        description: '💼 Para empreendedores e aspirantes a empresários. Compartilhe ideias de negócios, discuta estratégias, encontre parceiros, aprenda sobre gestão empresarial e marketing digital.',
        category: 'Negócios',
        photo_url: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg',
        members_count: 198,
        owner: 'entrepreneur-club',
        visibility: 'public',
        join_approval_required: false,
        is_active: true,
        created_at: '2025-01-24T01:10:00Z',
        updated_at: '2025-01-24T01:10:00Z'
      },
      {
        id: '18',
        name: 'Vagas de Emprego',
        description: '💼 Central de oportunidades profissionais! Divulgue vagas, procure emprego, compartilhe seu perfil profissional e conecte-se com recrutadores. Sua carreira começa aqui!',
        category: 'Carreira',
        photo_url: 'https://images.pexels.com/photos/3184639/pexels-photo-3184639.jpeg',
        members_count: 421,
        owner: 'jobs-center',
        visibility: 'public',
        join_approval_required: false,
        is_active: true,
        created_at: '2025-01-24T01:11:00Z',
        updated_at: '2025-01-24T01:11:00Z'
      },
      {
        id: '19',
        name: 'Startups Brasil',
        description: '🚀 Ecossistema de startups brasileiras. Discuta inovação, encontre cofundadores, compartilhe experiências sobre investimentos, pitch de negócios e crescimento de empresas.',
        category: 'Negócios',
        photo_url: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg',
        members_count: 156,
        owner: 'startup-ecosystem',
        visibility: 'public',
        join_approval_required: false,
        is_active: true,
        created_at: '2025-01-24T01:12:00Z',
        updated_at: '2025-01-24T01:12:00Z'
      },
      {
        id: '20',
        name: 'Freelancers Brasil',
        description: '💻 Comunidade para profissionais autônomos e freelancers. Troque experiências sobre trabalho remoto, precificação, captação de clientes e gestão de projetos.',
        category: 'Trabalho',
        photo_url: 'https://images.pexels.com/photos/3184432/pexels-photo-3184432.jpeg',
        members_count: 267,
        owner: 'freelance-community',
        visibility: 'public',
        join_approval_required: false,
        is_active: true,
        created_at: '2025-01-24T01:13:00Z',
        updated_at: '2025-01-24T01:13:00Z'
      },
      {
        id: '21',
        name: 'Educação Online',
        description: '🎓 Futuro da educação digital. Professores, alunos e entusiastas discutem metodologias de ensino online, ferramentas educacionais e transformação digital na educação.',
        category: 'Educação',
        photo_url: 'https://images.pexels.com/photos/3184287/pexels-photo-3184287.jpeg',
        members_count: 145,
        owner: 'digital-education',
        visibility: 'public',
        join_approval_required: false,
        is_active: true,
        created_at: '2025-01-24T01:14:00Z',
        updated_at: '2025-01-24T01:14:00Z'
      }
    ]

    return { communities: demoCommunities, total: demoCommunities.length }
  }
}

// Instância singleton
export const githubDB = GitHubDB.getInstance()
