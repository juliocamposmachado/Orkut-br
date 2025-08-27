'use client'

import { Suspense } from 'react'
import MediaTest from '@/components/debug/media-test'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function DebugChamadasPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto py-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Debug de Chamadas</h1>
            <p className="text-gray-600">Ferramentas para diagnosticar problemas com chamadas de áudio e vídeo</p>
          </div>
        </div>

        {/* Warning */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Aviso Importante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>• <strong>Esta página é apenas para desenvolvimento e debug</strong></p>
              <p>• Para que as chamadas funcionem, você precisa:</p>
              <ul className="ml-6 list-disc space-y-1">
                <li>Executar o script SQL <code>PASSO3_criar_tabelas_chamadas.sql</code> no Supabase</li>
                <li>Ter pelo menos 2 usuários online simultaneamente</li>
                <li>Permitir acesso à câmera e microfone quando solicitado</li>
                <li>Estar em uma conexão segura (HTTPS) ou localhost</li>
              </ul>
              <p>• <strong>Problemas comuns:</strong></p>
              <ul className="ml-6 list-disc space-y-1">
                <li>Bloqueio de permissões de mídia pelo navegador</li>
                <li>Firewall bloqueando servidores STUN</li>
                <li>Tabelas do banco de dados não criadas</li>
                <li>WebRTC não suportado no navegador</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Main Test Component */}
        <Suspense fallback={
          <Card>
            <CardHeader>
              <CardTitle>Carregando...</CardTitle>
              <CardDescription>Preparando ferramentas de diagnóstico</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            </CardContent>
          </Card>
        }>
          <MediaTest />
        </Suspense>

        {/* Additional Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Instruções de Debug</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">1. Testar Permissões de Mídia</h4>
                <p className="text-gray-600">
                  Clique em "Testar Permissões" para verificar se o navegador consegue acessar sua câmera e microfone.
                  Se falhar, verifique as configurações de permissão do seu navegador.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">2. Testar Conectividade STUN</h4>
                <p className="text-gray-600">
                  Clique em "Testar STUN" para verificar se consegue conectar aos servidores STUN necessários para WebRTC.
                  Se todos falharem, pode haver bloqueio de firewall.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">3. Verificar Informações do Sistema</h4>
                <p className="text-gray-600">
                  Na seção "Informações do Sistema", verifique se WebRTC e getUserMedia estão disponíveis.
                  Se não estiverem, seu navegador pode não suportar essas funcionalidades.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">4. Como Usar a Prévia</h4>
                <p className="text-gray-600">
                  Se o teste de permissões funcionar, você verá uma prévia da sua câmera. 
                  Use os botões para testar mute/unmute e parar/iniciar o stream.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
