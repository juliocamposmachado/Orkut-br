'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/local-auth-context'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Smile, Heart, Coffee, Music, Gamepad2, Book, Plane, Camera, Zap, Sun } from 'lucide-react'
import { toast } from 'sonner'

interface MoodOption {
  emoji: string
  label: string
  color: string
  bgColor: string
}

const moodOptions: MoodOption[] = [
  { emoji: '😊', label: 'Feliz', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { emoji: '😎', label: 'Legal', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { emoji: '🥰', label: 'Apaixonado(a)', color: 'text-pink-600', bgColor: 'bg-pink-100' },
  { emoji: '😴', label: 'Cansado(a)', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  { emoji: '🤩', label: 'Animado(a)', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { emoji: '😌', label: 'Relaxado(a)', color: 'text-green-600', bgColor: 'bg-green-100' },
  { emoji: '🤔', label: 'Pensativo(a)', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { emoji: '🙃', label: 'Sarcástico(a)', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  { emoji: '🖕', label: 'Puto(a)', color: 'text-red-700', bgColor: 'bg-red-200' },
  { emoji: '🤡', label: 'Palhaçada', color: 'text-rainbow-600', bgColor: 'bg-rainbow-100' },
  { emoji: '💀', label: 'Morto(a)', color: 'text-gray-800', bgColor: 'bg-gray-200' },
  { emoji: '🤪', label: 'Doidão', color: 'text-pink-700', bgColor: 'bg-pink-200' },
  { emoji: '😈', label: 'Diabólico(a)', color: 'text-red-800', bgColor: 'bg-red-300' },
  { emoji: '🥴', label: 'Alterado(a)', color: 'text-purple-700', bgColor: 'bg-purple-200' },
  { emoji: '🤮', label: 'Enjoado(a)', color: 'text-green-700', bgColor: 'bg-green-200' },
  { emoji: '🥶', label: 'Congelando', color: 'text-blue-800', bgColor: 'bg-blue-200' }
]

const activityOptions = [
  { icon: Coffee, label: 'tomando café', color: 'text-amber-600' },
  { icon: Music, label: 'ouvindo música', color: 'text-purple-600' },
  { icon: Gamepad2, label: 'jogando', color: 'text-green-600' },
  { icon: Book, label: 'lendo', color: 'text-blue-600' },
  { icon: Plane, label: 'viajando', color: 'text-sky-600' },
  { icon: Camera, label: 'fotografando', color: 'text-pink-600' },
  { icon: Zap, label: 'trabalhando', color: 'text-orange-600' },
  { icon: Sun, label: 'pegando sol', color: 'text-yellow-600' },
  { icon: Heart, label: 'mandando hate', color: 'text-red-600' },
  { icon: Smile, label: 'zoando geral', color: 'text-green-700' }
]

interface MoodSelectorProps {
  children: React.ReactNode
  onMoodUpdate?: () => void
}

export function MoodSelector({ children, onMoodUpdate }: MoodSelectorProps) {
  const { user, profile } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<string>('')
  const [customStatus, setCustomStatus] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const updateUserMood = async () => {
    if (!user || !selectedMood) return

    setIsUpdating(true)
    try {
      // Prepare status message
      let statusMessage = selectedMood.emoji
      
      if (customStatus.trim()) {
        statusMessage += ` ${customStatus.trim()}`
      } else if (selectedActivity) {
        statusMessage += ` ${selectedActivity}`
      } else {
        statusMessage += ` ${selectedMood.label.toLowerCase()}`
      }

      // Try to update in Supabase
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            mood: selectedMood.emoji,
            mood_label: selectedMood.label,
            status_message: statusMessage,
            mood_updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (error) {
          console.warn('Supabase mood update error:', error)
          // Continue with fallback
        }
      } catch (dbError) {
        console.error('Database error:', dbError)
      }

      // Fallback: save to localStorage
      const userMoodData = {
        mood: selectedMood.emoji,
        mood_label: selectedMood.label,
        status_message: statusMessage,
        mood_updated_at: new Date().toISOString()
      }

      localStorage.setItem(`user_mood_${user.id}`, JSON.stringify(userMoodData))

      toast.success('Status atualizado com sucesso!')
      setIsOpen(false)
      
      // Reset form
      setSelectedMood(null)
      setSelectedActivity('')
      setCustomStatus('')
      
      if (onMoodUpdate) {
        onMoodUpdate()
      }

    } catch (error) {
      console.error('Error updating mood:', error)
      toast.error('Erro ao atualizar status. Tente novamente.')
    } finally {
      setIsUpdating(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Smile className="h-5 w-5 text-purple-600" />
            <span>Como você está se sentindo?</span>
          </DialogTitle>
          <DialogDescription>
            Compartilhe seu humor atual com seus amigos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mood Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Escolha seu humor:</h3>
            <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
              {moodOptions.map((mood) => (
                <Button
                  key={mood.emoji}
                  variant={selectedMood?.emoji === mood.emoji ? "default" : "outline"}
                  className={`h-auto p-3 flex-col space-y-2 ${
                    selectedMood?.emoji === mood.emoji 
                      ? `${mood.bgColor} ${mood.color} border-2 border-current` 
                      : 'hover:bg-purple-50'
                  }`}
                  onClick={() => setSelectedMood(mood)}
                >
                  <span className="text-lg">{mood.emoji}</span>
                  <span className="text-xs font-medium">{mood.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Activity Selection */}
          {selectedMood && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">O que você está fazendo? (opcional)</h3>
              <div className="grid grid-cols-2 gap-2">
                {activityOptions.map((activity) => {
                  const IconComponent = activity.icon
                  return (
                    <Button
                      key={activity.label}
                      variant={selectedActivity === activity.label ? "default" : "outline"}
                      size="sm"
                      className={`justify-start ${
                        selectedActivity === activity.label 
                          ? 'bg-purple-600 text-white' 
                          : 'hover:bg-purple-50'
                      }`}
                      onClick={() => setSelectedActivity(
                        selectedActivity === activity.label ? '' : activity.label
                      )}
                    >
                      <IconComponent className={`h-4 w-4 mr-2 ${activity.color}`} />
                      {activity.label}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Custom Status */}
          {selectedMood && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">Ou escreva uma mensagem personalizada:</h3>
              <Input
                placeholder="Digite como você está se sentindo..."
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value)}
                maxLength={100}
                className="border-purple-200 focus:ring-purple-500"
              />
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{customStatus.length}/100 caracteres</span>
                {customStatus && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCustomStatus('')}
                    className="h-auto p-1 text-xs text-red-600 hover:text-red-700"
                  >
                    Limpar
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Preview */}
          {selectedMood && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">Preview do seu status:</h3>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{selectedMood.emoji}</span>
                    <Badge 
                      variant="secondary" 
                      className={`${selectedMood.bgColor} ${selectedMood.color} border-0`}
                    >
                      {selectedMood.label}
                    </Badge>
                  </div>
                  {(customStatus.trim() || selectedActivity) && (
                    <span className="text-sm text-gray-700">
                      {customStatus.trim() || selectedActivity}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
            
            <Button
              onClick={updateUserMood}
              disabled={!selectedMood || isUpdating}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Atualizando...
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4 mr-2" />
                  Atualizar Status
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
