'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { 
  Settings, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react'
import { toast } from 'sonner'

interface GooglePhotosSetupProps {
  onConfigured?: () => void
}

export function GooglePhotosSetup({ onConfigured }: GooglePhotosSetupProps) {
  const [showInstructions, setShowInstructions] = useState(false)
  const [showSecrets, setShowSecrets] = useState(false)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copiado para área de transferência!`)
  }

  const redirectUris = [
    `${typeof window !== 'undefined' ? window.location.origin : 'https://orkut-br-oficial.vercel.app'}/`,
    'https://orkut-br-oficial.vercel.app/',
    'http://localhost:3000/'
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <OrkutCard>
        <OrkutCardHeader>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Configuração Google Photos</span>
          </div>
        </OrkutCardHeader>
        <OrkutCardContent>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-1">
                    Google Photos não configurado
                  </h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    Para usar a funcionalidade de upload para Google Photos, é necessário 
                    configurar as credenciais OAuth do Google Cloud Console.
                  </p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200"
                  >
                    {showInstructions ? 'Ocultar' : 'Ver'} Instruções
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </OrkutCardContent>
      </OrkutCard>

      {/* Instruções */}
      {showInstructions && (
        <OrkutCard>
          <OrkutCardHeader>
            <span>📋 Passo a Passo - Configuração Google OAuth</span>
          </OrkutCardHeader>
          <OrkutCardContent>
            <div className="space-y-6">
              
              {/* Passo 1 */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">1</span>
                  Criar projeto no Google Cloud Console
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-gray-700">
                    1. Acesse o <Button 
                      variant="link" 
                      className="p-0 h-auto text-blue-600"
                      onClick={() => window.open('https://console.cloud.google.com/', '_blank')}
                    >
                      Google Cloud Console <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  </p>
                  <p className="text-sm text-gray-700">
                    2. Crie um novo projeto ou selecione um existente
                  </p>
                  <p className="text-sm text-gray-700">
                    3. Habilite as APIs: <strong>Google Photos Library API</strong>
                  </p>
                </div>
              </div>

              {/* Passo 2 */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">2</span>
                  Configurar OAuth 2.0
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-gray-700">
                    1. Vá em "Credenciais" → "Criar credenciais" → "ID do cliente OAuth 2.0"
                  </p>
                  <p className="text-sm text-gray-700">
                    2. Tipo: <strong>Aplicativo da Web</strong>
                  </p>
                  <p className="text-sm text-gray-700">
                    3. Configure as URLs de redirect autorizadas:
                  </p>
                  
                  <div className="space-y-2 ml-4">
                    {redirectUris.map((uri, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <code className="bg-white px-2 py-1 rounded text-xs flex-1 border">
                          {uri}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(uri, 'URL de redirect')}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Passo 3 */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">3</span>
                  Configurar Scopes
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-2">
                    Na tela de consentimento OAuth, adicione os seguintes scopes:
                  </p>
                  <div className="space-y-1">
                    <code className="block bg-white px-2 py-1 rounded text-xs border">
                      https://www.googleapis.com/auth/photoslibrary
                    </code>
                    <code className="block bg-white px-2 py-1 rounded text-xs border">
                      https://www.googleapis.com/auth/photoslibrary.appendonly
                    </code>
                  </div>
                </div>
              </div>

              {/* Passo 4 */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">4</span>
                  Adicionar Variáveis de Ambiente
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-gray-700 mb-2">
                    Adicione as seguintes variáveis no arquivo <code>.env.local</code>:
                  </p>
                  
                  <div className="space-y-2">
                    <div className="bg-white rounded border p-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">GOOGLE_CLIENT_ID</label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard('GOOGLE_CLIENT_ID=seu_client_id_aqui', 'Variável CLIENT_ID')}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                        GOOGLE_CLIENT_ID=seu_client_id_aqui
                      </code>
                    </div>

                    <div className="bg-white rounded border p-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium">GOOGLE_CLIENT_SECRET</label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard('GOOGLE_CLIENT_SECRET=seu_client_secret_aqui', 'Variável CLIENT_SECRET')}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded block">
                        GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
                      </code>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passo 5 */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="bg-green-100 text-green-800 rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">5</span>
                  Reiniciar e Testar
                </h4>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-700 mb-2">
                    Após configurar as variáveis:
                  </p>
                  <ol className="text-sm text-green-700 space-y-1 ml-4 list-decimal">
                    <li>Reinicie o servidor Next.js</li>
                    <li>Faça logout e login novamente</li>
                    <li>Os botões "Google Photos" estarão disponíveis</li>
                    <li>Na primeira vez, será solicitada autorização adicional</li>
                  </ol>
                </div>
              </div>

              {/* Links úteis */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">🔗 Links Úteis</h4>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('https://console.cloud.google.com/', '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-2" />
                    Google Cloud Console
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('https://developers.google.com/photos/library/guides/get-started', '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-2" />
                    Documentação Google Photos API
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('https://support.google.com/cloud/answer/6158849?hl=pt-BR', '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-2" />
                    Configurar OAuth 2.0
                  </Button>
                </div>
              </div>
            </div>
          </OrkutCardContent>
        </OrkutCard>
      )}

      {/* Status atual */}
      <OrkutCard>
        <OrkutCardHeader>
          <span>📊 Status Atual</span>
        </OrkutCardHeader>
        <OrkutCardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-sm">Google Photos: <strong>Não configurado</strong></span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm">Upload tradicional: <strong>Funcionando</strong></span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm">Upload direto: <strong>Funcionando</strong></span>
            </div>
          </div>
        </OrkutCardContent>
      </OrkutCard>
    </div>
  )
}
