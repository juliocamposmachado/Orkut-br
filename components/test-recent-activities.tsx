'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/enhanced-auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RecentActivities } from '@/components/profile/recent-activities'

export function TestRecentActivities() {
  const { user, profile } = useAuth()
  const [isCreatingTest, setIsCreatingTest] = useState(false)

  const createTestActivity = async () => {
    if (!user || !profile) return

    setIsCreatingTest(true)
    try {
      console.log('🧪 Criando atividade de teste...')
      
      const response = await fetch('/api/recent-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile_id: user.id,
          activity_type: 'post',
          activity_data: {
            post_id: Date.now(),
            content: 'Post de teste criado para verificar as atividades recentes!'
          }
        })
      })

      const result = await response.json()
      if (result.success) {
        console.log('✅ Atividade de teste criada com sucesso!')
        // Disparar evento para atualizar a lista
        window.dispatchEvent(new CustomEvent('new-post-created', { 
          detail: { id: Date.now(), content: 'Teste' } 
        }))
      } else {
        console.error('❌ Erro ao criar atividade de teste:', result.error)
      }
    } catch (error) {
      console.error('❌ Erro ao criar atividade de teste:', error)
    } finally {
      setIsCreatingTest(false)
    }
  }

  if (!user || !profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Teste de Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Faça login para testar as atividades recentes.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Teste de Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Use o botão abaixo para criar uma atividade de teste e verificar se as 
            "Atividades Recentes" estão funcionando corretamente.
          </p>
          
          <Button 
            onClick={createTestActivity}
            disabled={isCreatingTest}
            className="mb-4"
          >
            {isCreatingTest ? 'Criando...' : 'Criar Atividade de Teste'}
          </Button>

          <div className="text-sm text-gray-600">
            <p>✅ <strong>Como funciona:</strong></p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Clique no botão para criar uma atividade de teste</li>
              <li>A atividade será registrada no banco de dados</li>
              <li>A lista de atividades recentes será atualizada automaticamente</li>
              <li>Você deve ver a nova atividade aparecer abaixo</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suas Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivities 
            profileId={user.id}
            userProfile={{
              id: user.id,
              display_name: profile.display_name || 'Usuário',
              photo_url: profile.photo_url || undefined,
              username: profile.username || user.email || 'usuario'
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
