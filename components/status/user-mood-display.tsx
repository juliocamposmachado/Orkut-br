'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoodSelector } from './mood-selector'
import { Smile, Edit3 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface UserMood {
  mood: string
  mood_label: string
  status_message: string
  mood_updated_at: string
}

export function UserMoodDisplay() {
  const { user } = useAuth()
  const [userMood, setUserMood] = useState<UserMood | null>(null)

  const loadUserMood = () => {
    if (!user) return

    try {
      const saved = localStorage.getItem(`user_mood_${user.id}`)
      if (saved) {
        const parsed = JSON.parse(saved)
        setUserMood(parsed)
      }
    } catch (error) {
      console.error('Error loading user mood:', error)
    }
  }

  useEffect(() => {
    if (user) {
      loadUserMood()
    }
  }, [user])

  if (!user) return null

  return (
    <div className="space-y-3">
      {userMood ? (
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-2xl">{userMood.mood}</span>
            <Badge 
              variant="secondary" 
              className="bg-purple-100 text-purple-700"
            >
              {userMood.mood_label}
            </Badge>
          </div>
          
          {userMood.status_message && (
            <p className="text-sm text-gray-600 italic">
              {userMood.status_message}
            </p>
          )}
          
          <p className="text-xs text-gray-500">
            Atualizado {formatDistanceToNow(new Date(userMood.mood_updated_at), {
              addSuffix: true,
              locale: ptBR
            })}
          </p>

          <MoodSelector onMoodUpdate={loadUserMood}>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Atualizar Status
            </Button>
          </MoodSelector>
        </div>
      ) : (
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Como você está se sentindo hoje?
          </p>
          
          <MoodSelector onMoodUpdate={loadUserMood}>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Smile className="h-4 w-4 mr-2" />
              Definir Status
            </Button>
          </MoodSelector>
        </div>
      )}
    </div>
  )
}
