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
  Users,
  Plus,
  Trash2,
  Loader2,
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/local-auth-context';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useOfflineSync } from '@/hooks/useOfflineSync';

interface WhatsAppConfigProps {
  className?: string;
  isOwnProfile?: boolean;
  profileId?: string;
  // Quando usado na página de configurações, sempre assume que é o próprio perfil
  inSettingsPage?: boolean;
}

interface WhatsAppGroup {
  name: string;
  link: string;
}

interface WhatsAppSettings {
  voice_call_link: string;
  video_call_link: string;
  whatsapp_phone: string;
  whatsapp_groups: WhatsAppGroup[];
  enabled: boolean;
}

export const WhatsAppConfig: React.FC<WhatsAppConfigProps> = ({ 
  className = "", 
  isOwnProfile = false,
  inSettingsPage = false
}) => {
  const { user } = useAuth();
  const { syncStatus, saveLocally, hasLocalData, loadLocalData, forcSync } = useOfflineSync();
  
  const [settings, setSettings] = useState<WhatsAppSettings>({
    voice_call_link: '',
    video_call_link: '',
    whatsapp_phone: '',
    whatsapp_groups: [],
    enabled: false
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasExistingConfig, setHasExistingConfig] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(false);

  // Carregar configurações existentes
  useEffect(() => {
    if (user && (isOwnProfile || inSettingsPage)) {
      loadWhatsAppSettings();
    }
  }, [user, isOwnProfile, inSettingsPage]);

  const loadWhatsAppSettings = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setHasExistingConfig(true);
        setSettings({
          voice_call_link: data.voice_call_link || '',
          video_call_link: data.video_call_link || '',
          whatsapp_phone: data.whatsapp_phone || '',
          whatsapp_groups: data.whatsapp_groups || [],
          enabled: data.is_enabled || false
        });
      } else {
        // Não há configuração existente
        setHasExistingConfig(false);
        setShowConfigForm(true); // Mostrar formulário para primeira configuração
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
      // Preparar dados para salvamento offline
      const whatsappData = {
        user_id: user.id,
        is_enabled: settings.enabled,
        allow_calls: true,
        voice_call_link: settings.voice_call_link || null,
        video_call_link: settings.video_call_link || null,
        whatsapp_phone: settings.whatsapp_phone || null,
        whatsapp_groups: settings.whatsapp_groups
      };
      
      // Salvar localmente primeiro
      await saveLocally('whatsapp', whatsappData);
      
      // Marcar que agora temos configuração existente
      setHasExistingConfig(true);
      setShowConfigForm(false); // Ocultar o formulário após salvar
      
    } catch (error) {
      console.error('Erro ao salvar configurações WhatsApp:', error);
      toast.error('❌ Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };


  const validateWhatsAppLink = (link: string, type: 'voice' | 'video' | 'group'): boolean => {
    if (!link) return true;
    if (type === 'voice') return /^https:\/\/call\.whatsapp\.com\/voice\/[A-Za-z0-9_-]+$/.test(link);
    if (type === 'video') return /^https:\/\/call\.whatsapp\.com\/video\/[A-Za-z0-9_-]+$/.test(link);
    if (type === 'group') return /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9_-]+$/.test(link);
    return false;
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true;
    return /^\d{8,15}$/.test(phone.replace(/\D/g, ''));
  };

  const addGroup = () => {
    if (settings.whatsapp_groups.length < 5) {
      setSettings(prev => ({
        ...prev,
        whatsapp_groups: [...prev.whatsapp_groups, { name: '', link: '' }]
      }));
    }
  };

  const removeGroup = (index: number) => {
    setSettings(prev => ({
      ...prev,
      whatsapp_groups: prev.whatsapp_groups.filter((_, i) => i !== index)
    }));
  };

  const updateGroup = (index: number, field: 'name' | 'link', value: string) => {
    setSettings(prev => ({
      ...prev,
      whatsapp_groups: prev.whatsapp_groups.map((group, i) => 
        i === index ? { ...group, [field]: value } : group
      )
    }));
  };

  const copyExampleLink = (type: 'voice' | 'video' | 'group') => {
    const examples = {
      voice: 'https://call.whatsapp.com/voice/SEU_CODIGO_AQUI',
      video: 'https://call.whatsapp.com/video/SEU_CODIGO_AQUI',
      group: 'https://chat.whatsapp.com/SEU_CODIGO_AQUI'
    };
    
    navigator.clipboard.writeText(examples[type]);
    toast.info(`Link de exemplo copiado! Substitua SEU_CODIGO_AQUI pelo código real.`);
  };

  if (!isOwnProfile && !inSettingsPage) {
    return null; // Só mostra para o próprio perfil ou na página de configurações
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
        {/* Status de conexão e sincronização */}
        {!syncStatus.isOnline && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <WifiOff className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-700">Modo offline - Dados serão salvos localmente</span>
              </div>
            </div>
          </div>
        )}
        
        {syncStatus.hasUnsyncedData && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CloudOff className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-700">Há dados aguardando sincronização</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={forcSync}
                disabled={syncStatus.isSyncing}
                className="text-xs"
              >
                {syncStatus.isSyncing ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Sincronizando
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Sincronizar
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-blue-700">Carregando configurações...</span>
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
            checked={settings.enabled}
            disabled={loading || saving}
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
                value={settings.voice_call_link}
                disabled={loading || saving}
                onChange={(e) => setSettings(prev => ({ ...prev, voice_call_link: e.target.value }))}
                className={`text-sm ${
                  settings.voice_call_link && !validateWhatsAppLink(settings.voice_call_link, 'voice')
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-green-300 focus:border-green-500'
                }`}
              />
              {settings.voice_call_link && !validateWhatsAppLink(settings.voice_call_link, 'voice') && (
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
                value={settings.video_call_link}
                disabled={loading || saving}
                onChange={(e) => setSettings(prev => ({ ...prev, video_call_link: e.target.value }))}
                className={`text-sm ${
                  settings.video_call_link && !validateWhatsAppLink(settings.video_call_link, 'video')
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-green-300 focus:border-green-500'
                }`}
              />
              {settings.video_call_link && !validateWhatsAppLink(settings.video_call_link, 'video') && (
                <div className="flex items-center space-x-1 text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  <span className="text-xs">Link inválido. Use o formato correto do WhatsApp.</span>
                </div>
              )}
            </div>

            {/* Campo para número do WhatsApp (mensagens) */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4 text-green-600" />
                <Label htmlFor="whatsapp_phone" className="text-sm font-medium">
                  Número do WhatsApp (Mensagens)
                </Label>
              </div>
              <Input
                id="whatsapp_phone"
                type="tel"
                placeholder="5511999887766 (apenas números)"
                value={settings.whatsapp_phone}
                disabled={loading || saving}
                onChange={(e) => setSettings(prev => ({ ...prev, whatsapp_phone: e.target.value.replace(/\D/g, '') }))}
                className={`text-sm ${
                  settings.whatsapp_phone && !validatePhone(settings.whatsapp_phone)
                    ? 'border-red-300 focus:border-red-500' 
                    : 'border-green-300 focus:border-green-500'
                }`}
              />
              {settings.whatsapp_phone && !validatePhone(settings.whatsapp_phone) && (
                <div className="flex items-center space-x-1 text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  <span className="text-xs">Número inválido. Use apenas números (ex: 5511999887766).</span>
                </div>
              )}
            </div>

            {/* Grupos do WhatsApp */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <Label className="text-sm font-medium">Grupos do WhatsApp</Label>
                  <Badge variant="secondary" className="text-xs">{settings.whatsapp_groups.length}/5</Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addGroup}
                  disabled={settings.whatsapp_groups.length >= 5 || loading || saving}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar Grupo
                </Button>
              </div>

              {settings.whatsapp_groups.map((group, index) => (
                <div key={index} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Grupo {index + 1}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeGroup(index)}
                      className="text-red-600 hover:text-red-700 p-1 h-6 w-6"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Nome do grupo"
                    value={group.name}
                    onChange={(e) => updateGroup(index, 'name', e.target.value)}
                    className="text-sm"
                    disabled={loading || saving}
                  />
                  <Input
                    placeholder="https://chat.whatsapp.com/SEU_CODIGO_AQUI"
                    value={group.link}
                    onChange={(e) => updateGroup(index, 'link', e.target.value)}
                    className={`text-sm ${
                      group.link && !validateWhatsAppLink(group.link, 'group')
                        ? 'border-red-300 focus:border-red-500' 
                        : 'border-green-300 focus:border-green-500'
                    }`}
                    disabled={loading || saving}
                  />
                  {group.link && !validateWhatsAppLink(group.link, 'group') && (
                    <div className="flex items-center space-x-1 text-red-600">
                      <AlertCircle className="h-3 w-3" />
                      <span className="text-xs">Link inválido. Use o formato: https://chat.whatsapp.com/CODIGO</span>
                    </div>
                  )}
                </div>
              ))}

              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => copyExampleLink('group')}
                className="text-xs w-full"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copiar exemplo de link de grupo
              </Button>
            </div>

            {/* Preview dos links */}
            {(settings.voice_call_link || settings.video_call_link || settings.whatsapp_phone || settings.whatsapp_groups.some(g => g.name && g.link)) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <Label className="text-sm font-medium text-gray-700 mb-3 block">
                  Preview dos seus links:
                </Label>
                <div className="space-y-2">
                  {settings.voice_call_link && validateWhatsAppLink(settings.voice_call_link, 'voice') && (
                    <div className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Chamada de Voz</span>
                        <Badge variant="outline" className="text-xs">Configurado</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(settings.voice_call_link, '_blank')}
                        className="text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Testar
                      </Button>
                    </div>
                  )}
                  
                  {settings.video_call_link && validateWhatsAppLink(settings.video_call_link, 'video') && (
                    <div className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-2">
                        <Video className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Chamada de Vídeo</span>
                        <Badge variant="outline" className="text-xs">Configurado</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(settings.video_call_link, '_blank')}
                        className="text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Testar
                      </Button>
                    </div>
                  )}

                  {settings.whatsapp_phone && validatePhone(settings.whatsapp_phone) && (
                    <div className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Mensagens (+{settings.whatsapp_phone.slice(0,2)} {settings.whatsapp_phone.slice(2,4)} {settings.whatsapp_phone.slice(4,9)}-{settings.whatsapp_phone.slice(9)})</span>
                        <Badge variant="outline" className="text-xs">Configurado</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`https://wa.me/${settings.whatsapp_phone}?text=Vim+do+Orkut,+Tudo+bem+?`, '_blank')}
                        className="text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Testar
                      </Button>
                    </div>
                  )}

                  {settings.whatsapp_groups.filter(g => g.name && g.link && validateWhatsAppLink(g.link, 'group')).map((group, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{group.name}</span>
                        <Badge variant="outline" className="text-xs">Grupo</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(group.link, '_blank')}
                        className="text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Entrar
                      </Button>
                    </div>
                  ))}
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
            ) : settings.enabled ? (
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
