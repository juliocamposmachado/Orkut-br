'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Youtube, 
  Github,
  Globe,
  Music4,
  Check, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/enhanced-auth-context';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useOfflineSync } from '@/hooks/useOfflineSync';

interface SocialConfigProps {
  className?: string;
  inSettingsPage?: boolean;
}

interface SocialSettings {
  social_instagram: string;
  social_facebook: string;
  social_twitter: string;
  social_linkedin: string;
  social_youtube: string;
  social_tiktok: string;
  social_github: string;
  social_website: string;
}

const socialNetworks = [
  {
    key: 'social_instagram' as keyof SocialSettings,
    name: 'Instagram',
    icon: Instagram,
    placeholder: 'seu_usuario_instagram',
    baseUrl: 'https://instagram.com/',
    color: 'text-pink-500'
  },
  {
    key: 'social_facebook' as keyof SocialSettings,
    name: 'Facebook',
    icon: Facebook,
    placeholder: 'seu.perfil.facebook',
    baseUrl: 'https://facebook.com/',
    color: 'text-blue-600'
  },
  {
    key: 'social_twitter' as keyof SocialSettings,
    name: 'Twitter/X',
    icon: Twitter,
    placeholder: 'seu_usuario_twitter',
    baseUrl: 'https://twitter.com/',
    color: 'text-sky-500'
  },
  {
    key: 'social_linkedin' as keyof SocialSettings,
    name: 'LinkedIn',
    icon: Linkedin,
    placeholder: 'in/seu-perfil-linkedin',
    baseUrl: 'https://linkedin.com/',
    color: 'text-blue-700'
  },
  {
    key: 'social_youtube' as keyof SocialSettings,
    name: 'YouTube',
    icon: Youtube,
    placeholder: '@seucanal ou c/SeuCanal',
    baseUrl: 'https://youtube.com/',
    color: 'text-red-500'
  },
  {
    key: 'social_tiktok' as keyof SocialSettings,
    name: 'TikTok',
    icon: Music4,
    placeholder: '@seu_usuario_tiktok',
    baseUrl: 'https://tiktok.com/',
    color: 'text-pink-600'
  },
  {
    key: 'social_github' as keyof SocialSettings,
    name: 'GitHub',
    icon: Github,
    placeholder: 'seu_usuario_github',
    baseUrl: 'https://github.com/',
    color: 'text-gray-700'
  },
  {
    key: 'social_website' as keyof SocialSettings,
    name: 'Site/Blog',
    icon: Globe,
    placeholder: 'https://seusite.com.br',
    baseUrl: '',
    color: 'text-green-600'
  }
];

export const SocialConfig: React.FC<SocialConfigProps> = ({ 
  className = "",
  inSettingsPage = false
}) => {
  const { user } = useAuth();
  const { syncStatus, saveLocally, hasLocalData, loadLocalData, forcSync } = useOfflineSync();
  
  const [settings, setSettings] = useState<SocialSettings>({
    social_instagram: '',
    social_facebook: '',
    social_twitter: '',
    social_linkedin: '',
    social_youtube: '',
    social_tiktok: '',
    social_github: '',
    social_website: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Carregar configurações existentes
  useEffect(() => {
    if (user && inSettingsPage) {
      loadSocialSettings();
    }
  }, [user, inSettingsPage]);

  const loadSocialSettings = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          social_instagram,
          social_facebook, 
          social_twitter,
          social_linkedin,
          social_youtube,
          social_tiktok,
          social_github,
          social_website
        `)
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setSettings({
          social_instagram: data.social_instagram || '',
          social_facebook: data.social_facebook || '',
          social_twitter: data.social_twitter || '',
          social_linkedin: data.social_linkedin || '',
          social_youtube: data.social_youtube || '',
          social_tiktok: data.social_tiktok || '',
          social_github: data.social_github || '',
          social_website: data.social_website || ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar redes sociais:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSocialSettings = async () => {
    if (!user?.id) return;
    
    setSaving(true);
    try {
      // Preparar dados para salvamento offline
      const socialData = {
        user_id: user.id,
        ...settings
      };
      
      // Salvar localmente primeiro
      await saveLocally('social', socialData);
      
    } catch (error) {
      console.error('Erro ao salvar redes sociais:', error);
      toast.error('❌ Erro ao salvar redes sociais.');
    } finally {
      setSaving(false);
    }
  };

  const validateUrl = (url: string, network: typeof socialNetworks[0]): boolean => {
    if (!url) return true; // URL vazia é válida

    // Para website, validar URL completa
    if (network.key === 'social_website') {
      return /^https?:\/\/.+\..+/.test(url);
    }

    // Para outras redes, aceitar tanto username quanto URL completa
    if (url.startsWith('http')) {
      return url.includes(network.baseUrl.replace('https://', '').replace('/', ''));
    }

    // Username simples é válido
    return url.length > 0 && !url.includes(' ');
  };

  const formatDisplayUrl = (value: string, network: typeof socialNetworks[0]): string => {
    if (!value) return '';

    if (network.key === 'social_website') {
      return value.startsWith('http') ? value : `https://${value}`;
    }

    if (value.startsWith('http')) {
      return value;
    }

    // Para LinkedIn, preservar formato especial
    if (network.key === 'social_linkedin' && !value.startsWith('in/')) {
      return `${network.baseUrl}in/${value}`;
    }

    return `${network.baseUrl}${value}`;
  };

  const getActiveSocialNetworks = () => {
    return socialNetworks.filter(network => 
      settings[network.key] && validateUrl(settings[network.key], network)
    );
  };

  if (!inSettingsPage) {
    return null;
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Globe className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Redes Sociais</CardTitle>
        </div>
        <CardDescription>
          Configure seus perfis em redes sociais para que outros usuários possam te encontrar
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
              <span className="text-sm text-blue-700">Carregando suas redes sociais...</span>
            </div>
          </div>
        )}

        {/* Campos das redes sociais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {socialNetworks.map((network) => {
            const Icon = network.icon;
            const value = settings[network.key];
            const isValid = validateUrl(value, network);
            
            return (
              <div key={network.key} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Icon className={`h-4 w-4 ${network.color}`} />
                  <Label htmlFor={network.key} className="text-sm font-medium">
                    {network.name}
                  </Label>
                </div>
                <Input
                  id={network.key}
                  type="text"
                  placeholder={network.placeholder}
                  value={value}
                  disabled={loading || saving}
                  onChange={(e) => setSettings(prev => ({ 
                    ...prev, 
                    [network.key]: e.target.value 
                  }))}
                  className={`text-sm ${
                    value && !isValid
                      ? 'border-red-300 focus:border-red-500' 
                      : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {value && !isValid && (
                  <div className="flex items-center space-x-1 text-red-600">
                    <AlertCircle className="h-3 w-3" />
                    <span className="text-xs">
                      {network.key === 'social_website' 
                        ? 'URL inválida. Use https://exemplo.com'
                        : 'Formato inválido. Use apenas o usuário ou URL completa'
                      }
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Preview das redes sociais */}
        {getActiveSocialNetworks().length > 0 && (
          <>
            <Separator />
            <div className="bg-gray-50 rounded-lg p-4">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Preview das suas redes sociais:
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {getActiveSocialNetworks().map((network) => {
                  const Icon = network.icon;
                  const value = settings[network.key];
                  const displayUrl = formatDisplayUrl(value, network);
                  
                  return (
                    <div key={network.key} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-2">
                        <Icon className={`h-4 w-4 ${network.color}`} />
                        <span className="text-sm font-medium">{network.name}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(displayUrl, '_blank', 'noopener,noreferrer')}
                        className="text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Visitar
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
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
            ) : getActiveSocialNetworks().length > 0 ? (
              <div className="flex items-center space-x-1 text-green-600">
                <Check className="h-3 w-3" />
                <span>{getActiveSocialNetworks().length} rede{getActiveSocialNetworks().length > 1 ? 's' : ''} configurada{getActiveSocialNetworks().length > 1 ? 's' : ''}</span>
              </div>
            ) : (
              <span>Nenhuma rede social configurada</span>
            )}
          </div>
          
          <Button 
            onClick={saveSocialSettings}
            disabled={saving || loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Redes Sociais'
            )}
          </Button>
        </div>

        {/* Dicas */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">💡 Dicas:</p>
              <ul className="space-y-1 ml-2">
                <li>• Você pode usar apenas o nome de usuário (ex: "meuperfil") ou a URL completa</li>
                <li>• Para LinkedIn, use o formato "in/seuperfil" ou apenas "seuperfil"</li>
                <li>• Para YouTube, você pode usar "@seucanal" ou "c/SeuCanal"</li>
                <li>• Para website, sempre inclua "https://" no início</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialConfig;
