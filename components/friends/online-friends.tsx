'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { supabase } from '@/lib/supabase'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, MessageCircle, Eye, Phone } from 'lucide-react'
import Link from 'next/link'

interface OnlineFriend {
  id: string
  username: string
  display_name: string
  photo_url: string | null
  isOnline: boolean
}

interface OnlineFriendsProps {
  onOpenMessage?: (user: { id: string; name: string; username: string; photo?: string; isOnline?: boolean }) => void
  onStartAudioCall?: (user: any) => void
}

export function OnlineFriends({ onOpenMessage, onStartAudioCall }: OnlineFriendsProps) {
  const { user, profile } = useAuth()
  const [onlineFriends, setOnlineFriends] = useState<OnlineFriend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadOnlineFriends()
    }
  }, [user])

  // Escutar eventos de atualização de amigos
  useEffect(() => {
    const handleFriendsUpdate = () => {
      console.log('🔄 Recarregando amigos online...')
      loadOnlineFriends()
    }

    window.addEventListener('friendRequestAccepted', handleFriendsUpdate)
    window.addEventListener('friendsListUpdated', handleFriendsUpdate)

    return () => {
      window.removeEventListener('friendRequestAccepted', handleFriendsUpdate)
      window.removeEventListener('friendsListUpdated', handleFriendsUpdate)
    }
  }, [user])

  const loadOnlineFriends = async () => {
    if (!user) return

    setLoading(true)
    try {
      let friendsList: OnlineFriend[] = []

      // Tentar carregar da base de dados
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('friendships')
            .select(`
              *,
              requester:profiles!requester_id(id, username, display_name, photo_url),
              addressee:profiles!addressee_id(id, username, display_name, photo_url)
            `)
            .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
            .eq('status', 'accepted')
            .order('created_at', { ascending: false })
            .limit(10)

          if (!error && data) {
            friendsList = data.map(friendship => {
              const friend = friendship.requester_id === user.id 
                ? friendship.addressee 
                : friendship.requester
              
              return {
                id: friend.id,
                username: friend.username,
                display_name: friend.display_name,
                photo_url: friend.photo_url,
                isOnline: true // Simular que todos estão online por enquanto
              }
            })
          }
        } catch (error) {
          console.warn('Erro ao carregar amigos online do Supabase:', error)
        }
      }

      // Sempre adicionar amigos padrão (Julio e Rádio Tatuaé) se não há amigos carregados
      const defaultFriends: OnlineFriend[] = [
        {
          id: 'juliocamposmachado',
          username: 'juliocamposmachado',
          display_name: 'Julio Campos Machado',
          photo_url: 'https://lh3.googleusercontent.com/a/ACg8ocKKxiAA-fM5eBsd8S3bGtqcF4N8nKWf1rkOLy7l4Qi=s96-c',
          isOnline: true
        },
        {
          id: 'radiotatuapefm',
          username: 'radiotatuapefm', 
          display_name: 'Rádio Tatuaé FM',
          photo_url: 'https://yt3.googleusercontent.com/ytc/AIdro_mNKSJ4CzULsb3m0uYJKY08OQTfJL7NJNmf_3hEjpY8T-8=s176-c-k-c0x00ffffff-no-rj',
          isOnline: true
        }
      ]

      // Filtrar amigos padrão que não sejam o usuário atual
      const filteredDefaults = defaultFriends.filter(friend => friend.id !== user.id)

      // Combinar amigos reais com padrão, removendo duplicatas
      const existingIds = friendsList.map(f => f.id)
      const uniqueDefaults = filteredDefaults.filter(f => !existingIds.includes(f.id))
      
      const finalList = [...friendsList, ...uniqueDefaults].slice(0, 10)
      setOnlineFriends(finalList)

    } catch (error) {
      console.error('Erro ao carregar amigos online:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <OrkutCard>
      <OrkutCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-green-600" />
            <span>Amigos Online</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-500">{onlineFriends.length} online</span>
          </div>
        </div>
      </OrkutCardHeader>
      <OrkutCardContent>
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p className="text-xs text-gray-500">Carregando...</p>
          </div>
        ) : onlineFriends.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm">Nenhum amigo online</p>
            <p className="text-xs">Adicione amigos para vê-los aqui!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {onlineFriends.map((friend) => (
              <div 
                key={friend.id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-purple-50 transition-colors cursor-pointer group"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8 border-2 border-green-300">
                    <AvatarImage 
                      src={friend.photo_url || undefined} 
                      alt={friend.display_name} 
                    />
                    <AvatarFallback className="bg-purple-500 text-white font-bold text-xs">
                      {friend.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border border-white rounded-full animate-pulse"></div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-800 truncate">
                    {friend.display_name}
                  </h4>
                  <p className="text-xs text-green-600 font-medium">
                    🟢 Online agora
                    {friend.id === 'juliocamposmachado' && ' • Criador'}
                    {friend.id === 'radiotatuapefm' && ' • Rádio Oficial'}
                  </p>
                </div>
                
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                  {onOpenMessage && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="p-1 h-6 w-6 text-purple-600 hover:bg-purple-100"
                      title="Enviar mensagem"
                      onClick={(e) => {
                        e.stopPropagation()
                        onOpenMessage({
                          id: friend.id,
                          name: friend.display_name,
                          username: friend.username,
                          photo: friend.photo_url || undefined,
                          isOnline: friend.isOnline
                        })
                      }}
                    >
                      <MessageCircle className="h-3 w-3" />
                    </Button>
                  )}
                  
                  {onStartAudioCall && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="p-1 h-6 w-6 text-green-600 hover:bg-green-100"
                      title="Chamada de áudio"
                      onClick={(e) => {
                        e.stopPropagation()
                        onStartAudioCall({
                          id: friend.id,
                          name: friend.display_name,
                          photo: friend.photo_url,
                          username: friend.username
                        })
                      }}
                    >
                      <Phone className="h-3 w-3" />
                    </Button>
                  )}
                  
                  <Link href={`/perfil/${friend.username}`}>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="p-1 h-6 w-6 text-purple-600 hover:bg-purple-100"
                      title="Ver perfil"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <Link href="/amigos">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full mt-3 border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            Ver Todos os Amigos
          </Button>
        </Link>
      </OrkutCardContent>
    </OrkutCard>
  )
}
