'use client';

import { SOUND_URLS, checkSoundFile } from './soundAssets';

// Tipos de sons disponíveis
export type SoundType = 
  | 'message' 
  | 'notification' 
  | 'friend_online' 
  | 'friend_offline'
  | 'like'
  | 'comment'
  | 'share'
  | 'sync_success'
  | 'error'
  | 'nudge'
  | 'call_incoming'
  | 'call_end';

// Configurações de sons
interface SoundConfig {
  url?: string;
  volume: number;
  generator?: () => void;
}

// Mapeamento de sons
const SOUND_CONFIG: Record<SoundType, SoundConfig> = {
  message: {
    url: SOUND_URLS.msn_message,
    volume: 0.6,
    generator: generateMSNMessageSound
  },
  notification: {
    url: SOUND_URLS.notification_bell,
    volume: 0.5,
    generator: generateMSNNotificationSound
  },
  friend_online: {
    url: SOUND_URLS.msn_online,
    volume: 0.4,
    generator: generateFriendOnlineSound
  },
  friend_offline: {
    url: SOUND_URLS.msn_offline,
    volume: 0.3,
    generator: generateFriendOfflineSound
  },
  like: {
    volume: 0.4,
    generator: generateLikeSound
  },
  comment: {
    volume: 0.4,
    generator: generateCommentSound
  },
  share: {
    volume: 0.4,
    generator: generateShareSound
  },
  sync_success: {
    volume: 0.5,
    generator: generateSyncSuccessSound
  },
  error: {
    volume: 0.6,
    generator: generateErrorSound
  },
  nudge: {
    url: SOUND_URLS.msn_nudge,
    volume: 0.7,
    generator: generateNudgeSound
  },
  call_incoming: {
    volume: 0.8,
    generator: generateCallSound
  },
  call_end: {
    volume: 0.4,
    generator: generateCallEndSound
  }
};

// Preferências do usuário
interface SoundPreferences {
  enabled: boolean;
  volume: number;
  mutedSounds: SoundType[];
}

class SoundManager {
  private preferences: SoundPreferences;
  private audioContext: AudioContext | null = null;

  constructor() {
    this.preferences = this.loadPreferences();
    if (typeof window !== 'undefined') {
      this.initAudioContext();
    }
  }

  private initAudioContext() {
    if (typeof window === 'undefined') return;
    
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
    } catch (error) {
      console.warn('Web Audio API não disponível:', error);
    }
  }

  private loadPreferences(): SoundPreferences {
    if (typeof window === 'undefined') {
      return {
        enabled: true,
        volume: 0.5,
        mutedSounds: []
      };
    }
    
    try {
      const stored = localStorage.getItem('orkut_sound_preferences');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao carregar preferências de som:', error);
    }

    return {
      enabled: true,
      volume: 0.5,
      mutedSounds: []
    };
  }

  private savePreferences() {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('orkut_sound_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Erro ao salvar preferências de som:', error);
    }
  }

  public async playSound(type: SoundType) {
    if (typeof window === 'undefined') return;
    
    if (!this.preferences.enabled || this.preferences.mutedSounds.includes(type)) {
      return;
    }

    const config = SOUND_CONFIG[type];
    if (!config) {
      console.warn(`Som não configurado: ${type}`);
      return;
    }

    try {
      // Tentar tocar arquivo de áudio primeiro
      if (config.url) {
        await this.playAudioFile(config.url, config.volume);
      } 
      // Fallback para som sintetizado
      else if (config.generator && this.audioContext) {
        config.generator();
      }
    } catch (error) {
      console.error(`Erro ao tocar som ${type}:`, error);
    }
  }

  private async playAudioFile(url: string, volume: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      audio.volume = Math.min(volume * this.preferences.volume, 1);
      
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error('Erro ao reproduzir áudio'));
      
      audio.play().catch(reject);
    });
  }

  // Configurações
  public setEnabled(enabled: boolean) {
    this.preferences.enabled = enabled;
    this.savePreferences();
  }

  public setVolume(volume: number) {
    this.preferences.volume = Math.max(0, Math.min(1, volume));
    this.savePreferences();
  }

  public muteSound(type: SoundType) {
    if (!this.preferences.mutedSounds.includes(type)) {
      this.preferences.mutedSounds.push(type);
      this.savePreferences();
    }
  }

  public unmuteSound(type: SoundType) {
    this.preferences.mutedSounds = this.preferences.mutedSounds.filter(s => s !== type);
    this.savePreferences();
  }

  public getPreferences(): SoundPreferences {
    return { ...this.preferences };
  }
}

// Geradores de som sintetizado (fallback)
function generateMSNMessageSound() {
  createTone([
    { freq: 932, time: 0, duration: 0.1 },
    { freq: 1047, time: 0.1, duration: 0.15 },
    { freq: 1175, time: 0.25, duration: 0.2 }
  ], 0.4);
}

function generateMSNNotificationSound() {
  createTone([
    { freq: 800, time: 0, duration: 0.1 },
    { freq: 600, time: 0.1, duration: 0.1 },
    { freq: 800, time: 0.2, duration: 0.15 }
  ], 0.3);
}

function generateFriendOnlineSound() {
  createTone([
    { freq: 523, time: 0, duration: 0.1 },
    { freq: 659, time: 0.1, duration: 0.1 },
    { freq: 784, time: 0.2, duration: 0.2 }
  ], 0.3);
}

function generateFriendOfflineSound() {
  createTone([
    { freq: 784, time: 0, duration: 0.1 },
    { freq: 659, time: 0.1, duration: 0.1 },
    { freq: 523, time: 0.2, duration: 0.2 }
  ], 0.2);
}

function generateLikeSound() {
  createTone([
    { freq: 1047, time: 0, duration: 0.08 },
    { freq: 1319, time: 0.08, duration: 0.12 }
  ], 0.3);
}

function generateCommentSound() {
  createTone([
    { freq: 698, time: 0, duration: 0.1 },
    { freq: 880, time: 0.1, duration: 0.1 },
    { freq: 1047, time: 0.2, duration: 0.1 }
  ], 0.3);
}

function generateShareSound() {
  createTone([
    { freq: 523, time: 0, duration: 0.05 },
    { freq: 659, time: 0.05, duration: 0.05 },
    { freq: 784, time: 0.1, duration: 0.05 },
    { freq: 1047, time: 0.15, duration: 0.1 }
  ], 0.4);
}

function generateSyncSuccessSound() {
  createTone([
    { freq: 800, time: 0, duration: 0.1 },
    { freq: 1000, time: 0.1, duration: 0.1 },
    { freq: 1200, time: 0.2, duration: 0.15 },
    { freq: 1000, time: 0.35, duration: 0.1 }
  ], 0.4);
}

function generateErrorSound() {
  createTone([
    { freq: 300, time: 0, duration: 0.2 },
    { freq: 250, time: 0.2, duration: 0.3 }
  ], 0.5);
}

function generateNudgeSound() {
  // Som de "cutucada" mais intenso
  createTone([
    { freq: 1000, time: 0, duration: 0.05 },
    { freq: 800, time: 0.05, duration: 0.05 },
    { freq: 1200, time: 0.1, duration: 0.05 },
    { freq: 900, time: 0.15, duration: 0.05 },
    { freq: 1100, time: 0.2, duration: 0.1 }
  ], 0.6);
}

function generateCallSound() {
  // Som de telefone tocando
  const pattern = () => {
    createTone([
      { freq: 440, time: 0, duration: 0.4 },
      { freq: 880, time: 0.4, duration: 0.4 }
    ], 0.5);
  };
  
  pattern();
  setTimeout(pattern, 1000);
  setTimeout(pattern, 2000);
}

function generateCallEndSound() {
  createTone([
    { freq: 800, time: 0, duration: 0.1 },
    { freq: 400, time: 0.1, duration: 0.2 }
  ], 0.3);
}

// Função auxiliar para criar tons
function createTone(notes: Array<{freq: number, time: number, duration: number}>, volume: number) {
  try {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();
    
    notes.forEach(note => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(note.freq, audioContext.currentTime + note.time);
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + note.time);
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + note.time + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + note.time + note.duration);
      
      oscillator.start(audioContext.currentTime + note.time);
      oscillator.stop(audioContext.currentTime + note.time + note.duration);
    });
  } catch (error) {
    console.warn('Erro ao criar tom:', error);
  }
}

// Instância singleton do gerenciador de som
export const soundManager = new SoundManager();

// Hook para usar o gerenciador de som
export const useSounds = () => {
  const playSound = (type: SoundType) => {
    soundManager.playSound(type);
  };

  const getPreferences = () => {
    return soundManager.getPreferences();
  };

  const setEnabled = (enabled: boolean) => {
    soundManager.setEnabled(enabled);
  };

  const setVolume = (volume: number) => {
    soundManager.setVolume(volume);
  };

  const muteSound = (type: SoundType) => {
    soundManager.muteSound(type);
  };

  const unmuteSound = (type: SoundType) => {
    soundManager.unmuteSound(type);
  };

  return {
    playSound,
    getPreferences,
    setEnabled,
    setVolume,
    muteSound,
    unmuteSound
  };
};
