'use client'

import { useState, useEffect } from 'react'
import { useNotificationSettings } from '@/hooks/use-notification-settings'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  Share, 
  UserPlus, 
  AtSign,
  Users,
  Smartphone,
  Mail,
  Volume2,
  Moon,
  Eye,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react'
// import { toast } from 'sonner' // Temporariamente comentado para build

export function NotificationSettings() {
  const {
    settings,
    isLoading,
    hasLoaded,
    saveSettings,
    requestNotificationPermission,
    checkPushSupport,
    notificationPermission
  } = useNotificationSettings()

  const [localSettings, setLocalSettings] = useState(settings)

  // Sincronizar com as configurações carregadas
  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const pushSupport = checkPushSupport()

  const handleSettingChange = async (key: keyof typeof settings, value: boolean) => {
    const newSettings = { ...localSettings, [key]: value }
    setLocalSettings(newSettings)
    await saveSettings({ [key]: value })
  }

  const handleTimeChange = async (key: 'quiet_hours_start' | 'quiet_hours_end', value: string) => {
    const newSettings = { ...localSettings, [key]: value }
    setLocalSettings(newSettings)
    await saveSettings({ [key]: value })
  }

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission()
    if (granted) {
      // Atualizar o estado local para refletir a mudança
      setLocalSettings(prev => ({ ...prev, browser_push: true }))
    }
  }

  const testNotification = () => {
    if (notificationPermission !== 'granted') {
      alert('Permissão para notificações não concedida')
      return
    }

    new Notification('🔔 Teste de Notificação', {
      body: 'Esta é uma notificação de teste do seu Orkut!',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'test-notification'
    })
    
    alert('Notificação de teste enviada!')
  }

  if (!hasLoaded) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  const notificationTypes = [
    {
      key: 'likes' as const,
      title: 'Curtidas',
      description: 'Quando alguém curtir seus posts',
      icon: Heart,
      color: 'text-red-500'
    },
    {
      key: 'comments' as const,
      title: 'Comentários',
      description: 'Quando alguém comentar em seus posts',
      icon: MessageCircle,
      color: 'text-blue-500'
    },
    {
      key: 'shares' as const,
      title: 'Compartilhamentos',
      description: 'Quando alguém compartilhar seus posts',
      icon: Share,
      color: 'text-green-500'
    },
    {
      key: 'friend_requests' as const,
      title: 'Solicitações de Amizade',
      description: 'Quando receber novas solicitações de amizade',
      icon: UserPlus,
      color: 'text-purple-500'
    },
    {
      key: 'mentions' as const,
      title: 'Menções',
      description: 'Quando alguém mencionar você em posts ou comentários',
      icon: AtSign,
      color: 'text-orange-500'
    },
    {
      key: 'posts_from_friends' as const,
      title: 'Posts de Amigos',
      description: 'Quando seus amigos publicarem novos posts',
      icon: Users,
      color: 'text-indigo-500'
    },
    {
      key: 'community_activity' as const,
      title: 'Atividade em Comunidades',
      description: 'Notificações sobre atividades nas suas comunidades',
      icon: Users,
      color: 'text-pink-500'
    }
  ]

  const deliveryMethods = [
    {
      key: 'browser_push' as const,
      title: 'Notificações Push do Navegador',
      description: 'Receba notificações direto no seu navegador',
      icon: Smartphone,
      requiresPermission: true
    },
    {
      key: 'email_notifications' as const,
      title: 'Notificações por Email',
      description: 'Receba um resumo diário por email (em breve)',
      icon: Mail,
      disabled: true
    },
    {
      key: 'sound_enabled' as const,
      title: 'Som das Notificações',
      description: 'Tocar som quando receber notificações',
      icon: Volume2
    }
  ]

  return (
    <div className="space-y-6">
      {/* Status das permissões */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Status das Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!pushSupport.supported && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {pushSupport.reason}. Algumas funcionalidades podem não estar disponíveis.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Permissão do Navegador</Label>
              <p className="text-sm text-muted-foreground">
                Status atual das permissões para notificações
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={notificationPermission === 'granted' ? 'default' : 'destructive'}
                className={notificationPermission === 'granted' ? 'bg-green-500' : ''}
              >
                {notificationPermission === 'granted' && <CheckCircle className="h-3 w-3 mr-1" />}
                {notificationPermission === 'denied' && <AlertTriangle className="h-3 w-3 mr-1" />}
                {notificationPermission === 'default' && <Info className="h-3 w-3 mr-1" />}
                {notificationPermission === 'granted' ? 'Concedida' : 
                 notificationPermission === 'denied' ? 'Negada' : 'Não solicitada'}
              </Badge>
              {(notificationPermission === 'default' || notificationPermission === 'denied') && (
                <Button
                  onClick={handleRequestPermission}
                  size="sm"
                  variant="outline"
                >
                  Solicitar Permissão
                </Button>
              )}
            </div>
          </div>

          {notificationPermission === 'granted' && (
            <Button
              onClick={testNotification}
              variant="outline"
              size="sm"
              className="w-full"
            >
              🧪 Testar Notificação
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Tipos de notificação */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Notificação</CardTitle>
          <CardDescription>
            Escolha quais tipos de atividades você quer receber notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationTypes.map((type) => {
            const Icon = type.icon
            return (
              <div key={type.key} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Icon className={`h-5 w-5 ${type.color}`} />
                  <div className="space-y-1">
                    <Label htmlFor={type.key}>{type.title}</Label>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={type.key}
                  checked={localSettings[type.key]}
                  onCheckedChange={(checked) => handleSettingChange(type.key, checked)}
                  disabled={isLoading}
                />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Métodos de entrega */}
      <Card>
        <CardHeader>
          <CardTitle>Métodos de Entrega</CardTitle>
          <CardDescription>
            Como você quer receber as notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {deliveryMethods.map((method) => {
            const Icon = method.icon
            const isDisabled = method.disabled || 
              (method.requiresPermission && notificationPermission !== 'granted')
            
            return (
              <div key={method.key} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5 text-gray-600" />
                  <div className="space-y-1">
                    <Label htmlFor={method.key} className={isDisabled ? 'text-gray-400' : ''}>
                      {method.title}
                      {method.disabled && <Badge variant="secondary" className="ml-2 text-xs">Em breve</Badge>}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {method.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={method.key}
                  checked={localSettings[method.key]}
                  onCheckedChange={(checked) => handleSettingChange(method.key, checked)}
                  disabled={isLoading || isDisabled}
                />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Configurações avançadas */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações Avançadas</CardTitle>
          <CardDescription>
            Opções adicionais para personalizar suas notificações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Horário silencioso */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Moon className="h-5 w-5 text-indigo-500" />
                <div className="space-y-1">
                  <Label htmlFor="quiet-hours">Horário Silencioso</Label>
                  <p className="text-sm text-muted-foreground">
                    Silenciar notificações durante determinados horários
                  </p>
                </div>
              </div>
              <Switch
                id="quiet-hours"
                checked={localSettings.quiet_hours_enabled}
                onCheckedChange={(checked) => handleSettingChange('quiet_hours_enabled', checked)}
                disabled={isLoading}
              />
            </div>

            {localSettings.quiet_hours_enabled && (
              <div className="ml-8 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quiet-start">Início</Label>
                    <Input
                      id="quiet-start"
                      type="time"
                      value={localSettings.quiet_hours_start}
                      onChange={(e) => handleTimeChange('quiet_hours_start', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quiet-end">Fim</Label>
                    <Input
                      id="quiet-end"
                      type="time"
                      value={localSettings.quiet_hours_end}
                      onChange={(e) => handleTimeChange('quiet_hours_end', e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Durante este período, você não receberá notificações push
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Preview das notificações */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Eye className="h-5 w-5 text-emerald-500" />
              <div className="space-y-1">
                <Label htmlFor="notification-preview">Preview das Notificações</Label>
                <p className="text-sm text-muted-foreground">
                  Mostrar prévia do conteúdo nas notificações
                </p>
              </div>
            </div>
            <Switch
              id="notification-preview"
              checked={localSettings.notification_preview}
              onCheckedChange={(checked) => handleSettingChange('notification_preview', checked)}
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Informações adicionais */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Dica:</strong> Para uma melhor experiência, recomendamos manter as notificações push ativadas. 
          Você pode ajustar quais tipos de notificação receber usando as configurações acima.
        </AlertDescription>
      </Alert>
    </div>
  )
}
