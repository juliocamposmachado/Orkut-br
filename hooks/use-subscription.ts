'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/enhanced-auth-context';

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
        console.error('Erro ao verificar status da assinatura');
        setHasActiveSubscription(false);
        setSubscription(null);
      }
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
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
