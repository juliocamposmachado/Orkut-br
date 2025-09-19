'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/enhanced-auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  MessageCircle, 
  X,
  Users,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  message: string;
  created_at: string;
  is_system?: boolean;
}

interface CallChatProps {
  roomId: string;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export default function CallChat({ roomId, isOpen, onToggle, className = '' }: CallChatProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [participantsCount, setParticipantsCount] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  // Auto-scroll para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Configurar canal de chat em tempo real
  useEffect(() => {
    if (!roomId || !user) return;

    const channel = supabase.channel(`call-chat:${roomId}`, {
      config: {
        broadcast: {
          self: false, // Não receber próprias mensagens
        },
        presence: {
          key: user.id,
        },
      },
    });

    // Escutar novas mensagens
    channel.on('broadcast', { event: 'new-message' }, ({ payload }) => {
      console.log('📨 Nova mensagem de chat:', payload);
      setMessages(prev => [...prev, payload]);
      scrollToBottom();
    });

    // Escutar mudanças de presença (participantes)
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const participants = Object.keys(state).length;
      setParticipantsCount(participants);
      console.log('👥 Participantes na sala:', participants);
    });

    // Escutar entradas e saídas
    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('➡️ Usuário entrou na sala:', key);
      // Opcional: adicionar mensagem de sistema
    });

    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('⬅️ Usuário saiu da sala:', key);
      // Opcional: adicionar mensagem de sistema
    });

    // Subscribe ao canal
    channel.subscribe(async (status) => {
      console.log('📡 Chat channel status:', status);
      if (status === 'SUBSCRIBED') {
        // Entrar na presença
        await channel.track({
          user_id: user.id,
          user_name: profile?.display_name || profile?.username || 'Usuário',
          joined_at: new Date().toISOString(),
        });
      }
    });

    channelRef.current = channel;

    // Cleanup
    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [roomId, user, profile]);

  // Carregar mensagens iniciais
  useEffect(() => {
    if (!roomId) return;
    loadInitialMessages();
  }, [roomId]);

  // Auto-scroll quando mensagens mudam
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadInitialMessages = async () => {
    try {
      // Por enquanto, começamos com array vazio
      // Em produção, você poderia salvar mensagens no banco
      setMessages([
        {
          id: 'system-1',
          room_id: roomId,
          user_id: 'system',
          user_name: 'Sistema',
          message: '🎥 Bem-vindo ao chat da sala! Você pode conversar durante a chamada.',
          created_at: new Date().toISOString(),
          is_system: true,
        }
      ]);
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !profile || isLoading) return;

    setIsLoading(true);
    try {
      const messageData: ChatMessage = {
        id: `${user.id}-${Date.now()}`,
        room_id: roomId,
        user_id: user.id,
        user_name: profile?.display_name || profile?.username || 'Usuário',
        user_avatar: profile.avatar_url,
        message: newMessage.trim(),
        created_at: new Date().toISOString(),
      };

      // Adicionar localmente
      setMessages(prev => [...prev, messageData]);
      
      // Enviar via broadcast
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'new-message',
          payload: messageData,
        });
      }

      setNewMessage('');
      scrollToBottom();
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: ptBR,
    });
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
        size="lg"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 w-80 h-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-2xl">
        <div className="flex items-center space-x-2">
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">Chat da Sala</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="border-white/30 text-white">
            <Users className="w-3 h-3 mr-1" />
            {participantsCount}
          </Badge>
          
          <Button
            onClick={onToggle}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 w-8 h-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${
                message.user_id === user?.id ? 'items-end' : 'items-start'
              }`}
            >
              {message.is_system ? (
                <div className="text-center w-full">
                  <div className="inline-flex items-center px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-300">
                    {message.message}
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-2xl ${
                      message.user_id === user?.id
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                    }`}
                  >
                    {message.user_id !== user?.id && (
                      <div className="text-xs font-medium mb-1 opacity-70">
                        {message.user_name}
                      </div>
                    )}
                    <div className="text-sm break-words">{message.message}</div>
                  </div>
                  
                  <div className="flex items-center space-x-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatMessageTime(message.created_at)}</span>
                  </div>
                </>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            disabled={isLoading}
            className="flex-1 text-sm"
          />
          
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isLoading}
            size="sm"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
