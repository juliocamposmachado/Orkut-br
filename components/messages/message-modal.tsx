'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  X, 
  Send, 
  Smile, 
  Paperclip, 
  Phone, 
  Video, 
  MoreHorizontal,
  Check,
  CheckCheck
} from 'lucide-react';
import { useAuth } from '@/contexts/enhanced-auth-context';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface MessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: {
    id: string;
    name: string;
    username: string;
    photo?: string;
    isOnline?: boolean;
  };
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  isSent: boolean;
}

export const MessageModal: React.FC<MessageModalProps> = ({
  isOpen,
  onClose,
  targetUser
}) => {
  const { user: currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Carregar mensagens quando abre o modal
  useEffect(() => {
    if (isOpen && currentUser && targetUser.id) {
      loadConversation();
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, currentUser, targetUser.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Função para carregar ou criar conversa
  const loadConversation = async () => {
    if (!currentUser || !targetUser.id || !supabase) {
      // Modo fallback - usar mensagens simuladas
      setMessages([
        {
          id: '1',
          senderId: targetUser.id,
          content: `Olá! Como você está? 😊`,
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          isRead: true,
          isSent: true
        },
        {
          id: '2', 
          senderId: currentUser?.id || '',
          content: 'Oi! Estou bem, obrigado! E você?',
          timestamp: new Date(Date.now() - 1000 * 60 * 25),
          isRead: true,
          isSent: true
        }
      ]);
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Carregando conversa entre:', currentUser.id, 'e', targetUser.id);

      // Buscar conversa existente (em ambas as direções)
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(participant1_id.eq.${currentUser.id},participant2_id.eq.${targetUser.id}),and(participant1_id.eq.${targetUser.id},participant2_id.eq.${currentUser.id})`)
        .single();

      let convId = conversation?.id;

      // Se não existe, criar nova conversa
      if (!conversation || convError) {
        console.log('💬 Criando nova conversa...');
        const { data: newConv, error: createError } = await supabase
          .from('conversations')
          .insert({
            participant1_id: currentUser.id,
            participant2_id: targetUser.id
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Erro ao criar conversa:', createError);
          toast.error('Erro ao criar conversa');
          return;
        }
        
        convId = newConv.id;
        console.log('✅ Nova conversa criada:', convId);
      }

      setConversationId(convId);

      // Carregar mensagens da conversa
      if (convId) {
        await loadMessages(convId);
      }

    } catch (error) {
      console.error('❌ Erro ao carregar conversa:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  // Função para carregar mensagens
  const loadMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Erro ao carregar mensagens:', error);
        return;
      }

      if (data) {
        const formattedMessages: Message[] = data.map(msg => ({
          id: msg.id,
          senderId: msg.sender_id,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          isRead: msg.is_read,
          isSent: true
        }));

        setMessages(formattedMessages);
        console.log('✅', formattedMessages.length, 'mensagens carregadas');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar mensagens:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !currentUser) return;

    const messageContent = message.trim();
    const tempId = `temp_${Date.now()}`;

    const newMessage: Message = {
      id: tempId,
      senderId: currentUser.id,
      content: messageContent,
      timestamp: new Date(),
      isRead: false,
      isSent: false
    };

    // Adicionar mensagem imediatamente (otimistic UI)
    setMessages(prev => [...prev, newMessage]);
    setMessage('');

    // Enviar para o banco de dados
    if (supabase && conversationId) {
      try {
        console.log('📤 Enviando mensagem para o banco...');
        
        const { data, error } = await supabase
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: currentUser.id,
            recipient_id: targetUser.id,
            content: messageContent,
            message_type: 'text',
            is_read: false
          })
          .select()
          .single();

        if (error) {
          console.error('❌ Erro ao enviar mensagem:', error);
          toast.error('Erro ao enviar mensagem');
          
          // Remover mensagem da lista se houve erro
          setMessages(prev => prev.filter(msg => msg.id !== tempId));
          return;
        }

        if (data) {
          // Atualizar mensagem com ID real e marcar como enviada
          setMessages(prev => 
            prev.map(msg => 
              msg.id === tempId 
                ? { 
                    ...msg, 
                    id: data.id, 
                    isSent: true,
                    timestamp: new Date(data.created_at)
                  } 
                : msg
            )
          );
          
          console.log('✅ Mensagem enviada com sucesso!');
          
          // Disparar evento de nova mensagem para o destinatário
          const messageEvent = new CustomEvent('newMessageSent', {
            detail: {
              message: {
                id: data.id,
                content: messageContent,
                created_at: data.created_at,
                conversation_id: conversationId
              },
              sender: {
                id: currentUser.id,
                name: currentUser.display_name || currentUser.username,
                photo: currentUser.photo_url,
                username: currentUser.username
              },
              recipient: {
                id: targetUser.id,
                name: targetUser.name,
                photo: targetUser.photo,
                username: targetUser.username
              }
            }
          });
          
          window.dispatchEvent(messageEvent);
        }

      } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        toast.error('Erro ao enviar mensagem');
        
        // Remover mensagem da lista se houve erro
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
      }
    } else {
      // Modo fallback - simular envio
      console.log('⚠️ Modo fallback - simulando envio');
      
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId 
              ? { ...msg, isSent: true } 
              : msg
          )
        );

        // Simular resposta automática (apenas no modo fallback)
        if (Math.random() > 0.5) {
          setTimeout(() => {
            setIsTyping(true);
          }, 2000);

          setTimeout(() => {
            setIsTyping(false);
            const responses = [
              'Haha, interessante! 😄',
              'Verdade! Concordo contigo.',
              'Bacana! Vamos continuar conversando.',
              'Que legal! Me conta mais.',
              'Nossa, não sabia disso!',
              'Muito bom! 👍'
            ];
            
            const autoReply: Message = {
              id: (Date.now() + 1).toString(),
              senderId: targetUser.id,
              content: responses[Math.floor(Math.random() * responses.length)],
              timestamp: new Date(),
              isRead: true,
              isSent: true
            };
            
            setMessages(prev => [...prev, autoReply]);
          }, 3000);
        }
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: Date) => {
    const today = new Date();
    const messageDate = new Date(timestamp);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Hoje';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Ontem';
    }
    
    return messageDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md h-[600px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 border-2 border-white/20">
                <AvatarImage src={targetUser.photo} alt={targetUser.name} />
                <AvatarFallback className="bg-white/20 text-white font-bold">
                  {targetUser.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-white">{targetUser.name}</h3>
                <p className="text-sm text-white/80">
                  {targetUser.isOnline ? (
                    <>
                      <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1"></span>
                      Online agora
                    </>
                  ) : (
                    'Visto por último há 5 min'
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                className="p-2 text-white hover:bg-white/20 rounded-full"
                title="Chamada de áudio"
              >
                <Phone className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="p-2 text-white hover:bg-white/20 rounded-full"
                title="Chamada de vídeo"
              >
                <Video className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="p-2 text-white hover:bg-white/20 rounded-full"
                title="Mais opções"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="p-2 text-white hover:bg-white/20 rounded-full"
                onClick={onClose}
                title="Fechar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="space-y-4">
            {messages.map((msg, index) => {
              const isCurrentUser = msg.senderId === currentUser?.id;
              const showDate = index === 0 || 
                formatDate(msg.timestamp) !== formatDate(messages[index - 1].timestamp);

              return (
                <div key={msg.id}>
                  {/* Data separator */}
                  {showDate && (
                    <div className="text-center">
                      <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-500 shadow-sm border">
                        {formatDate(msg.timestamp)}
                      </span>
                    </div>
                  )}
                  
                  {/* Message */}
                  <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      isCurrentUser 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                        : 'bg-white border shadow-sm'
                    }`}>
                      <p className="text-sm break-words">{msg.content}</p>
                      <div className={`flex items-center justify-end mt-1 space-x-1 ${
                        isCurrentUser ? 'text-white/70' : 'text-gray-500'
                      }`}>
                        <span className="text-xs">{formatTime(msg.timestamp)}</span>
                        {isCurrentUser && (
                          <div>
                            {msg.isSent ? (
                              msg.isRead ? (
                                <CheckCheck className="h-3 w-3 text-green-300" />
                              ) : (
                                <CheckCheck className="h-3 w-3" />
                              )
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border shadow-sm px-4 py-2 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white border-t p-4">
          <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                className="w-full resize-none rounded-full border border-gray-300 px-4 py-2 pr-20 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent max-h-20"
                rows={1}
                style={{
                  minHeight: '40px',
                  height: 'auto'
                }}
              />
              <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="p-1 h-6 w-6 text-gray-400 hover:text-gray-600 rounded-full"
                  title="Emoji"
                >
                  <Smile className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="p-1 h-6 w-6 text-gray-400 hover:text-gray-600 rounded-full"
                  title="Anexar arquivo"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={!message.trim()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full p-2 h-10 w-10 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              title="Enviar mensagem"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
