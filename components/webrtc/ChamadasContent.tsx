'use client';
// Updated for Vercel deployment - 2025-09-19
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/enhanced-auth-context';
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Video, 
  Phone, 
  Users, 
  UserPlus, 
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function ChamadasContent() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleCreateRoom = async (type: 'individual' | 'group') => {
    setIsCreating(true);
    try {
      const newRoomId = generateRoomId();
      
      // Log da criação da sala
      console.log(`🎥 Criando sala ${type}: ${newRoomId}`);
      
      // Navegar para a sala como host
      router.push(`/chamadas/${newRoomId}?type=${type}&host=true`);
      
      // Mostrar toast de sucesso
      toast.success(`${type === 'individual' ? '📞' : '👥'} Sala criada com sucesso!`, {
        description: `ID: ${newRoomId}`
      });
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      toast.error('Erro ao criar sala. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      router.push(`/chamadas/${roomId.trim()}`);
    } else {
      toast.error('Digite um ID de sala válido');
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Video className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Central de Chamadas
        </h1>
        <p className="text-gray-600 text-lg">
          Conecte-se com seus amigos através de chamadas de vídeo e áudio
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Criar Nova Sala */}
        <OrkutCard>
          <OrkutCardHeader>
            <div className="flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-purple-600" />
              <span className="text-lg font-semibold">Criar Nova Sala</span>
            </div>
          </OrkutCardHeader>
          <OrkutCardContent className="space-y-6">
            {/* Chamada Individual */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-800 flex items-center space-x-2">
                <Phone className="h-4 w-4 text-green-600" />
                <span>Transmissão Individual</span>
              </h3>
              <p className="text-sm text-gray-600">
                Fique online e aguarde um amigo entrar na sua sala
              </p>
              <Button
                onClick={() => handleCreateRoom('individual')}
                disabled={isCreating}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <Phone className="h-4 w-4 mr-2" />
                {isCreating ? 'Criando...' : 'Começar Transmissão'}
              </Button>
            </div>

            <div className="border-t pt-6">
              {/* Chamada em Grupo */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-800 flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>Streaming em Grupo</span>
                </h3>
                <p className="text-sm text-gray-600">
                  Fique online e permita que vários amigos entrem na sala
                </p>
                <Button
                  onClick={() => handleCreateRoom('group')}
                  disabled={isCreating}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  <Users className="h-4 w-4 mr-2" />
                  {isCreating ? 'Criando...' : 'Iniciar Streaming'}
                </Button>
              </div>
            </div>
          </OrkutCardContent>
        </OrkutCard>

        {/* Entrar em Sala Existente */}
        <OrkutCard>
          <OrkutCardHeader>
            <div className="flex items-center space-x-2">
              <Video className="h-5 w-5 text-purple-600" />
              <span className="text-lg font-semibold">Entrar em Sala</span>
            </div>
          </OrkutCardHeader>
          <OrkutCardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-2">
                  ID da Sala
                </label>
                <Input
                  type="text"
                  id="roomId"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Digite o ID da sala para entrar"
                  className="w-full"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleJoinRoom();
                    }
                  }}
                />
              </div>
              
              <Button
                onClick={handleJoinRoom}
                disabled={!roomId.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                size="lg"
              >
                <Video className="h-4 w-4 mr-2" />
                Entrar na Sala
              </Button>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-800 mb-3">Como funciona:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Cole o ID da sala que você recebeu</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Clique em "Entrar na Sala"</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Permita o acesso à câmera e microfone</span>
                </li>
              </ul>
            </div>
          </OrkutCardContent>
        </OrkutCard>
      </div>

      {/* Recursos e Informações */}
      <div className="mt-8">
        <OrkutCard>
          <OrkutCardHeader>
            <span className="text-lg font-semibold">Recursos Disponíveis</span>
          </OrkutCardHeader>
          <OrkutCardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Video className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-medium text-gray-800 mb-2">HD Video</h3>
                <p className="text-sm text-gray-600">
                  Chamadas de vídeo em alta definição com qualidade superior
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Phone className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-800 mb-2">Áudio Cristalino</h3>
                <p className="text-sm text-gray-600">
                  Áudio nítido com cancelamento de ruído automático
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-medium text-gray-800 mb-2">Múltiplos Usuários</h3>
                <p className="text-sm text-gray-600">
                  Suporte para chamadas em grupo com vários participantes
                </p>
              </div>
            </div>
          </OrkutCardContent>
        </OrkutCard>
      </div>

      {/* Dicas de Uso */}
      <div className="mt-8">
        <OrkutCard>
          <OrkutCardHeader>
            <span className="text-lg font-semibold">💡 Dicas para uma melhor experiência</span>
          </OrkutCardHeader>
          <OrkutCardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-yellow-600 text-sm font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Use uma boa conexão de internet</h4>
                  <p className="text-sm text-gray-600">Para melhor qualidade de vídeo e áudio</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-yellow-600 text-sm font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Teste seu equipamento</h4>
                  <p className="text-sm text-gray-600">Verifique se sua câmera e microfone estão funcionando</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-yellow-600 text-sm font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800">Compartilhe o link</h4>
                  <p className="text-sm text-gray-600">Use os botões de compartilhar para convidar amigos</p>
                </div>
              </div>
            </div>
          </OrkutCardContent>
        </OrkutCard>
      </div>
    </div>
  );
}

// Named export for compatibility
export { ChamadasContent };
export const ChamadasContentComponent = ChamadasContent;
