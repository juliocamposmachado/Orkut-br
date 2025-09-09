'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Star, Heart, ThumbsUp, Shield } from 'lucide-react'
import { toast } from 'sonner'

interface ClassificationCounts {
  fan_count: number
  fan_level_1: number
  fan_level_2: number
  fan_level_3: number
  trustworthy_count: number
  trustworthy_level_1: number
  trustworthy_level_2: number
  trustworthy_level_3: number
  cool_count: number
  cool_level_1: number
  cool_level_2: number
  cool_level_3: number
  sexy_count: number
  sexy_level_1: number
  sexy_level_2: number
  sexy_level_3: number
}

interface UserClassification {
  classification_type: 'fan' | 'trustworthy' | 'cool' | 'sexy'
  level: 1 | 2 | 3
}

interface UserClassificationsProps {
  userId: string
  isOwnProfile: boolean
  classifications?: ClassificationCounts
}

export default function UserClassifications({ 
  userId, 
  isOwnProfile, 
  classifications 
}: UserClassificationsProps) {
  const { user } = useAuth()
  const [myClassifications, setMyClassifications] = useState<UserClassification[]>([])
  const [loading, setLoading] = useState(false)

  // Configuração dos tipos de classificação
  const classificationTypes = [
    {
      type: 'fan' as const,
      name: 'sou fã',
      icon: Star,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      levels: ['fã', 'muito fã', 'super fã']
    },
    {
      type: 'trustworthy' as const,
      name: 'confiável',
      icon: Shield,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      levels: ['confiável', 'muito confiável', 'super confiável']
    },
    {
      type: 'cool' as const,
      name: 'legal',
      icon: ThumbsUp,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      levels: ['legal', 'muito legal', 'super legal']
    },
    {
      type: 'sexy' as const,
      name: 'sexy',
      icon: Heart,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      levels: ['sexy', 'muito sexy', 'super sexy']
    }
  ]

  // Carregar classificações que o usuário logado deu para este perfil
  useEffect(() => {
    if (user && !isOwnProfile) {
      loadMyClassifications()
    }
  }, [user, userId, isOwnProfile])

  const loadMyClassifications = async () => {
    try {
      const response = await fetch(`/api/classifications?userId=${user?.id}&type=given`)
      if (response.ok) {
        const data = await response.json()
        const userClassifications = data.classifications
          ?.filter((c: any) => c.to_user_id === userId)
          ?.map((c: any) => ({
            classification_type: c.classification_type,
            level: c.level
          })) || []
        setMyClassifications(userClassifications)
      }
    } catch (error) {
      console.error('Erro ao carregar classificações:', error)
    }
  }

  const handleClassification = async (type: string, level: number) => {
    if (!user || isOwnProfile) return
    
    setLoading(true)
    try {
      const existingClassification = myClassifications.find(c => c.classification_type === type)
      
      if (existingClassification?.level === level) {
        // Se já tem a mesma classificação, remover
        const response = await fetch(`/api/classifications?to_user_id=${userId}&classification_type=${type}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          setMyClassifications(prev => prev.filter(c => c.classification_type !== type))
          toast.success('Classificação removida!')
        } else {
          toast.error('Erro ao remover classificação')
        }
      } else {
        // Adicionar ou atualizar classificação
        const response = await fetch('/api/classifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to_user_id: userId,
            classification_type: type,
            level
          })
        })
        
        if (response.ok) {
          setMyClassifications(prev => {
            const filtered = prev.filter(c => c.classification_type !== type)
            return [...filtered, { classification_type: type as any, level: level as any }]
          })
          toast.success('Classificação salva!')
        } else {
          toast.error('Erro ao salvar classificação')
        }
      }
    } catch (error) {
      console.error('Erro ao processar classificação:', error)
      toast.error('Erro ao processar classificação')
    } finally {
      setLoading(false)
    }
  }

  const renderClassificationIcons = (type: string, count1: number, count2: number, count3: number) => {
    const config = classificationTypes.find(c => c.type === type)
    if (!config) return null

    const Icon = config.icon
    const totalCount = count1 + count2 + count3

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {/* Level 1 icons */}
          {Array.from({ length: Math.min(count1, 3) }).map((_, i) => (
            <Icon key={`${type}-1-${i}`} className={`w-4 h-4 ${config.color}`} fill="currentColor" />
          ))}
          
          {/* Level 2 icons */}
          {Array.from({ length: Math.min(count2, 3) }).map((_, i) => (
            <div key={`${type}-2-${i}`} className="flex">
              <Icon className={`w-4 h-4 ${config.color}`} fill="currentColor" />
              <Icon className={`w-4 h-4 ${config.color} -ml-1`} fill="currentColor" />
            </div>
          ))}
          
          {/* Level 3 icons */}
          {Array.from({ length: Math.min(count3, 3) }).map((_, i) => (
            <div key={`${type}-3-${i}`} className="flex">
              <Icon className={`w-4 h-4 ${config.color}`} fill="currentColor" />
              <Icon className={`w-4 h-4 ${config.color} -ml-1`} fill="currentColor" />
              <Icon className={`w-4 h-4 ${config.color} -ml-1`} fill="currentColor" />
            </div>
          ))}
        </div>
        
        <span className="text-sm text-gray-600">
          {config.name}: {totalCount > 0 ? totalCount : 0}
        </span>
      </div>
    )
  }

  const renderClassificationButtons = (type: string) => {
    const config = classificationTypes.find(c => c.type === type)
    if (!config) return null

    const myClassification = myClassifications.find(c => c.classification_type === type)
    const Icon = config.icon

    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">{config.name}:</span>
        <div className="flex gap-1">
          {[1, 2, 3].map((level) => {
            const isActive = myClassification?.level === level
            return (
              <Button
                key={level}
                size="sm"
                variant={isActive ? "default" : "outline"}
                className={`px-2 py-1 text-xs ${isActive ? config.bgColor : ''}`}
                onClick={() => handleClassification(type, level)}
                disabled={loading}
              >
                <div className="flex items-center gap-1">
                  {Array.from({ length: level }).map((_, i) => (
                    <Icon key={i} className={`w-3 h-3 ${isActive ? config.color : 'text-gray-400'}`} />
                  ))}
                  <span>{config.levels[level - 1]}</span>
                </div>
              </Button>
            )
          })}
        </div>
      </div>
    )
  }

  if (!classifications) return null

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Título com legenda nostálgica */}
          <div className="border-b pb-3">
            <h3 className="font-bold text-lg text-gray-800 mb-2">classificação</h3>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded text-xs">
              <div className="font-bold mb-2">legenda</div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                  <span>sou fã</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                    <Star className="w-4 h-4 text-yellow-500 -ml-1" fill="currentColor" />
                  </div>
                  <span>muito fã</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    <Star className="w-4 h-4 text-yellow-500" fill="currentColor" />
                    <Star className="w-4 h-4 text-yellow-500 -ml-1" fill="currentColor" />
                    <Star className="w-4 h-4 text-yellow-500 -ml-1" fill="currentColor" />
                  </div>
                  <span>super fã</span>
                </div>
                <div className="text-gray-500 text-xs mt-2">
                  (mesmo sistema para: confiável, legal, sexy)
                </div>
              </div>
            </div>
          </div>

          {/* Exibição das classificações recebidas */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-700">Classificações recebidas:</h4>
            {renderClassificationIcons('fan', classifications.fan_level_1, classifications.fan_level_2, classifications.fan_level_3)}
            {renderClassificationIcons('trustworthy', classifications.trustworthy_level_1, classifications.trustworthy_level_2, classifications.trustworthy_level_3)}
            {renderClassificationIcons('cool', classifications.cool_level_1, classifications.cool_level_2, classifications.cool_level_3)}
            {renderClassificationIcons('sexy', classifications.sexy_level_1, classifications.sexy_level_2, classifications.sexy_level_3)}
          </div>

          {/* Botões para dar classificações (só aparece se não for o próprio perfil) */}
          {!isOwnProfile && user && (
            <div className="border-t pt-3 space-y-3">
              <h4 className="font-semibold text-gray-700">Dar classificação:</h4>
              {classificationTypes.map((config) => (
                <div key={config.type}>
                  {renderClassificationButtons(config.type)}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
