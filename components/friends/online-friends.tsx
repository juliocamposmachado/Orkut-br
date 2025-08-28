'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { supabase } from '@/lib/supabase'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, MessageCircle, Eye, Phone } from 'lucide-react'
import Link from 'next/link'
import { useRadio } from '@/contexts/RadioContext'

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
  const { radioData } = useRadio()
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

      // Usar apenas amigos reais do sistema
      const finalList = friendsList.slice(0, 10)
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
<span className="text-xs text-gray-500 font-medium">
              {onlineFriends.length} {onlineFriends.length === 1 ? 'amigo' : 'amigos'} online
            </span>
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
          <div className="space-y-1">
            {onlineFriends.map((friend) => {
              // Atividades apenas para usuários reais
              const activities = {
                'juliocamposmachado': 'Desenvolvendo Orkut Retrô',
                'radiotatuapefm': 'Transmitindo ao vivo',
                'default': 'Navegando no Orkut'
              }
              const activity = activities[friend.id as keyof typeof activities] || activities.default
              
              return (
                <div 
                  key={friend.id}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-purple-50/80 transition-all duration-200 cursor-pointer group relative"
                >
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-10 w-10 border-2 border-green-400/60 shadow-sm">
                      <AvatarImage 
                        src={friend.photo_url || undefined} 
                        alt={friend.display_name} 
                      />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm">
                        {friend.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {/* Status indicator */}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm animate-pulse"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-sm text-gray-800 truncate">
                        {friend.display_name}
                      </h4>
                      {/* Tags especiais */}
                      {friend.id === 'juliocamposmachado' && (
                        <span className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-1.5 py-0.5 rounded-full font-medium border border-purple-200">
                          👑 Criador
                        </span>
                      )}
                      {friend.id === 'radiotatuapefm' && (
                        <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium border border-red-200">
                          📻 Rádio
                        </span>
                      )}
                    </div>
                    
                    {/* Status de atividade */}
                    <div className="flex items-center space-x-1 mt-0.5">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      {friend.id === 'radiotatuapefm' && radioData.currentSong && radioData.currentSong !== 'Carregando...' ? (
                        <div className="overflow-hidden flex-1">
                          <div className="animate-marquee whitespace-nowrap">
                            <p className="text-xs text-purple-600 font-medium inline-block">
                              🎵 ouvindo rádio tatuapé fm - {radioData.currentSong}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-600 truncate font-medium">
                          {activity}
                        </p>
                      )}
                    </div>
                    
                    {/* Tempo online */}
                    <p className="text-xs text-gray-400 mt-0.5">
                      Online há {Math.floor(Math.random() * 60) + 1}min
                    </p>
                  </div>
                  
                  {/* Botões de ação - aparecem no hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 flex space-x-1 flex-shrink-0">
                    {onOpenMessage && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="p-1.5 h-7 w-7 text-purple-600 hover:bg-purple-100 hover:scale-105 transition-all rounded-full"
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
                        <MessageCircle className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    
                    {onStartAudioCall && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="p-1.5 h-7 w-7 text-green-600 hover:bg-green-100 hover:scale-105 transition-all rounded-full"
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
                        <Phone className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    
                    <Link href={`/perfil/${friend.username}`}>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="p-1.5 h-7 w-7 text-gray-600 hover:bg-gray-100 hover:scale-105 transition-all rounded-full"
                        title="Ver perfil"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                  
                  {/* Indicador de hover sutil */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-md pointer-events-none"></div>
                </div>
              )
            })}
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

export default OnlineFriends
