'use client';

import React from 'react';
import { OrkutCard, OrkutCardContent, OrkutCardHeader } from '@/components/ui/orkut-card';
import { Button } from '@/components/ui/button';
import { 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Youtube, 
  Github,
  Globe,
  Music4,
  ExternalLink
} from 'lucide-react';

interface SocialNetwork {
  key: string;
  name: string;
  icon: React.ComponentType<any>;
  value: string;
  color: string;
  baseUrl: string;
}

interface SocialNetworksDisplayProps {
  socialData: {
    social_instagram?: string;
    social_facebook?: string;
    social_twitter?: string;
    social_linkedin?: string;
    social_youtube?: string;
    social_tiktok?: string;
    social_github?: string;
    social_website?: string;
  };
  className?: string;
}

const socialNetworks = [
  {
    key: 'social_instagram',
    name: 'Instagram',
    icon: Instagram,
    baseUrl: 'https://instagram.com/',
    color: 'text-pink-500'
  },
  {
    key: 'social_facebook',
    name: 'Facebook',
    icon: Facebook,
    baseUrl: 'https://facebook.com/',
    color: 'text-blue-600'
  },
  {
    key: 'social_twitter',
    name: 'Twitter/X',
    icon: Twitter,
    baseUrl: 'https://twitter.com/',
    color: 'text-sky-500'
  },
  {
    key: 'social_linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    baseUrl: 'https://linkedin.com/',
    color: 'text-blue-700'
  },
  {
    key: 'social_youtube',
    name: 'YouTube',
    icon: Youtube,
    baseUrl: 'https://youtube.com/',
    color: 'text-red-500'
  },
  {
    key: 'social_tiktok',
    name: 'TikTok',
    icon: Music4,
    baseUrl: 'https://tiktok.com/',
    color: 'text-pink-600'
  },
  {
    key: 'social_github',
    name: 'GitHub',
    icon: Github,
    baseUrl: 'https://github.com/',
    color: 'text-gray-700'
  },
  {
    key: 'social_website',
    name: 'Site',
    icon: Globe,
    baseUrl: '',
    color: 'text-green-600'
  }
];

export const SocialNetworksDisplay: React.FC<SocialNetworksDisplayProps> = ({ 
  socialData, 
  className = "" 
}) => {
  // Filtrar apenas as redes sociais que têm valores
  const activeSocialNetworks = socialNetworks.filter(network => {
    const value = socialData[network.key as keyof typeof socialData];
    return value && value.trim().length > 0;
  });

  // Se não há redes sociais configuradas, não renderizar o componente
  if (activeSocialNetworks.length === 0) {
    return null;
  }

  const formatUrl = (value: string, network: typeof socialNetworks[0]): string => {
    if (!value) return '';

    // Para website, validar se já tem protocolo
    if (network.key === 'social_website') {
      return value.startsWith('http') ? value : `https://${value}`;
    }

    // Se já é uma URL completa, usar como está
    if (value.startsWith('http')) {
      return value;
    }

    // Para LinkedIn, tratar formato especial
    if (network.key === 'social_linkedin' && !value.startsWith('in/')) {
      return `${network.baseUrl}in/${value}`;
    }

    // Para outros casos, concatenar com a base URL
    return `${network.baseUrl}${value}`;
  };

  return (
    <OrkutCard className={className}>
      <OrkutCardHeader>
        <div className="flex items-center space-x-2">
          <Globe className="h-4 w-4" />
          <span>Redes Sociais</span>
        </div>
      </OrkutCardHeader>
      <OrkutCardContent>
        <div className="grid grid-cols-1 gap-2">
          {activeSocialNetworks.map((network) => {
            const Icon = network.icon;
            const value = socialData[network.key as keyof typeof socialData] || '';
            const url = formatUrl(value, network);
            
            return (
              <div key={network.key} className="flex items-center justify-between p-2 rounded-lg hover:bg-purple-50 transition-colors">
                <div className="flex items-center space-x-2">
                  <Icon className={`h-4 w-4 ${network.color}`} />
                  <span className="text-sm font-medium text-gray-700">{network.name}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                  className="text-xs text-purple-600 hover:bg-purple-100"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Visitar
                </Button>
              </div>
            );
          })}
        </div>
      </OrkutCardContent>
    </OrkutCard>
  );
};
