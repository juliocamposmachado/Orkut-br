'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/local-auth-context';

interface Subscription {
  id: string;
  user_id: string;
  plan_type: string;
  status: string;
  expires_at: string;
  created_at: string;
}

interface UseSubscriptionReturn {
  hasActiveSubscription: boolean;
  subscription: Subscription | null;
  isLoading: boolean;
  checkSubscription: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const checkSubscription = async () => {
    if (!user) {
      setHasActiveSubscription(false);
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/subscription/status');
      
      if (response.ok) {
        const data = await response.json();
        setHasActiveSubscription(data.hasActiveSubscription);
        setSubscription(data.subscription);
      } else {
        // Silenciar erro se for 401 (não autenticado) ou 500 (tabela não existe)
        if (response.status !== 401 && response.status !== 500) {
          console.error('Erro ao verificar status da assinatura:', response.status);
        }
        setHasActiveSubscription(false);
        setSubscription(null);
      }
    } catch (error) {
      // Silenciar erros de rede comuns
      console.debug('Debug - erro de assinatura:', error);
      setHasActiveSubscription(false);
      setSubscription(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [user]);

  return {
    hasActiveSubscription,
    subscription,
    isLoading,
    checkSubscription
  };
}
