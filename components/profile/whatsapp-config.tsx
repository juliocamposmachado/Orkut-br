'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Phone, 
  Video, 
  MessageSquare, 
  ExternalLink, 
  Check, 
  AlertCircle, 
  Info,
  Copy,
  Share,
  Settings,
  Loader2
} from 'lucide-react';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { toast } from 'sonner';

interface WhatsAppConfigProps {
  className?: string;
  isOwnProfile?: boolean;
  profileId?: string;
}

export const WhatsAppConfig: React.FC<WhatsAppConfigProps> = ({ 
  className = "", 
  isOwnProfile = false 
}) => {
  const {
    config,
    loading,
    saving,
    error,
    saveConfig,
    disableWhatsApp,
    validateWhatsAppLink,
    getExampleLinks,
    clearError
  } = useWhatsApp();
  
  const [localSettings, setLocalSettings] = useState({
    voice_link: '',
    video_link: '',
    enabled: false
  });

  // Sincronizar configuração com estado local
  React.useEffect(() => {
    if (config) {
      setLocalSettings({
        voice_link: config.voice_call_link || '',
        video_link: config.video_call_link || '',
        enabled: config.is_enabled || false
      });
    }
  }, [config]);

  const saveWhatsAppSettings = async () => {
    try {
      await saveConfig({
        is_enabled: localSettings.enabled,
        allow_calls: true,
        voice_call_link: localSettings.voice_link || undefined,
        video_call_link: localSettings.video_link || undefined
      });
      
      toast.success('✅ Configurações do WhatsApp salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações WhatsApp:', error);
      toast.error('❌ Erro ao salvar configurações. Tente novamente.');
    }
  };


  const handleLinkChange = (type: 'voice' | 'video', value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      [`${type}_link`]: value
    }));
  };

  const copyExampleLink = (type: 'voice' | 'video') => {
    const examples = getExampleLinks();
    const exampleLink = type === 'voice' ? examples.voice : examples.video;
    
    navigator.clipboard.writeText(exampleLink);
    toast.info(`Link de exemplo copiado! Cole no campo ${type === 'voice' ? 'Voz' : 'Vídeo'} e substitua SEU_CODIGO_AQUI pelo seu código real.`);
  };

  if (!isOwnProfile) {
    return null; // Só mostra para o próprio perfil
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-5 w-5 text-green-600" />
          <CardTitle className="text-lg">Configurações do WhatsApp</CardTitle>
        </div>
        <CardDescription>
          Configure seus links personalizados do WhatsApp para receber chamadas diretas
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Mostrar erro se houver */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearError}
                className="text-red-600 hover:text-red-700"
              >
                ✕
              </Button>
            </div>
          </div>
        )}
        
        {/* Switch principal */}
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-5 w-5 text-green-600" />
            <div>
              <Label className="text-sm font-medium">Habilitar Chamadas WhatsApp</Label>
              <p className="text-xs text-gray-600">
                Permitir que outros usuários te liguem pelo WhatsApp
              </p>
            </div>
          </div>
          <Switch 
            checked={localSettings.enabled}
            disabled={loading || saving}
            onCheckedChange={(enabled) => setLocalSettings(prev => ({ ...prev, enabled }))}
          />
        </div>

        {localSettings.enabled && (
          <>
            <Separator />
            
            {/* Como gerar links */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Info className="h-4 w-4 text-blue-600" />
                <Label className="text-sm font-medium text-blue-800">Como gerar seus links WhatsApp:</Label>
              </div>
              
              <ol className="text-xs text-blue-700 space-y-2 ml-4">
                <li>1. Abra o WhatsApp no celular</li>
                <li>2. Vá em <strong>Configurações → Ligações</strong></li>
                <li>3. Toque em <strong>"Criar link de ligação"</strong></li>
                <li>4. Escolha <strong>Vídeo</strong> ou <strong>Voz</strong></li>
                <li>5. Copie o link gerado e cole aqui</li>
              </ol>
              
              <div className="mt-3 flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => copyExampleLink('voice')}
                  className="text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copiar exemplo Voz
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => copyExampleLink('video')}
                  className="text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copiar exemplo Vídeo
                </Button>
              </div>
            </div>

            {/* Campo para link de voz */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-green-600" />
                <Label htmlFor="voice_link" className="text-sm font-medium">
                  Link para Chamadas de Voz
                </Label>
              </div>
              <Input
                id="voice_link"
                type="url"
                placeholder="https://call.whatsapp.com/voice/SEU_CODIGO_AQUI"
                value={localSettings.voice_link}
                disabled={loading || saving}
                onChange={(e) => handleLinkChange('voice', e.target.value)}
                className={`text-sm ${
                  localSettings.voice_link && !validateWhatsAppLink(localSettings.voice_link, 'voice')
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-green-300 focus:border-green-500'
                }`}
              />
              {localSettings.voice_link && !validateWhatsAppLink(localSettings.voice_link, 'voice') && (
                <div className="flex items-center space-x-1 text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  <span className="text-xs">Link inválido. Use o formato correto do WhatsApp.</span>
                </div>
              )}
            </div>

            {/* Campo para link de vídeo */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Video className="h-4 w-4 text-green-600" />
                <Label htmlFor="video_link" className="text-sm font-medium">
                  Link para Chamadas de Vídeo
                </Label>
              </div>
              <Input
                id="video_link"
                type="url"
                placeholder="https://call.whatsapp.com/video/SEU_CODIGO_AQUI"
                value={localSettings.video_link}
                disabled={loading || saving}
                onChange={(e) => handleLinkChange('video', e.target.value)}
                className={`text-sm ${
                  localSettings.video_link && !validateWhatsAppLink(localSettings.video_link, 'video')
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-green-300 focus:border-green-500'
                }`}
              />
              {localSettings.video_link && !validateWhatsAppLink(localSettings.video_link, 'video') && (
                <div className="flex items-center space-x-1 text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  <span className="text-xs">Link inválido. Use o formato correto do WhatsApp.</span>
                </div>
              )}
            </div>

            {/* Preview dos links */}
            {(localSettings.voice_link || localSettings.video_link) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Preview dos seus links:
                </Label>
                <div className="space-y-2">
                  {localSettings.voice_link && validateWhatsAppLink(localSettings.voice_link, 'voice') && (
                    <div className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Chamada de Voz</span>
                        <Badge variant="outline" className="text-xs">Configurado</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(localSettings.voice_link, '_blank')}
                        className="text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Testar
                      </Button>
                    </div>
                  )}
                  
                  {localSettings.video_link && validateWhatsAppLink(localSettings.video_link, 'video') && (
                    <div className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-2">
                        <Video className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Chamada de Vídeo</span>
                        <Badge variant="outline" className="text-xs">Configurado</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(localSettings.video_link, '_blank')}
                        className="text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Testar
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        <Separator />

        {/* Botões de ação */}
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {loading ? (
              <div className="flex items-center space-x-1 text-blue-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Carregando...</span>
              </div>
            ) : localSettings.enabled ? (
              <div className="flex items-center space-x-1 text-green-600">
                <Check className="h-3 w-3" />
                <span>WhatsApp habilitado</span>
              </div>
            ) : (
              <span>WhatsApp desabilitado</span>
            )}
          </div>
          
          <Button 
            onClick={saveWhatsAppSettings}
            disabled={saving || loading}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Configurações'
            )}
          </Button>
        </div>

        {/* Aviso de privacidade */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-yellow-700">
              <p className="font-medium mb-1">Aviso de Privacidade:</p>
              <p>
                Seus links do WhatsApp serão visíveis apenas para usuários logados. 
                Não compartilhe estes links publicamente. Você pode desabilitar 
                esta funcionalidade a qualquer momento.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppConfig;
