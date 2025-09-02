'use client'

import { useState } from 'react'
import { useMediaPermissions } from '@/hooks/use-media-permissions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Camera, 
  Mic, 
  Monitor, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'

interface MediaPermissionsBannerProps {
  show?: boolean
  onPermissionsGranted?: () => void
}

export function MediaPermissionsBanner({ 
  show = true, 
  onPermissionsGranted 
}: MediaPermissionsBannerProps) {
  const { 
    permissions, 
    isSupported, 
    isMobile, 
    requestPermissions, 
    hasAllPermissions,
    isLoading,
    error
  } = useMediaPermissions()

  const [dismissed, setDismissed] = useState(false)

  if (!show || !isSupported || dismissed || hasAllPermissions) {
    return null
  }

  const handleRequestPermissions = async () => {
    const success = await requestPermissions(['camera', 'microphone'])
    if (success && onPermissionsGranted) {
      onPermissionsGranted()
    }
  }

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'granted':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'denied':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'prompt':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Shield className="h-4 w-4 text-gray-400" />
    }
  }

  const getPermissionText = (permission: string) => {
    switch (permission) {
      case 'granted':
        return 'Concedida'
      case 'denied':
        return 'Negada'
      case 'prompt':
        return 'Necessária'
      default:
        return 'Desconhecida'
    }
  }

  return (
    <Card className={`w-full max-w-2xl mx-auto ${ 
      isMobile ? 'mx-4 mt-4' : 'mt-6' 
    } border-2 border-blue-200 bg-blue-50/50`}>
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <CardTitle className={isMobile ? 'text-lg' : 'text-xl'}>
            Permissões de Mídia
          </CardTitle>
        </div>
        <CardDescription className={isMobile ? 'text-base' : 'text-sm'}>
          {isMobile 
            ? 'Para fazer chamadas, precisamos acessar sua câmera e microfone'
            : 'Para utilizar as funcionalidades de chamadas de áudio e vídeo, precisamos das seguintes permissões:'
          }
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Permissions Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div className="flex items-center space-x-2">
              <Camera className="h-4 w-4 text-gray-600" />
              <span className={isMobile ? 'text-base' : 'text-sm'}>Câmera</span>
            </div>
            <div className="flex items-center space-x-2">
              {getPermissionIcon(permissions.camera)}
              <Badge variant={permissions.camera === 'granted' ? 'default' : 'secondary'}>
                {getPermissionText(permissions.camera)}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
            <div className="flex items-center space-x-2">
              <Mic className="h-4 w-4 text-gray-600" />
              <span className={isMobile ? 'text-base' : 'text-sm'}>Microfone</span>
            </div>
            <div className="flex items-center space-x-2">
              {getPermissionIcon(permissions.microphone)}
              <Badge variant={permissions.microphone === 'granted' ? 'default' : 'secondary'}>
                {getPermissionText(permissions.microphone)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={handleRequestPermissions}
            disabled={isLoading}
            className={`flex-1 ${ 
              isMobile ? 'h-12 text-base' : 'h-10' 
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Solicitando...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                {isMobile ? 'Permitir Acesso' : 'Conceder Permissões'}
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={() => setDismissed(true)}
            className={isMobile ? 'h-12 text-base' : 'h-10'}
          >
            {isMobile ? 'Depois' : 'Lembrar mais tarde'}
          </Button>
        </div>

        {/* Mobile-specific help text */}
        {isMobile && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <p className="font-medium mb-1">💡 Dica importante:</p>
            <p>
              Se as permissões foram negadas, você pode habilitá-las nas configurações do seu navegador 
              ou reinstalar o app para ser perguntado novamente.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
