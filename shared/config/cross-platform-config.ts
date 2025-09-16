// Configurações cross-platform para Web, Mobile e Desktop

// Declaração para suporte ao Electron
declare global {
  interface Window {
    electronAPI?: any;
  }
}

export interface PlatformConfig {
  platform: 'web' | 'mobile' | 'desktop';
  supabaseUrl: string;
  supabaseAnonKey: string;
  googleClientId?: string;
  webRTCConfig: RTCConfiguration;
  notifications: NotificationConfig;
}

export interface NotificationConfig {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  badge: boolean;
}

// Configuração base do WebRTC para todas as plataformas
const baseWebRTCConfig: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    // Para produção, adicionar TURN servers
  ],
};

// Configurações específicas por plataforma
export const platformConfigs: Record<string, PlatformConfig> = {
  web: {
    platform: 'web',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    webRTCConfig: {
      ...baseWebRTCConfig,
      bundlePolicy: 'balanced',
      rtcpMuxPolicy: 'require',
    },
    notifications: {
      enabled: true,
      sound: true,
      vibration: false, // Web não suporta vibração
      badge: true,
    },
  },
  
  mobile: {
    platform: 'mobile',
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
    googleClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    webRTCConfig: {
      ...baseWebRTCConfig,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    },
    notifications: {
      enabled: true,
      sound: true,
      vibration: true,
      badge: true,
    },
  },
  
  desktop: {
    platform: 'desktop',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    webRTCConfig: {
      ...baseWebRTCConfig,
      bundlePolicy: 'balanced',
      rtcpMuxPolicy: 'require',
    },
    notifications: {
      enabled: true,
      sound: true,
      vibration: false, // Desktop não suporta vibração
      badge: true,
    },
  },
};

// Detectar plataforma atual
export function detectPlatform(): 'web' | 'mobile' | 'desktop' {
  // Se estamos no Electron
  if (typeof window !== 'undefined' && window.electronAPI) {
    return 'desktop';
  }
  
  // Se estamos no React Native
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    return 'mobile';
  }
  
  // Padrão é web
  return 'web';
}

// Obter configuração da plataforma atual
export function getCurrentPlatformConfig(): PlatformConfig {
  const platform = detectPlatform();
  return platformConfigs[platform];
}

// Configurações específicas de mídia por plataforma
export const mediaConstraints = {
  web: {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 60 },
    },
  },
  
  mobile: {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 30 }, // Menor para economizar bateria
      facingMode: 'user', // Câmera frontal por padrão
    },
  },
  
  desktop: {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: { ideal: 48000 },
    },
    video: {
      width: { ideal: 1920, max: 3840 },
      height: { ideal: 1080, max: 2160 },
      frameRate: { ideal: 60, max: 60 },
    },
  },
};

// URLs de redirecionamento por plataforma
export const redirectUrls = {
  web: {
    login: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
    logout: `${typeof window !== 'undefined' ? window.location.origin : ''}/`,
  },
  mobile: {
    login: 'orkut://auth/callback',
    logout: 'orkut:///',
  },
  desktop: {
    login: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/auth/callback`,
    logout: `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/`,
  },
};

// Funcionalidades disponíveis por plataforma
export const platformFeatures = {
  web: {
    webRTC: true,
    notifications: true,
    fileSystem: false,
    camera: true,
    microphone: true,
    screenShare: true,
    offlineMode: true,
  },
  mobile: {
    webRTC: true,
    notifications: true,
    fileSystem: true,
    camera: true,
    microphone: true,
    screenShare: false, // Limitado no mobile
    offlineMode: true,
  },
  desktop: {
    webRTC: true,
    notifications: true,
    fileSystem: true,
    camera: true,
    microphone: true,
    screenShare: true,
    offlineMode: true,
  },
};
