'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/local-auth-context'
import { EditProfileForm } from '@/components/EditProfileForm';
import { NotificationSettings } from '@/components/notifications/notification-settings';
import { WhatsAppConfig } from '@/components/profile/whatsapp-config';
import { SocialConfig } from '@/components/profile/social-config';
import { SoundSettings } from '@/components/profile/sound-settings';
// Temporarily disabled complex theme components
// import { AppearanceCustomizer } from '@/components/ui/appearance-customizer';
// import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Settings, ArrowLeft, User, Bell, MessageSquare, Globe, Volume2, Palette } from 'lucide-react';
import Link from 'next/link';

const ConfiguracoesPage: React.FC = () => {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'perfil' | 'aparencia' | 'privacidade' | 'notificacoes' | 'sons' | 'whatsapp' | 'social'>('perfil');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !user) {
      router.push('/login');
    }
  }, [mounted, user, router]);

  if (!mounted || !user) {
    return null;
  }

  const handleProfileUpdateSuccess = () => {
    alert('Perfil atualizado com sucesso!');
    router.push(`/perfil/${profile?.username || user.id}`);
  };

  const tabs = [
    { id: 'perfil' as const, label: 'Perfil', icon: User },
    { id: 'aparencia' as const, label: 'Aparência', icon: Palette },
    { id: 'privacidade' as const, label: 'Privacidade', icon: Settings },
    { id: 'notificacoes' as const, label: 'Notificações', icon: Bell },
    { id: 'sons' as const, label: 'Sons', icon: Volume2 },
    { id: 'whatsapp' as const, label: 'WhatsApp', icon: MessageSquare },
    { id: 'social' as const, label: 'Redes Sociais', icon: Globe }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-pink-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Settings size={32} />
            Configurações
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie suas informações pessoais e configurações de privacidade
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar de navegação */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="font-bold text-gray-800 mb-4">Menu</h2>
              <nav className="space-y-2">
                {tabs.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-purple-100 text-purple-700 border-l-4 border-purple-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon size={18} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Conteúdo principal */}
          <div className="lg:col-span-3">
            {activeTab === 'perfil' && (
              <div>
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    Editar Perfil
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Atualize suas informações pessoais e configure como outros usuários podem encontrá-lo.
                  </p>
                </div>

                <EditProfileForm
                  onSuccess={handleProfileUpdateSuccess}
                  onCancel={() => router.back()}
                />
              </div>
            )}

            {activeTab === 'aparencia' && (
              <div>
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    Personalizar Aparência
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Customize o visual do seu Orkut com temas, papéis de parede e cores personalizadas - igual ao Google Chrome!
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-1">Tema Simplificado</h3>
                      <p className="text-sm text-gray-600">Atualmente usando tema light padrão</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600">
                        Tema Light Ativo
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    📝 Personalizações de tema foram temporariamente simplificadas para melhorar a estabilidade.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'privacidade' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Configurações de Privacidade
                </h2>
                <div className="space-y-6">
                  <div className="text-center py-8 text-gray-500">
                    <p>As configurações de privacidade estão incluídas na edição do perfil.</p>
                    <button
                      onClick={() => setActiveTab('perfil')}
                      className="text-purple-600 hover:text-purple-800 underline mt-2"
                    >
                      Ir para Editar Perfil
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notificacoes' && (
              <div>
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    Configurações de Notificações
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Personalize como e quando você quer receber notificações sobre atividades na sua rede social.
                  </p>
                </div>
                
                <NotificationSettings />
              </div>
            )}

            {activeTab === 'sons' && (
              <div>
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    Configurações de Som
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Personalize os sons das notificações e interações do site. Relive a nostalgia dos sons clássicos do MSN!
                  </p>
                </div>
                
                <SoundSettings />
              </div>
            )}

            {activeTab === 'whatsapp' && (
              <div>
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    Configurações do WhatsApp
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Configure seus links personalizados do WhatsApp para receber chamadas diretas e gerenciar grupos.
                  </p>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg">
                  <WhatsAppConfig 
                    inSettingsPage={true}
                    className="border-0 shadow-none"
                  />
                </div>
              </div>
            )}

            {activeTab === 'social' && (
              <div>
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    Redes Sociais
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Configure seus perfis em redes sociais para que outros usuários possam te encontrar e se conectar com você.
                  </p>
                </div>
                
                <div className="bg-white rounded-xl shadow-lg">
                  <SocialConfig 
                    inSettingsPage={true}
                    className="border-0 shadow-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracoesPage;
