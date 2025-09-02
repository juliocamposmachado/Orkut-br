'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface RecentSong {
  title: string;
  time: string;
  isCurrent?: boolean;
}

interface RadioData {
  currentSong: string;
  serverStatus: string;
  streamStatus: string;
  listeners: number;
  recentSongs?: RecentSong[];
  lastUpdated: string;
  error?: string;
}

interface RadioContextType {
  radioData: RadioData;
  updateRadioData: (data: RadioData) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const RadioContext = createContext<RadioContextType | undefined>(undefined);

export const useRadio = () => {
  const context = useContext(RadioContext);
  if (context === undefined) {
    throw new Error('useRadio must be used within a RadioProvider');
  }
  return context;
};

interface RadioProviderProps {
  children: ReactNode;
}

export const RadioProvider: React.FC<RadioProviderProps> = ({ children }) => {
  const [radioData, setRadioData] = useState<RadioData>({
    currentSong: 'Carregando...',
    serverStatus: 'Online',
    streamStatus: 'Ao Vivo',
    listeners: 0,
    lastUpdated: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);

  const updateRadioData = (data: RadioData) => {
    setRadioData(data);
  };

  // Fetch radio data from API
  const fetchRadioData = async () => {
    try {
      console.log('🎵 Context: Fetching radio data...');
      const response = await fetch('/api/radio-status', {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('🎵 Context: Data received:', data);
      
      setRadioData(data);
    } catch (error) {
      console.error('❌ Error fetching radio data:', error);
      setRadioData(prev => ({
        ...prev,
        currentSong: 'Rádio Tatuapé FM - Transmissão ao Vivo',
        error: `Erro: ${error instanceof Error ? error.message : 'Desconhecido'}`
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize and set up polling
  useEffect(() => {
    fetchRadioData();
    
    // Update every 90 seconds
    const interval = setInterval(fetchRadioData, 90000);
    
    return () => clearInterval(interval);
  }, []);

  const value: RadioContextType = {
    radioData,
    updateRadioData,
    isLoading,
    setIsLoading
  };

  return (
    <RadioContext.Provider value={value}>
      {children}
    </RadioContext.Provider>
  );
};
