'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/enhanced-auth-context'
import { EditProfileForm } from '@/components/EditProfileForm';
import { Settings, ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';

const ConfiguracoesPage: React.FC = () => {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'perfil' | 'privacidade' | 'notificacoes'>('perfil');
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
    { id: 'privacidade' as const, label: 'Privacidade', icon: Settings },
    { id: 'notificacoes' as const, label: 'Notificações', icon: Settings }
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
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Notificações
                </h2>
                <div className="space-y-6">
                  <div className="text-center py-8 text-gray-500">
                    <p>Configurações de notificações em breve.</p>
                    <p className="text-sm mt-2">
                      Em desenvolvimento: notificações push, email e configurações de chamadas.
                    </p>
                  </div>
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
