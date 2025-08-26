import { useMemo } from 'react'

interface UseGoogleImageProxyOptions {
  size?: number
  fallback?: string
}

export function useGoogleImageProxy(originalUrl?: string | null, options: UseGoogleImageProxyOptions = {}) {
  const { size = 96, fallback } = options

  const proxiedUrl = useMemo(() => {
    if (!originalUrl) return fallback

    // Se não for uma URL do Google, retornar como está
    if (!originalUrl.includes('googleusercontent.com') && !originalUrl.includes('lh3.googleusercontent.com')) {
      return originalUrl
    }

    // Se já for uma URL do nosso proxy, retornar como está
    if (originalUrl.includes('/api/proxy-image')) {
      return originalUrl
    }

    try {
      // Modificar a URL do Google para o tamanho desejado
      let modifiedGoogleUrl = originalUrl
      
      // Remove parâmetros de tamanho existentes e adiciona novos
      if (originalUrl.includes('=s') && originalUrl.includes('-c')) {
        modifiedGoogleUrl = originalUrl.replace(/=s\d+-c$/, `=s${size}-c`)
      } else if (originalUrl.includes('=s')) {
        modifiedGoogleUrl = originalUrl.replace(/=s\d+$/, `=s${size}`)
      } else {
        // Se não tem parâmetros de tamanho, adicionar
        modifiedGoogleUrl = `${originalUrl}=s${size}-c`
      }

      // Criar URL do proxy
      const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(modifiedGoogleUrl)}`
      
      console.log('🔄 Convertendo URL do Google:', {
        original: originalUrl,
        modified: modifiedGoogleUrl,
        proxy: proxyUrl
      })

      return proxyUrl
    } catch (error) {
      console.warn('⚠️ Erro ao processar URL da imagem:', error)
      return fallback || originalUrl
    }
  }, [originalUrl, size, fallback])

  return proxiedUrl
}

// Hook simplificado para avatares
export function useAvatarProxy(photoUrl?: string | null, size: number = 96) {
  return useGoogleImageProxy(photoUrl, { 
    size,
    fallback: `https://ui-avatars.com/api/?name=User&size=${size}&background=8b5cf6&color=fff`
  })
}

// Função utilitária para usar fora de componentes React
export function getProxiedImageUrl(originalUrl?: string | null, size: number = 96): string {
  if (!originalUrl) {
    return `https://ui-avatars.com/api/?name=User&size=${size}&background=8b5cf6&color=fff`
  }

  // Se não for uma URL do Google, retornar como está
  if (!originalUrl.includes('googleusercontent.com') && !originalUrl.includes('lh3.googleusercontent.com')) {
    return originalUrl
  }

  // Se já for uma URL do nosso proxy, retornar como está
  if (originalUrl.includes('/api/proxy-image')) {
    return originalUrl
  }

  try {
    // Modificar a URL do Google para o tamanho desejado
    let modifiedGoogleUrl = originalUrl
    
    if (originalUrl.includes('=s') && originalUrl.includes('-c')) {
      modifiedGoogleUrl = originalUrl.replace(/=s\d+-c$/, `=s${size}-c`)
    } else if (originalUrl.includes('=s')) {
      modifiedGoogleUrl = originalUrl.replace(/=s\d+$/, `=s${size}`)
    } else {
      modifiedGoogleUrl = `${originalUrl}=s${size}-c`
    }

    return `/api/proxy-image?url=${encodeURIComponent(modifiedGoogleUrl)}`
  } catch (error) {
    console.warn('⚠️ Erro ao processar URL da imagem:', error)
    return originalUrl
  }
}
