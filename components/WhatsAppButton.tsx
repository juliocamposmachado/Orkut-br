import React from 'react';
import { MessageCircle, Phone } from 'lucide-react';

interface WhatsAppButtonProps {
  phone: string;
  name?: string;
  message?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'compact' | 'icon-only';
  disabled?: boolean;
  className?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  phone,
  name,
  message,
  size = 'medium',
  variant = 'default',
  disabled = false,
  className = ''
}) => {
  // Limpar e formatar número de telefone
  const formatPhoneNumber = (phone: string): string => {
    // Remove todos os caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Se não começar com código do país, assumir Brasil (+55)
    if (cleaned.length === 11 || cleaned.length === 10) {
      return `55${cleaned}`;
    }
    
    return cleaned;
  };

  // Gerar mensagem padrão
  const getDefaultMessage = (): string => {
    const userName = name || 'amigo';
    return `Olá ${userName}! Vi seu perfil no Orkut.br e gostaria de conversar! 😊`;
  };

  // Gerar URL do WhatsApp
  const generateWhatsAppUrl = (): string => {
    const formattedPhone = formatPhoneNumber(phone);
    const finalMessage = message || getDefaultMessage();
    const encodedMessage = encodeURIComponent(finalMessage);
    
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  };

  // Abrir WhatsApp
  const openWhatsApp = () => {
    if (disabled || !phone) return;
    
    const url = generateWhatsAppUrl();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Estilos baseados no tamanho
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base'
  };

  // Estilos baseados na variante
  const getVariantClasses = () => {
    const base = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
    
    switch (variant) {
      case 'compact':
        return `${base} bg-green-500 hover:bg-green-600 text-white focus:ring-green-500`;
      case 'icon-only':
        return `${base} bg-green-500 hover:bg-green-600 text-white focus:ring-green-500 aspect-square`;
      default:
        return `${base} bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl focus:ring-green-500`;
    }
  };

  // Não renderizar se não houver telefone
  if (!phone) return null;

  const buttonClasses = `
    ${getVariantClasses()}
    ${sizeClasses[size]}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `;

  return (
    <button
      onClick={openWhatsApp}
      disabled={disabled}
      className={buttonClasses}
      title={`Conversar com ${name || 'usuário'} no WhatsApp`}
      type="button"
    >
      <MessageCircle 
        size={size === 'small' ? 14 : size === 'large' ? 20 : 16} 
        className="mr-2"
      />
      
      {variant !== 'icon-only' && (
        <span>
          {variant === 'compact' ? 'WhatsApp' : 'Conversar no WhatsApp'}
        </span>
      )}
    </button>
  );
};

// Componente para link de telefone simples
export const PhoneLink: React.FC<{
  phone: string;
  className?: string;
  showIcon?: boolean;
}> = ({ phone, className = '', showIcon = true }) => {
  if (!phone) return null;

  const formatDisplayPhone = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 11) {
      // (XX) 9XXXX-XXXX
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)}${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      // (XX) XXXX-XXXX
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    
    return phone;
  };

  const handleClick = () => {
    const cleaned = phone.replace(/\D/g, '');
    window.open(`tel:+55${cleaned}`, '_self');
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors ${className}`}
      title={`Ligar para ${formatDisplayPhone(phone)}`}
    >
      {showIcon && <Phone size={16} className="mr-1" />}
      <span>{formatDisplayPhone(phone)}</span>
    </button>
  );
};

// Hook personalizado para validar número de telefone brasileiro
export const usePhoneValidation = () => {
  const validateBrazilianPhone = (phone: string): { isValid: boolean; message: string } => {
    if (!phone) {
      return { isValid: false, message: 'Telefone é obrigatório' };
    }

    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length < 10) {
      return { isValid: false, message: 'Telefone deve ter pelo menos 10 dígitos' };
    }
    
    if (cleaned.length > 11) {
      return { isValid: false, message: 'Telefone deve ter no máximo 11 dígitos' };
    }
    
    if (cleaned.length === 11 && !cleaned.startsWith('11') && cleaned[2] !== '9') {
      return { isValid: false, message: 'Para celular, o terceiro dígito deve ser 9' };
    }

    return { isValid: true, message: '' };
  };

  const formatPhoneInput = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length <= 2) {
      return cleaned;
    } else if (cleaned.length <= 7) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    } else if (cleaned.length <= 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    } else {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)}${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
    }
  };

  return {
    validateBrazilianPhone,
    formatPhoneInput
  };
};
