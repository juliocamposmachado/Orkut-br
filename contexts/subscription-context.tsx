'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/enhanced-auth-context';

interface Subscription {
  id: string;
  user_id: string;
  plan_type: string;
  status: string;
  expires_at: string;
  mercado_pago_subscription_id?: string;
  created_at: string;
  updated_at: string;
}

interface SubscriptionContextType {
  hasActiveSubscription: boolean;
  subscription: Subscription | null;
  isLoading: boolean;
  checkSubscriptionStatus: () => Promise<void>;
  createSubscription: (email?: string) => Promise<{ success: boolean; payment_url?: string; error?: string }>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const checkSubscriptionStatus = async () => {
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

  const createSubscription = async (email?: string) => {
    try {
      const response = await fetch('/api/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email || user?.email,
          plan_type: 'pro' 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Atualizar status após criar assinatura
        await checkSubscriptionStatus();
        return { 
          success: true, 
          payment_url: data.payment_url 
        };
      } else {
        return { 
          success: false, 
          error: data.error || 'Erro ao criar assinatura' 
        };
      }
    } catch (error) {
      console.error('Erro ao criar assinatura:', error);
      return { 
        success: false, 
        error: 'Erro interno ao criar assinatura' 
      };
    }
  };

  useEffect(() => {
    checkSubscriptionStatus();
  }, [user]);

  const value = {
    hasActiveSubscription,
    subscription,
    isLoading,
    checkSubscriptionStatus,
    createSubscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
