import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface CommunityAuthOptions {
  communityId: number
  userId: string | undefined
}

export function useCommunityAuth({ communityId, userId }: CommunityAuthOptions) {
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const getValidToken = useCallback(async (): Promise<string | null> => {
    try {
      setIsAuthenticating(true)
      
      // Tentar obter a sessão atual
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Erro ao obter sessão:', error)
        return null
      }

      if (!session?.access_token) {
        console.warn('Nenhum token de acesso encontrado')
        return null
      }

      // Verificar se o token está válido tentando fazer uma requisição de teste
      const testResponse = await fetch('/api/auth/refresh-session', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (testResponse.ok) {
        console.log('✅ Token válido confirmado')
        return session.access_token
      }

      // Token pode estar expirado, tentar renovar
      console.log('🔄 Token pode estar expirado, tentando renovar...')
      
      if (session.refresh_token) {
        const refreshResponse = await fetch('/api/auth/refresh-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            refresh_token: session.refresh_token
          })
        })

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json()
          console.log('✅ Token renovado com sucesso')
          return refreshData.session?.access_token || null
        }
      }

      console.error('❌ Não foi possível obter token válido')
      return null

    } catch (error) {
      console.error('Erro ao validar token:', error)
      return null
    } finally {
      setIsAuthenticating(false)
    }
  }, [])

  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!userId) {
      throw new Error('Usuário não autenticado')
    }

    const token = await getValidToken()
    
    if (!token) {
      throw new Error('Token de autenticação inválido ou expirado. Faça login novamente.')
    }

    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    })
  }, [userId, getValidToken])

  const joinCommunity = useCallback(async () => {
    try {
      if (!userId) {
        toast.error('Você precisa estar logado para entrar na comunidade')
        return { success: false, error: 'Não autenticado' }
      }

      toast.info('Entrando na comunidade...')

      const response = await authenticatedFetch(`/api/communities/${communityId}/members`, {
        method: 'POST'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Erro HTTP ${response.status}`)
      }

      if (result.success) {
        toast.success(result.message || 'Você entrou na comunidade!')
        return { success: true, data: result }
      } else {
        throw new Error(result.error || 'Erro desconhecido ao entrar na comunidade')
      }

    } catch (error: any) {
      console.error('Erro ao entrar na comunidade:', error)
      const errorMessage = error.message || 'Erro ao entrar na comunidade'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [userId, communityId, authenticatedFetch])

  const leaveCommunity = useCallback(async () => {
    try {
      if (!userId) {
        toast.error('Você precisa estar logado para sair da comunidade')
        return { success: false, error: 'Não autenticado' }
      }

      toast.info('Saindo da comunidade...')

      const response = await authenticatedFetch(`/api/communities/${communityId}/members`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Erro HTTP ${response.status}`)
      }

      if (result.success) {
        toast.success(result.message || 'Você saiu da comunidade!')
        return { success: true, data: result }
      } else {
        throw new Error(result.error || 'Erro desconhecido ao sair da comunidade')
      }

    } catch (error: any) {
      console.error('Erro ao sair da comunidade:', error)
      const errorMessage = error.message || 'Erro ao sair da comunidade'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [userId, communityId, authenticatedFetch])

  const createPost = useCallback(async (content: string) => {
    try {
      if (!userId) {
        toast.error('Você precisa estar logado para criar posts')
        return { success: false, error: 'Não autenticado' }
      }

      if (!content.trim()) {
        toast.error('O conteúdo do post não pode estar vazio')
        return { success: false, error: 'Conteúdo vazio' }
      }

      toast.info('Criando post...')

      const response = await authenticatedFetch(`/api/communities/${communityId}/posts`, {
        method: 'POST',
        body: JSON.stringify({
          content: content.trim()
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Erro HTTP ${response.status}`)
      }

      if (result.success) {
        toast.success(result.message || 'Post criado com sucesso!')
        return { success: true, data: result }
      } else {
        throw new Error(result.error || 'Erro desconhecido ao criar post')
      }

    } catch (error: any) {
      console.error('Erro ao criar post:', error)
      const errorMessage = error.message || 'Erro ao criar post'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [userId, communityId, authenticatedFetch])

  return {
    isAuthenticating,
    getValidToken,
    authenticatedFetch,
    joinCommunity,
    leaveCommunity,
    createPost
  }
}
