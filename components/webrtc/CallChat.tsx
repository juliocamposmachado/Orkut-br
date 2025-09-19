'use client';

import { useState, useRef } from 'react';
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
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  currentUserName: string;
  className?: string;
}

export default function CallChat({ isOpen, onClose, currentUserId, currentUserName, className = '' }: CallChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'system-1',
      room_id: 'current-room',
      user_id: 'system',
      user_name: 'Sistema',
      message: '🎥 Bem-vindo ao chat da sala! Você pode conversar durante a chamada.',
      created_at: new Date().toISOString(),
      is_system: true,
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [participantsCount] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const messageData: ChatMessage = {
      id: `${currentUserId}-${Date.now()}`,
      room_id: 'current-room',
      user_id: currentUserId,
      user_name: currentUserName,
      message: newMessage.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, messageData]);
    setNewMessage('');
    setTimeout(scrollToBottom, 100);
    toast.success('💬 Mensagem enviada!');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
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
