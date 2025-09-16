'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePasteDBAuth } from '@/contexts/pastedb-auth-context'
import { Eye, EyeOff, User, Mail, Lock, Loader2, Database, ExternalLink } from 'lucide-react';
import Link from 'next/link';

// Função para gerar username único
const generateUsername = (name: string): string => {
  // Remove acentos e caracteres especiais
  const cleanName = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]/g, '') // Remove tudo que não é letra ou número
    .substring(0, 12); // Limita a 12 caracteres

  // Adiciona números aleatórios para garantir unicidade
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  
  return `${cleanName}${randomSuffix}`;
};

const CadastroPasteDBPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedUsername, setGeneratedUsername] = useState<string>('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { signUp } = usePasteDBAuth();
  const router = useRouter();

  // Gera preview do username quando o nome muda
  React.useEffect(() => {
    if (formData.name.trim().length >= 2) {
      const previewUsername = generateUsername(formData.name);
      setGeneratedUsername(previewUsername);
    } else {
      setGeneratedUsername('');
    }
  }, [formData.name]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return false;
    }

    if (formData.name.trim().length < 2) {
      setError('Nome deve ter pelo menos 2 caracteres');
      return false;
    }

    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email inválido');
      return false;
    }

    if (!formData.password) {
      setError('Senha é obrigatória');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Senhas não conferem');
      return false;
    }

    if (!termsAccepted) {
      setError('Você deve aceitar os termos de uso e política de privacidade');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Gera username único
      const uniqueUsername = generateUsername(formData.name);
      console.log('Username gerado:', uniqueUsername);

      // Usa o contexto PasteDB para criar usuário
      await signUp(formData.email, formData.password, {
        username: uniqueUsername,
        displayName: formData.name
      });

      // Redireciona para o perfil do usuário criado
      router.push(`/perfil/${uniqueUsername}`);

    } catch (error: any) {
      console.error('Erro no cadastro PasteDB:', error);
      
      if (error.message.includes('já está em uso')) {
        setError('Email ou username já está em uso');
      } else if (error.message.includes('password')) {
        setError('Senha muito fraca');
      } else {
        setError(error.message || 'Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Database className="h-12 w-12 text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">PasteDB</h1>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Criar conta no Orkut
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sistema descentralizado usando{' '}
            <a href="https://dpaste.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 inline-flex items-center">
              dpaste.org
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </p>
          <div className="mt-2 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800">
              ✨ <strong>Banco 100% descentralizado:</strong> Seus dados são armazenados de forma distribuída, 
              sem dependência de grandes corporações!
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Nome */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nome completo
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Seu nome completo"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              {generatedUsername && (
                <p className="mt-2 text-sm text-gray-600">
                  Seu username será: <span className="font-medium text-blue-600">@{generatedUsername}...</span>
                  <span className="text-xs text-gray-500"> (gerado automaticamente)</span>
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none relative block w-full px-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="appearance-none relative block w-full px-10 pr-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirmar Senha */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar senha
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="appearance-none relative block w-full px-10 pr-10 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Confirme sua senha"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Informações avançadas */}
            <div className="border-t pt-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                {showAdvanced ? 'Ocultar' : 'Mostrar'} detalhes técnicos
              </button>
              
              {showAdvanced && (
                <div className="mt-3 p-4 bg-gray-50 rounded-lg text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Banco de dados:</span>
                    <span>Descentralizado (PasteDB)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Serviço principal:</span>
                    <span>dpaste.org</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Hash de senhas:</span>
                    <span>PBKDF2 (100k iterações)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Sessões:</span>
                    <span>30 dias</span>
                  </div>
                </div>
              )}
            </div>

            {/* Checkbox dos termos */}
            <div className="flex items-start">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
              />
              <label htmlFor="terms" className="ml-3 text-sm text-gray-700">
                Eu aceito os{' '}
                <a 
                  href="/terms" 
                  target="_blank" 
                  className="font-medium text-blue-600 hover:text-blue-500 underline"
                >
                  Termos de Uso
                </a>
                {' '}e a{' '}
                <a 
                  href="/privacy" 
                  target="_blank" 
                  className="font-medium text-blue-600 hover:text-blue-500 underline"
                >
                  Política de Privacidade
                </a>
              </label>
            </div>

            {/* Erro */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Botão de submit */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Criando no banco descentralizado...
                  </>
                ) : (
                  <>
                    <Database className="h-5 w-5 mr-2" />
                    Criar conta no PasteDB
                  </>
                )}
              </button>
            </div>

            {/* Link para login */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{' '}
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Fazer login
                </Link>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Ou usar o{' '}
                <Link href="/cadastro" className="font-medium text-purple-600 hover:text-purple-500">
                  sistema tradicional
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CadastroPasteDBPage;
