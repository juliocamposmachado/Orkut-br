'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WhatsAppConfig } from '@/components/profile/whatsapp-config';
import { WhatsAppCallButton, WhatsAppCallIcons, WhatsAppBadge } from '@/components/WhatsAppCallButton';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { MessageCircle, Phone, Video, Loader2 } from 'lucide-react';

export const WhatsAppTestPage: React.FC = () => {
  const { config, loading, error, isEnabled, hasVoiceLink, hasVideoLink } = useWhatsApp();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            <span>Teste da Integração WhatsApp</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Status da configuração */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-sm mb-2">Status da Configuração:</h3>
            
            {loading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-600">Carregando...</span>
              </div>
            ) : error ? (
              <Badge variant="destructive">Erro: {error}</Badge>
            ) : (
              <div className="space-y-2">
                <Badge variant={isEnabled ? "default" : "secondary"}>
                  WhatsApp: {isEnabled ? "Habilitado" : "Desabilitado"}
                </Badge>
                
                {isEnabled && (
                  <div className="flex space-x-2">
                    {hasVoiceLink && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <Phone className="h-3 w-3 mr-1" />
                        Voz Configurado
                      </Badge>
                    )}
                    
                    {hasVideoLink && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <Video className="h-3 w-3 mr-1" />
                        Vídeo Configurado
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dados da configuração */}
          {config && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-sm mb-2">Dados da Configuração:</h3>
              <pre className="text-xs bg-white p-2 rounded border overflow-auto">
{JSON.stringify({
  id: config.id,
  user_id: config.user_id,
  is_enabled: config.is_enabled,
  allow_calls: config.allow_calls,
  has_voice_link: !!config.voice_call_link,
  has_video_link: !!config.video_call_link,
  created_at: config.created_at,
  updated_at: config.updated_at
}, null, 2)}
              </pre>
            </div>
          )}

          {/* Exemplos de componentes */}
          {isEnabled && (config?.voice_call_link || config?.video_call_link) && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-sm mb-3">Exemplos de Componentes:</h3>
              
              <div className="space-y-4">
                {/* Botão principal */}
                <div>
                  <p className="text-xs text-gray-600 mb-2">Botão Principal:</p>
                  <WhatsAppCallButton 
                    userConfig={config}
                    size="default"
                    variant="default"
                  />
                </div>

                {/* Botões separados */}
                <div>
                  <p className="text-xs text-gray-600 mb-2">Botões Separados:</p>
                  <WhatsAppCallButton 
                    userConfig={config}
                    size="default"
                    variant="outline"
                    showBoth={true}
                  />
                </div>

                {/* Ícones compactos */}
                <div>
                  <p className="text-xs text-gray-600 mb-2">Ícones Compactos:</p>
                  <WhatsAppCallIcons 
                    userConfig={config}
                    size={20}
                  />
                </div>

                {/* Badge */}
                <div>
                  <p className="text-xs text-gray-600 mb-2">Badge:</p>
                  <WhatsAppBadge userConfig={config} />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Componente de configuração */}
      <WhatsAppConfig 
        isOwnProfile={true}
        className="max-w-2xl"
      />
    </div>
  );
};

export default WhatsAppTestPage;
