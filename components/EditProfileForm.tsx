import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/enhanced-auth-context'
import { usePhoneValidation } from './WhatsAppButton';
import { User, Mail, Phone, MessageCircle, Shield, Check, X, Loader } from 'lucide-react';

interface EditProfileFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface ProfileData {
  name: string;
  username: string;
  email: string;
  phone: string;
  whatsapp_enabled: boolean;
  privacy_settings: {
    profile_visibility: 'public' | 'friends' | 'private';
    phone_visibility: 'public' | 'friends' | 'private';
    whatsapp_visible: boolean;
  };
}

export const EditProfileForm: React.FC<EditProfileFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const { user } = useAuth();
  const { validateBrazilianPhone, formatPhoneInput } = usePhoneValidation();
  
  const [formData, setFormData] = useState<ProfileData>({
    name: '',
    username: '',
    email: '',
    phone: '',
    whatsapp_enabled: true,
    privacy_settings: {
      profile_visibility: 'public',
      phone_visibility: 'friends',
      whatsapp_visible: true
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<ProfileData>>({});
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [originalUsername, setOriginalUsername] = useState('');

  // Carregar dados do perfil atual
  useEffect(() => {
    if (user) {
      loadCurrentProfile();
    }
  }, [user]);

  const loadCurrentProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          name: data.name || '',
          username: data.username || '',
          email: data.email || '',
          phone: data.phone || '',
          whatsapp_enabled: data.whatsapp_enabled ?? true,
          privacy_settings: data.privacy_settings || {
            profile_visibility: 'public',
            phone_visibility: 'friends',
            whatsapp_visible: true
          }
        });
        setOriginalUsername(data.username || '');
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  // Validar username em tempo real
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username === originalUsername) {
      setUsernameAvailable(null);
      return;
    }

    if (username.length < 3) {
      setUsernameAvailable(false);
      return;
    }

    setUsernameChecking(true);
    try {
      const { data, error } = await supabase
        .rpc('is_username_available', { username_param: username });

      if (error) throw error;
      setUsernameAvailable(data);
    } catch (error) {
      console.error('Erro ao verificar username:', error);
      setUsernameAvailable(false);
    } finally {
      setUsernameChecking(false);
    }
  };

  // Validar formulário
  const validateForm = (): boolean => {
    const newErrors: Partial<ProfileData> = {};

    // Nome obrigatório
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    // Username obrigatório e formato
    if (!formData.username.trim()) {
      newErrors.username = 'Username é obrigatório';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username deve ter pelo menos 3 caracteres';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'Username pode conter apenas letras, números, _ e -';
    } else if (formData.username !== originalUsername && usernameAvailable === false) {
      newErrors.username = 'Username já está em uso';
    }

    // Email obrigatório
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Telefone opcional, mas se preenchido deve ser válido
    if (formData.phone.trim()) {
      const phoneValidation = validateBrazilianPhone(formData.phone);
      if (!phoneValidation.isValid) {
        newErrors.phone = phoneValidation.message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Lidar com mudanças no formulário
  const handleInputChange = (field: keyof ProfileData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Verificar username
    if (field === 'username' && typeof value === 'string') {
      const cleanUsername = value.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '');
      setFormData(prev => ({ ...prev, username: cleanUsername }));
      
      const timeoutId = setTimeout(() => {
        checkUsernameAvailability(cleanUsername);
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }

    // Formatar telefone
    if (field === 'phone' && typeof value === 'string') {
      const formatted = formatPhoneInput(value);
      setFormData(prev => ({ ...prev, phone: formatted }));
    }
  };

  // Lidar com mudanças nas configurações de privacidade
  const handlePrivacyChange = (key: keyof ProfileData['privacy_settings'], value: any) => {
    setFormData(prev => ({
      ...prev,
      privacy_settings: {
        ...prev.privacy_settings,
        [key]: value
      }
    }));
  };

  // Salvar perfil
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name.trim(),
          username: formData.username.trim(),
          email: formData.email.trim(),
          phone: formData.phone.replace(/\D/g, '') || null,
          whatsapp_enabled: formData.whatsapp_enabled,
          privacy_settings: formData.privacy_settings
        })
        .eq('id', user?.id);

      if (error) throw error;

      onSuccess?.();
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all";
  const errorClassName = "text-red-500 text-sm mt-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações básicas */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <User size={20} />
          Informações Básicas
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome completo *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={inputClassName}
              placeholder="Seu nome completo"
            />
            {errors.name && <p className={errorClassName}>{errors.name}</p>}
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username *
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                className={inputClassName}
                placeholder="seu-username"
              />
              
              {usernameChecking && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader size={16} className="animate-spin text-gray-400" />
                </div>
              )}
              
              {!usernameChecking && formData.username && formData.username !== originalUsername && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {usernameAvailable ? (
                    <Check size={16} className="text-green-500" />
                  ) : (
                    <X size={16} className="text-red-500" />
                  )}
                </div>
              )}
            </div>
            
            {errors.username && <p className={errorClassName}>{errors.username}</p>}
            {formData.username && !errors.username && (
              <p className="text-sm text-gray-500 mt-1">
                Seu perfil ficará: orkut-br.vercel.app/perfil/{formData.username}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`${inputClassName} pl-10`}
                placeholder="seu@email.com"
              />
            </div>
            {errors.email && <p className={errorClassName}>{errors.email}</p>}
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefone (opcional)
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`${inputClassName} pl-10`}
                placeholder="(11) 99999-9999"
                maxLength={15}
              />
            </div>
            {errors.phone && <p className={errorClassName}>{errors.phone}</p>}
          </div>
        </div>
      </div>

      {/* Configurações do WhatsApp */}
      {formData.phone && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MessageCircle size={20} />
            WhatsApp
          </h3>

          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.whatsapp_enabled}
                onChange={(e) => handleInputChange('whatsapp_enabled', e.target.checked)}
                className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="text-gray-700">
                Permitir que outros usuários me contatem pelo WhatsApp
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Configurações de Privacidade */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Shield size={20} />
          Privacidade
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Visibilidade do perfil */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quem pode ver meu perfil?
            </label>
            <select
              value={formData.privacy_settings.profile_visibility}
              onChange={(e) => handlePrivacyChange('profile_visibility', e.target.value)}
              className={inputClassName}
            >
              <option value="public">Todos</option>
              <option value="friends">Apenas amigos</option>
              <option value="private">Apenas eu</option>
            </select>
          </div>

          {/* Visibilidade do telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quem pode ver meu telefone?
            </label>
            <select
              value={formData.privacy_settings.phone_visibility}
              onChange={(e) => handlePrivacyChange('phone_visibility', e.target.value)}
              className={inputClassName}
            >
              <option value="public">Todos</option>
              <option value="friends">Apenas amigos</option>
              <option value="private">Apenas eu</option>
            </select>
          </div>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        )}
        
        <button
          type="submit"
          disabled={loading || usernameChecking || (formData.username !== originalUsername && !usernameAvailable)}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </form>
  );
};
