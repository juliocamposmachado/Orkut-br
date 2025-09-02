'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useEdgeCompatibility } from '@/hooks/use-edge-compatibility'
import { Navbar } from '@/components/layout/navbar'
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card'
import { Users, Mail, Phone, Video, Edit, Settings, Trash2 } from 'lucide-react'

export default function EdgeTestPage() {
  const [clickCount, setClickCount] = useState(0)
  const [buttonStates, setButtonStates] = useState<Record<string, boolean>>({})
  const edgeInfo = useEdgeCompatibility()

  const handleButtonClick = (buttonId: string) => {
    setClickCount(prev => prev + 1)
    setButtonStates(prev => ({
      ...prev,
      [buttonId]: !prev[buttonId]
    }))
    console.log(`Button ${buttonId} clicked! Total clicks: ${clickCount + 1}`)
    alert(`Botão ${buttonId} funcionou! Total de cliques: ${clickCount + 1}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        <OrkutCard className="mb-6">
          <OrkutCardHeader>
            <h1 className="text-2xl font-bold">Teste de Compatibilidade do Edge</h1>
          </OrkutCardHeader>
          <OrkutCardContent>
            <div className="space-y-4">
              {/* Browser Detection Info */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-2">Informações do Navegador:</h3>
                <ul className="space-y-1 text-sm">
                  <li>É Edge: {edgeInfo.isEdge ? '✅ Sim' : '❌ Não'}</li>
                  <li>Edge Legacy: {edgeInfo.isEdgeLegacy ? '⚠️ Sim' : '✅ Não'}</li>
                  <li>Chromium Edge: {edgeInfo.isChromiumEdge ? '✅ Sim' : '❌ Não'}</li>
                  <li>Precisa Polyfills: {edgeInfo.needsPolyfills ? '⚠️ Sim' : '✅ Não'}</li>
                  <li>Versão: {edgeInfo.version || 'Não detectada'}</li>
                  <li>User Agent: {typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'}</li>
                </ul>
              </div>

              {/* Click Counter */}
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold mb-2">Contador de Cliques: {clickCount}</h3>
                <p className="text-sm text-gray-600">
                  Cada botão funcionando incrementará este contador
                </p>
              </div>
            </div>
          </OrkutCardContent>
        </OrkutCard>

        {/* Button Tests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Basic Buttons */}
          <OrkutCard>
            <OrkutCardHeader>
              <h2>Botões Básicos</h2>
            </OrkutCardHeader>
            <OrkutCardContent>
              <div className="space-y-3">
                <Button 
                  onClick={() => handleButtonClick('basic-default')}
                  className="w-full"
                >
                  Botão Padrão
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => handleButtonClick('basic-outline')}
                  className="w-full"
                >
                  Botão Outline
                </Button>
                
                <Button 
                  variant="secondary"
                  onClick={() => handleButtonClick('basic-secondary')}
                  className="w-full"
                >
                  Botão Secondary
                </Button>
                
                <Button 
                  variant="ghost"
                  onClick={() => handleButtonClick('basic-ghost')}
                  className="w-full"
                >
                  Botão Ghost
                </Button>
              </div>
            </OrkutCardContent>
          </OrkutCard>

          {/* Profile Action Buttons */}
          <OrkutCard>
            <OrkutCardHeader>
              <h2>Botões do Perfil</h2>
            </OrkutCardHeader>
            <OrkutCardContent>
              <div className="space-y-3">
                <Button 
                  className="w-full bg-purple-500 hover:bg-purple-600"
                  onClick={() => handleButtonClick('profile-friend')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Adicionar como Amigo
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full border-purple-300 text-purple-700"
                  onClick={() => handleButtonClick('profile-message')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Enviar Mensagem
                </Button>
                
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 border-purple-300 text-purple-700"
                    onClick={() => handleButtonClick('profile-call')}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 border-purple-300 text-purple-700"
                    onClick={() => handleButtonClick('profile-video')}
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full border-purple-300 text-purple-700"
                  onClick={() => handleButtonClick('profile-edit')}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Perfil
                </Button>
              </div>
            </OrkutCardContent>
          </OrkutCard>

          {/* Small Buttons */}
          <OrkutCard>
            <OrkutCardHeader>
              <h2>Botões Pequenos</h2>
            </OrkutCardHeader>
            <OrkutCardContent>
              <div className="space-y-3">
                <Button 
                  size="sm"
                  onClick={() => handleButtonClick('small-1')}
                  className="w-full"
                >
                  Botão Pequeno 1
                </Button>
                
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => handleButtonClick('small-2')}
                  className="w-full"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Button>
                
                <Button 
                  size="sm"
                  variant="ghost"
                  onClick={() => handleButtonClick('small-delete')}
                  className="w-full text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </div>
            </OrkutCardContent>
          </OrkutCard>

          {/* Interactive States */}
          <OrkutCard>
            <OrkutCardHeader>
              <h2>Estados Interativos</h2>
            </OrkutCardHeader>
            <OrkutCardContent>
              <div className="space-y-3">
                <Button 
                  onClick={() => handleButtonClick('toggle-1')}
                  className={`w-full transition-colors ${
                    buttonStates['toggle-1'] 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-gray-500 hover:bg-gray-600'
                  }`}
                >
                  Toggle 1: {buttonStates['toggle-1'] ? 'Ativado' : 'Desativado'}
                </Button>
                
                <Button 
                  onClick={() => handleButtonClick('toggle-2')}
                  variant={buttonStates['toggle-2'] ? 'default' : 'outline'}
                  className="w-full"
                >
                  Toggle 2: {buttonStates['toggle-2'] ? 'Ligado' : 'Desligado'}
                </Button>
                
                <Button 
                  disabled
                  className="w-full"
                >
                  Botão Desabilitado
                </Button>
              </div>
            </OrkutCardContent>
          </OrkutCard>
        </div>

        {/* Test Results */}
        <OrkutCard className="mt-6">
          <OrkutCardHeader>
            <h2>Resultados do Teste</h2>
          </OrkutCardHeader>
          <OrkutCardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800">Total de Cliques</h3>
                <p className="text-2xl font-bold text-blue-600">{clickCount}</p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-800">Botões Testados</h3>
                <p className="text-2xl font-bold text-green-600">
                  {Object.keys(buttonStates).length}
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-800">Status</h3>
                <p className={`text-xl font-bold ${clickCount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {clickCount > 0 ? '✅ Funcionando' : '❌ Não Testado'}
                </p>
              </div>
            </div>
            
            {/* Button States Debug */}
            {Object.keys(buttonStates).length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">Estados dos Botões:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {Object.entries(buttonStates).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-1">
                      <span className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span>{key}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </OrkutCardContent>
        </OrkutCard>

        {/* Instructions */}
        <OrkutCard className="mt-6">
          <OrkutCardHeader>
            <h2>Instruções</h2>
          </OrkutCardHeader>
          <OrkutCardContent>
            <div className="prose text-sm">
              <p className="mb-2">
                <strong>Como testar:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Abra esta página no Microsoft Edge</li>
                <li>Clique em cada botão para testar a funcionalidade</li>
                <li>Observe se o contador de cliques aumenta</li>
                <li>Verifique se os alertas aparecem</li>
                <li>Teste os botões de toggle para ver mudanças visuais</li>
              </ol>
              
              <p className="mt-4 text-gray-600">
                Se os botões funcionarem corretamente nesta página, a mesma correção 
                foi aplicada à página de perfil e deve funcionar lá também.
              </p>
            </div>
          </OrkutCardContent>
        </OrkutCard>
      </div>
    </div>
  )
}
