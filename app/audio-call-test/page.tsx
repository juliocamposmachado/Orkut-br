"use client"

import { useState } from 'react'
import AudioCall from '@/components/AudioCall'
import { Users, Phone } from 'lucide-react'

export default function AudioCallTestPage() {
  const [currentUser, setCurrentUser] = useState('user_1')
  const [targetUser, setTargetUser] = useState('user_2') 
  const [roomId, setRoomId] = useState('room_demo_001')
  const [showCallInterface, setShowCallInterface] = useState(false)

  // Lista de usuários disponíveis para teste
  const testUsers = [
    { id: 'user_1', name: 'Usuário 1', status: 'online' },
    { id: 'user_2', name: 'Usuário 2', status: 'online' },
    { id: 'user_3', name: 'Usuário 3', status: 'busy' }
  ]

  const handleCallEnd = () => {
    setShowCallInterface(false)
  }

  const startCallTest = () => {
    if (!currentUser || !targetUser) {
      alert('Por favor, selecione o usuário atual e o usuário de destino')
      return
    }
    
    if (currentUser === targetUser) {
      alert('Você não pode ligar para si mesmo')
      return
    }
    
    setShowCallInterface(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Phone className="w-8 h-8 text-blue-600" />
            Sistema de Chamadas de Áudio
          </h1>
          <p className="text-gray-600">
            Teste completo do WebRTC + Supabase Realtime
          </p>
        </div>

        {!showCallInterface ? (
          // Interface de configuração
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              ⚙️ Configurações de Teste
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Usuário Atual */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuário Atual
                </label>
                <select
                  value={currentUser}
                  onChange={(e) => setCurrentUser(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {testUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Usuário de Destino */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuário de Destino
                </label>
                <select
                  value={targetUser}
                  onChange={(e) => setTargetUser(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {testUsers
                    .filter(user => user.id !== currentUser)
                    .map(user => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.status})
                      </option>
                    ))}
                </select>
              </div>

              {/* Room ID */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID da Sala
                </label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="room_demo_001"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Botão para iniciar teste */}
            <div className="mt-6 text-center">
              <button
                onClick={startCallTest}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2 mx-auto"
              >
                <Phone size={20} />
                Iniciar Teste de Chamada
              </button>
            </div>
          </div>
        ) : (
          // Interface de chamada ativa
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-medium text-gray-800">
                Chamada Ativa: {currentUser} ↔ {targetUser}
              </h3>
              <p className="text-sm text-gray-600">Sala: {roomId}</p>
            </div>
            
            <AudioCall
              roomId={roomId}
              currentUserId={currentUser}
              targetUserId={targetUser}
              onCallEnd={handleCallEnd}
            />
            
            <div className="mt-4 text-center">
              <button
                onClick={handleCallEnd}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Voltar às configurações
              </button>
            </div>
          </div>
        )}

        {/* Status da Chamada */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            📊 Status da Chamada
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {showCallInterface ? '🟢' : '🔴'}
              </div>
              <div className="text-sm text-gray-600">Status</div>
              <div className="text-xs text-gray-500">
                {showCallInterface ? 'Ativo' : 'Inativo'}
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">N/A</div>
              <div className="text-sm text-gray-600">Call ID</div>
              <div className="text-xs text-gray-500">
                {showCallInterface ? roomId : '-'}
              </div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">N/A</div>
              <div className="text-sm text-gray-600">Conexão WebRTC</div>
              <div className="text-xs text-gray-500">Idle</div>
            </div>
          </div>
        </div>

        {/* Usuários Online */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Usuários Online
          </h2>

          <div className="space-y-3">
            {testUsers.map(user => (
              <div 
                key={user.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  user.id === currentUser ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    user.status === 'online' ? 'bg-green-500' :
                    user.status === 'busy' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`} />
                  <span className="font-medium text-gray-800">
                    {user.name}
                    {user.id === currentUser && ' (Você)'}
                  </span>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  user.status === 'online' ? 'bg-green-100 text-green-800' :
                  user.status === 'busy' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-gray-100 text-gray-600'
                }`}>
                  {user.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Debug Info */}
        <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm">
          <h3 className="text-white mb-2">Debug Info</h3>
          <div className="space-y-1">
            <div>Current User: {currentUser}</div>
            <div>Target User: {targetUser}</div>
            <div>Room ID: {roomId}</div>
            <div>Call Status: {showCallInterface ? 'active' : 'idle'}</div>
            <div>WebRTC Support: {typeof RTCPeerConnection !== 'undefined' ? '✅' : '❌'}</div>
            <div>getUserMedia Support: {navigator?.mediaDevices?.getUserMedia ? '✅' : '❌'}</div>
          </div>
        </div>

        {/* Instruções */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📋 Como Testar
          </h2>
          
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">1</span>
              <p>Abra esta página em duas abas diferentes do navegador</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">2</span>
              <p>Na primeira aba, selecione "Usuário 1" como atual e "Usuário 2" como destino</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">3</span>
              <p>Na segunda aba, selecione "Usuário 2" como atual e "Usuário 1" como destino</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">4</span>
              <p>Use o mesmo Room ID nas duas abas</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">5</span>
              <p>Clique em "Iniciar Teste de Chamada" em uma das abas</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">6</span>
              <p>Na outra aba, aceite a chamada quando aparecer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
