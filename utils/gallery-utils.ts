import { supabase } from '@/lib/supabase'

/**
 * Inicializa a galeria de um usuário adicionando automaticamente o logo do Orkut
 * como primeira foto quando ele faz login pela primeira vez
 */
export async function initUserGallery(userId: string): Promise<boolean> {
  try {
    console.log(`📸 [GALLERY INIT] Inicializando galeria para usuário: ${userId}`)

    // Obter token de autenticação da sessão atual
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      console.warn('⚠️ [GALLERY INIT] Nenhuma sessão ativa encontrada')
      return false
    }

    // Chamar a API de inicialização de galeria
    const response = await fetch('/api/photos/init-gallery', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()

    if (response.ok && result.success) {
      console.log(`✅ [GALLERY INIT] Galeria inicializada: ${result.message}`)
      if (result.logoAdded) {
        console.log(`📸 [GALLERY INIT] Logo do Orkut adicionado com ID: ${result.photoId}`)
      }
      return true
    } else {
      console.warn(`⚠️ [GALLERY INIT] Falha na inicialização: ${result.error || result.message}`)
      return false
    }

  } catch (error) {
    console.error('❌ [GALLERY INIT] Erro ao inicializar galeria:', error)
    return false
  }
}

/**
 * Verifica se a galeria do usuário já está inicializada
 */
export async function checkGalleryInitialized(userId: string): Promise<boolean> {
  try {
    // Obter token de autenticação da sessão atual
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      return false
    }

    // Chamar a API para verificar inicialização
    const response = await fetch('/api/photos/init-gallery', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    const result = await response.json()

    if (response.ok) {
      return result.initialized && result.hasLogo
    }

    return false

  } catch (error) {
    console.error('❌ [GALLERY CHECK] Erro ao verificar inicialização da galeria:', error)
    return false
  }
}

/**
 * Hook para inicializar automaticamente a galeria quando um usuário faz login
 */
export async function autoInitGalleryOnLogin(userId: string): Promise<void> {
  try {
    console.log(`🚀 [AUTO INIT] Verificando necessidade de inicialização para usuário: ${userId}`)

    // Verificar se já está inicializada
    const isInitialized = await checkGalleryInitialized(userId)
    
    if (isInitialized) {
      console.log('✅ [AUTO INIT] Galeria já está inicializada')
      return
    }

    console.log('📸 [AUTO INIT] Galeria não inicializada, iniciando processo...')

    // Aguardar um pouco para garantir que o usuário esteja completamente logado
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Inicializar a galeria
    const success = await initUserGallery(userId)
    
    if (success) {
      console.log('🎉 [AUTO INIT] Galeria inicializada automaticamente com sucesso!')
    } else {
      console.warn('⚠️ [AUTO INIT] Falha na inicialização automática da galeria')
    }

  } catch (error) {
    console.error('❌ [AUTO INIT] Erro na inicialização automática:', error)
  }
}
