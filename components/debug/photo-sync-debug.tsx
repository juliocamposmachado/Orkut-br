'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/local-auth-context'
import { toast } from 'sonner'

export function PhotoSyncDebug() {
  const { user, profile } = useAuth()
  const [syncing, setSyncing] = useState(false)

  const forceSyncPhoto = async () => {
    if (!user) {
      toast.error('Usuário não encontrado')
      return
    }

    setSyncing(true)
    try {
      console.log('🔧 [DEBUG] Forçando re-sincronização da foto...')
      
      // Primeiro, vamos limpar a foto atual se for do Pexels
      if (profile?.photo_url && profile.photo_url.includes('pexels.com')) {
        console.log('🧹 Removendo foto do Pexels do banco...')
        await supabase
          .from('profiles')
          .update({ photo_url: null })
          .eq('id', user.id)
        
        toast.info('Foto do Pexels removida. Recarregue a página.')
      }

      // Obter dados atuais do usuário do Supabase
      const { data: { user: currentUser }, error } = await supabase.auth.getUser()
      
      if (error || !currentUser) {
        toast.error('Erro ao obter dados do usuário')
        return
      }

      console.log('👤 Dados atuais do usuário para debug:')
      console.log('- User metadata:', JSON.stringify(currentUser.user_metadata, null, 2))
      console.log('- Identities:', JSON.stringify(currentUser.identities, null, 2))

      // Tentar diferentes fontes de foto
      const photoSources = [
        currentUser.user_metadata?.avatar_url,
        currentUser.user_metadata?.picture,
        currentUser.user_metadata?.photo_url,
        currentUser.identities?.[0]?.identity_data?.avatar_url,
        currentUser.identities?.[0]?.identity_data?.picture,
      ]

      let validPhoto = null
      for (const photo of photoSources) {
        if (photo && typeof photo === 'string' && !photo.includes('pexels.com')) {
          validPhoto = photo
          console.log('✅ Foto válida encontrada:', photo)
          break
        }
      }

      if (validPhoto) {
        // Atualizar no banco
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ photo_url: validPhoto })
          .eq('id', user.id)

        if (updateError) {
          toast.error('Erro ao atualizar foto no banco')
          console.error('Erro:', updateError)
        } else {
          toast.success('Foto sincronizada com sucesso! Recarregue a página.')
          console.log('✅ Foto atualizada para:', validPhoto)
        }
      } else {
        toast.warning('Nenhuma foto válida do Google encontrada nos metadados')
        console.log('❌ Nenhuma fonte de foto válida encontrada')
        console.log('📋 Fontes verificadas:', photoSources)
      }

    } catch (error) {
      console.error('Erro na sincronização:', error)
      toast.error('Erro na sincronização da foto')
    } finally {
      setSyncing(false)
    }
  }

  const clearPexelsPhoto = async () => {
    if (!user || !profile?.photo_url?.includes('pexels.com')) {
      toast.error('Nenhuma foto do Pexels para remover')
      return
    }

    try {
      await supabase
        .from('profiles')
        .update({ photo_url: null })
        .eq('id', user.id)

      toast.success('Foto do Pexels removida! Recarregue a página.')
    } catch (error) {
      console.error('Erro ao limpar foto:', error)
      toast.error('Erro ao remover foto do Pexels')
    }
  }

  if (!user) return null

  return (
    <div className="fixed top-20 right-4 z-50 bg-white p-4 rounded-lg shadow-lg border">
      <h3 className="text-sm font-bold mb-2">🔧 Debug - Foto do Perfil</h3>
      <div className="space-y-2 text-xs">
        <p><strong>Foto atual:</strong></p>
        <p className="break-all">{profile?.photo_url || 'Nenhuma'}</p>
        
        {profile?.photo_url?.includes('pexels.com') && (
          <p className="text-red-600 font-medium">⚠️ Foto do Pexels detectada!</p>
        )}
        
        <div className="space-y-1">
          <Button 
            size="sm" 
            onClick={forceSyncPhoto}
            disabled={syncing}
            className="w-full text-xs"
          >
            {syncing ? 'Sincronizando...' : '🔄 Forçar Sync Google'}
          </Button>
          
          {profile?.photo_url?.includes('pexels.com') && (
            <Button 
              size="sm" 
              variant="destructive"
              onClick={clearPexelsPhoto}
              className="w-full text-xs"
            >
              🗑️ Limpar Pexels
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
