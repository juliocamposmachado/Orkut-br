'use client';

import React, { useState, useEffect } from 'react';
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
  Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/enhanced-auth-context';
import { supabase } from '@/lib/supabase';

interface WhatsAppConfigProps {
  className?: string;
  isOwnProfile?: boolean;
  profileId?: string;
  currentConfig?: {
    whatsapp_enabled: boolean;
    whatsapp_voice_link: string;
    whatsapp_video_link: string;
  };
  onConfigUpdate?: (updatedConfig: {
    whatsapp_enabled: boolean;
    whatsapp_voice_link: string;
    whatsapp_video_link: string;
  }) => void;
}

interface WhatsAppSettings {
  voice_link: string;
  video_link: string;
  enabled: boolean;
}

export const WhatsAppConfig: React.FC<WhatsAppConfigProps> = ({ 
  className = "", 
  isOwnProfile = false 
}) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<WhatsAppSettings>({
    voice_link: '',
    video_link: '',
    enabled: false
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Carregar configurações existentes
  useEffect(() => {
    if (user && isOwnProfile) {
      loadWhatsAppSettings();
    }
  }, [user, isOwnProfile]);

  const loadWhatsAppSettings = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('whatsapp_voice_link, whatsapp_video_link, whatsapp_enabled')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setSettings({
          voice_link: data.whatsapp_voice_link || '',
          video_link: data.whatsapp_video_link || '',
          enabled: data.whatsapp_enabled || false
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações WhatsApp:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveWhatsAppSettings = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          whatsapp_voice_link: settings.voice_link || null,
          whatsapp_video_link: settings.video_link || null,
          whatsapp_enabled: settings.enabled
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      alert('✅ Configurações do WhatsApp salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações WhatsApp:', error);
      alert('❌ Erro ao salvar configurações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const validateWhatsAppLink = (link: string, type: 'voice' | 'video'): boolean => {
    if (!link) return true; // Link vazio é válido
    const pattern = new RegExp(`^https://call\\.whatsapp\\.com/${type}/[A-Za-z0-9_-]+$`);
    return pattern.test(link);
  };

  const handleLinkChange = (type: 'voice' | 'video', value: string) => {
    setSettings(prev => ({
      ...prev,
      [`${type}_link`]: value
    }));
  };

  const copyExampleLink = (type: 'voice' | 'video') => {
    const exampleLink = type === 'voice' 
      ? 'https://call.whatsapp.com/voice/SEU_CODIGO_AQUI'
      : 'https://call.whatsapp.com/video/SEU_CODIGO_AQUI';
    
    navigator.clipboard.writeText(exampleLink);
    alert(`Link de exemplo copiado! Cole no campo ${type === 'voice' ? 'Voz' : 'Vídeo'} e substitua SEU_CODIGO_AQUI pelo seu código real.`);
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
            checked={settings.enabled}
            onCheckedChange={(enabled) => setSettings(prev => ({ ...prev, enabled }))}
          />
        </div>

        {settings.enabled && (
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
                value={settings.voice_link}
                onChange={(e) => handleLinkChange('voice', e.target.value)}
                className={`text-sm ${
                  settings.voice_link && !validateWhatsAppLink(settings.voice_link, 'voice')
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-green-300 focus:border-green-500'
                }`}
              />
              {settings.voice_link && !validateWhatsAppLink(settings.voice_link, 'voice') && (
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
                value={settings.video_link}
                onChange={(e) => handleLinkChange('video', e.target.value)}
                className={`text-sm ${
                  settings.video_link && !validateWhatsAppLink(settings.video_link, 'video')
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-green-300 focus:border-green-500'
                }`}
              />
              {settings.video_link && !validateWhatsAppLink(settings.video_link, 'video') && (
                <div className="flex items-center space-x-1 text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  <span className="text-xs">Link inválido. Use o formato correto do WhatsApp.</span>
                </div>
              )}
            </div>

            {/* Preview dos links */}
            {(settings.voice_link || settings.video_link) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Preview dos seus links:
                </Label>
                <div className="space-y-2">
                  {settings.voice_link && validateWhatsAppLink(settings.voice_link, 'voice') && (
                    <div className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Chamada de Voz</span>
                        <Badge variant="outline" className="text-xs">Configurado</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(settings.voice_link, '_blank')}
                        className="text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Testar
                      </Button>
                    </div>
                  )}
                  
                  {settings.video_link && validateWhatsAppLink(settings.video_link, 'video') && (
                    <div className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-2">
                        <Video className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Chamada de Vídeo</span>
                        <Badge variant="outline" className="text-xs">Configurado</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(settings.video_link, '_blank')}
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
            {settings.enabled ? (
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
            {saving ? 'Salvando...' : 'Salvar Configurações'}
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
