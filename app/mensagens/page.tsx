'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Users, Clock } from 'lucide-react'

export default function MensagensPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg border-purple-200">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardTitle className="text-2xl flex items-center">
              <MessageCircle className="w-6 h-6 mr-3" />
              Mensagens
              <Badge variant="secondary" className="ml-3 bg-white/20 text-white">
                Em Desenvolvimento
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-8">
            <div className="text-center space-y-6">
              {/* Ícone central */}
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-12 h-12 text-purple-500" />
              </div>

              {/* Título */}
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">
                  Sistema de Mensagens
                </h2>
                <p className="text-gray-600 text-lg">
                  Em breve você poderá enviar mensagens privadas para seus amigos!
                </p>
              </div>

              {/* Funcionalidades planejadas */}
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="text-center p-4 bg-white rounded-lg shadow-sm border">
                  <MessageCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-800 mb-1">
                    Chat Privado
                  </h3>
                  <p className="text-sm text-gray-600">
                    Conversas individuais com seus amigos
                  </p>
                </div>

                <div className="text-center p-4 bg-white rounded-lg shadow-sm border">
                  <Users className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-800 mb-1">
                    Grupos
                  </h3>
                  <p className="text-sm text-gray-600">
                    Crie grupos para conversar com vários amigos
                  </p>
                </div>

                <div className="text-center p-4 bg-white rounded-lg shadow-sm border">
                  <Clock className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-800 mb-1">
                    Tempo Real
                  </h3>
                  <p className="text-sm text-gray-600">
                    Mensagens instantâneas via WebSocket
                  </p>
                </div>
              </div>

              {/* Status do desenvolvimento */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                <div className="flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-yellow-800 font-medium">
                    Em desenvolvimento - Será lançado em breve!
                  </span>
                </div>
              </div>

              {/* Link para voltar */}
              <div className="pt-4">
                <a 
                  href="/" 
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors"
                >
                  ← Voltar ao Início
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
